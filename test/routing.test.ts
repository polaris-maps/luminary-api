import { expect, test } from "vitest";
import graph from "../data/graph.json";
import {
  buildNeighbors,
  findNearestPoint,
  findPointsReachableWithoutStairs,
  findShortestRoute,
  findStairs,
  formatRouteForApp,
} from "../src/services/routingService";
import { distanceMeters } from "../src/utils/distance";
import { getPoint } from "../src/utils/graph";

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

/// Find shortest route tests

const tinyNeighbors = buildNeighbors(tinyGraph);

test("finds the shortest walk on the tiny graph", () => {
  expect(findShortestRoute(tinyNeighbors, 1, 2, [])).toEqual({ path: [1, 2], meters: 10 });
  expect(findShortestRoute(tinyNeighbors, 1, 4, [])).toEqual({ path: [1, 3, 4], meters: 20 });
});

test("walks connections in either direction", () => {
  expect(findShortestRoute(tinyNeighbors, 4, 1, [])).toEqual({ path: [4, 3, 1], meters: 20 });
});

test("goes around a blocked connection", () => {
  expect(findShortestRoute(tinyNeighbors, 1, 2, [{ from: 1, to: 2 }])).toEqual({ path: [1, 3, 2], meters: 30 });
});

test("a blocked connection is blocked in both directions", () => {
  expect(findShortestRoute(tinyNeighbors, 1, 2, [{ from: 2, to: 1 }])).toEqual({ path: [1, 3, 2], meters: 30 });
  expect(findShortestRoute(tinyNeighbors, 2, 1, [{ from: 1, to: 2 }])).toEqual({ path: [2, 3, 1], meters: 30 });
});

test("gives null when every way there is blocked", () => {
  expect(findShortestRoute(tinyNeighbors, 1, 4, [{ from: 3, to: 4 }])).toBeNull();
});

test("gives null for a point that isn't on the map", () => {
  expect(findShortestRoute(tinyNeighbors, 1, 99, [])).toBeNull();
  expect(findShortestRoute(tinyNeighbors, 99, 1, [])).toBeNull();
});

test("gives null for a point with no way to reach it", () => {
  const neighbors = buildNeighbors({
    points: [...tinyGraph.points, { id: 5, lat: 0, lng: 0 }],
    connections: tinyGraph.connections,
  });

  expect(findShortestRoute(neighbors, 1, 5, [])).toBeNull();
});

test("starting at the end is a walk of 0 m", () => {
  expect(findShortestRoute(tinyNeighbors, 3, 3, [])).toEqual({ path: [3], meters: 0 });
});

test("doesn't change the neighbors or blocked list it's given", () => {
  const blocked = [{ from: 1, to: 2 }];
  const neighborsBefore = structuredClone(tinyNeighbors);
  const blockedBefore = structuredClone(blocked);

  findShortestRoute(tinyNeighbors, 1, 4, blocked);

  expect(tinyNeighbors).toEqual(neighborsBefore);
  expect(blocked).toEqual(blockedBefore);
});

const campusNeighbors = buildNeighbors(graph);
const kenanLabsPoint = findNearestPoint(graph.points, 35.90914, -79.05113)!.point;
const battleHallPoint = findNearestPoint(graph.points, 35.91415, -79.05312)!.point;

function usesConnection(path: number[], a: number, b: number) {
  for (let i = 1; i < path.length; i++) {
    const from = path[i - 1];
    const to = path[i];
    if ((from === a && to === b) || (from === b && to === a)) return true;
  }
  return false;
}

test("finds a walk from Kenan Labs to Battle Hall", () => {
  const route = findShortestRoute(campusNeighbors, kenanLabsPoint.id, battleHallPoint.id, [])!;

  expect(route.path[0]).toBe(kenanLabsPoint.id);
  expect(route.path[route.path.length - 1]).toBe(battleHallPoint.id);

  let meters = 0;
  for (let i = 1; i < route.path.length; i++) {
    const step = campusNeighbors[route.path[i - 1]].find((neighbor) => neighbor.to === route.path[i]);
    expect(step).toBeDefined();
    meters += step!.meters;
  }

  expect(route.meters).toBeCloseTo(meters);
});

test("a walk on the real map goes around a blocked connection", () => {
  const route = findShortestRoute(campusNeighbors, kenanLabsPoint.id, battleHallPoint.id, [])!;
  const blocked = [{ from: route.path[1], to: route.path[2] }];

  const detour = findShortestRoute(campusNeighbors, kenanLabsPoint.id, battleHallPoint.id, blocked)!;

  expect(usesConnection(route.path, route.path[1], route.path[2])).toBe(true);
  expect(usesConnection(detour.path, route.path[1], route.path[2])).toBe(false);
  expect(detour.meters).toBeGreaterThanOrEqual(route.meters);
});
/// -------------------------- ///

/// Find stairs tests

