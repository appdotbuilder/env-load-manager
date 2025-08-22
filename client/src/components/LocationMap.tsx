import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Maximize2, Minimize2 } from 'lucide-react';
import type { Location } from '../../../server/src/schema';

interface LocationMapProps {
  locations: Location[];
}

export function LocationMap({ locations }: LocationMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Calculate map bounds and center
  const mapData = useMemo(() => {
    if (locations.length === 0) {
      return {
        center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
        bounds: { north: 41, south: 40, east: -73, west: -75 },
        zoom: 10
      };
    }

    const lats = locations.map((loc: Location) => loc.latitude);
    const lngs = locations.map((loc: Location) => loc.longitude);
    
    const bounds = {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs)
    };

    const center = {
      lat: (bounds.north + bounds.south) / 2,
      lng: (bounds.east + bounds.west) / 2
    };

    return { center, bounds, zoom: 8 };
  }, [locations]);

  // Calculate position for markers on the SVG map
  const getMarkerPosition = (location: Location) => {
    const mapWidth = 800;
    const mapHeight = 500;
    const padding = 50;
    
    const { bounds } = mapData;
    const latRange = bounds.north - bounds.south || 0.1;
    const lngRange = bounds.east - bounds.west || 0.1;
    
    const x = padding + ((location.longitude - bounds.west) / lngRange) * (mapWidth - 2 * padding);
    const y = padding + ((bounds.north - location.latitude) / latRange) * (mapHeight - 2 * padding);
    
    return { x: Math.max(padding, Math.min(mapWidth - padding, x)), y: Math.max(padding, Math.min(mapHeight - padding, y)) };
  };

  // Get color based on load values (simplified visualization)
  const getMarkerColor = (location: Location) => {
    const totalLoad = location.snow_load + location.wind_speed + location.seismic_load;
    if (totalLoad < 10) return '#10b981'; // Green for low loads
    if (totalLoad < 50) return '#f59e0b'; // Yellow for medium loads
    return '#ef4444'; // Red for high loads
  };

  const handleMarkerClick = (location: Location) => {
    setSelectedLocation(selectedLocation?.id === location.id ? null : location);
  };

  if (locations.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No locations to display</h3>
          <p className="text-gray-500">
            Add locations to see them on the interactive map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'relative'} p-6`}>
      {/* Map Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Environmental Load Locations</h3>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {locations.length} locations
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="flex items-center gap-2"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="h-4 w-4" />
              Exit Fullscreen
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4" />
              Fullscreen
            </>
          )}
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Map SVG */}
        <div className="flex-1">
          <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-green-50">
            <svg
              viewBox="0 0 800 500"
              className={`w-full ${isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-96'} cursor-crosshair`}
            >
              {/* Grid lines for reference */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="800" height="500" fill="url(#grid)" />
              
              {/* Coordinate labels */}
              <text x="50" y="30" fontSize="12" fill="#6b7280" textAnchor="start">
                N: {mapData.bounds.north.toFixed(4)}°
              </text>
              <text x="50" y="480" fontSize="12" fill="#6b7280" textAnchor="start">
                S: {mapData.bounds.south.toFixed(4)}°
              </text>
              <text x="750" y="480" fontSize="12" fill="#6b7280" textAnchor="end">
                E: {mapData.bounds.east.toFixed(4)}°
              </text>
              <text x="50" y="480" fontSize="12" fill="#6b7280" textAnchor="start">
                W: {mapData.bounds.west.toFixed(4)}°
              </text>

              {/* Location markers */}
              {locations.map((location: Location) => {
                const position = getMarkerPosition(location);
                const color = getMarkerColor(location);
                const isSelected = selectedLocation?.id === location.id;
                
                return (
                  <g key={location.id}>
                    {/* Marker shadow */}
                    <circle
                      cx={position.x}
                      cy={position.y + 2}
                      r={isSelected ? 12 : 8}
                      fill="rgba(0,0,0,0.2)"
                    />
                    {/* Main marker */}
                    <circle
                      cx={position.x}
                      cy={position.y}
                      r={isSelected ? 10 : 6}
                      fill={color}
                      stroke="white"
                      strokeWidth="2"
                      className="cursor-pointer transition-all duration-200 hover:r-8"
                      onClick={() => handleMarkerClick(location)}
                    />
                    {/* Location name label */}
                    <text
                      x={position.x}
                      y={position.y - 15}
                      fontSize="10"
                      fill="#374151"
                      textAnchor="middle"
                      className="pointer-events-none font-medium"
                    >
                      {location.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Low Load (&lt;10)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Medium Load (10-50)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>High Load (&gt;50)</span>
            </div>
          </div>
        </div>

        {/* Location Details Panel */}
        {selectedLocation && (
          <Card className="w-80 h-fit">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                {selectedLocation.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedLocation.address && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Address</h4>
                  <p className="text-sm text-gray-600">{selectedLocation.address}</p>
                </div>
              )}
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Coordinates</h4>
                <div className="space-y-1 text-sm font-mono">
                  <div>Lat: {selectedLocation.latitude.toFixed(6)}°</div>
                  <div>Lng: {selectedLocation.longitude.toFixed(6)}°</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">Environmental Loads</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Snow Load</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {selectedLocation.snow_load.toFixed(2)} kN/m²
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Wind Speed</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {selectedLocation.wind_speed.toFixed(2)} m/s
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Seismic Load</span>
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      {selectedLocation.seismic_load.toFixed(2)} Unit
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-1">Created</h4>
                <p className="text-sm text-gray-600">
                  {selectedLocation.created_at.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedLocation(null)}
                className="w-full mt-4"
              >
                Close Details
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}