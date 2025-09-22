'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, InfoIcon as Info, AlertCircle, Sparkles, Save, Lightbulb, XCircle, Brain, Target } from 'lucide-react';
import { WeatherApiResponse, EmotionApiResponse, UserLocation } from '@/types';
import WeatherDisplay from '@/components/dashboard/weather-display';
import { Input } from '../ui/input';
import { simpleMarkdownToHtml } from "@/lib/utils";
import toast from 'react-hot-toast';

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

  const [isFetchingSuggestion, setIsFetchingSuggestion] = useState(false);
  const [llmSuggestion, setLlmSuggestion] = useState<string | null>(null);
  const [llmError, setLlmError] = useState<string | null>(null);

  // UI state
  const [showEmotionSidebar, setShowEmotionSidebar] = useState(false);

  type EmotionSource = 'ai' | 'manual';
  type Emotion = { id: number; name: string; sentiment_score: number | null };

  const [emotionSource, setEmotionSource] = useState<EmotionSource>('ai');
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [selectedEmotionId, setSelectedEmotionId] = useState<number | null>(null);
  const [emotionsMap, setEmotionsMap] = useState<Map<string, number | null>>(new Map());

  const supabase = createClient();
  const router = useRouter();

  // Keep all existing functions...
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
      setError(`Emosi "${normalizedEmotionName}" tidak ditemukan di database.`);
      return null;
    }
    return data?.id || null;
  };

  useEffect(() => {
    const fetchInitialWeather = async () => {
      if (weatherData || userLocation) return;

      setIsFetchingWeather(true);
      setError(null);

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
        } catch (err: any) {
          console.error("Error fetching initial weather:", err);
        }
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
      setShowEmotionSidebar(true);
    } catch (err: any) {
      console.error("Error during emotion analysis:", err);
      setError(err.message || "Terjadi kesalahan saat analisis emosi.");
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
            }
          }
        }

        if (foundAnyValenceForAI) {
          calculatedMoodScore = sumOfProducts / 100;
        } else {
          calculatedMoodScore = null;
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

      const { data: insertedJournal, error: insertError } = await supabase
        .from('journal_entries')
        .insert([journalEntryData])
        .select('id')
        .single();

      if (insertError) {
        console.error("Error inserting journal:", insertError);
        throw new Error(`Gagal menyimpan jurnal: ${insertError.message}`);
      }

      // Generate embeddings for the saved journal
      try {
        const response = await fetch('/api/chat/generate-embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ journalId: insertedJournal.id }),
        });

        if (response.ok) {
          console.log('Embeddings generated for journal:', insertedJournal.id);
        } else {
          console.error('Failed to generate embeddings for journal:', insertedJournal.id);
        }
      } catch (error) {
        console.error('Error triggering embedding generation:', error);
      }

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
        }
      } catch (gamifError: any) {
        console.error("Error memanggil API gamifikasi:", gamifError);
      }


      setTitle('');
      setContent('');
      setEmotionData(null);
      setSelectedEmotionId(null);
      setInfoMessage(null);
      sessionStorage.setItem('journalSaveSuccess', 'true');
      router.push('/protected');

    } catch (err: any) {
      console.error("Error di handleSaveJournal:", err);
      const errorMessage = err.message || "Terjadi kesalahan saat menyimpan jurnal.";
      setError(errorMessage);
      toast.error(errorMessage);
      setInfoMessage(null);
      setIsSaving(false);
    }
  };

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
      weatherDesc += `Cuaca: ${weatherData.current.condition.text}, suhu ${weatherData.current.temp_c}°C`;
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Minimal Header with Weather & AQI */}
        <div className="mx-8 mt-6 px-6 py-4 border border-slate-200 bg-white rounded-3xl shadow-sm relative">
          <div className="flex items-center justify-between">
            {/* Weather Display - Minimal Mode */}
            {weatherData && (
              <WeatherDisplay
                weather={weatherData}
                locationName={userLocation?.name}
                isMinimal={true}
              />
            )}

            {/* Emotion Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmotionSidebar(!showEmotionSidebar)}
              className="text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl"
            >
              <Brain className="h-4 w-4 mr-2" />
              Analisis Emosi
              {emotionData && (
                <div className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </Button>
          </div>
        </div>

        <div className="flex">
          {/* Main Writing Area - Takes up most space */}
          <div className={`transition-all duration-300 ${showEmotionSidebar ? 'w-2/3' : 'w-full'}`}>
            <div className="p-8 lg:p-12">

              {/* Writing Container */}
              <div className="max-w-4xl mx-auto space-y-8">

                {/* Journal Title */}
                <div className="space-y-4">
                  <Label htmlFor="journal-title" className="text-2xl font-light text-slate-800">
                    Judul Jurnal
                  </Label>
                  <Input
                    id="journal-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Berikan judul untuk refleksi hari ini..."
                    className="text-xl rounded-3xl border-slate-200 focus:border-blue-300 focus:ring-blue-100 h-16 bg-white"
                    disabled={isLoading}
                  />
                </div>

                {/* AI Inspiration Section - Between Title and Content */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-medium text-slate-700">
                      Butuh inspirasi?
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleGetInspiration}
                      disabled={isLoading || !content.trim()}
                      className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-2xl px-4 py-2"
                    >
                      {isFetchingSuggestion ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Lightbulb className="mr-2 h-4 w-4" />
                      )}
                      Dapatkan Inspirasi
                    </Button>
                  </div>

                  {/* AI Inspiration Display */}
                  {isFetchingSuggestion && (
                    <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6">
                      <div className="flex items-center text-blue-700">
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                        <span className="font-medium">AI sedang memikirkan inspirasi untukmu...</span>
                      </div>
                    </div>
                  )}

                  {llmSuggestion && !isFetchingSuggestion && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 relative">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-2xl flex items-center justify-center">
                            <Lightbulb className="h-4 w-4 text-emerald-600" />
                          </div>
                          <h4 className="font-medium text-emerald-800">Inspirasi Untukmu</h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded-xl"
                          onClick={() => setLlmSuggestion(null)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <div
                        className="text-emerald-800 whitespace-pre-line leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(llmSuggestion || "") }}
                      />
                    </div>
                  )}

                  {llmError && !isFetchingSuggestion && (
                    <Alert variant="destructive" className="rounded-3xl border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error Inspirasi</AlertTitle>
                      <AlertDescription className="flex justify-between items-start">
                        <span>{llmError}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2" onClick={() => setLlmError(null)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Main Writing Area */}
                <div className="space-y-4">
                  <Label htmlFor="journal-content" className="text-2xl font-light text-slate-800">
                    Bagaimana perasaanmu hari ini?
                  </Label>

                  <Textarea
                    id="journal-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Luangkan waktu sejenak untuk merefleksikan hari ini... Apa yang kamu rasakan? Apa yang membuatmu bersyukur? Atau mungkin ada sesuatu yang ingin kamu lepaskan?"
                    rows={24}
                    className="text-lg rounded-3xl border-slate-200 focus:border-blue-300 focus:ring-blue-100 resize-none leading-relaxed bg-white shadow-sm"
                    disabled={isLoading}
                  />
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-200">
                  <Button
                    onClick={handleAnalyzeEmotion}
                    disabled={isLoading || !content.trim()}
                    variant="outline"
                    className="flex-1 h-14 rounded-3xl border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 bg-white"
                  >
                    {isAnalyzingEmotion ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-5 w-5" />
                    )}
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
                    className="flex-1 h-14 rounded-3xl bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-5 w-5" />
                    )}
                    Simpan Jurnal
                  </Button>
                </div>

                {/* Status Messages */}
                {infoMessage && !error && (
                  <Alert variant="default" className="bg-blue-50 border-blue-200 rounded-3xl">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700">{infoMessage}</AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive" className="rounded-3xl border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>

          {/* Emotion Analysis Sidebar - Slides in when needed */}
          <div className={`transition-all duration-300 ${showEmotionSidebar ? 'w-1/3 opacity-100' : 'w-0 opacity-0 overflow-hidden'
            }`}>
            {/* Rounded container like weather section */}
            <div className="mx-6 mt-6 bg-white border border-slate-200 rounded-3xl shadow-sm h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center">
                      <Brain className="h-5 w-5 text-purple-500" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-800">Analisis Emosi</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowEmotionSidebar(false)}
                    className="h-8 w-8 text-slate-500 hover:text-slate-700 rounded-xl"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>

                {/* Emotion Source Selection */}
                <div className="space-y-4 mb-6 p-4 bg-slate-50 rounded-2xl">
                  <Label className="text-sm font-medium text-slate-700">Sumber Emosi</Label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-white transition-colors">
                      <input
                        type="radio"
                        name="emotion_source"
                        value="ai"
                        checked={emotionSource === 'ai'}
                        onChange={() => setEmotionSource('ai')}
                        className="w-4 h-4 text-blue-500 border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-slate-700">AI (otomatis)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-white transition-colors">
                      <input
                        type="radio"
                        name="emotion_source"
                        value="manual"
                        checked={emotionSource === 'manual'}
                        onChange={() => setEmotionSource('manual')}
                        className="w-4 h-4 text-blue-500 border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-slate-700">Pilih Sendiri</span>
                    </label>
                  </div>
                </div>

                {/* Manual Emotion Selection */}
                {emotionSource === 'manual' && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-2xl">
                    <Label htmlFor="emotion-select" className="text-sm font-medium text-slate-700 mb-3 block">
                      Pilih Emosi
                    </Label>
                    <select
                      id="emotion-select"
                      value={selectedEmotionId ?? ''}
                      onChange={e => setSelectedEmotionId(Number(e.target.value))}
                      className="w-full h-12 px-4 rounded-2xl border border-slate-200 focus:border-blue-300 focus:ring-blue-100 text-slate-700 bg-white"
                    >
                      <option value="">-- Pilih emosi --</option>
                      {emotions.map(emotion => (
                        <option key={emotion.id} value={emotion.id}>{emotion.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Emotion Analysis Results */}
                {emotionData && !isAnalyzingEmotion && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                          <Target className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-800">Emosi Dominan</span>
                      </div>
                      <p className="text-lg font-medium text-blue-600 mb-1">
                        {emotionData.top_prediction.label}
                      </p>
                      <p className="text-xs text-slate-500">
                        {emotionData.top_prediction.confidence.toFixed(1)}% confidence
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4">
                      <h4 className="text-sm font-medium text-slate-700 mb-4">Detail Analisis</h4>
                      <div className="space-y-3">
                        {Object.entries(emotionData.all_predictions)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 5)
                          .map(([key, value]) => (
                            <div key={key} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-700 capitalize">{key}</span>
                                <span className="text-xs text-slate-500 font-medium">{value.toFixed(0)}%</span>
                              </div>
                              <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-400 rounded-full transition-all duration-500"
                                  style={{ width: `${value}%` }}
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {isAnalyzingEmotion && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                      </div>
                      <p className="text-sm text-slate-600 font-medium">Menganalisis emosi...</p>
                      <p className="text-xs text-slate-500 mt-1">Tunggu sebentar ya</p>
                    </div>
                  </div>
                )}

                {/* Helper Text */}
                {!emotionData && !isAnalyzingEmotion && (
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs">💡</span>
                      </div>
                      <span className="text-sm font-medium text-blue-800">Tips</span>
                    </div>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      Tulis jurnalmu terlebih dahulu, lalu gunakan analisis AI untuk memahami emosimu atau pilih emosi secara manual.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}