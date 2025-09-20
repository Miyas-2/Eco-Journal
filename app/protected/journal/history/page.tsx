"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Edit,
  BookOpen,
  Calendar,
  Heart,
  Sparkles,
  Filter as FilterIcon,
  Clock,
  ChevronRight,
  Plus,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DeleteJournalButton from "@/components/journal/delete-journal-button";
import JournalFilter from "@/components/journal/journal-filter";
import { User } from "@supabase/supabase-js";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  isSameDay,
  formatDistanceToNow,
} from "date-fns";
import { id } from "date-fns/locale";

interface FilterOptions {
  emotionFilter: string;
  dateFilter:
    | "all"
    | "today"
    | "yesterday"
    | "this_week"
    | "this_month"
    | "custom_range"
    | "specific_date";
  specificDate: Date | undefined;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

export default function JournalHistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [journals, setJournals] = useState<any[]>([]);
  const [filteredJournals, setFilteredJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // Load user and journals
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
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
  const applyFilters = useCallback(
    (filters: FilterOptions) => {
      setIsFiltering(true);

      let filtered = [...journals];

      // Filter berdasarkan emosi
      if (filters.emotionFilter !== "all") {
        if (filters.emotionFilter === "ai") {
          filtered = filtered.filter(
            (journal) => journal.emotion_source === "ai"
          );
        } else if (filters.emotionFilter === "manual") {
          filtered = filtered.filter(
            (journal) => journal.emotion_source === "manual"
          );
        } else {
          // Filter berdasarkan nama emosi spesifik
          filtered = filtered.filter((journal) => {
            if (
              journal.emotion_source === "ai" &&
              journal.emotion_analysis?.top_prediction?.label
            ) {
              return (
                journal.emotion_analysis.top_prediction.label.toLowerCase() ===
                filters.emotionFilter
              );
            } else if (
              journal.emotion_source === "manual" &&
              journal.emotions?.name
            ) {
              return (
                journal.emotions.name.toLowerCase() === filters.emotionFilter
              );
            }
            return false;
          });
        }
      }

      // Filter berdasarkan tanggal
      if (filters.dateFilter !== "all") {
        const now = new Date();

        filtered = filtered.filter((journal) => {
          const journalDate = new Date(journal.created_at);

          switch (filters.dateFilter) {
            case "today":
              return isSameDay(journalDate, now);

            case "yesterday":
              const yesterday = subDays(now, 1);
              return isSameDay(journalDate, yesterday);

            case "this_week":
              const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
              const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
              return journalDate >= weekStart && journalDate <= weekEnd;

            case "this_month":
              const monthStart = startOfMonth(now);
              const monthEnd = endOfMonth(now);
              return journalDate >= monthStart && journalDate <= monthEnd;

            case "specific_date":
              if (filters.specificDate) {
                return isSameDay(journalDate, filters.specificDate);
              }
              return true;

            case "custom_range":
              if (filters.startDate && filters.endDate) {
                const start = startOfDay(filters.startDate);
                const end = endOfDay(filters.endDate);
                return journalDate >= start && journalDate <= end;
              } else if (filters.startDate) {
                const start = startOfDay(filters.startDate);
                return journalDate >= start;
              } else if (filters.endDate) {
                const end = endOfDay(filters.endDate);
                return journalDate <= end;
              }
              return true;

            default:
              return true;
          }
        });
      }

      setFilteredJournals(filtered);
      setIsFiltering(false);
    },
    [journals]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-slate-600 font-medium">Memuat riwayat jurnal...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-light text-slate-800 mb-3">
                Riwayat Jurnal
              </h1>
              <p className="text-lg text-slate-500">
                Jelajahi perjalanan emosi dan refleksi Anda
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-light text-slate-800">
                    {journals.length}
                  </div>
                  <div className="text-sm text-slate-500">Total Jurnal</div>
                </div>
              </div>
            </div>

            {filteredJournals.length !== journals.length && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                    <FilterIcon className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-light text-slate-800">
                      {filteredJournals.length}
                    </div>
                    <div className="text-sm text-slate-500">Hasil Filter</div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-slate-600" />
                </div>
                <div>
                  <div className="text-2xl font-light text-slate-800">
                    {journals.length > 0 ? Math.ceil(journals.length / 30) : 0}
                  </div>
                  <div className="text-sm text-slate-500">Bulan Aktif</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center">
                <Search className="h-4 w-4 text-slate-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-800">Filter & Pencarian</h3>
            </div>
            <JournalFilter
              onFilterChange={applyFilters}
              isLoading={isFiltering}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-12">
          {filteredJournals.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 max-w-md mx-auto">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  {journals.length === 0 ? (
                    <BookOpen className="h-10 w-10 text-slate-400" />
                  ) : (
                    <FilterIcon className="h-10 w-10 text-slate-400" />
                  )}
                </div>
                <h3 className="text-xl font-medium text-slate-800 mb-3">
                  {journals.length === 0 ? "Belum Ada Jurnal" : "Tidak Ada Hasil"}
                </h3>
                <p className="text-slate-500 mb-8 leading-relaxed">
                  {journals.length === 0
                    ? "Mulai perjalanan jurnal Anda dengan membuat entri pertama."
                    : "Tidak ada jurnal yang sesuai dengan filter yang dipilih."}
                </p>
                {journals.length === 0 && (
                  <Button
                    asChild
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-3xl h-12 px-8"
                  >
                    <Link
                      href="/protected/journal/new"
                      className="flex items-center gap-3"
                    >
                      <Sparkles className="h-4 w-4" />
                      Buat Jurnal Pertama
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredJournals.map((journal: any) => (
                <div
                  key={journal.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden group"
                >
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <Link 
                          href={`/protected/journal/${journal.id}`}
                          className="block group/title"
                        >
                          <h2 className="text-xl font-medium text-slate-800 group-hover/title:text-blue-600 transition-colors mb-3 line-clamp-2">
                            {journal.title || (
                              <span className="italic text-slate-500">
                                Tanpa Judul
                              </span>
                            )}
                          </h2>
                        </Link>
                        
                        <div className="flex items-center gap-6 text-sm text-slate-500 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(journal.created_at).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "long", 
                                  year: "numeric"
                                }
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
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
                      <div className="ml-6">
                        {journal.emotion_source === "ai" &&
                          journal.emotion_analysis?.top_prediction?.label && (
                            <Badge className="bg-purple-50 text-purple-700 border-purple-200 rounded-2xl font-medium px-3 py-1">
                              <Sparkles className="h-3 w-3 mr-2" />
                              {journal.emotion_analysis.top_prediction.label}
                            </Badge>
                          )}
                        {journal.emotion_source === "manual" &&
                          journal.emotions?.name && (
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200 rounded-2xl font-medium px-3 py-1">
                              <Heart className="h-3 w-3 mr-2" />
                              {journal.emotions.name}
                            </Badge>
                          )}
                      </div>
                    </div>

                    <p className="text-slate-600 line-clamp-3 mb-8 leading-relaxed text-base">
                      {journal.content || (
                        <span className="italic text-slate-400">
                          Tidak ada konten.
                        </span>
                      )}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          asChild
                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl h-10 px-4"
                        >
                          <Link
                            href={`/protected/journal/${journal.id}`}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Lihat Detail
                          </Link>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-2xl h-10 px-4"
                        >
                          <Link
                            href={`/protected/journal/edit/${journal.id}`}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Link>
                        </Button>

                        <DeleteJournalButton
                          journalId={journal.id}
                          journalTitle={journal.title || "Tanpa Judul"}
                        />
                      </div>

                      {/* Quick Preview Arrow */}
                      <Link 
                        href={`/protected/journal/${journal.id}`}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}