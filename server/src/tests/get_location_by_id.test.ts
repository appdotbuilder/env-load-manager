import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type GetLocationInput } from '../schema';
import { getLocationById } from '../handlers/get_location_by_id';

// Test input for creating a location
const testLocationData = {
  name: 'Test Location',
  address: '123 Test Street',
  latitude: 40.7128,
  longitude: -74.0060,
  snow_load: 1.5,
  wind_speed: 25.0,
  seismic_load: 0.8
};

describe('getLocationById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a location when found', async () => {
    // First create a test location
    const insertResult = await db.insert(locationsTable)
      .values({
        name: testLocationData.name,
        address: testLocationData.address,
        latitude: testLocationData.latitude.toString(), // Convert to string for numeric column
        longitude: testLocationData.longitude.toString(), // Convert to string for numeric column
        snow_load: testLocationData.snow_load,
        wind_speed: testLocationData.wind_speed,
        seismic_load: testLocationData.seismic_load
      })
      .returning()
      .execute();

    const createdLocation = insertResult[0];

    // Now test the handler
    const input: GetLocationInput = {
      id: createdLocation.id
    };

    const result = await getLocationById(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdLocation.id);
    expect(result!.name).toEqual('Test Location');
    expect(result!.address).toEqual('123 Test Street');
    expect(result!.latitude).toEqual(40.7128);
    expect(result!.longitude).toEqual(-74.0060);
    expect(result!.snow_load).toEqual(1.5);
    expect(result!.wind_speed).toEqual(25.0);
    expect(result!.seismic_load).toEqual(0.8);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify numeric types are correct
    expect(typeof result!.latitude).toBe('number');
    expect(typeof result!.longitude).toBe('number');
  });

  it('should return null when location not found', async () => {
    const input: GetLocationInput = {
      id: 99999 // Non-existent ID
    };

    const result = await getLocationById(input);

    expect(result).toBeNull();
  });

  it('should handle location with null address', async () => {
    // Create location with null address
    const insertResult = await db.insert(locationsTable)
      .values({
        name: 'Location Without Address',
        address: null,
        latitude: testLocationData.latitude.toString(),
        longitude: testLocationData.longitude.toString(),
        snow_load: testLocationData.snow_load,
        wind_speed: testLocationData.wind_speed,
        seismic_load: testLocationData.seismic_load
      })
      .returning()
      .execute();

    const createdLocation = insertResult[0];

    const input: GetLocationInput = {
      id: createdLocation.id
    };

    const result = await getLocationById(input);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Location Without Address');
    expect(result!.address).toBeNull();
    expect(result!.latitude).toEqual(40.7128);
    expect(result!.longitude).toEqual(-74.0060);
  });

  it('should handle extreme coordinate values correctly', async () => {
    // Test with extreme but valid coordinates
    const extremeData = {
      name: 'Extreme Location',
      address: 'North Pole',
      latitude: 89.9999, // Near North Pole
      longitude: -179.9999, // Near International Date Line
      snow_load: 5.0,
      wind_speed: 50.0,
      seismic_load: 2.5
    };

    const insertResult = await db.insert(locationsTable)
      .values({
        name: extremeData.name,
        address: extremeData.address,
        latitude: extremeData.latitude.toString(),
        longitude: extremeData.longitude.toString(),
        snow_load: extremeData.snow_load,
        wind_speed: extremeData.wind_speed,
        seismic_load: extremeData.seismic_load
      })
      .returning()
      .execute();

    const createdLocation = insertResult[0];

    const input: GetLocationInput = {
      id: createdLocation.id
    };

    const result = await getLocationById(input);

    expect(result).not.toBeNull();
    expect(result!.latitude).toEqual(89.9999);
    expect(result!.longitude).toEqual(-179.9999);
    expect(typeof result!.latitude).toBe('number');
    expect(typeof result!.longitude).toBe('number');
  });

  it('should handle zero load values correctly', async () => {
    // Test with zero environmental loads
    const zeroLoadData = {
      name: 'Zero Load Location',
      address: 'Calm Zone',
      latitude: 0.0, // Equator
      longitude: 0.0, // Prime Meridian
      snow_load: 0.0,
      wind_speed: 0.0,
      seismic_load: 0.0
    };

    const insertResult = await db.insert(locationsTable)
      .values({
        name: zeroLoadData.name,
        address: zeroLoadData.address,
        latitude: zeroLoadData.latitude.toString(),
        longitude: zeroLoadData.longitude.toString(),
        snow_load: zeroLoadData.snow_load,
        wind_speed: zeroLoadData.wind_speed,
        seismic_load: zeroLoadData.seismic_load
      })
      .returning()
      .execute();

    const createdLocation = insertResult[0];

    const input: GetLocationInput = {
      id: createdLocation.id
    };

    const result = await getLocationById(input);

    expect(result).not.toBeNull();
    expect(result!.latitude).toEqual(0.0);
    expect(result!.longitude).toEqual(0.0);
    expect(result!.snow_load).toEqual(0.0);
    expect(result!.wind_speed).toEqual(0.0);
    expect(result!.seismic_load).toEqual(0.0);
  });
});