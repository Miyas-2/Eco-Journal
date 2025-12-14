import { EmotionApiResponse } from '@/types';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text input is required for emotion analysis" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set.");
      return NextResponse.json({ error: "Konfigurasi server tidak lengkap (API Key)." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const prompt = `
Analisis emosi dari teks berikut dan berikan hasilnya dalam format JSON yang tepat.

Teks untuk dianalisis:
"${text}"

Klasifikasikan emosi utama dari teks tersebut ke dalam salah satu kategori berikut: Anger, Anxiety, Fear, Happy, Love, Sad, Surprise.

Berikan respons dalam format JSON berikut:
{
  "text": "teks yang dianalisis",
  "top_prediction": {
    "label": "nama emosi utama",
    "confidence": nilai confidence dalam persen (0-100)
  },
  "all_predictions": {
    "Anger": nilai confidence dalam persen,
    "Anxiety": nilai confidence dalam persen,
    "Fear": nilai confidence dalam persen,
    "Happy": nilai confidence dalam persen,
    "Love": nilai confidence dalam persen,
    "Sad": nilai confidence dalam persen,
    "Surprise": nilai confidence dalam persen
  }
}

Pastikan:
1. Semua 7 emosi harus ada dalam all_predictions
2. Jumlah semua confidence dalam all_predictions mendekati 100
3. top_prediction.label harus salah satu dari 7 emosi tersebut
4. top_prediction.confidence harus sama dengan nilai tertinggi di all_predictions
5. Confidence adalah angka desimal (contoh: 72.5, bukan "72.5%")
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text();

    // Parse JSON response dari Gemini
    const emotionData: EmotionApiResponse = JSON.parse(responseText);

    return NextResponse.json(emotionData);
  } catch (error: any) {
    console.error("Internal server error in /api/emotion:", error);
    return NextResponse.json({ 
      error: error.message || "Internal server error" 
    }, { status: 500 });
  }
}