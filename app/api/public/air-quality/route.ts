import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { AirQualityData, EmotionHeatmapData } from '@/types/index';

export async function GET(request: Request) {
    try {
        // Create Supabase client with service role key to bypass RLS
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { searchParams } = new URL(request.url);
        const timeRange = searchParams.get('timeRange') || 'today';

        // Calculate date range based on timeRange
        const today = new Date();
        let startDate = new Date();
        let isAverage = false;

        switch (timeRange) {
            case '7days':
                startDate.setDate(today.getDate() - 7);
                isAverage = true;
                break;
            case '30days':
                startDate.setDate(today.getDate() - 30);
                isAverage = true;
                break;
            default: // today
                startDate.setHours(0, 0, 0, 0);
                break;
        }

        // Fetch all emotions first to create a mapping
        const { data: emotionData, error: emotionError } = await supabase
            .from('emotions')
            .select('id, name');

        if (emotionError) {
            console.error("Error fetching emotions:", emotionError.message);
            return NextResponse.json({
                weatherData: [],
                journalData: [],
                timeRange,
                error: emotionError.message
            });
        }

        // Create emotion mapping for lookup
        const emotionMap: Record<string, string> = {};
        emotionData.forEach(emotion => {
            emotionMap[emotion.id] = emotion.name;
        });

        // Query all journal entries with weather data (no user_id filtering)
        const { data, error } = await supabase
            .from('journal_entries')
            .select('weather_data, created_at, latitude, longitude, emotion_analysis, emotion_id, mood_score')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', today.toISOString())
            .limit(200); // Increased limit for better averaging

        if (error) {
            console.error("Database error:", error.message);
            return NextResponse.json({
                weatherData: [],
                journalData: [],
                timeRange,
                error: error.message
            });
        }

        // Split entries into those with weather data and those with journal location + emotion
        const weatherEntries = data.filter(entry => entry.weather_data?.current?.air_quality);
        const journalEntries = data.filter(entry => entry.latitude && entry.longitude);

        // Process weather data
        let processedWeatherData: AirQualityData[] = [];

        if (isAverage && weatherEntries.length > 0) {
            // Group by location for averaging
            const locationGroups: Record<string, any[]> = {};

            weatherEntries.forEach(entry => {
                // Use location from weather_data
                const lat = entry.weather_data.location?.lat;
                const lon = entry.weather_data.location?.lon;
                const locationName = entry.weather_data.location?.name ?? 'Unknown Location';

                // Skip entries without valid location data
                if (!lat || !lon) return;

                // Create a location key - using name for grouping
                const locationKey = locationName;

                if (!locationGroups[locationKey]) {
                    locationGroups[locationKey] = [];
                }

                locationGroups[locationKey].push({
                    location: {
                        lat,
                        lon,
                        name: locationName
                    },
                    timestamp: entry.created_at,
                    airQuality: entry.weather_data.current.air_quality,
                    source: 'api'
                });
            });

            // Calculate averages for each location group
            for (const locationKey in locationGroups) {
                const entries = locationGroups[locationKey];
                const entryCount = entries.length;

                if (entryCount > 0) {
                    // Initialize with first entry's location data
                    const firstEntry = entries[0];
                    const avgEntry: AirQualityData = {
                        location: firstEntry.location,
                        // Use the most recent timestamp
                        timestamp: entries.reduce((latest, entry) =>
                            new Date(entry.timestamp) > new Date(latest) ? entry.timestamp : latest,
                            firstEntry.timestamp),
                        airQuality: {
                            aqi: 0,
                            co: 0,
                            no2: 0,
                            o3: 0,
                            so2: 0,
                            pm2_5: 0,
                            pm10: 0
                        },
                        source: 'api'
                    };

                    // Sum all values
                    entries.forEach(entry => {
                        const aq = entry.airQuality;
                        avgEntry.airQuality.aqi += aq['us-epa-index'] || 0;
                        avgEntry.airQuality.co += aq.co || 0;
                        avgEntry.airQuality.no2 += aq.no2 || 0;
                        avgEntry.airQuality.o3 += aq.o3 || 0;
                        avgEntry.airQuality.so2 += aq.so2 || 0;
                        avgEntry.airQuality.pm2_5 += aq.pm2_5 || 0;
                        avgEntry.airQuality.pm10 += aq.pm10 || 0;
                    });

                    // Calculate averages
                    avgEntry.airQuality.aqi = Math.round(avgEntry.airQuality.aqi / entryCount);
                    avgEntry.airQuality.co = Number((avgEntry.airQuality.co / entryCount).toFixed(2));
                    avgEntry.airQuality.no2 = Number((avgEntry.airQuality.no2 / entryCount).toFixed(2));
                    avgEntry.airQuality.o3 = Number((avgEntry.airQuality.o3 / entryCount).toFixed(2));
                    avgEntry.airQuality.so2 = Number((avgEntry.airQuality.so2 / entryCount).toFixed(2));
                    avgEntry.airQuality.pm2_5 = Number((avgEntry.airQuality.pm2_5 / entryCount).toFixed(2));
                    avgEntry.airQuality.pm10 = Number((avgEntry.airQuality.pm10 / entryCount).toFixed(2));

                    // Add sample count for reference
                    (avgEntry as any).sampleCount = entryCount;
                    (avgEntry as any).timeRange = timeRange;

                    processedWeatherData.push(avgEntry);
                }
            }
        } else {
            // For today, just transform the weather data without averaging
            processedWeatherData = weatherEntries.map(entry => {
                const airQuality = entry.weather_data.current.air_quality || {};
                const lat = entry.weather_data.location?.lat;
                const lon = entry.weather_data.location?.lon;
                const locationName = entry.weather_data.location?.name ?? 'Unknown Location';

                // Skip entries without valid location data
                if (!lat || !lon) return null;

                return {
                    location: {
                        lat,
                        lon,
                        name: locationName
                    },
                    timestamp: entry.created_at,
                    airQuality: {
                        aqi: airQuality['us-epa-index'] || 0,
                        co: airQuality.co || 0,
                        no2: airQuality.no2 || 0,
                        o3: airQuality.o3 || 0,
                        so2: airQuality.so2 || 0,
                        pm2_5: airQuality.pm2_5 || 0,
                        pm10: airQuality.pm10 || 0,
                    },
                    source: 'api'
                };
            }).filter(Boolean) as AirQualityData[];
        }

        // Process journal data with emotions
        let processedJournalData: EmotionHeatmapData[] = [];

        if (isAverage) {
            // Group by location for heatmap intensity
            const locationGroups: Record<string, any[]> = {};

            journalEntries.forEach(entry => {
                // Use journal entry location
                const lat = entry.latitude;
                const lon = entry.longitude;

                // Skip entries without valid location data
                if (!lat || !lon) return;

                // Create a location key based on coordinates (rounded to 3 decimal places for clustering)
                const locationKey = `${parseFloat(lat).toFixed(3)},${parseFloat(lon).toFixed(3)}`;

                if (!locationGroups[locationKey]) {
                    locationGroups[locationKey] = [];
                }

                // Determine emotion data
                let emotionData = null;
                if (entry.emotion_analysis) {
                    try {
                        const analysis = typeof entry.emotion_analysis === 'string'
                            ? JSON.parse(entry.emotion_analysis)
                            : entry.emotion_analysis;

                        emotionData = {
                            primaryEmotion: analysis.top_prediction?.label || 'Unknown',
                            confidence: analysis.top_prediction?.confidence || 0,
                            allEmotions: analysis.all_predictions || {}
                        };
                    } catch (e) {
                        console.error('Error parsing emotion analysis:', e);
                    }
                } else if (entry.emotion_id) {
                    // For manually selected emotions, use the emotion mapping
                    const emotionLabel = emotionMap[entry.emotion_id] || 'Unknown';
                    emotionData = {
                        primaryEmotion: emotionLabel,
                        confidence: 100,
                        allEmotions: { [emotionLabel]: 100 }
                    };
                }

                locationGroups[locationKey].push({
                    location: {
                        lat,
                        lon
                    },
                    timestamp: entry.created_at,
                    emotion: emotionData,
                    mood_score: entry.mood_score,
                    source: 'journal'
                });
            });

            // Process the groups into heatmap data
            for (const locationKey in locationGroups) {
                const entries = locationGroups[locationKey];
                const entryCount = entries.length;

                if (entryCount > 0) {
                    // Use the average location
                    const avgLat = entries.reduce((sum, entry) => sum + entry.location.lat, 0) / entryCount;
                    const avgLon = entries.reduce((sum, entry) => sum + entry.location.lon, 0) / entryCount;

                    // Count emotions for this location cluster
                    const emotionCounts: Record<string, number> = {};
                    entries.forEach(entry => {
                        if (entry.emotion?.primaryEmotion) {
                            const emotion = entry.emotion.primaryEmotion;
                            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
                        }
                    });

                    // Find dominant emotion
                    let dominantEmotion = 'Unknown';
                    let maxCount = 0;
                    for (const emotion in emotionCounts) {
                        if (emotionCounts[emotion] > maxCount) {
                            maxCount = emotionCounts[emotion];
                            dominantEmotion = emotion;
                        }
                    }

                    // Hitung mood score rata-rata jika tersedia
                    const entriesWithMoodScore = entries.filter(entry => 
                        entry.mood_score !== undefined && entry.mood_score !== null
                    );
                    
                    const averageMoodScore = entriesWithMoodScore.length > 0
                        ? entriesWithMoodScore.reduce((sum, entry) => sum + entry.mood_score, 0) / entriesWithMoodScore.length
                        : undefined;

                    processedJournalData.push({
                        location: {
                            lat: avgLat,
                            lon: avgLon
                        },
                        intensity: entryCount, // Use entry count as intensity
                        dominantEmotion,
                        emotionCounts,
                        entryCount,
                        source: 'journal',
                        averageMoodScore // Tambahkan averageMoodScore ke output
                    });
                }
            }
        } else {
            // For today, process individual journal entries
            processedJournalData = journalEntries.map(entry => {
                // Use journal entry location
                const lat = entry.latitude;
                const lon = entry.longitude;

                // Skip entries without valid location data
                if (!lat || !lon) return null;

                // Determine emotion data
                let dominantEmotion = 'Unknown';
                let emotionCounts = {};

                if (entry.emotion_analysis) {
                    try {
                        const analysis = typeof entry.emotion_analysis === 'string'
                            ? JSON.parse(entry.emotion_analysis)
                            : entry.emotion_analysis;

                        dominantEmotion = analysis.top_prediction?.label || 'Unknown';
                        emotionCounts = analysis.all_predictions || {};
                    } catch (e) {
                        console.error('Error parsing emotion analysis:', e);
                    }
                } else if (entry.emotion_id) {
                    // For manually selected emotions, use the emotion mapping
                    dominantEmotion = emotionMap[entry.emotion_id] || 'Unknown';
                    emotionCounts = { [dominantEmotion]: 100 };
                }

                return {
                    location: {
                        lat,
                        lon
                    },
                    intensity: 1,
                    dominantEmotion,
                    emotionCounts,
                    entryCount: 1,
                    timestamp: entry.created_at,
                    source: 'journal',
                    moodScore: entry.mood_score !== null ? entry.mood_score : undefined // Tambahkan mood_score
                };
            }).filter(Boolean) as EmotionHeatmapData[];
        }

        return NextResponse.json({
            weatherData: processedWeatherData,
            journalData: processedJournalData,
            timeRange,
            isAverage
        });

    } catch (error: any) {
        console.error('Air quality data fetch error:', error.message);
        return NextResponse.json({
            weatherData: [],
            journalData: [],
            error: error.message || 'Failed to fetch air quality data'
        });
    }
}