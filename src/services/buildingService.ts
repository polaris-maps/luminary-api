import { query } from "../db/client.js";
import { AppBuilding, BuildingRow } from "../schemas/buildingSchema.js";
import { distanceMeters } from "../utils/distance.js";

// A report only counts as "at" a building if the building is this close
const maxBuildingMeters = 50;

// The only building fields findNearestBuilding needs
type BuildingSpot = Pick<BuildingRow, "full_name" | "latitude" | "longitude">;

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

export function findNearestBuilding<T extends BuildingSpot>(buildings: T[], latitude: number, longitude: number) {
  // The closest building seen so far, and how far away it is
  let nearestBuilding: T | null = null;
  let nearestMeters = Infinity;

  for (const building of buildings) {
    // How far this building is from the spot
    const meters = distanceMeters(latitude, longitude, building.latitude, building.longitude);

    // Keep this building if it is closer than the closest one so far
    if (meters < nearestMeters) {
      nearestBuilding = building;
      nearestMeters = meters;
    }
  }

  // No buildings were given
  if (nearestBuilding === null) return null;

  // The closest building is too far away for the spot to be "at" it
  if (nearestMeters > maxBuildingMeters) return null;

  return nearestBuilding;
}
