// Building logic. No req or res here, and no SQL here.
import * as buildingRepository from "../repositories/building.repository";
import type { AppBuilding, BuildingRow } from "../schemas/building.schema";

export async function getAllBuildings(): Promise<AppBuilding[]> {
  const rows = await buildingRepository.findAll();
  return rows.map(toAppBuilding);
}

// Turns a database row into the exact shape the iPhone app reads.
export function toAppBuilding(row: BuildingRow): AppBuilding {
  return {
    location_id: row.id,
    full_name: row.full_name,
    abbreviation: row.abbreviation ?? "",
    defaultlatitude: row.latitude,
    defaultlongitude: row.longitude,
    campus_id: row.campus_id,
    geo_address: row.geo_address,
  };
}
