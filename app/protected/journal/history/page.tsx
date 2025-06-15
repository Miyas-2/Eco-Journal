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
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 font-medium">Memuat jurnal Anda...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-100">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hover:bg-blue-50 text-gray-600"
              >
                <Link href="/protected" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke Dashboard
                </Link>
              </Button>
            </div>

            <div className="flex items-center space-x-2 text-blue-600">
              <BookOpen className="h-5 w-5" />
              <span className="hidden sm:inline text-sm font-medium">
                Eco Journal
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Histori Jurnal Saya
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Jelajahi perjalanan emosi dan pikiran Anda melalui koleksi jurnal
            yang telah dibuat
          </p>
        </div>

        {/* Filter Component - White Theme */}
        <div className="mb-8">
          <JournalFilter
            onFilterChange={applyFilters}
            isLoading={isFiltering}
          />
        </div>

        {/* Stats Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {journals.length}
                </div>
                <div className="text-sm text-gray-500">Total Jurnal</div>
              </div>
              <div className="w-px h-12 bg-gray-200"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filteredJournals.length}
                </div>
                <div className="text-sm text-gray-500">Ditampilkan</div>
              </div>
            </div>

            {isFiltering && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium">Memfilter...</span>
              </div>
            )}
          </div>
        </div>

        {/* Journal List */}
        {filteredJournals.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 max-w-md mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
                {journals.length === 0 ? (
                  <BookOpen className="h-8 w-8 text-gray-400" />
                ) : (
                  <FilterIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {journals.length === 0 ? "Belum Ada Jurnal" : "Tidak Ada Hasil"}
              </h3>
              <p className="text-gray-600 mb-6">
                {journals.length === 0
                  ? "Mulai perjalanan jurnal Anda dengan membuat entri pertama."
                  : "Tidak ada jurnal yang sesuai dengan filter yang dipilih."}
              </p>
              {journals.length === 0 && (
                <Button
                  asChild
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
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
          <div className="grid gap-6">
            {filteredJournals.map((journal: any) => (
              <div
                key={journal.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 space-y-3 lg:space-y-0">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-2">
                        <Link href={`/protected/journal/${journal.id}`}>
                          {journal.title || (
                            <span className="italic text-gray-500">
                              Tanpa Judul
                            </span>
                          )}
                        </Link>
                      </h2>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(journal.created_at).toLocaleString(
                            "id-ID",
                            {
                              dateStyle: "full",
                              timeStyle: "short",
                            }
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Emotion Badge */}
                    <div className="flex items-center space-x-2">
                      {journal.emotion_source === "ai" &&
                        journal.emotion_analysis?.top_prediction?.label && (
                          <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200 font-medium">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI: {journal.emotion_analysis.top_prediction.label}
                          </Badge>
                        )}
                      {journal.emotion_source === "manual" &&
                        journal.emotions?.name && (
                          <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200 font-medium">
                            <Heart className="h-3 w-3 mr-1" />
                            Manual: {journal.emotions.name}
                          </Badge>
                        )}
                    </div>
                  </div>

                  <p className="text-gray-700 line-clamp-3 mb-6 leading-relaxed">
                    {journal.content || (
                      <span className="italic text-gray-400">
                        Tidak ada konten.
                      </span>
                    )}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      size="sm"
                      asChild
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0"
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
                      className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
