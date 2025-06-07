'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, InfoIcon as Info, AlertCircle, Sparkles, Save, Lightbulb, XCircle } from 'lucide-react'; // Tambahkan Lightbulb, XCircle
import { WeatherApiResponse, EmotionApiResponse, UserLocation } from '@/types';
import WeatherDisplay from '@/components/dashboard/weather-display';
import { Input } from '../ui/input';
import { simpleMarkdownToHtml } from "@/lib/utils";


interface JournalFormProps {
  userId: string;
}

export default function JournalForm({ userId }: JournalFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [isAnalyzingEmotion, setIsAnalyzingEmotion] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherApiResponse | null>(null);
  const [emotionData, setEmotionData] = useState<EmotionApiResponse | null>(null);

  // State baru untuk fitur inspirasi LLM
  const [isFetchingSuggestion, setIsFetchingSuggestion] = useState(false);
  const [llmSuggestion, setLlmSuggestion] = useState<string | null>(null);
  const [llmError, setLlmError] = useState<string | null>(null);

  type EmotionSource = 'ai' | 'manual';
  type Emotion = { id: number; name: string };

  const [emotionSource, setEmotionSource] = useState<EmotionSource>('ai');
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [selectedEmotionId, setSelectedEmotionId] = useState<number | null>(null);


  const supabase = createClient();
  const router = useRouter();

  const getEmotionIdFromDb = async (emotionName?: string): Promise<number | null> => {
    // ... existing code ...
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
      // ... existing code ...
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

    const fetchEmotions = async () => {
      const { data } = await supabase.from('emotions').select('*');
      setEmotions(data || []);
    };
    fetchEmotions();
  }, []); // Hanya dijalankan sekali saat mount

  const handleAnalyzeEmotion = async () => {
    // ... existing code ...
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
    if (!title.trim()) {
      setError("Judul jurnal tidak boleh kosong.");
      return;
    }
    if (!content.trim()) {
      setError("Konten jurnal tidak boleh kosong.");
      return;
    }
    if (emotionSource === 'ai' && !emotionData) {
      setError("Silakan lakukan analisis emosi terlebih dahulu sebelum menyimpan.");
      return;
    }
    if (emotionSource === 'manual' && !selectedEmotionId) {
      setError("Silakan pilih emosi utama terlebih dahulu sebelum menyimpan.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setInfoMessage("Menyimpan jurnal...");

    try {
      let aiEmotionId: number | null = null;
      if (emotionSource === 'ai' && emotionData) {
        const topEmotionLabel = emotionData.top_prediction?.label;
        aiEmotionId = await getEmotionIdFromDb(topEmotionLabel);
        if (!aiEmotionId && topEmotionLabel) {
          setIsSaving(false);
          setInfoMessage(null);
          return;
        }
      }

      const { error: insertError } = await supabase
        .from('journal_entries')
        .insert([{
          user_id: userId,
          title,
          content,
          weather_data: weatherData,
          emotion_analysis: emotionSource === 'ai' ? emotionData : null,
          emotion_id: emotionSource === 'manual' ? selectedEmotionId : aiEmotionId,
          emotion_source: emotionSource,
          latitude: userLocation?.latitude,
          longitude: userLocation?.longitude,
          location_name: userLocation?.name || weatherData?.location.name,
        }]);

      if (insertError) throw insertError;

      setTitle('');
      setContent('');
      setEmotionData(null);
      setSelectedEmotionId(null);
      setInfoMessage("Jurnal berhasil disimpan! Mengarahkan ke dashboard...");
      setTimeout(() => {
        router.push('/protected');
      }, 2000);

    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menyimpan jurnal.");
      setInfoMessage(null);
      setIsSaving(false);
    }
  };

  // Fungsi baru untuk mendapatkan inspirasi dari LLM
  const handleGetInspiration = async () => {
    if (!content.trim()) {
      setLlmError("Tuliskan sesuatu di jurnalmu terlebih dahulu untuk mendapatkan inspirasi.");
      setLlmSuggestion(null);
      return;
    }
    setIsFetchingSuggestion(true);
    setLlmSuggestion(null);
    setLlmError(null);

    let weatherDesc = "";
    if (weatherData) {
      weatherDesc += `Cuaca: ${weatherData.current.condition.text}, suhu ${weatherData.current.temp_c}°C, kelembapan ${weatherData.current.humidity}%, tekanan udara ${weatherData.current.pressure_mb} mb, kecepatan angin ${weatherData.current.wind_kph} km/jam. `;
      if (weatherData.current.air_quality) {
        const aq = weatherData.current.air_quality;
        weatherDesc += `Kualitas udara: PM2.5 ${aq.pm2_5?.toFixed(1) ?? '-'} µg/m³, PM10 ${aq.pm10?.toFixed(1) ?? '-'} µg/m³, CO ${aq.co?.toFixed(1) ?? '-'} µg/m³, NO₂ ${aq.no2?.toFixed(1) ?? '-'} µg/m³, O₃ ${aq.o3?.toFixed(1) ?? '-'} µg/m³, SO₂ ${aq.so2?.toFixed(1) ?? '-'} µg/m³. `;
      }
    }

    const llmPrompt = `
Saya ingin menulis jurnal harian, tapi saya sedang bingung harus mulai dari mana. Berikut data hari ini:
${weatherDesc}
Isi jurnal saya sejauh ini: "${content}"

Tolong berikan 2 pertanyaan reflektif yang sederhana dan hangat, agar saya bisa mulai menulis tentang perasaan, pengalaman pribadi, atau pemikiran saya hari ini—baik yang berkaitan dengan diri sendiri, lingkungan, perubahan iklim, maupun inovasi digital untuk keberlanjutan. Sertakan juga 1 ide menulis yang mudah dan personal, supaya saya lebih nyaman menuangkan pikiran atau perasaan saya. Jawaban singkat saja, tanpa markdown atau simbol aneh, dan gunakan bahasa yang ramah seperti teman yang membantu.
`;
    try {
      const response = await fetch("/api/gemini-inspire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: llmPrompt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal mendapatkan inspirasi dari Gemini.");
      setLlmSuggestion(data.suggestion);
    } catch (err: any) {
      setLlmError(err.message || "Terjadi kesalahan saat mencoba mendapatkan inspirasi dari Gemini.");
    } finally {
      setIsFetchingSuggestion(false);
    }
  };


  const isLoading = isFetchingWeather || isAnalyzingEmotion || isSaving || isFetchingSuggestion;

  return (
    <div className="space-y-6">
      {/* ... Tampilan Cuaca ... */}
      <div className="p-4 border rounded-md bg-muted/20">
        <h3 className="text-lg font-semibold mb-2">Kondisi Lingkungan Saat Jurnal Dibuat</h3>
        {isFetchingWeather && <div className="flex items-center text-sm"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat data cuaca...</div>}
        {weatherData && userLocation && !isFetchingWeather && <WeatherDisplay weather={weatherData} locationName={userLocation.name} />}
        {!weatherData && !isFetchingWeather && <p className="text-sm text-muted-foreground">Data cuaca tidak tersedia atau gagal dimuat.</p>}
      </div>

      <div>
        <Label htmlFor="journal-title" className="text-base font-medium">
          Judul Jurnal
        </Label>
        <Input
          id="journal-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Berikan judul untuk entri jurnalmu..."
          className="mt-1 text-base"
          disabled={isLoading}
        />
      </div>

      <div>
        <div className="flex justify-between items-center">
          <Label htmlFor="journal-content" className="text-base font-medium">
            Apa yang kamu rasakan atau pikirkan hari ini?
          </Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGetInspiration}
            disabled={isLoading || !content.trim()}
            className="text-xs text-primary hover:bg-primary/10 px-2 py-1"
          >
            {isFetchingSuggestion ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Lightbulb className="mr-1.5 h-3.5 w-3.5" />
            )}
            Dapatkan Inspirasi
          </Button>
        </div>
        <Textarea
          id="journal-content"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            // Otomatis hapus saran LLM jika pengguna mulai mengetik lagi
            // if (llmSuggestion || llmError) {
            //   setLlmSuggestion(null);
            //   setLlmError(null);
            // }
          }}
          placeholder="Tuliskan jurnalmu di sini..."
          rows={8}
          className="mt-1 text-base"
          disabled={isLoading}
        />
      </div>

      {/* Tampilkan Saran LLM */}
      {isFetchingSuggestion && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700 flex items-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          AI sedang berpikir...
        </div>
      )}
      {llmError && !isFetchingSuggestion && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Inspirasi AI</AlertTitle>
          <AlertDescription>
            {llmError}
            <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto -mr-2 -mt-2" onClick={() => setLlmError(null)}>
              <XCircle className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {llmSuggestion && !isFetchingSuggestion && (
        <div className="mt-2 p-4 border rounded-md bg-green-50 border-green-300 text-green-800 relative">
          <div className="flex justify-between items-start">
            <h4 className="text-sm font-semibold mb-1 flex items-center">
              <Lightbulb className="h-4 w-4 mr-1.5 text-green-600" />
              Saran dari AI:
            </h4>
            <Button variant="ghost" size="icon" className="h-7 w-7 absolute top-1 right-1" onClick={() => setLlmSuggestion(null)}>
              <XCircle className="h-5 w-5 text-green-700 hover:text-green-900" />
            </Button>
          </div>
          <p
            className="text-sm whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(llmSuggestion || "") }}
          />
        </div>
      )}


      {/* ... Pesan Info/Error Global dan Tombol Aksi ... */}
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

      <div className="mb-4">
        <Label className="block mb-1">Sumber Emosi</Label>
        <div className="flex gap-4">
          <label>
            <input
              type="radio"
              name="emotion_source"
              value="ai"
              checked={emotionSource === 'ai'}
              onChange={() => setEmotionSource('ai')}
            />
            AI (otomatis)
          </label>
          <label>
            <input
              type="radio"
              name="emotion_source"
              value="manual"
              checked={emotionSource === 'manual'}
              onChange={() => setEmotionSource('manual')}
            />
            Pilih Sendiri
          </label>
        </div>
      </div>

      {emotionSource === 'manual' && (
        <div className="mb-4">
          <Label htmlFor="emotion-select">Pilih Emosi</Label>
          <select
            id="emotion-select"
            value={selectedEmotionId ?? ''}
            onChange={e => setSelectedEmotionId(Number(e.target.value))}
            className="block mt-1"
          >
            <option value="">-- Pilih emosi --</option>
            {emotions.map(emotion => (
              <option key={emotion.id} value={emotion.id}>{emotion.name}</option>
            ))}
          </select>
        </div>
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
          disabled={
            isLoading ||
            !content.trim() ||
            !title.trim() ||
            (emotionSource === 'ai' && !emotionData) ||
            (emotionSource === 'manual' && !selectedEmotionId)
          }
          className="w-full sm:flex-1"
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Simpan Catatan
        </Button>
      </div>

      {/* ... Tampilan Hasil Analisis Emosi ... */}
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