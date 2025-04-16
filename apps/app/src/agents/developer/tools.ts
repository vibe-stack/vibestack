import { tool } from "ai";
import { z } from "zod";
import { FileSystem } from "../../lib/services/file-system";
import { CodeSearch } from "../../lib/services/code-search";

export const searchCodebase = tool({
  description:
    "List all files for a specific game. This tool returns all files belonging to a game rather than performing a search.",
  parameters: z.object({
    gameId: z.string().describe("The game ID for which to list all files."),
    includePreview: z.boolean().optional().describe("Whether to include a preview of the file content."),
  }),
  execute: async ({ gameId, includePreview }) => {
    console.log(`[Tool Execution] searchCodebase - GameID: ${gameId}`);
    if (!gameId) {
      console.log(`[Tool Result] searchCodebase - Error: GameID is required`);
      return {
        matches: [],
        error: "GameID is required to list files",
      };
    }

    const results = await CodeSearch.searchCodebase(gameId);
    console.log(`[Tool Result] searchCodebase - Found ${results.length} files`);
    return {
      matches: results.map((file) => ({
        path: file.path,
        type: file.type,
        gameId: file.gameId,
        preview: includePreview
          ? file.content.substring(0, 200) +
            (file.content.length > 200 ? "..." : "")
          : undefined,
      })),
    };
  },
});

