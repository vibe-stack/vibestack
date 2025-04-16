import { NextResponse } from "next/server";
import { FileSystem } from "@/lib/services/file-system";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/files/[id]/history - Get file history
export async function GET(req: Request, { params }: Params) {
  try {
    const history = await FileSystem.getFileHistory(params.id);
    return NextResponse.json(history);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}