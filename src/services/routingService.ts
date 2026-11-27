import { AppCoords, BlockedConnection, Graph, Neighbor, Point, Route } from "../schemas/graphSchema.js";
import { AppReport } from "../schemas/reportSchema.js";
import { CouldNotAvoid, NearbyReport, ReportSummary, RouteRequest } from "../schemas/routeSchema.js";
import { distanceMeters, distanceToPath } from "../utils/distance.js";
import { HttpError } from "../utils/httpError.js";

const maxSnapMeters = 150;
const alwaysAvoidedObstacles = ["Construction", "Missing Sidewalk"];
const maxMetersFromTripEnd = 15;
const maxMetersFromReport = 15;

type ReportConnection = BlockedConnection & { report: AppReport };

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

export function findConnectionsNearReports(map: Graph, reports: AppCoords[]) {
  // The same check as findConnectionsNearEachReport, without saying which report each connection is near
  const nearEachReport = findConnectionsNearEachReport(map, reports);

  // Each connection once, in the order it appears on the map, even if several reports are near it
  return map.connections
    .filter(({ from, to }) => includesConnection(nearEachReport, from, to))
    .map(({ from, to }) => ({ from, to }));
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

function isSameConnection(connection: BlockedConnection, a: number, b: number) {
  // Connections go both ways, so a → b and b → a are the same connection
  if (connection.from === a && connection.to === b) {
    return true;
  }
  if (connection.from === b && connection.to === a) {
    return true;
  }
  return false;
}

function includesConnection(connections: BlockedConnection[], a: number, b: number) {
  return connections.some((connection) => isSameConnection(connection, a, b));
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
  costly: BlockedConnection[] = [],
  extraCost = 0,
) {
  if (!neighbors[start] || !neighbors[end]) return null;

  // costTo is what the search ranks points by: real meters, plus extraCost for every costly connection used.
  // metersTo is only the real meters, so the route still reports the real walk.
  const costTo: Record<number, number> = { [start]: 0 };
  const metersTo: Record<number, number> = { [start]: 0 };
  const cameFrom: Record<number, number> = {};
  const finished: Record<number, boolean> = {};
  let unfinished = [start];

  while (unfinished.length > 0) {
    let closest = unfinished[0];
    for (const point of unfinished) {
      if (costTo[point] < costTo[closest]) closest = point;
    }

    if (closest === end) {
      return { path: walkBackwards(cameFrom, start, end), meters: metersTo[end] };
    }

    finished[closest] = true;
    unfinished = unfinished.filter((point) => point !== closest);

    for (const neighbor of neighbors[closest]) {
      if (finished[neighbor.to]) continue;
      if (includesConnection(blocked, closest, neighbor.to)) continue;

      if (costTo[neighbor.to] === undefined) {
        costTo[neighbor.to] = Infinity;
        unfinished.push(neighbor.to);
      }

      // What this connection costs: its length, plus the extra cost if it's one to avoid
      let stepCost = neighbor.meters;
      if (includesConnection(costly, closest, neighbor.to)) {
        stepCost = stepCost + extraCost;
      }

      const cost = costTo[closest] + stepCost;
      if (cost < costTo[neighbor.to]) {
        costTo[neighbor.to] = cost;
        metersTo[neighbor.to] = metersTo[closest] + neighbor.meters;
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

function readObstacle(report: AppReport): string | null {
  if (!report.qna) {
    return null;
  }

  try {
    const answers = JSON.parse(report.qna);
    return answers.obstacle;
  } catch {
    return null;
  }
}

function isNear(report: AppReport, spot: AppCoords) {
  const meters = distanceMeters(report.latitude, report.longitude, spot.latitude, spot.longitude);
  return meters <= maxMetersFromTripEnd;
}

// Whether the person wants this report avoided, wherever it is
function isAvoided(report: AppReport, avoid: string[]) {
  // Without an obstacle name we can't tell what the report is
  const obstacle = readObstacle(report);
  if (!obstacle) {
    return false;
  }

  // These block everyone, so they count even if the person didn't ask
  if (alwaysAvoidedObstacles.includes(obstacle)) {
    return true;
  }

  // Everything else only counts if the person asked to avoid it
  return avoid.includes(obstacle);
}

function isAlwaysAvoided(report: AppReport) {
  const obstacle = readObstacle(report);
  if (!obstacle) {
    return false;
  }
  return alwaysAvoidedObstacles.includes(obstacle);
}

export function findReportsToAvoid(reports: AppReport[], avoid: string[], start: AppCoords, end: AppCoords) {
  return reports.filter((report) => {
    // A report right at the start or end would block every way in or out, so it never counts
    if (isNear(report, start)) {
      return false;
    }
    if (isNear(report, end)) {
      return false;
    }

    return isAvoided(report, avoid);
  });
}

function summarizeReport(report: AppReport): ReportSummary {
  return {
    issueId: report.issue_id,
    obstacle: readObstacle(report) ?? "",
    location: report.location,
    latitude: report.latitude,
    longitude: report.longitude,
  };
}

// The reports findReportsToAvoid leaves out because they're at the start or end.
// The route can't go around them, so the app tells the person about them instead.
export function findReportsNearTripEnds(reports: AppReport[], avoid: string[], start: AppCoords, end: AppCoords) {
  const nearbyReports: NearbyReport[] = [];

  for (const report of reports) {
    // Only reports the person wanted avoided are worth telling them about
    if (!isAvoided(report, avoid)) {
      continue;
    }

    if (isNear(report, start)) {
      nearbyReports.push({ ...summarizeReport(report), near: "start" });
      continue;
    }

    if (isNear(report, end)) {
      nearbyReports.push({ ...summarizeReport(report), near: "end" });
    }
  }

  return nearbyReports;
}

// Every connection within 15 m of a report, along with the report it's near,
// so a route that goes through it can say which report it was.
// A connection near two reports shows up once for each.
export function findConnectionsNearEachReport<Report extends AppCoords>(map: Graph, reports: Report[]) {
  const pointsById: Record<number, Point> = {};
  for (const point of map.points) pointsById[point.id] = point;

  const found: (BlockedConnection & { report: Report })[] = [];
  for (const report of reports) {
    const spot = { lat: report.latitude, lng: report.longitude };

    for (const { from, to } of map.connections) {
      const metersFromReport = distanceToPath(spot, pointsById[from], pointsById[to]);
      if (metersFromReport <= maxMetersFromReport) {
        found.push({ from, to, report });
      }
    }
  }

  return found;
}

export function prepareMap(map: Graph) {
  const pointsById: Record<number, Point> = {};
  for (const point of map.points) pointsById[point.id] = point;

  // The length of every connection on the map added together. No walk can be longer than this,
  // so the fallback search adds it for each stair or report connection it uses: one more avoided
  // connection then always costs more than any detour, however long.
  let avoidedCost = 0;
  for (const connection of map.connections) {
    avoidedCost = avoidedCost + connection.meters;
  }

  return {
    map,
    pointsById,
    neighbors: buildNeighbors(map),
    stairs: findStairs(map),
    pointsWithoutStairs: findPointsReachableWithoutStairs(map),
    avoidedCost,
  };
}

export type PreparedMap = ReturnType<typeof prepareMap>;

function putOnMap(campus: PreparedMap, spot: AppCoords, name: string, offMapCode: string, avoidStairs: boolean) {
  // When avoiding stairs, use a point that can be reached without them if one is close enough
  if (avoidStairs) {
    const nearestWithoutStairs = findNearestPoint(campus.pointsWithoutStairs, spot.latitude, spot.longitude);
    if (nearestWithoutStairs) {
      return nearestWithoutStairs.point.id;
    }
  }

  // Otherwise any point. If it can only be reached by stairs, the fallback search finds the route and lists them.
  const nearest = findNearestPoint(campus.map.points, spot.latitude, spot.longitude);
  if (nearest) {
    return nearest.point.id;
  }

  throw new HttpError(400, `${name} is not near a path`, offMapCode);
}

// Walks the route and lists each stair connection and report it goes through that the person asked to avoid
function findWhatRouteCouldNotAvoid(
  campus: PreparedMap,
  path: number[],
  stairs: BlockedConnection[],
  reportConnections: ReportConnection[],
) {
  const couldNotAvoid: CouldNotAvoid[] = [];
  const listedReportIds: number[] = [];

  for (let i = 1; i < path.length; i++) {
    const from = path[i - 1];
    const to = path[i];

    // Stairs: mark halfway along the staircase
    if (includesConnection(stairs, from, to)) {
      const fromPoint = campus.pointsById[from];
      const toPoint = campus.pointsById[to];
      const halfwayLat = (fromPoint.lat + toPoint.lat) / 2;
      const halfwayLng = (fromPoint.lng + toPoint.lng) / 2;
      couldNotAvoid.push({ type: "stairs", latitude: halfwayLat, longitude: halfwayLng });
    }

    // Reports: each one listed once, even if the route passes it on several connections
    for (const reportConnection of reportConnections) {
      if (!isSameConnection(reportConnection, from, to)) {
        continue;
      }

      const issueId = reportConnection.report.issue_id;
      if (listedReportIds.includes(issueId)) {
        continue;
      }

      listedReportIds.push(issueId);
      couldNotAvoid.push({ type: "report", ...summarizeReport(reportConnection.report) });
    }
  }

  return couldNotAvoid;
}

export function findWalkingRoute(campus: PreparedMap, trip: RouteRequest, reports: AppReport[]) {
  const start = putOnMap(campus, trip.start, "Start", "START_OFF_MAP", trip.avoidStairs);
  const end = putOnMap(campus, trip.end, "End", "END_OFF_MAP", trip.avoidStairs);

  // Stairs only count when the person asked to avoid them
  let stairs: BlockedConnection[] = [];
  if (trip.avoidStairs) {
    stairs = campus.stairs;
  }

  // Reports on the way, split into the ones that block everyone and the ones the person chose to avoid
  const reportsToAvoid = findReportsToAvoid(reports, trip.avoid, trip.start, trip.end);
  const alwaysAvoidedReports = reportsToAvoid.filter((report) => isAlwaysAvoided(report));
  const chosenReports = reportsToAvoid.filter((report) => !isAlwaysAvoided(report));
  const alwaysAvoidedConnections = findConnectionsNearEachReport(campus.map, alwaysAvoidedReports);
  const chosenConnections = findConnectionsNearEachReport(campus.map, chosenReports);

  const nearbyReports = findReportsNearTripEnds(reports, trip.avoid, trip.start, trip.end);

  // Normal search: everything the person wants to avoid is blocked
  const everythingAvoided = [...stairs, ...alwaysAvoidedConnections, ...chosenConnections];
  const route = findShortestRoute(campus.neighbors, start, end, everythingAvoided);
  if (route) {
    return {
      ...formatRouteForApp(campus.map, trip.start, trip.end, route),
      meetsFilters: true,
      couldNotAvoid: [],
      nearbyReports,
    };
  }

  // Fallback search: Construction and Missing Sidewalk stay blocked. Stairs and the person's chosen reports are
  // allowed, but each connection through one costs more than any walk, so the route goes through as few as possible.
  const allowedAtACost = [...stairs, ...chosenConnections];
  const closestRoute = findShortestRoute(
    campus.neighbors,
    start,
    end,
    alwaysAvoidedConnections,
    allowedAtACost,
    campus.avoidedCost,
  );
  if (!closestRoute) {
    throw new HttpError(404, "No route found", "NO_ROUTE");
  }

  return {
    ...formatRouteForApp(campus.map, trip.start, trip.end, closestRoute),
    meetsFilters: false,
    couldNotAvoid: findWhatRouteCouldNotAvoid(campus, closestRoute.path, stairs, chosenConnections),
    nearbyReports,
  };
}
