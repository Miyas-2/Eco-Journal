import { EmotionApiResponse } from '@/types';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text input is required for emotion analysis" }, { status: 400 });
    }

    // Encode text untuk URL
    const encodedText = encodeURIComponent(text);
    const apiUrl = `https://miyas-2-plutchik-emotion-indobert-lite.hf.space/predict?text=${encodedText}`;

    // Fetch ke API eksternal
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const emotionData: EmotionApiResponse = await response.json();

    return NextResponse.json(emotionData);
  } catch (error: any) {
    console.error("Internal server error in /api/emotion:", error);
    return NextResponse.json({ 
      error: error.message || "Internal server error" 
    }, { status: 500 });
  }
}