export interface UserLocation {
  latitude: number;
  longitude: number;
  name?: string; // Nama kota/lokasi dari WeatherAPI
}

export interface WeatherCondition {
  text: string;
  icon: string;
  code: number;
}

export interface AirQuality {
  co?: number;
  no2?: number;
  o3?: number;
  so2?: number;
  pm2_5?: number;
  pm10?: number;
  "us-epa-index"?: number; // Kunci dengan tanda hubung perlu string
  "gb-defra-index"?: number;
}

export interface WeatherCurrent {
  last_updated_epoch?: number;
  last_updated?: string;
  temp_c: number;
  temp_f?: number;
  is_day?: number;
  condition: WeatherCondition;
  wind_mph?: number;
  wind_kph: number;
  wind_degree?: number;
  wind_dir?: string;
  pressure_mb: number;
  pressure_in?: number;
  precip_mm: number;
  precip_in?: number;
  humidity: number;
  cloud: number;
  feelslike_c: number;
  feelslike_f?: number;
  vis_km?: number;
  vis_miles?: number;
  uv: number;
  gust_mph?: number;
  gust_kph?: number;
  air_quality?: AirQuality;
}

export interface WeatherLocation {
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  tz_id?: string;
  localtime_epoch?: number;
  localtime?: string;
}

export interface WeatherApiResponse {
  location: WeatherLocation;
  current: WeatherCurrent;
}

export interface EmotionPredictionDetail {
  confidence: number;
  label: string;
}

export interface EmotionApiResponse {
  all_predictions: Record<string, number>; // e.g., { "Anger": 72.98, ... }
  text: string; // Teks yang dianalisis
  top_prediction: EmotionPredictionDetail;
}

export interface JournalEntry { // Contoh jika Anda membuat tipe ini
  id: string;
  user_id: string;
  title: string; // Tambahkan title
  content: string | null;
  created_at: string;
  updated_at: string;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  weather_data: WeatherApiResponse | null; // Atau any jika tidak ingin detail
  emotion_analysis: EmotionApiResponse | null; // Atau any
  emotion_id: number | null;
  emotion_source: 'ai' | 'manual' | null;
}

// ...existing code...

export interface AirQualityData {
  location: {
    lat: number;
    lon: number;
    name: string;
  };
  timestamp: string;
  airQuality: {
    aqi: number;  // US-EPA Index
    co: number;
    no2: number;
    o3: number;
    so2: number;
    pm2_5: number;
    pm10: number;
  };
}

export interface AirQualityHeatmapData {
  data: AirQualityData[];
  timeRange: 'today' | '7days' | '30days';
  aggregationType: 'hourly' | 'daily' | 'weekly';
}

// Color ranges for different AQI levels
export enum AqiLevel {
  GOOD = 'good',
  MODERATE = 'moderate',
  UNHEALTHY_SENSITIVE = 'unhealthy-sensitive',
  UNHEALTHY = 'unhealthy',
  VERY_UNHEALTHY = 'very-unhealthy',
  HAZARDOUS = 'hazardous'
}

export interface AqiColorMapping {
  level: AqiLevel;
  color: string;
  range: [number, number];
  description: string;
}

// Tambahkan ke file types/index.ts
export interface EmotionHeatmapData {
  location: {
    lat: number;
    lon: number;
  };
  intensity: number;
  dominantEmotion: string;
  emotionCounts: Record<string, number>;
  entryCount: number;
  timestamp?: string;
  source: 'journal';
  moodScore?: number; // Tambahkan properti moodScore sebagai opsional
  averageMoodScore?: number; // Tambahkan juga averageMoodScore untuk data yang dirata-rata
}

// Update AirQualityData untuk menambahkan source
export interface AirQualityData {
  location: {
    lat: number;
    lon: number;
    name: string;
  };
  timestamp: string;
  airQuality: {
    aqi: number;
    co: number;
    no2: number;
    o3: number;
    so2: number;
    pm2_5: number;
    pm10: number;
  };
  source: 'api';
}