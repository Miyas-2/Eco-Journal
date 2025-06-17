"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Eye,
  Edit,
  BookOpen,
  Calendar,
  Heart,
  Sparkles,
  Filter as FilterIcon,
  Search,
  Clock,
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
} from "date-fns";

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
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50/80 font-organik">
        <div className="container-organic py-8">
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
              </div>
              <p className="text-organic-body font-medium">Memuat perjalanan jurnal Anda...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50/80 font-organik">
      {/* Header Section - Modern Organik */}
      <div className="bg-gradient-to-r from-white/95 to-stone-50/95 backdrop-blur-lg border-b border-stone-200/30 sticky top-16 z-30">
        <div className="container-organic py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hover:bg-emerald-50 text-organic-secondary rounded-xl transition-all duration-300"
            >
              <Link href="/protected" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-stone-100 to-stone-200 rounded-xl flex items-center justify-center">
                  <ArrowLeft className="h-4 w-4" />
                </div>
                <span className="font-medium">Kembali</span>
              </Link>
            </Button>

            <div className="flex items-center space-x-3 text-organic-accent">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-sm">Atmosfeel</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container-organic py-8 space-organic-y-lg">
        {/* Page Header - Modern Organik */}
        <section className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200/40 float-organic">
            <Calendar className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-organic-title mb-3">
            Riwayat Jurnal Saya
          </h1>
          <p className="text-organic-body max-w-2xl mx-auto leading-relaxed">
            Jelajahi perjalanan emosi dan refleksi diri melalui koleksi jurnal yang telah Anda tulis
          </p>
        </section>

        {/* Filter Component - Modern Organik */}
        <section className="card-organic rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
              <Search className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-organic-title">Filter & Pencarian</h2>
          </div>
          <JournalFilter
            onFilterChange={applyFilters}
            isLoading={isFiltering}
          />
        </section>

        {/* Stats Bar - Modern Organik */}
        <section className="card-organic rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-organic-title mb-1">
                  {journals.length}
                </div>
                <div className="text-sm text-organic-secondary font-medium">Total Jurnal</div>
              </div>
              <div className="w-px h-16 bg-stone-200"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-1">
                  {filteredJournals.length}
                </div>
                <div className="text-sm text-organic-secondary font-medium">Ditampilkan</div>
              </div>
            </div>

            {isFiltering && (
              <div className="flex items-center space-x-3 text-emerald-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-600 border-t-transparent"></div>
                <span className="text-sm font-medium">Memfilter jurnal...</span>
              </div>
            )}
          </div>
        </section>

        {/* Journal List - Modern Organik */}
        <section>
          {filteredJournals.length === 0 ? (
            <div className="text-center py-16">
              <div className="card-organic rounded-3xl p-12 max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-stone-100 to-stone-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  {journals.length === 0 ? (
                    <BookOpen className="h-10 w-10 text-stone-400" />
                  ) : (
                    <FilterIcon className="h-10 w-10 text-stone-400" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-organic-title mb-3">
                  {journals.length === 0 ? "Belum Ada Jurnal" : "Tidak Ada Hasil"}
                </h3>
                <p className="text-organic-body mb-6 leading-relaxed">
                  {journals.length === 0
                    ? "Mulai perjalanan mindfulness Anda dengan membuat jurnal pertama."
                    : "Tidak ada jurnal yang sesuai dengan filter yang dipilih. Coba ubah kriteria pencarian."}
                </p>
                {journals.length === 0 && (
                  <Button
                    asChild
                    className="btn-organic-primary"
                  >
                    <Link
                      href="/protected/journal/new"
                      className="flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Buat Jurnal Pertama
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-organic-y">
              {filteredJournals.map((journal: any) => (
                <article
                  key={journal.id}
                  className="card-organic rounded-3xl p-6 hover:scale-[1.02] transition-all duration-300 group"
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 space-y-3 lg:space-y-0">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-organic-title group-hover:text-emerald-600 transition-colors mb-3">
                        <Link href={`/protected/journal/${journal.id}`}>
                          {journal.title || (
                            <span className="italic text-organic-secondary">
                              Jurnal Tanpa Judul
                            </span>
                          )}
                        </Link>
                      </h2>
                      <div className="flex items-center space-x-3 text-sm text-organic-secondary">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(journal.created_at).toLocaleString(
                              "id-ID",
                              {
                                dateStyle: "long",
                                timeStyle: "short",
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Emotion Badge - Modern Organik */}
                    <div className="flex items-center space-x-2">
                      {journal.emotion_source === "ai" &&
                        journal.emotion_analysis?.top_prediction?.label && (
                          <Badge className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-200/50 font-medium rounded-full px-3 py-1">
                            <Sparkles className="h-3 w-3 mr-2" />
                            AI: {journal.emotion_analysis.top_prediction.label}
                          </Badge>
                        )}
                      {journal.emotion_source === "manual" &&
                        journal.emotions?.name && (
                          <Badge className="bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200/50 font-medium rounded-full px-3 py-1">
                            <Heart className="h-3 w-3 mr-2" />
                            {journal.emotions.name}
                          </Badge>
                        )}
                    </div>
                  </div>

                  <p className="text-organic-body line-clamp-3 mb-6 leading-relaxed">
                    {journal.content || (
                      <span className="italic text-organic-secondary">
                        Jurnal ini belum memiliki konten.
                      </span>
                    )}
                  </p>

                  {/* Action Buttons - Modern Organik */}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      size="sm"
                      asChild
                      className="btn-organic-primary h-10"
                    >
                      <Link
                        href={`/protected/journal/${journal.id}`}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Baca Jurnal
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 rounded-xl h-10 transition-all duration-300"
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
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Bottom Spacer for Mobile Navigation */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}