// filepath: d:\Semester 4\Pemweb\eco-journal\app\api\weather\route.ts
import { WeatherApiResponse } from '@/types';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { latitude, longitude } = await request.json();
    const apiKey = process.env.WEATHER_API_KEY;

    if (!apiKey) {
      console.error("Weather API key is not configured");
      return NextResponse.json({ error: "Weather API key is not configured" }, { status: 500 });
    }
    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 });
    }

    const weatherResponse = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${latitude},${longitude}&aqi=yes`
    );

    if (!weatherResponse.ok) {
      const errorData = await weatherResponse.json();
      console.error("Weather API request failed:", errorData);
      return NextResponse.json({ error: errorData.error?.message || `Weather API request failed with status ${weatherResponse.status}` }, { status: weatherResponse.status });
    }

    const weatherData: WeatherApiResponse = await weatherResponse.json();
    return NextResponse.json(weatherData);
  } catch (error: any) {
    console.error("Internal server error in /api/weather:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}