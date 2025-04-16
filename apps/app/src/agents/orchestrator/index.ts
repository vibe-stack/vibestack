import { streamText, tool, type Message } from "ai";
// import { xai } from "@ai-sdk/xai";
import { prompt } from "./prompt";
import { prompt as developerPrompt } from "../developer/prompt";
import { GameChatService } from "@/lib/services/game-chat";
import { z } from "zod";
import { developerTools } from "../developer/tools";
// import { openai } from "@ai-sdk/openai";
import { createAnthropic } from '@ai-sdk/anthropic';


import { AnthropicService } from "@/lib/services/anthropic-service";
export const orchestratorAgent = async (
  request: Request,
  {
    params,
    messages,
  }: { params: { gameId: string; threadId: string }; messages: Message[] }
) => {
  const { gameId, threadId } = params;
  const anthropicApiKey = await AnthropicService.getApiKey();

  if (!anthropicApiKey) {
    throw new Error("Anthropic API key not found");
  }

  const anthropic = createAnthropic({
    // custom settings
    apiKey: anthropicApiKey,
  });

  let gameChat = await GameChatService.getThread(threadId);
  if (!gameChat) {
    const gameChatId = await GameChatService.createThread(gameId);
    gameChat = await GameChatService.getThread(gameChatId);
  }
  const isFirstMessage = gameChat?.messages.length === 0;

  // Append new user messages that have not yet been saved
  // Find the index of the last assistant message in the thread
  let lastAssistantIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") {
      lastAssistantIdx = i;
      break;
    }
  }
  // All user messages after the last assistant message are new and should be saved
  const newUserMessages = [];
  for (let i = lastAssistantIdx + 1; i < messages.length; i++) {
    if (messages[i].role === "user") {
      newUserMessages.push(messages[i]);
    }
  }
  for (const msg of newUserMessages) {
    const messageInput = {
      role: "user" as const,
      content: msg.content,
      createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
    };
    if ('metadata' in msg && msg.metadata !== undefined) {
      // @ts-expect-error: metadata may not exist on Message
      messageInput.metadata = msg.metadata;
    }
    await GameChatService.appendMessage(threadId, messageInput);
  }

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
    model: anthropic("claude-3-7-sonnet-20250219", ),
    // model: openai("gpt-4.1"),
    tools: {
      updateThreadTitle,
      ...developerTools,
    },
    // maxTokens: 150000,
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
