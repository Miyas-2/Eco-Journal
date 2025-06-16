"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calender";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Filter, X, ChevronDown, ChevronUp, Sparkles, Heart } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";

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

interface JournalFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  isLoading: boolean;
}

interface Emotion {
  id: number;
  name: string;
}

export default function JournalFilter({
  onFilterChange,
  isLoading,
}: JournalFilterProps) {
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    emotionFilter: "all",
    dateFilter: "all",
    specificDate: undefined,
    startDate: undefined,
    endDate: undefined,
  });
  const [showFilters, setShowFilters] = useState(false);

  const supabase = createClient();

  // Load emotions untuk filter
  useEffect(() => {
    const fetchEmotions = async () => {
      const { data, error } = await supabase
        .from("emotions")
        .select("id, name")
        .order("name");

      if (!error && data) {
        setEmotions(data);
      }
    };
    fetchEmotions();
  }, []);

  // Trigger filter change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };

      // Reset date fields when changing date filter type
      if (key === "dateFilter") {
        newFilters.specificDate = undefined;
        newFilters.startDate = undefined;
        newFilters.endDate = undefined;
      }

      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({
      emotionFilter: "all",
      dateFilter: "all",
      specificDate: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  };

  const hasActiveFilters =
    filters.emotionFilter !== "all" || filters.dateFilter !== "all";

  return (
    <div className="card-organic rounded-3xl overflow-hidden border-0">
      {/* Filter Header - Modern Organik */}
      <div className="bg-gradient-to-r from-emerald-50/50 via-teal-50/50 to-sky-blue/20 px-6 py-5 border-b border-stone-200/30">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200/40">
              <Filter className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-organic-title">Filter & Pencarian</h3>
              <div className="flex items-center gap-3 mt-1">
                {hasActiveFilters && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-xs bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 px-3 py-1 rounded-full font-medium border border-emerald-200/50">
                      Filter Aktif
                    </span>
                  </div>
                )}
                <span className="text-sm text-organic-secondary">
                  Temukan jurnal dengan mudah
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                disabled={isLoading}
                className="text-organic-secondary hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-300 border border-transparent hover:border-red-200"
              >
                <X className="h-4 w-4 mr-2" />
                Reset Filter
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-organic-title hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all duration-300"
            >
              {showFilters ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Sembunyikan
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Tampilkan Filter
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Content - Modern Organik */}
      {showFilters && (
        <div className="p-6 space-organic-y">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Filter Emosi - Modern Organik */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                  <Heart className="h-3 w-3 text-purple-600" />
                </div>
                <Label className="text-sm font-medium text-organic-title">
                  Filter berdasarkan Emosi
                </Label>
              </div>
              <Select
                value={filters.emotionFilter}
                onValueChange={(value) =>
                  handleFilterChange("emotionFilter", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger className="bg-white/50 border-stone-200/50 hover:border-emerald-300 focus:border-emerald-500 rounded-2xl h-12 transition-all duration-300 hover:bg-emerald-50/30">
                  <SelectValue placeholder="Pilih emosi" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-lg border-stone-200/50 shadow-xl rounded-2xl">
                  <SelectItem value="all" className="rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-gradient-to-br from-stone-100 to-stone-200 rounded-lg"></div>
                      Semua Emosi
                    </div>
                  </SelectItem>
                  <SelectItem value="ai" className="rounded-xl">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      Emosi AI
                    </div>
                  </SelectItem>
                  <SelectItem value="manual" className="rounded-xl">
                    <div className="flex items-center gap-3">
                      <Heart className="h-4 w-4 text-emerald-600" />
                      Emosi Manual
                    </div>
                  </SelectItem>
                  {emotions.map((emotion) => (
                    <SelectItem
                      key={emotion.id}
                      value={emotion.name.toLowerCase()}
                      className="rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg"></div>
                        {emotion.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter Tanggal - Modern Organik */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-sky-100 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="h-3 w-3 text-blue-600" />
                </div>
                <Label className="text-sm font-medium text-organic-title">
                  Filter berdasarkan Tanggal
                </Label>
              </div>
              <Select
                value={filters.dateFilter}
                onValueChange={(value) =>
                  handleFilterChange(
                    "dateFilter",
                    value as FilterOptions["dateFilter"]
                  )
                }
                disabled={isLoading}
              >
                <SelectTrigger className="bg-white/50 border-stone-200/50 hover:border-emerald-300 focus:border-emerald-500 rounded-2xl h-12 transition-all duration-300 hover:bg-emerald-50/30">
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-lg border-stone-200/50 shadow-xl rounded-2xl">
                  <SelectItem value="all" className="rounded-xl">Semua Tanggal</SelectItem>
                  <SelectItem value="today" className="rounded-xl">Hari Ini</SelectItem>
                  <SelectItem value="yesterday" className="rounded-xl">Kemarin</SelectItem>
                  <SelectItem value="this_week" className="rounded-xl">Minggu Ini</SelectItem>
                  <SelectItem value="this_month" className="rounded-xl">Bulan Ini</SelectItem>
                  <SelectItem value="specific_date" className="rounded-xl">
                    Tanggal Tertentu
                  </SelectItem>
                  <SelectItem value="custom_range" className="rounded-xl">Range Tanggal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Input Tanggal Spesifik - Modern Organik */}
          {filters.dateFilter === "specific_date" && (
            <div className="card-organic rounded-2xl p-4 bg-gradient-to-r from-stone-50/50 to-white/50">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-organic-title flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-emerald-600" />
                  Pilih Tanggal Spesifik
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-white/50 border-stone-200/50 hover:border-emerald-300 hover:bg-emerald-50/30 rounded-2xl h-12 transition-all duration-300"
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-3 h-4 w-4 text-emerald-600" />
                      {filters.specificDate
                        ? format(filters.specificDate, "dd MMMM yyyy", {
                            locale: id,
                          })
                        : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white/95 backdrop-blur-lg border-stone-200/50 shadow-xl rounded-2xl">
                    <Calendar
                      mode="single"
                      selected={filters.specificDate}
                      onSelect={(date: Date | undefined) =>
                        handleFilterChange("specificDate", date)
                      }
                      initialFocus
                      locale={id}
                      className="rounded-2xl"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Range Tanggal - Modern Organik */}
          {filters.dateFilter === "custom_range" && (
            <div className="card-organic rounded-2xl p-6 bg-gradient-to-r from-stone-50/50 to-white/50">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-organic-title flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-emerald-600" />
                  Pilih Range Tanggal
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-organic-body">
                      Tanggal Mulai
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-white/50 border-stone-200/50 hover:border-emerald-300 hover:bg-emerald-50/30 rounded-2xl h-12 transition-all duration-300"
                          disabled={isLoading}
                        >
                          <CalendarIcon className="mr-3 h-4 w-4 text-emerald-600" />
                          {filters.startDate
                            ? format(filters.startDate, "dd MMMM yyyy", {
                                locale: id,
                              })
                            : "Pilih tanggal mulai"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white/95 backdrop-blur-lg border-stone-200/50 shadow-xl rounded-2xl">
                        <Calendar
                          mode="single"
                          selected={filters.startDate}
                          onSelect={(date: Date | undefined) =>
                            handleFilterChange("startDate", date)
                          }
                          initialFocus
                          locale={id}
                          className="rounded-2xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-organic-body">
                      Tanggal Selesai
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-white/50 border-stone-200/50 hover:border-emerald-300 hover:bg-emerald-50/30 rounded-2xl h-12 transition-all duration-300"
                          disabled={isLoading}
                        >
                          <CalendarIcon className="mr-3 h-4 w-4 text-emerald-600" />
                          {filters.endDate
                            ? format(filters.endDate, "dd MMMM yyyy", {
                                locale: id,
                              })
                            : "Pilih tanggal selesai"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white/95 backdrop-blur-lg border-stone-200/50 shadow-xl rounded-2xl">
                        <Calendar
                          mode="single"
                          selected={filters.endDate}
                          onSelect={(date: Date | undefined) =>
                            handleFilterChange("endDate", date)
                          }
                          initialFocus
                          locale={id}
                          className="rounded-2xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State - Modern Organik */}
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <div className="flex items-center gap-3 text-organic-secondary">
                <div className="w-5 h-5 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Memfilter jurnal...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}