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

const newReport = {
  location: "Kenan Laboratories",
  description: "This elevator is shit",
  latitude: 35.9091,
  longitude: -79.0511,
  datetimeOpen: 1791590400000,
  category: ["Broken Elevator"],
  image: "",
  qna: '{"obstacle":"Broken Elevator","questions":[]}',
  status: "Open",
  votes: 0,
  datetimeClosed: 0,
  datetimePermanent: 0,
};

test("POST /app/indoorIssue/add saves the report and returns it with a 200", async () => {
  const before = Date.now();
  const res = await request(app).post("/app/indoorIssue/add").send(newReport);
  const after = Date.now();

  expect(res.status).toBe(200);
  expect(res.body).toEqual({
    issue_id: expect.any(Number),
    location: "Kenan Laboratories",
    latitude: 35.9091,
    longitude: -79.0511,
    description: "This elevator is ****",
    datetimeopen: expect.any(Number),
    votes: 0,
    image: null,
    category: ["Broken Elevator"],
    qna: '{"obstacle":"Broken Elevator","questions":[]}',
  });
  expect(res.body.datetimeopen).toBeGreaterThanOrEqual(before);
  expect(res.body.datetimeopen).toBeLessThanOrEqual(after);
});

test("a saved report shows up in the reports list in the same shape", async () => {
  const added = await request(app).post("/app/indoorIssue/add").send(newReport);
  const list = await request(app).get("/app/indoorIssue/all");

  expect(list.body.find((r: any) => r.issue_id === added.body.issue_id)).toEqual(added.body);
});

test("swear words are censored in location, description, and qna", async () => {
  const res = await request(app)
    .post("/app/indoorIssue/add")
    .send({
      ...newReport,
      location: "shit hallway",
      description: "fucking puddle",
      qna: '{"obstacle":"shit","questions":[]}',
    });

  expect(res.body.location).toBe("**** hallway");
  expect(res.body.description).toBe("******* puddle");
  expect(res.body.qna).toBe('{"obstacle":"****","questions":[]}');
});

test("status, votes, datetimeClosed, and datetimePermanent are ignored", async () => {
  const added = await request(app)
    .post("/app/indoorIssue/add")
    .send({ ...newReport, status: "Closed", votes: 5, datetimeClosed: 1791590500000, datetimePermanent: 1 });
  const [row] = await query("SELECT * FROM report WHERE id = ?", [added.body.issue_id]);

  expect(added.body.votes).toBe(0);
  expect(row.status).toBe("Open");
  expect(row.votes).toBe(0);
  expect(row.closed_at).toBeNull();
  expect(row.is_permanent).toBe(0);
});

test("datetimeOpen from the app is ignored and the server's time is used", async () => {
  for (const datetimeOpen of [1791590400000.5, 4102444800000, undefined]) {
    const before = Date.now();
    const res = await request(app)
      .post("/app/indoorIssue/add")
      .send({ ...newReport, datetimeOpen });
    const after = Date.now();

    expect(res.body.datetimeopen).toBeGreaterThanOrEqual(before);
    expect(res.body.datetimeopen).toBeLessThanOrEqual(after);
  }
});

test("a report sent with a decimal datetimeOpen doesn't empty the reports list", async () => {
  await request(app)
    .post("/app/indoorIssue/add")
    .send({ ...newReport, datetimeOpen: 1791590400000.5 });
  const list = await request(app).get("/app/indoorIssue/all");

  expect(list.body.length).toBeGreaterThan(0);
});

test("an empty image is saved as null, and a real image is saved as is", async () => {
  const empty = await request(app)
    .post("/app/indoorIssue/add")
    .send({ ...newReport, image: "" });
  const photo = await request(app)
    .post("/app/indoorIssue/add")
    .send({ ...newReport, image: "photo.jpg" });

  expect(empty.body.image).toBeNull();
  expect(photo.body.image).toBe("photo.jpg");
});

