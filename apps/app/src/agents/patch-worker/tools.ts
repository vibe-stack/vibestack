import { tool, generateText } from 'ai';
import { z } from 'zod';
import { xai } from '@ai-sdk/xai';
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
    // File exists, use grok-3-mini to intelligently apply the patch
    const existingContent = await FileSystem.getFileContent(existingFile.id);
    
    // Use grok-3-mini to merge the patch with the existing content
    const updatedContent = await mergeWithGrok({
      originalContent: existingContent,
      patchContent: patch,
      filePath,
    });

    await FileSystem.updateFile({
      fileId: existingFile.id,
      content: updatedContent,
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
    // File doesn't exist, create it with the patch content directly
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

// Use grok-3-mini to intelligently merge the patch with the original content
const mergeWithGrok = async ({
  originalContent,
  patchContent,
  filePath,
}: {
  originalContent: string;
  patchContent: string;
  filePath: string;
}): Promise<string> => {
  const fileExtension = filePath.split('.').pop() || '';
  
  // Create a system prompt for grok-3-mini to apply the patch
  const systemPrompt = `You are a code patch application assistant. Your task is to apply the provided patch to the original file correctly and intelligently. 
  
  Pay special attention to:
  1. Preserving imports and other critical code sections
  2. Applying changes in the correct locations
  3. Resolving any conflicts intelligently
  4. Following the code style of the original file
  
  Only return the final merged code content without any explanation or comments.`;

  // Generate the merged content using grok-3-mini
  const response = await generateText({
    model: xai('grok-3-mini'),
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `I need to update a file with a patch.

Original file (${filePath}):
\`\`\`${fileExtension}
${originalContent}
\`\`\`

Patch to apply:
\`\`\`${fileExtension}
${patchContent}
\`\`\`

Please apply this patch intelligently to create the updated file content. Just return the updated code without explanations.`
      }
    ]
  });

  // Extract the text content from the response
  return response.text;
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
