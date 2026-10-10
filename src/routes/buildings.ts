import { Router } from "express";
import type { Row } from "@libsql/client";
import { db } from "../db";

const router = Router();

// The iPhone app decodes exactly these keys (TempLocation in APIService.swift).
// Note defaultlatitude / defaultlongitude are all lowercase. Do not rename.
export type AppBuilding = {
  location_id: number;
  full_name: string;
  abbreviation: string;
  defaultlatitude: number;
  defaultlongitude: number;
  campus_id: number;
  geo_address: string | null;
};

export function toAppBuilding(row: Row): AppBuilding {
  return {
    location_id: Number(row.id),
    full_name: String(row.full_name),
    abbreviation: String(row.abbreviation ?? ""),
    defaultlatitude: Number(row.latitude),
    defaultlongitude: Number(row.longitude),
    campus_id: Number(row.campus_id),
    geo_address: row.geo_address == null ? null : String(row.geo_address),
  };
}

router.get("/app/building/all", async (_req, res) => {
  const result = await db.execute("SELECT * FROM building ORDER BY id");
  res.json(result.rows.map(toAppBuilding));
});

export default router;
