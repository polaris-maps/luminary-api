import { createClient, type InValue } from "@libsql/client";

export const db = createClient({ url: process.env.DATABASE_URL ?? "file:luminary.db" });

export async function query<T>(sql: string, args: InValue[] = []) {
  const result = await db.execute({ sql, args });
  return result.rows as unknown as T[];
}

export async function queryOne<T>(sql: string, args: InValue[] = []) {
  const rows = await query<T>(sql, args);
  return rows[0] ?? null;
}
