import { expect, test } from "vitest";
import graph from "../data/graph.json";
import { getPoint } from "../src/utils/graph";
import { distanceMeters, distanceToPath } from "../src/utils/distance";

/// Distance to path tests

// A path running north for about 1.1 km
const pathStart = { lat: 35.9, lng: -79.05 };
const pathEnd = { lat: 35.91, lng: -79.05 };

test("a spot beside the middle of a long path is close, even though both ends are far", () => {
  const spot = { lat: 35.905, lng: -79.0499 };
  const meters = distanceToPath(spot, pathStart, pathEnd);

  expect(distanceMeters(spot.lat, spot.lng, pathStart.lat, pathStart.lng)).toBeGreaterThan(500);
  expect(distanceMeters(spot.lat, spot.lng, pathEnd.lat, pathEnd.lng)).toBeGreaterThan(500);

  expect(meters).toBeLessThan(15);
  expect(meters).toBeCloseTo(distanceMeters(spot.lat, spot.lng, 35.905, -79.05), 0);
});

test("a spot nearest the start is the distance to the start", () => {
  const spot = { lat: 35.899, lng: -79.0501 };

  expect(distanceToPath(spot, pathStart, pathEnd)).toBe(
    distanceMeters(spot.lat, spot.lng, pathStart.lat, pathStart.lng),
  );
});

test("a spot nearest the end is the distance to the end", () => {
  const spot = { lat: 35.911, lng: -79.0499 };

  expect(distanceToPath(spot, pathStart, pathEnd)).toBe(distanceMeters(spot.lat, spot.lng, pathEnd.lat, pathEnd.lng));
});

test("a path whose ends are the same spot is the distance to that spot", () => {
  const spot = { lat: 35.901, lng: -79.0499 };
  const meters = distanceToPath(spot, pathStart, pathStart);

  expect(meters).toBe(distanceMeters(spot.lat, spot.lng, pathStart.lat, pathStart.lng));
});

test("a spot on the path is about 0", () => {
  const spot = { lat: 35.905, lng: -79.05 };

  expect(distanceToPath(spot, pathStart, pathEnd)).toBeLessThan(0.5);
});

test("the order of the ends doesn't matter", () => {
  const spot = { lat: 35.903, lng: -79.0497 };

  expect(distanceToPath(spot, pathEnd, pathStart)).toBeCloseTo(distanceToPath(spot, pathStart, pathEnd), 6);
});

test("measures to the middle of an east–west path", () => {
  const westEnd = { lat: 35.9, lng: -79.055 };
  const eastEnd = { lat: 35.9, lng: -79.045 };
  const spot = { lat: 35.9001, lng: -79.05 };

  expect(distanceToPath(spot, westEnd, eastEnd)).toBeCloseTo(distanceMeters(spot.lat, spot.lng, 35.9, -79.05), 0);
});

test("measures to the closest part of a diagonal path", () => {
  // A path heading northeast, with the spot off to its northwest
  const southwestEnd = { lat: 35.9, lng: -79.05 };
  const northeastEnd = { lat: 35.902, lng: -79.0475 };
  const spot = { lat: 35.9013, lng: -79.0491 };

  // Walk the path in 10,000 small steps and keep the closest one
  let closestWalked = Infinity;
  for (let step = 0; step <= 10000; step++) {
    const fraction = step / 10000;
    const lat = southwestEnd.lat + fraction * (northeastEnd.lat - southwestEnd.lat);
    const lng = southwestEnd.lng + fraction * (northeastEnd.lng - southwestEnd.lng);
    const meters = distanceMeters(spot.lat, spot.lng, lat, lng);
    if (meters < closestWalked) closestWalked = meters;
  }

  expect(distanceToPath(spot, southwestEnd, northeastEnd)).toBeCloseTo(closestWalked, 1);
});

test("a spot halfway along a real campus path is about 0", () => {
  const connection = graph.connections.find((c) => c.meters > 40)!;
  const from = getPoint(connection.from)!;
  const to = getPoint(connection.to)!;
  const halfway = { lat: (from.lat + to.lat) / 2, lng: (from.lng + to.lng) / 2 };

  expect(distanceToPath(halfway, from, to)).toBeLessThan(1);
});

test("doesn't change the spots it's given", () => {
  const spot = { lat: 35.905, lng: -79.0499 };
  const start = { ...pathStart };
  const end = { ...pathEnd };

  distanceToPath(spot, start, end);

  expect(spot).toEqual({ lat: 35.905, lng: -79.0499 });
  expect(start).toEqual(pathStart);
  expect(end).toEqual(pathEnd);
});
/// -------------------------- ///
