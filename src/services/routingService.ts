import { Graph, Neighbor, Point } from "../schemas/graphSchema";
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
