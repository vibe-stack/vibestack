import { tool } from 'ai';
import { z } from 'zod';
import { FileSystem } from '../../lib/services/file-system';

export const applyPatch = tool({
  description: 'Apply a code patch to the specified file as provided by the developer agent.',
  parameters: z.object({
    filePath: z.string().describe('The path to the file where the patch should be applied.'),
    patch: z.string().describe('The patch content to be applied to the file.'),
    gameId: z.string().describe('The ID of the game this file belongs to.'),
    commitMessage: z.string().optional().describe('Optional commit message for this patch.'),
  }),
  execute: async ({ filePath, patch, gameId, commitMessage }) => {
    try {
      const result = await applyFilePatch({ filePath, patch, gameId, commitMessage });
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});

export const patchWorkerTools = {
  applyPatch,
};

// Helper function to apply patches to files
const applyFilePatch = async ({ 
  filePath, 
  patch, 
  gameId, 
  commitMessage 
}: { 
  filePath: string; 
  patch: string; 
  gameId: string;
  commitMessage?: string;
}) => {
  // First, check if the file already exists in the game
  const existingFiles = await FileSystem.listFiles(gameId);
  const existingFile = existingFiles.find(f => f.path === filePath);

  if (existingFile) {
    // File exists, so update it
    const existingContent = await FileSystem.getFileContent(existingFile.id);
    
    // Apply the patch directly (replace the whole content)
    // In a real implementation, you might want to do a proper diff and patch here
    const result = await FileSystem.updateFile({
      fileId: existingFile.id,
      content: patch,
      commitMessage,
      createdBy: 'patch-worker',
    });

    return {
      success: true,
      fileId: existingFile.id,
      path: filePath,
      action: 'updated',
    };
  } else {
    // File doesn't exist, create it
    // Determine file type from the extension
    const fileExtension = filePath.split('.').pop() || '';
    const fileType = determineFileType(fileExtension);
    
    const result = await FileSystem.createFile({
      gameId,
      path: filePath,
      type: fileType,
      content: patch,
      commitMessage,
      createdBy: 'patch-worker',
    });

    return {
      success: true,
      fileId: result.file.id,
      path: filePath,
      action: 'created',
    };
  }
};

// Helper function to determine file type from extension
function determineFileType(extension: string): string {
  const typeMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'jsx': 'jsx',
    'tsx': 'tsx',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'png': 'image',
    'jpg': 'image',
    'jpeg': 'image',
    'gif': 'image',
    'svg': 'image',
    'mp3': 'audio',
    'wav': 'audio',
    'mp4': 'video',
  };

  return typeMap[extension.toLowerCase()] || 'text';
}
