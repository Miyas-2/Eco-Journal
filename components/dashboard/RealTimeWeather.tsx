// components/dashboard/RealTimeWeather.tsx
'use client';

import { useEffect, useState } from 'react';
import { WeatherApiResponse } from '@/types';

interface RealTimeWeatherProps {
  fallbackWeather?: {
    aqiValue?: number;
    temperature?: number;
    condition?: string;
  };
  variant?: 'card' | 'badges';
}

export default function RealTimeWeather({ fallbackWeather, variant = 'card' }: RealTimeWeatherProps) {
  const [weather, setWeather] = useState(fallbackWeather);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Get user's location
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;

              // Fetch fresh weather data
              const response = await fetch('/api/weather', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude, longitude }),
              });

              if (response.ok) {
                const data: WeatherApiResponse = await response.json();
                setWeather({
                  aqiValue: data.current?.air_quality?.['us-epa-index'],
                  temperature: data.current?.temp_c,
                  condition: data.current?.condition?.text,
                });
              }
              setLoading(false);
            },
            (error) => {
              console.error('Geolocation error:', error);
              setLoading(false);
            }
          );
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching weather:', error);
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const getAQILabel = (index?: number) => {
    if (!index) return 'No Data';
    if (index === 1) return 'Good';
    if (index === 2) return 'Moderate';
    if (index === 3) return 'Unhealthy for Sensitive';
    if (index === 4) return 'Unhealthy';
    if (index === 5) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const aqiLabel = getAQILabel(weather?.aqiValue);

  if (variant === 'badges') {
    return (
      <>
        {/* AQI Badge */}
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 px-3 py-1.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={
              weather?.aqiValue && weather.aqiValue <= 2
                ? 'text-green-500'
                : weather?.aqiValue && weather.aqiValue === 3
                ? 'text-yellow-500'
                : 'text-red-500'
            }
          >
            <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
            <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
            <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
          </svg>
          <span className="text-slate-600 dark:text-slate-300 text-xs font-bold">
            {loading ? 'Loading...' : `AQI ${weather?.aqiValue || 'N/A'} (${aqiLabel})`}
          </span>
        </div>

        {/* Weather Condition Badge */}
        {weather?.temperature && weather?.condition && (
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 px-3 py-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-indigo-400"
            >
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
            </svg>
            <span className="text-slate-600 dark:text-slate-300 text-xs font-bold">
              {weather.condition}, {weather.temperature}°C
            </span>
          </div>
        )}
      </>
    );
  }

  // Card variant (for Environment card in stats section)
  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Environment</span>
          <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
            {loading ? 'Loading...' : aqiLabel}
          </span>
        </div>
        <div
          className={`p-2 rounded-lg ${
            weather?.aqiValue && weather.aqiValue <= 2
              ? 'bg-green-50 dark:bg-green-900/30 text-green-600'
              : weather?.aqiValue && weather.aqiValue === 3
              ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600'
              : 'bg-red-50 dark:bg-red-900/30 text-red-600'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
            <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
            <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
          </svg>
        </div>
      </div>
      <div className="text-xs text-slate-500 font-medium">
        {weather?.aqiValue ? `AQI ${weather.aqiValue}` : 'No data'} •{' '}
        {weather?.temperature ? `${weather.temperature}°C` : ''} {weather?.condition || ''}
      </div>
    </div>
  );
}