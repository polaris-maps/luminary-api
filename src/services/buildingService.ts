import { query } from "../db/client";
import { AppBuilding, BuildingRow } from "../schemas/buildingSchema";

export async function getAllBuildings() {
  const rows: BuildingRow[] = await query("SELECT * FROM building ORDER BY id");
  return rows.map(toAppBuilding);
}

export async function getBuilding(id: number) {
  const rows: BuildingRow[] = await query("SELECT * FROM building WHERE id = ?", [id]);
  if (rows.length === 0) return null;
  return toAppBuilding(rows[0]);
}

export function toAppBuilding(row: BuildingRow): AppBuilding {
  return {
    location_id: row.id,
    full_name: row.full_name,
    abbreviation: row.abbreviation || "",
    defaultlatitude: row.latitude,
    defaultlongitude: row.longitude,
    campus_id: row.campus_id,
    geo_address: row.geo_address,
  };
}
