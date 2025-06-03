// filepath: d:\Semester 4\Pemweb\eco-journal\app\api\emotion\route.ts
import { EmotionApiResponse } from '@/types';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text input is required for emotion analysis" }, { status: 400 });
    }

    // Pastikan URL dan port sesuai dengan server Flask Anda
    // Gunakan encodeURIComponent untuk menangani karakter spesial dalam teks
    const emotionApiUrl = `http://127.0.0.1:5000/predict?text=${encodeURIComponent(text)}`;

    const emotionResponse = await fetch(emotionApiUrl); // Metode GET sesuai endpoint Flask

    if (!emotionResponse.ok) {
      let errorData;
      try {
        errorData = await emotionResponse.json();
      } catch (e) {
        errorData = { message: await emotionResponse.text() };
      }
      console.error("Emotion analysis API request failed:", errorData);
      return NextResponse.json({ error: errorData.message || `Emotion analysis API request failed with status ${emotionResponse.status}` }, { status: emotionResponse.status });
    }

    const emotionData: EmotionApiResponse = await emotionResponse.json();
    return NextResponse.json(emotionData);
  } catch (error: any) {
    console.error("Internal server error in /api/emotion:", error);
    // Periksa apakah error karena fetch gagal (misal, server Flask tidak jalan)
    if (error.cause && (error.cause as any).code === 'ECONNREFUSED') {
         return NextResponse.json({ error: "Tidak dapat terhubung ke layanan analisis emosi. Pastikan layanan berjalan." }, { status: 503 });
    }
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}