export const readFile = tool({
  description: "Read the contents of a specific file by path. Only gives you a max of 200 lines, use the fromLine parameter to read more after that.",
  parameters: z.object({
    fileId: z.string().describe('The file path (e.g., "main.js").'),
    gameId: z
      .string()
      .describe("The game ID where the file is located. This is REQUIRED."),
    fromLine: z.number().optional().describe("The line number to start reading from."),
  }),
  execute: async ({ fileId, gameId, fromLine = 0 }) => {
    console.log(
      `[Tool Execution] readFile - FileID/Path: ${fileId}, GameID: ${gameId}, fromLine: ${fromLine}`
    );

    if (!gameId) {
      console.log(`[Tool Result] readFile - Error: GameID is required`);
      return { error: "GameID is required to find the file" };
    }

    try {
      // First try to get the file by path (most common scenario)
      let file = await FileSystem.getFileByPath(gameId, fileId);

      // If not found by path, try by ID (less common)
      if (!file) {
        try {
          file = await FileSystem.getFile(fileId);
          // Verify the file belongs to the specified game
          if (file && file.gameId !== gameId) {
            return {
              error: `File exists but belongs to a different game (${file.gameId})`,
            };
          }
        } catch (error) {
          console.error(error);
          // Likely not a valid UUID, which is fine since we already tried by path
          console.log(
            `[Tool Result] readFile - Error: File with ID ${fileId} not found`
          );
          return { error: `File with ID ${fileId} not found` };
        }
      }

      if (!file) {
        console.log(
          `[Tool Result] readFile - Error: File '${fileId}' not found in game ${gameId}`
        );
        return { error: `File '${fileId}' not found in game ${gameId}` };
      }

      // Get the content of the found file
      let content = await FileSystem.getFileContent(file.id);

      // Apply line filtering
      const lines = content.split('\n');
      const start = fromLine;
      const end = Math.min(start + 200, lines.length); // Limit to 200 lines or end of file

      content = lines.slice(start, end).join('\n');

      console.log(
        `[Tool Result] readFile - Success: Retrieved file ${file.path}, lines ${start}-${end}`
      );

      return {
        path: file.path,
        type: file.type,
        content,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.log(`[Tool Result] readFile - Error: ${errorMessage}`);
      return { error: errorMessage };
    }
  },
});

export const createFile = tool({
  description: "Create a new file with the specified content in the codebase.",
  parameters: z.object({
    gameId: z.string().describe("The ID of the game this file belongs to."),
    path: z.string().describe("The path where the new file should be created."),
    type: z.string().describe("The type of file (js, html, css, asset, etc.)."),
    content: z.string().describe("The content to be written to the new file."),
    commitMessage: z
      .string()
      .optional()
      .describe("Optional commit message for this file creation."),
  }),
  execute: async ({ gameId, path, type, content, commitMessage }) => {
    console.log(
      `[Tool Execution] createFile - GameID: ${gameId}, Path: ${path}, Type: ${type}`
    );
    try {
      const result = await FileSystem.createFile({
        gameId,
        path,
        type,
        content,
        commitMessage,
        createdBy: "assistant",
      });

      console.log(
        `[Tool Result] createFile - Success: Created file ${path} with ID ${result.file.id}`
      );
      return {
        success: true,
        fileId: result.file.id,
        versionId: result.version.id,
        path,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.log(`[Tool Result] createFile - Error: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

export const patchFile = tool({
  description: "Modify an existing file with the specified patches or changes.",
  parameters: z.object({
    gameId: z.string().describe("The ID of the game this file belongs to."),
    filePath: z.string().describe("The path of the file to be modified."),
    content: z.string().describe("The new content for the file."),
    commitMessage: z
      .string()
      .optional()
      .describe("Optional commit message for this modification."),
  }),
  execute: async ({ gameId, filePath, content, commitMessage }) => {
    console.log(`[Tool Execution] patchFile - FileID: ${filePath}`);
    try {
      const file = await FileSystem.getFileByPath(gameId, filePath);
      if (!file) {
        console.log(
          `[Tool Result] patchFile - Error: File with ID ${filePath} not found`
        );
        return { success: false, error: `File with ID ${filePath} not found` };
      }

      const version = await FileSystem.updateFile({
        fileId: file.id,
        content,
        commitMessage,
        createdBy: "assistant",
      });

      console.log(
        `[Tool Result] patchFile - Success: Updated file ${file.path} with version ${version.id}`
      );
      return {
        success: true,
        fileId: file.id,
        versionId: version.id,
        path: file.path,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.log(`[Tool Result] patchFile - Error: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

export const updateFile = tool({
  description: "Update a specified file with the specified content.",
  parameters: z.object({
    gameId: z.string().describe("The ID of the game this file belongs to."),
    filePath: z.string().describe("The path of the file to be updated."),
    content: z.string().describe("The new content for the file."),
    commitMessage: z
      .string()
      .optional()
      .describe("Optional commit message for this modification."),
  }),
  execute: async ({ gameId, filePath, content, commitMessage }) => {
    console.log(`[Tool Execution] updateFile - FileID: ${filePath}`);
    try {
      const file = await FileSystem.getFileByPath(gameId, filePath);

      if (!file) {
        console.log(
          `[Tool Result] updateFile - Error: File with path ${filePath} not found`
        );
        return { success: false, error: `File with path ${filePath} not found` };
      }

      const version = await FileSystem.updateFile({
        fileId: file.id,
        content,
        commitMessage,
        createdBy: "assistant",
      });

      console.log(
        `[Tool Result] updateFile - Success: Updated file ${file.path} with version ${version.id}`
      );
      return {
        success: true,
        path: file.path,
        versionId: version.id,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.log(`[Tool Result] updateFile - Error: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  },
});

export const deleteFile = tool({
  description: "Delete a specified file from the codebase.",
  parameters: z.object({
    gameId: z.string().describe("The ID of the game this file belongs to."),
    filePath: z.string().describe("The path of the file to be deleted."),
  }),
  execute: async ({ gameId, filePath }) => {
    console.log(`[Tool Execution] deleteFile - FileID: ${filePath}`);
    try {
      const file = await FileSystem.getFileByPath(gameId, filePath);
      if (!file) {
        console.log(
          `[Tool Result] deleteFile - Error: File with ID ${filePath} not found`
        );
        return { success: false, error: `File with ID ${filePath} not found` };
      }
      await FileSystem.deleteFile(file.id);
      console.log(
        `[Tool Result] deleteFile - Success: Deleted file with ID ${file.id} from game ${gameId}`
      );
      return {
        success: true,
        fileId: file.id,
        gameId: gameId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.log(`[Tool Result] deleteFile - Error: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

export const developerTools = {
  searchCodebase,
  readFile,
  createFile,
  patchFile,
  deleteFile,
};
