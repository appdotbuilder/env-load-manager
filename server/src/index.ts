import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schema types
import { 
  createLocationInputSchema, 
  updateLocationInputSchema,
  deleteLocationInputSchema,
  getLocationInputSchema,
  bulkUploadInputSchema
} from './schema';

// Import handlers
import { createLocation } from './handlers/create_location';
import { getLocations } from './handlers/get_locations';
import { getLocationById } from './handlers/get_location_by_id';
import { updateLocation } from './handlers/update_location';
import { deleteLocation } from './handlers/delete_location';
import { bulkUploadLocations } from './handlers/bulk_upload_locations';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Create a new location with environmental load data
  createLocation: publicProcedure
    .input(createLocationInputSchema)
    .mutation(({ input }) => createLocation(input)),

  // Get all locations for map display and reports
  getLocations: publicProcedure
    .query(() => getLocations()),

  // Get a specific location by ID
  getLocationById: publicProcedure
    .input(getLocationInputSchema)
    .query(({ input }) => getLocationById(input)),

  // Update an existing location's information
  updateLocation: publicProcedure
    .input(updateLocationInputSchema)
    .mutation(({ input }) => updateLocation(input)),

  // Delete a location from the database
  deleteLocation: publicProcedure
    .input(deleteLocationInputSchema)
    .mutation(({ input }) => deleteLocation(input)),

  // Bulk upload locations from CSV data
  bulkUploadLocations: publicProcedure
    .input(bulkUploadInputSchema)
    .mutation(({ input }) => bulkUploadLocations(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();