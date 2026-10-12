import * as healthRepository from "../repositories/healthRepository";

export async function getHealth() {
  try {
    await healthRepository.ping();
    return { status: "ok", db: "ok" };
  } catch {
    return { status: "ok", db: "down" };
  }
}
