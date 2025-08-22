import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Edit, Trash2, MapPin, Search, AlertCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Location, UpdateLocationInput } from '../../../server/src/schema';

interface LocationTableProps {
  locations: Location[];
  onLocationUpdated: (location: Location) => void;
  onLocationDeleted: (id: number) => void;
}

export function LocationTable({ locations, onLocationUpdated, onLocationDeleted }: LocationTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateLocationInput>({
    id: 0,
    name: '',
    address: null,
    latitude: 0,
    longitude: 0,
    snow_load: 0,
    wind_speed: 0,
    seismic_load: 0
  });

  // Filter locations based on search term
  const filteredLocations = locations.filter((location: Location) =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (location.address && location.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setEditFormData({
      id: location.id,
      name: location.name,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      snow_load: location.snow_load,
      wind_speed: location.wind_speed,
      seismic_load: location.seismic_load
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);
    
    try {
      const response = await trpc.updateLocation.mutate(editFormData);
      onLocationUpdated(response);
      setIsEditDialogOpen(false);
      setEditingLocation(null);
    } catch (error) {
      console.error('Failed to update location:', error);
      setError('Failed to update location. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsDeleting(true);
    setError(null);
    
    try {
      await trpc.deleteLocation.mutate({ id });
      onLocationDeleted(id);
    } catch (error) {
      console.error('Failed to delete location:', error);
      setError('Failed to delete location. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (locations.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No locations yet</h3>
        <p className="text-gray-500">
          Add your first location using the "Add Location" tab or bulk upload from CSV.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2 text-red-800 hover:text-red-900"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search locations by name or address..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {filteredLocations.length} of {locations.length} locations
        </Badge>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Location</TableHead>
              <TableHead className="font-semibold">Coordinates</TableHead>
              <TableHead className="font-semibold">Snow Load</TableHead>
              <TableHead className="font-semibold">Wind Speed</TableHead>
              <TableHead className="font-semibold">Seismic Load</TableHead>
              <TableHead className="font-semibold">Created</TableHead>
              <TableHead className="font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLocations.map((location: Location) => (
              <TableRow key={location.id} className="hover:bg-gray-50">
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">{location.name}</div>
                    {location.address && (
                      <div className="text-sm text-gray-500">{location.address}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  <div>Lat: {location.latitude.toFixed(6)}</div>
                  <div>Lng: {location.longitude.toFixed(6)}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {location.snow_load.toFixed(2)} kN/m²
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {location.wind_speed.toFixed(2)} m/s
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    {location.seismic_load.toFixed(2)} Unit
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {location.created_at.toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Dialog open={isEditDialogOpen && editingLocation?.id === location.id} onOpenChange={setIsEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(location)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Edit Location</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdate} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Name</Label>
                              <Input
                                id="edit-name"
                                value={editFormData.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setEditFormData((prev: UpdateLocationInput) => ({ ...prev, name: e.target.value }))
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-address">Address</Label>
                              <Input
                                id="edit-address"
                                value={editFormData.address || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setEditFormData((prev: UpdateLocationInput) => ({
                                    ...prev,
                                    address: e.target.value || null
                                  }))
                                }
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-latitude">Latitude</Label>
                              <Input
                                id="edit-latitude"
                                type="number"
                                step="any"
                                value={editFormData.latitude}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setEditFormData((prev: UpdateLocationInput) => ({
                                    ...prev,
                                    latitude: parseFloat(e.target.value) || 0
                                  }))
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-longitude">Longitude</Label>
                              <Input
                                id="edit-longitude"
                                type="number"
                                step="any"
                                value={editFormData.longitude}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setEditFormData((prev: UpdateLocationInput) => ({
                                    ...prev,
                                    longitude: parseFloat(e.target.value) || 0
                                  }))
                                }
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-snow">Snow Load (kN/m²)</Label>
                              <Input
                                id="edit-snow"
                                type="number"
                                step="0.01"
                                value={editFormData.snow_load}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setEditFormData((prev: UpdateLocationInput) => ({
                                    ...prev,
                                    snow_load: parseFloat(e.target.value) || 0
                                  }))
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-wind">Wind Speed (m/s)</Label>
                              <Input
                                id="edit-wind"
                                type="number"
                                step="0.01"
                                value={editFormData.wind_speed}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setEditFormData((prev: UpdateLocationInput) => ({
                                    ...prev,
                                    wind_speed: parseFloat(e.target.value) || 0
                                  }))
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-seismic">Seismic Load</Label>
                              <Input
                                id="edit-seismic"
                                type="number"
                                step="0.01"
                                value={editFormData.seismic_load}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setEditFormData((prev: UpdateLocationInput) => ({
                                    ...prev,
                                    seismic_load: parseFloat(e.target.value) || 0
                                  }))
                                }
                                required
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isUpdating}>
                              {isUpdating ? 'Updating...' : 'Update Location'}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Location</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{location.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(location.id)}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}