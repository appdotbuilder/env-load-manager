import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, FileText, Download, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { CsvLocation, BulkUploadResponse } from '../../../server/src/schema';

interface BulkUploadProps {
  onUploadSuccess: () => void;
}

interface ParsedCsvData {
  validRows: CsvLocation[];
  errors: string[];
  totalRows: number;
}

export function BulkUpload({ onUploadSuccess }: BulkUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedCsvData | null>(null);
  const [uploadResult, setUploadResult] = useState<BulkUploadResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample CSV template
  const downloadTemplate = () => {
    const csvContent = `name,address,latitude,longitude,snow_load,wind_speed,seismic_load
"Office Building Downtown","123 Main St, City, State",40.712800,-74.006000,2.40,30.50,0.80
"Warehouse North","456 Industrial Blvd, City, State",40.758900,-73.985100,1.80,25.00,0.60
"Residential Complex","789 Oak Ave, City, State",40.689200,-74.044500,2.10,28.75,0.75`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'location_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Parse CSV file
  const parseCsvFile = (file: File): Promise<ParsedCsvData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter((line: string) => line.trim() !== '');
          
          if (lines.length < 2) {
            reject(new Error('CSV file must contain at least a header and one data row'));
            return;
          }

          const headers = lines[0].split(',').map((h: string) => h.replace(/"/g, '').trim());
          const expectedHeaders = ['name', 'address', 'latitude', 'longitude', 'snow_load', 'wind_speed', 'seismic_load'];
          
          // Check if all required headers are present
          const missingHeaders = expectedHeaders.filter((h: string) => !headers.includes(h));
          if (missingHeaders.length > 0) {
            reject(new Error(`Missing required headers: ${missingHeaders.join(', ')}`));
            return;
          }

          const validRows: CsvLocation[] = [];
          const errors: string[] = [];

          for (let i = 1; i < lines.length; i++) {
            try {
              const values = lines[i].split(',').map((v: string) => v.replace(/"/g, '').trim());
              
              if (values.length < expectedHeaders.length) {
                errors.push(`Row ${i + 1}: Insufficient columns`);
                continue;
              }

              const row: CsvLocation = {
                name: values[0],
                address: values[1] || null,
                latitude: parseFloat(values[2]),
                longitude: parseFloat(values[3]),
                snow_load: parseFloat(values[4]),
                wind_speed: parseFloat(values[5]),
                seismic_load: parseFloat(values[6])
              };

              // Validate the row
              if (!row.name || row.name.length === 0) {
                errors.push(`Row ${i + 1}: Name is required`);
                continue;
              }

              if (isNaN(row.latitude) || row.latitude < -90 || row.latitude > 90) {
                errors.push(`Row ${i + 1}: Invalid latitude (${values[2]})`);
                continue;
              }

              if (isNaN(row.longitude) || row.longitude < -180 || row.longitude > 180) {
                errors.push(`Row ${i + 1}: Invalid longitude (${values[3]})`);
                continue;
              }

              if (isNaN(row.snow_load) || row.snow_load < 0) {
                errors.push(`Row ${i + 1}: Invalid snow load (${values[4]})`);
                continue;
              }

              if (isNaN(row.wind_speed) || row.wind_speed < 0) {
                errors.push(`Row ${i + 1}: Invalid wind speed (${values[5]})`);
                continue;
              }

              if (isNaN(row.seismic_load) || row.seismic_load < 0) {
                errors.push(`Row ${i + 1}: Invalid seismic load (${values[6]})`);
                continue;
              }

              validRows.push(row);
            } catch (error) {
              errors.push(`Row ${i + 1}: Parse error - ${error}`);
            }
          }

          resolve({
            validRows,
            errors,
            totalRows: lines.length - 1
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParsedData({ validRows: [], errors: ['Please select a CSV file'], totalRows: 0 });
      return;
    }

    setUploadResult(null);
    setUploadProgress(0);

    try {
      const data = await parseCsvFile(file);
      setParsedData(data);
    } catch (error) {
      setParsedData({
        validRows: [],
        errors: [error instanceof Error ? error.message : 'Failed to parse CSV file'],
        totalRows: 0
      });
    }
  };

  const handleUpload = async () => {
    if (!parsedData?.validRows.length) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev: number) => Math.min(prev + 10, 90));
      }, 200);

      const response = await trpc.bulkUploadLocations.mutate({
        locations: parsedData.validRows
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadResult(response);

      if (response.success) {
        onUploadSuccess();
        // Clear the form after successful upload
        setTimeout(() => {
          setParsedData(null);
          setUploadResult(null);
          setUploadProgress(0);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadResult({
        success: false,
        created_count: 0,
        errors: ['Upload failed. The backend service may be unavailable. Please try again later.']
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setParsedData(null);
    setUploadResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
            <Info className="h-5 w-5" />
            CSV Upload Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Upload a CSV file containing location data with environmental load information. 
            Your CSV file must include the following columns:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono bg-white p-3 rounded border">
            <div>• name (required)</div>
            <div>• address (optional)</div>
            <div>• latitude (required, -90 to 90)</div>
            <div>• longitude (required, -180 to 180)</div>
            <div>• snow_load (required, ≥ 0)</div>
            <div>• wind_speed (required, ≥ 0)</div>
            <div>• seismic_load (required, ≥ 0)</div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
            <span className="text-gray-600">Use this template to get started</span>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Upload CSV File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {parsedData && (
                <Button variant="outline" onClick={resetForm} size="sm">
                  Clear
                </Button>
              )}
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading locations...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Parse Results */}
      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Parse Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex gap-4">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {parsedData.validRows.length} valid rows
                </Badge>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {parsedData.errors.length} errors
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {parsedData.totalRows} total rows
                </Badge>
              </div>

              {/* Errors */}
              {parsedData.errors.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">Found {parsedData.errors.length} errors:</div>
                      <ul className="text-sm space-y-1 ml-4">
                        {parsedData.errors.slice(0, 5).map((error: string, index: number) => (
                          <li key={index} className="list-disc">{error}</li>
                        ))}
                        {parsedData.errors.length > 5 && (
                          <li className="list-disc text-gray-600">
                            ... and {parsedData.errors.length - 5} more errors
                          </li>
                        )}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Valid Data Preview */}
              {parsedData.validRows.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Preview of Valid Data ({Math.min(5, parsedData.validRows.length)} of {parsedData.validRows.length} rows)</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Name</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Coordinates</TableHead>
                          <TableHead>Snow Load</TableHead>
                          <TableHead>Wind Speed</TableHead>
                          <TableHead>Seismic Load</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedData.validRows.slice(0, 5).map((row: CsvLocation, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{row.name}</TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {row.address || 'N/A'}
                            </TableCell>
                            <TableCell className="text-sm font-mono">
                              {row.latitude.toFixed(4)}, {row.longitude.toFixed(4)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                {row.snow_load}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                {row.wind_speed}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                                {row.seismic_load}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={parsedData.validRows.length === 0 || isUploading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isUploading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Uploading {parsedData.validRows.length} locations...
                  </div>
                ) : (
                  `Upload ${parsedData.validRows.length} Locations`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <Alert className={uploadResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {uploadResult.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription>
            {uploadResult.success ? (
              <div className="text-green-800">
                <div className="font-medium">Upload Successful! 🎉</div>
                <div>Successfully created {uploadResult.created_count} locations.</div>
              </div>
            ) : (
              <div className="text-red-800">
                <div className="font-medium">Upload Failed</div>
                {uploadResult.errors?.map((error: string, index: number) => (
                  <div key={index} className="text-sm">{error}</div>
                ))}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}