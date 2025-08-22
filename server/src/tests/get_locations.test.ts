import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type Location } from '../schema';
import { getLocations } from '../handlers/get_locations';

// Test location data - includes all required fields
const testLocation1 = {
  name: 'Downtown Office',
  address: '123 Main St, City, State',
  latitude: 40.7589,
  longitude: -73.9851,
  snow_load: 2.5,
  wind_speed: 35.0,
  seismic_load: 0.8
};

const testLocation2 = {
  name: 'Remote Site A',
  address: null,
  latitude: 45.5152,
  longitude: -122.6784,
  snow_load: 4.2,
  wind_speed: 28.5,
  seismic_load: 1.2
};

const testLocation3 = {
  name: 'Warehouse B',
  address: '456 Industrial Ave, City, State',
  latitude: 34.0522,
  longitude: -118.2437,
  snow_load: 1.0,
  wind_speed: 42.3,
  seismic_load: 2.1
};

describe('getLocations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no locations exist', async () => {
    const result = await getLocations();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all locations with correct data types', async () => {
    // Insert test locations
    await db.insert(locationsTable)
      .values([
        {
          ...testLocation1,
          latitude: testLocation1.latitude.toString(),
          longitude: testLocation1.longitude.toString()
        },
        {
          ...testLocation2,
          latitude: testLocation2.latitude.toString(),
          longitude: testLocation2.longitude.toString()
        }
      ])
      .execute();

    const result = await getLocations();

    expect(result).toHaveLength(2);
    
    // Verify first location
    const location1 = result.find(loc => loc.name === 'Downtown Office');
    expect(location1).toBeDefined();
    expect(location1!.name).toEqual('Downtown Office');
    expect(location1!.address).toEqual('123 Main St, City, State');
    expect(typeof location1!.latitude).toBe('number');
    expect(typeof location1!.longitude).toBe('number');
    expect(location1!.latitude).toEqual(40.7589);
    expect(location1!.longitude).toEqual(-73.9851);
    expect(location1!.snow_load).toEqual(2.5);
    expect(location1!.wind_speed).toEqual(35.0);
    expect(location1!.seismic_load).toEqual(0.8);
    expect(location1!.id).toBeDefined();
    expect(location1!.created_at).toBeInstanceOf(Date);
    expect(location1!.updated_at).toBeInstanceOf(Date);

    // Verify second location with null address
    const location2 = result.find(loc => loc.name === 'Remote Site A');
    expect(location2).toBeDefined();
    expect(location2!.address).toBeNull();
    expect(typeof location2!.latitude).toBe('number');
    expect(typeof location2!.longitude).toBe('number');
    expect(location2!.latitude).toEqual(45.5152);
    expect(location2!.longitude).toEqual(-122.6784);
  });

  it('should return locations ordered by creation date (newest first)', async () => {
    // Insert locations with different creation times
    const firstLocation = await db.insert(locationsTable)
      .values({
        ...testLocation1,
        latitude: testLocation1.latitude.toString(),
        longitude: testLocation1.longitude.toString()
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondLocation = await db.insert(locationsTable)
      .values({
        ...testLocation2,
        latitude: testLocation2.latitude.toString(),
        longitude: testLocation2.longitude.toString()
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps  
    await new Promise(resolve => setTimeout(resolve, 10));

    const thirdLocation = await db.insert(locationsTable)
      .values({
        ...testLocation3,
        latitude: testLocation3.latitude.toString(),
        longitude: testLocation3.longitude.toString()
      })
      .returning()
      .execute();

    const result = await getLocations();

    expect(result).toHaveLength(3);
    
    // Verify ordering - newest first
    expect(result[0].name).toEqual('Warehouse B'); // Last created
    expect(result[1].name).toEqual('Remote Site A'); // Second created
    expect(result[2].name).toEqual('Downtown Office'); // First created
    
    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle locations with extreme coordinate values', async () => {
    // Test with boundary values for coordinates
    const extremeLocation = {
      name: 'Extreme Location',
      address: 'North Pole Research Station',
      latitude: 90.0, // Maximum latitude
      longitude: -180.0, // Minimum longitude
      snow_load: 10.5,
      wind_speed: 80.0,
      seismic_load: 0.1
    };

    await db.insert(locationsTable)
      .values({
        ...extremeLocation,
        latitude: extremeLocation.latitude.toString(),
        longitude: extremeLocation.longitude.toString()
      })
      .execute();

    const result = await getLocations();

    expect(result).toHaveLength(1);
    expect(result[0].latitude).toEqual(90.0);
    expect(result[0].longitude).toEqual(-180.0);
    expect(typeof result[0].latitude).toBe('number');
    expect(typeof result[0].longitude).toBe('number');
  });

  it('should handle locations with zero environmental loads', async () => {
    // Test with zero values for environmental loads
    const zeroLoadLocation = {
      name: 'Zero Load Site',
      address: 'Calm Area',
      latitude: 0.0,
      longitude: 0.0,
      snow_load: 0.0,
      wind_speed: 0.0,
      seismic_load: 0.0
    };

    await db.insert(locationsTable)
      .values({
        ...zeroLoadLocation,
        latitude: zeroLoadLocation.latitude.toString(),
        longitude: zeroLoadLocation.longitude.toString()
      })
      .execute();

    const result = await getLocations();

    expect(result).toHaveLength(1);
    expect(result[0].snow_load).toEqual(0.0);
    expect(result[0].wind_speed).toEqual(0.0);
    expect(result[0].seismic_load).toEqual(0.0);
    expect(result[0].latitude).toEqual(0.0);
    expect(result[0].longitude).toEqual(0.0);
  });

  it('should preserve precision in coordinate values', async () => {
    // Test with high precision coordinates
    const preciseLocation = {
      name: 'Precise Location',
      address: 'Survey Point Alpha',
      latitude: 40.7589123, // 7 decimal places
      longitude: -73.9851456, // 7 decimal places
      snow_load: 2.75,
      wind_speed: 35.25,
      seismic_load: 0.95
    };

    await db.insert(locationsTable)
      .values({
        ...preciseLocation,
        latitude: preciseLocation.latitude.toString(),
        longitude: preciseLocation.longitude.toString()
      })
      .execute();

    const result = await getLocations();

    expect(result).toHaveLength(1);
    // Should preserve precision up to database limits
    expect(result[0].latitude).toBeCloseTo(40.7589123, 6);
    expect(result[0].longitude).toBeCloseTo(-73.9851456, 6);
  });
});