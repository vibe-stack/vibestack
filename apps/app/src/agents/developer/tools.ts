import { tool } from 'ai';
import { z } from 'zod';
import { FileSystem } from '../../lib/services/file-system';
import { CodeSearch } from '../../lib/services/code-search';

export const searchCodebase = tool({
  description: 'Search the codebase for relevant files and code related to game development tasks.',
  parameters: z.object({
    query: z.string().describe('The search query to find relevant files or code snippets.'),
    gameId: z.string().optional().describe('The game ID to limit the search to a specific game.'),
  }),
  execute: async ({ query, gameId }) => {
    const results = await CodeSearch.searchCodebase(query, gameId);
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
  description: 'Read the contents of a specific file to understand existing code.',
  parameters: z.object({
    fileId: z.string().describe('The ID of the file to be read.'),
  }),
  execute: async ({ fileId }) => {
    const file = await FileSystem.getFile(fileId);
    if (!file) {
      return { error: `File with ID ${fileId} not found` };
    }
    
    const content = await FileSystem.getFileContent(fileId);
    return {
      path: file.path,
      type: file.type,
      content,
    };
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
    try {
      const result = await FileSystem.createFile({
        gameId,
        path,
        type,
        content,
        commitMessage,
        createdBy: 'assistant',
      });
      
      return {
        success: true,
        fileId: result.file.id,
        versionId: result.version.id,
        path,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
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
    try {
      const file = await FileSystem.getFile(fileId);
      if (!file) {
        return { success: false, error: `File with ID ${fileId} not found` };
      }
      
      const version = await FileSystem.updateFile({
        fileId,
        content,
        commitMessage,
        createdBy: 'assistant',
      });
      
      return {
        success: true,
        fileId,
        versionId: version.id,
        path: file.path,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
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
    try {
      const result = await FileSystem.deleteFile(fileId);
      return {
        success: true,
        fileId: result.fileId,
        gameId: result.gameId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
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
