import { createClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/embeddings";
import { getConversationContext } from "@/lib/conversation-context";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversationId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    console.log("Processing chat message:", message.substring(0, 50) + "...");

    // Get conversation context for memory
    const conversationContext = await getConversationContext(conversationId, user.id);

    // Get user analysis (simplified)
    const analysisResponse = await fetch(`${request.nextUrl.origin}/api/chat/journal-analysis`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || ''
      }
    });

    let userAnalysis = null;
    if (analysisResponse.ok) {
      userAnalysis = await analysisResponse.json();
    }

    // Generate embedding and search for relevant content
    const queryEmbedding = await generateEmbedding(message);
    let journalContext = "";
    let contextMetadata: any[] = [];

    if (queryEmbedding) {
      const { data: searchResults } = await supabase
        .rpc('match_journal_embeddings', {
          query_embedding: `[${queryEmbedding.join(',')}]`,
          match_threshold: 0.2,
          match_count: 5,
          filter_user_id: user.id
        });

      if (searchResults && searchResults.length > 0) {
        const contextJournalIds = [...new Set(searchResults.map((item: any) => item.journal_id))];
        
        // Include weather_data in the selection to get AQI info
        const { data: journals } = await supabase
          .from("journal_entries")
          .select("id, title, created_at, mood_score, weather_data, location_name")
          .in("id", contextJournalIds)
          .eq("user_id", user.id);

        // Enhanced context building with AQI data
        journalContext = searchResults
          .slice(0, 3) // Limit for efficiency
          .map((item: any) => {
            const journal = journals?.find(j => j.id === item.journal_id);
            const date = new Date(journal?.created_at || '').toLocaleDateString('id-ID');
            
            // Extract AQI data if available
            let aqiInfo = '';
            if (journal?.weather_data) {
              try {
                const weather = typeof journal.weather_data === 'string' 
                  ? JSON.parse(journal.weather_data) 
                  : journal.weather_data;
                const airQuality = weather.current?.air_quality;
                
                if (airQuality) {
                  const aqiParts = [];
                  if (airQuality['us-epa-index']) aqiParts.push(`EPA: ${airQuality['us-epa-index']}`);
                  if (airQuality.pm2_5) aqiParts.push(`PM2.5: ${airQuality.pm2_5}μg/m³`);
                  if (airQuality.pm10) aqiParts.push(`PM10: ${airQuality.pm10}μg/m³`);
                  
                  if (aqiParts.length > 0) {
                    aqiInfo = ` [AQI: ${aqiParts.join(', ')}]`;
                  }
                }
              } catch (e) {
                console.error("Error parsing weather data in context:", e);
              }
            }
            
            const moodInfo = journal && journal.mood_score !== null 
              ? ` [Mood: ${journal.mood_score}]` 
              : '';
            
            return `[${date}]${moodInfo}${aqiInfo} ${item.content_chunk}`;
          })
          .join('\n\n');

        contextMetadata = journals || [];
      }
    }

    // Create or get conversation
    let currentConversationId = conversationId;
    
    if (!currentConversationId) {
      const { data: newConversation, error: convError } = await supabase
        .from("chat_conversations")
        .insert({
          user_id: user.id,
          title: message.substring(0, 50) + (message.length > 50 ? "..." : "")
        })
        .select("id")
        .single();

      if (convError) {
        console.error("Error creating conversation:", convError);
        return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
      }

      currentConversationId = newConversation.id;
    }

    // Store user message
    await supabase
      .from("chat_messages")
      .insert({
        conversation_id: currentConversationId,
        user_id: user.id,
        role: "user",
        content: message
      });

    // Build optimized prompt with detailed AQI data
    const prompt = buildOptimizedPrompt(message, userAnalysis, journalContext, conversationContext);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    // Store AI response
    await supabase
      .from("chat_messages")
      .insert({
        conversation_id: currentConversationId,
        user_id: user.id,
        role: "assistant",
        content: aiResponse,
        context_used: contextMetadata
      });

    return NextResponse.json({
      response: aiResponse,
      conversationId: currentConversationId,
      contextUsed: contextMetadata.length > 0
    });

  } catch (error) {
    console.error("Error in chat:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function buildOptimizedPrompt(
  message: string, 
  userAnalysis: any, 
  journalContext: string, 
  conversationContext: any
): string {
  
  // Build conversation memory
  const recentChat = conversationContext.recentMessages
    .map((msg: any) => `${msg.role}: ${msg.content}`)
    .join('\n');

  // Build user profile with detailed AQI insights
  let profile = '';
  if (userAnalysis) {
    profile = `
Profil: ${userAnalysis.summary.total} jurnal, ${userAnalysis.summary.days} hari
Mood rata-rata: ${userAnalysis.summary.avgMood} (skala -1 sampai 1)
Mood terkini: ${userAnalysis.summary.recentMood}
Pola: ${userAnalysis.summary.moodCounts.positive} positif, ${userAnalysis.summary.moodCounts.neutral} netral, ${userAnalysis.summary.moodCounts.negative} negatif`;

    // Add detailed environmental insights
    if (userAnalysis.environmental?.correlations?.pm25) {
      const pm25Data = userAnalysis.environmental.correlations.pm25;
      profile += `\nPM2.5 Impact: Mood ${pm25Data.lowPM25Mood} (≤15μg/m³) vs ${pm25Data.highPM25Mood} (>35μg/m³), selisih ${pm25Data.impact}`;
      profile += `\nPM2.5 Pattern: ${pm25Data.highPM25Days}/${pm25Data.totalDays} hari polusi tinggi (${pm25Data.highPM25Percentage}%), ${pm25Data.lowPM25Days} hari udara bersih`;
    }
    
    if (userAnalysis.environmental?.correlations?.aqi) {
      const aqiData = userAnalysis.environmental.correlations.aqi;
      profile += `\nAQI Impact: Mood ${aqiData.goodAQIMood} (EPA 1-2) vs ${aqiData.badAQIMood} (EPA 4+), ${aqiData.goodDays} hari baik vs ${aqiData.badDays} hari buruk`;
    }

    if (userAnalysis.environmental?.aqiImpact) {
      const aqi = userAnalysis.environmental.aqiImpact;
      const aqiSummary = Object.entries(aqi)
        .map(([category, data]: [string, any]) => `${category}: ${data.avgMood} (${data.count} hari, ${data.percentage}%)`)
        .join(', ');
      profile += `\nAQI Detail: ${aqiSummary}`;
    }

    if (userAnalysis.environmental?.seasonal) {
      const seasonal = userAnalysis.environmental.seasonal;
      const seasonDetails = Object.entries(seasonal)
        .map(([season, data]: [string, any]) => {
          let seasonInfo = `${season}: mood ${data.avgMood}`;
          if (data.avgPM25) seasonInfo += ` (PM2.5: ${data.avgPM25}μg/m³)`;
          if (data.avgAQI) seasonInfo += ` (EPA: ${data.avgAQI})`;
          return seasonInfo;
        })
        .join(', ');
      profile += `\nSeasonal: ${seasonDetails}`;
    }

    profile += `\nData Points: ${userAnalysis.environmental?.dataPoints || 0} entri dengan data lingkungan`;
  }

  return `Personal Well-being Guide dengan akses data AQI lengkap.

${profile}

${recentChat ? `Chat sebelumnya:\n${recentChat}\n` : ''}

Konteks relevan dengan AQI:
${journalContext || 'Tidak ada konteks spesifik'}

Pertanyaan: ${message}

INSTRUKSI PENTING:
- Anda memiliki akses ke data AQI lengkap: US EPA Index (1-6), PM2.5, PM10, NO2, O3 dalam μg/m³
- Data tersedia untuk ${userAnalysis?.summary?.total || 'beberapa'} jurnal dengan ${userAnalysis?.environmental?.dataPoints || 0} yang memiliki data lingkungan
- Berikan analisis spesifik dengan angka nyata dari data yang ada
- Format contoh: "Berdasarkan ${userAnalysis?.summary?.total || 'N'} jurnal, kualitas udara terburuk pada [tanggal] dengan PM2.5: [nilai]μg/m³, EPA: [nilai]. Mood Anda [nilai] pada hari itu."
- Gunakan threshold: PM2.5 >35μg/m³ = buruk, EPA ≥4 = tidak sehat
- Berikan persentase dan pola spesifik dari data yang tersedia

Jawab dengan data faktual dan spesifik, bukan perkiraan umum.`;
}