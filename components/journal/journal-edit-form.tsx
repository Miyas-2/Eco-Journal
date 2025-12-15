"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, 
  AlertCircle, 
  Save, 
  Sparkles, 
  Brain,
  Heart,
  Calendar,
  Clock,
  ArrowLeft,
  XCircle,
  Target
} from "lucide-react";
import { WeatherApiResponse, EmotionApiResponse } from "@/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import toast from "react-hot-toast";

interface JournalEditFormProps {
  userId: string;
  existingJournal: any;
}

interface Emotion {
  id: number;
  name: string;
  sentiment_score: number | null;
}

// Emotion colors and emojis
const emotionColors = {
  joy: "bg-yellow-100 text-yellow-800 border-yellow-200",
  trust: "bg-green-100 text-green-800 border-green-200",
  fear: "bg-purple-100 text-purple-800 border-purple-200",
  surprise: "bg-indigo-100 text-indigo-800 border-indigo-200",
  sadness: "bg-slate-100 text-slate-800 border-slate-200",
  disgust: "bg-emerald-100 text-emerald-800 border-emerald-200",
  anger: "bg-red-100 text-red-800 border-red-200",
  anticipation: "bg-cyan-100 text-cyan-800 border-cyan-200",
  neutral: "bg-slate-100 text-slate-800 border-slate-200",
};

const emotionEmojis = {
  joy: "😄",
  trust: "🤗",
  fear: "😨",
  surprise: "😲",
  sadness: "😢",
  disgust: "🤢",
  anger: "😠",
  anticipation: "🤔",
  neutral: "😐",
};

