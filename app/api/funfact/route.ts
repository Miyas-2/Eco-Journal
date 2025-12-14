import { NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { indicatorType, value, unit, locationName, generalContext, journalDate } = await req.json(); // <-- Tambahkan journalDate

    if (!indicatorType || value === undefined) {
      return NextResponse.json({ error: "Jenis indikator dan nilai dibutuhkan" }, { status: 400 });
    }
    // Opsional: Validasi format journalDate jika perlu
    // if (journalDate && !isValidDateString(journalDate)) {
    //   return NextResponse.json({ error: "Format tanggal tidak valid" }, { status: 400 });
    // }


    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set.");
      return NextResponse.json({ error: "Konfigurasi server tidak lengkap (API Key)." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = "-1.5-flash-latest"; // Sesuaikan jika model lain yang berfungsi untuk Anda

    const model = genAI.getGenerativeModel({
      model: modelName,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    // Membuat prompt dinamis untuk AI
    let prompt = `Berikan fakta menarik atau edukasi singkat (1-2 kalimat) tentang ${generalContext || indicatorType}`;
    if (unit) {
      prompt += ` dengan nilai ${value} ${unit}`;
    } else {
      prompt += ` dengan nilai ${value}`;
    }
    if (locationName) {
      prompt += ` di wilayah ${locationName}`;
    }
    if (journalDate) {
      // Format tanggal agar lebih mudah dibaca oleh AI dan pengguna
      const formattedDate = new Date(journalDate).toLocaleDateString('id-ID', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      prompt += ` pada tanggal ${formattedDate}`;
    }
    prompt += ". Sampaikan dengan bahasa yang mudah dipahami, relevan untuk pengguna aplikasi jurnal kesehatan dan lingkungan. Fokus pada dampak atau arti dari nilai tersebut, dan jika mungkin, berikan saran singkat atau perspektif positif. Hindari penggunaan markdown.";

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text) {
      return NextResponse.json({ fact: "Tidak ada informasi edukasi yang dapat dihasilkan saat ini." });
    }

    return NextResponse.json({ fact: text });

  } catch (error: any) {
    console.error("Error generating fun fact:", error);
    const errorMessage = error.message || "Kesalahan internal server saat menghasilkan fakta.";
    const errorDetails = error.cause || error.stack || error.toString();
    return NextResponse.json({ error: errorMessage, details: errorDetails }, { status: 500 });
  }
}

// Opsional: Fungsi helper untuk validasi tanggal (jika diperlukan)
// function isValidDateString(dateString: string): boolean {
//   const date = new Date(dateString);
//   return !isNaN(date.getTime());
// }