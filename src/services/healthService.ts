import { query } from "../db/client";

export async function getHealth() {
  try {
    await query("SELECT 1");
    return { status: "ok", db: "ok" };
  } catch {
    return { status: "ok", db: "down" };
  }
}