export default function JournalEditForm({
  userId,
  existingJournal,
}: JournalEditFormProps) {
  const [title, setTitle] = useState(existingJournal.title || "");
  const [content, setContent] = useState(existingJournal.content || "");
  const [isAnalyzingEmotion, setIsAnalyzingEmotion] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // UI state
  const [showEmotionSidebar, setShowEmotionSidebar] = useState(false);

  // State untuk emosi
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [emotionData, setEmotionData] = useState<EmotionApiResponse | null>(
    existingJournal.emotion_analysis || null
  );
  const [emotionSource, setEmotionSource] = useState<"ai" | "manual">(
    existingJournal.emotion_source || "ai"
  );
  const [selectedEmotionId, setSelectedEmotionId] = useState<number | null>(
    existingJournal.emotion_id || null
  );
  const [emotionsMap, setEmotionsMap] = useState<Map<string, number | null>>(
    new Map()
  );

  const router = useRouter();
  const supabase = createClient();

  // Load emotions dari database
  useEffect(() => {
    const fetchEmotions = async () => {
      const { data, error: fetchError } = await supabase
        .from("emotions")
        .select("id, name, sentiment_score");

      if (fetchError) {
        console.error("Error fetching emotions:", fetchError);
        setError("Gagal memuat daftar emosi.");
      } else if (data) {
        setEmotions(data as Emotion[]);
        const newMap = new Map<string, number | null>();
        data.forEach((emotion) => {
          if (emotion.name) {
            const normalizedName =
              emotion.name.charAt(0).toUpperCase() +
              emotion.name.slice(1).toLowerCase();
            newMap.set(
              normalizedName,
              typeof emotion.sentiment_score === "number"
                ? emotion.sentiment_score
                : null
            );
          }
        });
        setEmotionsMap(newMap);
      }
    };
    fetchEmotions();
  }, []);

  // Get emotion color and emoji
  const getEmotionColor = (emotion: string) => {
    return emotionColors[emotion?.toLowerCase() as keyof typeof emotionColors] || emotionColors.neutral;
  };

  const getEmotionEmoji = (emotion: string) => {
    return emotionEmojis[emotion?.toLowerCase() as keyof typeof emotionEmojis] || "😐";
  };

  // Function untuk analisis emosi ulang
  const handleAnalyzeEmotion = async () => {
    if (!content.trim()) {
      setError("Konten jurnal tidak boleh kosong untuk dianalisis.");
      return;
    }

    setIsAnalyzingEmotion(true);
    setError(null);
    setEmotionData(null);

    try {
      const emotionResponse = await fetch("/api/emotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
      });

      if (!emotionResponse.ok) {
        const errData = await emotionResponse.json();
        throw new Error(
          errData.error ||
            `Gagal menganalisis emosi: ${emotionResponse.statusText}`
        );
      }

      const fetchedEmotionData: EmotionApiResponse =
        await emotionResponse.json();
      setEmotionData(fetchedEmotionData);
      setShowEmotionSidebar(true);
      toast.success("Analisis emosi berhasil diperbarui!");
    } catch (err: any) {
      console.error("Error during emotion analysis:", err);
      setError(err.message || "Terjadi kesalahan saat analisis emosi.");
    } finally {
      setIsAnalyzingEmotion(false);
    }
  };

  // Function untuk update journal
  const handleUpdateJournal = async () => {
    setError(null);

    if (!title.trim()) {
      setError("Judul jurnal tidak boleh kosong.");
      return;
    }
    if (!content.trim()) {
      setError("Konten jurnal tidak boleh kosong.");
      return;
    }

    if (emotionSource === "ai" && !emotionData && !existingJournal.emotion_analysis) {
      setError("Harap lakukan analisis emosi AI terlebih dahulu.");
      return;
    }

    if (emotionSource === "manual" && !selectedEmotionId) {
      setError("Harap pilih emosi manual terlebih dahulu.");
      return;
    }

    setIsSaving(true);

    try {
      // Hitung mood score berdasarkan emosi yang dipilih
      let calculatedMoodScore: number | null = null;
      let finalEmotionId: number | null = null;

      if (emotionSource === "ai" && (emotionData || existingJournal.emotion_analysis)) {
        const currentEmotionData = emotionData || existingJournal.emotion_analysis;
        
        // Get emotion ID from top prediction
        const topEmotionLabel = currentEmotionData.top_prediction?.label;
        if (topEmotionLabel) {
          const normalizedEmotionName =
            topEmotionLabel.charAt(0).toUpperCase() +
            topEmotionLabel.slice(1).toLowerCase();
          const emotionFromDb = emotions.find(
            (e) => e.name.toLowerCase() === normalizedEmotionName.toLowerCase()
          );
          if (emotionFromDb) {
            finalEmotionId = emotionFromDb.id;
          }
        }

        // Hitung mood score dari all_predictions
        let sumOfProducts = 0;
        let foundAnyValenceForAI = false;
        if (currentEmotionData.all_predictions) {
          for (const [emotionName, confidenceFromAI] of Object.entries(
            currentEmotionData.all_predictions
          )) {
            const normalizedEmotionName =
              emotionName.charAt(0).toUpperCase() +
              emotionName.slice(1).toLowerCase();
            const valence = emotionsMap.get(normalizedEmotionName);

            if (
              typeof valence === "number" &&
              typeof confidenceFromAI === "number"
            ) {
              sumOfProducts += valence * confidenceFromAI;
              foundAnyValenceForAI = true;
            }
          }
        }

        if (foundAnyValenceForAI) {
          calculatedMoodScore = sumOfProducts / 100;
        }
      } else if (emotionSource === "manual" && selectedEmotionId) {
        finalEmotionId = selectedEmotionId;
        const selectedEmotionObject = emotions.find(
          (e) => e.id === selectedEmotionId
        );
        if (
          selectedEmotionObject &&
          typeof selectedEmotionObject.sentiment_score === "number"
        ) {
          calculatedMoodScore = selectedEmotionObject.sentiment_score;
        }
      }

      // Update data di database
      const updateData = {
        title,
        content,
        emotion_analysis: emotionSource === "ai" 
          ? (emotionData || existingJournal.emotion_analysis)
          : existingJournal.emotion_analysis,
        emotion_id: finalEmotionId,
        emotion_source: emotionSource,
        mood_score: calculatedMoodScore,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("journal_entries")
        .update(updateData)
        .eq("id", existingJournal.id)
        .eq("user_id", userId);

      if (updateError) {
        throw new Error(`Gagal memperbarui jurnal: ${updateError.message}`);
      }

      setSuccess(true);
      toast.success("Jurnal berhasil diperbarui!");
      
      // Redirect after short delay
      setTimeout(() => {
        router.push(`/protected/journal/${existingJournal.id}`);
      }, 1000);

    } catch (err: any) {
      console.error("Error updating journal:", err);
      const errorMessage =
        err.message || "Terjadi kesalahan saat memperbarui jurnal.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleUpdateJournal();
    }
  };

  const wordCount = content.trim().split(/\s+/).filter((word: string | any[]) => word.length > 0).length;
  const charCount = content.length;
  const isLoading = isAnalyzingEmotion || isSaving;
  const hasChanges = title !== (existingJournal.title || "") || 
                     content !== (existingJournal.content || "") ||
                     emotionSource !== existingJournal.emotion_source ||
                     selectedEmotionId !== existingJournal.emotion_id ||
                     (emotionSource === "ai" && emotionData !== null);

  // Get current emotion for display
  let currentEmotion = null;
  if (emotionSource === "ai" && (emotionData || existingJournal.emotion_analysis)) {
    const currentEmotionData = emotionData || existingJournal.emotion_analysis;
    currentEmotion = currentEmotionData.top_prediction?.label;
  } else if (emotionSource === "manual" && selectedEmotionId) {
    const selectedEmotion = emotions.find(e => e.id === selectedEmotionId);
    currentEmotion = selectedEmotion?.name;
  }

  return (
    <div className="min-h-screen bg-slate-50" onKeyDown={handleKeyDown}>
      <div className="max-w-6xl mx-auto">
        {/* Minimal Header with Emotion Toggle */}
        <div className="mx-8 mt-6 px-6 py-4 border border-slate-200 bg-white rounded-3xl shadow-sm relative">
          <div className="flex items-center justify-between">
            {/* Left side with back button and metadata */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-slate-800 rounded-xl">
                <Link href={`/protected/journal/${existingJournal.id}`} className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
              
              <div className="hidden sm:flex items-center gap-3 text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-xl">
                <Heart className="h-4 w-4" />
                <span>Edit Jurnal</span>
              </div>
            </div>

            {/* Right side with emotion toggle and save */}
            <div className="flex items-center gap-3">
              {/* Emotion Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmotionSidebar(!showEmotionSidebar)}
                className="text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl"
              >
                <Brain className="h-4 w-4 mr-2" />
                Analisis Emosi
                {(emotionData || existingJournal.emotion_analysis) && (
                  <div className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </Button>

              {/* Success indicator */}
              {success && (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl">
                  <Save className="h-4 w-4" />
                  <span className="text-sm font-medium">Tersimpan</span>
                </div>
              )}

              {/* Save button */}
              <Button
                onClick={handleUpdateJournal}
                disabled={isLoading || !hasChanges}
                className={`
                  rounded-xl px-4 py-2 flex items-center gap-2 transition-all duration-200
                  ${hasChanges && !isLoading
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }
                `}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span className="text-sm">Simpan</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Main Writing Area - Takes up most space */}
          <div className={`transition-all duration-300 ${showEmotionSidebar ? 'w-2/3' : 'w-full'}`}>
            <div className="p-8 lg:p-12">
              
              {/* Error Message */}
              {error && (
                <div className="mb-6">
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Journal Metadata */}
              <div className="mb-8 text-center">
                <div className="flex items-center justify-center gap-6 text-sm text-slate-500 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Dibuat: {format(new Date(existingJournal.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                    </span>
                  </div>
                  {existingJournal.updated_at && existingJournal.updated_at !== existingJournal.created_at && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        Diperbarui: {format(new Date(existingJournal.updated_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

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
                    placeholder="Masukkan judul jurnal Anda..."
                    className="text-xl rounded-3xl border-slate-200 focus:border-blue-300 focus:ring-blue-100 h-16 bg-white"
                    maxLength={100}
                    disabled={isLoading}
                  />
                  <div className="text-xs text-slate-500 text-right">
                    {title.length}/100 karakter
                  </div>
                </div>

                {/* Main Writing Area */}
                <div className="space-y-4">
                  <Label htmlFor="journal-content" className="text-2xl font-light text-slate-800">
                    Isi Jurnal
                  </Label>
                  
                  <Textarea
                    id="journal-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Tulis jurnal Anda di sini... Ceritakan apa yang Anda rasakan hari ini."
                    rows={24}
                    className="text-lg rounded-3xl border-slate-200 focus:border-blue-300 focus:ring-blue-100 resize-none leading-relaxed bg-white shadow-sm"
                    maxLength={5000}
                    disabled={isLoading}
                  />
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-4">
                      <span>{wordCount} kata</span>
                      <span>{charCount} karakter</span>
                      <span>{Math.ceil(wordCount / 200)} menit baca</span>
                    </div>
                    <span>{content.length}/5000 karakter</span>
                  </div>
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
                    {emotionData ? 'Analisis Ulang Emosi' : 'Analisis Emosi'}
                  </Button>
                  <Button
                    onClick={handleUpdateJournal}
                    disabled={isLoading || !hasChanges}
                    className={`
                      flex-1 h-14 rounded-3xl transition-all duration-200
                      ${hasChanges && !isLoading
                        ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }
                    `}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-5 w-5" />
                    )}
                    Simpan Perubahan
                  </Button>
                </div>

                {/* Keyboard Shortcut Hint */}
                <div className="text-center">
                  <p className="text-xs text-slate-400 bg-slate-50 px-4 py-2 rounded-xl inline-block">
                    💡 Tips: Tekan <kbd className="px-2 py-1 bg-white rounded border border-slate-200 text-slate-600 font-mono text-xs">Ctrl + S</kbd> untuk menyimpan dengan cepat
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Emotion Analysis Sidebar - Slides in when needed */}
          <div className={`transition-all duration-300 ${
            showEmotionSidebar ? 'w-1/3 opacity-100' : 'w-0 opacity-0 overflow-hidden'
          }`}>
            {/* Rounded container like weather section */}
            <div className="mx-6 mt-6 bg-white border border-slate-200 rounded-3xl shadow-sm h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center">
                      <Brain className="h-5 w-5 text-purple-500" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-800">Pengaturan Emosi</h3>
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

                {/* Current Emotion Display */}
                {currentEmotion && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getEmotionEmoji(currentEmotion)}</span>
                      <div>
                        <Badge className={`${getEmotionColor(currentEmotion)} rounded-xl px-3 py-1 mb-2`}>
                          {currentEmotion}
                        </Badge>
                        <p className="text-sm text-slate-600">
                          Emosi saat ini ({emotionSource === 'ai' ? 'AI' : 'Manual'})
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
                      onChange={e => setSelectedEmotionId(Number(e.target.value) || null)}
                      className="w-full h-12 px-4 rounded-2xl border border-slate-200 focus:border-blue-300 focus:ring-blue-100 text-slate-700 bg-white"
                      disabled={isLoading}
                    >
                      <option value="">-- Pilih emosi --</option>
                      {emotions.map(emotion => (
                        <option key={emotion.id} value={emotion.id}>
                          {getEmotionEmoji(emotion.name)} {emotion.name}
                        </option>
                      ))}
                    </select>

                    {selectedEmotionId && (
                      <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-100">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {getEmotionEmoji(emotions.find(e => e.id === selectedEmotionId)?.name || '')}
                          </span>
                          <div>
                            <p className="font-medium text-slate-800">
                              {emotions.find(e => e.id === selectedEmotionId)?.name}
                            </p>
                            <p className="text-sm text-slate-600">Emosi yang Anda pilih</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Emotion Analysis Results */}
                {(emotionData || existingJournal.emotion_analysis) && !isAnalyzingEmotion && emotionSource === 'ai' && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                          <Target className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-800">Emosi Dominan</span>
                      </div>
                      {(() => {
                        const currentEmotionData = emotionData || existingJournal.emotion_analysis;
                        return (
                          <>
                            <p className="text-lg font-medium text-blue-600 mb-1">
                              {currentEmotionData.top_prediction.label}
                            </p>
                            <p className="text-xs text-slate-500">
                              {currentEmotionData.top_prediction.confidence.toFixed(1)}% confidence
                            </p>
                          </>
                        );
                      })()}
                    </div>
                    
                    <div className="bg-slate-50 rounded-2xl p-4">
                      <h4 className="text-sm font-medium text-slate-700 mb-4">Detail Analisis</h4>
                      <div className="space-y-3">
                        {(() => {
                          const currentEmotionData = emotionData || existingJournal.emotion_analysis;
                          return Object.entries(currentEmotionData.all_predictions)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .slice(0, 5)
                            .map(([key, value]) => (
                              <div key={key} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-slate-700 capitalize">{key}</span>
                                  <span className="text-xs text-slate-500 font-medium">{(value as number).toFixed(0)}%</span>
                                </div>
                                <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-400 rounded-full transition-all duration-500"
                                    style={{ width: `${value}%` }}
                                  />
                                </div>
                              </div>
                            ));
                        })()}
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
                {!emotionData && !existingJournal.emotion_analysis && !isAnalyzingEmotion && (
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs">💡</span>
                      </div>
                      <span className="text-sm font-medium text-blue-800">Tips</span>
                    </div>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      Perbarui jurnalmu, lalu gunakan analisis AI untuk memahami emosimu atau pilih emosi secara manual.
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