import graphJson from "../../data/graph.json" with { type: "json" };
import { Graph, Point } from "../schemas/graphSchema.js";

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
