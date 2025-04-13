import { tool } from 'ai';
import { z } from 'zod';
import { FileSystem } from '../../lib/services/file-system';
import { CodeSearch } from '../../lib/services/code-search';

export const searchCodebase = tool({
  description: 'List all files for a specific game. This tool returns all files belonging to a game rather than performing a search.',
  parameters: z.object({
    gameId: z.string().describe('The game ID for which to list all files.'),
  }),
  execute: async ({ gameId }) => {
    console.log(`[Tool Execution] searchCodebase - GameID: ${gameId}`);
    if (!gameId) {
      console.log(`[Tool Result] searchCodebase - Error: GameID is required`);
      return {
        matches: [],
        error: 'GameID is required to list files',
      };
    }
    
    const results = await CodeSearch.searchCodebase(gameId);
    console.log(`[Tool Result] searchCodebase - Found ${results.length} files`);
    return {
      matches: results.map(file => ({
        path: file.path,
        type: file.type,
        gameId: file.gameId,
        preview: file.content.substring(0, 200) + (file.content.length > 200 ? '...' : ''),
      })),
    };
  },
});

export const readFile = tool({
  description: 'Read the contents of a specific file by path or ID.',
  parameters: z.object({
    fileId: z.string().describe('Either the file path (e.g., "main.js") or the file ID.'),
    gameId: z.string().describe('The game ID where the file is located. This is REQUIRED.'),
  }),
  execute: async ({ fileId, gameId }) => {
    console.log(`[Tool Execution] readFile - FileID/Path: ${fileId}, GameID: ${gameId}`);
    
    if (!gameId) {
      console.log(`[Tool Result] readFile - Error: GameID is required`);
      return { error: 'GameID is required to find the file' };
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
            return { error: `File exists but belongs to a different game (${file.gameId})` };
          }
        } catch (error) {
          // Likely not a valid UUID, which is fine since we already tried by path
        }
      }
      
      if (!file) {
        console.log(`[Tool Result] readFile - Error: File '${fileId}' not found in game ${gameId}`);
        return { error: `File '${fileId}' not found in game ${gameId}` };
      }
      
      // Get the content of the found file
      const content = await FileSystem.getFileContent(file.id);
      
      console.log(`[Tool Result] readFile - Success: Retrieved file ${file.path}`);
      return {
        path: file.path,
        type: file.type,
        content,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.log(`[Tool Result] readFile - Error: ${errorMessage}`);
      return { error: errorMessage };
    }
  },
});

export const createFile = tool({
  description: 'Create a new file with the specified content in the codebase.',
  parameters: z.object({
    gameId: z.string().describe('The ID of the game this file belongs to.'),
    path: z.string().describe('The path where the new file should be created.'),
    type: z.string().describe('The type of file (js, html, css, asset, etc.).'),
    content: z.string().describe('The content to be written to the new file.'),
    commitMessage: z.string().optional().describe('Optional commit message for this file creation.'),
  }),
  execute: async ({ gameId, path, type, content, commitMessage }) => {
    console.log(`[Tool Execution] createFile - GameID: ${gameId}, Path: ${path}, Type: ${type}`);
    try {
      const result = await FileSystem.createFile({
        gameId,
        path,
        type,
        content,
        commitMessage,
        createdBy: 'assistant',
      });
      
      console.log(`[Tool Result] createFile - Success: Created file ${path} with ID ${result.file.id}`);
      return {
        success: true,
        fileId: result.file.id,
        versionId: result.version.id,
        path,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.log(`[Tool Result] createFile - Error: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

export const modifyFile = tool({
  description: 'Modify an existing file with the specified patches or changes.',
  parameters: z.object({
    fileId: z.string().describe('The ID of the file to be modified.'),
    content: z.string().describe('The new content for the file.'),
    commitMessage: z.string().optional().describe('Optional commit message for this modification.'),
  }),
  execute: async ({ fileId, content, commitMessage }) => {
    console.log(`[Tool Execution] modifyFile - FileID: ${fileId}`);
    try {
      const file = await FileSystem.getFile(fileId);
      if (!file) {
        console.log(`[Tool Result] modifyFile - Error: File with ID ${fileId} not found`);
        return { success: false, error: `File with ID ${fileId} not found` };
      }
      
      const version = await FileSystem.updateFile({
        fileId,
        content,
        commitMessage,
        createdBy: 'assistant',
      });
      
      console.log(`[Tool Result] modifyFile - Success: Updated file ${file.path} with version ${version.id}`);
      return {
        success: true,
        fileId,
        versionId: version.id,
        path: file.path,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.log(`[Tool Result] modifyFile - Error: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

export const deleteFile = tool({
  description: 'Delete a specified file from the codebase.',
  parameters: z.object({
    fileId: z.string().describe('The ID of the file to be deleted.'),
  }),
  execute: async ({ fileId }) => {
    console.log(`[Tool Execution] deleteFile - FileID: ${fileId}`);
    try {
      const result = await FileSystem.deleteFile(fileId);
      console.log(`[Tool Result] deleteFile - Success: Deleted file with ID ${result.fileId} from game ${result.gameId}`);
      return {
        success: true,
        fileId: result.fileId,
        gameId: result.gameId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
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
  modifyFile,
  deleteFile,
};
