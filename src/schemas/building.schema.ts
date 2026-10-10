// The shapes of building data. No logic in this file.

// One row of the building table (see src/db/tables.ts).
export type BuildingRow = {
  id: number;
  full_name: string;
  abbreviation: string | null;
  latitude: number;
  longitude: number;
  campus_id: number;
  geo_address: string | null;
};

// One building exactly as the iPhone app reads it (TempLocation in APIService.swift).
// defaultlatitude and defaultlongitude are all lowercase on purpose. Do not rename.
export type AppBuilding = {
  location_id: number;
  full_name: string;
  abbreviation: string;
  defaultlatitude: number;
  defaultlongitude: number;
  campus_id: number;
  geo_address: string | null;
};
