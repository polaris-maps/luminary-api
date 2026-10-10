import { query } from "../db/client";

export async function ping() {
  await query("SELECT 1");
}
