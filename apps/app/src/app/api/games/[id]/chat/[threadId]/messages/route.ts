import { NextRequest, NextResponse } from "next/server";
import { GameChatService } from "@/lib/services/game-chat";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; threadId: string }> }
) {
  try {
    const { id, threadId } = await params;
    
    // Get the thread with its messages
    const thread = await GameChatService.getThread(threadId);
    
    if (!thread) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      );
    }
    
    // Check if the thread belongs to the game
    if (thread.gameId !== id) {
      return NextResponse.json(
        { error: "Thread does not belong to this game" },
        { status: 403 }
      );
    }
    
    // Return the messages
    return NextResponse.json({ messages: thread.messages });
  } catch (error) {
    console.error("Error fetching thread messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch thread messages" },
      { status: 500 }
    );
  }
} 