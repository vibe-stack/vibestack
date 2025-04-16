import { NextResponse } from "next/server";
import { FileSystem } from "@/lib/services/file-system";

// GET /api/games - List all games
export async function GET() {
  try {
    const games = await FileSystem.listGames();
    return NextResponse.json(games);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}

// POST /api/games - Create a new game
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.name) {
      return NextResponse.json({ error: "Game name is required" }, { status: 400 });
    }
    
    const game = await FileSystem.createGame({
      name: body.name,
      description: body.description,
    });
    
    return NextResponse.json(game, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
} 