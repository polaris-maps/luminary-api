import { query } from "../db/client";
import { BuildingRow } from "../schemas/buildingSchema";

export async function findAll(): Promise<BuildingRow[]> {
  return query("SELECT * FROM building ORDER BY id");
}
