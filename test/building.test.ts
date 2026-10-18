import request from "supertest";
import { beforeAll, expect, test } from "vitest";
import app from "../src/app";
import { loadFixtures } from "./helpers";
import buildings from "./fixtures/buildings.json";

beforeAll(loadFixtures);

test("GET /app/building/all returns every building", async () => {
  const res = await request(app).get("/app/building/all");

  expect(res.status).toBe(200);
  expect(res.body.length).toBe(buildings.length);
});

test("each building has exactly the keys the iPhone app reads", async () => {
  const res = await request(app).get("/app/building/all");
  const keys = [
    "abbreviation",
    "campus_id",
    "defaultlatitude",
    "defaultlongitude",
    "full_name",
    "geo_address",
    "location_id",
  ];

  for (const building of res.body) {
    expect(Object.keys(building).sort()).toEqual(keys);
  }
});

test("Kenan Laboratories comes back with the right values", async () => {
  const res = await request(app).get("/app/building/all");
  const kenan = res.body.find((b: any) => b.location_id === 2743);

  expect(kenan).toEqual({
    location_id: 2743,
    full_name: "Kenan Laboratories",
    abbreviation: "KL",
    defaultlatitude: 35.90913912,
    defaultlongitude: -79.05112771,
    campus_id: 1,
    geo_address: "125 South Road Chapel Hill, NC 27514",
  });
});

test("buildings come back sorted by id", async () => {
  const res = await request(app).get("/app/building/all");

  for (let i = 1; i < res.body.length; i++) {
    expect(res.body[i].location_id).toBeGreaterThan(res.body[i - 1].location_id);
  }
});

test("GET /app/building/:id returns Kenan Laboratories", async () => {
  const res = await request(app).get("/app/building/2743");

  expect(res.status).toBe(200);
  expect(res.body).toEqual({
    location_id: 2743,
    full_name: "Kenan Laboratories",
    abbreviation: "KL",
    defaultlatitude: 35.90913912,
    defaultlongitude: -79.05112771,
    campus_id: 1,
    geo_address: "125 South Road Chapel Hill, NC 27514",
  });
});

test("GET /app/building/:id has the same keys as the buildings list", async () => {
  const one = await request(app).get("/app/building/2743");
  const all = await request(app).get("/app/building/all");

  expect(Object.keys(one.body).sort()).toEqual(Object.keys(all.body[0]).sort());
});

test("every onboarding building id returns a building", async () => {
  const ids = [2742, 2744, 2754, 2758, 2759, 2778, 2781, 2785, 2801, 2809, 2816, 2835];

  for (const id of ids) {
    const res = await request(app).get(`/app/building/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.location_id).toBe(id);
  }
});

test("GET /app/building/:id returns 404 for a missing building", async () => {
  const res = await request(app).get("/app/building/999999");

  expect(res.status).toBe(404);
  expect(res.body).toEqual({ status: 404, message: "Building not found" });
});

test("GET /app/building/:id returns 400 for a non-numeric id", async () => {
  const res = await request(app).get("/app/building/abc");

  expect(res.status).toBe(400);
});
