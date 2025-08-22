import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type DeleteLocationInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteLocation = async (input: DeleteLocationInput): Promise<{ success: boolean }> => {
  try {
    // Delete location record by ID
    const result = await db.delete(locationsTable)
      .where(eq(locationsTable.id, input.id))
      .returning()
      .execute();

    // Return success status based on whether any rows were deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Location deletion failed:', error);
    throw error;
  }
};