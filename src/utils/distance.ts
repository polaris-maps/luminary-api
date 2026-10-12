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
