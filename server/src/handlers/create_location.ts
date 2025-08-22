import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type CreateLocationInput, type Location } from '../schema';

export const createLocation = async (input: CreateLocationInput): Promise<Location> => {
  try {
    // Insert location record
    const result = await db.insert(locationsTable)
      .values({
        name: input.name,
        address: input.address,
        latitude: input.latitude.toString(), // Convert number to string for numeric column
        longitude: input.longitude.toString(), // Convert number to string for numeric column
        snow_load: input.snow_load, // Real column - no conversion needed
        wind_speed: input.wind_speed, // Real column - no conversion needed
        seismic_load: input.seismic_load // Real column - no conversion needed
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const location = result[0];
    return {
      ...location,
      latitude: parseFloat(location.latitude), // Convert string back to number
      longitude: parseFloat(location.longitude) // Convert string back to number
    };
  } catch (error) {
    console.error('Location creation failed:', error);
    throw error;
  }
};