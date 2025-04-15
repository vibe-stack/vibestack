import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const dbFile = `file:${process.cwd()}/sqlite.db`;
export const db = drizzle(dbFile, { schema });

export * from "./schema";
