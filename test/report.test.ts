import request from "supertest";
import { beforeAll, expect, test } from "vitest";
import app from "../src/app";
import { query } from "../src/db/client";
import { loadFixtures } from "./helpers";
import reports from "./fixtures/reports.json";

async function addReport(report: { id: number; [column: string]: unknown }) {
  const row = {
    location: "Test Location",
    latitude: 35.91,
    longitude: -79.05,
    description: "Test report",
    status: "Open",
    opened_at: 1700000000000,
    votes: 0,
    image: null,
    categories: "[]",
    qna: null,
    deleted_at: null,
    ...report,
  };
  await query(
    "INSERT INTO report (id, location, latitude, longitude, description, status, opened_at, votes, image, categories, qna, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      row.id,
      row.location,
      row.latitude,
      row.longitude,
      row.description,
      row.status,
      row.opened_at,
      row.votes,
      row.image,
      row.categories,
      row.qna,
      row.deleted_at,
    ],
  );
}

beforeAll(async () => {
  await loadFixtures();
  await addReport({
    id: 213,
    location: "Kenan Laboratories",
    latitude: 35.9091,
    longitude: -79.0511,
    description: "Elevator out of service",
    opened_at: 1791590400000,
    categories: '["Broken Elevator"]',
    qna: '{"obstacle":"Broken Elevator","questions":[]}',
  });
  await addReport({ id: 901, status: "Closed" });
  await addReport({ id: 902, deleted_at: 1760000000000 });
  await addReport({ id: 904, image: "", qna: "" });
});

test("GET /app/indoorIssue/all returns every open report that hasn't been deleted", async () => {
  const res = await request(app).get("/app/indoorIssue/all");
  const ids = res.body.map((r: any) => r.issue_id);

  expect(res.status).toBe(200);
  expect(res.body.length).toBe(reports.length + 2);
  expect(ids).not.toContain(901);
  expect(ids).not.toContain(902);
});

test("each report has exactly the keys the iPhone app reads", async () => {
  const res = await request(app).get("/app/indoorIssue/all");
  const keys = [
    "category",
    "datetimeopen",
    "description",
    "image",
    "issue_id",
    "latitude",
    "location",
    "longitude",
    "qna",
    "votes",
  ];

  for (const report of res.body) {
    expect(Object.keys(report).sort()).toEqual(keys);
  }
});

test("reports come back newest first", async () => {
  const res = await request(app).get("/app/indoorIssue/all");

  expect(res.body[0].issue_id).toBe(213);
  for (let i = 1; i < res.body.length; i++) {
    expect(res.body[i].datetimeopen).toBeLessThanOrEqual(res.body[i - 1].datetimeopen);
  }
});

test("issue_id, votes, and datetimeopen are always whole numbers", async () => {
  const res = await request(app).get("/app/indoorIssue/all");

  for (const report of res.body) {
    expect(Number.isInteger(report.issue_id)).toBe(true);
    expect(Number.isInteger(report.votes)).toBe(true);
    expect(Number.isInteger(report.datetimeopen)).toBe(true);
  }
});

test("a single report with a decimal value hides every report", async () => {
  await addReport({ id: 903, votes: 2.6, opened_at: 1700000000000.4 });

  const res = await request(app).get("/app/indoorIssue/all");

  expect(res.status).toBe(200);
  expect(res.body).toEqual([]);

  await query("DELETE FROM report WHERE id = ?", [903]);
});

test("datetimeopen is in milliseconds", async () => {
  const res = await request(app).get("/app/indoorIssue/all");

  for (const report of res.body) {
    expect(report.datetimeopen).toBeGreaterThan(10000000000);
  }
});

test("image and qna come back exactly how they're stored", async () => {
  const res = await request(app).get("/app/indoorIssue/all");
  const empty = res.body.find((r: any) => r.issue_id === 904);

  expect(empty.image).toBe("");
  expect(empty.qna).toBe("");
});

test("Kenan Laboratories comes back with the right values", async () => {
  const res = await request(app).get("/app/indoorIssue/all");
  const kenan = res.body.find((r: any) => r.issue_id === 213);

  expect(kenan).toEqual({
    issue_id: 213,
    location: "Kenan Laboratories",
    latitude: 35.9091,
    longitude: -79.0511,
    description: "Elevator out of service",
    datetimeopen: 1791590400000,
    votes: 0,
    image: null,
    category: ["Broken Elevator"],
    qna: '{"obstacle":"Broken Elevator","questions":[]}',
  });
});
