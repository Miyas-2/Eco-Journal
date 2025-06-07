import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ListChecks, Smile, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WeatherApiResponse, EmotionApiResponse } from "@/types";

export default async function JournalDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { id: journalId } = params;
  const { data: journal, error } = await supabase
    .from("journal_entries")
    .select("*, emotions(name)")
    .eq("id", journalId)
    .eq("user_id", user.id)
    .single();

  if (error || !journal) {
    redirect("/protected/journal/history?error=notfound");
  }

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
              <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-1">
                {journal.title || <span className="italic">Tanpa Judul</span>}
              </h1>
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4 mr-1.5" />
                <span>{new Date(journal.created_at).toLocaleString("id-ID", { dateStyle: 'full', timeStyle: 'short' })}</span>
              </div>
            </div>
            {/* Label sumber emosi */}
            {journal.emotion_source === "ai" && emotionData?.top_prediction?.label && (
              <Badge variant="default" className="text-sm whitespace-nowrap">
                Model AI: {emotionData.top_prediction.label}
              </Badge>
            )}
            {journal.emotion_source === "manual" && journal.emotions?.name && (
              <Badge variant="default" className="text-sm whitespace-nowrap">
                Manual: {journal.emotions.name}
              </Badge>
            )}
          </div>
        </header>

        {/* Konten Jurnal */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Isi Jurnal</h2>
          <div className="prose prose-sm sm:prose-base max-w-none bg-muted/30 p-4 rounded-md whitespace-pre-line">
            {journal.content || <p className="italic">Tidak ada konten jurnal.</p>}
          </div>
        </section>

        {/* Data Cuaca */}
        {weatherData && (
          <section>
            <h2 className="text-xl font-semibold mb-2 flex items-center">
              <span className="mr-2">🌤️</span> Data Cuaca & Lingkungan Saat Itu
            </h2>
            <div className="bg-muted/30 p-4 rounded-md text-sm space-y-3">
              {/* Informasi Lokasi */}
              <div className="border-b pb-2">
                <h4 className="font-medium text-base mb-1">📍 Lokasi</h4>
                <div><strong>Nama:</strong> {weatherData.location.name}</div>
                <div><strong>Wilayah:</strong> {weatherData.location.region}, {weatherData.location.country}</div>
                <div><strong>Koordinat:</strong> {weatherData.location.lat}°, {weatherData.location.lon}°</div>
                <div><strong>Zona Waktu:</strong> {weatherData.location.tz_id}</div>
              </div>

              {/* Kondisi Cuaca Utama */}
              <div className="border-b pb-2">
                <h4 className="font-medium text-base mb-1">☀️ Kondisi Cuaca</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div><strong>Cuaca:</strong> {weatherData.current.condition.text}</div>
                  <div><strong>Suhu:</strong> {weatherData.current.temp_c}°C (terasa {weatherData.current.feelslike_c}°C)</div>
                  <div><strong>Kelembapan:</strong> {weatherData.current.humidity}%</div>
                  <div><strong>Tekanan Udara:</strong> {weatherData.current.pressure_mb} mb</div>
                  <div><strong>Visibilitas:</strong> {weatherData.current.vis_km} km</div>
                  <div><strong>Indeks UV:</strong> {weatherData.current.uv}</div>
                </div>
              </div>

              {/* Informasi Angin
              <div className="border-b pb-2">
                <h4 className="font-medium text-base mb-1">💨 Kondisi Angin</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div><strong>Kecepatan:</strong> {weatherData.current.wind_kph} km/jam</div>
                  <div><strong>Arah:</strong> {weatherData.current.wind_dir} ({weatherData.current.wind_degree}°)</div>
                  <div><strong>Hembusan:</strong> {weatherData.current.gust_kph || 'Tidak ada'} km/jam</div>
                </div>
              </div> */}

              {/* Kualitas Udara */}
              {weatherData.current.air_quality && (
                <div>
                  <h4 className="font-medium text-base mb-1">🏭 Kualitas Udara</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {weatherData.current.air_quality.pm2_5 !== undefined && (
                      <div className="bg-white p-2 rounded border">
                        <div className="font-medium">PM2.5</div>
                        <div>{weatherData.current.air_quality.pm2_5.toFixed(1)} µg/m³</div>
                      </div>
                    )}
                    {weatherData.current.air_quality.pm10 !== undefined && (
                      <div className="bg-white p-2 rounded border">
                        <div className="font-medium">PM10</div>
                        <div>{weatherData.current.air_quality.pm10.toFixed(1)} µg/m³</div>
                      </div>
                    )}
                    {weatherData.current.air_quality.co !== undefined && (
                      <div className="bg-white p-2 rounded border">
                        <div className="font-medium">CO</div>
                        <div>{weatherData.current.air_quality.co.toFixed(1)} µg/m³</div>
                      </div>
                    )}
                    {weatherData.current.air_quality.no2 !== undefined && (
                      <div className="bg-white p-2 rounded border">
                        <div className="font-medium">NO₂</div>
                        <div>{weatherData.current.air_quality.no2.toFixed(1)} µg/m³</div>
                      </div>
                    )}
                    {weatherData.current.air_quality.o3 !== undefined && (
                      <div className="bg-white p-2 rounded border">
                        <div className="font-medium">O₃</div>
                        <div>{weatherData.current.air_quality.o3.toFixed(1)} µg/m³</div>
                      </div>
                    )}
                    {weatherData.current.air_quality.so2 !== undefined && (
                      <div className="bg-white p-2 rounded border">
                        <div className="font-medium">SO₂</div>
                        <div>{weatherData.current.air_quality.so2.toFixed(1)} µg/m³</div>
                      </div>
                    )}
                  </div>
                  {/* Indikator kualitas udara */}
                  <div className="mt-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">Status Kualitas Udara:</span>
                      {weatherData.current.air_quality.pm2_5 && (
                        <span className={`px-2 py-1 rounded text-white ${weatherData.current.air_quality.pm2_5 <= 12 ? 'bg-green-500' :
                            weatherData.current.air_quality.pm2_5 <= 35 ? 'bg-yellow-500' :
                              weatherData.current.air_quality.pm2_5 <= 55 ? 'bg-orange-500' : 'bg-red-500'
                          }`}>
                          {weatherData.current.air_quality.pm2_5 <= 12 ? 'Baik' :
                            weatherData.current.air_quality.pm2_5 <= 35 ? 'Sedang' :
                              weatherData.current.air_quality.pm2_5 <= 55 ? 'Tidak Sehat' : 'Berbahaya'}
                        </span>
                      )}
                    </div>

                    {/* Indeks EPA dan DEFRA */}
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {weatherData.current.air_quality['us-epa-index'] !== undefined && (
                        <div className="bg-white p-2 rounded border flex justify-between items-center">
                          <span className="font-medium">US EPA Index:</span>
                          <span className={`px-2 py-1 text-xs rounded text-white ${weatherData.current.air_quality['us-epa-index'] <= 1 ? 'bg-green-500' :
                              weatherData.current.air_quality['us-epa-index'] <= 2 ? 'bg-yellow-500' :
                                weatherData.current.air_quality['us-epa-index'] <= 3 ? 'bg-orange-500' : 'bg-red-500'
                            }`}>
                            {weatherData.current.air_quality['us-epa-index']} - {
                              weatherData.current.air_quality['us-epa-index'] <= 1 ? 'Good' :
                                weatherData.current.air_quality['us-epa-index'] <= 2 ? 'Moderate' :
                                  weatherData.current.air_quality['us-epa-index'] <= 3 ? 'Unhealthy for Sensitive' : 'Unhealthy'
                            }
                          </span>
                        </div>
                      )}

                      {weatherData.current.air_quality['gb-defra-index'] !== undefined && (
                        <div className="bg-white p-2 rounded border flex justify-between items-center">
                          <span className="font-medium">UK DEFRA Index:</span>
                          <span className={`px-2 py-1 text-xs rounded text-white ${weatherData.current.air_quality['gb-defra-index'] <= 3 ? 'bg-green-500' :
                              weatherData.current.air_quality['gb-defra-index'] <= 6 ? 'bg-yellow-500' :
                                weatherData.current.air_quality['gb-defra-index'] <= 9 ? 'bg-orange-500' : 'bg-red-500'
                            }`}>
                            {weatherData.current.air_quality['gb-defra-index']} - {
                              weatherData.current.air_quality['gb-defra-index'] <= 3 ? 'Low' :
                                weatherData.current.air_quality['gb-defra-index'] <= 6 ? 'Moderate' :
                                  weatherData.current.air_quality['gb-defra-index'] <= 9 ? 'High' : 'Very High'
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Detail Analisis Emosi */}
        {journal.emotion_source === "ai" && emotionData && (
          <section>
            <h2 className="text-xl font-semibold mb-2 flex items-center"><ListChecks className="h-5 w-5 mr-2 text-primary" /> Detail Analisis Emosi (AI)</h2>
            <div className="bg-muted/30 p-4 rounded-md text-sm">
              <p className="mb-1">Emosi Dominan: <strong>{emotionData.top_prediction.label}</strong> (Keyakinan: {emotionData.top_prediction.confidence.toFixed(2)}%)</p>
              <h4 className="font-medium mt-3 mb-1 text-xs">Semua Emosi Terdeteksi:</h4>
              <ul className="list-disc list-inside pl-1 grid grid-cols-2 sm:grid-cols-3 gap-x-2 text-xs">
                {Object.entries(emotionData.all_predictions)
                  .sort(([, a], [, b]) => b - a)
                  .map(([key, value]) => (
                    <li key={key} className="my-0.5">{key}: {value.toFixed(2)}%</li>
                  ))}
              </ul>
            </div>
          </section>
        )}

        {/* Jika manual, tampilkan emosi pilihan */}
        {journal.emotion_source === "manual" && journal.emotions?.name && (
          <section>
            <h2 className="text-xl font-semibold mb-2 flex items-center"><Smile className="h-5 w-5 mr-2 text-primary" /> Emosi Pilihanmu</h2>
            <div className="bg-muted/30 p-4 rounded-md text-sm">
              <p>Emosi utama yang kamu pilih: <strong>{journal.emotions.name}</strong></p>
            </div>
          </section>
        )}
      </article>
    </div>
  );
}