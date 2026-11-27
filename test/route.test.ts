import request from "supertest";
import { beforeAll, expect, test } from "vitest";
import app from "../src/app.js";
import { findWalkingRoute, prepareMap } from "../src/services/routingService.js";
import { HttpError } from "../src/utils/httpError.js";
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

function report(spot: { latitude: number; longitude: number }, obstacle: string, issue_id = 1) {
  return {
    issue_id,
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

test("a route that meets the filters says so and lists nothing it couldn't avoid", () => {
  const route = findWalkingRoute(campus, trip({ avoidStairs: true }), []);

  expect(route.meetsFilters).toBe(true);
  expect(route.couldNotAvoid).toEqual([]);
  expect(route.nearbyReports).toEqual([]);
});

// Where the stairs between points 2 and 3 get marked: halfway along them
const straightWayStairs = { type: "stairs", latitude: (35.9009 + 35.9018) / 2, longitude: -79.05 };

test("when Construction blocks every way without stairs, gives the stair route and lists the stairs", () => {
  const reports = [report(onEastWay, "Construction", 1), report(onWestWay, "Construction", 2)];
  const route = findWalkingRoute(campus, trip({ avoidStairs: true }), reports);

  expect(route.path).toEqual(pathThrough([1, 2, 3]));
  expect(route.meetsFilters).toBe(false);
  expect(route.couldNotAvoid).toEqual([straightWayStairs]);
});

test("the closest route lists the stairs and the reports it goes through, in order", () => {
  const reports = [
    report(onEastWay, "Construction", 1),
    report(onWestWay, "Construction", 2),
    report(onStraightWay, "Puddle", 3),
  ];
  const route = findWalkingRoute(campus, trip({ avoidStairs: true, avoid: ["Puddle"] }), reports);

  expect(route.path).toEqual(pathThrough([1, 2, 3]));
  expect(route.couldNotAvoid).toEqual([
    { type: "report", issueId: 3, obstacle: "Puddle", location: null, ...onStraightWay },
    straightWayStairs,
  ]);
});

test("when every way has a Puddle the person asked to avoid, goes through one on the shortest way", () => {
  const reports = [report(onEastWay, "Puddle", 1), report(onWestWay, "Puddle", 2), report(onStraightWay, "Puddle", 3)];
  const route = findWalkingRoute(campus, trip({ avoid: ["Puddle"] }), reports);

  expect(route.path).toEqual(pathThrough([1, 2, 3]));
  expect(route.meetsFilters).toBe(false);
  expect(route.couldNotAvoid).toEqual([
    { type: "report", issueId: 3, obstacle: "Puddle", location: null, ...onStraightWay },
  ]);
});

test("the closest route goes past fewer avoided things, even when that walk is longer", () => {
  // The straight way has two avoided connections (a Puddle, then Ice). The east way has one.
  const onStraightWayPastPoint2 = { latitude: 35.90135, longitude: -79.05 };
  const reports = [
    report(onStraightWay, "Puddle", 1),
    report(onStraightWayPastPoint2, "Ice", 2),
    report(onEastWay, "Puddle", 3),
    report(onWestWay, "Puddle", 4),
  ];
  const route = findWalkingRoute(campus, trip({ avoid: ["Puddle", "Ice"] }), reports);

  expect(route.path).toEqual(pathThrough([1, 4, 3]));
  expect(route.couldNotAvoid).toEqual([
    { type: "report", issueId: 3, obstacle: "Puddle", location: null, ...onEastWay },
  ]);
});

test("the distance of the closest route is the real walk, without the extra cost", () => {
  const reports = [report(onEastWay, "Construction", 1), report(onWestWay, "Construction", 2)];
  const route = findWalkingRoute(campus, trip({ avoidStairs: true }), reports);

  expect(route.distance).toBeGreaterThan(200);
  expect(route.distance).toBeLessThan(225);
});

function thrownBy(run: () => unknown) {
  try {
    run();
  } catch (error) {
    return error as HttpError;
  }
  throw new Error("Expected it to throw");
}

test("never goes through Construction, so Construction on every way gives NO_ROUTE", () => {
  const reports = [
    report(onEastWay, "Construction", 1),
    report(onWestWay, "Construction", 2),
    report(onStraightWay, "Construction", 3),
  ];
  const error = thrownBy(() => findWalkingRoute(campus, trip({ avoidStairs: true, avoid: ["Puddle"] }), reports));

  expect(error.status).toBe(404);
  expect(error.code).toBe("NO_ROUTE");
  expect(error.message).toBe("No route found");
});

test("reaches a spot behind stairs when not avoiding stairs", () => {
  const behindStairs = { latitude: 35.9035, longitude: -79.05 };
  const route = findWalkingRoute(campus, trip({ end: behindStairs }), []);

  expect(route.path).toEqual(pathThrough([1, 2, 3, 6], start, behindStairs));
  expect(route.meetsFilters).toBe(true);
});

test("a spot you can only reach by stairs gives the route with the fewest stairs when avoiding stairs", () => {
  const behindStairs = { latitude: 35.9035, longitude: -79.05 };
  const route = findWalkingRoute(campus, trip({ end: behindStairs, avoidStairs: true }), []);

  // Going east uses one staircase (3 to 6) instead of two
  expect(route.path).toEqual(pathThrough([1, 4, 3, 6], start, behindStairs));
  expect(route.meetsFilters).toBe(false);
  expect(route.couldNotAvoid).toEqual([{ type: "stairs", latitude: (35.9018 + 35.9035) / 2, longitude: -79.05 }]);
});

test("lists a Construction report near the end, since the route can't go around it", () => {
  const nearEnd = { latitude: 35.90195, longitude: -79.05 };
  const route = findWalkingRoute(campus, trip(), [report(nearEnd, "Construction", 7)]);

  expect(route.meetsFilters).toBe(true);
  expect(route.nearbyReports).toEqual([
    { issueId: 7, obstacle: "Construction", location: null, ...nearEnd, near: "end" },
  ]);
});

test("lists a Puddle near the start only when the person asked to avoid Puddles", () => {
  const nearStart = { latitude: 35.89985, longitude: -79.05 };
  const reports = [report(nearStart, "Puddle", 8)];

  expect(findWalkingRoute(campus, trip({ avoid: ["Puddle"] }), reports).nearbyReports).toEqual([
    { issueId: 8, obstacle: "Puddle", location: null, ...nearStart, near: "start" },
  ]);
  expect(findWalkingRoute(campus, trip(), reports).nearbyReports).toEqual([]);
});

test("a start off the map gives 400 with START_OFF_MAP", () => {
  const raleigh = { latitude: 35.7796, longitude: -78.6382 };

  const error = thrownBy(() => findWalkingRoute(campus, trip({ start: raleigh }), []));
  expect(error.status).toBe(400);
  expect(error.code).toBe("START_OFF_MAP");
  expect(error.message).toBe("Start is not near a path");

  const errorAvoidingStairs = thrownBy(() => findWalkingRoute(campus, trip({ start: raleigh, avoidStairs: true }), []));
  expect(errorAvoidingStairs.code).toBe("START_OFF_MAP");
});

test("an end off the map gives 400 with END_OFF_MAP", () => {
  const raleigh = { latitude: 35.7796, longitude: -78.6382 };

  const error = thrownBy(() => findWalkingRoute(campus, trip({ end: raleigh }), []));
  expect(error.status).toBe(400);
  expect(error.code).toBe("END_OFF_MAP");
  expect(error.message).toBe("End is not near a path");
});

test("a start with no way to the end gives 404 with NO_ROUTE", () => {
  const alone = { latitude: 35.91, longitude: -79.05 };

  const error = thrownBy(() => findWalkingRoute(campus, trip({ start: alone }), []));
  expect(error.status).toBe(404);
  expect(error.code).toBe("NO_ROUTE");
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
  expect(res.body).toEqual({ status: 400, code: "START_OFF_MAP", message: "Start is not near a path" });
});

test("POST /app/route gives 400 with no end", async () => {
  const res = await request(app).post("/app/route").send({ start: kenanLabs });

  expect(res.status).toBe(400);
  expect(res.body.code).toBe("INVALID_REQUEST");
});

test("POST /app/route says whether the route meets the filters and what it couldn't avoid", async () => {
  const res = await request(app).post("/app/route").send({ start: kenanLabs, end: artStudio, avoidStairs: true });

  expect(res.status).toBe(200);
  expect(typeof res.body.meetsFilters).toBe("boolean");
  expect(Array.isArray(res.body.couldNotAvoid)).toBe(true);
  expect(Array.isArray(res.body.nearbyReports)).toBe(true);
});

test("POST /app/route gives 400 when avoidStairs isn't true or false", async () => {
  const res = await request(app).post("/app/route").send({ start: kenanLabs, end: artStudio, avoidStairs: "yes" });

  expect(res.status).toBe(400);
});
