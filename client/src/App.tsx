import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Upload, Table, Plus, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { LocationForm } from './components/LocationForm';
import { LocationMap } from './components/LocationMap';
import { LocationTable } from './components/LocationTable';
import { BulkUpload } from './components/BulkUpload';
import type { Location } from '../../server/src/schema';

function App() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [backendError, setBackendError] = useState<boolean>(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  // Load locations from the server
  const loadLocations = useCallback(async () => {
    try {
      setIsLoading(true);
      setBackendError(false);
      const result = await trpc.getLocations.query();
      setLocations(result);
    } catch (error) {
      console.error('Failed to load locations:', error);
      setBackendError(true);
      // Set empty array as fallback when backend fails
      setLocations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Remove the original useEffect since we handle it in the new one

  // Handle successful location creation
  const handleLocationCreated = useCallback((newLocation: Location) => {
    setLocations((prev: Location[]) => [...prev, newLocation]);
  }, []);

  // Handle successful location update
  const handleLocationUpdated = useCallback((updatedLocation: Location) => {
    setLocations((prev: Location[]) => 
      prev.map((loc: Location) => 
        loc.id === updatedLocation.id ? updatedLocation : loc
      )
    );
  }, []);

  // Handle successful location deletion
  const handleLocationDeleted = useCallback((deletedId: number) => {
    setLocations((prev: Location[]) => 
      prev.filter((loc: Location) => loc.id !== deletedId)
    );
  }, []);

  // Handle successful bulk upload
  const handleBulkUploadSuccess = useCallback(() => {
    loadLocations(); // Reload all locations after bulk upload
  }, [loadLocations]);

  // Add sample data when in offline mode for demo purposes
  useEffect(() => {
    if (backendError && locations.length === 0 && hasAttemptedLoad) {
      const sampleLocations: Location[] = [
        {
          id: 1,
          name: "Downtown Office Building",
          address: "123 Main St, New York, NY",
          latitude: 40.7128,
          longitude: -74.0060,
          snow_load: 2.4,
          wind_speed: 30.5,
          seismic_load: 0.8,
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-01-15')
        },
        {
          id: 2,
          name: "Industrial Warehouse",
          address: "456 Industrial Blvd, Brooklyn, NY",
          latitude: 40.6782,
          longitude: -73.9442,
          snow_load: 1.8,
          wind_speed: 25.0,
          seismic_load: 0.6,
          created_at: new Date('2024-01-20'),
          updated_at: new Date('2024-01-20')
        },
        {
          id: 3,
          name: "Residential Complex",
          address: "789 Oak Avenue, Queens, NY",
          latitude: 40.7282,
          longitude: -73.7949,
          snow_load: 2.1,
          wind_speed: 28.75,
          seismic_load: 0.75,
          created_at: new Date('2024-01-25'),
          updated_at: new Date('2024-01-25')
        }
      ];
      setLocations(sampleLocations);
    }
  }, [backendError, locations.length, hasAttemptedLoad]);

  // Calculate summary statistics
  const stats = {
    totalLocations: locations.length,
    avgSnowLoad: locations.length > 0 ? 
      locations.reduce((sum: number, loc: Location) => sum + loc.snow_load, 0) / locations.length : 0,
    avgWindSpeed: locations.length > 0 ? 
      locations.reduce((sum: number, loc: Location) => sum + loc.wind_speed, 0) / locations.length : 0,
    avgSeismicLoad: locations.length > 0 ? 
      locations.reduce((sum: number, loc: Location) => sum + loc.seismic_load, 0) / locations.length : 0,
  };

  // Initialize data loading on component mount
  useEffect(() => {
    const attemptLoad = async () => {
      await loadLocations();
      setHasAttemptedLoad(true);
    };
    attemptLoad();
  }, [loadLocations]);

  if (isLoading && !hasAttemptedLoad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading environmental data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              🌍 Environmental Load Manager
            </h1>
            {backendError ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <WifiOff className="h-3 w-3" />
                Offline Mode
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-green-100 text-green-800 flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                Connected
              </Badge>
            )}
          </div>
          <p className="text-gray-600 text-lg">
            Manage and visualize environmental load data for structural engineering
          </p>
        </div>

        {/* Backend Error Alert */}
        {backendError && (
          <Alert className="mb-8 border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Backend service unavailable:</strong> Some features may not work properly. 
              The app is running in demo mode with limited functionality.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Locations</CardTitle>
              <MapPin className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalLocations}</div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Snow Load</CardTitle>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">kN/m²</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.avgSnowLoad.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Wind Speed</CardTitle>
              <Badge variant="secondary" className="bg-green-100 text-green-800">m/s</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.avgWindSpeed.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Seismic Load</CardTitle>
              <Badge variant="secondary" className="bg-red-100 text-red-800">Unit</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.avgSeismicLoad.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white shadow-lg">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Table className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="add-location" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Plus className="h-4 w-4" />
              Add Location
            </TabsTrigger>
            <TabsTrigger 
              value="map" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <MapPin className="h-4 w-4" />
              Map View
            </TabsTrigger>
            <TabsTrigger 
              value="bulk-upload" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Upload className="h-4 w-4" />
              Bulk Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table className="h-5 w-5 text-blue-600" />
                  Location Data Table
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LocationTable 
                  locations={locations}
                  onLocationUpdated={handleLocationUpdated}
                  onLocationDeleted={handleLocationDeleted}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add-location" className="mt-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-600" />
                  Add New Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LocationForm onLocationCreated={handleLocationCreated} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map" className="mt-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Interactive Map
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <LocationMap locations={locations} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk-upload" className="mt-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  Bulk Upload from CSV
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BulkUpload onUploadSuccess={handleBulkUploadSuccess} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;