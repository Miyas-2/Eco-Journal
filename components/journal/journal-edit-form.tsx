"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Save, Sparkles, Heart, Brain, CheckCircle2, Info } from "lucide-react";
import { WeatherApiResponse, EmotionApiResponse } from "@/types";
import toast from "react-hot-toast";

interface JournalEditFormProps {
  userId: string;
  existingJournal: any; // Data journal yang akan di-edit
}

interface Emotion {
  id: number;
  name: string;
  sentiment_score: number | null;
}

export default function JournalEditForm({
  userId,
  existingJournal,
}: JournalEditFormProps) {
  const [title, setTitle] = useState(existingJournal.title || "");
  const [content, setContent] = useState(existingJournal.content || "");
  const [isAnalyzingEmotion, setIsAnalyzingEmotion] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

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

  // Function untuk analisis emosi ulang (opsional)
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
      setInfoMessage("Analisis emosi selesai.");
    } catch (err: any) {
      console.error("Error during emotion analysis:", err);
      setError(err.message || "Terjadi kesalahan saat analisis emosi.");
      setInfoMessage(null);
    } finally {
      setIsAnalyzingEmotion(false);
    }
  };

  // Function untuk update journal
  const handleUpdateJournal = async () => {
    setError(null);
    setInfoMessage(null);

    if (!title.trim()) {
      setError("Judul jurnal tidak boleh kosong.");
      return;
    }
    if (!content.trim()) {
      setError("Konten jurnal tidak boleh kosong.");
      return;
    }

    setIsSaving(true);
    setInfoMessage("Memperbarui jurnal...");

    try {
      // Hitung mood score berdasarkan emosi yang dipilih
      let calculatedMoodScore: number | null = null;
      let finalEmotionId: number | null = null;

      if (emotionSource === "ai" && emotionData) {
        // Logic untuk AI emotion (sama seperti di journal-form.tsx)
        const topEmotionLabel = emotionData.top_prediction?.label;
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
        if (emotionData.all_predictions) {
          for (const [emotionName, confidenceFromAI] of Object.entries(
            emotionData.all_predictions
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
        emotion_analysis:
          emotionSource === "ai"
            ? emotionData
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

      toast.success("Jurnal berhasil diperbarui!", {
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
      
      router.push(`/protected/journal/${existingJournal.id}`);
    } catch (err: any) {
      console.error("Error updating journal:", err);
      const errorMessage =
        err.message || "Terjadi kesalahan saat memperbarui jurnal.";
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
    } finally {
      setIsSaving(false);
      setInfoMessage(null);
    }
  };

  const isLoading = isAnalyzingEmotion || isSaving;

  return (
    <div className="space-organic-y-lg font-organik">
      {/* Header Section - Modern Organik */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200/40 float-organic">
          <Save className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-organic-title mb-2">Edit Jurnal Saya</h2>
        <p className="text-organic-body">Perbarui refleksi dan pemikiran dalam jurnal Anda</p>
      </div>

      {/* Input Judul - Modern Organik */}
      <div className="card-organic rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
            <span className="text-blue-600 text-sm font-semibold">📝</span>
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

      {/* Input Konten - Modern Organik */}
      <div className="card-organic rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
            <span className="text-emerald-600 text-sm font-semibold">✨</span>
          </div>
          <Label htmlFor="journal-content" className="text-lg font-semibold text-organic-title">
            Cerita & Refleksi Anda
          </Label>
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
                checked={emotionSource === "ai"}
                onChange={() => setEmotionSource("ai")}
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
                checked={emotionSource === "manual"}
                onChange={() => setEmotionSource("manual")}
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
        {emotionSource === "manual" && (
          <div className="sub-card-organic rounded-2xl p-6">
            <Label className="text-base font-medium text-organic-title mb-3 block">
              Pilih Emosi yang Anda Rasakan
            </Label>
            <select
              value={selectedEmotionId ?? ""}
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
        {emotionSource === "ai" && (
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
                <span>Analisis Ulang Emosi</span>
              </div>
            )}
          </Button>
        )}

        <Button
          onClick={handleUpdateJournal}
          disabled={
            isLoading ||
            !content.trim() ||
            !title.trim() ||
            (emotionSource === "ai" &&
              !emotionData &&
              !existingJournal.emotion_analysis) ||
            (emotionSource === "manual" && !selectedEmotionId)
          }
          className="w-full sm:flex-1 btn-organic-primary h-12"
        >
          {isSaving ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Memperbarui...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Save className="h-5 w-5" />
              <span>Perbarui Jurnal</span>
            </div>
          )}
        </Button>
      </div>

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
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="font-medium text-organic-title">Emosi Dominan</span>
              </div>
              <p className="text-xl font-bold text-purple-700 mb-1">
                {emotionData.top_prediction.label}
              </p>
              <p className="text-sm text-organic-secondary">
                Tingkat kepercayaan: {emotionData.top_prediction.confidence.toFixed(2)}%
              </p>
            </div>

            <div className="card-organic rounded-2xl p-4 bg-white/80">
              <h4 className="font-medium text-organic-title mb-3 flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                Detail Analisis Emosi
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(emotionData.all_predictions)
                  .sort(([, a], [, b]) => b - a)
                  .map(([key, value]) => (
                    <div key={key} className="bg-gradient-to-r from-stone-50 to-white rounded-xl p-3 border border-stone-200/50">
                      <div className="font-medium text-sm text-organic-title capitalize">{key}</div>
                      <div className="text-xs text-organic-secondary">{value.toFixed(1)}%</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}