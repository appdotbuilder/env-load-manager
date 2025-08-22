import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type GetLocationInput, type Location } from '../schema';
import { eq } from 'drizzle-orm';

export const getLocationById = async (input: GetLocationInput): Promise<Location | null> => {
  try {
    // Query the location by ID
    const results = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, input.id))
      .limit(1)
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers
    const location = results[0];
    return {
      ...location,
      latitude: parseFloat(location.latitude), // Convert string back to number
      longitude: parseFloat(location.longitude) // Convert string back to number
    };
  } catch (error) {
    console.error('Get location by ID failed:', error);
    throw error;
  }
};