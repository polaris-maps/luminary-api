import graphJson from "../../data/graph.json";
import { Graph, Point } from "../schemas/graphSchema";

const graph: Graph = graphJson;

const pointsById: Record<number, Point> = {};
for (const point of graph.points) {
  pointsById[point.id] = point;
}

export function getMap() {
  return graph;
}

export function getPoint(id: number) {
  return pointsById[id] ?? null;
}
