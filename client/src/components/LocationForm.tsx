import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { CreateLocationInput, Location } from '../../../server/src/schema';

interface LocationFormProps {
  onLocationCreated: (location: Location) => void;
}

export function LocationForm({ onLocationCreated }: LocationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateLocationInput>({
    name: '',
    address: null,
    latitude: 0,
    longitude: 0,
    snow_load: 0,
    wind_speed: 0,
    seismic_load: 0
  });

  // Simulate geocoding function (in real app, would use actual geocoding service)
  const geocodeAddress = async (address: string) => {
    setIsGeocoding(true);
    try {
      // This is a stub for demonstration - in a real app, you'd call a geocoding service
      // For now, we'll generate some sample coordinates based on the address
      const hash = address.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      const lat = 40.7128 + (hash % 1000) / 10000; // Around NYC area
      const lng = -74.0060 + (hash % 1000) / 10000;
      
      setFormData((prev: CreateLocationInput) => ({
        ...prev,
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lng.toFixed(6))
      }));
    } catch (error) {
      console.error('Geocoding failed:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await trpc.createLocation.mutate(formData);
      onLocationCreated(response);
      setSuccess('Location created successfully! 🎉');
      
      // Reset form
      setFormData({
        name: '',
        address: null,
        latitude: 0,
        longitude: 0,
        snow_load: 0,
        wind_speed: 0,
        seismic_load: 0
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to create location:', error);
      setError('Failed to create location. The backend service may be unavailable. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
      {/* Location Information */}
      <Card className="border-blue-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Location Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Location Name *
            </Label>
            <Input
              id="name"
              placeholder="e.g., Downtown Office Building"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateLocationInput) => ({ ...prev, name: e.target.value }))
              }
              required
              className="focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              Address (optional)
            </Label>
            <div className="flex gap-2">
              <Input
                id="address"
                placeholder="123 Main St, City, State, ZIP"
                value={formData.address || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateLocationInput) => ({
                    ...prev,
                    address: e.target.value || null
                  }))
                }
                className="focus:ring-blue-500 focus:border-blue-500"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => formData.address && geocodeAddress(formData.address)}
                disabled={!formData.address || isGeocoding}
                className="shrink-0"
              >
                {isGeocoding ? (
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Enter address and click the navigation button to auto-fill coordinates
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude" className="text-sm font-medium">
                Latitude *
              </Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                min="-90"
                max="90"
                placeholder="40.7128"
                value={formData.latitude}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateLocationInput) => ({
                    ...prev,
                    latitude: parseFloat(e.target.value) || 0
                  }))
                }
                required
                className="focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude" className="text-sm font-medium">
                Longitude *
              </Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                min="-180"
                max="180"
                placeholder="-74.0060"
                value={formData.longitude}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateLocationInput) => ({
                    ...prev,
                    longitude: parseFloat(e.target.value) || 0
                  }))
                }
                required
                className="focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environmental Load Data */}
      <Card className="border-green-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            🌨️ Environmental Load Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="snow_load" className="text-sm font-medium flex items-center gap-2">
              Snow Load *
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                kN/m²
              </Badge>
            </Label>
            <Input
              id="snow_load"
              type="number"
              step="0.01"
              min="0"
              placeholder="2.4"
              value={formData.snow_load}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateLocationInput) => ({
                  ...prev,
                  snow_load: parseFloat(e.target.value) || 0
                }))
              }
              required
              className="focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wind_speed" className="text-sm font-medium flex items-center gap-2">
              Wind Speed *
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                m/s
              </Badge>
            </Label>
            <Input
              id="wind_speed"
              type="number"
              step="0.01"
              min="0"
              placeholder="30.5"
              value={formData.wind_speed}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateLocationInput) => ({
                  ...prev,
                  wind_speed: parseFloat(e.target.value) || 0
                }))
              }
              required
              className="focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seismic_load" className="text-sm font-medium flex items-center gap-2">
              Seismic Load *
              <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                Unit
              </Badge>
            </Label>
            <Input
              id="seismic_load"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.8"
              value={formData.seismic_load}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateLocationInput) => ({
                  ...prev,
                  seismic_load: parseFloat(e.target.value) || 0
                }))
              }
              required
              className="focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            Creating Location...
          </div>
        ) : (
          'Create Location'
        )}
      </Button>
      </form>
    </div>
  );
}