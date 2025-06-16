'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, InfoIcon as Info, AlertCircle, Sparkles, Save, Lightbulb, XCircle, Brain, Heart, Edit, Cloud } from 'lucide-react';
import { WeatherApiResponse, EmotionApiResponse, UserLocation } from '@/types';
import WeatherDisplay from '@/components/dashboard/weather-display';
import { Input } from '../ui/input';
import { simpleMarkdownToHtml } from "@/lib/utils";
import toast from 'react-hot-toast';
import { Award } from 'lucide-react';

interface JournalFormProps {
  userId: string;
}

interface GamificationResponse {
  success: boolean;
  currentStreak?: number;
  finalTotalPoints?: number;
  newlyAwardedAchievements?: Array<{
    name: string;
    description: string;
    icon_url: string | null;
    points_reward: number;
  }>;
  pointsEarnedThisEntry?: number;
  error?: string;
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
  type Emotion = { id: number; name: string; sentiment_score: number | null };

  const [emotionSource, setEmotionSource] = useState<EmotionSource>('ai');
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [selectedEmotionId, setSelectedEmotionId] = useState<number | null>(null);
  const [emotionsMap, setEmotionsMap] = useState<Map<string, number | null>>(new Map());

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

    const fetchEmotions = async () => {
      const { data, error: fetchError } = await supabase
        .from('emotions')
        .select('id, name, sentiment_score');

      if (fetchError) {
        console.error("Error fetching emotions:", fetchError);
        setError("Gagal memuat daftar emosi.");
      } else if (data) {
        setEmotions(data as Emotion[]);
        const newMap = new Map<string, number | null>();
        data.forEach(emotion => {
          if (emotion.name) {
            const normalizedName = emotion.name.charAt(0).toUpperCase() + emotion.name.slice(1).toLowerCase();
            newMap.set(normalizedName, (typeof emotion.sentiment_score === 'number') ? emotion.sentiment_score : null);
          }
        });
        setEmotionsMap(newMap);
      }
    };
    fetchEmotions();
  }, []);

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
      let calculatedMoodScore: number | null = null;

      if (emotionSource === 'ai' && emotionData) {
        const topEmotionLabel = emotionData.top_prediction?.label;
        if (topEmotionLabel) {
          aiEmotionId = await getEmotionIdFromDb(topEmotionLabel);
          if (!aiEmotionId) {
            setIsSaving(false);
            setInfoMessage(null);
            return;
          }
        }

        let sumOfProducts = 0;
        let foundAnyValenceForAI = false;
        if (emotionData.all_predictions) {
          for (const [emotionName, confidenceFromAI] of Object.entries(emotionData.all_predictions)) {
            const normalizedEmotionName = emotionName.charAt(0).toUpperCase() + emotionName.slice(1).toLowerCase();
            const valence = emotionsMap.get(normalizedEmotionName);

            if (typeof valence === 'number' && typeof confidenceFromAI === 'number') {
              sumOfProducts += valence * confidenceFromAI;
              foundAnyValenceForAI = true;
            } else {
              console.warn(`Valence untuk emosi AI "${normalizedEmotionName}" tidak ditemukan di DB atau confidence tidak valid. Dilewati.`);
            }
          }
        }

        if (foundAnyValenceForAI) {
          calculatedMoodScore = sumOfProducts / 100;
        } else {
          calculatedMoodScore = null;
          console.warn("Tidak ada valence yang cocok ditemukan untuk emosi dari AI, mood_score di-set ke null.");
        }

      } else if (emotionSource === 'manual' && selectedEmotionId) {
        const selectedEmotionObject = emotions.find(e => e.id === selectedEmotionId);
        if (selectedEmotionObject && typeof selectedEmotionObject.sentiment_score === 'number') {
          calculatedMoodScore = selectedEmotionObject.sentiment_score;
        } else {
          setError("Emosi manual yang dipilih tidak valid atau tidak memiliki skor sentimen.");
          setIsSaving(false);
          setInfoMessage(null);
          return;
        }
      }

      const journalEntryData = {
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
        mood_score: calculatedMoodScore,
      };

      const { error: insertError } = await supabase
        .from('journal_entries')
        .insert([journalEntryData]);

      if (insertError) {
        console.error("Error inserting journal:", insertError);
        throw new Error(`Gagal menyimpan jurnal: ${insertError.message}`);
      }

      // Panggil API Gamifikasi
      try {
        const gamificationResponse = await fetch("/api/gamification/update-on-entry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            journalDate: new Date().toISOString().split('T')[0],
          }),
        });

        const gamificationData: GamificationResponse = await gamificationResponse.json();

        if (gamificationResponse.ok && gamificationData.success) {
          if (gamificationData.newlyAwardedAchievements && gamificationData.newlyAwardedAchievements.length > 0) {
            sessionStorage.setItem('newlyAwardedAchievements', JSON.stringify(gamificationData.newlyAwardedAchievements));
          }
        } else {
          console.warn("Panggilan API Gamifikasi mungkin gagal atau tidak ada achievement baru:", gamificationData.error || "Tidak ada error spesifik");
        }
      } catch (gamifError: any) {
        console.error("Error memanggil API gamifikasi:", gamifError);
      }

      // Reset form
      setTitle('');
      setContent('');
      setEmotionData(null);
      setSelectedEmotionId(null);
      setInfoMessage(null);
      
      toast.success("Jurnal berhasil disimpan!", {
        style: {
          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
          color: '#065f46',
          border: '1px solid #a7f3d0',
          borderRadius: '1rem',
          fontFamily: 'Poppins, sans-serif',
          fontWeight: '500'
        },
        iconTheme: {
          primary: '#10b981',
          secondary: '#ecfdf5',
        },
      });
      
      sessionStorage.setItem('journalSaveSuccess', 'true');
      router.push('/protected');

    } catch (err: any) {
      console.error("Error di handleSaveJournal:", err);
      const errorMessage = err.message || "Terjadi kesalahan saat menyimpan jurnal.";
      setError(errorMessage);
      
      toast.error(errorMessage, {
        style: {
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          color: '#991b1b',
          border: '1px solid #fca5a5',
          borderRadius: '1rem',
          fontFamily: 'Poppins, sans-serif',
          fontWeight: '500'
        },
        iconTheme: {
          primary: '#ef4444',
          secondary: '#fef2f2',
        },
      });
      
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
    <div className="space-organic-y-lg font-organik">
      {/* Header Section - Modern Organik */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200/40 float-organic">
          <Edit className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-organic-title mb-2">Tulis Jurnal Baru</h2>
        <p className="text-organic-body">Ekspresikan perasaan dan pemikiran Anda hari ini</p>
      </div>

      {/* Weather Section - Modern Organik */}
      <div className="card-organic rounded-3xl p-6 bg-gradient-to-br from-blue-50/50 to-sky-50/50 border border-blue-200/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-sky-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200/40">
            <Cloud className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-organic-title">Kondisi Lingkungan</h3>
        </div>
        
        {isFetchingWeather && (
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center gap-3 text-organic-secondary">
              <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Memuat data cuaca...</span>
            </div>
          </div>
        )}
        
        {weatherData && userLocation && !isFetchingWeather && (
          <div className="card-organic rounded-2xl p-4 bg-white/80">
            <WeatherDisplay weather={weatherData} locationName={userLocation.name} />
          </div>
        )}
        
        {!weatherData && !isFetchingWeather && (
          <div className="text-center py-4">
            <p className="text-sm text-organic-secondary">Data cuaca tidak tersedia atau gagal dimuat.</p>
          </div>
        )}
      </div>

      {/* Title Input - Modern Organik */}
      <div className="card-organic rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center">
            <span className="text-amber-600 text-sm font-semibold">📝</span>
          </div>
          <Label htmlFor="journal-title" className="text-lg font-semibold text-organic-title">
            Judul Jurnal
          </Label>
        </div>
        <Input
          id="journal-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Berikan judul yang menggambarkan perasaan Anda hari ini..."
          className="bg-white/50 border-stone-200/50 hover:border-emerald-300 focus:border-emerald-500 rounded-2xl h-12 text-base transition-all duration-300 focus-organic"
          disabled={isLoading}
        />
      </div>

      {/* Content Input - Modern Organik */}
      <div className="card-organic rounded-3xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
              <span className="text-emerald-600 text-sm font-semibold">✨</span>
            </div>
            <Label htmlFor="journal-content" className="text-lg font-semibold text-organic-title">
              Cerita & Perasaan Anda
            </Label>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGetInspiration}
            disabled={isLoading || !content.trim()}
            className="text-xs bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 hover:from-purple-100 hover:to-pink-100 border border-purple-200/50 rounded-xl px-3 py-2 transition-all duration-300"
          >
            {isFetchingSuggestion ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <span>AI Berpikir...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Lightbulb className="h-3 w-3" />
                <span>Dapatkan Inspirasi</span>
              </div>
            )}
          </Button>
        </div>
        
        <Textarea
          id="journal-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tuangkan semua perasaan, pemikiran, dan refleksi Anda di sini. Biarkan kata-kata mengalir dengan natural..."
          rows={10}
          className="bg-white/50 border-stone-200/50 hover:border-emerald-300 focus:border-emerald-500 rounded-2xl text-base leading-relaxed transition-all duration-300 focus-organic resize-none"
          disabled={isLoading}
        />
        <div className="flex items-center justify-between mt-3 text-sm text-organic-caption">
          <span>Ekspresikan diri Anda dengan bebas</span>
          <span>{content.length} karakter</span>
        </div>
      </div>

      {/* AI Inspiration Display - Modern Organik */}
      {isFetchingSuggestion && (
        <div className="card-organic rounded-2xl p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 border border-purple-200/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
            <div>
              <div className="font-medium text-purple-800">AI sedang menyiapkan inspirasi...</div>
              <div className="text-sm text-purple-700">Tunggu sebentar ya, ide-ide kreatif sedang dalam perjalanan</div>
            </div>
          </div>
        </div>
      )}

      {llmError && !isFetchingSuggestion && (
        <div className="card-organic rounded-2xl p-4 bg-gradient-to-r from-red-50/50 to-pink-50/50 border border-red-200/30">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <div className="font-medium text-red-800">Gagal Mendapatkan Inspirasi</div>
                <div className="text-sm text-red-700">{llmError}</div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLlmError(null)}
              className="text-red-600 hover:bg-red-100 rounded-xl"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {llmSuggestion && !isFetchingSuggestion && (
        <div className="card-organic rounded-3xl p-6 bg-gradient-to-br from-emerald-50/30 to-teal-50/30 border border-emerald-200/30">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200/40">
                <Lightbulb className="h-5 w-5 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-organic-title">Inspirasi dari AI</h4>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLlmSuggestion(null)}
              className="text-emerald-600 hover:bg-emerald-100 rounded-xl"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
          <div className="card-organic rounded-2xl p-4 bg-white/80">
            <div
              className="text-organic-body leading-relaxed whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(llmSuggestion || "") }}
            />
          </div>
        </div>
      )}

      {/* Emotion Source Selection - Modern Organik */}
      <div className="card-organic rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
            <Heart className="h-4 w-4 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-organic-title">Analisis Emosi</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <label className={`card-organic rounded-2xl p-4 cursor-pointer transition-all duration-300 border-2 ${
            emotionSource === "ai" 
              ? "border-emerald-300 bg-emerald-50/50" 
              : "border-stone-200/50 hover:border-emerald-200"
          }`}>
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="emotion_source"
                value="ai"
                checked={emotionSource === 'ai'}
                onChange={() => setEmotionSource('ai')}
                disabled={isLoading}
                className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 focus:ring-2"
              />
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                  <Brain className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-organic-title">AI Otomatis</div>
                  <div className="text-sm text-organic-secondary">Analisis cerdas berdasarkan teks</div>
                </div>
              </div>
            </div>
          </label>

          <label className={`card-organic rounded-2xl p-4 cursor-pointer transition-all duration-300 border-2 ${
            emotionSource === "manual" 
              ? "border-emerald-300 bg-emerald-50/50" 
              : "border-stone-200/50 hover:border-emerald-200"
          }`}>
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="emotion_source"
                value="manual"
                checked={emotionSource === 'manual'}
                onChange={() => setEmotionSource('manual')}
                disabled={isLoading}
                className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 focus:ring-2"
              />
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                  <Heart className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="font-medium text-organic-title">Pilih Sendiri</div>
                  <div className="text-sm text-organic-secondary">Tentukan emosi secara manual</div>
                </div>
              </div>
            </div>
          </label>
        </div>

        {/* Manual Emotion Selection - Modern Organik */}
        {emotionSource === 'manual' && (
          <div className="sub-card-organic rounded-2xl p-6">
            <Label className="text-base font-medium text-organic-title mb-3 block">
              Pilih Emosi yang Anda Rasakan
            </Label>
            <select
              value={selectedEmotionId ?? ''}
              onChange={(e) => setSelectedEmotionId(Number(e.target.value))}
              className="w-full bg-white/50 border-stone-200/50 hover:border-emerald-300 focus:border-emerald-500 rounded-2xl h-12 px-4 text-base transition-all duration-300 focus-organic"
              disabled={isLoading}
            >
              <option value="">-- Pilih emosi yang paling sesuai --</option>
              {emotions.map((emotion) => (
                <option key={emotion.id} value={emotion.id}>
                  {emotion.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Action Buttons - Modern Organik */}
      <div className="flex flex-col sm:flex-row gap-4">
        {emotionSource === 'ai' && (
          <Button
            onClick={handleAnalyzeEmotion}
            disabled={isLoading || !content.trim()}
            variant="outline"
            className="w-full sm:flex-1 h-12 bg-white/50 border-stone-200/50 hover:border-purple-300 hover:bg-purple-50/50 text-organic-title rounded-2xl transition-all duration-300"
          >
            {isAnalyzingEmotion ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <span>Menganalisis...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-purple-600" />
                </div>
                <span>Analisis Emosi</span>
              </div>
            )}
          </Button>
        )}

        <Button
          onClick={handleSaveJournal}
          disabled={
            isLoading ||
            !content.trim() ||
            !title.trim() ||
            (emotionSource === 'ai' && !emotionData) ||
            (emotionSource === 'manual' && !selectedEmotionId)
          }
          className="w-full sm:flex-1 btn-organic-primary h-12"
        >
          {isSaving ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Menyimpan...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Save className="h-5 w-5" />
              <span>Simpan Jurnal</span>
            </div>
          )}
        </Button>
      </div>

      {/* Messages - Modern Organik */}
      {infoMessage && !error && (
        <div className="card-organic rounded-2xl p-4 bg-gradient-to-r from-blue-50/50 to-sky-50/50 border border-blue-200/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
              <Info className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-blue-800">Informasi</div>
              <div className="text-sm text-blue-700">{infoMessage}</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="card-organic rounded-2xl p-4 bg-gradient-to-r from-red-50/50 to-pink-50/50 border border-red-200/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <div className="font-medium text-red-800">Terjadi Kesalahan</div>
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Emotion Analysis Results - Modern Organik */}
      {emotionData && !isAnalyzingEmotion && (
        <div className="card-organic rounded-3xl p-6 bg-gradient-to-r from-purple-50/50 to-pink-50/50 border border-purple-200/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200/40">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-organic-title">Hasil Analisis Emosi AI</h3>
          </div>
          
          <div className="space-y-4">
            <div className="card-organic rounded-2xl p-4 bg-white/80">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-organic-secondary mb-2">Emosi dominan yang terdeteksi:</p>
                  <p className="text-2xl font-bold text-purple-700 mb-1">
                    {emotionData.top_prediction.label}
                  </p>
                  <p className="text-sm text-organic-secondary">
                    Tingkat kepercayaan: {emotionData.top_prediction.confidence.toFixed(2)}%
                  </p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
              </div>
            </div>

            <div className="card-organic rounded-2xl p-4 bg-white/80">
              <h4 className="font-medium text-organic-title mb-3 flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                Detail Analisis Lengkap
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(emotionData.all_predictions)
                  .sort(([, a], [, b]) => b - a)
                  .map(([key, value]) => (
                    <div key={key} className="bg-gradient-to-r from-stone-50 to-white rounded-xl p-3 border border-stone-200/50 text-center">
                      <div className="font-medium text-sm text-organic-title capitalize mb-1">{key}</div>
                      <div className="text-xs text-organic-secondary mb-2">{value.toFixed(1)}%</div>
                      <div className="w-full bg-stone-200 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-purple-400 to-pink-400 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}