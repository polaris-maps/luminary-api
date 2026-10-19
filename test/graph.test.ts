import { expect, test } from "vitest";
import graph from "../data/graph.json";
import { getMap, getPoint } from "../src/services/graphService";
import { distanceMeters } from "../src/utils/distance";

function closestPoint(lat: number, lng: number) {
  let closest = Infinity;
  for (const point of graph.points) {
    const meters = distanceMeters(lat, lng, point.lat, point.lng);
    if (meters < closest) closest = meters;
  }
  return closest;
}

test("distanceMeters measures Kenan Labs to Battle Hall", () => {
  const meters = distanceMeters(35.90914, -79.05113, 35.91415, -79.05312);

  expect(Math.round(meters)).toBe(585);
});

test("every connection joins two points on the map", () => {
  const ids: any = {};
  for (const point of graph.points) ids[point.id] = true;

  let missing = 0;
  for (const connection of graph.connections) {
    if (!ids[connection.from] || !ids[connection.to]) missing++;
  }

  expect(missing).toBe(0);
});

test("some connections are stairs", () => {
  const stairs = graph.connections.filter((c) => c.stairs);

  expect(stairs.length).toBeGreaterThan(100);
});

test("the map covers north and south campus and the Art Studio", () => {
  expect(closestPoint(35.90914, -79.05113)).toBeLessThan(50);
  expect(closestPoint(35.91415, -79.05312)).toBeLessThan(50);
  expect(closestPoint(35.89985, -79.04611)).toBeLessThan(50);
  expect(closestPoint(35.93181, -79.0582)).toBeLessThan(50);
});

test("getMap gives back every point and connection", () => {
  const map = getMap();

  expect(map.points.length).toBe(17613);
  expect(map.connections.length).toBe(19647);
});

test("getMap gives back the same copy every time", () => {
  expect(getMap()).toBe(getMap());
});

test("getPoint finds a point by its id", () => {
  expect(getPoint(442146073)).toEqual({ id: 442146073, lat: 35.9092774, lng: -79.0508859 });
  expect(getPoint(1225004640)).toEqual({ id: 1225004640, lat: 35.899969, lng: -79.0459685 });
});

test("getPoint gives back the same point that's in the map", () => {
  const point = getMap().points[100];

  expect(getPoint(point.id)).toBe(point);
});

test("getPoint gives null for an id that isn't on the map", () => {
  expect(getPoint(1)).toBeNull();
});
