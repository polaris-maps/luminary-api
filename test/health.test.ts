import request from "supertest";
import { beforeAll, expect, test } from "vitest";
import app from "../src/app";
import { loadFixtures } from "./helpers";

beforeAll(loadFixtures);

test("GET /app/ says the API is up", async () => {
  const res = await request(app).get("/app/");

  expect(res.status).toBe(200);
  expect(res.body).toEqual({ message: "Health Check (200)" });
});

test("GET /app/health reports the database is ok", async () => {
  const res = await request(app).get("/app/health");

  expect(res.status).toBe(200);
  expect(res.body).toEqual({ status: "ok", db: "ok" });
});

test("an unknown route returns a 404 with status and message", async () => {
  const res = await request(app).get("/app/nope");

  expect(res.status).toBe(404);
  expect(res.body).toEqual({ status: 404, message: "Route not found: GET /app/nope" });
});
