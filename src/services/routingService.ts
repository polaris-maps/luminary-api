import { Point } from "../schemas/graphSchema";
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
