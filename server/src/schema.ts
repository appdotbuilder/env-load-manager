import { z } from 'zod';

// Location schema for environmental load data
export const locationSchema = z.object({
  id: z.number(),
  name: z.string(),
  address: z.string().nullable(), // Can be null if coordinates are provided directly
  latitude: z.number(), // Decimal degrees
  longitude: z.number(), // Decimal degrees
  snow_load: z.number(), // kN/m² or appropriate unit
  wind_speed: z.number(), // m/s or appropriate unit
  seismic_load: z.number(), // Appropriate seismic measurement unit
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Location = z.infer<typeof locationSchema>;

// Input schema for creating locations
export const createLocationInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().nullable(), // Optional address if coordinates provided
  latitude: z.number().min(-90).max(90), // Valid latitude range
  longitude: z.number().min(-180).max(180), // Valid longitude range
  snow_load: z.number().nonnegative(), // Non-negative load values
  wind_speed: z.number().nonnegative(),
  seismic_load: z.number().nonnegative()
});

export type CreateLocationInput = z.infer<typeof createLocationInputSchema>;

// Input schema for updating locations
export const updateLocationInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").optional(),
  address: z.string().nullable().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  snow_load: z.number().nonnegative().optional(),
  wind_speed: z.number().nonnegative().optional(),
  seismic_load: z.number().nonnegative().optional()
});

export type UpdateLocationInput = z.infer<typeof updateLocationInputSchema>;

// Schema for CSV upload data
export const csvLocationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  snow_load: z.number().nonnegative(),
  wind_speed: z.number().nonnegative(),
  seismic_load: z.number().nonnegative()
});

export type CsvLocation = z.infer<typeof csvLocationSchema>;

// Input schema for bulk CSV upload
export const bulkUploadInputSchema = z.object({
  locations: z.array(csvLocationSchema).min(1, "At least one location is required")
});

export type BulkUploadInput = z.infer<typeof bulkUploadInputSchema>;

// Schema for location deletion
export const deleteLocationInputSchema = z.object({
  id: z.number()
});

export type DeleteLocationInput = z.infer<typeof deleteLocationInputSchema>;

// Schema for getting location by ID
export const getLocationInputSchema = z.object({
  id: z.number()
});

export type GetLocationInput = z.infer<typeof getLocationInputSchema>;

// Response schema for bulk operations
export const bulkUploadResponseSchema = z.object({
  success: z.boolean(),
  created_count: z.number(),
  errors: z.array(z.string()).optional()
});

export type BulkUploadResponse = z.infer<typeof bulkUploadResponseSchema>;