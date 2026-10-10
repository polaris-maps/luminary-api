import * as healthRepository from "../repositories/healthRepository";

export type Health = { status: "ok"; db: "ok" | "down" };

export async function getHealth(): Promise<Health> {
  try {
    await healthRepository.ping();
    return { status: "ok", db: "ok" };
  } catch {
    return { status: "ok", db: "down" };
  }
}
