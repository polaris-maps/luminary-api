import { expect, test } from "vitest";
import graph from "../data/graph.json";
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

test("the map covers north and south campus", () => {
  expect(closestPoint(35.90914, -79.05113)).toBeLessThan(50);
  expect(closestPoint(35.91415, -79.05312)).toBeLessThan(50);
  expect(closestPoint(35.89985, -79.04611)).toBeLessThan(50);
});
