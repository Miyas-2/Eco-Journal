// app/api/map/data/route.ts - Updated to include all AQI data
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'today';

    const today = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case '7days':
        startDate.setDate(today.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(today.getDate() - 30);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    const { data: emotionData } = await supabase
      .from('emotions')
      .select('id, name');

    const emotionMap: Record<string, string> = {};
    emotionData?.forEach(emotion => {
      emotionMap[emotion.id] = emotion.name;
    });

    const { data: journalData, error } = await supabase
      .from('journal_entries')
      .select('id, latitude, longitude, weather_data, emotion_id, mood_score, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', today.toISOString())
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(500);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mapPoints = journalData?.map(entry => {
      const airQuality = entry.weather_data?.current?.air_quality;
      
      return {
        id: entry.id,
        lat: entry.latitude,
        lng: entry.longitude,
        emotion: emotionMap[entry.emotion_id] || 'Unknown',
        moodScore: entry.mood_score,
        aqi: airQuality?.['us-epa-index'] || null,
        airQualityDetails: airQuality ? {
          pm2_5: airQuality.pm2_5,
          pm10: airQuality.pm10,
          co: airQuality.co,
          no2: airQuality.no2,
          o3: airQuality.o3,
          so2: airQuality.so2,
          'us-epa-index': airQuality['us-epa-index'],
          'gb-defra-index': airQuality['gb-defra-index']
        } : null,
        temperature: entry.weather_data?.current?.temp_c || null,
        condition: entry.weather_data?.current?.condition?.text || null,
        timestamp: entry.created_at
      };
    }) || [];

    const validAqi = mapPoints.filter(p => p.aqi !== null);
    const avgAqi = validAqi.length > 0
      ? Math.round(validAqi.reduce((sum, p) => sum + (p.aqi || 0), 0) / validAqi.length)
      : 0;

    const emotionCounts: Record<string, number> = {};
    mapPoints.forEach(p => {
      emotionCounts[p.emotion] = (emotionCounts[p.emotion] || 0) + 1;
    });
    const dominantMood = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    return NextResponse.json({
      points: mapPoints,
      statistics: {
        avgAqi,
        dominantMood,
        totalEntries: mapPoints.length,
        timeRange
      }
    });

  } catch (error: any) {
    console.error('Map data error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}