"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Share,
  Edit,
  Trash2,
  MapPin,
  Sparkles,
} from "lucide-react";
import { WeatherApiResponse, EmotionApiResponse } from "@/types";
import JournalInsightSection from "@/components/journal/JournalInsightSection";

interface JournalDetailPageProps {
  params: { id: string };
}

export default function JournalDetailPage({ params }: JournalDetailPageProps) {
  const [journal, setJournal] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
      <div style={{ fontFamily: 'Lexend, sans-serif' }} className="min-h-screen bg-[#f8fafc] dark:bg-[#101a22] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-white dark:bg-[#1e2a35] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <div className="w-5 h-5 border-2 border-[#2b9dee] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-600 dark:text-slate-400" style={{ fontFamily: 'Lexend, sans-serif' }}>Loading journal...</p>
        </div>
      </div>
    );
  }

  if (!journal || !user) return null;

  const weatherData = journal.weather_data as WeatherApiResponse | null;
  const emotionAnalysisData = journal.emotion_analysis as EmotionApiResponse | null;

  // Get primary emotion
  let primaryEmotion: string = "Unknown";
  if (journal.emotion_source === 'ai' && emotionAnalysisData?.top_prediction?.label) {
    primaryEmotion = emotionAnalysisData.top_prediction.label;
  } else if (journal.emotion_source === 'manual' && journal.emotions?.name) {
    primaryEmotion = journal.emotions.name;
  }

  const locationDisplayName = journal.location_name || weatherData?.location.name || "Unknown location";

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${dayName}, ${monthName} ${day}, ${year} • ${hours}:${minutes}`;
  };

  // Get AQI label
  const getAQILabel = (index: number) => {
    if (index <= 1) return { label: 'Good', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800/30' };
    if (index <= 2) return { label: 'Moderate', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-100 dark:border-yellow-800/30' };
    if (index <= 3) return { label: 'Unhealthy for Sensitive', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-100 dark:border-orange-800/30' };
    if (index <= 4) return { label: 'Unhealthy', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-800/30' };
    if (index <= 5) return { label: 'Very Unhealthy', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-100 dark:border-purple-800/30' };
    return { label: 'Hazardous', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-100 dark:border-rose-800/30' };
  };

  const aqiIndex = weatherData?.current.air_quality?.['us-epa-index'];
  const aqiData = typeof aqiIndex === 'number' ? getAQILabel(aqiIndex) : null;

  return (
    <div style={{ fontFamily: 'Lexend, sans-serif' }} className="bg-[#f8fafc] dark:bg-[#101a22] min-h-screen transition-colors duration-300">
      <main className="flex-1 w-full px-4 py-8 md:px-10 lg:px-20 xl:px-40 flex justify-center">
        <div className="max-w-[1200px] w-full">
          {/* Back Button & Actions */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push('/protected/journal/history')}
              className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#2b9dee] dark:hover:text-[#2b9dee] transition-colors group"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Journal</span>
            </button>
            <div className="flex gap-2">
              <button
                className="size-9 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#2b9dee] transition-all"
                title="Share"
              >
                <Share className="h-5 w-5" />
              </button>
              <button
                onClick={() => router.push(`/protected/journal/edit/${journal.id}`)}
                className="size-9 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#2b9dee] transition-all"
                title="Edit Entry"
              >
                <Edit className="h-5 w-5" />
              </button>
              <button
                className="size-9 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-500 transition-all"
                title="Delete"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Journal Entry Card */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700">
                <div className="flex flex-col gap-1 mb-6">
                  <span className="text-slate-400 dark:text-slate-500 text-sm font-bold uppercase tracking-wider">
                    {formatDate(journal.created_at)}
                  </span>
                  <h1 className="text-3xl md:text-5xl font-light text-slate-900 dark:text-white leading-tight mt-2">
                    {journal.title || "Untitled"}
                  </h1>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-3 mb-8">
                  {/* Emotion Tag */}
                  {primaryEmotion !== "Unknown" && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-[#2b9dee] border border-blue-100 dark:border-blue-800/30">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                        <line x1="9" y1="9" x2="9.01" y2="9"/>
                        <line x1="15" y1="9" x2="15.01" y2="9"/>
                      </svg>
                      <span className="text-sm font-bold capitalize">{primaryEmotion}</span>
                    </div>
                  )}

                  {/* Mood Score Tag */}
                  {journal.mood_score !== null && journal.mood_score !== undefined && (
                    <div className="px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-sm font-medium border border-slate-100 dark:border-slate-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                      </svg>
                      Mood: {journal.mood_score.toFixed(2)}
                    </div>
                  )}

                  {/* Location Tag */}
                  {locationDisplayName !== "Unknown location" && (
                    <div className="px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-sm font-medium border border-slate-100 dark:border-slate-600">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      {locationDisplayName}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="prose prose-slate dark:prose-invert prose-lg max-w-none">
                  <p className="text-slate-600 dark:text-slate-300 leading-8 whitespace-pre-line font-light">
                    {journal.content || "No content available."}
                  </p>
                </div>
              </div>

              {/* AI Reflection */}
              <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-indigo-900/20 dark:via-slate-800 dark:to-blue-900/10 rounded-3xl p-6 md:p-8 border border-indigo-100 dark:border-indigo-800/30 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Sparkles className="h-32 w-32 text-indigo-500" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-indigo-500 ring-1 ring-indigo-50 dark:ring-slate-600">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h3 className="text-indigo-900 dark:text-indigo-100 font-bold text-lg">AI Reflection</h3>
                  </div>
                  <div className="text-indigo-900/70 dark:text-indigo-200/80 leading-relaxed text-lg">
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
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Environmental Context */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-slate-900 dark:text-white font-bold flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                    </svg>
                    Environmental Context
                  </h3>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">At time of entry</span>
                </div>

                {weatherData ? (
                  <>
                    {/* Weather Card */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white dark:bg-slate-600 p-2 rounded-full shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-slate-300">
                            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">{weatherData.current.temp_c}°C</p>
                          <p className="text-xs text-slate-500 font-medium">{weatherData.current.condition.text}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400 mb-1">Humidity</p>
                        <p className="text-slate-700 dark:text-slate-200 font-bold">{weatherData.current.humidity}%</p>
                      </div>
                    </div>

                    {/* Air Quality */}
                    {weatherData.current.air_quality && aqiData && (
                      <div className={`p-5 rounded-2xl border ${aqiData.border} ${aqiData.bg} flex justify-between items-center`}>
                        <div>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Air Quality (AQI)</p>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-bold ${aqiData.color}`}>{aqiIndex}</span>
                            <span className={`text-sm font-bold ${aqiData.color} bg-opacity-20 px-2 py-0.5 rounded-full`}>{aqiData.label}</span>
                          </div>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${aqiData.color} opacity-80`}>
                          <path d="M8 2v4"/>
                          <path d="M16 2v4"/>
                          <rect width="18" height="18" x="3" y="4" rx="2"/>
                          <path d="M3 10h18"/>
                        </svg>
                      </div>
                    )}

                    {/* Additional Air Quality Metrics */}
                    {weatherData.current.air_quality && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                          <p className="text-xs text-slate-500 mb-1">PM2.5</p>
                          <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                            {weatherData.current.air_quality.pm2_5?.toFixed(1) || 'N/A'} <span className="text-xs font-normal text-slate-400">µg/m³</span>
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                          <p className="text-xs text-slate-500 mb-1">PM10</p>
                          <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                            {weatherData.current.air_quality.pm10?.toFixed(1) || 'N/A'} <span className="text-xs font-normal text-slate-400">µg/m³</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No environmental data available</p>
                  </div>
                )}
              </div>

              {/* Emotion Analysis */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700">
                <h3 className="text-slate-900 dark:text-white font-bold mb-5 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                  </svg>
                  Emotion Analysis
                </h3>

                {journal.emotion_source === 'ai' && emotionAnalysisData ? (
                  <div className="space-y-4">
                    {Object.entries(emotionAnalysisData.all_predictions)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([emotion, confidence]) => (
                        <div key={emotion}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 capitalize">{emotion}</span>
                            <span className="text-xs font-bold text-slate-500">{(confidence as number).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-[#2b9dee] h-2 rounded-full transition-all duration-500" 
                              style={{ width: `${confidence}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : journal.emotion_source === 'manual' && journal.emotions?.name ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#2b9dee]">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                        <line x1="9" y1="9" x2="9.01" y2="9"/>
                        <line x1="15" y1="9" x2="15.01" y2="9"/>
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-slate-800 dark:text-slate-200 capitalize">{journal.emotions.name}</p>
                    <p className="text-xs text-slate-500 mt-1">Manually selected</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No emotion data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}