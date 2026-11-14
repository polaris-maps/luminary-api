import request from "supertest";
import { beforeAll, expect, test } from "vitest";
import app from "../src/app.js";
import { findNearestBuilding } from "../src/services/buildingService.js";
import { distanceMeters } from "../src/utils/distance.js";
import { loadFixtures } from "./helpers.js";
import buildings from "./fixtures/buildings.json" with { type: "json" };

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

/// Find nearest building tests

// North Hall is about 100 m north of South Hall
const northHall = { full_name: "North Hall", latitude: 35.9009, longitude: -79.05 };
const southHall = { full_name: "South Hall", latitude: 35.9, longitude: -79.05 };
const halls = [northHall, southHall];

test("a spot exactly on a building finds that building", () => {
  expect(findNearestBuilding(halls, southHall.latitude, southHall.longitude)).toBe(southHall);
});

test("a spot near a building finds that building", () => {
  // About 22 m north of South Hall
  const spot = { latitude: 35.9002, longitude: -79.05 };

  expect(distanceMeters(spot.latitude, spot.longitude, southHall.latitude, southHall.longitude)).toBeLessThan(50);
  expect(findNearestBuilding(halls, spot.latitude, spot.longitude)).toBe(southHall);
});

test("picks the closer of two buildings", () => {
  // About 22 m south of North Hall and 78 m north of South Hall
  const spot = { latitude: 35.9007, longitude: -79.05 };

  expect(findNearestBuilding(halls, spot.latitude, spot.longitude)).toBe(northHall);
});

test("a spot more than 50 m from every building gives null", () => {
  // About 67 m south of South Hall
  const spot = { latitude: 35.8994, longitude: -79.05 };

  expect(distanceMeters(spot.latitude, spot.longitude, southHall.latitude, southHall.longitude)).toBeGreaterThan(50);
  expect(findNearestBuilding(halls, spot.latitude, spot.longitude)).toBeNull();
});

test("a spot between two buildings but more than 50 m from both gives null", () => {
  // Off to the east, about halfway between the two halls
  const spot = { latitude: 35.90045, longitude: -79.0495 };

  expect(distanceMeters(spot.latitude, spot.longitude, northHall.latitude, northHall.longitude)).toBeGreaterThan(50);
  expect(distanceMeters(spot.latitude, spot.longitude, southHall.latitude, southHall.longitude)).toBeGreaterThan(50);
  expect(findNearestBuilding(halls, spot.latitude, spot.longitude)).toBeNull();
});

test("an empty list gives null", () => {
  expect(findNearestBuilding([], southHall.latitude, southHall.longitude)).toBeNull();
});

test("does not change the list it is given", () => {
  const before = structuredClone(halls);

  findNearestBuilding(halls, 35.9007, -79.05);

  expect(halls).toEqual(before);
});
