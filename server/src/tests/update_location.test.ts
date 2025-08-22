import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type UpdateLocationInput, type CreateLocationInput } from '../schema';
import { updateLocation } from '../handlers/update_location';
import { eq } from 'drizzle-orm';

// Test data
const baseLocationData: CreateLocationInput = {
  name: 'Test Location',
  address: '123 Test St',
  latitude: 40.7128,
  longitude: -74.0060,
  snow_load: 1.5,
  wind_speed: 25.0,
  seismic_load: 0.8
};

describe('updateLocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test location
  const createTestLocation = async () => {
    const result = await db.insert(locationsTable)
      .values({
        name: baseLocationData.name,
        address: baseLocationData.address,
        latitude: baseLocationData.latitude.toString(),
        longitude: baseLocationData.longitude.toString(),
        snow_load: baseLocationData.snow_load,
        wind_speed: baseLocationData.wind_speed,
        seismic_load: baseLocationData.seismic_load
      })
      .returning()
      .execute();

    return result[0];
  };

  it('should update location name only', async () => {
    const createdLocation = await createTestLocation();
    
    const updateInput: UpdateLocationInput = {
      id: createdLocation.id,
      name: 'Updated Location Name'
    };

    const result = await updateLocation(updateInput);

    expect(result.id).toEqual(createdLocation.id);
    expect(result.name).toEqual('Updated Location Name');
    expect(result.address).toEqual(baseLocationData.address);
    expect(result.latitude).toEqual(baseLocationData.latitude);
    expect(result.longitude).toEqual(baseLocationData.longitude);
    expect(result.snow_load).toEqual(baseLocationData.snow_load);
    expect(result.wind_speed).toEqual(baseLocationData.wind_speed);
    expect(result.seismic_load).toEqual(baseLocationData.seismic_load);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > result.created_at).toBe(true);
  });

  it('should update all location fields', async () => {
    const createdLocation = await createTestLocation();
    
    const updateInput: UpdateLocationInput = {
      id: createdLocation.id,
      name: 'Completely Updated Location',
      address: '456 New Address Blvd',
      latitude: 34.0522,
      longitude: -118.2437,
      snow_load: 2.5,
      wind_speed: 35.0,
      seismic_load: 1.2
    };

    const result = await updateLocation(updateInput);

    expect(result.id).toEqual(createdLocation.id);
    expect(result.name).toEqual('Completely Updated Location');
    expect(result.address).toEqual('456 New Address Blvd');
    expect(result.latitude).toEqual(34.0522);
    expect(result.longitude).toEqual(-118.2437);
    expect(result.snow_load).toEqual(2.5);
    expect(result.wind_speed).toEqual(35.0);
    expect(result.seismic_load).toEqual(1.2);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(typeof result.latitude).toBe('number');
    expect(typeof result.longitude).toBe('number');
  });

  it('should set address to null', async () => {
    const createdLocation = await createTestLocation();
    
    const updateInput: UpdateLocationInput = {
      id: createdLocation.id,
      address: null
    };

    const result = await updateLocation(updateInput);

    expect(result.id).toEqual(createdLocation.id);
    expect(result.address).toBeNull();
    expect(result.name).toEqual(baseLocationData.name); // Other fields unchanged
  });

  it('should update environmental load values', async () => {
    const createdLocation = await createTestLocation();
    
    const updateInput: UpdateLocationInput = {
      id: createdLocation.id,
      snow_load: 3.0,
      wind_speed: 40.5,
      seismic_load: 1.8
    };

    const result = await updateLocation(updateInput);

    expect(result.snow_load).toEqual(3.0);
    expect(result.wind_speed).toEqual(40.5);
    expect(result.seismic_load).toEqual(1.8);
    expect(result.name).toEqual(baseLocationData.name); // Other fields unchanged
    expect(result.latitude).toEqual(baseLocationData.latitude);
    expect(result.longitude).toEqual(baseLocationData.longitude);
  });

  it('should update coordinates with high precision', async () => {
    const createdLocation = await createTestLocation();
    
    const updateInput: UpdateLocationInput = {
      id: createdLocation.id,
      latitude: 40.7127837,
      longitude: -74.0059413
    };

    const result = await updateLocation(updateInput);

    expect(result.latitude).toEqual(40.7127837);
    expect(result.longitude).toEqual(-74.0059413);
    expect(typeof result.latitude).toBe('number');
    expect(typeof result.longitude).toBe('number');
  });

  it('should save updated location to database', async () => {
    const createdLocation = await createTestLocation();
    
    const updateInput: UpdateLocationInput = {
      id: createdLocation.id,
      name: 'Database Test Location',
      latitude: 51.5074,
      longitude: -0.1278
    };

    const result = await updateLocation(updateInput);

    // Verify in database
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, result.id))
      .execute();

    expect(locations).toHaveLength(1);
    expect(locations[0].name).toEqual('Database Test Location');
    expect(parseFloat(locations[0].latitude)).toEqual(51.5074);
    expect(parseFloat(locations[0].longitude)).toEqual(-0.1278);
    expect(locations[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent location', async () => {
    const updateInput: UpdateLocationInput = {
      id: 99999,
      name: 'Non-existent Location'
    };

    expect(updateLocation(updateInput)).rejects.toThrow(/location with id 99999 not found/i);
  });

  it('should handle boundary coordinate values', async () => {
    const createdLocation = await createTestLocation();
    
    const updateInput: UpdateLocationInput = {
      id: createdLocation.id,
      latitude: 90.0, // North pole
      longitude: 180.0 // International date line
    };

    const result = await updateLocation(updateInput);

    expect(result.latitude).toEqual(90.0);
    expect(result.longitude).toEqual(180.0);
  });

  it('should handle zero environmental load values', async () => {
    const createdLocation = await createTestLocation();
    
    const updateInput: UpdateLocationInput = {
      id: createdLocation.id,
      snow_load: 0.0,
      wind_speed: 0.0,
      seismic_load: 0.0
    };

    const result = await updateLocation(updateInput);

    expect(result.snow_load).toEqual(0.0);
    expect(result.wind_speed).toEqual(0.0);
    expect(result.seismic_load).toEqual(0.0);
  });

  it('should update timestamp correctly', async () => {
    const createdLocation = await createTestLocation();
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdateLocationInput = {
      id: createdLocation.id,
      name: 'Timestamp Test Location'
    };

    const result = await updateLocation(updateInput);

    expect(result.updated_at > createdLocation.created_at).toBe(true);
    expect(result.created_at).toEqual(createdLocation.created_at); // Created timestamp should not change
  });
});