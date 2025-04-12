import { tool } from 'ai';
import { z } from 'zod';

export const routeToDeveloper = tool({
  description: 'Route a development request to the developer agent for coding tasks.',
  parameters: z.object({
    request: z.string().describe('The full context of the user request to be routed.'),
  }),
  execute: async ({ request }) => {
    // To be implemented
  },
});

export const orchestratorTools = {
  routeToDeveloper,
};
