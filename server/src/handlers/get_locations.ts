import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type Location } from '../schema';
import { desc } from 'drizzle-orm';

export const getLocations = async (): Promise<Location[]> => {
  try {
    // Fetch all locations ordered by most recently created first
    const results = await db.select()
      .from(locationsTable)
      .orderBy(desc(locationsTable.created_at))
      .execute();

    // Convert numeric fields (latitude, longitude) from string back to numbers
    return results.map(location => ({
      ...location,
      latitude: parseFloat(location.latitude), // Convert numeric column to number
      longitude: parseFloat(location.longitude) // Convert numeric column to number
    }));
  } catch (error) {
    console.error('Failed to fetch locations:', error);
    throw error;
  }
};