const rowGraph = {
  points: [
    { id: 1, lat: 0, lng: 0 },
    { id: 2, lat: 0, lng: 0 },
    { id: 3, lat: 0, lng: 0 },
    { id: 4, lat: 0, lng: 0 },
    { id: 5, lat: 0, lng: 0 },
  ],
  connections: [
    { from: 1, to: 2, meters: 10, stairs: false },
    { from: 2, to: 3, meters: 10, stairs: false },
    { from: 3, to: 4, meters: 10, stairs: true },
    { from: 4, to: 5, meters: 10, stairs: false },
  ],
};

const aroundStairsGraph = {
  points: tinyGraph.points.slice(0, 3),
  connections: [
    { from: 1, to: 2, meters: 10, stairs: false },
    { from: 2, to: 3, meters: 10, stairs: false },
    { from: 1, to: 3, meters: 5, stairs: true },
  ],
};

const noStairsGraph = {
  points: rowGraph.points,
  connections: rowGraph.connections.map((c) => ({ ...c, stairs: false })),
};

test("finds the stairs on a row of points", () => {
  expect(findStairs(rowGraph)).toEqual([{ from: 3, to: 4 }]);
});

test("findShortestRoute can't use the stairs it finds", () => {
  const aroundNeighbors = buildNeighbors(aroundStairsGraph);

  expect(findShortestRoute(aroundNeighbors, 1, 3, [])).toEqual({ path: [1, 3], meters: 5 });
  expect(findShortestRoute(aroundNeighbors, 1, 3, findStairs(aroundStairsGraph))).toEqual({
    path: [1, 2, 3],
    meters: 20,
  });
  expect(findShortestRoute(tinyNeighbors, 1, 4, findStairs(tinyGraph))).toBeNull();
});

const campusStairs = findStairs(graph);

test("lists exactly the stairs connections on the real map", () => {
  const listed: Record<string, boolean> = {};
  for (const { from, to } of campusStairs) listed[`${from}-${to}`] = true;

  let wrong = 0;
  for (const c of graph.connections) {
    if (!!listed[`${c.from}-${c.to}`] !== c.stairs) wrong++;
  }

  expect(campusStairs.length).toBe(341);
  expect(wrong).toBe(0);
});
/// -------------------------- ///

/// Find points reachable without stairs tests

test("keeps the bigger group on a row of points", () => {
  expect(findPointsReachableWithoutStairs(rowGraph)).toEqual(rowGraph.points.slice(0, 3));
});

test("keeps the biggest of several groups, even when it's last on the map", () => {
  const map = {
    points: [...rowGraph.points, { id: 6, lat: 0, lng: 0 }],
    connections: [
      { from: 1, to: 2, meters: 10, stairs: true },
      { from: 2, to: 3, meters: 10, stairs: false },
      { from: 3, to: 4, meters: 10, stairs: true },
      { from: 4, to: 5, meters: 10, stairs: false },
      { from: 5, to: 6, meters: 10, stairs: false },
    ],
  };

  expect(findPointsReachableWithoutStairs(map)).toEqual(map.points.slice(3));
});

test("keeps a point that has a way around its stairs", () => {
  expect(findPointsReachableWithoutStairs(aroundStairsGraph)).toEqual(aroundStairsGraph.points);
});

test("a map with no stairs keeps every point", () => {
  expect(findPointsReachableWithoutStairs(noStairsGraph)).toEqual(rowGraph.points);
});

test("an empty map gives an empty list", () => {
  expect(findPointsReachableWithoutStairs({ points: [], connections: [] })).toEqual([]);
});

test("gives back the same points that are in the map", () => {
  const reachable = findPointsReachableWithoutStairs(rowGraph);

  for (const point of reachable) {
    expect(rowGraph.points).toContain(point);
  }
});

test("neither function changes the map it's given", () => {
  const before = structuredClone(rowGraph);

  findStairs(rowGraph);
  findPointsReachableWithoutStairs(rowGraph);

  expect(rowGraph).toEqual(before);
});

const reachablePoints = findPointsReachableWithoutStairs(graph);

test("most of the real map is reachable without stairs", () => {
  expect(reachablePoints.length).toBe(17335);
});

test("no path without stairs leads off the reachable points", () => {
  const reachable: Record<number, boolean> = {};
  for (const point of reachablePoints) reachable[point.id] = true;

  let leaks = 0;
  for (const c of graph.connections) {
    if (!c.stairs && reachable[c.from] !== reachable[c.to]) leaks++;
  }

  expect(leaks).toBe(0);
});

test("walks across campus without stairs between reachable points", () => {
  const kenanLabs = findNearestPoint(reachablePoints, 35.90914, -79.05113)!.point;
  const battleHall = findNearestPoint(reachablePoints, 35.91415, -79.05312)!.point;
  const artStudio = findNearestPoint(reachablePoints, 35.89985, -79.04611)!.point;

  expect(findShortestRoute(campusNeighbors, kenanLabs.id, battleHall.id, campusStairs)).not.toBeNull();
  expect(findShortestRoute(campusNeighbors, kenanLabs.id, artStudio.id, campusStairs)).not.toBeNull();
});

