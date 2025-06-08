import { NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server"; // Gunakan server client untuk operasi DB

// Fungsi helper untuk mendapatkan deskripsi AQI yang lebih ramah
function getAqiStatus(weatherData: any): string {
    if (!weatherData?.current?.air_quality) return "tidak diketahui";
    const aq = weatherData.current.air_quality;
    // Prioritaskan US EPA Index jika ada
    if (aq['us-epa-index']) {
        const epaIndex = aq['us-epa-index'];
        if (epaIndex <= 1) return `Baik (US EPA Index: ${epaIndex})`;
        if (epaIndex <= 2) return `Sedang (US EPA Index: ${epaIndex})`;
        if (epaIndex <= 3) return `Tidak Sehat untuk Kelompok Sensitif (US EPA Index: ${epaIndex})`;
        if (epaIndex <= 4) return `Tidak Sehat (US EPA Index: ${epaIndex})`;
        if (epaIndex <= 5) return `Sangat Tidak Sehat (US EPA Index: ${epaIndex})`;
        return `Berbahaya (US EPA Index: ${epaIndex})`;
    }
    // Fallback ke PM2.5 jika tidak ada US EPA Index
    if (aq.pm2_5 !== undefined) {
        const pm25 = parseFloat(aq.pm2_5);
        if (pm25 <= 12.0) return `Baik (PM2.5: ${pm25.toFixed(1)} µg/m³)`
        if (pm25 <= 35.4) return `Sedang (PM2.5: ${pm25.toFixed(1)} µg/m³)`
        if (pm25 <= 55.4) return `Tidak Sehat untuk Kelompok Sensitif (PM2.5: ${pm25.toFixed(1)} µg/m³)`
        if (pm25 <= 150.4) return `Tidak Sehat (PM2.5: ${pm25.toFixed(1)} µg/m³)`
        if (pm25 <= 250.4) return `Sangat Tidak Sehat (PM2.5: ${pm25.toFixed(1)} µg/m³)`
        return `Berbahaya (PM2.5: ${pm25.toFixed(1)} µg/m³)`
    }
    return "tidak dapat ditentukan";
}


export async function POST(req: Request) {
    const supabase = await createClient();

    try {
        const {
            journalId,
            userId,
            journalContent,
            emotion, // Ini adalah emosi utama (misal: "Cemas")
            weatherData, // Ini adalah objek WeatherApiResponse
            locationName, // Nama lokasi yang ditampilkan ke pengguna
            journalCreatedAt // <-- Anda sudah menambahkan ini, bagus!
        } = await req.json();

        // Validasi sudah termasuk journalCreatedAt, bagus!
        if (!journalId || !userId || !journalContent || !emotion || !weatherData || !journalCreatedAt) {
            return NextResponse.json({ error: "Data tidak lengkap untuk menghasilkan insight." }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is not set.");
            return NextResponse.json({ error: "Konfigurasi server tidak lengkap (API Key)." }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const modelName = "gemini-1.5-flash-latest"; // Atau model yang Anda gunakan
        const model = genAI.getGenerativeModel({
            model: modelName,
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                // Tambahkan safety settings lain jika perlu
            ],
        });

        const weatherCondition = weatherData?.current?.condition?.text || "tidak diketahui";
        const airQualityStatus = getAqiStatus(weatherData);
        const truncatedContent = journalContent.length > 500 ? journalContent.substring(0, 500) + "..." : journalContent;

        // Format tanggal jurnal agar lebih mudah dibaca oleh AI
        const journalDateObject = new Date(journalCreatedAt);
        const formattedJournalTime = journalDateObject.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            // timeZoneName: 'short' // Opsional, bisa dihilangkan jika tidak ingin zona waktu
        });
        // Jika Anda masih memerlukan tanggal lengkap untuk bagian lain dari prompt, Anda bisa menyimpannya secara terpisah
        const fullFormattedJournalDate = journalDateObject.toLocaleDateString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });


        const prompt = `
Pengguna ini merasa '${emotion}'.
Jurnal ini ditulis pada ${fullFormattedJournalDate}, sekitar pukul ${formattedJournalTime}.
Isi jurnal singkatnya: "${truncatedContent}"
Saat jurnal ditulis (sekitar pukul ${formattedJournalTime} pada tanggal tersebut), cuaca di ${locationName || 'lokasinya'} adalah '${weatherCondition}' dan kualitas udara '${airQualityStatus}'.

Berikan sebuah paragraf singkat (2-4 kalimat) yang empatik dan suportif.
Hubungkan secara halus bagaimana perasaan pengguna ('${emotion}') mungkin berkaitan dengan kondisi lingkungan (cuaca dan kualitas udara) pada saat jurnal ditulis (pukul ${formattedJournalTime} pada ${fullFormattedJournalDate}).
Berikan satu saran aktivitas sederhana di dalam ruangan yang menenangkan atau sesuai dengan kondisi tersebut, yang bisa membantu pengguna merasa lebih baik.
Gunakan bahasa Indonesia yang hangat, bersahabat, dan mudah dipahami. Hindari penggunaan markdown atau format list.
Contoh output yang diinginkan: "Saya memahami kamu merasa [emosi] pada [hari/tanggal] sekitar pukul [jam]. [Komentar singkat menghubungkan emosi dengan cuaca/AQI saat itu]. Mungkin [saran aktivitas] bisa membantu menenangkan pikiranmu."
`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const insightText = response.text();

        if (!insightText) {
            return NextResponse.json({ insight: null, error: "Tidak dapat menghasilkan insight dari AI saat ini." });
        }

        // Simpan atau update insight di database
        const { data: upsertedInsight, error: dbError } = await supabase
            .from('journal_insights')
            .upsert(
                {
                    journal_id: journalId,
                    user_id: userId,
                    insight_text: insightText,
                    generated_at: new Date().toISOString(),
                },
                { onConflict: 'journal_id' } // Jika journal_id sudah ada, update field lain
            )
            .select('insight_text') // Hanya ambil insight_text setelah upsert
            .single();

        if (dbError) {
            console.error("Database error saving insight:", dbError);
            // Kembalikan insight yang digenerate meskipun gagal simpan, tapi beri info error
            return NextResponse.json({ insight: insightText, error_db: "Insight dihasilkan, tapi gagal disimpan ke database." }, { status: 200 }); // Status 200 karena insight tetap ada
        }

        return NextResponse.json({ insight: upsertedInsight?.insight_text || insightText });

    } catch (error: any) {
        console.error("Error in /api/gemini-daily-insight:", error);
        const errorMessage = error.message || "Kesalahan internal server saat menghasilkan insight.";
        return NextResponse.json({ insight: null, error: errorMessage, details: error.cause?.toString() || error.stack || "No details" }, { status: 500 });
    }
}