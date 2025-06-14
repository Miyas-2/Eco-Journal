"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Save, Sparkles } from "lucide-react";
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

      toast.success("Jurnal berhasil diperbarui!");
      router.push(`/protected/journal/${existingJournal.id}`);
    } catch (err: any) {
      console.error("Error updating journal:", err);
      const errorMessage =
        err.message || "Terjadi kesalahan saat memperbarui jurnal.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
      setInfoMessage(null);
    }
  };

  const isLoading = isAnalyzingEmotion || isSaving;

  return (
    <div className="space-y-6">
      {/* Input Judul */}
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

      {/* Input Konten */}
      <div>
        <Label htmlFor="journal-content" className="text-base font-medium">
          Apa yang kamu rasakan atau pikirkan?
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

      {/* Sumber Emosi */}
      <div className="mb-4">
        <Label className="block mb-1">Sumber Emosi</Label>
        <div className="flex gap-4">
          <label>
            <input
              type="radio"
              name="emotion_source"
              value="ai"
              checked={emotionSource === "ai"}
              onChange={() => setEmotionSource("ai")}
              disabled={isLoading}
            />
            AI (otomatis)
          </label>
          <label>
            <input
              type="radio"
              name="emotion_source"
              value="manual"
              checked={emotionSource === "manual"}
              onChange={() => setEmotionSource("manual")}
              disabled={isLoading}
            />
            Pilih Sendiri
          </label>
        </div>
      </div>

      {/* Manual Emotion Selection */}
      {emotionSource === "manual" && (
        <div className="mb-4">
          <Label htmlFor="emotion-select">Pilih Emosi</Label>
          <select
            id="emotion-select"
            value={selectedEmotionId ?? ""}
            onChange={(e) => setSelectedEmotionId(Number(e.target.value))}
            className="block mt-1 w-full p-2 border rounded"
            disabled={isLoading}
          >
            <option value="">-- Pilih emosi --</option>
            {emotions.map((emotion) => (
              <option key={emotion.id} value={emotion.id}>
                {emotion.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {emotionSource === "ai" && (
          <Button
            onClick={handleAnalyzeEmotion}
            disabled={isLoading || !content.trim()}
            className="w-full sm:flex-1"
            variant="outline"
          >
            {isAnalyzingEmotion ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Analisis Ulang Emosi
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
          className="w-full sm:flex-1"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Perbarui Jurnal
        </Button>
      </div>

      {/* Display Emotion Analysis Results */}
      {emotionData && !isAnalyzingEmotion && (
        <div className="mt-6 space-y-3 p-4 border rounded-md bg-muted/30">
          <h3 className="text-lg font-semibold border-b pb-2 mb-2">
            Hasil Analisis Emosi
          </h3>
          <div>
            <p className="text-base">
              Emosi Dominan:{" "}
              <strong className="text-lg text-primary">
                {emotionData.top_prediction.label}
              </strong>{" "}
              ({emotionData.top_prediction.confidence.toFixed(2)}%)
            </p>
            <p className="text-sm mt-2 text-muted-foreground">
              Detail Prediksi:
            </p>
            <ul className="text-xs list-disc list-inside pl-1 mt-1 grid grid-cols-2 sm:grid-cols-3 gap-x-4">
              {Object.entries(emotionData.all_predictions)
                .sort(([, a], [, b]) => b - a)
                .map(([key, value]) => (
                  <li key={key} className="break-inside-avoid my-0.5">
                    {key}: {value.toFixed(2)}%
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}

      {/* Messages */}
      {infoMessage && !error && (
        <Alert
          variant="default"
          className="bg-blue-50 border-blue-300 text-blue-700"
        >
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
    </div>
  );
}
