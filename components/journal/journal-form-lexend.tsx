'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, Lightbulb, XCircle, ArrowLeft, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { WeatherApiResponse, EmotionApiResponse, UserLocation } from '@/types';
import toast from 'react-hot-toast';
import { simpleMarkdownToHtml } from "@/lib/utils";

interface JournalFormProps {
  userId: string;
}

type EmotionSource = 'ai' | 'manual';
type Emotion = { id: number; name: string; sentiment_score: number | null };

export default function JournalFormLexend({ userId }: JournalFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [isAnalyzingEmotion, setIsAnalyzingEmotion] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherApiResponse | null>(null);
  const [emotionData, setEmotionData] = useState<EmotionApiResponse | null>(null);

  const [isFetchingSuggestion, setIsFetchingSuggestion] = useState(false);
  const [llmSuggestion, setLlmSuggestion] = useState<string | null>(null);
  const [llmError, setLlmError] = useState<string | null>(null);

  const [emotionSource, setEmotionSource] = useState<EmotionSource>('ai');
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [selectedEmotionId, setSelectedEmotionId] = useState<number | null>(null);
  const [emotionsMap, setEmotionsMap] = useState<Map<string, number | null>>(new Map());
  
  // Toggle states
  const [showManualDropdown, setShowManualDropdown] = useState(false);
  const [showDetailAnalysis, setShowDetailAnalysis] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // const displayName = 'Alex'; // You can get this from user metadata
  const [displayName, setDisplayName] = useState<string>('');

  // Fetch displayName from user metadata
  useEffect(() => {
    const fetchDisplayName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata && user.user_metadata.display_name) {
        setDisplayName(user.user_metadata.display_name);
      } else if (user && user.email) {
        setDisplayName(user.email.split('@')[0]);
      } else {
        setDisplayName('Friend');
      }
    };
    fetchDisplayName();
  }, []);

  // Get current date
  const getCurrentDate = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const day = now.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
    
    return `${dayName}, ${monthName} ${day}${suffix}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

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
    setEmotionSource('ai');

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
      toast.success('Emotion analyzed successfully!');
    } catch (err: any) {
      console.error("Error during emotion analysis:", err);
      setError(err.message || "Terjadi kesalahan saat analisis emosi.");
      toast.error(err.message);
    } finally {
      setIsAnalyzingEmotion(false);
    }
  };

  const handleGetInspiration = async () => {
    setIsFetchingSuggestion(true);
    setLlmError(null);
    setLlmSuggestion(null);

    const weatherDesc = weatherData
      ? `Cuaca: ${weatherData.current.condition.text}, Suhu: ${weatherData.current.temp_c}°C, Kelembapan: ${weatherData.current.humidity}%, Kualitas Udara: ${weatherData.current.air_quality?.['us-epa-index'] || 'N/A'}`
      : 'Cuaca tidak tersedia.';

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

  const handleManualEmotionSelect = (emotionId: number) => {
    setSelectedEmotionId(emotionId);
    setEmotionSource('manual');
    setEmotionData(null); // Clear AI data when manual is selected
    setShowManualDropdown(false);
    toast.success('Emotion selected!');
  };

  const handleSaveJournal = async () => {
    if (!title.trim()) {
      setError("Judul jurnal tidak boleh kosong.");
      toast.error("Judul jurnal tidak boleh kosong.");
      return;
    }
    if (!content.trim()) {
      setError("Konten jurnal tidak boleh kosong.");
      toast.error("Konten jurnal tidak boleh kosong.");
      return;
    }
    if (emotionSource === 'ai' && !emotionData) {
      setError("Silakan lakukan analisis emosi terlebih dahulu sebelum menyimpan.");
      toast.error("Silakan analisis emosi terlebih dahulu.");
      return;
    }
    if (emotionSource === 'manual' && !selectedEmotionId) {
      setError("Silakan pilih emosi utama terlebih dahulu sebelum menyimpan.");
      toast.error("Silakan pilih emosi manual terlebih dahulu.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let aiEmotionId: number | null = null;
      let calculatedMoodScore: number | null = null;

      if (emotionSource === 'ai' && emotionData) {
        const topEmotionLabel = emotionData.top_prediction?.label;
        if (topEmotionLabel) {
          aiEmotionId = await getEmotionIdFromDb(topEmotionLabel);
          if (!aiEmotionId) {
            setIsSaving(false);
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

      // Generate embeddings
      try {
        await fetch('/api/chat/generate-embeddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ journalId: insertedJournal.id }),
        });
      } catch (error) {
        console.error('Error triggering embedding generation:', error);
      }

      // Gamification
      try {
        await fetch("/api/gamification/update-on-entry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            journalDate: new Date().toISOString().split('T')[0],
          }),
        });
      } catch (gamifError: any) {
        console.error("Error calling gamification API:", gamifError);
      }

      toast.success('Journal saved successfully!');
      sessionStorage.setItem('journalSaveSuccess', 'true');
      router.push('/protected');

    } catch (err: any) {
      console.error("Error saving journal:", err);
      const errorMessage = err.message || "Terjadi kesalahan saat menyimpan jurnal.";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsSaving(false);
    }
  };

  const isLoading = isFetchingWeather || isAnalyzingEmotion || isSaving || isFetchingSuggestion;

  // Get selected emotion name
  const getSelectedEmotionName = () => {
    if (emotionSource === 'ai' && emotionData) {
      return emotionData.top_prediction.label;
    }
    if (emotionSource === 'manual' && selectedEmotionId) {
      const emotion = emotions.find(e => e.id === selectedEmotionId);
      return emotion?.name || '';
    }
    return null;
  };

  return (
    <div className="bg-[#f8fafc] dark:bg-[#101a22] min-h-screen flex flex-col transition-colors duration-300" style={{ fontFamily: 'Lexend, sans-serif' }}>
      {/* Main Content */}
      <main className="flex-grow flex justify-center py-8 px-4 sm:px-6">
        <div className="w-full max-w-4xl flex flex-col gap-8">
          {/* Back Button & Greeting & Date */}
          <div className="flex flex-col gap-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-[#2b9dee] transition-colors w-fit"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl sm:text-4xl font-light text-slate-800 dark:text-slate-100 tracking-tight mb-2">
                  {getGreeting()}, {displayName}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-light flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {getCurrentDate()}
                </p>
              </div>

              {/* Location Display */}
              {(userLocation?.name || weatherData?.location.name) && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-sm font-medium">
                  <MapPin className="h-4 w-4" />
                  {userLocation?.name || weatherData?.location.name}
                </div>
              )}
            </div>
          </div>

          {/* Selected Emotion Display (Top) */}
          {getSelectedEmotionName() && (
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] p-6 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#2b9dee]/10 dark:bg-[#2b9dee]/20 rounded-xl flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#2b9dee]">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                      <line x1="9" y1="9" x2="9.01" y2="9"/>
                      <line x1="15" y1="9" x2="15.01" y2="9"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {emotionSource === 'ai' ? 'AI Detected Emotion' : 'Manually Selected Emotion'}
                    </div>
                    <div className="text-xl font-semibold text-[#2b9dee]">
                      {getSelectedEmotionName()}
                    </div>
                    {emotionSource === 'ai' && emotionData && (
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {emotionData.top_prediction.confidence.toFixed(1)}% confidence
                      </div>
                    )}
                  </div>
                </div>

                {/* Show Detail Toggle (only for AI) */}
                {emotionSource === 'ai' && emotionData && (
                  <button
                    onClick={() => setShowDetailAnalysis(!showDetailAnalysis)}
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-[#2b9dee] transition-colors px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span className="text-sm font-medium">Details</span>
                    {showDetailAnalysis ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                )}
              </div>

              {/* Collapsible Detail Analysis */}
              {showDetailAnalysis && emotionSource === 'ai' && emotionData && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">All Emotions Detected</div>
                  {Object.entries(emotionData.all_predictions)
                    .sort(([, a], [, b]) => b - a)
                    .map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">{key}</span>
                          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{value.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#2b9dee] rounded-full transition-all duration-500"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Writing Block Inspiration */}
          {llmSuggestion && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 relative">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-800 rounded-xl flex items-center justify-center">
                    <Lightbulb className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h4 className="font-medium text-emerald-800 dark:text-emerald-200">Inspiration for You</h4>
                </div>
                <button
                  onClick={() => setLlmSuggestion(null)}
                  className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              <div
                className="text-emerald-800 dark:text-emerald-200 whitespace-pre-line leading-relaxed"
                dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(llmSuggestion || "") }}
              />
            </div>
          )}

          {llmError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
              <div className="text-red-600 dark:text-red-400 text-sm flex-1">{llmError}</div>
              <button onClick={() => setLlmError(null)} className="text-red-600 dark:text-red-400">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Writing Canvas */}
          <div className="relative group bg-white dark:bg-[#1e293b] rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] p-6 sm:p-10 transition-shadow duration-300 hover:shadow-lg border border-slate-100 dark:border-slate-800">
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <label className="sr-only" htmlFor="journal-title">Entry Title</label>
              <input
                className="w-full bg-transparent border-none p-0 text-2xl font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-0 focus:outline-none"
                id="journal-title"
                placeholder="Title your day..."
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
              />
              
              <label className="sr-only" htmlFor="journal-entry">Journal Entry</label>
              <textarea
                className="w-full h-64 sm:h-96 resize-none bg-transparent border-none p-0 text-lg leading-relaxed font-light text-slate-700 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-0 focus:outline-none"
                id="journal-entry"
                placeholder="How does the world feel today? Start writing..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Action Bar - 4 Buttons */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {/* 1. Get Inspiration Button */}
                <button
                  onClick={handleGetInspiration}
                  disabled={isLoading || !content.trim()}
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-[#2b9dee] dark:hover:text-[#2b9dee] px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-700"
                >
                  {isFetchingSuggestion ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lightbulb className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">Get Inspiration</span>
                </button>

                {/* 2. Choose Emotion (Manual) - Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setShowManualDropdown(!showManualDropdown)}
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-[#2b9dee] dark:hover:text-[#2b9dee] px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/>
                    </svg>
                    <span className="text-sm font-medium">Choose Emotion</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {showManualDropdown && (
                    <div className="absolute bottom-full mb-2 left-0 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                      <div className="p-2">
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 px-3 py-2">Select your emotion</div>
                        {emotions.map((emotion) => (
                          <button
                            key={emotion.id}
                            onClick={() => handleManualEmotionSelect(emotion.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              selectedEmotionId === emotion.id && emotionSource === 'manual'
                                ? 'bg-[#2b9dee] text-white'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            {emotion.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Analyze Emotion (AI) Button */}
                <button
                  onClick={handleAnalyzeEmotion}
                  disabled={isLoading || !content.trim()}
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-[#2b9dee] dark:hover:text-[#2b9dee] px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-700"
                >
                  {isAnalyzingEmotion ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                    </svg>
                  )}
                  <span className="text-sm font-medium">Analyze Emotion</span>
                </button>
              </div>

              {/* 4. Save Journal Button */}
              <button
                onClick={handleSaveJournal}
                disabled={isSaving || (emotionSource === 'ai' && !emotionData) || (emotionSource === 'manual' && !selectedEmotionId) || !title.trim() || !content.trim()}
                className="flex items-center gap-2 bg-[#2b9dee] hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium shadow-md shadow-[#2b9dee]/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                      <polyline points="17 21 17 13 7 13 7 21"/>
                      <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    <span>Save Journal</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Environmental Context */}
          {weatherData && (
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 px-1">Environmental Context</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Weather */}
                <div className="bg-white dark:bg-[#1e293b] rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:border-[#2b9dee]/30 transition-colors">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Weather</div>
                    <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{weatherData.current.temp_c}°C</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">{weatherData.current.condition.text}</div>
                  </div>
                </div>

                {/* AQI */}
                {weatherData.current.air_quality && (
                  <div className="bg-white dark:bg-[#1e293b] rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:border-[#2b9dee]/30 transition-colors">
                    <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                        <path d="M8 2v4"/>
                        <path d="M16 2v4"/>
                        <rect width="18" height="18" x="3" y="4" rx="2"/>
                        <path d="M3 10h18"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">AQI (US EPA)</div>
                      <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{weatherData.current.air_quality['us-epa-index']}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">Air Quality</div>
                    </div>
                  </div>
                )}

                {/* PM2.5 */}
                {weatherData.current.air_quality?.pm2_5 && (
                  <div className="bg-white dark:bg-[#1e293b] rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:border-[#2b9dee]/30 transition-colors">
                    <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">PM2.5</div>
                      <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{weatherData.current.air_quality.pm2_5.toFixed(1)}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">µg/m³</div>
                    </div>
                  </div>
                )}

                {/* Humidity */}
                <div className="bg-white dark:bg-[#1e293b] rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center hover:border-[#2b9dee]/30 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500">
                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                      </svg>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Humidity</div>
                  </div>
                  <div className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{weatherData.current.humidity}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Quote */}
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 text-center pb-12">
            <p className="text-slate-400 text-sm italic">&quot;The clarity of the air reflects the clarity of the mind.&quot;</p>
          </div>
        </div>
      </main>
    </div>
  );
}