test("someone avoiding stairs at the Naval ROTC Armory still gets a route", () => {
  const armory = { lat: 35.90925612, lng: -79.05293641 };
  const closest = findNearestPoint(graph.points, armory.lat, armory.lng)!.point;
  const closestReachable = findNearestPoint(reachablePoints, armory.lat, armory.lng)!.point;

  expect(findShortestRoute(campusNeighbors, closest.id, kenanLabsPoint.id, campusStairs)).toBeNull();
  expect(findShortestRoute(campusNeighbors, closestReachable.id, kenanLabsPoint.id, campusStairs)).not.toBeNull();
});
/// -------------------------- ///

/// Format route for app tests

const smallMap = {
  points: [
    { id: 1, lat: 35.9, lng: -79.05 },
    { id: 2, lat: 35.9009, lng: -79.05 },
    { id: 3, lat: 35.9018, lng: -79.05 },
  ],
  connections: [
    { from: 1, to: 2, meters: 100, stairs: false },
    { from: 2, to: 3, meters: 100, stairs: false },
  ],
};

const southOfPoint1 = { latitude: 35.8999, longitude: -79.05 };
const northOfPoint3 = { latitude: 35.9019, longitude: -79.05 };

test("turns a route through three points into a path and distance", () => {
  expect(formatRouteForApp(smallMap, southOfPoint1, northOfPoint3, { path: [1, 2, 3], meters: 200 })).toEqual({
    path: [
      { latitude: 35.8999, longitude: -79.05 },
      { latitude: 35.9, longitude: -79.05 },
      { latitude: 35.9009, longitude: -79.05 },
      { latitude: 35.9018, longitude: -79.05 },
      { latitude: 35.9019, longitude: -79.05 },
    ],
    distance: 222.2,
  });
});

test("turns a route that's just one point into a path and distance", () => {
  const start = { latitude: 35.9008, longitude: -79.05 };
  const end = { latitude: 35.901, longitude: -79.05 };

  expect(formatRouteForApp(smallMap, start, end, { path: [2], meters: 0 })).toEqual({
    path: [
      { latitude: 35.9008, longitude: -79.05 },
      { latitude: 35.9009, longitude: -79.05 },
      { latitude: 35.901, longitude: -79.05 },
    ],
    distance: 22.2,
  });
});

test("uses route.meters for the middle instead of measuring it again", () => {
  const formatted = formatRouteForApp(smallMap, southOfPoint1, northOfPoint3, { path: [1, 2, 3], meters: 500 });

  expect(formatted.distance).toBe(522.2);
});

test("rounds the distance to one decimal", () => {
  const formatted = formatRouteForApp(smallMap, southOfPoint1, northOfPoint3, { path: [1, 2, 3], meters: 200.06 });

  expect(formatted.distance).toBe(222.3);
});

test("follows the route in the order it's given", () => {
  const formatted = formatRouteForApp(smallMap, northOfPoint3, southOfPoint1, { path: [3, 2, 1], meters: 200 });

  expect(formatted).toEqual({
    path: [
      { latitude: 35.9019, longitude: -79.05 },
      { latitude: 35.9018, longitude: -79.05 },
      { latitude: 35.9009, longitude: -79.05 },
      { latitude: 35.9, longitude: -79.05 },
      { latitude: 35.8999, longitude: -79.05 },
    ],
    distance: 222.2,
  });
});

test("finds points by id, not by where they are in the map", () => {
  const shuffled = { points: [smallMap.points[2], smallMap.points[0], smallMap.points[1]], connections: [] };
  const route = { path: [1, 2, 3], meters: 200 };

  expect(formatRouteForApp(shuffled, southOfPoint1, northOfPoint3, route)).toEqual(
    formatRouteForApp(smallMap, southOfPoint1, northOfPoint3, route),
  );
});

test("doesn't change the map, ends or route it's given", () => {
  const route = { path: [1, 2, 3], meters: 200 };
  const before = structuredClone({ smallMap, southOfPoint1, northOfPoint3, route });

  formatRouteForApp(smallMap, southOfPoint1, northOfPoint3, route);

  expect({ smallMap, southOfPoint1, northOfPoint3, route }).toEqual(before);
});

test("formats a real route from Kenan Labs to the Art Studio", () => {
  const start = { latitude: 35.90914, longitude: -79.05113 };
  const end = { latitude: 35.89985, longitude: -79.04611 };
  const onto = findNearestPoint(graph.points, start.latitude, start.longitude)!;
  const offOf = findNearestPoint(graph.points, end.latitude, end.longitude)!;
  const route = findShortestRoute(campusNeighbors, onto.point.id, offOf.point.id, [])!;

  const formatted = formatRouteForApp(graph, start, end, route);

  expect(formatted.path.length).toBe(route.path.length + 2);
  expect(formatted.path[0]).toEqual(start);
  expect(formatted.path[formatted.path.length - 1]).toEqual(end);
  for (let i = 0; i < route.path.length; i++) {
    const point = getPoint(route.path[i])!;
    expect(formatted.path[i + 1]).toEqual({ latitude: point.lat, longitude: point.lng });
  }
  expect(formatted.distance).toBeCloseTo(onto.meters + route.meters + offOf.meters, 1);
});
/// -------------------------- ///
