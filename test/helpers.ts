import { query } from "../src/db/client";
import { initDb } from "../src/db/init";
import buildings from "./fixtures/buildings.json";

export async function loadFixtures() {
  await initDb();
  await query("DELETE FROM building");

  for (const b of buildings) {
    await query(
      "INSERT INTO building (id, full_name, abbreviation, latitude, longitude, campus_id, geo_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [b.location_id, b.full_name, b.abbreviation, b.defaultlatitude, b.defaultlongitude, b.campus_id, b.geo_address]
    );
  }
}
