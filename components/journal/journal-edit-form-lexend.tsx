'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { EmotionApiResponse } from '@/types';
import toast from 'react-hot-toast';

interface JournalEditFormLexendProps {
  userId: string;
  existingJournal: any;
}

type EmotionSource = 'ai' | 'manual';
type Emotion = { id: number; name: string; sentiment_score: number | null };

export default function JournalEditFormLexend({ userId, existingJournal }: JournalEditFormLexendProps) {
  const [title, setTitle] = useState(existingJournal.title || '');
  const [content, setContent] = useState(existingJournal.content || '');
  const [isAnalyzingEmotion, setIsAnalyzingEmotion] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [emotionData, setEmotionData] = useState<EmotionApiResponse | null>(existingJournal.emotion_analysis || null);

  const [emotionSource, setEmotionSource] = useState<EmotionSource>(existingJournal.emotion_source || 'ai');
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [selectedEmotionId, setSelectedEmotionId] = useState<number | null>(existingJournal.emotion_id || null);
  const [emotionsMap, setEmotionsMap] = useState<Map<string, number | null>>(new Map());
  
  // Toggle states
  const [showManualDropdown, setShowManualDropdown] = useState(false);
  const [showDetailAnalysis, setShowDetailAnalysis] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // Get current date
  const getCurrentDate = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const date = new Date(existingJournal.created_at);
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
    
    return `${dayName}, ${monthName} ${day}${suffix}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
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

  const handleManualEmotionSelect = (emotionId: number) => {
    setSelectedEmotionId(emotionId);
    setEmotionSource('manual');
    setEmotionData(null);
    setShowManualDropdown(false);
    toast.success('Emotion selected!');
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
      return null;
    }
    return data?.id || null;
  };

  const handleUpdateJournal = async () => {
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
    if (emotionSource === 'ai' && !emotionData && !existingJournal.emotion_analysis) {
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
      let finalEmotionId: number | null = null;
      let calculatedMoodScore: number | null = null;

      if (emotionSource === 'ai') {
        const currentEmotionData = emotionData || existingJournal.emotion_analysis;
        
        const topEmotionLabel = currentEmotionData?.top_prediction?.label;
        if (topEmotionLabel) {
          finalEmotionId = await getEmotionIdFromDb(topEmotionLabel);
        }

        let sumOfProducts = 0;
        let foundAnyValenceForAI = false;
        if (currentEmotionData?.all_predictions) {
          for (const [emotionName, confidenceFromAI] of Object.entries(currentEmotionData.all_predictions)) {
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
        }

      } else if (emotionSource === 'manual' && selectedEmotionId) {
        finalEmotionId = selectedEmotionId;
        const selectedEmotionObject = emotions.find(e => e.id === selectedEmotionId);
        if (selectedEmotionObject && typeof selectedEmotionObject.sentiment_score === 'number') {
          calculatedMoodScore = selectedEmotionObject.sentiment_score;
        }
      }

      const updateData = {
        title,
        content,
        emotion_analysis: emotionSource === 'ai' ? (emotionData || existingJournal.emotion_analysis) : existingJournal.emotion_analysis,
        emotion_id: finalEmotionId,
        emotion_source: emotionSource,
        mood_score: calculatedMoodScore,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('journal_entries')
        .update(updateData)
        .eq('id', existingJournal.id)
        .eq('user_id', userId);

      if (updateError) {
        throw new Error(`Gagal memperbarui jurnal: ${updateError.message}`);
      }

      toast.success('Journal updated successfully!');
      setTimeout(() => {
        router.push(`/protected/journal/${existingJournal.id}`);
      }, 1000);

    } catch (err: any) {
      console.error("Error updating journal:", err);
      const errorMessage = err.message || "Terjadi kesalahan saat memperbarui jurnal.";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsSaving(false);
    }
  };

  const isLoading = isAnalyzingEmotion || isSaving;

  const getSelectedEmotionName = () => {
    if (emotionSource === 'ai' && (emotionData || existingJournal.emotion_analysis)) {
      const currentEmotionData = emotionData || existingJournal.emotion_analysis;
      return currentEmotionData.top_prediction?.label;
    }
    if (emotionSource === 'manual' && selectedEmotionId) {
      const emotion = emotions.find(e => e.id === selectedEmotionId);
      return emotion?.name || '';
    }
    return null;
  };

  const hasChanges = 
    title !== (existingJournal.title || "") || 
    content !== (existingJournal.content || "") ||
    emotionSource !== existingJournal.emotion_source ||
    selectedEmotionId !== existingJournal.emotion_id ||
    (emotionSource === "ai" && emotionData !== null);

  // Get weather data from existing journal
  const weatherData = existingJournal.weather_data;
  const locationName = existingJournal.location_name || weatherData?.location?.name;

  return (
    <div className="bg-[#f8fafc] dark:bg-[#101a22] min-h-screen flex flex-col transition-colors duration-300" style={{ fontFamily: 'Lexend, sans-serif' }}>
      <main className="flex-grow flex justify-center py-8 px-4 sm:px-6">
        <div className="w-full max-w-4xl flex flex-col gap-8">
          {/* Back Button & Header */}
          <div className="flex flex-col gap-4">
            <button
              onClick={() => router.push(`/protected/journal/${existingJournal.id}`)}
              className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-[#2b9dee] transition-colors w-fit"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl sm:text-4xl font-light text-slate-800 dark:text-slate-100 tracking-tight mb-2">
                  Edit Your Journal
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
              {locationName && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-sm font-medium">
                  <MapPin className="h-4 w-4" />
                  {locationName}
                </div>
              )}
            </div>
          </div>

          {/* Selected Emotion Display */}
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
                    {emotionSource === 'ai' && (emotionData || existingJournal.emotion_analysis) && (
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {(emotionData || existingJournal.emotion_analysis).top_prediction.confidence.toFixed(1)}% confidence
                      </div>
                    )}
                  </div>
                </div>

                {emotionSource === 'ai' && (emotionData || existingJournal.emotion_analysis) && (
                  <button
                    onClick={() => setShowDetailAnalysis(!showDetailAnalysis)}
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-[#2b9dee] transition-colors px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span className="text-sm font-medium">Details</span>
                    {showDetailAnalysis ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                )}
              </div>

              {showDetailAnalysis && emotionSource === 'ai' && (emotionData || existingJournal.emotion_analysis) && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">All Emotions Detected</div>
                  {Object.entries((emotionData || existingJournal.emotion_analysis).all_predictions)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">{key}</span>
                          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{(value as number).toFixed(1)}%</span>
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

            {/* Action Bar */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Choose Emotion (Manual) - Dropdown */}
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

                {/* Analyze Emotion (AI) Button */}
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

              {/* Update Journal Button */}
              <button
                onClick={handleUpdateJournal}
                disabled={isSaving || !hasChanges || !title.trim() || !content.trim()}
                className="flex items-center gap-2 bg-[#2b9dee] hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium shadow-md shadow-[#2b9dee]/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                      <polyline points="17 21 17 13 7 13 7 21"/>
                      <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    <span>Update Journal</span>
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
            <p className="text-slate-400 text-sm italic">&quot;Every edit brings clarity to your thoughts.&quot;</p>
          </div>
        </div>
      </main>
    </div>
  );
}