import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Thermometer, Droplets, Wind, CloudIcon as Cloud, SunIcon as Sun, Brain, Smile, ListChecks, CalendarDays } from "lucide-react"; // Tambahkan ikon yang relevan
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Untuk menampilkan emosi
import { WeatherApiResponse, EmotionApiResponse } from "@/types"; // Pastikan tipe ini ada dan sesuai

// Helper untuk deskripsi AQI (bisa dipindah ke utils jika sering dipakai)
const getAQIDescription = (index?: number): string => {
  if (index === undefined) return "Tidak diketahui";
  if (index === 1) return "Baik";
  if (index === 2) return "Sedang";
  if (index === 3) return "Tidak Sehat (Kelompok Sensitif)";
  if (index === 4) return "Tidak Sehat";
  if (index === 5) return "Sangat Tidak Sehat";
  if (index === 6) return "Berbahaya";
  return "Tidak diketahui";
};

export default async function JournalDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { id: journalId } = await params;

  const { data: journal, error } = await supabase
    .from("journal_entries")
    .select("*") // Ambil semua kolom untuk detail
    .eq("id", journalId)
    .eq("user_id", user.id) // Pastikan user hanya bisa akses jurnalnya sendiri
    .single(); // Kita mengharapkan satu hasil

  if (error || !journal) {
    console.error("Error fetching journal detail or journal not found:", error);
    // Redirect ke histori atau tampilkan pesan error yang lebih baik
    redirect("/protected/journal/history?error=notfound");
  }

  // Parse data JSONB
  const weatherData = journal.weather_data as WeatherApiResponse | null;
  const emotionData = journal.emotion_analysis as EmotionApiResponse | null;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/protected/journal/history" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Histori
          </Link>
        </Button>
      </div>

      <article className="bg-card p-6 sm:p-8 rounded-lg shadow-md border space-y-6">
        <header className="border-b pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              {/* Tampilkan title sebagai judul utama */}
              <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-1">
                {journal.title || <span className="italic">Tanpa Judul</span>}
              </h1>
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4 mr-1.5" />
                <span>{new Date(journal.created_at).toLocaleString("id-ID", { dateStyle: 'full', timeStyle: 'short' })}</span>
              </div>
            </div>
            {emotionData?.top_prediction?.label && (
              <Badge variant="default" className="text-sm whitespace-nowrap">
                Emosi Dominan: {emotionData.top_prediction.label}
              </Badge>
            )}
          </div>
        </header>

        {/* Konten Jurnal */}
        <section>
          <h2 className="text-xl font-semibold mb-2 flex items-center"><Brain className="h-5 w-5 mr-2 text-primary" /> Pikiran & Perasaanmu</h2>
          <div className="prose prose-sm sm:prose-base max-w-none bg-muted/30 p-4 rounded-md whitespace-pre-line">
            {journal.content || <p className="italic">Tidak ada konten jurnal.</p>}
          </div>
        </section>

        {/* Detail Lokasi */}
        {(journal.location_name || (journal.latitude && journal.longitude)) && (
          <section>
            <h2 className="text-xl font-semibold mb-2 flex items-center"><MapPin className="h-5 w-5 mr-2 text-primary" /> Lokasi Tercatat</h2>
            <div className="bg-muted/30 p-4 rounded-md text-sm">
              {journal.location_name && <p>Nama Lokasi: <strong>{journal.location_name}</strong></p>}
              {journal.latitude && journal.longitude && (
                <p>Koordinat: Latitude {journal.latitude.toFixed(4)}, Longitude {journal.longitude.toFixed(4)}</p>
              )}
            </div>
          </section>
        )}

        {/* Detail Cuaca */}
        {weatherData && weatherData.current && (
          <section>
            <h2 className="text-xl font-semibold mb-2 flex items-center"><Cloud className="h-5 w-5 mr-2 text-primary" /> Kondisi Cuaca Saat Itu</h2>
            <div className="bg-muted/30 p-4 rounded-md grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center"><Thermometer className="h-4 w-4 mr-2 text-red-500" /> Suhu: {weatherData.current.temp_c}°C (Terasa {weatherData.current.feelslike_c}°C)</div>
              <div className="flex items-center"><Droplets className="h-4 w-4 mr-2 text-blue-500" /> Kelembapan: {weatherData.current.humidity}%</div>
              <div className="flex items-center"><Wind className="h-4 w-4 mr-2 text-gray-500" /> Angin: {weatherData.current.wind_kph} km/j</div>
              <div className="flex items-center"><Cloud className="h-4 w-4 mr-2 text-sky-400" /> Awan: {weatherData.current.cloud}%</div>
              <div className="flex items-center"><Sun className="h-4 w-4 mr-2 text-yellow-500" /> Indeks UV: {weatherData.current.uv}</div>
              <p className="sm:col-span-2">Kondisi: {weatherData.current.condition.text}</p>
              {weatherData.current.air_quality && (
                <div className="sm:col-span-2 mt-2 pt-2 border-t">
                  <h3 className="font-medium text-xs mb-1">Kualitas Udara:</h3>
                  {weatherData.current.air_quality.pm2_5 !== undefined && <p className="text-xs">PM2.5: {weatherData.current.air_quality.pm2_5.toFixed(2)} µg/m³</p>}
                  {weatherData.current.air_quality['us-epa-index'] !== undefined && <p className="text-xs">US EPA Index: {weatherData.current.air_quality['us-epa-index']} ({getAQIDescription(weatherData.current.air_quality['us-epa-index'])})</p>}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Detail Analisis Emosi */}
        {emotionData && (
          <section>
            <h2 className="text-xl font-semibold mb-2 flex items-center"><ListChecks className="h-5 w-5 mr-2 text-primary" /> Detail Analisis Emosi</h2>
            <div className="bg-muted/30 p-4 rounded-md text-sm">
              <p className="mb-1">Emosi Dominan: <strong>{emotionData.top_prediction.label}</strong> (Keyakinan: {emotionData.top_prediction.confidence.toFixed(2)}%)</p>
              <h4 className="font-medium mt-3 mb-1 text-xs">Semua Emosi Terdeteksi:</h4>
              <ul className="list-disc list-inside pl-1 grid grid-cols-2 sm:grid-cols-3 gap-x-2 text-xs">
                {Object.entries(emotionData.all_predictions)
                  .sort(([, a], [, b]) => b - a) // Urutkan dari tertinggi
                  .map(([key, value]) => (
                    <li key={key} className="my-0.5">{key}: {value.toFixed(2)}%</li>
                  ))}
              </ul>
            </div>
          </section>
        )}

        {!weatherData && !emotionData && !journal.location_name && (
          <p className="text-muted-foreground italic">Tidak ada data tambahan (cuaca, emosi, lokasi) yang tercatat untuk entri ini.</p>
        )}

      </article>
    </div>
  );
}