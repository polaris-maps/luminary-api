// SQL for the building table. Nothing else in the app writes building SQL.
import { query } from "../db/client";
import type { BuildingRow } from "../schemas/buildingSchema";

export async function findAll(): Promise<BuildingRow[]> {
  return query<BuildingRow>("SELECT * FROM building ORDER BY id");
}
