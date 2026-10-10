export type BuildingRow = {
  id: number;
  full_name: string;
  abbreviation: string | null;
  latitude: number;
  longitude: number;
  campus_id: number;
  geo_address: string | null;
};

export type AppBuilding = {
  location_id: number;
  full_name: string;
  abbreviation: string;
  defaultlatitude: number;
  defaultlongitude: number;
  campus_id: number;
  geo_address: string | null;
};
