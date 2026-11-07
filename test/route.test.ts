import request from "supertest";
import { beforeAll, expect, test } from "vitest";
import app from "../src/app.js";
import { findWalkingRoute, prepareMap } from "../src/services/routingService.js";
import { loadFixtures } from "./helpers.js";

beforeAll(loadFixtures);

/// Find walking route tests

// Point 1 is the start and point 3 is the end. The straight way, 1 → 2 → 3, uses stairs.
// Two longer ways go around: east through point 4 and west through point 5.
// Point 6 can only be reached by stairs, and point 7 isn't connected to anything.
const campus = prepareMap({
  points: [
    { id: 1, lat: 35.9, lng: -79.05 },
    { id: 2, lat: 35.9009, lng: -79.05 },
    { id: 3, lat: 35.9018, lng: -79.05 },
    { id: 4, lat: 35.9009, lng: -79.049 },
    { id: 5, lat: 35.9009, lng: -79.0511 },
    { id: 6, lat: 35.9035, lng: -79.05 },
    { id: 7, lat: 35.91, lng: -79.05 },
  ],
  connections: [
    { from: 1, to: 2, meters: 100, stairs: false },
    { from: 2, to: 3, meters: 100, stairs: true },
    { from: 1, to: 4, meters: 135, stairs: false },
    { from: 4, to: 3, meters: 135, stairs: false },
    { from: 1, to: 5, meters: 150, stairs: false },
    { from: 5, to: 3, meters: 150, stairs: false },
    { from: 3, to: 6, meters: 189, stairs: true },
  ],
});

const start = { latitude: 35.8999, longitude: -79.05 };
const end = { latitude: 35.9019, longitude: -79.05 };
const onEastWay = { latitude: 35.90045, longitude: -79.0495 };
const onWestWay = { latitude: 35.90045, longitude: -79.05055 };
const onStraightWay = { latitude: 35.90045, longitude: -79.05 };

function trip(changes: object = {}) {
  return { start, end, avoidStairs: false, avoid: [], ...changes };
}

function report(spot: { latitude: number; longitude: number }, obstacle: string) {
  return {
    issue_id: 1,
    location: null,
    ...spot,
    description: null,
    datetimeopen: 1,
    votes: 0,
    image: null,
    category: [],
    qna: JSON.stringify({ obstacle, questions: [] }),
  };
}

function pathThrough(ids: number[], from = start, to = end) {
  const points = ids.map((id) => campus.map.points.find((point) => point.id === id)!);
  return [from, ...points.map((point) => ({ latitude: point.lat, longitude: point.lng })), to];
}

test("gives the shortest walk", () => {
  expect(findWalkingRoute(campus, trip(), []).path).toEqual(pathThrough([1, 2, 3]));
});

test("avoiding stairs takes a longer walk with no stairs", () => {
  expect(findWalkingRoute(campus, trip({ avoidStairs: true }), []).path).toEqual(pathThrough([1, 4, 3]));
});

test("goes around a Construction report", () => {
  const reports = [report(onEastWay, "Construction")];

  expect(findWalkingRoute(campus, trip({ avoidStairs: true }), reports).path).toEqual(pathThrough([1, 5, 3]));
});

test("walks right past a Puddle the person didn't ask to avoid", () => {
  const reports = [report(onEastWay, "Puddle")];

  expect(findWalkingRoute(campus, trip({ avoidStairs: true }), reports).path).toEqual(pathThrough([1, 4, 3]));
});

test("goes around a Puddle the person asked to avoid", () => {
  const reports = [report(onEastWay, "Puddle")];
  const route = findWalkingRoute(campus, trip({ avoidStairs: true, avoid: ["Puddle"] }), reports);

  expect(route.path).toEqual(pathThrough([1, 5, 3]));
});

test("goes around a report on the straight way", () => {
  const reports = [report(onStraightWay, "Construction")];

  expect(findWalkingRoute(campus, trip(), reports).path).toEqual(pathThrough([1, 4, 3]));
});

