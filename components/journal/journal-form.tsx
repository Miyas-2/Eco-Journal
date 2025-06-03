'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, InfoIcon as Info, AlertCircle, Sparkles, Save } from 'lucide-react'; // Tambahkan ikon
import { WeatherApiResponse, EmotionApiResponse, UserLocation } from '@/types';
import WeatherDisplay from '@/components/dashboard/weather-display';

interface JournalFormProps {
  userId: string;
}

export default function JournalForm({ userId }: JournalFormProps) {
  const [content, setContent] = useState('');
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [isAnalyzingEmotion, setIsAnalyzingEmotion] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherApiResponse | null>(null);
  const [emotionData, setEmotionData] = useState<EmotionApiResponse | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const getEmotionIdFromDb = async (emotionName?: string): Promise<number | null> => {
    if (!emotionName) return null;
    const normalizedEmotionName = emotionName.charAt(0).toUpperCase() + emotionName.slice(1).toLowerCase();

    const { data, error: dbError } = await supabase
      .from('emotions')
      .select('id')
      .eq('name', normalizedEmotionName)
      .single();

    if (dbError) {
      console.error(`Error fetching emotion id for "${normalizedEmotionName}":`, dbError);
      setError(`Emosi "${normalizedEmotionName}" tidak ditemukan di database. Pastikan tabel 'emotions' terisi dengan benar dan nama emosi dari API (${emotionName}) cocok setelah normalisasi.`);
      return null;
    }
    return data?.id || null;
  };

  useEffect(() => {
    const fetchInitialWeather = async () => {
      if (weatherData || userLocation) return;

      setIsFetchingWeather(true);
      setError(null);
      setInfoMessage("Mendeteksi lokasi dan cuaca Anda...");

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
          });
          const fetchedLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setUserLocation(fetchedLocation);

          const weatherResponse = await fetch('/api/weather', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fetchedLocation),
          });

          if (!weatherResponse.ok) {
            const errData = await weatherResponse.json();
            throw new Error(errData.error || `Gagal mengambil data cuaca: ${weatherResponse.statusText}`);
          }
          const fetchedWeatherData: WeatherApiResponse = await weatherResponse.json();
          setWeatherData(fetchedWeatherData);
          setUserLocation(prevLoc => ({
            ...prevLoc!,
            name: fetchedWeatherData.location.name,
          }));
          setInfoMessage("Data cuaca berhasil dimuat.");
        } catch (err: any) {
          console.error("Error fetching initial weather:", err);
          setError(err.message || "Tidak dapat mengambil data lokasi atau cuaca awal.");
          setInfoMessage(null);
        }
      } else {
        setError("Browser Anda tidak mendukung geolocation atau izin lokasi ditolak.");
        setInfoMessage(null);
      }
      setIsFetchingWeather(false);
    };

    fetchInitialWeather();
  }, []); // Hanya dijalankan sekali saat mount

  const handleAnalyzeEmotion = async () => {
    if (!content.trim()) {
      setError("Konten jurnal tidak boleh kosong untuk dianalisis.");
      return;
    }
    setIsAnalyzingEmotion(true);
    setError(null);
    setEmotionData(null);
    setInfoMessage("Menganalisis emosi...");

    try {
      const emotionResponse = await fetch('/api/emotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      });
      if (!emotionResponse.ok) {
        const errData = await emotionResponse.json();
        throw new Error(errData.error || `Gagal menganalisis emosi: ${emotionResponse.statusText}`);
      }
      const fetchedEmotionData: EmotionApiResponse = await emotionResponse.json();
      setEmotionData(fetchedEmotionData);
      setInfoMessage("Analisis emosi selesai.");
    } catch (err: any) {
      console.error("Error during emotion analysis:", err);
      setError(err.message || "Terjadi kesalahan saat analisis emosi.");
      setInfoMessage(null);
    } finally {
      setIsAnalyzingEmotion(false);
    }
  };

  const handleSaveJournal = async () => {
    if (!content.trim()) {
      setError("Konten jurnal tidak boleh kosong.");
      return;
    }
    if (!emotionData) {
      setError("Silakan lakukan analisis emosi terlebih dahulu sebelum menyimpan.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setInfoMessage("Menyimpan jurnal...");

    try {
      const topEmotionLabel = emotionData.top_prediction?.label;
      const emotionId = await getEmotionIdFromDb(topEmotionLabel);

      if (!emotionId && topEmotionLabel) {
        setIsSaving(false);
        setInfoMessage(null);
        return; // Error sudah di-set di getEmotionIdFromDb
      }

      const { error: insertError } = await supabase
        .from('journal_entries')
        .insert([{
          user_id: userId,
          content: content,
          weather_data: weatherData,
          emotion_analysis: emotionData,
          emotion_id: emotionId,
          emotion_source: 'ai',
          latitude: userLocation?.latitude,
          longitude: userLocation?.longitude,
          location_name: userLocation?.name || weatherData?.location.name,
        }]);

      if (insertError) throw insertError;

      setContent('');
      setEmotionData(null);
      setInfoMessage("Jurnal berhasil disimpan! Mengarahkan ke dashboard...");
      setTimeout(() => {
        router.push('/protected');
      }, 2000);

    } catch (err: any) {
      console.error("Error saving journal:", err);
      setError(err.message || "Terjadi kesalahan saat menyimpan jurnal.");
      setInfoMessage(null);
      setIsSaving(false); // Hanya set false jika ada error, agar tombol tidak aktif lagi
    }
    // Jangan setIsSaving(false) di sini jika redirect, agar tombol tetap disabled
  };

  const isLoading = isFetchingWeather || isAnalyzingEmotion || isSaving;

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-md bg-muted/20">
        <h3 className="text-lg font-semibold mb-2">Kondisi Lingkungan Saat Jurnal Dibuat</h3>
        {isFetchingWeather && <div className="flex items-center text-sm"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat data cuaca...</div>}
        {weatherData && userLocation && !isFetchingWeather && <WeatherDisplay weather={weatherData} locationName={userLocation.name} />}
        {!weatherData && !isFetchingWeather && <p className="text-sm text-muted-foreground">Data cuaca tidak tersedia atau gagal dimuat.</p>}
      </div>

      <div>
        <Label htmlFor="journal-content" className="text-base font-medium">
          Apa yang kamu rasakan atau pikirkan hari ini?
        </Label>
        <Textarea
          id="journal-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tuliskan jurnalmu di sini..."
          rows={8}
          className="mt-1 text-base"
          disabled={isLoading}
        />
      </div>

      {infoMessage && !error && (
        <Alert variant="default" className="bg-blue-50 border-blue-300 text-blue-700">
          <Info className="h-4 w-4 !text-blue-700" />
          <AlertTitle>Informasi</AlertTitle>
          <AlertDescription>{infoMessage}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleAnalyzeEmotion}
          disabled={isLoading || !content.trim()}
          className="w-full sm:flex-1"
          variant="outline"
        >
          {isAnalyzingEmotion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Analisis Emosi
        </Button>
        <Button
          onClick={handleSaveJournal}
          disabled={isLoading || !emotionData || !content.trim()}
          className="w-full sm:flex-1"
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Simpan Catatan
        </Button>
      </div>

      {emotionData && !isAnalyzingEmotion && (
        <div className="mt-6 space-y-3 p-4 border rounded-md bg-muted/30">
          <h3 className="text-lg font-semibold border-b pb-2 mb-2">Hasil Analisis Emosi</h3>
          <div>
            <p className="text-base">
              Emosi Dominan: <strong className="text-lg text-primary">{emotionData.top_prediction.label}</strong> ({emotionData.top_prediction.confidence.toFixed(2)}%)
            </p>
            <p className="text-sm mt-2 text-muted-foreground">Detail Prediksi:</p>
            <ul className="text-xs list-disc list-inside pl-1 mt-1 grid grid-cols-2 sm:grid-cols-3 gap-x-4">
              {Object.entries(emotionData.all_predictions)
                .sort(([, a], [, b]) => b - a) // Urutkan dari tertinggi ke terendah
                .map(([key, value]) => (
                  <li key={key} className="break-inside-avoid my-0.5">{key}: {value.toFixed(2)}%</li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}