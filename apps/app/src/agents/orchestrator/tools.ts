import { tool } from 'ai';
import { z } from 'zod';
import { developerAgent } from '../developer';

export const routeToDeveloper = tool({
  description: 'Route a development request to the developer agent for coding tasks.',
  parameters: z.object({
    gameId: z.string().describe('The game ID where the developer agent should work.'),
  }),
  execute: async ({ gameId }: { gameId: string }) => {
    console.log('routeToDeveloper', gameId);
    const result = await developerAgent({
      params: { gameId },
    });
    console.log('result', result);
    return result;
  },
});

export const orchestratorTools = {
  routeToDeveloper,
};