test("a report with no latitude returns 400", async () => {
  const res = await request(app).post("/app/indoorIssue/add").send({ longitude: -79.0511 });

  expect(res.status).toBe(400);
  expect(res.body).toEqual({ status: 400, message: "latitude: Invalid input: expected number, received undefined" });
});

test("a report with no longitude returns 400", async () => {
  const res = await request(app).post("/app/indoorIssue/add").send({ latitude: 35.9091 });

  expect(res.status).toBe(400);
  expect(res.body).toEqual({ status: 400, message: "longitude: Invalid input: expected number, received undefined" });
});

test("a latitude outside -90 to 90 returns 400", async () => {
  const tooBig = await request(app)
    .post("/app/indoorIssue/add")
    .send({ ...newReport, latitude: 999 });
  const tooSmall = await request(app)
    .post("/app/indoorIssue/add")
    .send({ ...newReport, latitude: -91 });

  expect(tooBig.status).toBe(400);
  expect(tooBig.body).toEqual({ status: 400, message: "latitude: Too big: expected number to be <=90" });
  expect(tooSmall.status).toBe(400);
  expect(tooSmall.body).toEqual({ status: 400, message: "latitude: Too small: expected number to be >=-90" });
});

test("a longitude outside -180 to 180 returns 400", async () => {
  const tooBig = await request(app)
    .post("/app/indoorIssue/add")
    .send({ ...newReport, longitude: 181 });
  const tooSmall = await request(app)
    .post("/app/indoorIssue/add")
    .send({ ...newReport, longitude: -181 });

  expect(tooBig.status).toBe(400);
  expect(tooBig.body).toEqual({ status: 400, message: "longitude: Too big: expected number to be <=180" });
  expect(tooSmall.status).toBe(400);
  expect(tooSmall.body).toEqual({ status: 400, message: "longitude: Too small: expected number to be >=-180" });
});

async function createReport() {
  const res = await request(app).post("/app/indoorIssue/add").send(newReport);
  return res.body.issue_id;
}

test("DELETE /app/indoorIssue/delete/:id marks the report as deleted and returns 200", async () => {
  const id = await createReport();

  const before = Date.now();
  const res = await request(app).delete(`/app/indoorIssue/delete/${id}`);
  const after = Date.now();
  const rows = await query("SELECT * FROM report WHERE id = ?", [id]);

  expect(res.status).toBe(200);
  expect(res.body).toEqual({ message: "Report deleted" });
  expect(rows.length).toBe(1);
  expect(rows[0].deleted_at).toBeGreaterThanOrEqual(before);
  expect(rows[0].deleted_at).toBeLessThanOrEqual(after);
});

test("a deleted report no longer shows up in the reports list", async () => {
  const id = await createReport();

  await request(app).delete(`/app/indoorIssue/delete/${id}`);
  const res = await request(app).get("/app/indoorIssue/all");
  const ids = res.body.map((r: any) => r.issue_id);

  expect(ids).not.toContain(id);
});

test("deleting a report that's already deleted returns 404", async () => {
  const id = await createReport();

  await request(app).delete(`/app/indoorIssue/delete/${id}`);
  const res = await request(app).delete(`/app/indoorIssue/delete/${id}`);

  expect(res.status).toBe(404);
  expect(res.body).toEqual({ status: 404, message: "Report not found" });
});

test("deleting a report that doesn't exist returns 404", async () => {
  const res = await request(app).delete("/app/indoorIssue/delete/999999");

  expect(res.status).toBe(404);
  expect(res.body).toEqual({ status: 404, message: "Report not found" });
});

test("deleting with an id that isn't a number returns 400", async () => {
  const res = await request(app).delete("/app/indoorIssue/delete/abc");

  expect(res.status).toBe(400);
  expect(res.body).toEqual({ status: 400, message: "id: Invalid input: expected number, received NaN" });
});
