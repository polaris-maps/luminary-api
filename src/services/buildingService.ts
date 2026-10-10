import * as buildingRepository from "../repositories/buildingRepository";
import { AppBuilding, BuildingRow } from "../schemas/buildingSchema";

export async function getAllBuildings() {
  const rows = await buildingRepository.findAll();
  return rows.map(toAppBuilding);
}

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
