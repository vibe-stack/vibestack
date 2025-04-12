import { db, files, fileVersions } from "../db";
import { sql, eq, and } from "drizzle-orm";

export class CodeSearch {
  static async searchCodebase(query: string, gameId?: string) {
    // Get all files that match the query in their path or content
    const fileVersionsQuery = db
      .select({
        fileId: fileVersions.fileId,
        content: fileVersions.content,
        version: fileVersions.version,
      })
      .from(fileVersions)
      .innerJoin(files, eq(files.id, fileVersions.fileId))
      .where(
        gameId 
          ? and(
              eq(files.gameId, gameId),
              sql`${fileVersions.content} ILIKE ${`%${query}%`}`
            )
          : sql`${fileVersions.content} ILIKE ${`%${query}%`}`
      )
      .as("latest_versions");

    // Get the latest version of each file
    const latestVersions = db
      .select({
        fileId: fileVersionsQuery.fileId,
        content: fileVersionsQuery.content,
      })
      .from(fileVersionsQuery)
      .innerJoin(
        db
          .select({
            fileId: fileVersions.fileId,
            maxVersion: sql<number>`MAX(${fileVersions.version})`,
          })
          .from(fileVersions)
          .groupBy(fileVersions.fileId)
          .as("max_versions"),
        and(
          eq(fileVersionsQuery.fileId, sql`max_versions.fileId`),
          eq(fileVersionsQuery.version, sql`max_versions.maxVersion`)
        )
      );

    // Get file paths
    const fileData = await db
      .select({
        id: files.id,
        path: files.path,
        type: files.type,
        gameId: files.gameId,
      })
      .from(files)
      .where(
        gameId
          ? and(
              eq(files.gameId, gameId),
              sql`(${files.path} ILIKE ${`%${query}%`} OR ${files.id} IN (SELECT "fileId" FROM ${latestVersions}))`
            )
          : sql`(${files.path} ILIKE ${`%${query}%`} OR ${files.id} IN (SELECT "fileId" FROM ${latestVersions}))`
      );

    // Get content for each matching file
    const results = await Promise.all(
      fileData.map(async (file) => {
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