test("takes the shortest walk anyway when reports block every way without stairs", () => {
  const reports = [report(onEastWay, "Construction"), report(onWestWay, "Construction")];

  expect(findWalkingRoute(campus, trip({ avoidStairs: true }), reports).path).toEqual(pathThrough([1, 4, 3]));
});

test("never uses stairs the person asked to avoid, even to get around a report", () => {
  const reports = [report(onEastWay, "Construction"), report(onWestWay, "Construction")];
  const route = findWalkingRoute(campus, trip({ avoidStairs: true }), reports);

  expect(route.path).not.toContainEqual({ latitude: 35.9009, longitude: -79.05 });
});

test("reaches a spot behind stairs when not avoiding stairs", () => {
  const behindStairs = { latitude: 35.9035, longitude: -79.05 };
  const route = findWalkingRoute(campus, trip({ end: behindStairs }), []);

  expect(route.path).toEqual(pathThrough([1, 2, 3, 6], start, behindStairs));
});

test("a spot you can only reach by stairs gives 404 when avoiding stairs", () => {
  const behindStairs = { latitude: 35.9035, longitude: -79.05 };

  expect(() => findWalkingRoute(campus, trip({ end: behindStairs, avoidStairs: true }), [])).toThrow(
    "No route without stairs",
  );
});

test("a start off the map gives 400", () => {
  const raleigh = { latitude: 35.7796, longitude: -78.6382 };

  expect(() => findWalkingRoute(campus, trip({ start: raleigh }), [])).toThrow("Start is not near a path");
  expect(() => findWalkingRoute(campus, trip({ start: raleigh, avoidStairs: true }), [])).toThrow(
    "Start is not near a path",
  );
});

test("an end off the map gives 400", () => {
  const raleigh = { latitude: 35.7796, longitude: -78.6382 };

  expect(() => findWalkingRoute(campus, trip({ end: raleigh }), [])).toThrow("End is not near a path");
});

test("a start with no way to the end gives 404", () => {
  const alone = { latitude: 35.91, longitude: -79.05 };

  expect(() => findWalkingRoute(campus, trip({ start: alone }), [])).toThrow("No route found");
});

test("the distance includes getting onto and off the map", () => {
  const route = findWalkingRoute(campus, trip(), []);

  expect(route.distance).toBeGreaterThan(200);
  expect(route.distance).toBeLessThan(225);
});

/// POST /app/route tests

const kenanLabs = { latitude: 35.90914, longitude: -79.05113 };
const artStudio = { latitude: 35.89985, longitude: -79.04611 };

test("POST /app/route sends a walk across campus", async () => {
  const res = await request(app).post("/app/route").send({ start: kenanLabs, end: artStudio });

  expect(res.status).toBe(200);
  expect(res.body.path[0]).toEqual(kenanLabs);
  expect(res.body.path.at(-1)).toEqual(artStudio);
  expect(res.body.path.length).toBeGreaterThan(2);
  expect(res.body.distance).toBeGreaterThan(0);
});

test("POST /app/route avoids stairs and obstacles when asked", async () => {
  const res = await request(app)
    .post("/app/route")
    .send({ start: kenanLabs, end: artStudio, avoidStairs: true, avoid: ["Puddle"] });

  expect(res.status).toBe(200);
  expect(res.body.path[0]).toEqual(kenanLabs);
});

test("POST /app/route gives 400 for a start off campus", async () => {
  const res = await request(app)
    .post("/app/route")
    .send({ start: { latitude: 35.7796, longitude: -78.6382 }, end: artStudio });

  expect(res.status).toBe(400);
  expect(res.body).toEqual({ status: 400, message: "Start is not near a path" });
});

test("POST /app/route gives 400 with no end", async () => {
  const res = await request(app).post("/app/route").send({ start: kenanLabs });

  expect(res.status).toBe(400);
});

test("POST /app/route gives 400 when avoidStairs isn't true or false", async () => {
  const res = await request(app).post("/app/route").send({ start: kenanLabs, end: artStudio, avoidStairs: "yes" });

  expect(res.status).toBe(400);
});
