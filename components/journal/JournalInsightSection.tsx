'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Lightbulb, AlertTriangle, RefreshCw } from 'lucide-react';
import { WeatherApiResponse } from '@/types'; // Pastikan path ini benar

interface JournalInsightSectionProps {
  initialInsightText: string | null;
  journalId: string;
  userId: string;
  journalContent: string;
  primaryEmotion: string; // Emosi utama yang sudah ditentukan (misal: "Cemas")
  weatherData: WeatherApiResponse | null;
  locationDisplayName: string; // Nama lokasi yang akan ditampilkan ke AI
  journalCreatedAt: string; // <-- TAMBAHKAN PROPERTI INI
}

export default function JournalInsightSection({
  initialInsightText,
  journalId,
  userId,
  journalContent,
  primaryEmotion,
  weatherData,
  locationDisplayName,
  journalCreatedAt, // <-- TERIMA PROPERTI INI
}: JournalInsightSectionProps) {
  const [insight, setInsight] = useState<string | null>(initialInsightText);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(!!initialInsightText);

  const handleFetchOrRefreshInsight = async () => {
    setIsLoading(true);
    setError(null);
    setHasFetchedOnce(true);

    // Pastikan journalCreatedAt ada sebelum mengirim
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
          journalCreatedAt, // <-- SERTAKAN PROPERTI INI DI BODY
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
    ? "Memproses..."
    : insight
    ? "Segarkan Insight"
    : "Dapatkan Insight";

  const ButtonIcon = isLoading
    ? Loader2
    : insight
    ? RefreshCw
    : Lightbulb;

  return (
    <section className="p-4 border rounded-lg bg-background shadow">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold flex items-center text-foreground">
          <Lightbulb className="h-5 w-5 mr-2 text-yellow-400" />
          Insight Harian Untukmu
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFetchOrRefreshInsight}
          disabled={isLoading || !primaryEmotion || !weatherData || !journalCreatedAt} // Tambahkan !journalCreatedAt ke kondisi disabled
          title={!primaryEmotion || !weatherData || !journalCreatedAt ? "Data emosi, cuaca, atau tanggal jurnal tidak lengkap" : buttonText}
        >
          <ButtonIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="ml-2 hidden sm:inline">{buttonText}</span>
        </Button>
      </div>

      {(!primaryEmotion || !weatherData || !journalCreatedAt) && !hasFetchedOnce && ( // Tambahkan !journalCreatedAt
         <p className="text-sm text-muted-foreground italic">
           Data emosi, cuaca, atau tanggal jurnal tidak lengkap untuk menghasilkan insight.
         </p>
      )}

      {hasFetchedOnce && (
        <div className="bg-muted/50 p-3 rounded-md text-sm text-foreground min-h-[50px]">
          {isLoading && <p className="italic text-center">AI sedang merangkai kata untukmu...</p>}
          {!isLoading && error && (
            <div className="flex items-start text-destructive">
              <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {!isLoading && !error && insight && (
            <p className="whitespace-pre-line">{insight}</p>
          )}
          {!isLoading && !error && !insight && (
            <p className="italic text-center">Klik tombol untuk mendapatkan insight.</p>
          )}
        </div>
      )}
    </section>
  );
}