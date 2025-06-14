import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ListChecks, Smile, CalendarDays, TrendingUp, TrendingDown, MinusCircle, Pencil } from "lucide-react"; // IMPORT ICON BARU
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WeatherApiResponse, EmotionApiResponse } from "@/types"; // Pastikan path ini benar
import JournalDetailWeatherSection from "@/components/edukasi/JournalDetailWeatherSection"; // Jika masih digunakan
import JournalInsightSection from "@/components/journal/JournalInsightSection";

export default async function JournalDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { id: journalId } = await params;
  const { data: journal, error: journalError } = await supabase
    .from("journal_entries")
    .select("*, emotions(name)") // emotions(name) untuk emosi manual, mood_score sudah termasuk di '*'
    .eq("id", journalId)
    .eq("user_id", user.id)
    .single();

  if (journalError || !journal) {
    console.error("Error fetching journal or journal not found:", journalError);
    redirect("/protected/journal/history?error=notfound");
  }

  const { data: initialInsightData, error: insightError } = await supabase
    .from('journal_insights')
    .select('insight_text')
    .eq('journal_id', journal.id)
    .eq('user_id', user.id)
    .single();

  if (insightError && insightError.code !== 'PGRST116') {
    console.error("Error fetching initial insight:", insightError.message);
  }

  const weatherData = journal.weather_data as WeatherApiResponse | null;
  const emotionAnalysisData = journal.emotion_analysis as EmotionApiResponse | null;

  let primaryEmotionForInsight: string = "tidak diketahui";
  if (journal.emotion_source === 'ai' && emotionAnalysisData?.top_prediction?.label) {
    primaryEmotionForInsight = emotionAnalysisData.top_prediction.label;
  } else if (journal.emotion_source === 'manual' && journal.emotions?.name) {
    primaryEmotionForInsight = journal.emotions.name;
  }

  const locationDisplayName = journal.location_name || weatherData?.location.name || "lokasi tidak diketahui";

  // Helper untuk tampilan Mood Score
  const getMoodScoreDisplay = (score: number | null | undefined) => {
    if (score === null || score === undefined) {
      return {
        label: "Tidak Ada Data",
        color: "text-gray-500",
        bgColor: "bg-gray-100",
        Icon: MinusCircle,
        description: "Mood score tidak tersedia untuk entri ini.",
        barClass: "bg-gray-300",
        barWidth: "0%",
        barOffset: "50%" // Tengah, tidak ada bar
      };
    }
    let label, color, bgColor, Icon, description;
    if (score >= 0.5) {
      label = "Sangat Positif"; color = "text-green-600"; bgColor = "bg-green-100"; Icon = TrendingUp;
      description = "Anda merasa sangat positif dan bersemangat!";
    } else if (score >= 0.1) {
      label = "Positif"; color = "text-emerald-600"; bgColor = "bg-emerald-100"; Icon = TrendingUp;
      description = "Anda dalam suasana hati yang baik.";
    } else if (score > -0.1) {
      label = "Netral"; color = "text-yellow-600"; bgColor = "bg-yellow-100"; Icon = MinusCircle;
      description = "Suasana hati Anda seimbang.";
    } else if (score > -0.5) {
      label = "Negatif"; color = "text-orange-600"; bgColor = "bg-orange-100"; Icon = TrendingDown;
      description = "Anda merasa sedikit kurang baik atau tertekan.";
    } else {
      label = "Sangat Negatif"; color = "text-red-600"; bgColor = "bg-red-100"; Icon = TrendingDown;
      description = "Anda merasa sangat negatif atau sedih.";
    }

    const barPercentage = (score + 1) * 50; // 0% at -1, 50% at 0, 100% at 1

    return {
      label,
      color,
      bgColor,
      Icon,
      description,
      barClass: score >= 0 ? 'bg-green-500' : 'bg-red-500',
      barWidth: `${Math.abs(score) * 50}%`,
      barOffset: score >= 0 ? '50%' : `${50 - (Math.abs(score) * 50)}%`
    };
  };

  const moodDisplay = getMoodScoreDisplay(journal.mood_score);
  const MoodIcon = moodDisplay.Icon;

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
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-1">
                {journal.title || <span className="italic">Tanpa Judul</span>}
              </h1>
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4 mr-1.5" />
                <span>{new Date(journal.created_at).toLocaleString("id-ID", { dateStyle: 'full', timeStyle: 'short' })}</span>
              </div>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2 mt-2 sm:mt-0">
              {primaryEmotionForInsight !== "tidak diketahui" && (
                <Badge variant="outline" className="text-sm whitespace-nowrap">
                  Emosi: {primaryEmotionForInsight}
                </Badge>
              )}
              {/* Mood Score Badge */}
              <div className={`${moodDisplay.bgColor} ${moodDisplay.color} px-3 py-1.5 rounded-md border text-xs sm:text-sm font-medium flex items-center gap-2 self-start sm:self-auto`}>
                <MoodIcon className="h-4 w-4" />
                <span>Mood: {moodDisplay.label} ({journal.mood_score !== null && journal.mood_score !== undefined ? journal.mood_score.toFixed(2) : 'N/A'})</span>
              </div>
            </div>
          </div>
        </header>

        {/* Bagian Mood Score Interaktif */}
        <section className="p-4 rounded-lg border bg-gradient-to-br from-slate-50 via-gray-50 to-sky-50 dark:from-slate-800 dark:via-gray-800 dark:to-sky-900">
          <h2 className="text-xl font-semibold mb-3 flex items-center">
            <MoodIcon className={`h-5 w-5 mr-2 ${moodDisplay.color}`} />
            Skor Mood Jurnal
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className={`md:col-span-1 p-3 rounded-md ${moodDisplay.bgColor} text-center`}>
              <p className={`text-3xl font-bold ${moodDisplay.color}`}>
                {journal.mood_score !== null && journal.mood_score !== undefined ? journal.mood_score.toFixed(2) : "N/A"}
              </p>
              <p className={`text-sm font-medium ${moodDisplay.color}`}>{moodDisplay.label}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground mb-1">Visualisasi Skor (-1.0 s/d +1.0):</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3.5 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 w-px h-full bg-gray-400 dark:bg-gray-500 z-10"></div>
                {journal.mood_score !== null && journal.mood_score !== undefined && (
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${moodDisplay.barClass}`}
                    style={{
                      width: moodDisplay.barWidth,
                      marginLeft: moodDisplay.barOffset,
                    }}
                  ></div>
                )}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
                <span>Sangat Negatif</span>
                <span>Netral</span>
                <span>Sangat Positif</span>
              </div>
              <p className="text-sm mt-3">{moodDisplay.description}</p>
              {journal.emotion_source && (
                <p className="text-xs text-muted-foreground mt-1">
                  Sumber skor: {journal.emotion_source === 'ai' ? 'Analisis AI Otomatis' : 'Pilihan Emosi Manual'}
                </p>
              )}
            </div>
          </div>
        </section>

        <JournalInsightSection
          initialInsightText={initialInsightData?.insight_text || null}
          journalId={journal.id}
          userId={user.id}
          journalContent={journal.content || ""}
          primaryEmotion={primaryEmotionForInsight}
          weatherData={weatherData}
          locationDisplayName={locationDisplayName}
          journalCreatedAt={journal.created_at}
        />

        <section>
          <h2 className="text-xl font-semibold mb-2">Isi Jurnal</h2>
          <div className="prose prose-sm sm:prose-base max-w-none bg-muted/30 p-4 rounded-md whitespace-pre-line dark:bg-slate-800">
            {journal.content || <p className="italic">Tidak ada konten jurnal.</p>}
          </div>
        </section>

        {weatherData && (
          <JournalDetailWeatherSection
            weatherData={weatherData}
            journalCreatedAt={journal.created_at}
          />
        )}

        {journal.emotion_source === "ai" && emotionAnalysisData && (
          <section>
            <h2 className="text-xl font-semibold mb-2 flex items-center"><ListChecks className="h-5 w-5 mr-2 text-primary" /> Detail Analisis Emosi (AI)</h2>
            <div className="bg-muted/30 p-4 rounded-md text-sm dark:bg-slate-800">
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

        {journal.emotion_source === "manual" && journal.emotions?.name && (
          <section>
            <h2 className="text-xl font-semibold mb-2 flex items-center"><Smile className="h-5 w-5 mr-2 text-primary" /> Emosi Pilihanmu</h2>
            <div className="bg-muted/30 p-4 rounded-md text-sm dark:bg-slate-800">
              <p>Emosi utama yang kamu pilih: <strong>{journal.emotions.name}</strong></p>
            </div>
          </section>
        )}
      </article>
    </div>
  );
}