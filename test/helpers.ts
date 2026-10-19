import { query } from "../src/db/client";
import { initDb } from "../src/db/init";
import buildings from "./fixtures/buildings.json";
import reports from "./fixtures/reports.json";

function toMillis(time: number) {
  if (time < 10000000000) return time * 1000;
  return time;
}

export async function loadFixtures() {
  await initDb();
  await query("DELETE FROM building");
  await query("DELETE FROM report");

  for (const b of buildings) {
    await query(
      "INSERT INTO building (id, full_name, abbreviation, latitude, longitude, campus_id, geo_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [b.location_id, b.full_name, b.abbreviation, b.defaultlatitude, b.defaultlongitude, b.campus_id, b.geo_address],
    );
  }

  for (const r of reports) {
    await query(
      "INSERT INTO report (id, location, latitude, longitude, description, status, opened_at, votes, image, categories, qna) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        r.issue_id,
        r.location,
        r.latitude,
        r.longitude,
        r.description,
        r.status || "Open",
        toMillis(r.datetimeopen),
        r.votes || 0,
        r.image,
        JSON.stringify(r.categories || []),
        r.qna,
      ],
    );
  }
}
