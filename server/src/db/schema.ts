import { serial, text, pgTable, timestamp, real, numeric } from 'drizzle-orm/pg-core';

export const locationsTable = pgTable('locations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address'), // Nullable by default, matches Zod schema
  latitude: numeric('latitude', { precision: 10, scale: 7 }).notNull(), // High precision for coordinates
  longitude: numeric('longitude', { precision: 10, scale: 7 }).notNull(), // High precision for coordinates
  snow_load: real('snow_load').notNull(), // Use real for environmental load values
  wind_speed: real('wind_speed').notNull(), // Use real for environmental measurements
  seismic_load: real('seismic_load').notNull(), // Use real for seismic measurements
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Location = typeof locationsTable.$inferSelect; // For SELECT operations
export type NewLocation = typeof locationsTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { locations: locationsTable };