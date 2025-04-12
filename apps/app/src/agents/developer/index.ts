import { generateText, type Message } from "ai";
import { xai } from "@ai-sdk/xai";
import { prompt } from "./prompt";
import { developerTools } from "./tools";

export const developerAgent = async (
  {
    params,
  }: { params: { gameId: string } }
) => {
  const { gameId } = params;

  const result = await generateText({
    model: xai("grok-3-beta"),
    tools: developerTools,
    system: `${prompt}
    The gameId is ${gameId}.`,
    maxSteps: 25,
  });

  return result;
};
