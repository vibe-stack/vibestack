import { db } from "../db";
import { apiKeys } from "../db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export class AnthropicService {
  static async saveApiKey(apiKey: string) {
    const now = Date.now();
    const existing = await db.select().from(apiKeys).where(eq(apiKeys.provider, "anthropic"));
    if (existing.length > 0) {
      await db.update(apiKeys)
        .set({ apiKey, updatedAt: now })
        .where(eq(apiKeys.provider, "anthropic"));
      return existing[0].id;
    } else {
      const id = nanoid();
      await db.insert(apiKeys).values({
        id,
        provider: "anthropic",
        apiKey,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    }
  }

  static async getApiKey() {
    const existing = await db.select().from(apiKeys).where(eq(apiKeys.provider, "anthropic"));
    return existing.length > 0 ? existing[0].apiKey : null;
  }
} 