import { writeFile } from "node:fs/promises";
import { db } from "../src/db/client";
import { initDb } from "../src/db/init";

const oldApi = "https://polaris-api-dept-polaris.apps.cloudapps.unc.edu/app";

async function download(path: string) {
  const res = await fetch(oldApi + path);
  return res.json();
}

function toMillis(time: number) {
  if (!time) return null;
  return time < 10000000000 ? time * 1000 : time;
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

await db.batch([
  "DELETE FROM report",
  "DELETE FROM ramp",
  "DELETE FROM door",
  "DELETE FROM building",

  ...buildings.map((b: any) => ({
    sql: `INSERT INTO building (id, full_name, abbreviation, latitude, longitude, campus_id, geo_address)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [b.location_id, b.full_name, b.abbreviation, b.defaultlatitude, b.defaultlongitude, b.campus_id, b.geo_address],
  })),

  ...doors.map((d: any) => ({
    sql: `INSERT INTO door (id, building_id, latitude, longitude, is_indoor, is_emergency, is_service)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [d.door_id, d.building_id, d.latitude, d.longitude, d.is_indoor ? 1 : 0, d.is_emergency ? 1 : 0, d.is_service ? 1 : 0],
  })),

  ...ramps.map((r: any) => ({
    sql: "INSERT INTO ramp (id, building_id, latitude, longitude) VALUES (?, ?, ?, ?)",
    args: [r.ramp_id, r.building, r.latitude, r.longitude],
  })),

  ...reports.map((r: any) => ({
    sql: `INSERT INTO report (id, location, latitude, longitude, description, status, opened_at, closed_at, votes, image, categories, qna)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      r.issue_id,
      r.location,
      r.latitude,
      r.longitude,
      r.description,
      r.status ?? "Open",
      toMillis(r.datetimeopen),
      toMillis(r.datetimeclosed),
      r.votes ?? 0,
      r.image || null,
      JSON.stringify(r.categories ?? []),
      r.qna,
    ],
  })),
], "write");

await writeFile("test/fixtures/buildings.json", JSON.stringify(buildings, null, 2) + "\n");
const sampleReports = reports.slice(0, 20).map((r: any) => ({ ...r, image: null }));
await writeFile("test/fixtures/reports.json", JSON.stringify(sampleReports, null, 2) + "\n");

console.log(`buildings: ${buildings.length}`);
console.log(`doors: ${doors.length}`);
console.log(`ramps: ${ramps.length}`);
console.log(`reports: ${reports.length} (skipped ${allReports.length - reports.length} outside Chapel Hill)`);
