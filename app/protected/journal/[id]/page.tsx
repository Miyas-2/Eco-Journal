"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Brain,
  Heart,
  Cloud,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Edit,
  Share,
  X,
  ChevronDown,
  BarChart3,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WeatherApiResponse, EmotionApiResponse } from "@/types";
import JournalInsightSection from "@/components/journal/JournalInsightSection";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Emotion color mapping with soft pastels
const emotionColors = {
  joy: "bg-yellow-50 text-yellow-700 border-yellow-200",
  trust: "bg-green-50 text-green-700 border-green-200",
  fear: "bg-purple-50 text-purple-700 border-purple-200",
  surprise: "bg-indigo-50 text-indigo-700 border-indigo-200",
  sadness: "bg-slate-50 text-slate-700 border-slate-200",
  disgust: "bg-emerald-50 text-emerald-700 border-emerald-200",
  anger: "bg-red-50 text-red-700 border-red-200",
  anticipation: "bg-cyan-50 text-cyan-700 border-cyan-200",
  neutral: "bg-slate-50 text-slate-700 border-slate-200",
};

const emotionEmojis = {
  joy: "😄",
  trust: "🤗",
  fear: "😨",
  surprise: "😲",
  sadness: "😢",
  disgust: "🤢",
  anger: "😠",
  anticipation: "🤔",
  neutral: "😐",
};

type SelectedPanel = 'emotion' | 'weather' | 'mood' | 'insights' | null;

interface JournalDetailPageProps {
  params: { id: string };
}

