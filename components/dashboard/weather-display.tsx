import { WeatherApiResponse } from '@/types';
import Image from 'next/image';
import { MapPin, Thermometer, Droplets, Wind, Sun, Eye, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface WeatherDisplayProps {
  weather: WeatherApiResponse;
  locationName?: string;
  isMinimal?: boolean; // New prop to control minimal/expanded view
}

export default function WeatherDisplay({ weather, locationName, isMinimal = false }: WeatherDisplayProps) {
  const { current, location } = weather;
  const [showDetails, setShowDetails] = useState(false);

  // Helper function untuk deskripsi AQI yang lebih wellness-focused
  const getAQIDescription = (index?: number): { text: string; color: string; bgColor: string } => {
    if (index === undefined) return { text: "Tidak diketahui", color: "text-slate-500", bgColor: "bg-slate-50" };
    if (index === 1) return { text: "Udara Segar", color: "text-green-600", bgColor: "bg-green-50" };
    if (index === 2) return { text: "Cukup Baik", color: "text-blue-600", bgColor: "bg-blue-50" };
    if (index === 3) return { text: "Perlu Perhatian", color: "text-yellow-600", bgColor: "bg-yellow-50" };
    if (index === 4) return { text: "Kurang Sehat", color: "text-orange-600", bgColor: "bg-orange-50" };
    if (index === 5) return { text: "Tidak Sehat", color: "text-red-600", bgColor: "bg-red-50" };
    if (index === 6) return { text: "Berbahaya", color: "text-red-700", bgColor: "bg-red-100" };
    return { text: "Tidak diketahui", color: "text-slate-500", bgColor: "bg-slate-50" };
  };

  // Helper untuk mendapatkan warna berdasarkan suhu
  const getTempColor = (temp: number) => {
    if (temp <= 15) return "text-blue-600";
    if (temp <= 25) return "text-green-600";
    if (temp <= 30) return "text-orange-500";
    return "text-red-500";
  };

  // Helper for AQI
  const getAQIInfo = (index?: number) => {
    if (index === undefined) return { text: "N/A", color: "text-slate-500" };
    if (index === 1) return { text: "Baik", color: "text-green-600" };
    if (index === 2) return { text: "Sedang", color: "text-blue-600" };
    if (index === 3) return { text: "Kurang", color: "text-yellow-600" };
    if (index >= 4) return { text: "Buruk", color: "text-red-600" };
    return { text: "N/A", color: "text-slate-500" };
  };

  const aqiInfo = getAQIDescription(current.air_quality?.['us-epa-index']);
  const aqiShortInfo = getAQIInfo(current.air_quality?.['us-epa-index']);

  // If minimal mode (for journal form header)
  if (isMinimal) {
    return (
      <div className="flex items-center justify-between">
        {/* Subtle Weather Info */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-3 text-slate-600 hover:text-slate-800 transition-colors p-2 rounded-xl hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{locationName || location.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {current.condition.icon && (
                <Image
                  src={`https:${current.condition.icon}`}
                  alt={current.condition.text}
                  width={18}
                  height={18}
                  unoptimized
                  className="opacity-80"
                />
              )}
              <span className={`text-sm font-medium ${getTempColor(current.temp_c)}`}>
                {current.temp_c}°C
              </span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
          </button>

          {/* AQI Badge */}
          {current.air_quality && (
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-xl">
              <Eye className="h-3 w-3 text-slate-500" />
              <span className="text-xs text-slate-600">AQI:</span>
              <span className={`text-xs font-medium ${aqiShortInfo.color}`}>
                {aqiShortInfo.text}
              </span>
            </div>
          )}
        </div>

        {/* Expandable Weather Details - One Line Format */}
        {showDetails && (
          <div className="absolute top-full left-0 right-0 mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 z-10">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Thermometer className={`h-4 w-4 ${getTempColor(current.temp_c)}`} />
                  <span className="text-slate-700">{current.temp_c}°C (terasa {current.feelslike_c}°C)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <span className="text-slate-700">{current.humidity}% kelembapan</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4 text-slate-600" />
                  <span className="text-slate-700">{current.wind_kph} km/j angin</span>
                </div>
                {current.air_quality?.pm2_5 && (
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-slate-600" />
                    <span className="text-slate-700">PM2.5: {current.air_quality.pm2_5.toFixed(1)} µg/m³</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-500">
                💡 {current.temp_c > 30 ? "Jaga hidrasi saat journaling" : 
                     current.temp_c > 25 ? "Cuaca nyaman untuk refleksi" :
                     current.temp_c > 15 ? "Cuaca sejuk, cocok untuk menulis" :
                     "Hangatkan diri sambil menulis"}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full weather display (for dashboard)
  return (
    <div className="space-y-4">
      {/* Location and Current Condition - Minimal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-slate-500" />
          <span className="text-xs text-slate-600">
            {locationName || location.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {current.condition.icon && (
            <Image
              src={`https:${current.condition.icon}`}
              alt={current.condition.text}
              width={16}
              height={16}
              unoptimized
              className="opacity-80"
            />
          )}
          <span className="text-xs text-slate-600">{current.condition.text}</span>
        </div>
      </div>

      {/* Essential Weather Info - Compact Grid */}
      <div className="grid grid-cols-4 gap-3">
        {/* Temperature */}
        <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
          <Thermometer className={`h-3 w-3 mx-auto mb-1 ${getTempColor(current.temp_c)}`} />
          <div className={`text-sm font-medium ${getTempColor(current.temp_c)}`}>
            {current.temp_c}°
          </div>
          <div className="text-xs text-slate-400">Suhu</div>
        </div>

        {/* Humidity */}
        <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
          <Droplets className="h-3 w-3 mx-auto mb-1 text-blue-500" />
          <div className="text-sm font-medium text-blue-600">
            {current.humidity}%
          </div>
          <div className="text-xs text-slate-400">Kelembapan</div>
        </div>

        {/* Wind */}
        <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
          <Wind className="h-3 w-3 mx-auto mb-1 text-slate-600" />
          <div className="text-sm font-medium text-slate-700">
            {current.wind_kph}
          </div>
          <div className="text-xs text-slate-400">Angin</div>
        </div>

        {/* UV Index */}
        <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
          <Sun className="h-3 w-3 mx-auto mb-1 text-yellow-500" />
          <div className="text-sm font-medium text-yellow-600">
            {current.uv}
          </div>
          <div className="text-xs text-slate-400">UV</div>
        </div>
      </div>

      {/* Air Quality - Compact */}
      {current.air_quality && current.air_quality['us-epa-index'] !== undefined && (
        <div className={`${aqiInfo.bgColor} rounded-xl p-3 border border-slate-100`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-3 w-3 text-slate-600" />
              <span className="text-xs font-medium text-slate-800">Kualitas Udara</span>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-lg bg-white ${aqiInfo.color}`}>
              {aqiInfo.text}
            </span>
          </div>
          
          {current.air_quality.pm2_5 !== undefined && (
            <div className="flex gap-3 mt-2">
              <div className="text-center">
                <div className="text-xs text-slate-700 font-medium">
                  {current.air_quality.pm2_5.toFixed(1)}
                </div>
                <div className="text-xs text-slate-500">PM2.5</div>
              </div>
              
              {current.air_quality.pm10 !== undefined && (
                <div className="text-center">
                  <div className="text-xs text-slate-700 font-medium">
                    {current.air_quality.pm10.toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-500">PM10</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Minimal Wellness Tip */}
      <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
        <div className="flex items-start gap-2">
          <span className="text-xs">💡</span>
          <p className="text-xs text-blue-700 leading-relaxed">
            {current.temp_c > 30 && "Cuaca panas, jaga hidrasi saat journaling"}
            {current.temp_c <= 30 && current.temp_c > 25 && "Cuaca nyaman untuk refleksi"}
            {current.temp_c <= 25 && current.temp_c > 15 && "Cuaca sejuk, cocok untuk menulis"}
            {current.temp_c <= 15 && "Cuaca dingin, hangatkan diri sambil menulis"}
          </p>
        </div>
      </div>
    </div>
  );
}