import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { xai } from '@ai-sdk/xai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string, threadId: string }> }) {
  const { id, threadId } = await params;
  const { messages } = await req.json();

  const result = streamText({
    model: xai('grok-3-mini'),
    system: `You are a helpful assistant that can answer questions and help with tasks.
    The threadId is ${threadId}.
    The gameId is ${id}.`,
    messages,
  });

  return result.toDataStreamResponse();
}