import { createClient } from "@libsql/client";

export const db = createClient({ url: process.env.DATABASE_URL ?? "file:luminary.db" });

export async function query(sql: string, values: any[] = []): Promise<any[]> {
  const result = await db.execute({ sql, args: values });
  return result.rows;
}
