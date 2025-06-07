import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    let suggestion = "";
    if (response.text) {
      suggestion = response.text;
    } else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      suggestion = response.candidates[0].content.parts[0].text;
    } else {
      suggestion = "Tidak ada saran diterima atau format respons tidak dikenal.";
    }
    return NextResponse.json({ suggestion });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}