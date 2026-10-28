import { AppCoords, BlockedConnection, Graph, Neighbor, Point, Route } from "../schemas/graphSchema";
import { distanceMeters } from "../utils/distance";

const maxSnapMeters = 150;

export function findNearestPoint(points: Point[], lat: number, lng: number) {
  let nearest: Point | null = null;
  let nearestMeters = Infinity;

  for (const point of points) {
    const meters = distanceMeters(lat, lng, point.lat, point.lng);
    if (meters < nearestMeters) {
      nearest = point;
      nearestMeters = meters;
    }
  }

  if (!nearest || nearestMeters > maxSnapMeters) return null;
  return { point: nearest, meters: nearestMeters };
}

export function buildNeighbors(graph: Graph) {
  const neighbors: Record<number, Neighbor[]> = {};

  for (const point of graph.points) {
    neighbors[point.id] = [];
  }

  for (const { from, to, meters, stairs } of graph.connections) {
    neighbors[from].push({ to, meters, stairs });
    neighbors[to].push({ to: from, meters, stairs });
  }

  return neighbors;
}

export function findStairs(graph: Graph) {
  return graph.connections.filter((c) => c.stairs).map(({ from, to }) => ({ from, to }));
}

export function findPointsReachableWithoutStairs(graph: Graph) {
  const neighbors = buildNeighbors({ points: graph.points, connections: graph.connections.filter((c) => !c.stairs) });
  const visited: Record<number, boolean> = {};
  let biggest: number[] = [];

  for (const point of graph.points) {
    if (visited[point.id]) continue;

    visited[point.id] = true;
    const group = [point.id];
    for (let i = 0; i < group.length; i++) {
      for (const neighbor of neighbors[group[i]]) {
        if (visited[neighbor.to]) continue;
        visited[neighbor.to] = true;
        group.push(neighbor.to);
      }
    }

    if (group.length > biggest.length) biggest = group;
  }

  const inBiggest: Record<number, boolean> = {};
  for (const id of biggest) inBiggest[id] = true;
  return graph.points.filter((point) => inBiggest[point.id]);
}

function isBlocked(blocked: BlockedConnection[], a: number, b: number) {
  return blocked.some((c) => (c.from === a && c.to === b) || (c.from === b && c.to === a));
}

function walkBackwards(cameFrom: Record<number, number>, start: number, end: number) {
  const path = [end];
  while (path[0] !== start) {
    path.unshift(cameFrom[path[0]]);
  }
  return path;
}

export function findShortestRoute(
  neighbors: Record<number, Neighbor[]>,
  start: number,
  end: number,
  blocked: BlockedConnection[],
) {
  if (!neighbors[start] || !neighbors[end]) return null;

  const metersTo: Record<number, number> = { [start]: 0 };
  const cameFrom: Record<number, number> = {};
  const finished: Record<number, boolean> = {};
  let unfinished = [start];

  while (unfinished.length > 0) {
    let closest = unfinished[0];
    for (const point of unfinished) {
      if (metersTo[point] < metersTo[closest]) closest = point;
    }

    if (closest === end) {
      return { path: walkBackwards(cameFrom, start, end), meters: metersTo[end] };
    }

    finished[closest] = true;
    unfinished = unfinished.filter((point) => point !== closest);

    for (const neighbor of neighbors[closest]) {
      if (finished[neighbor.to] || isBlocked(blocked, closest, neighbor.to)) continue;

      if (metersTo[neighbor.to] === undefined) {
        metersTo[neighbor.to] = Infinity;
        unfinished.push(neighbor.to);
      }

      const meters = metersTo[closest] + neighbor.meters;
      if (meters < metersTo[neighbor.to]) {
        metersTo[neighbor.to] = meters;
        cameFrom[neighbor.to] = closest;
      }
    }
  }

  return null;
}

export function formatRouteForApp(graph: Graph, start: AppCoords, end: AppCoords, route: Route) {
  const pointsById: Record<number, Point> = {};
  for (const point of graph.points) pointsById[point.id] = point;

  const points = route.path.map((id) => pointsById[id]);
  const first = points[0];
  const last = points[points.length - 1];

  const distance =
    distanceMeters(start.latitude, start.longitude, first.lat, first.lng) +
    route.meters +
    distanceMeters(last.lat, last.lng, end.latitude, end.longitude);

  return {
    path: [start, ...points.map((point) => ({ latitude: point.lat, longitude: point.lng })), end],
    distance: Math.round(distance * 10) / 10,
  };
}
