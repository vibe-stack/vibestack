import { generateText, streamText } from "ai";
import { xai } from "@ai-sdk/xai";
import { prompt } from "./prompt";
import { developerTools } from "./tools";

export const developerAgent = async (
  {
    params,
  }: { params: { gameId: string } }
) => {
  const { gameId } = params;

  console.log("Starting developer agent with gameId:", gameId);

  // Create and consume the stream
  const stream = streamText({
    model: xai("grok-3-beta"),
    tools: developerTools,
    system: `${prompt}
    The gameId is ${gameId}.`,
    maxSteps: 25,
    onChunk(chunk) {
      console.log("Chunk:", chunk);
    },
  });

  // Consume the stream which processes it
  stream.consumeStream({
    onError(error) {
      console.error("Error in developer agent:", error);
    },
  });
  
  // Wait for the final result
  try {
    const result = await stream.text;
    console.log("Developer agent completed with text length:", result.length);
  } catch (error) {
    console.error("Error in developer agent:", error);
  }

  return { success: true };
};
