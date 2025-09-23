'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Lightbulb, AlertTriangle, RefreshCw, Sparkles, Brain } from 'lucide-react';
import { WeatherApiResponse } from '@/types';

interface JournalInsightSectionProps {
  initialInsightText: string | null;
  journalId: string;
  userId: string;
  journalContent: string;
  primaryEmotion: string;
  weatherData: WeatherApiResponse | null;
  locationDisplayName: string;
  journalCreatedAt: string;
}

export default function JournalInsightSection({
  initialInsightText,
  journalId,
  userId,
  journalContent,
  primaryEmotion,
  weatherData,
  locationDisplayName,
  journalCreatedAt,
}: JournalInsightSectionProps) {
  const [insight, setInsight] = useState<string | null>(initialInsightText);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(!!initialInsightText);

  const handleFetchOrRefreshInsight = async () => {
    setIsLoading(true);
    setError(null);
    setHasFetchedOnce(true);

    if (!journalCreatedAt) {
        setError("Tanggal pembuatan jurnal tidak tersedia. Tidak dapat menghasilkan insight.");
        setIsLoading(false);
        return;
    }

    try {
      const response = await fetch(`/api/gemini-daily-insight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journalId,
          userId,
          journalContent,
          emotion: primaryEmotion,
          weatherData,
          locationName: locationDisplayName,
          journalCreatedAt,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || data.error_db || `Gagal mendapatkan insight: ${response.statusText}`);
      }
      setInsight(data.insight);
    } catch (err: any) {
      console.error("Error fetching/generating insight:", err);
      setError(err.message || "Terjadi kesalahan saat mengambil insight.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialInsightText) {
      setInsight(initialInsightText);
    }
  }, [initialInsightText]);

  const buttonText = isLoading
    ? "Menganalisis..."
    : insight
    ? "Perbarui Insight"
    : "Buat Insight";

  const ButtonIcon = isLoading
    ? Loader2
    : insight
    ? RefreshCw
    : Brain;

  const canGenerateInsight = primaryEmotion && weatherData && journalCreatedAt;

  return (
    <div className="space-y-8">
      {/* Simple Header - matches journal style */}
      <div className="text-center">
        <p className="text-sm text-slate-500 mb-6">
          Refleksi personal berdasarkan jurnal, emosi, dan kondisi sekitar Anda
        </p>
        
        <Button
          onClick={handleFetchOrRefreshInsight}
          disabled={isLoading || !canGenerateInsight}
          className={`
            rounded-2xl px-6 py-3 transition-all duration-200
            ${isLoading || !canGenerateInsight
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-sky-500 hover:bg-sky-600 text-white shadow-sm hover:shadow-md'
            }
          `}
        >
          <ButtonIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {buttonText}
        </Button>
      </div>

      {/* Content Area - matches journal content style */}
      <div className="max-w-3xl mx-auto">
        {/* Data Requirements Notice */}
        {!canGenerateInsight && !hasFetchedOnce && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
            <h4 className="text-lg font-medium text-slate-800 mb-2">Data Belum Lengkap</h4>
            <p className="text-slate-600 leading-relaxed max-w-md mx-auto">
              Insight memerlukan data emosi, cuaca, dan tanggal jurnal yang lengkap untuk dapat dihasilkan dengan optimal.
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
            </div>
            <h4 className="text-lg font-medium text-slate-800 mb-2">AI sedang menganalisis...</h4>
            <p className="text-slate-600">Membuat insight personal berdasarkan jurnal Anda</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h4 className="text-lg font-medium text-slate-800 mb-2">Gagal Memuat Insight</h4>
            <p className="text-slate-600 leading-relaxed max-w-md mx-auto">
              {error}
            </p>
            <Button
              variant="outline"
              onClick={handleFetchOrRefreshInsight}
              disabled={!canGenerateInsight}
              className="mt-4 rounded-2xl"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        )}

        {/* Insight Content - matches journal content exactly */}
        {!isLoading && !error && insight && (
          <div className="space-y-8">
            {/* Main insight content with same styling as journal */}
            <div className="prose prose-lg prose-slate max-w-none leading-relaxed">
              <div className="text-slate-700 text-lg leading-loose whitespace-pre-line font-light">
                {insight}
              </div>
            </div>
            
            {/* Footer attribution - matches journal footer style */}
            <div className="pt-8 border-t border-slate-200">
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-4 py-2 rounded-xl">
                  <Sparkles className="h-4 w-4" />
                  <span>Dibuat oleh AI • Berdasarkan jurnal, emosi, dan cuaca</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - First Time */}
        {!isLoading && !error && !insight && !hasFetchedOnce && canGenerateInsight && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-sky-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Brain className="h-10 w-10 text-sky-500" />
            </div>
            <h4 className="text-xl font-light text-slate-800 mb-4 leading-tight">
              Insight Personal Menanti
            </h4>
            <p className="text-slate-600 leading-relaxed max-w-lg mx-auto mb-8">
              AI siap menganalisis jurnal, emosi, dan kondisi cuaca Anda untuk memberikan 
              refleksi yang bermakna dan insight personal yang mendalam.
            </p>
            <Button
              onClick={handleFetchOrRefreshInsight}
              className="bg-sky-500 hover:bg-sky-600 text-white rounded-2xl px-8 py-3 shadow-sm hover:shadow-md transition-all duration-200"
              disabled={isLoading}
            >
              <Brain className="h-5 w-5 mr-2" />
              Buat Insight Pertama
            </Button>
          </div>
        )}

        {/* Empty State - After Fetch Attempt */}
        {!isLoading && !error && !insight && hasFetchedOnce && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="h-8 w-8 text-slate-400" />
            </div>
            <h4 className="text-lg font-medium text-slate-800 mb-2">Insight Belum Tersedia</h4>
            <p className="text-slate-600 leading-relaxed max-w-md mx-auto mb-6">
              Tidak ada insight yang dapat dihasilkan saat ini. Coba lagi atau pastikan jurnal Anda memiliki konten yang cukup.
            </p>
            <Button
              variant="outline"
              onClick={handleFetchOrRefreshInsight}
              disabled={!canGenerateInsight}
              className="rounded-2xl"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}