import { NextRequest } from "next/server";
import { orchestratorAgent } from "@/agents/orchestrator";
import { ToolExecutionError } from "ai";
import { InvalidToolArgumentsError } from "ai";
import { NoSuchToolError } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; threadId: string }> }
) {
  const { id, threadId } = await params;
  const { messages } = await req.json();

  const result = await orchestratorAgent(req, { params: { gameId: id, threadId }, messages });

  result.consumeStream();

  return result.toDataStreamResponse({
    getErrorMessage: error => {
      console.log(error);
      if (NoSuchToolError.isInstance(error)) {
        return 'I made a mistake while processing your request.';
      } else if (InvalidToolArgumentsError.isInstance(error)) {
        return 'I couldn\'t figure out how to fulfill your request.';
      } else if (ToolExecutionError.isInstance(error)) {
        return 'The server failed to process my request.';
      } else {
        return 'Something unexpected happened.';
      }
    },
  });
}
