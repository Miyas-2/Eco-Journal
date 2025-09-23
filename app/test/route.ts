import { generateEmbedding } from "@/lib/embeddings";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const embedding = await generateEmbedding(text);
    
    if (embedding) {
      return NextResponse.json({
        success: true,
        text,
        embeddingLength: embedding.length,
        embedding: embedding.slice(0, 10) // Show first 10 values for debugging
      });
    } else {
      return NextResponse.json({
        success: false,
        error: "Failed to generate embedding"
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Test embedding error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}