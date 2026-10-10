import { createClient } from "@libsql/client";

// Locally this is a file called luminary.db. The team lead sets DATABASE_URL for production.
export const db = createClient({ url: process.env.DATABASE_URL ?? "file:luminary.db" });
