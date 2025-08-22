import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type BulkUploadInput } from '../schema';
import { bulkUploadLocations } from '../handlers/bulk_upload_locations';

// Test input with multiple locations
const testLocations: BulkUploadInput = {
  locations: [
    {
      name: 'Location A',
      address: '123 Main St',
      latitude: 40.7128,
      longitude: -74.0060,
      snow_load: 1.5,
      wind_speed: 25.0,
      seismic_load: 0.8
    },
    {
      name: 'Location B', 
      address: null,
      latitude: 34.0522,
      longitude: -118.2437,
      snow_load: 0.5,
      wind_speed: 30.0,
      seismic_load: 1.2
    },
    {
      name: 'Location C',
      address: '789 Oak Ave',
      latitude: 41.8781,
      longitude: -87.6298,
      snow_load: 2.0,
      wind_speed: 20.0,
      seismic_load: 0.6
    }
  ]
};

describe('bulkUploadLocations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create multiple locations successfully', async () => {
    const result = await bulkUploadLocations(testLocations);

    // Verify response structure
    expect(result.success).toBe(true);
    expect(result.created_count).toBe(3);
    expect(result.errors).toBeUndefined();
  });

  it('should save all locations to database', async () => {
    await bulkUploadLocations(testLocations);

    // Query all locations from database
    const locations = await db.select()
      .from(locationsTable)
      .execute();

    expect(locations).toHaveLength(3);

    // Verify first location
    const locationA = locations.find(loc => loc.name === 'Location A');
    expect(locationA).toBeDefined();
    expect(locationA!.address).toBe('123 Main St');
    expect(parseFloat(locationA!.latitude)).toBeCloseTo(40.7128);
    expect(parseFloat(locationA!.longitude)).toBeCloseTo(-74.0060);
    expect(locationA!.snow_load).toBe(1.5);
    expect(locationA!.wind_speed).toBe(25.0);
    expect(locationA!.seismic_load).toBe(0.8);
    expect(locationA!.created_at).toBeInstanceOf(Date);
    expect(locationA!.updated_at).toBeInstanceOf(Date);

    // Verify location with null address
    const locationB = locations.find(loc => loc.name === 'Location B');
    expect(locationB).toBeDefined();
    expect(locationB!.address).toBeNull();
    expect(parseFloat(locationB!.latitude)).toBeCloseTo(34.0522);
    expect(parseFloat(locationB!.longitude)).toBeCloseTo(-118.2437);
  });

  it('should handle single location upload', async () => {
    const singleLocationInput: BulkUploadInput = {
      locations: [testLocations.locations[0]]
    };

    const result = await bulkUploadLocations(singleLocationInput);

    expect(result.success).toBe(true);
    expect(result.created_count).toBe(1);
    expect(result.errors).toBeUndefined();

    // Verify database has exactly one location
    const locations = await db.select()
      .from(locationsTable)
      .execute();

    expect(locations).toHaveLength(1);
    expect(locations[0].name).toBe('Location A');
  });

  it('should handle locations with extreme coordinate values', async () => {
    const extremeCoordinatesInput: BulkUploadInput = {
      locations: [
        {
          name: 'North Pole',
          address: null,
          latitude: 90.0,
          longitude: 0.0,
          snow_load: 5.0,
          wind_speed: 50.0,
          seismic_load: 0.1
        },
        {
          name: 'South Pole',
          address: null,
          latitude: -90.0,
          longitude: 180.0,
          snow_load: 3.0,
          wind_speed: 40.0,
          seismic_load: 0.2
        }
      ]
    };

    const result = await bulkUploadLocations(extremeCoordinatesInput);

    expect(result.success).toBe(true);
    expect(result.created_count).toBe(2);

    // Verify extreme coordinates are stored correctly
    const locations = await db.select()
      .from(locationsTable)
      .execute();

    const northPole = locations.find(loc => loc.name === 'North Pole');
    const southPole = locations.find(loc => loc.name === 'South Pole');

    expect(parseFloat(northPole!.latitude)).toBe(90.0);
    expect(parseFloat(northPole!.longitude)).toBe(0.0);
    expect(parseFloat(southPole!.latitude)).toBe(-90.0);
    expect(parseFloat(southPole!.longitude)).toBe(180.0);
  });

  it('should handle locations with zero load values', async () => {
    const zeroLoadsInput: BulkUploadInput = {
      locations: [
        {
          name: 'Zero Load Location',
          address: '0 Load St',
          latitude: 45.0,
          longitude: -100.0,
          snow_load: 0.0,
          wind_speed: 0.0,
          seismic_load: 0.0
        }
      ]
    };

    const result = await bulkUploadLocations(zeroLoadsInput);

    expect(result.success).toBe(true);
    expect(result.created_count).toBe(1);

    // Verify zero values are stored correctly
    const locations = await db.select()
      .from(locationsTable)
      .execute();

    expect(locations[0].snow_load).toBe(0.0);
    expect(locations[0].wind_speed).toBe(0.0);
    expect(locations[0].seismic_load).toBe(0.0);
  });

  it('should handle duplicate names by creating all locations', async () => {
    const duplicateNamesInput: BulkUploadInput = {
      locations: [
        {
          name: 'Duplicate Location',
          address: 'First Address',
          latitude: 40.0,
          longitude: -70.0,
          snow_load: 1.0,
          wind_speed: 15.0,
          seismic_load: 0.5
        },
        {
          name: 'Duplicate Location',
          address: 'Second Address', 
          latitude: 41.0,
          longitude: -71.0,
          snow_load: 1.2,
          wind_speed: 18.0,
          seismic_load: 0.7
        }
      ]
    };

    const result = await bulkUploadLocations(duplicateNamesInput);

    expect(result.success).toBe(true);
    expect(result.created_count).toBe(2);

    // Verify both locations with same name are created
    const locations = await db.select()
      .from(locationsTable)
      .execute();

    expect(locations).toHaveLength(2);
    expect(locations.filter(loc => loc.name === 'Duplicate Location')).toHaveLength(2);
  });

  it('should handle high precision coordinates', async () => {
    const highPrecisionInput: BulkUploadInput = {
      locations: [
        {
          name: 'High Precision Location',
          address: 'Precise Address',
          latitude: 40.7128123456789, // Very high precision
          longitude: -74.0059876543210, // Very high precision
          snow_load: 1.234567,
          wind_speed: 25.789012,
          seismic_load: 0.876543
        }
      ]
    };

    const result = await bulkUploadLocations(highPrecisionInput);

    expect(result.success).toBe(true);
    expect(result.created_count).toBe(1);

    // Verify high precision coordinates are preserved
    const locations = await db.select()
      .from(locationsTable)
      .execute();

    // Note: Database precision may limit exact values, but should be very close
    expect(parseFloat(locations[0].latitude)).toBeCloseTo(40.7128123456789, 6);
    expect(parseFloat(locations[0].longitude)).toBeCloseTo(-74.0059876543210, 6);
    expect(locations[0].snow_load).toBeCloseTo(1.234567, 5);
  });
});