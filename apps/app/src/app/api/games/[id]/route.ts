import { NextResponse } from "next/server";
import { FileSystem } from "@/lib/services/file-system";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/games/[id] - Get a specific game
export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const game = await FileSystem.getGame(id);
    
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    
    return NextResponse.json(game);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
} 