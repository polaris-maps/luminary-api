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
