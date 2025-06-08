import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ListChecks, Smile, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WeatherApiResponse, EmotionApiResponse } from "@/types"; // Pastikan path ini benar
import JournalDetailWeatherSection from "@/components/edukasi/JournalDetailWeatherSection"; // Jika masih digunakan
import JournalInsightSection from "@/components/journal/JournalInsightSection"; // IMPORT BARU

export default async function JournalDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { id: journalId } = params;
  const { data: journal, error: journalError } = await supabase
    .from("journal_entries")
    .select("*, emotions(name)") // emotions(name) untuk emosi manual
    .eq("id", journalId)
    .eq("user_id", user.id)
    .single();

  if (journalError || !journal) {
    console.error("Error fetching journal or journal not found:", journalError);
    redirect("/protected/journal/history?error=notfound");
  }

  // Ambil insight awal jika ada dari tabel journal_insights
  const { data: initialInsightData, error: insightError } = await supabase
    .from('journal_insights')
    .select('insight_text')
    .eq('journal_id', journal.id)
    .eq('user_id', user.id) // Pastikan user hanya bisa akses insightnya sendiri
    .single();

  // PGRST116 berarti 'single row not found', ini bukan error fatal jika insight belum ada
  if (insightError && insightError.code !== 'PGRST116') {
    console.error("Error fetching initial insight:", insightError.message);
  }

  const weatherData = journal.weather_data as WeatherApiResponse | null;
  const emotionAnalysisData = journal.emotion_analysis as EmotionApiResponse | null; // Data dari analisis AI

  // Tentukan emosi utama untuk dikirim ke insight generator
  let primaryEmotionForInsight: string = "tidak diketahui";
  if (journal.emotion_source === 'ai' && emotionAnalysisData?.top_prediction?.label) {
    primaryEmotionForInsight = emotionAnalysisData.top_prediction.label;
  } else if (journal.emotion_source === 'manual' && journal.emotions?.name) {
    primaryEmotionForInsight = journal.emotions.name;
  }

  // Tentukan nama lokasi yang akan ditampilkan
  const locationDisplayName = journal.location_name || weatherData?.location.name || "lokasi tidak diketahui";

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/protected/journal/history" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Histori
          </Link>
        </Button>
      </div>
      <article className="bg-card p-6 sm:p-8 rounded-lg shadow-md border space-y-6">
        <header className="border-b pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-1">
                {journal.title || <span className="italic">Tanpa Judul</span>}
              </h1>
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4 mr-1.5" />
                <span>{new Date(journal.created_at).toLocaleString("id-ID", { dateStyle: 'full', timeStyle: 'short' })}</span>
              </div>
            </div>
            {primaryEmotionForInsight !== "tidak diketahui" && (
              <Badge variant="outline" className="text-sm whitespace-nowrap">
                Emosi: {primaryEmotionForInsight}
              </Badge>
            )}
          </div>
        </header>

        {/* Bagian Insight Harian Terintegrasi */}
        <JournalInsightSection
          initialInsightText={initialInsightData?.insight_text || null}
          journalId={journal.id}
          userId={user.id}
          journalContent={journal.content || ""}
          primaryEmotion={primaryEmotionForInsight}
          weatherData={weatherData}
          locationDisplayName={locationDisplayName}
        />

        <section>
          <h2 className="text-xl font-semibold mb-2">Isi Jurnal</h2>
          <div className="prose prose-sm sm:prose-base max-w-none bg-muted/30 p-4 rounded-md whitespace-pre-line">
            {journal.content || <p className="italic">Tidak ada konten jurnal.</p>}
          </div>
        </section>

        {/* Tampilkan detail cuaca jika masih relevan atau diinginkan */}
        {weatherData && (
            <JournalDetailWeatherSection
                weatherData={weatherData}
                journalCreatedAt={journal.created_at}
            />
        )}

        {/* Detail Analisis Emosi (AI) jika sumbernya AI */}
        {journal.emotion_source === "ai" && emotionAnalysisData && (
          <section>
            <h2 className="text-xl font-semibold mb-2 flex items-center"><ListChecks className="h-5 w-5 mr-2 text-primary" /> Detail Analisis Emosi (AI)</h2>
            <div className="bg-muted/30 p-4 rounded-md text-sm">
              <p className="mb-1">Emosi Dominan (AI): <strong>{emotionAnalysisData.top_prediction.label}</strong> (Keyakinan: {emotionAnalysisData.top_prediction.confidence.toFixed(2)}%)</p>
              <h4 className="font-medium mt-3 mb-1 text-xs">Semua Emosi Terdeteksi (AI):</h4>
              <ul className="list-disc list-inside pl-1 grid grid-cols-2 sm:grid-cols-3 gap-x-2 text-xs">
                {Object.entries(emotionAnalysisData.all_predictions)
                  .sort(([, a], [, b]) => b - a)
                  .map(([key, value]) => (
                    <li key={key} className="my-0.5">{key}: {value.toFixed(2)}%</li>
                  ))}
              </ul>
            </div>
          </section>
        )}

        {/* Jika emosi manual, tampilkan emosi pilihan */}
        {journal.emotion_source === "manual" && journal.emotions?.name && (
          <section>
            <h2 className="text-xl font-semibold mb-2 flex items-center"><Smile className="h-5 w-5 mr-2 text-primary" /> Emosi Pilihanmu</h2>
            <div className="bg-muted/30 p-4 rounded-md text-sm">
              <p>Emosi utama yang kamu pilih: <strong>{journal.emotions.name}</strong></p>
            </div>
          </section>
        )}
      </article>
    </div>
  );
}