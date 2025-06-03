import { WeatherApiResponse } from '@/types';
import Image from 'next/image';
import { MapPin, Thermometer, Droplets, Wind, CloudIcon as Cloud, Sun, AlertTriangle } from 'lucide-react'; // Ganti Cloud menjadi CloudIcon

interface WeatherDisplayProps {
  weather: WeatherApiResponse;
  locationName?: string;
}

export default function WeatherDisplay({ weather, locationName }: WeatherDisplayProps) {
  const { current, location } = weather;

  // Helper function untuk deskripsi AQI (sederhana)
  const getAQIDescription = (index?: number): string => {
    if (index === undefined) return "Tidak diketahui";
    if (index === 1) return "Baik";
    if (index === 2) return "Sedang";
    if (index === 3) return "Tidak Sehat bagi Kelompok Sensitif";
    if (index === 4) return "Tidak Sehat";
    if (index === 5) return "Sangat Tidak Sehat";
    if (index === 6) return "Berbahaya";
    return "Tidak diketahui";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-lg font-medium">
        <MapPin className="h-5 w-5 text-primary" />
        <span>Cuaca di {locationName || location.name}, {location.country}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
          {current.condition.icon && (
            <Image
              src={`https:${current.condition.icon}`}
              alt={current.condition.text}
              width={48}
              height={48}
              unoptimized // Jika ikon dari CDN eksternal dan Next.js tidak bisa mengoptimalkannya
            />
          )}
          <div>
            <p className="text-xl font-semibold">{current.condition.text}</p>
            <p className="text-sm text-muted-foreground">Saat ini</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
          <Thermometer className="h-6 w-6 text-red-500" />
          <div>
            <p className="text-lg">{current.temp_c}°C</p>
            <p className="text-xs text-muted-foreground">Terasa: {current.feelslike_c}°C</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
          <Droplets className="h-6 w-6 text-blue-500" />
          <div>
            <p className="text-lg">{current.humidity}%</p>
            <p className="text-xs text-muted-foreground">Kelembapan</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
          <Wind className="h-6 w-6 text-gray-500" />
          <div>
            <p className="text-lg">{current.wind_kph} km/j</p>
            <p className="text-xs text-muted-foreground">Angin</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
          <Cloud className="h-6 w-6 text-sky-400" />
          <div>
            <p className="text-lg">{current.cloud}%</p>
            <p className="text-xs text-muted-foreground">Awan</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
          <Sun className="h-6 w-6 text-yellow-500" />
          <div>
            <p className="text-lg">{current.uv}</p>
            <p className="text-xs text-muted-foreground">Indeks UV</p>
          </div>
        </div>
      </div>
      {current.air_quality && (current.air_quality.pm2_5 !== undefined || current.air_quality['us-epa-index'] !== undefined) && (
        <div className="mt-3 p-3 border-t">
          <h4 className="font-medium mb-1 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-orange-500" /> Kualitas Udara
          </h4>
          {current.air_quality.pm2_5 !== undefined && (
            <p className="text-sm">PM2.5: {current.air_quality.pm2_5.toFixed(2)} µg/m³</p>
          )}
          {current.air_quality['us-epa-index'] !== undefined && (
            <p className="text-sm">US EPA Index: {current.air_quality['us-epa-index']} ({getAQIDescription(current.air_quality['us-epa-index'])})</p>
          )}
        </div>
      )}
    </div>
  );
}