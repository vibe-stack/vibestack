import { streamText, tool, type Message } from "ai";
// import { xai } from "@ai-sdk/xai";
import { prompt } from "./prompt";
import { prompt as developerPrompt } from "../developer/prompt";
import { GameChatService } from "@/lib/services/game-chat";
import { z } from "zod";
import { developerTools } from "../developer/tools";
// import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

export const orchestratorAgent = async (
  request: Request,
  {
    params,
    messages,
  }: { params: { gameId: string; threadId: string }; messages: Message[] }
) => {
  const { gameId, threadId } = params;

  let gameChat = await GameChatService.getThread(threadId);
  if (!gameChat) {
    const gameChatId = await GameChatService.createThread(gameId);
    gameChat = await GameChatService.getThread(gameChatId);
  }
  const isFirstMessage = gameChat?.messages.length === 0;

  const updateThreadTitle = tool({
    description: "Update the title of a chat thread",
    parameters: z.object({
      title: z.string(),
    }),
    execute: async ({ title }) => {
      await GameChatService.updateThreadTitle(gameChat!.id, title);

      return {
        success: true,
      };
    },
  });

  const stream = streamText({
    // model: anthropic("claude-3-7-sonnet-20250219"),
    model: openai("gpt-4.1"),
    tools: {
      updateThreadTitle,
      ...developerTools,
    },
    maxTokens: 150000,
    system: `${prompt}
    The threadId is ${threadId}.
    The gameId is ${gameId}.
    ${isFirstMessage ? "Since this is the first message in the thread, generate a title for this chat and update the thread title. Continue fulfilling the user's request, no confirmation needed." : ""}

    YOU AS A DEVELOPER: ${developerPrompt}
    `,
    messages,
    maxSteps: 25, // allow up to 5 steps,
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
