import { createClient } from "@libsql/client";

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:luminary.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function query(sql: string, values: any[] = []): Promise<any[]> {
  const result = await db.execute({ sql, args: values });
  return result.rows;
}
