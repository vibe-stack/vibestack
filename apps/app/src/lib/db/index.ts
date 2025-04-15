import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Create postgres connection
const connectionString = process.env.DATABASE_URL!;
// For query building only
export const db = drizzle(connectionString, { schema });

export * from "./schema";
