import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type CreateLocationInput } from '../schema';
import { createLocation } from '../handlers/create_location';
import { eq, gte, between, and } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateLocationInput = {
  name: 'Test Location',
  address: '123 Test Street, Test City, TS 12345',
  latitude: 45.5236,
  longitude: -122.6750,
  snow_load: 2.5,
  wind_speed: 25.0,
  seismic_load: 0.8
};

// Test input without optional address
const testInputWithoutAddress: CreateLocationInput = {
  name: 'Coordinates Only Location',
  address: null,
  latitude: 37.7749,
  longitude: -122.4194,
  snow_load: 1.2,
  wind_speed: 15.5,
  seismic_load: 1.5
};

describe('createLocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a location with all fields', async () => {
    const result = await createLocation(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Location');
    expect(result.address).toEqual('123 Test Street, Test City, TS 12345');
    expect(result.latitude).toEqual(45.5236);
    expect(result.longitude).toEqual(-122.6750);
    expect(result.snow_load).toEqual(2.5);
    expect(result.wind_speed).toEqual(25.0);
    expect(result.seismic_load).toEqual(0.8);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify numeric types are correct
    expect(typeof result.latitude).toBe('number');
    expect(typeof result.longitude).toBe('number');
    expect(typeof result.snow_load).toBe('number');
    expect(typeof result.wind_speed).toBe('number');
    expect(typeof result.seismic_load).toBe('number');
  });

  it('should create a location without address', async () => {
    const result = await createLocation(testInputWithoutAddress);

    expect(result.name).toEqual('Coordinates Only Location');
    expect(result.address).toBeNull();
    expect(result.latitude).toEqual(37.7749);
    expect(result.longitude).toEqual(-122.4194);
    expect(result.snow_load).toEqual(1.2);
    expect(result.wind_speed).toEqual(15.5);
    expect(result.seismic_load).toEqual(1.5);
    expect(result.id).toBeDefined();
  });

  it('should save location to database correctly', async () => {
    const result = await createLocation(testInput);

    // Query using proper drizzle syntax
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, result.id))
      .execute();

    expect(locations).toHaveLength(1);
    const savedLocation = locations[0];

    expect(savedLocation.name).toEqual('Test Location');
    expect(savedLocation.address).toEqual('123 Test Street, Test City, TS 12345');
    // Verify numeric columns are stored correctly and can be parsed back
    expect(parseFloat(savedLocation.latitude)).toEqual(45.5236);
    expect(parseFloat(savedLocation.longitude)).toEqual(-122.6750);
    expect(savedLocation.snow_load).toEqual(2.5);
    expect(savedLocation.wind_speed).toEqual(25.0);
    expect(savedLocation.seismic_load).toEqual(0.8);
    expect(savedLocation.created_at).toBeInstanceOf(Date);
    expect(savedLocation.updated_at).toBeInstanceOf(Date);
  });

  it('should handle precise coordinate values', async () => {
    const preciseInput: CreateLocationInput = {
      name: 'Precise Location',
      address: null,
      latitude: 45.1234567, // High precision
      longitude: -122.9876543, // High precision
      snow_load: 3.14159,
      wind_speed: 42.123,
      seismic_load: 2.71828
    };

    const result = await createLocation(preciseInput);

    // Verify precision is maintained
    expect(result.latitude).toBeCloseTo(45.1234567, 6);
    expect(result.longitude).toBeCloseTo(-122.9876543, 6);
    expect(result.snow_load).toBeCloseTo(3.14159, 5);
    expect(result.wind_speed).toBeCloseTo(42.123, 3);
    expect(result.seismic_load).toBeCloseTo(2.71828, 5);
  });

  it('should query locations by date range correctly', async () => {
    // Create test location
    await createLocation(testInput);

    // Test date filtering - demonstration of correct date handling
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Proper query building - apply where clause directly
    const locations = await db.select()
      .from(locationsTable)
      .where(
        and(
          gte(locationsTable.created_at, yesterday),
          between(locationsTable.created_at, yesterday, tomorrow)
        )
      )
      .execute();

    expect(locations.length).toBeGreaterThan(0);
    locations.forEach(location => {
      expect(location.created_at).toBeInstanceOf(Date);
      expect(location.created_at >= yesterday).toBe(true);
      expect(location.created_at <= tomorrow).toBe(true);
    });
  });

  it('should handle boundary coordinate values', async () => {
    const boundaryInput: CreateLocationInput = {
      name: 'Boundary Location',
      address: null,
      latitude: 90.0, // Maximum latitude
      longitude: -180.0, // Minimum longitude
      snow_load: 0.0, // Minimum load values
      wind_speed: 0.0,
      seismic_load: 0.0
    };

    const result = await createLocation(boundaryInput);

    expect(result.latitude).toEqual(90.0);
    expect(result.longitude).toEqual(-180.0);
    expect(result.snow_load).toEqual(0.0);
    expect(result.wind_speed).toEqual(0.0);
    expect(result.seismic_load).toEqual(0.0);
  });

  it('should create multiple locations with unique IDs', async () => {
    const location1 = await createLocation(testInput);
    const location2 = await createLocation(testInputWithoutAddress);

    expect(location1.id).not.toEqual(location2.id);
    expect(location1.name).toEqual('Test Location');
    expect(location2.name).toEqual('Coordinates Only Location');

    // Verify both are saved in database
    const allLocations = await db.select()
      .from(locationsTable)
      .execute();

    expect(allLocations).toHaveLength(2);
  });
});