export default function JournalDetailPage({ params }: JournalDetailPageProps) {
  const [journal, setJournal] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPanel, setSelectedPanel] = useState<SelectedPanel>(null);
  const [initialInsightData, setInitialInsightData] = useState<any>(null);

  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUser(user);

      const { id: journalId } = await params;
      const { data: journal, error: journalError } = await supabase
        .from("journal_entries")
        .select("*, emotions(name)")
        .eq("id", journalId)
        .eq("user_id", user.id)
        .single();

      if (journalError || !journal) {
        console.error("Error fetching journal or journal not found:", journalError);
        router.push("/protected/journal/history?error=notfound");
        return;
      }

      setJournal(journal);

      const { data: insightData, error: insightError } = await supabase
        .from('journal_insights')
        .select('insight_text')
        .eq('journal_id', journal.id)
        .eq('user_id', user.id)
        .single();

      if (insightError && insightError.code !== 'PGRST116') {
        console.error("Error fetching initial insight:", insightError.message);
      } else {
        setInitialInsightData(insightData);
      }

      setLoading(false);
    };

    loadData();
  }, [params, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-600">Memuat jurnal...</p>
        </div>
      </div>
    );
  }

  if (!journal || !user) return null;

  const weatherData = journal.weather_data as WeatherApiResponse | null;
  const emotionAnalysisData = journal.emotion_analysis as EmotionApiResponse | null;

  // Get primary emotion
  let primaryEmotion: string = "tidak diketahui";
  if (journal.emotion_source === 'ai' && emotionAnalysisData?.top_prediction?.label) {
    primaryEmotion = emotionAnalysisData.top_prediction.label;
  } else if (journal.emotion_source === 'manual' && journal.emotions?.name) {
    primaryEmotion = journal.emotions.name;
  }

  const locationDisplayName = journal.location_name || weatherData?.location.name || "lokasi tidak diketahui";

  // Helper untuk mood score display
  const getMoodScoreDisplay = (score: number | null | undefined) => {
    if (score === null || score === undefined) {
      return {
        label: "Tidak Ada Data",
        color: "text-slate-500",
        bgColor: "bg-slate-50",
        Icon: Minus,
        description: "Mood score tidak tersedia",
        percentage: 50
      };
    }

    let label, color, bgColor, Icon, description;
    const percentage = ((score + 1) / 2) * 100; // Convert -1 to 1 range to 0-100%

    if (score >= 0.5) {
      label = "Sangat Positif";
      color = "text-emerald-600";
      bgColor = "bg-emerald-50";
      Icon = TrendingUp;
      description = "Anda merasa sangat positif dan bersemangat!";
    } else if (score >= 0.1) {
      label = "Positif";
      color = "text-green-600";
      bgColor = "bg-green-50";
      Icon = TrendingUp;
      description = "Anda dalam suasana hati yang baik.";
    } else if (score > -0.1) {
      label = "Netral";
      color = "text-yellow-600";
      bgColor = "bg-yellow-50";
      Icon = Minus;
      description = "Suasana hati Anda seimbang.";
    } else if (score > -0.5) {
      label = "Negatif";
      color = "text-orange-600";
      bgColor = "bg-orange-50";
      Icon = TrendingDown;
      description = "Anda merasa sedikit kurang baik.";
    } else {
      label = "Sangat Negatif";
      color = "text-red-600";
      bgColor = "bg-red-50";
      Icon = TrendingDown;
      description = "Anda merasa sangat negatif atau sedih.";
    }

    return { label, color, bgColor, Icon, description, percentage };
  };

  const moodDisplay = getMoodScoreDisplay(journal.mood_score);
  const MoodIcon = moodDisplay.Icon;

  // Get emotion color and emoji
  const getEmotionColor = (emotion: string) => {
    return emotionColors[emotion?.toLowerCase() as keyof typeof emotionColors] || emotionColors.neutral;
  };

  const getEmotionEmoji = (emotion: string) => {
    return emotionEmojis[emotion?.toLowerCase() as keyof typeof emotionEmojis] || "😐";
  };

  const togglePanel = (panel: SelectedPanel) => {
    setSelectedPanel(selectedPanel === panel ? null : panel);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mx-6 mt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl">
                <Link href="/protected/journal/history" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Kembali
                </Link>
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl">
                  <Link href={`/protected/journal/edit/${journal.id}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl">
                  <Share className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Data Bar */}
        <div className="mx-6 my-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-100/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Emotion Data */}
                {primaryEmotion !== "tidak diketahui" && (
                  <button
                    onClick={() => togglePanel('emotion')}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-300 ease-out
                      ${selectedPanel === 'emotion'
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100'
                        : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-800 border border-transparent'
                      }
                    `}
                  >
                    <Heart className="h-4 w-4" />
                    <span className="text-base mr-1">{getEmotionEmoji(primaryEmotion)}</span>
                    <span className="capitalize text-sm font-medium">{primaryEmotion}</span>
                    <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${selectedPanel === 'emotion' ? 'rotate-180' : ''}`} />
                  </button>
                )}

                {/* Mood Score */}
                <button
                  onClick={() => togglePanel('mood')}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-300 ease-out
                    ${selectedPanel === 'mood'
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100'
                      : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-800 border border-transparent'
                    }
                  `}
                >
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Mood: {journal.mood_score?.toFixed(1) || 'N/A'}
                  </span>
                  <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${selectedPanel === 'mood' ? 'rotate-180' : ''}`} />
                </button>

                {/* Weather Data */}
                {weatherData && (
                  <button
                    onClick={() => togglePanel('weather')}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-300 ease-out
                      ${selectedPanel === 'weather'
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100'
                        : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-800 border border-transparent'
                      }
                    `}
                  >
                    <Cloud className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {weatherData.current.temp_c}°C
                    </span>
                    <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${selectedPanel === 'weather' ? 'rotate-180' : ''}`} />
                  </button>
                )}

                {/* AI Insights */}
                <button
                  onClick={() => togglePanel('insights')}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-300 ease-out
                    ${selectedPanel === 'insights'
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100'
                      : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-800 border border-transparent'
                    }
                  `}
                >
                  <Brain className="h-4 w-4" />
                  <span className="text-sm font-medium">AI Insights</span>
                  <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${selectedPanel === 'insights' ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <div className="text-xs text-slate-500 bg-slate-50/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-slate-100/50">
                {format(new Date(journal.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Main Content Area */}
          <div className={`transition-all duration-300 ${selectedPanel ? 'w-2/3' : 'w-full'}`}>
            <div className="px-6 py-8">
              {/* Journal Title */}
              <div className="mb-12 text-center">
                <h1 className="text-4xl lg:text-5xl font-light text-slate-800 mb-6 leading-tight tracking-tight">
                  {journal.title || "Tanpa Judul"}
                </h1>

                <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(journal.created_at), 'EEEE, dd MMMM yyyy', { locale: id })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {format(new Date(journal.created_at), 'HH:mm', { locale: id })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Journal Content */}
              <div className="max-w-3xl mx-auto">
                <div className="prose prose-lg prose-slate max-w-none leading-relaxed">
                  <div className="text-slate-700 text-lg leading-loose whitespace-pre-line font-light">
                    {journal.content || "Tidak ada konten jurnal."}
                  </div>
                </div>
              </div>

              {/* Footer Stats */}
              <div className="mt-16 pt-8 border-t border-slate-200 max-w-3xl mx-auto">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center gap-8">
                    <span className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      {journal.content ? journal.content.split(' ').length : 0} kata
                    </span>
                    <span>{journal.content ? journal.content.length : 0} karakter</span>
                    <span>{journal.content ? Math.ceil(journal.content.split(' ').length / 200) : 0} menit baca</span>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl">
                    <span>ID: {journal.id.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className={`transition-all duration-300 ${selectedPanel ? 'w-1/3 opacity-100' : 'w-0 opacity-0 overflow-hidden'
            }`}>
            {selectedPanel && (
              <div className="mx-6 my-4 bg-white border border-slate-200 rounded-3xl shadow-sm h-[calc(100vh-8rem)] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-slate-800 flex items-center gap-2">
                      {selectedPanel === 'emotion' && (
                        <>
                          <div className="w-8 h-8 bg-pink-50 rounded-xl flex items-center justify-center">
                            <Heart className="h-4 w-4 text-pink-500" />
                          </div>
                          Analisis Emosi
                        </>
                      )}
                      {selectedPanel === 'mood' && (
                        <>
                          <div className="w-8 h-8 bg-yellow-50 rounded-xl flex items-center justify-center">
                            <Zap className="h-4 w-4 text-yellow-500" />
                          </div>
                          Skor Mood
                        </>
                      )}
                      {selectedPanel === 'weather' && (
                        <>
                          <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Cloud className="h-4 w-4 text-blue-500" />
                          </div>
                          Data Cuaca & Lingkungan
                        </>
                      )}
                      {selectedPanel === 'insights' && (
                        <>
                          <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center">
                            <Brain className="h-4 w-4 text-sky-500" />
                          </div>
                          AI Insights
                        </>
                      )}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPanel(null)}
                      className="h-8 w-8 p-0 rounded-xl hover:bg-slate-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Emotion Panel */}
                  {selectedPanel === 'emotion' && (
                    <div className="space-y-6">
                      {journal.emotion_source === "ai" && emotionAnalysisData ? (
                        <>
                          {/* Top Prediction */}
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Emosi Dominan</span>
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200 rounded-xl text-xs">
                                {emotionAnalysisData.top_prediction.confidence.toFixed(1)}% yakin
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{getEmotionEmoji(emotionAnalysisData.top_prediction.label)}</span>
                              <div>
                                <span className="text-lg font-medium text-slate-800 capitalize">
                                  {emotionAnalysisData.top_prediction.label}
                                </span>
                                <p className="text-xs text-slate-600 mt-1">AI mendeteksi emosi dominan</p>
                              </div>
                            </div>
                          </div>

                          {/* All Predictions */}
                          <div>
                            <h4 className="text-xs font-medium text-slate-600 mb-3 uppercase tracking-wide">Detail Analisis</h4>
                            <div className="space-y-3">
                              {Object.entries(emotionAnalysisData.all_predictions)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 6)
                                .map(([emotion, confidence]) => (
                                  <div key={emotion} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm">{getEmotionEmoji(emotion)}</span>
                                        <span className="text-sm font-medium text-slate-700 capitalize">{emotion}</span>
                                      </div>
                                      <span className="text-xs text-slate-500 font-medium">{confidence.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-blue-400 rounded-full transition-all duration-700"
                                        style={{ width: `${confidence}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </>
                      ) : journal.emotion_source === "manual" && journal.emotions?.name ? (
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{getEmotionEmoji(journal.emotions.name)}</span>
                            <div>
                              <p className="text-lg font-medium text-slate-800 capitalize mb-1">{journal.emotions.name}</p>
                              <p className="text-xs text-slate-600">Emosi yang Anda pilih</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Heart className="h-8 w-8 text-slate-400" />
                          </div>
                          <p className="text-sm text-slate-600">Tidak ada data emosi tersedia</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mood Panel */}
                  {selectedPanel === 'mood' && (
                    <div className="space-y-6">
                      <div className={`${moodDisplay.bgColor} rounded-2xl p-6 border border-slate-200`}>
                        <div className="flex items-center justify-center mb-4">
                          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                            <MoodIcon className={`h-8 w-8 ${moodDisplay.color}`} />
                          </div>
                        </div>
                        <div className="text-center">
                          <div className={`text-4xl font-bold ${moodDisplay.color} mb-2`}>
                            {journal.mood_score !== null && journal.mood_score !== undefined
                              ? journal.mood_score.toFixed(2)
                              : "N/A"
                            }
                          </div>
                          <div className={`text-lg font-medium ${moodDisplay.color} mb-2`}>
                            {moodDisplay.label}
                          </div>
                          <p className="text-sm text-slate-600">
                            {moodDisplay.description}
                          </p>
                        </div>
                      </div>

                      {journal.mood_score !== null && journal.mood_score !== undefined && (
                        <div className="space-y-3">
                          <div className="w-full bg-slate-200 rounded-full h-4 relative overflow-hidden shadow-inner">
                            <div className="absolute top-0 left-1/2 w-0.5 h-full bg-slate-400 z-10 rounded-full"></div>
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${journal.mood_score >= 0 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-red-500'
                                }`}
                              style={{
                                width: `${Math.abs(journal.mood_score) * 50}%`,
                                marginLeft: journal.mood_score >= 0 ? '50%' : `${50 - (Math.abs(journal.mood_score) * 50)}%`
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>-1.0</span>
                            <span>0</span>
                            <span>+1.0</span>
                          </div>
                        </div>
                      )}

                      {journal.emotion_source && (
                        <div className="pt-4 border-t border-slate-200">
                          <p className="text-xs text-slate-500 text-center">
                            💡 Sumber: {journal.emotion_source === 'ai' ? 'Analisis AI' : 'Pilihan Manual'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Weather Panel */}
                  {selectedPanel === 'weather' && weatherData && (
                    <div className="space-y-6">
                      {/* Location */}
                      <div className="text-center pb-4 border-b border-slate-200">
                        <p className="text-xs text-slate-600 mb-1 uppercase tracking-wide">📍 Lokasi</p>
                        <p className="text-sm font-medium text-slate-800">{locationDisplayName}</p>
                      </div>

                      {/* Weather Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl border border-orange-100">
                          <Thermometer className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                          <p className="text-xl font-bold text-slate-800 mb-1">
                            {weatherData.current.temp_c}°C
                          </p>
                          <p className="text-xs text-slate-600">Suhu</p>
                        </div>

                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                          <Droplets className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                          <p className="text-xl font-bold text-slate-800 mb-1">
                            {weatherData.current.humidity}%
                          </p>
                          <p className="text-xs text-slate-600">Kelembaban</p>
                        </div>

                        <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border border-slate-100">
                          <Wind className="h-6 w-6 text-slate-500 mx-auto mb-2" />
                          <p className="text-xl font-bold text-slate-800 mb-1">
                            {weatherData.current.wind_kph}
                          </p>
                          <p className="text-xs text-slate-600">km/h</p>
                        </div>

                        <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                          <Eye className="h-6 w-6 text-indigo-500 mx-auto mb-2" />
                          <p className="text-xl font-bold text-slate-800 mb-1">
                            {weatherData.current.vis_km}
                          </p>
                          <p className="text-xs text-slate-600">km Pandang</p>
                        </div>
                      </div>

                      {/* Weather Condition */}
                      <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                        <p className="font-medium text-slate-800 mb-1">{weatherData.current.condition.text}</p>
                        <p className="text-xs text-slate-600">Kondisi Cuaca</p>
                      </div>

                      {/* AQI if available */}
                      {weatherData.current.air_quality && (
                        <div className="pt-4 border-t border-slate-200">
                          <h4 className="text-xs font-medium text-slate-600 mb-3 text-center uppercase tracking-wide">🌬️ Kualitas Udara</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="text-lg font-bold text-slate-800">{weatherData.current.air_quality.co?.toFixed(1) ?? 'N/A'}</div>
                              <div className="text-xs text-slate-600">CO</div>
                            </div>
                            <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="text-lg font-bold text-slate-800">{weatherData.current.air_quality.no2?.toFixed(1) ?? 'N/A'}</div>
                              <div className="text-xs text-slate-600">NO2</div>
                            </div>
                            <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="text-lg font-bold text-slate-800">{weatherData.current.air_quality.o3?.toFixed(1) ?? 'N/A'}</div>
                              <div className="text-xs text-slate-600">O3</div>
                            </div>
                            <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="text-lg font-bold text-slate-800">{weatherData.current.air_quality.pm2_5?.toFixed(1) ?? 'N/A'}</div>
                              <div className="text-xs text-slate-600">PM2.5</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Insights Panel */}
                  {selectedPanel === 'insights' && (
                    <div className="px-2">
                      <JournalInsightSection
                        initialInsightText={initialInsightData?.insight_text || null}
                        journalId={journal.id}
                        userId={user.id}
                        journalContent={journal.content || ""}
                        primaryEmotion={primaryEmotion}
                        weatherData={weatherData}
                        locationDisplayName={locationDisplayName}
                        journalCreatedAt={journal.created_at}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}