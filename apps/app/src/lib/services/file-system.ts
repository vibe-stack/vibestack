import { db, games, files, fileVersions, commits, commitFiles } from "../db";
import { eq, desc, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { GameChatService } from "./game-chat";

export type NewGame = {
  name: string;
  description?: string;
};

export type NewFile = {
  gameId: string;
  path: string;
  type: string;
  content: string;
  commitMessage?: string;
  createdBy?: string;
};

export type UpdateFile = {
  fileId: string;
  content: string;
  commitMessage?: string;
  createdBy?: string;
};

export type Commit = {
  gameId: string;
  message: string;
  createdBy?: string;
  files: {
    fileId: string;
    content: string;
  }[];
};

export class FileSystem {
  // Game operations
  static async createGame(data: NewGame) {
    const gameId = uuidv4();
    const now = Date.now();
    const inserted = await db
      .insert(games)
      .values({
        id: gameId,
        name: data.name,
        description: data.description || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Create a default chat thread for the new game
    await GameChatService.createThread(gameId, "Thread 1");

    return inserted[0];
  }

  static async getGame(id: string) {
    const result = await db.select().from(games).where(eq(games.id, id));
    return result[0];
  }

  static async listGames() {
    return db.select().from(games).orderBy(desc(games.updatedAt));
  }

  // File operations
  static async createFile(data: NewFile) {
    // Create file record
    const fileId = uuidv4();
    const now = Date.now();
    const fileRecord = await db
      .insert(files)
      .values({
        id: fileId,
        gameId: data.gameId,
        path: data.path,
        type: data.type,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Create initial version
    const versionId = uuidv4();
    const versionRecord = await db
      .insert(fileVersions)
      .values({
        id: versionId,
        fileId,
        content: data.content,
        version: 1,
        commitMessage: data.commitMessage || null,
        createdBy: data.createdBy || "user",
        createdAt: now,
      })
      .returning();

    // Update game's updatedAt timestamp
    await db
      .update(games)
      .set({
        updatedAt: Date.now(),
      })
      .where(eq(games.id, data.gameId));

    return {
      file: fileRecord[0],
      version: versionRecord[0],
    };
  }

  static async updateFile(data: UpdateFile) {
    // Get the file record
    const fileResult = await db
      .select()
      .from(files)
      .where(eq(files.id, data.fileId));

    if (!fileResult.length) {
      throw new Error(`File with ID ${data.fileId} not found`);
    }

    const fileRecord = fileResult[0];

    // Get the latest version number
    const versionResult = await db
      .select()
      .from(fileVersions)
      .where(eq(fileVersions.fileId, data.fileId))
      .orderBy(desc(fileVersions.version));

    const latestVersion = versionResult[0];
    const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

    // Create new version
    const versionId = uuidv4();
    const now = Date.now();
    const newVersionRecord = await db
      .insert(fileVersions)
      .values({
        id: versionId,
        fileId: data.fileId,
        content: data.content,
        version: nextVersion,
        commitMessage: data.commitMessage || null,
        createdBy: data.createdBy || "user",
        createdAt: now,
      })
      .returning();

    // Update file's updatedAt timestamp
    await db
      .update(files)
      .set({
        updatedAt: Date.now(),
      })
      .where(eq(files.id, data.fileId));

    // Update game's updatedAt timestamp
    await db
      .update(games)
      .set({
        updatedAt: Date.now(),
      })
      .where(eq(games.id, fileRecord.gameId));

    return newVersionRecord[0];
  }

  static async deleteFile(fileId: string) {
    // Get the file record first to make sure it exists and to get the gameId
    const fileResult = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId));

    if (!fileResult.length) {
      throw new Error(`File with ID ${fileId} not found`);
    }

    const fileRecord = fileResult[0];

    // Delete all file versions first
    await db.delete(fileVersions).where(eq(fileVersions.fileId, fileId));

    // Delete any commit file associations
    // Note: This will not delete the actual commits, as a commit might reference multiple files
    const versionsToDelete = await db
      .select({ id: fileVersions.id })
      .from(fileVersions)
      .where(eq(fileVersions.fileId, fileId));

    for (const version of versionsToDelete) {
      await db
        .delete(commitFiles)
        .where(eq(commitFiles.fileVersionId, version.id));
    }

    // Finally delete the file itself
    await db.delete(files).where(eq(files.id, fileId));

    // Update game's updatedAt timestamp
    await db
      .update(games)
      .set({
        updatedAt: Date.now(),
      })
      .where(eq(games.id, fileRecord.gameId));

    return { success: true, fileId, gameId: fileRecord.gameId };
  }

  static async getFile(id: string) {
    const result = await db.select().from(files).where(eq(files.id, id));
    return result[0];
  }

  static async getFileByPath(gameId: string, filePath: string) {
    const result = await db
      .select()
      .from(files)
      .where(and(eq(files.gameId, gameId), eq(files.path, filePath)));
    return result[0];
  }

  static async getFileContent(id: string) {
    // Get the latest version of the file
    const result = await db
      .select()
      .from(fileVersions)
      .where(eq(fileVersions.fileId, id))
      .orderBy(desc(fileVersions.version))
      .limit(1);

    return result[0]?.content || "";
  }

  static async listFiles(gameId: string) {
    return db
      .select()
      .from(files)
      .where(eq(files.gameId, gameId))
      .orderBy(files.path);
  }

  static async getFileHistory(fileId: string) {
    return db
      .select()
      .from(fileVersions)
      .where(eq(fileVersions.fileId, fileId))
      .orderBy(desc(fileVersions.version));
  }

  // Commit operations (Git-like functionality)
  static async createCommit(data: Commit) {
    // Create commit record
    const commitId = uuidv4();
    const now = Date.now();
    const commitRecord = await db
      .insert(commits)
      .values({
        id: commitId,
        gameId: data.gameId,
        message: data.message,
        createdBy: data.createdBy || "user",
        createdAt: now,
      })
      .returning();

    // Process each file in the commit
    for (const fileData of data.files) {
      // Create new version for the file
      const versionRecord = await this.updateFile({
        fileId: fileData.fileId,
        content: fileData.content,
        createdBy: data.createdBy,
      });

      // Link file version to the commit
      await db.insert(commitFiles).values({
        id: uuidv4(),
        commitId,
        fileVersionId: versionRecord.id,
      });
    }

    // Update game's updatedAt timestamp
    await db
      .update(games)
      .set({
        updatedAt: Date.now(),
      })
      .where(eq(games.id, data.gameId));

    return commitRecord[0];
  }

  static async getCommit(id: string) {
    const result = await db.select().from(commits).where(eq(commits.id, id));
    return result[0];
  }

  static async listCommits(gameId: string) {
    return db
      .select()
      .from(commits)
      .where(eq(commits.gameId, gameId))
      .orderBy(desc(commits.createdAt));
  }
}
