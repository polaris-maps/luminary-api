const earthRadiusMeters = 6371000;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const latChange = toRadians(lat2 - lat1);
  const lngChange = toRadians(lng2 - lng1);

  const a =
    Math.sin(latChange / 2) * Math.sin(latChange / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(lngChange / 2) * Math.sin(lngChange / 2);

  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(a));
}

//distance from spot to path code for finding how close an issue is to a route

export type Coords = { lat: number; lng: number };

// How many meters the spot is from the closest part of the path between pathStart and pathEnd.
//
// Over campus distances the map is close enough to flat that we can treat it like graph paper:
// x is how far east, y is how far north. Then we project the spot onto the path to find the
// closest part of it, and measure to there.
export function distanceToPath(spot: Coords, pathStart: Coords, pathEnd: Coords) {
  // A degree of longitude is shorter than a degree of latitude away from the equator
  // (about 0.81 as long on campus). Shrinking east–west by this much keeps x and y on the same scale.
  const eastWestScale = Math.cos(toRadians(spot.lat));

  // The path as an arrow from its start to its end
  const pathArrowX = (pathEnd.lng - pathStart.lng) * eastWestScale;
  const pathArrowY = pathEnd.lat - pathStart.lat;

  // An arrow from the start of the path to the spot
  const startToSpotX = (spot.lng - pathStart.lng) * eastWestScale;
  const startToSpotY = spot.lat - pathStart.lat;

  // The path's length squared. If it's 0, both ends are the same spot, so measure to that spot.
  // This also keeps us from dividing by zero below.
  const pathLengthSquared = pathArrowX * pathArrowX + pathArrowY * pathArrowY;
  if (pathLengthSquared === 0) {
    return distanceMeters(spot.lat, spot.lng, pathStart.lat, pathStart.lng);
  }

  // The dot product of the two arrows: how far the spot's shadow falls along the path,
  // multiplied by the path's length
  const dotProduct = startToSpotX * pathArrowX + startToSpotY * pathArrowY;

  // Projection: dividing by the length squared turns the dot product into a fraction of the path,
  // where 0 is the start and 1 is the end
  const fractionAlongPath = dotProduct / pathLengthSquared;

  // The projection treats the path as a line that goes on forever, but ours stops at its ends.
  // If the shadow falls before the start or past the end, the closest part is that end.
  if (fractionAlongPath <= 0) {
    return distanceMeters(spot.lat, spot.lng, pathStart.lat, pathStart.lng);
  }
  if (fractionAlongPath >= 1) {
    return distanceMeters(spot.lat, spot.lng, pathEnd.lat, pathEnd.lng);
  }

  // Otherwise the closest part is somewhere in the middle. Go the same fraction of the way
  // along the path in real latitude and longitude, and measure to there.
  const closestLat = pathStart.lat + fractionAlongPath * (pathEnd.lat - pathStart.lat);
  const closestLng = pathStart.lng + fractionAlongPath * (pathEnd.lng - pathStart.lng);

  return distanceMeters(spot.lat, spot.lng, closestLat, closestLng);
}
