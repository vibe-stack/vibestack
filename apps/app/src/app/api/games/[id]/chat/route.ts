import { NextRequest, NextResponse } from "next/server";
import { GameChatService } from "@/lib/services/game-chat";

/**
 * GET /api/games/[id]/chat
 * 
 * Retrieves all chat threads for a game
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gameId = (await params).id;
    const threads = await GameChatService.getThreadsByGameId(gameId);
    
    return NextResponse.json(threads);
  } catch (error) {
    console.error("Error retrieving chat threads:", error);
    return NextResponse.json(
      { error: "Failed to retrieve chat threads" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/games/[id]/chat
 * 
 * Creates a new chat thread for a game
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gameId = (await params).id;
    const { title } = await req.json();
    
    const threadId = await GameChatService.createThread(gameId, title);
    
    // Get the newly created thread details
    const threads = await GameChatService.getThreadsByGameId(gameId);
    const thread = threads.find(t => t.id === threadId);
    
    if (!thread) {
      throw new Error("Thread was created but couldn't be retrieved");
    }
    
    return NextResponse.json(thread);
  } catch (error) {
    console.error("Error creating chat thread:", error);
    return NextResponse.json(
      { error: "Failed to create chat thread" },
      { status: 500 }
    );
  }
} 