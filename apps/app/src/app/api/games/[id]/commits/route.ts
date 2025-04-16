import { NextResponse } from "next/server";
import { FileSystem } from "@/lib/services/file-system";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/games/[id]/commits - List all commits for a game
export async function GET(req: Request, { params }: Params) {
  try {
    const commits = await FileSystem.listCommits(params.id);
    return NextResponse.json(commits);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}

// POST /api/games/[id]/commits - Create a new commit
export async function POST(req: Request, { params }: Params) {
  try {
    const body = await req.json();
    
    if (!body.message || !Array.isArray(body.files) || body.files.length === 0) {
      return NextResponse.json({ 
        error: "Commit message and at least one file are required" 
      }, { status: 400 });
    }
    
    // Validate that all files have fileId and content
    for (const file of body.files) {
      if (!file.fileId || !file.content) {
        return NextResponse.json({ 
          error: "All files must have fileId and content" 
        }, { status: 400 });
      }
    }
    
    const commit = await FileSystem.createCommit({
      gameId: params.id,
      message: body.message,
      createdBy: body.createdBy,
      files: body.files,
    });
    
    return NextResponse.json(commit, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
} 