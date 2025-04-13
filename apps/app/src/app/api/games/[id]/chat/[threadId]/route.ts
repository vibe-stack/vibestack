import { NextRequest } from "next/server";
import { orchestratorAgent } from "@/agents/orchestrator";

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

  return result.toDataStreamResponse();
}
