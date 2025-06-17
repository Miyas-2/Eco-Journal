import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ListChecks, Smile, CalendarDays, TrendingUp, TrendingDown, MinusCircle, Edit, Eye, MapPin, Brain, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WeatherApiResponse, EmotionApiResponse } from "@/types";
import JournalDetailWeatherSection from "@/components/edukasi/JournalDetailWeatherSection";
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
    .select("*, emotions(name)")
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
        color: "text-stone-500",
        bgColor: "bg-stone-100",
        gradientClass: "from-stone-100 to-stone-200",
        Icon: MinusCircle,
        description: "Mood score tidak tersedia untuk entri ini.",
        barClass: "bg-stone-300",
        barWidth: "0%",
        barOffset: "50%"
      };
    }
    let label, color, bgColor, gradientClass, Icon, description;
    if (score >= 0.5) {
      label = "Sangat Positif"; 
      color = "text-emerald-700"; 
      bgColor = "bg-emerald-50"; 
      gradientClass = "from-emerald-100 to-emerald-200";
      Icon = TrendingUp;
      description = "Anda merasa sangat positif dan bersemangat! ✨";
    } else if (score >= 0.1) {
      label = "Positif"; 
      color = "text-emerald-600"; 
      bgColor = "bg-emerald-50"; 
      gradientClass = "from-emerald-100 to-teal-100";
      Icon = TrendingUp;
      description = "Anda dalam suasana hati yang baik. 🌱";
    } else if (score > -0.1) {
      label = "Netral"; 
      color = "text-amber-600"; 
      bgColor = "bg-amber-50"; 
      gradientClass = "from-amber-100 to-yellow-100";
      Icon = MinusCircle;
      description = "Suasana hati Anda seimbang. ⚖️";
    } else if (score > -0.5) {
      label = "Negatif"; 
      color = "text-orange-600"; 
      bgColor = "bg-orange-50"; 
      gradientClass = "from-orange-100 to-red-100";
      Icon = TrendingDown;
      description = "Anda merasa sedikit kurang baik atau tertekan. 🤗";
    } else {
      label = "Sangat Negatif"; 
      color = "text-red-600"; 
      bgColor = "bg-red-50"; 
      gradientClass = "from-red-100 to-pink-100";
      Icon = TrendingDown;
      description = "Anda merasa sangat negatif atau sedih. 💙";
    }

    return {
      label,
      color,
      bgColor,
      gradientClass,
      Icon,
      description,
      barClass: score >= 0 ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gradient-to-r from-orange-400 to-red-400',
      barWidth: `${Math.abs(score) * 50}%`,
      barOffset: score >= 0 ? '50%' : `${50 - (Math.abs(score) * 50)}%`
    };
  };

  const moodDisplay = getMoodScoreDisplay(journal.mood_score);
  const MoodIcon = moodDisplay.Icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50/80 font-organik">
      {/* Header Section - More Compact Mobile */}
      <div className="bg-gradient-to-r from-white/95 to-stone-50/95 backdrop-blur-lg border-b border-stone-200/30 sticky top-16 z-30">
        <div className="container-organic py-3 md:py-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild className="hover:bg-emerald-50 text-stone-600 rounded-xl transition-all duration-300">
              <Link href="/protected/journal/history" className="flex items-center gap-2 md:gap-3">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-stone-100 to-stone-200 rounded-lg md:rounded-xl flex items-center justify-center">
                  <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
                </div>
                <span className="font-medium text-sm md:text-base">Kembali</span>
              </Link>
            </Button>

            <div className="flex items-center gap-2 md:gap-3">
              <Button variant="outline" size="sm" asChild className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 rounded-lg md:rounded-xl transition-all duration-300">
                <Link href={`/protected/journal/edit/${journal.id}`} className="flex items-center gap-1 md:gap-2">
                  <Edit className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="text-xs md:text-sm">Edit</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-organic py-4 md:py-8 space-y-4 md:space-y-6">
        {/* Journal Header - Compact Mobile */}
        <section className="card-organic rounded-2xl md:rounded-3xl p-4 md:p-8 bg-gradient-to-br from-emerald-50/30 via-white/50 to-teal-50/30 pattern-organic relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex flex-col gap-3 md:gap-6">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200/40 float-organic">
                  <Eye className="h-4 w-4 md:h-6 md:w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg md:text-3xl lg:text-4xl font-bold text-stone-700 leading-tight mb-2 md:mb-4">
                    {journal.title || <span className="italic text-stone-500">Jurnal Tanpa Judul</span>}
                  </h1>
                  
                  {/* Mobile: Stack info vertically, Desktop: horizontal */}
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-xs md:text-sm text-stone-500">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 md:w-6 md:h-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-md md:rounded-lg flex items-center justify-center">
                        <CalendarDays className="h-2 w-2 md:h-3 md:w-3 text-blue-600" />
                      </div>
                      <span className="font-medium">
                        {new Date(journal.created_at).toLocaleString("id-ID", { 
                          dateStyle: 'medium', 
                          timeStyle: 'short' 
                        })}
                      </span>
                    </div>
                    
                    {locationDisplayName && locationDisplayName !== "lokasi tidak diketahui" && (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 md:w-6 md:h-6 bg-gradient-to-br from-green-100 to-green-200 rounded-md md:rounded-lg flex items-center justify-center">
                          <MapPin className="h-2 w-2 md:h-3 md:w-3 text-green-600" />
                        </div>
                        <span className="font-medium truncate">{locationDisplayName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile: Horizontal badges, Desktop: vertical */}
              <div className="flex flex-wrap md:flex-col gap-2 md:gap-3 md:self-end">
                {/* Emotion Badge */}
                {primaryEmotionForInsight !== "tidak diketahui" && (
                  <Badge className={`${journal.emotion_source === 'ai' 
                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-200/50' 
                    : 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200/50'
                  } font-medium rounded-full px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm`}>
                    {journal.emotion_source === 'ai' ? (
                      <Brain className="h-2 w-2 md:h-3 md:w-3 mr-1 md:mr-2" />
                    ) : (
                      <Heart className="h-2 w-2 md:h-3 md:w-3 mr-1 md:mr-2" />
                    )}
                    {primaryEmotionForInsight}
                  </Badge>
                )}

                {/* Mood Score Badge */}
                <div className={`${moodDisplay.bgColor} ${moodDisplay.color} px-2 md:px-4 py-1 md:py-2 rounded-full border border-stone-200/50 text-xs md:text-sm font-medium flex items-center gap-1 md:gap-3 shadow-sm`}>
                  <MoodIcon className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="whitespace-nowrap">
                    {moodDisplay.label}
                    {journal.mood_score !== null && journal.mood_score !== undefined 
                      ? ` (${journal.mood_score.toFixed(1)})` 
                      : ' (N/A)'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mood Score Interactive Section - Compact */}
        <section className={`card-organic rounded-2xl md:rounded-3xl p-4 md:p-8 bg-gradient-to-br ${moodDisplay.gradientClass} border-0`}>
          <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-6">
            <div className={`w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br ${moodDisplay.gradientClass} rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg`}>
              <MoodIcon className={`h-4 w-4 md:h-6 md:w-6 ${moodDisplay.color}`} />
            </div>
            <h2 className="text-lg md:text-2xl font-bold text-stone-700">Analisis Mood</h2>
          </div>

          {/* Mobile: Single column, Desktop: Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 items-center">
            <div className="lg:col-span-1">
              <div className={`card-organic rounded-2xl md:rounded-3xl p-4 md:p-6 text-center bg-white/80 shadow-lg`}>
                <div className={`text-2xl md:text-5xl font-bold ${moodDisplay.color} mb-1 md:mb-2`}>
                  {journal.mood_score !== null && journal.mood_score !== undefined 
                    ? journal.mood_score.toFixed(2) 
                    : "N/A"
                  }
                </div>
                <div className={`text-sm md:text-lg font-semibold ${moodDisplay.color} mb-1`}>
                  {moodDisplay.label}
                </div>
                <div className="text-xs md:text-sm text-stone-500">
                  Skor Mood
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3 md:space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2 md:mb-3">
                  <span className="text-xs md:text-sm font-medium text-stone-700">Visualisasi Skor</span>
                  <span className="text-xs text-stone-500">-1.0 hingga +1.0</span>
                </div>
                
                <div className="relative">
                  <div className="w-full bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 rounded-full h-4 md:h-6 relative overflow-hidden shadow-inner">
                    <div className="absolute top-0 left-1/2 w-px h-full bg-stone-400 z-10"></div>
                    {journal.mood_score !== null && journal.mood_score !== undefined && (
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${moodDisplay.barClass} shadow-sm`}
                        style={{
                          width: moodDisplay.barWidth,
                          marginLeft: moodDisplay.barOffset,
                        }}
                      ></div>
                    )}
                  </div>
                  
                  <div className="flex justify-between text-xs text-stone-500 mt-1 md:mt-2 px-1">
                    <span>Negatif</span>
                    <span>Netral</span>
                    <span>Positif</span>
                  </div>
                </div>
              </div>

              <div className="card-organic rounded-xl md:rounded-2xl p-3 md:p-6 bg-white/60">
                <h4 className="font-semibold text-stone-700 mb-1 md:mb-2 flex items-center gap-2 text-sm md:text-base">
                  <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-emerald-600" />
                  Interpretasi
                </h4>
                <p className="text-xs md:text-sm text-stone-600 leading-relaxed mb-2 md:mb-3">
                  {moodDisplay.description}
                </p>
                {journal.emotion_source && (
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-400 rounded-full"></div>
                    <span>
                      {journal.emotion_source === 'ai' ? 'AI Otomatis' : 'Pilihan Manual'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Journal Insight Section */}
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

        {/* Journal Content - Compact */}
        <section className="card-organic rounded-2xl md:rounded-3xl p-4 md:p-8">
          <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-6">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl md:rounded-2xl flex items-center justify-center">
              <span className="text-emerald-600 text-sm md:text-lg">📖</span>
            </div>
            <h2 className="text-lg md:text-2xl font-bold text-stone-700">Isi Jurnal</h2>
          </div>
          
          <div className="card-organic rounded-xl md:rounded-2xl p-4 md:p-6 bg-gradient-to-br from-stone-50/50 to-white/80 border border-stone-200/30">
            <div className="prose prose-sm md:prose-lg max-w-none text-stone-600 leading-relaxed whitespace-pre-line">
              {journal.content || (
                <p className="italic text-stone-500">
                  Tidak ada konten jurnal yang tersedia.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Weather Section */}
        {weatherData && (
          <JournalDetailWeatherSection
            weatherData={weatherData}
            journalCreatedAt={journal.created_at}
          />
        )}

        {/* AI Emotion Analysis - Compact */}
        {journal.emotion_source === "ai" && emotionAnalysisData && (
          <section className="card-organic rounded-2xl md:rounded-3xl p-4 md:p-8 bg-gradient-to-br from-purple-50/30 to-pink-50/30 border border-purple-200/30">
            <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-6">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200/40">
                <Brain className="h-4 w-4 md:h-6 md:w-6 text-white" />
              </div>
              <h2 className="text-lg md:text-2xl font-bold text-stone-700">Analisis Emosi AI</h2>
            </div>

            <div className="space-y-4 md:space-y-6">
              <div className="card-organic rounded-xl md:rounded-2xl p-4 md:p-6 bg-white/80">
                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                  <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                  <h3 className="text-base md:text-lg font-semibold text-stone-700">Emosi Dominan</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg md:text-2xl font-bold text-purple-700 mb-1">
                      {emotionAnalysisData.top_prediction.label}
                    </p>
                    <p className="text-xs md:text-sm text-stone-500">
                      Akurasi: {emotionAnalysisData.top_prediction.confidence.toFixed(1)}%
                    </p>
                  </div>
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl md:rounded-2xl flex items-center justify-center">
                    <span className="text-lg md:text-2xl">🎯</span>
                  </div>
                </div>
              </div>

              <div className="card-organic rounded-xl md:rounded-2xl p-4 md:p-6 bg-white/80">
                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                  <ListChecks className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                  <h3 className="text-base md:text-lg font-semibold text-stone-700">Detail Analisis</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
                  {Object.entries(emotionAnalysisData.all_predictions)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8) // Limit to 6 items on mobile
                    .map(([key, value]) => (
                      <div key={key} className="bg-gradient-to-r from-stone-50 to-white rounded-lg md:rounded-xl p-2 md:p-3 border border-stone-200/50 text-center">
                        <div className="font-medium text-xs md:text-sm text-stone-700 capitalize mb-1">
                          {key}
                        </div>
                        <div className="text-xs text-stone-500">
                          {value.toFixed(1)}%
                        </div>
                        <div className="w-full bg-stone-200 rounded-full h-1 md:h-1.5 mt-1 md:mt-2">
                          <div 
                            className="bg-gradient-to-r from-purple-400 to-pink-400 h-1 md:h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${value}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Manual Emotion Selection - Compact */}
        {journal.emotion_source === "manual" && journal.emotions?.name && (
          <section className="card-organic rounded-2xl md:rounded-3xl p-4 md:p-8 bg-gradient-to-br from-emerald-50/30 to-teal-50/30 border border-emerald-200/30">
            <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-6">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200/40">
                <Heart className="h-4 w-4 md:h-6 md:w-6 text-white" />
              </div>
              <h2 className="text-lg md:text-2xl font-bold text-stone-700">Emosi Pilihan Anda</h2>
            </div>

            <div className="card-organic rounded-xl md:rounded-2xl p-4 md:p-6 bg-white/80">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-stone-500 mb-1 md:mb-2">Emosi yang Anda pilih:</p>
                  <p className="text-lg md:text-2xl font-bold text-emerald-700">
                    {journal.emotions.name}
                  </p>
                  <p className="text-xs md:text-sm text-stone-500 mt-1">
                    Dipilih secara manual
                  </p>
                </div>
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl md:rounded-2xl flex items-center justify-center">
                  <span className="text-lg md:text-2xl">💚</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Bottom Spacer for Mobile Navigation */}
        <div className="h-4 md:h-8"></div>
      </div>
    </div>
  );
}