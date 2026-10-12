import { writeFile } from "node:fs/promises";
import { query } from "../src/db/client";
import { initDb } from "../src/db/init";

/*
I had claude create this script to seed your local SQL-lite with a snapshot of what is in
our old production database.

you can run it with npm run seed
*/

const oldApi = "https://polaris-api-dept-polaris.apps.cloudapps.unc.edu/app";

async function download(path: string) {
  const res = await fetch(oldApi + path);
  return res.json();
}

function toMillis(time: number) {
  if (!time) return null;
  if (time < 10000000000) return time * 1000;
  return time;
}

function isInChapelHill(report: any) {
  return (
    report.latitude >= 35.85 &&
    report.latitude <= 35.97 &&
    report.longitude >= -79.12 &&
    report.longitude <= -78.98
  );
}

await initDb();

const buildings = await download("/building/all");
const doors = await download("/door/all");
const ramps = await download("/ramp/all");
const allReports = await download("/indoorIssue/all");
const reports = allReports.filter(isInChapelHill);

await query("DELETE FROM report");
await query("DELETE FROM ramp");
await query("DELETE FROM door");
await query("DELETE FROM building");

for (const b of buildings) {
  await query(
    "INSERT INTO building (id, full_name, abbreviation, latitude, longitude, campus_id, geo_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [b.location_id, b.full_name, b.abbreviation, b.defaultlatitude, b.defaultlongitude, b.campus_id, b.geo_address]
  );
}

for (const d of doors) {
  await query(
    "INSERT INTO door (id, building_id, latitude, longitude, is_indoor, is_emergency, is_service) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [d.door_id, d.building_id, d.latitude, d.longitude, d.is_indoor, d.is_emergency, d.is_service]
  );
}

for (const r of ramps) {
  await query(
    "INSERT INTO ramp (id, building_id, latitude, longitude) VALUES (?, ?, ?, ?)",
    [r.ramp_id, r.building, r.latitude, r.longitude]
  );
}

for (const r of reports) {
  await query(
    "INSERT INTO report (id, location, latitude, longitude, description, status, opened_at, closed_at, votes, image, categories, qna) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      r.issue_id,
      r.location,
      r.latitude,
      r.longitude,
      r.description,
      r.status || "Open",
      toMillis(r.datetimeopen),
      toMillis(r.datetimeclosed),
      r.votes || 0,
      r.image || null,
      JSON.stringify(r.categories || []),
      r.qna,
    ]
  );
}

await writeFile("test/fixtures/buildings.json", JSON.stringify(buildings, null, 2) + "\n");
const sampleReports = reports.slice(0, 20);
for (const report of sampleReports) {
  report.image = null;
}
await writeFile("test/fixtures/reports.json", JSON.stringify(sampleReports, null, 2) + "\n");

console.log(`buildings: ${buildings.length}`);
console.log(`doors: ${doors.length}`);
console.log(`ramps: ${ramps.length}`);
console.log(`reports: ${reports.length} (skipped ${allReports.length - reports.length} outside Chapel Hill)`);
