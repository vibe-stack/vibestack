import { NextResponse } from "next/server";
import { FileSystem } from "@/lib/services/file-system";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/files/[id] - Get a specific file
export async function GET(req: Request, { params }: Params) {
  try {
    const file = await FileSystem.getFile((await params).id);
    
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    
    const content = await FileSystem.getFileContent((await params).id);
    
    return NextResponse.json({
      ...file,
      content,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// PUT /api/files/[id] - Update a file
export async function PUT(req: Request, { params }: Params) {
  try {
    const body = await req.json();
    
    if (!body.content) {
      return NextResponse.json({ error: "File content is required" }, { status: 400 });
    }
    
    const version = await FileSystem.updateFile({
      fileId: (await params).id,
      content: body.content,
      commitMessage: body.commitMessage,
      createdBy: body.createdBy,
    });
    
    return NextResponse.json(version);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// DELETE /api/files/[id] - Delete a file
export async function DELETE(req: Request, { params }: Params) {
  try {
    await FileSystem.deleteFile((await params).id)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
} 