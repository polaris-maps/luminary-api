import { z } from "zod";

const coordsSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const routeRequestSchema = z.object({
  start: coordsSchema,
  end: coordsSchema,
  avoidStairs: z.boolean().default(false),
  avoid: z.array(z.string()).default([]),
});

export type RouteRequest = z.infer<typeof routeRequestSchema>;

export type ReportSummary = {
  issueId: number;
  obstacle: string;
  location: string | null;
  latitude: number;
  longitude: number;
};

export type CouldNotAvoid =
  { type: "stairs"; latitude: number; longitude: number } | ({ type: "report" } & ReportSummary);

export type NearbyReport = ReportSummary & { near: "start" | "end" };
