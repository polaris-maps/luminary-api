// npm run seed
// Copies buildings, doors, ramps, and reports from the old API into the local SQLite database.
// Safe to run repeatedly: it empties the four tables first.
// Scripts are the one place outside src/repositories/ allowed to write SQL.
import { writeFile } from "node:fs/promises";
import { db } from "../src/db/client";
import { initDb } from "../src/db/init";

const OLD_API = "https://polaris-api-dept-polaris.apps.cloudapps.unc.edu/app";

// Rough box around Chapel Hill. Some old test reports are in Chicago.
const BOUNDS = { minLat: 35.85, maxLat: 35.97, minLng: -79.12, maxLng: -78.98 };

type OldBuilding = {
  location_id: number; full_name: string; abbreviation: string | null;
  defaultlatitude: number; defaultlongitude: number; campus_id: number; geo_address: string | null;
};
type OldDoor = {
  door_id: number; building_id: number; latitude: number; longitude: number;
  is_indoor: boolean; is_emergency: boolean; is_service: boolean;
};
type OldRamp = { ramp_id: number; latitude: number; longitude: number; building: number | null };
type OldReport = {
  issue_id: number | string; location: string | null; latitude: number | string | null;
  longitude: number | string | null; description: string | null; status: string | null;
  datetimeopen: number | string | null; datetimeclosed: number | string | null;
  datetimepermanent: number | string | null; votes: number | string | null;
  image: string | null; categories: string[] | null; qna: string | null;
};

async function download<T>(path: string): Promise<T[]> {
  const res = await fetch(`${OLD_API}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed with ${res.status}`);
  return (await res.json()) as T[];
}

// Some old times are in seconds instead of milliseconds.
function toMillis(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n < 10_000_000_000 ? n * 1000 : n;
}

const bool = (v: unknown) => (v ? 1 : 0);

async function main() {
  await initDb();

  const [buildings, doors, ramps, reports] = await Promise.all([
    download<OldBuilding>("/building/all"),
    download<OldDoor>("/door/all"),
    download<OldRamp>("/ramp/all"),
    download<OldReport>("/indoorIssue/all"),
  ]);

  // Clean reports before touching the database.
  const validReports: OldReport[] = [];
  let skipped = 0;
  for (const r of reports) {
    const lat = Number(r.latitude);
    const lng = Number(r.longitude);
    const hasCoords = r.latitude != null && r.longitude != null && Number.isFinite(lat) && Number.isFinite(lng);
    const inChapelHill =
      hasCoords && lat >= BOUNDS.minLat && lat <= BOUNDS.maxLat && lng >= BOUNDS.minLng && lng <= BOUNDS.maxLng;
    if (!inChapelHill || toMillis(r.datetimeopen) == null) {
      skipped++;
      continue;
    }
    validReports.push(r);
  }

  const statements = [
    "DELETE FROM report",
    "DELETE FROM ramp",
    "DELETE FROM door",
    "DELETE FROM building",
    ...buildings.map((b) => ({
      sql: `INSERT INTO building (id, full_name, abbreviation, latitude, longitude, campus_id, geo_address)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [b.location_id, b.full_name, b.abbreviation, b.defaultlatitude, b.defaultlongitude, b.campus_id ?? 1, b.geo_address],
    })),
    ...doors.map((d) => ({
      sql: `INSERT INTO door (id, building_id, latitude, longitude, is_indoor, is_emergency, is_service)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [d.door_id, d.building_id, d.latitude, d.longitude, bool(d.is_indoor), bool(d.is_emergency), bool(d.is_service)],
    })),
    ...ramps.map((r) => ({
      sql: "INSERT INTO ramp (id, building_id, latitude, longitude) VALUES (?, ?, ?, ?)",
      args: [r.ramp_id, r.building, r.latitude, r.longitude],
    })),
    ...validReports.map((r) => ({
      sql: `INSERT INTO report (id, location, latitude, longitude, description, status, opened_at, closed_at,
                                is_permanent, votes, image, categories, qna)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        Number(r.issue_id),
        r.location,
        Number(r.latitude),
        Number(r.longitude),
        r.description,
        r.status ?? "Open",
        toMillis(r.datetimeopen),
        toMillis(r.datetimeclosed),
        0, // the app always sends datetimePermanent: 0
        Number(r.votes) || 0,
        r.image ? r.image : null, // empty string means no photo
        JSON.stringify(Array.isArray(r.categories) ? r.categories : []),
        r.qna,
      ],
    })),
  ];

  // One transaction: either everything is replaced or nothing is.
  await db.batch(statements, "write");

  // Small fixture files for the tests (Backend-Rewrite 11).
  await writeFile("test/fixtures/buildings.json", JSON.stringify(buildings, null, 2) + "\n");
  const sampleReports = validReports.slice(0, 20).map((r) => ({ ...r, image: null }));
  await writeFile("test/fixtures/reports.json", JSON.stringify(sampleReports, null, 2) + "\n");

  console.log(`buildings: ${buildings.length} inserted`);
  console.log(`doors: ${doors.length} inserted`);
  console.log(`ramps: ${ramps.length} inserted`);
  console.log(`reports: ${validReports.length} inserted, ${skipped} skipped (outside Chapel Hill or missing data)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
