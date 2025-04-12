import { streamText, tool, type Message } from "ai";
import { xai } from "@ai-sdk/xai";
import { prompt } from "./prompt";
import { routeToDeveloper } from "./tools";
import { GameChatService } from "@/lib/services/game-chat";
import { z } from "zod";

const updateThreadTitle = tool({
  description: "Update the title of a chat thread",
  parameters: z.object({
    threadId: z.string(),
    title: z.string(),
  }),
  execute: async ({ threadId, title }) => {
    await GameChatService.updateThreadTitle(threadId, title);
  },
});

export const orchestratorAgent = async (
  request: Request,
  {
    params,
    messages,
  }: { params: { gameId: string; threadId: string }; messages: Message[] }
) => {
  const { gameId, threadId } = params;

  const gameChat = await GameChatService.getThread(threadId);
  const isFirstMessage = gameChat?.messages.length === 0;

  const stream = streamText({
    model: xai("grok-3-beta"),
    tools: {
      routeToDeveloper,
      updateThreadTitle,
    },
    system: `${prompt}
    The threadId is ${threadId}.
    The gameId is ${gameId}.
    ${isFirstMessage ? "Since this is the first message in the thread, generate a title for this chat and update the thread title. Continue fulfilling the user's request, no confirmation needed." : ""}`,
    messages,
    maxSteps: 10, // allow up to 5 steps,
    onFinish: (result) => {
      GameChatService.appendMessage(threadId, {
        role: "assistant",
        content: result.text,
        createdAt: new Date(),
      });
    },
  });

  return stream;
};
