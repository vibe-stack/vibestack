import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import postgres from "postgres";

// Create postgres connection
const connectionString = process.env.DATABASE_URL!;
// For query building only
export const db = drizzle(postgres(connectionString), { schema });

export * from "./schema";
