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
import { CalendarIcon, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Filter Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg shadow-sm">
              <Filter className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Filter Jurnal</h3>
              <div className="flex items-center gap-2 mt-1">
                {hasActiveFilters && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                    Filter Aktif
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  Sesuaikan pencarian jurnal Anda
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                disabled={isLoading}
                className="text-gray-600 hover:bg-white hover:text-red-600 transition-colors"
              >
                <X className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-gray-700 hover:bg-white transition-colors"
            >
              {showFilters ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Sembunyikan
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Tampilkan
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      {showFilters && (
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Filter Emosi */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Filter berdasarkan Emosi
              </Label>
              <Select
                value={filters.emotionFilter}
                onValueChange={(value) =>
                  handleFilterChange("emotionFilter", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger className="bg-white border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors">
                  <SelectValue placeholder="Pilih emosi" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 shadow-lg">
                  <SelectItem value="all">Semua Emosi</SelectItem>
                  <SelectItem value="ai">Emosi AI</SelectItem>
                  <SelectItem value="manual">Emosi Manual</SelectItem>
                  {emotions.map((emotion) => (
                    <SelectItem
                      key={emotion.id}
                      value={emotion.name.toLowerCase()}
                    >
                      {emotion.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter Tanggal */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Filter berdasarkan Tanggal
              </Label>
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
                <SelectTrigger className="bg-white border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors">
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 shadow-lg">
                  <SelectItem value="all">Semua Tanggal</SelectItem>
                  <SelectItem value="today">Hari Ini</SelectItem>
                  <SelectItem value="yesterday">Kemarin</SelectItem>
                  <SelectItem value="this_week">Minggu Ini</SelectItem>
                  <SelectItem value="this_month">Bulan Ini</SelectItem>
                  <SelectItem value="specific_date">
                    Tanggal Tertentu
                  </SelectItem>
                  <SelectItem value="custom_range">Range Tanggal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Input Tanggal Spesifik */}
            {filters.dateFilter === "specific_date" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Pilih Tanggal
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                      {filters.specificDate
                        ? format(filters.specificDate, "dd MMMM yyyy", {
                            locale: id,
                          })
                        : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white border-gray-200 shadow-lg">
                    <Calendar
                      mode="single"
                      selected={filters.specificDate}
                      onSelect={(date: Date | undefined) =>
                        handleFilterChange("specificDate", date)
                      }
                      initialFocus
                      locale={id}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Range Tanggal */}
          {filters.dateFilter === "custom_range" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-100">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Tanggal Mulai
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                      {filters.startDate
                        ? format(filters.startDate, "dd MMMM yyyy", {
                            locale: id,
                          })
                        : "Pilih tanggal mulai"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white border-gray-200 shadow-lg">
                    <Calendar
                      mode="single"
                      selected={filters.startDate}
                      onSelect={(date: Date | undefined) =>
                        handleFilterChange("startDate", date)
                      }
                      initialFocus
                      locale={id}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Tanggal Selesai
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                      {filters.endDate
                        ? format(filters.endDate, "dd MMMM yyyy", {
                            locale: id,
                          })
                        : "Pilih tanggal selesai"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white border-gray-200 shadow-lg">
                    <Calendar
                      mode="single"
                      selected={filters.endDate}
                      onSelect={(date: Date | undefined) =>
                        handleFilterChange("endDate", date)
                      }
                      initialFocus
                      locale={id}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
