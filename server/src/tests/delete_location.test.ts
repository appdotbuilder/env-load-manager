import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type DeleteLocationInput, type CreateLocationInput } from '../schema';
import { deleteLocation } from '../handlers/delete_location';
import { eq } from 'drizzle-orm';

// Test data for creating prerequisite location
const testLocationInput: CreateLocationInput = {
  name: 'Test Location',
  address: '123 Test Street',
  latitude: 40.7128,
  longitude: -74.0060,
  snow_load: 1.5,
  wind_speed: 25.0,
  seismic_load: 0.8
};

describe('deleteLocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing location', async () => {
    // Create a test location first
    const createResult = await db.insert(locationsTable)
      .values({
        name: testLocationInput.name,
        address: testLocationInput.address,
        latitude: testLocationInput.latitude.toString(),
        longitude: testLocationInput.longitude.toString(),
        snow_load: testLocationInput.snow_load,
        wind_speed: testLocationInput.wind_speed,
        seismic_load: testLocationInput.seismic_load
      })
      .returning()
      .execute();

    const createdLocation = createResult[0];
    const deleteInput: DeleteLocationInput = { id: createdLocation.id };

    // Delete the location
    const result = await deleteLocation(deleteInput);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify location no longer exists in database
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, createdLocation.id))
      .execute();

    expect(locations).toHaveLength(0);
  });

  it('should return success false for non-existent location', async () => {
    // Try to delete a location with an ID that doesn't exist
    const deleteInput: DeleteLocationInput = { id: 999999 };

    const result = await deleteLocation(deleteInput);

    // Should return success: false since no location was deleted
    expect(result.success).toBe(false);
  });

  it('should not affect other locations when deleting one', async () => {
    // Create two test locations
    const location1Result = await db.insert(locationsTable)
      .values({
        name: 'Location 1',
        address: '123 First Street',
        latitude: testLocationInput.latitude.toString(),
        longitude: testLocationInput.longitude.toString(),
        snow_load: testLocationInput.snow_load,
        wind_speed: testLocationInput.wind_speed,
        seismic_load: testLocationInput.seismic_load
      })
      .returning()
      .execute();

    const location2Result = await db.insert(locationsTable)
      .values({
        name: 'Location 2',
        address: '456 Second Street',
        latitude: (testLocationInput.latitude + 1).toString(),
        longitude: (testLocationInput.longitude + 1).toString(),
        snow_load: testLocationInput.snow_load + 0.5,
        wind_speed: testLocationInput.wind_speed + 5,
        seismic_load: testLocationInput.seismic_load + 0.2
      })
      .returning()
      .execute();

    const location1 = location1Result[0];
    const location2 = location2Result[0];

    // Delete only the first location
    const deleteInput: DeleteLocationInput = { id: location1.id };
    const result = await deleteLocation(deleteInput);

    expect(result.success).toBe(true);

    // Verify first location is deleted
    const deletedLocations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, location1.id))
      .execute();
    expect(deletedLocations).toHaveLength(0);

    // Verify second location still exists
    const remainingLocations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, location2.id))
      .execute();
    expect(remainingLocations).toHaveLength(1);
    expect(remainingLocations[0].name).toEqual('Location 2');
  });

  it('should handle multiple delete attempts on same location', async () => {
    // Create a test location
    const createResult = await db.insert(locationsTable)
      .values({
        name: testLocationInput.name,
        address: testLocationInput.address,
        latitude: testLocationInput.latitude.toString(),
        longitude: testLocationInput.longitude.toString(),
        snow_load: testLocationInput.snow_load,
        wind_speed: testLocationInput.wind_speed,
        seismic_load: testLocationInput.seismic_load
      })
      .returning()
      .execute();

    const createdLocation = createResult[0];
    const deleteInput: DeleteLocationInput = { id: createdLocation.id };

    // First deletion should succeed
    const firstResult = await deleteLocation(deleteInput);
    expect(firstResult.success).toBe(true);

    // Second deletion should return success: false (no rows affected)
    const secondResult = await deleteLocation(deleteInput);
    expect(secondResult.success).toBe(false);
  });
});