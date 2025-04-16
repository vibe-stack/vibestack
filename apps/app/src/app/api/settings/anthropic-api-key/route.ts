import { AnthropicService } from "@/lib/services/anthropic-service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();
    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 });
    }
    await AnthropicService.saveApiKey(apiKey);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save API key" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const apiKey = await AnthropicService.getApiKey();
    return NextResponse.json({ apiKey });
  } catch {
    return NextResponse.json({ apiKey: null });
  }
} 