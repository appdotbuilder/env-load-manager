import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type BulkUploadInput, type BulkUploadResponse } from '../schema';

export const bulkUploadLocations = async (input: BulkUploadInput): Promise<BulkUploadResponse> => {
  try {
    const errors: string[] = [];
    let createdCount = 0;

    // Process locations in a transaction for consistency
    await db.transaction(async (trx) => {
      for (let i = 0; i < input.locations.length; i++) {
        const location = input.locations[i];
        
        try {
          // Insert location record with proper numeric conversions
          await trx.insert(locationsTable)
            .values({
              name: location.name,
              address: location.address,
              latitude: location.latitude.toString(), // Convert number to string for numeric column
              longitude: location.longitude.toString(), // Convert number to string for numeric column
              snow_load: location.snow_load, // Real column - no conversion needed
              wind_speed: location.wind_speed, // Real column - no conversion needed
              seismic_load: location.seismic_load // Real column - no conversion needed
            })
            .execute();

          createdCount++;
        } catch (error) {
          // Add specific error for this location
          const errorMessage = `Row ${i + 1} (${location.name}): ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMessage);
        }
      }
    });

    return {
      success: createdCount > 0,
      created_count: createdCount,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    console.error('Bulk upload locations failed:', error);
    throw error;
  }
};