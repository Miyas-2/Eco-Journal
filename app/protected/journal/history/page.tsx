"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Edit,
  Calendar as CalendarIcon,
  List,
  ChevronLeft,
  ChevronRight,
  Filter as FilterIcon,
  Search,
  Plus,
  Sparkles,
  Heart,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DeleteJournalButton from "@/components/journal/delete-journal-button";
import JournalFilter from "@/components/journal/journal-filter";
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
  formatDistanceToNow,
} from "date-fns";
import { id } from "date-fns/locale";

interface FilterOptions {
  emotionFilter: string;
  dateFilter: string;
  specificDate: Date | undefined;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

type ViewMode = 'calendar' | 'list';

// Emotion color mapping with background colors for calendar indicators
const emotionColors = {
  joy: { 
    badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
    dot: "bg-yellow-400"
  },
  trust: { 
    badge: "bg-green-100 text-green-800 border-green-200",
    dot: "bg-green-400"
  },
  fear: { 
    badge: "bg-purple-100 text-purple-800 border-purple-200",
    dot: "bg-purple-400"
  },
  surprise: { 
    badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
    dot: "bg-indigo-400"
  },
  sadness: { 
    badge: "bg-slate-100 text-slate-800 border-slate-200",
    dot: "bg-slate-400"
  },
  disgust: { 
    badge: "bg-green-100 text-green-800 border-green-200",
    dot: "bg-green-500"
  },
  anger: { 
    badge: "bg-red-100 text-red-800 border-red-200",
    dot: "bg-red-400"
  },
  anticipation: { 
    badge: "bg-cyan-100 text-cyan-800 border-cyan-200",
    dot: "bg-cyan-400"
  },
  neutral: { 
    badge: "bg-slate-100 text-slate-800 border-slate-200",
    dot: "bg-slate-400"
  },
};

// Emotion emojis
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

export default function JournalHistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [journals, setJournals] = useState<any[]>([]);
  const [filteredJournals, setFilteredJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({
    emotionFilter: 'all',
    dateFilter: 'all',
    specificDate: undefined,
    startDate: undefined,
    endDate: undefined,
  });

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

      const { data: journalsData, error } = await supabase
        .from("journal_entries")
        .select(
          "id, title, content, created_at, emotion_analysis, emotion_source, emotion_id, emotions(name)"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching journals:", error);
      } else {
        setJournals(journalsData || []);
        setFilteredJournals(journalsData || []);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  // Filter function
  const applyFilters = useCallback((filters: FilterOptions) => {
    setIsFiltering(true);
    setCurrentFilters(filters);
    let filtered = [...journals];

    // Emotion filter
    if (filters.emotionFilter !== "all") {
      if (filters.emotionFilter === "ai") {
        filtered = filtered.filter(journal => journal.emotion_source === "ai");
      } else if (filters.emotionFilter === "manual") {
        filtered = filtered.filter(journal => journal.emotion_source === "manual");
      } else {
        filtered = filtered.filter(journal => {
          const emotion = getJournalEmotion(journal);
          return emotion?.toLowerCase() === filters.emotionFilter;
        });
      }
    }

    // Date filter
    if (selectedDate) {
      filtered = filtered.filter(journal =>
        isSameDay(new Date(journal.created_at), selectedDate)
      );
    }

    setFilteredJournals(filtered);
    setIsFiltering(false);
  }, [journals, selectedDate]);

  // Get emotion from journal
  const getJournalEmotion = (journal: any) => {
    if (journal.emotion_source === "ai" && journal.emotion_analysis?.top_prediction?.label) {
      return journal.emotion_analysis.top_prediction.label;
    } else if (journal.emotion_source === "manual" && journal.emotions?.name) {
      return journal.emotions.name;
    }
    return null;
  };

  // Get emotion color class
  const getEmotionColorClass = (emotion: string) => {
    const normalizedEmotion = emotion?.toLowerCase();
    return emotionColors[normalizedEmotion as keyof typeof emotionColors]?.badge || emotionColors.neutral.badge;
  };

  // Get emotion dot color class
  const getEmotionDotClass = (emotion: string) => {
    const normalizedEmotion = emotion?.toLowerCase();
    return emotionColors[normalizedEmotion as keyof typeof emotionColors]?.dot || emotionColors.neutral.dot;
  };

  // Get emotion emoji
  const getEmotionEmoji = (emotion: string) => {
    const normalizedEmotion = emotion?.toLowerCase();
    return emotionEmojis[normalizedEmotion as keyof typeof emotionEmojis] || "📝";
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

  // Get journals for a specific date (considering filters)
  const getJournalsForDate = (date: Date) => {
    let dayJournals = journals.filter(journal =>
      isSameDay(new Date(journal.created_at), date)
    );

    // Apply emotion filter to calendar view
    if (currentFilters.emotionFilter !== "all") {
      if (currentFilters.emotionFilter === "ai") {
        dayJournals = dayJournals.filter(journal => journal.emotion_source === "ai");
      } else if (currentFilters.emotionFilter === "manual") {
        dayJournals = dayJournals.filter(journal => journal.emotion_source === "manual");
      } else {
        dayJournals = dayJournals.filter(journal => {
          const emotion = getJournalEmotion(journal);
          return emotion?.toLowerCase() === currentFilters.emotionFilter;
        });
      }
    }

    return dayJournals;
  };

  // Handle date selection
  const handleDateClick = (date: Date) => {
    setSelectedDate(isSameDay(date, selectedDate || new Date()) ? null : date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-slate-600">Memuat riwayat jurnal...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const displayedJournals = selectedDate 
    ? journals.filter(journal => isSameDay(new Date(journal.created_at), selectedDate))
    : filteredJournals;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-medium text-slate-800 mb-2">
                Riwayat Jurnal
              </h1>
              <p className="text-slate-600">
                Jelajahi perjalanan emosi dan refleksi Anda
              </p>
            </div>
            
            <Button
              asChild
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl h-10 px-4"
            >
              <Link href="/protected/journal/new" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Tulis Jurnal
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="text-2xl font-medium text-slate-800">{journals.length}</div>
              <div className="text-sm text-slate-600">Total Jurnal</div>
            </div>
            
            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="text-2xl font-medium text-slate-800">
                {new Set(journals.map(j => format(new Date(j.created_at), 'yyyy-MM'))).size}
              </div>
              <div className="text-sm text-slate-600">Bulan Aktif</div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="text-2xl font-medium text-slate-800">
                {displayedJournals.length}
              </div>
              <div className="text-sm text-slate-600">
                {selectedDate ? 'Jurnal Hari Ini' : 'Ditampilkan'}
              </div>
            </div>
          </div>

            {/* View Toggle & Controls */}
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-white rounded-2xl p-1 border border-slate-200">
              <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className={`rounded-xl h-8 px-3 ${
                viewMode === 'calendar' 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
              >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Kalender
              </Button>
              <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={`rounded-xl h-8 px-3 ${
                viewMode === 'list' 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
              >
              <List className="h-4 w-4 mr-2" />
              Daftar
              </Button>
            </div>

            {/* Month Navigation */}
            {viewMode === 'calendar' && (
              <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="h-8 w-8 p-0 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <h2 className="text-lg font-medium text-slate-800 min-w-[140px] text-center">
                {format(currentDate, 'MMMM yyyy', { locale: id })}
              </h2>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="h-8 w-8 p-0 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              </div>
            )}
            </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FilterIcon className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Filter Jurnal</span>
            {selectedDate && (
              <Badge variant="outline" className="ml-auto">
                {format(selectedDate, 'dd MMM yyyy', { locale: id })}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate(null)}
                  className="h-4 w-4 p-0 ml-2 hover:bg-transparent"
                >
                  ×
                </Button>
              </Badge>
            )}
            {currentFilters.emotionFilter !== 'all' && (
              <Badge variant="outline" className="ml-auto">
                Filter: {currentFilters.emotionFilter}
              </Badge>
            )}
          </div>
          <JournalFilter onFilterChange={applyFilters} isLoading={isFiltering} />
        </div>

        {/* Content */}
        {viewMode === 'calendar' ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-slate-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                const dayJournals = getJournalsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const hasJournals = dayJournals.length > 0;

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(day)}
                    className={`
                      relative h-16 rounded-xl transition-all duration-200 text-sm p-1
                      ${isCurrentMonth ? 'text-slate-700' : 'text-slate-300'}
                      ${isSelected ? 'bg-blue-500 text-white' : ''}
                      ${hasJournals && !isSelected ? 'bg-slate-100 hover:bg-slate-200' : ''}
                      ${!hasJournals && !isSelected ? 'hover:bg-slate-50' : ''}
                      ${isToday(day) && !isSelected ? 'bg-blue-50 text-blue-600 font-medium border-2 border-blue-200' : ''}
                    `}
                  >
                    <div className="flex flex-col items-center justify-between h-full">
                      <span className="font-medium">{format(day, 'd')}</span>
                      
                      {hasJournals && (
                        <div className="flex flex-col items-center gap-1 mt-1">
                          {/* Show up to 3 emotion indicators */}
                          <div className="flex gap-1 flex-wrap justify-center">
                            {dayJournals.slice(0, 3).map((journal, idx) => {
                              const emotion = getJournalEmotion(journal);
                              const emoji = getEmotionEmoji(emotion || 'neutral');
                              const dotColor = getEmotionDotClass(emotion || 'neutral');
                              
                              return (
                                <div
                                  key={idx}
                                  className="relative group"
                                  title={`${journal.title || 'Jurnal'} - ${emotion || 'Tanpa emosi'}`}
                                >
                                  {/* Show emoji if not selected, colored dot if selected */}
                                  {isSelected ? (
                                    <div className="w-2 h-2 bg-white/60 rounded-full" />
                                  ) : (
                                    <div className="flex items-center">
                                      <span className="text-xs">{emoji}</span>
                                      <div className={`w-1.5 h-1.5 ${dotColor} rounded-full ml-0.5`} />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Show count if more than 3 journals */}
                          {dayJournals.length > 3 && (
                            <div className={`text-xs ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                              +{dayJournals.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend */}
            {currentFilters.emotionFilter === 'all' && (
              <div className="mt-6 pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-600 mb-2">Legenda Emosi:</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(emotionEmojis).slice(0, 8).map(([emotion, emoji]) => (
                    <div key={emotion} className="flex items-center gap-1 text-xs text-slate-600">
                      <span>{emoji}</span>
                      <div className={`w-2 h-2 ${getEmotionDotClass(emotion)} rounded-full`} />
                      <span className="capitalize">{emotion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Journal List */}
        {(viewMode === 'list' || selectedDate) && (
          <div className="space-y-4 mt-6">
            {displayedJournals.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-800 mb-2">
                    {selectedDate ? 'Tidak Ada Jurnal' : 'Belum Ada Jurnal'}
                  </h3>
                  <p className="text-slate-600 mb-6">
                    {selectedDate 
                      ? `Tidak ada jurnal pada ${format(selectedDate, 'dd MMMM yyyy', { locale: id })}`
                      : 'Mulai perjalanan jurnal Anda dengan membuat entri pertama.'
                    }
                  </p>
                  {!selectedDate && (
                    <Button asChild className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl">
                      <Link href="/protected/journal/new" className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Buat Jurnal Pertama
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedJournals.map((journal: any) => {
                  const emotion = getJournalEmotion(journal);
                  
                  return (
                    <div
                      key={journal.id}
                      className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <Link 
                            href={`/protected/journal/${journal.id}`}
                            className="block group"
                          >
                            <h3 className="text-lg font-medium text-slate-800 group-hover:text-blue-600 transition-colors mb-2 line-clamp-1">
                              {journal.title || 'Tanpa Judul'}
                            </h3>
                          </Link>
                          
                          <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              <span>
                                {format(new Date(journal.created_at), 'dd MMM yyyy', { locale: id })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>
                                {formatDistanceToNow(new Date(journal.created_at), {
                                  addSuffix: true,
                                  locale: id
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Emotion Badge */}
                        {emotion && (
                          <Badge className={`${getEmotionColorClass(emotion)} rounded-xl font-medium px-3 py-1`}>
                            <span className="mr-1">{getEmotionEmoji(emotion)}</span>
                            {emotion}
                          </Badge>
                        )}
                      </div>

                      <p className="text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                        {journal.content || 'Tidak ada konten.'}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          asChild
                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-8 px-3"
                        >
                          <Link href={`/protected/journal/${journal.id}`} className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span className="text-xs">Lihat</span>
                          </Link>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl h-8 px-3"
                        >
                          <Link href={`/protected/journal/edit/${journal.id}`} className="flex items-center gap-1">
                            <Edit className="h-3 w-3" />
                            <span className="text-xs">Edit</span>
                          </Link>
                        </Button>

                        <DeleteJournalButton
                          journalId={journal.id}
                          journalTitle={journal.title || "Tanpa Judul"}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}