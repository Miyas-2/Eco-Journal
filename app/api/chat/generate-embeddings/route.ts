import { createClient } from "@/lib/supabase/server";
import { generateEmbedding, chunkText, createRichContext } from "@/lib/embeddings";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { journalId, force = false } = await request.json();

    if (!journalId) {
      return NextResponse.json({ error: "Journal ID is required" }, { status: 400 });
    }

    console.log("Processing journal:", journalId, "Force:", force);

    // Check if embeddings already exist for this journal
    if (!force) {
      const { data: existingEmbeddings } = await supabase
        .from("journal_embeddings")
        .select("id")
        .eq("journal_id", journalId)
        .eq("user_id", user.id)
        .limit(1);

      if (existingEmbeddings && existingEmbeddings.length > 0) {
        return NextResponse.json({ 
          message: "Embeddings already exist for this journal",
          journalId 
        });
      }
    }

    // Get the journal content with ALL context data
    const { data: journal, error: journalError } = await supabase
      .from("journal_entries")
      .select(`
        id,
        title,
        content,
        created_at,
        mood_score,
        emotion_analysis,
        weather_data,
        location_name,
        latitude,
        longitude
      `)
      .eq("id", journalId)
      .eq("user_id", user.id)
      .single();

    if (journalError || !journal) {
      console.error("Journal fetch error:", journalError);
      return NextResponse.json({ error: "Journal not found" }, { status: 404 });
    }

    // Create rich context instead of just title + content
    const richContext = createRichContext(journal);
    
    if (!richContext.trim()) {
      return NextResponse.json({ error: "No content to embed" }, { status: 400 });
    }

    console.log("Rich context length:", richContext.length);
    console.log("Rich context preview:", richContext.substring(0, 200) + "...");

    // Delete existing embeddings if force regeneration
    if (force) {
      const { error: deleteError } = await supabase
        .from("journal_embeddings")
        .delete()
        .eq("journal_id", journalId)
        .eq("user_id", user.id);
      
      if (deleteError) {
        console.error("Error deleting existing embeddings:", deleteError);
      }
    }

    // Chunk the rich context
    const chunks = chunkText(richContext);
    console.log("Generated chunks:", chunks.length);
    const embeddings = [];

    // Generate embeddings for each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length}: ${chunk.substring(0, 50)}...`);
      
      const embedding = await generateEmbedding(chunk);
      
      if (embedding && embedding.length > 0) {
        embeddings.push({
          journal_id: journalId,
          user_id: user.id,
          content_chunk: chunk,
          embedding: `[${embedding.join(',')}]`, // Store as PostgreSQL array format
          chunk_index: i
        });
        console.log(`Chunk ${i + 1} embedded successfully, vector length:`, embedding.length);
      } else {
        console.error(`Failed to generate embedding for chunk ${i + 1}`);
      }
      
      // Add a small delay between requests to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    if (embeddings.length === 0) {
      return NextResponse.json({ error: "Failed to generate any embeddings" }, { status: 500 });
    }

    console.log("Inserting", embeddings.length, "embeddings into database");

    // Store embeddings in database
    const { error: insertError } = await supabase
      .from("journal_embeddings")
      .insert(embeddings);

    if (insertError) {
      console.error("Error storing embeddings:", insertError);
      return NextResponse.json({ error: "Failed to store embeddings" }, { status: 500 });
    }

    console.log("Embeddings stored successfully");

    return NextResponse.json({ 
      message: "Embeddings generated successfully",
      journalId,
      chunksProcessed: embeddings.length,
      totalContent: richContext.length,
      preview: richContext.substring(0, 200) + "..."
    });

  } catch (error) {
    console.error("Error in generate-embeddings:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}