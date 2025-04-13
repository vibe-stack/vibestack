import { NextResponse } from "next/server";
import { FileSystem } from "@/lib/services/file-system";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/games/[id]/files - List all files for a game
export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const files = await FileSystem.listFiles(id);
    return NextResponse.json(files);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/games/[id]/files - Create a new file
export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    if (!body.path || !body.type || !body.content) {
      return NextResponse.json({ 
        error: "File path, type, and content are required" 
      }, { status: 400 });
    }
    
    const file = await FileSystem.createFile({
      gameId: id,
      path: body.path,
      type: body.type,
      content: body.content,
      commitMessage: body.commitMessage,
      createdBy: body.createdBy,
    });
    
    return NextResponse.json(file, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 