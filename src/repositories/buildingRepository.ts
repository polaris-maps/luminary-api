import { query } from "../db/client";
import type { BuildingRow } from "../schemas/buildingSchema";

export async function findAll() {
  return query<BuildingRow>("SELECT * FROM building ORDER BY id");
}
