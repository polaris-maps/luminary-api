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
  const keys = ["abbreviation", "campus_id", "defaultlatitude", "defaultlongitude", "full_name", "geo_address", "location_id"];

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
  const ids = res.body.map((b: any) => b.location_id);

  expect(ids).toEqual([...ids].sort((a, b) => a - b));
});
