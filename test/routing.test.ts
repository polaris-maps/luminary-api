import { expect, test } from "vitest";
import graph from "../data/graph.json";
import { buildNeighbors, findNearestPoint } from "../src/services/routingService";
import { distanceMeters } from "../src/utils/distance";

/// Find nearest point tests

const kenanLabs = { lat: 35.90914, lng: -79.05113 };

test("finds a point near Kenan Labs", () => {
  const nearest = findNearestPoint(graph.points, kenanLabs.lat, kenanLabs.lng);

  expect(nearest).not.toBeNull();
  expect(nearest!.meters).toBeLessThan(50);
});

test("meters is the distance to the point it found", () => {
  const nearest = findNearestPoint(graph.points, kenanLabs.lat, kenanLabs.lng)!;
  const meters = distanceMeters(kenanLabs.lat, kenanLabs.lng, nearest.point.lat, nearest.point.lng);

  expect(nearest.meters).toBe(meters);
});

test("no point on the map is closer than the one it found", () => {
  const nearest = findNearestPoint(graph.points, kenanLabs.lat, kenanLabs.lng)!;

  let closer = 0;
  for (const point of graph.points) {
    if (distanceMeters(kenanLabs.lat, kenanLabs.lng, point.lat, point.lng) < nearest.meters) closer++;
  }

  expect(closer).toBe(0);
});

test("a spot exactly on a point finds that point", () => {
  const point = graph.points[100];
  const nearest = findNearestPoint(graph.points, point.lat, point.lng);

  expect(nearest).toEqual({ point, meters: 0 });
});

test("a spot off campus gives null", () => {
  expect(findNearestPoint(graph.points, 35.7796, -78.6382)).toBeNull();
});

test("only searches the points it's given", () => {
  const near = { id: 1, lat: 35.9, lng: -79.05 };
  const far = { id: 2, lat: 35.9005, lng: -79.05 };

  expect(findNearestPoint([near, far], 35.9001, -79.05)!.point).toBe(near);
  expect(findNearestPoint([far], 35.9001, -79.05)!.point).toBe(far);
});

test("finds points within 150 m but not farther", () => {
  const point = { id: 1, lat: 35.9, lng: -79.05 };
  const inside = { lat: 35.90126, lng: -79.05 };
  const outside = { lat: 35.90144, lng: -79.05 };

  expect(distanceMeters(inside.lat, inside.lng, point.lat, point.lng)).toBeLessThan(150);
  expect(distanceMeters(outside.lat, outside.lng, point.lat, point.lng)).toBeGreaterThan(150);

  expect(findNearestPoint([point], inside.lat, inside.lng)!.point).toBe(point);
  expect(findNearestPoint([point], outside.lat, outside.lng)).toBeNull();
});

test("an empty list gives null", () => {
  expect(findNearestPoint([], kenanLabs.lat, kenanLabs.lng)).toBeNull();
});

test("doesn't change the points it's given", () => {
  const points = [
    { id: 1, lat: 35.9, lng: -79.05 },
    { id: 2, lat: 35.9005, lng: -79.05 },
  ];
  const before = structuredClone(points);

  const nearest = findNearestPoint(points, 35.9001, -79.05)!;

  expect(points).toEqual(before);
  expect(nearest.point).toBe(points[0]);
});
/// -------------------------- ///

/// Build neighbors tests

const tinyGraph = {
  points: [
    { id: 1, lat: 0, lng: 0 },
    { id: 2, lat: 0, lng: 0 },
    { id: 3, lat: 0, lng: 0 },
    { id: 4, lat: 0, lng: 0 },
  ],
  connections: [
    { from: 1, to: 2, meters: 10, stairs: false },
    { from: 1, to: 3, meters: 15, stairs: false },
    { from: 2, to: 3, meters: 15, stairs: false },
    { from: 3, to: 4, meters: 5, stairs: true },
  ],
};

test("lists each point's neighbors on the tiny graph", () => {
  expect(buildNeighbors(tinyGraph)).toEqual({
    1: [
      { to: 2, meters: 10, stairs: false },
      { to: 3, meters: 15, stairs: false },
    ],
    2: [
      { to: 1, meters: 10, stairs: false },
      { to: 3, meters: 15, stairs: false },
    ],
    3: [
      { to: 1, meters: 15, stairs: false },
      { to: 2, meters: 15, stairs: false },
      { to: 4, meters: 5, stairs: true },
    ],
    4: [{ to: 3, meters: 5, stairs: true }],
  });
});

test("lists the neighbors of a point near Kenan Labs", () => {
  expect(buildNeighbors(graph)[442146073]).toEqual([
    { to: 442146071, meters: 9.8, stairs: false },
    { to: 1261057809, meters: 14.4, stairs: false },
  ]);
});

test("every connection shows up under both of its points", () => {
  const neighbors = buildNeighbors(graph);

  let total = 0;
  for (const id in neighbors) total += neighbors[id].length;

  expect(total).toBe(graph.connections.length * 2);
});

test("a point with no connections has no neighbors", () => {
  const neighbors = buildNeighbors({ points: [{ id: 1, lat: 0, lng: 0 }], connections: [] });

  expect(neighbors[1]).toEqual([]);
});

test("doesn't change the graph it's given", () => {
  const before = structuredClone(tinyGraph);

  buildNeighbors(tinyGraph);

  expect(tinyGraph).toEqual(before);
});
/// -------------------------- ///
