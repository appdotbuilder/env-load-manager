import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type UpdateLocationInput, type Location } from '../schema';
import { eq } from 'drizzle-orm';

export const updateLocation = async (input: UpdateLocationInput): Promise<Location> => {
  try {
    // Build the update object with only provided fields
    const updateData: Partial<typeof locationsTable.$inferInsert> = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.address !== undefined) {
      updateData.address = input.address;
    }
    if (input.latitude !== undefined) {
      updateData.latitude = input.latitude.toString(); // Convert number to string for numeric column
    }
    if (input.longitude !== undefined) {
      updateData.longitude = input.longitude.toString(); // Convert number to string for numeric column
    }
    if (input.snow_load !== undefined) {
      updateData.snow_load = input.snow_load; // real column - no conversion needed
    }
    if (input.wind_speed !== undefined) {
      updateData.wind_speed = input.wind_speed; // real column - no conversion needed
    }
    if (input.seismic_load !== undefined) {
      updateData.seismic_load = input.seismic_load; // real column - no conversion needed
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the location
    const result = await db.update(locationsTable)
      .set(updateData)
      .where(eq(locationsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Location with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const location = result[0];
    return {
      ...location,
      latitude: parseFloat(location.latitude), // Convert string back to number
      longitude: parseFloat(location.longitude) // Convert string back to number
    };
  } catch (error) {
    console.error('Location update failed:', error);
    throw error;
  }
};