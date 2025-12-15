"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  List,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Droplets,
  Wind,
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
} from "date-fns";
import { id as localeId } from "date-fns/locale";

interface FilterOptions {
  emotionFilter: string;
}

type ViewMode = "calendar" | "list";

// Emotion color mapping
const emotionColors: Record<string, { bg: string; text: string; hover: string }> = {
  happy: { bg: "bg-yellow-50 dark:bg-yellow-900/20", text: "text-yellow-600 dark:text-yellow-300", hover: "hover:bg-yellow-100 dark:hover:bg-yellow-900/40" },
  sad: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-300", hover: "hover:bg-blue-100 dark:hover:bg-blue-900/40" },
  anger: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-300", hover: "hover:bg-red-100 dark:hover:bg-red-900/40" },
  fear: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-300", hover: "hover:bg-purple-100 dark:hover:bg-purple-900/40" },
  surprise: { bg: "bg-pink-50 dark:bg-pink-900/20", text: "text-pink-600 dark:text-pink-300", hover: "hover:bg-pink-100 dark:hover:bg-pink-900/40" },
  love: { bg: "bg-rose-50 dark:bg-rose-900/20", text: "text-rose-600 dark:text-rose-300", hover: "hover:bg-rose-100 dark:hover:bg-rose-900/40" },
  anxiety: { bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-600 dark:text-indigo-300", hover: "hover:bg-indigo-100 dark:hover:bg-indigo-900/40" },
};

const getEmotionStyle = (emotion: string) => {
  const normalized = emotion?.toLowerCase();
  return emotionColors[normalized] || { bg: "bg-slate-50 dark:bg-slate-700", text: "text-slate-600 dark:text-slate-300", hover: "hover:bg-slate-100 dark:hover:bg-slate-600" };
};

// Get AQI label helper
const getAQILabel = (index: number | undefined) => {
  if (!index) return null;
  if (index === 1) return { label: "Good", color: "text-green-600 dark:text-green-400" };
  if (index === 2) return { label: "Moderate", color: "text-yellow-600 dark:text-yellow-400" };
  if (index === 3) return { label: "Unhealthy", color: "text-orange-600 dark:text-orange-400" };
  if (index >= 4) return { label: "Hazardous", color: "text-red-600 dark:text-red-400" };
  return null;
};

export default function JournalHistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [journals, setJournals] = useState<any[]>([]);
  const [filteredJournals, setFilteredJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [emotionCounts, setEmotionCounts] = useState<Record<string, number>>({});
  const [activeEmotionFilter, setActiveEmotionFilter] = useState<string>("all");

  const router = useRouter();
  const supabase = createClient();

  // Load user and journals
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUser(user);

      // First, get all journals
      const { data: journalsData, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching journals:", error);
        setLoading(false);
        return;
      }

      // Then, get emotion data for journals that have emotion_id
      const journalsWithEmotionId = journalsData?.filter(j => j.emotion_id) || [];
      const emotionIds = [...new Set(journalsWithEmotionId.map(j => j.emotion_id))];
      
      let emotionsMap: Record<number, string> = {};
      if (emotionIds.length > 0) {
        const { data: emotionsData } = await supabase
          .from("emotions")
          .select("id, name")
          .in("id", emotionIds);
        
        emotionsData?.forEach(emotion => {
          emotionsMap[emotion.id] = emotion.name;
        });
      }

      // Combine the data
      const journalsWithEmotions = journalsData?.map(journal => ({
        ...journal,
        emotions: journal.emotion_id ? { name: emotionsMap[journal.emotion_id] } : null
      })) || [];

      setJournals(journalsWithEmotions);
      setFilteredJournals(journalsWithEmotions);
      
      // Calculate emotion counts
      const counts: Record<string, number> = {};
      journalsWithEmotions.forEach((journal) => {
        const emotion = getJournalEmotion(journal);
        if (emotion) {
          counts[emotion] = (counts[emotion] || 0) + 1;
        }
      });
      setEmotionCounts(counts);

      setLoading(false);
    };

    loadData();
  }, []);

  // Get emotion from journal
  const getJournalEmotion = (journal: any) => {
    if (journal.emotion_source === "ai" && journal.emotion_analysis?.top_prediction?.label) {
      return journal.emotion_analysis.top_prediction.label;
    } else if (journal.emotion_source === "manual" && journal.emotions?.name) {
      return journal.emotions.name;
    }
    return null;
  };

  // Filter journals by emotion
  const handleEmotionFilter = (emotion: string) => {
    setActiveEmotionFilter(emotion);
    setSelectedDate(null); // Clear date filter when changing emotion filter
    
    if (emotion === "all") {
      setFilteredJournals(journals);
    } else {
      const filtered = journals.filter(journal => {
        const journalEmotion = getJournalEmotion(journal);
        return journalEmotion?.toLowerCase() === emotion.toLowerCase();
      });
      setFilteredJournals(filtered);
    }
  };

  // Calendar logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  // Get journals for a specific date
  const getJournalsForDate = (date: Date) => {
    let dayJournals = journals.filter(journal =>
      isSameDay(new Date(journal.created_at), date)
    );

    if (activeEmotionFilter !== "all") {
      dayJournals = dayJournals.filter(journal => {
        const emotion = getJournalEmotion(journal);
        return emotion?.toLowerCase() === activeEmotionFilter.toLowerCase();
      });
    }

    return dayJournals;
  };

  // Handle date selection
  const handleDateClick = (date: Date) => {
    const journalsOnDate = getJournalsForDate(date);
    if (journalsOnDate.length > 0) {
      if (selectedDate && isSameDay(date, selectedDate)) {
        setSelectedDate(null);
        // Reapply emotion filter
        if (activeEmotionFilter !== "all") {
          handleEmotionFilter(activeEmotionFilter);
        } else {
          setFilteredJournals(journals);
        }
      } else {
        setSelectedDate(date);
        setFilteredJournals(journalsOnDate);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ fontFamily: 'Lexend, sans-serif' }} className="min-h-screen bg-[#f8fafc] dark:bg-[#101a22]">
        <div className="max-w-[1200px] mx-auto px-4 py-8 md:px-10 lg:px-20 xl:px-40">
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#2b9dee] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400 font-light">Memuat jurnal Anda...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const displayedJournals = viewMode === "calendar" && selectedDate 
    ? filteredJournals.filter(journal => isSameDay(new Date(journal.created_at), selectedDate))
    : filteredJournals;

  return (
    <div style={{ fontFamily: 'Lexend, sans-serif' }} className="min-h-screen bg-[#f8fafc] dark:bg-[#101a22]">
      <main className="flex-1 w-full px-4 py-8 md:px-10 lg:px-20 xl:px-40 flex justify-center">
        <div className="max-w-[1200px] w-full flex flex-col gap-8">
          
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-[#2b9dee] dark:hover:text-[#2b9dee] transition-colors w-fit"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Kembali</span>
          </button>

          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-[#f8fafc] dark:bg-[#101a22] pb-4 -mx-4 px-4 md:-mx-10 md:px-10 lg:-mx-20 lg:px-20 xl:-mx-40 xl:px-40">
            <div className="max-w-[1200px] mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="flex flex-col gap-2">
                  <h1 className="text-3xl md:text-4xl font-light text-slate-900 dark:text-white tracking-[-0.033em]">
                    Arsip Jurnal
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-lg font-light leading-relaxed">
                    Jelajahi dan temukan kembali momen-momen berharga dalam perjalanan Anda
                  </p>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                  <button
                    onClick={() => setViewMode("calendar")}
                    className={`p-2 rounded transition-colors ${
                      viewMode === "calendar"
                        ? "bg-slate-100 dark:bg-slate-700 text-[#2b9dee] shadow-sm"
                        : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-[#2b9dee]"
                    }`}
                  >
                    <CalendarIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded transition-colors ${
                      viewMode === "list"
                        ? "bg-slate-100 dark:bg-slate-700 text-[#2b9dee] shadow-sm"
                        : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-[#2b9dee]"
                    }`}
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sidebar - Calendar & Filters (only in calendar view) */}
            {viewMode === "calendar" && (
              <aside className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-44">
                
                {/* Calendar */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {format(currentDate, 'MMMM yyyy', { locale: localeId })}
                    </h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 text-center gap-y-4 gap-x-1">
                    {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                      <span key={day} className="text-xs font-medium text-slate-400 uppercase">
                        {day}
                      </span>
                    ))}

                    {calendarDays.map((day, index) => {
                      const dayJournals = getJournalsForDate(day);
                      const isCurrentMonth = isSameMonth(day, currentDate);
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      const hasJournals = dayJournals.length > 0;
                      const isTodayDate = isToday(day);

                      return (
                        <button
                          key={index}
                          onClick={() => handleDateClick(day)}
                          disabled={!hasJournals}
                          className={`relative flex items-center justify-center size-9 mx-auto rounded-full text-sm transition-colors ${
                            isSelected
                              ? "bg-[#2b9dee] text-white font-bold shadow-md shadow-[#2b9dee]/30"
                              : hasJournals
                              ? "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                              : isCurrentMonth
                              ? "text-slate-400 dark:text-slate-600"
                              : "text-slate-300 dark:text-slate-700"
                          }`}
                        >
                          {format(day, 'd')}
                          {hasJournals && !isSelected && (
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#2b9dee] rounded-full"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Emotion Filter */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                    Filter by Mood
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleEmotionFilter("all")}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        activeEmotionFilter === "all"
                          ? "bg-[#2b9dee] text-white"
                          : "bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
                      }`}
                    >
                      All ({journals.length})
                    </button>
                    {Object.entries(emotionCounts)
                      .sort(([, a], [, b]) => b - a)
                      .map(([emotion, count]) => {
                        const style = getEmotionStyle(emotion);
                        return (
                          <button
                            key={emotion}
                            onClick={() => handleEmotionFilter(emotion)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                              activeEmotionFilter.toLowerCase() === emotion.toLowerCase()
                                ? "bg-[#2b9dee] text-white"
                                : `${style.bg} ${style.text} ${style.hover}`
                            }`}
                          >
                            {emotion} ({count})
                          </button>
                        );
                      })}
                  </div>
                </div>
              </aside>
            )}

            {/* Journal List */}
            <div className={viewMode === "calendar" ? "lg:col-span-8 flex flex-col gap-6" : "lg:col-span-12 flex flex-col gap-6"}>
              {displayedJournals.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      Tidak ada jurnal
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 font-light">
                      {selectedDate
                        ? `Tidak ada jurnal pada ${format(selectedDate, 'dd MMMM yyyy', { locale: localeId })}`
                        : activeEmotionFilter !== "all"
                        ? `Tidak ada jurnal dengan mood "${activeEmotionFilter}"`
                        : "Mulai menulis jurnal pertama Anda untuk merekam perjalanan emosi dan refleksi Anda."}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {displayedJournals.map((journal: any) => {
                    const emotion = getJournalEmotion(journal);
                    const emotionStyle = emotion ? getEmotionStyle(emotion) : null;
                    const weatherData = journal.weather_data;
                    const aqiValue = weatherData?.current?.air_quality?.["us-epa-index"];
                    const aqiInfo = getAQILabel(aqiValue);

                    return (
                      <div
                        key={journal.id}
                        className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:shadow-[#2b9dee]/5 transition-all overflow-hidden flex flex-col md:flex-row"
                      >
                        {/* Weather/Image Section */}
                        <div className="w-full md:w-1/3 min-h-[160px] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-800 relative flex items-center justify-center p-6">
                          {weatherData?.current ? (
                            <div className="text-center">
                              <div className="text-4xl mb-2">
                                {weatherData.current.condition?.text?.toLowerCase().includes('rain') ? '🌧️' :
                                 weatherData.current.condition?.text?.toLowerCase().includes('cloud') ? '☁️' :
                                 weatherData.current.condition?.text?.toLowerCase().includes('sun') || 
                                 weatherData.current.condition?.text?.toLowerCase().includes('clear') ? '☀️' : '🌤️'}
                              </div>
                              <div className="text-2xl font-light text-slate-700 dark:text-slate-200 mb-1">
                                {weatherData.current.temp_c}°C
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                {weatherData.current.condition?.text || 'Clear'}
                              </div>
                            </div>
                          ) : (
                            <div className="text-6xl opacity-20">📝</div>
                          )}
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between gap-4">
                          <div className="flex justify-between items-start">
                            <div className="flex gap-2 mb-1 flex-wrap">
                              {/* Emotion Badge */}
                              {emotion && emotionStyle && (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ${emotionStyle.bg} ${emotionStyle.text} text-xs font-bold uppercase tracking-wider`}>
                                  {emotion}
                                </span>
                              )}
                              {/* Weather Badge */}
                              {weatherData?.current?.condition?.text && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
                                  <Cloud className="h-3 w-3" />
                                  {weatherData.current.condition.text}
                                </span>
                              )}
                              {/* AQI Badge */}
                              {aqiInfo && (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 ${aqiInfo.color} text-xs font-bold uppercase tracking-wider`}>
                                  <Wind className="h-3 w-3" />
                                  AQI {aqiValue}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-bold text-slate-400">
                              {format(new Date(journal.created_at), 'MMM dd', { locale: localeId })}
                            </span>
                          </div>

                          <div>
                            <Link href={`/protected/journal/${journal.id}`}>
                              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-[#2b9dee] transition-colors line-clamp-1">
                                {journal.title || 'Tanpa Judul'}
                              </h2>
                            </Link>
                            <p className="text-slate-600 dark:text-slate-300 font-light leading-relaxed line-clamp-2">
                              {journal.content || 'Tidak ada konten.'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                              {journal.location && (
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {journal.location}
                                </span>
                              )}
                            </div>

                            <Link
                              href={`/protected/journal/${journal.id}`}
                              className="text-[#2b9dee] hover:text-[#1e7ac7] font-medium text-sm transition-colors flex items-center gap-1"
                            >
                              Baca selengkapnya
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}