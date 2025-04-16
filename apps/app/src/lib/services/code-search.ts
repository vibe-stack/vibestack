import { db, fileVersions } from "../db";
import { sql, eq } from "drizzle-orm";
import { FileSystem } from "./file-system";

export class CodeSearch {
  static async searchCodebase(gameId: string) {
    // Get all files for the game with their latest content
    const gameFiles = await FileSystem.listFiles(gameId);
    
    // For each file, get the latest content
    const results = await Promise.all(
      gameFiles.map(async (file) => {
        const content = await db
          .select({ content: fileVersions.content })
          .from(fileVersions)
          .where(eq(fileVersions.fileId, file.id))
          .orderBy(sql`${fileVersions.version} DESC`)
          .limit(1);

        return {
          ...file,
          content: content[0]?.content || "",
        };
      })
    );

    return results;
  }
}