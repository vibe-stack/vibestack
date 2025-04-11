import { NextResponse } from "next/server";
import { FileSystem } from "@/lib/services/file-system";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/games/[id] - Get a specific game
export async function GET(req: Request, { params }: Params) {
  try {
    const game = await FileSystem.getGame(params.id);
    
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    
    return NextResponse.json(game);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 