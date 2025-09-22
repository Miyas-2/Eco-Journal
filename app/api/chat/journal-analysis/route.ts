import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get comprehensive journal statistics
        const { data: allJournals, error } = await supabase
            .from("journal_entries")
            .select(`
                id,
                title,
                content,
                created_at,
                mood_score,
                emotion_analysis,
                weather_data,
                location_name
            `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching journals:", error);
            return NextResponse.json({ error: "Failed to fetch journals" }, { status: 500 });
        }

        const journals = allJournals || [];

        // Calculate basic statistics
        const totalJournals = journals.length;
        const journalsWithMoodScore = journals.filter(j => j.mood_score !== null);
        
        const positiveEmotionJournals = journals.filter(j => j.mood_score && j.mood_score > 0.2);
        const neutralEmotionJournals = journals.filter(j => j.mood_score && j.mood_score >= -0.2 && j.mood_score <= 0.2);
        const negativeEmotionJournals = journals.filter(j => j.mood_score && j.mood_score < -0.2);

        // Enhanced environmental analysis with detailed data
        const environmentalData = journals
            .filter(j => j.weather_data && j.mood_score !== null)
            .map(j => {
                try {
                    const weather = typeof j.weather_data === 'string' ? JSON.parse(j.weather_data) : j.weather_data;
                    const current = weather.current || weather;
                    const airQuality = current.air_quality;
                    
                    return {
                        date: new Date(j.created_at).toISOString().split('T')[0],
                        dateFormatted: new Date(j.created_at).toLocaleDateString('id-ID'),
                        mood: j.mood_score,
                        temperature: current.temp_c,
                        condition: current.condition?.text || current.condition,
                        humidity: current.humidity,
                        aqi: airQuality?.['us-epa-index'] || null,
                        aqiDefra: airQuality?.['gb-defra-index'] || null,
                        pm25: airQuality?.pm2_5 || null,
                        pm10: airQuality?.pm10 || null,
                        no2: airQuality?.no2 || null,
                        o3: airQuality?.o3 || null,
                        so2: airQuality?.so2 || null,
                        co: airQuality?.co || null,
                        season: getSeason(new Date(j.created_at)),
                        journalId: j.id,
                        title: j.title
                    };
                } catch (e) {
                    console.error("Error parsing weather data:", e);
                    return null;
                }
            })
            .filter(Boolean);
        console.log("Environmental data sample:", environmentalData.slice(0, 2)); // Debug log

        // Analyze environmental correlations
        const envCorrelations = analyzeEnvironmentalCorrelations(environmentalData);
        
        // Seasonal mood analysis
        const seasonalAnalysis = analyzeSeasonalMoods(environmentalData);

        // Air quality impact analysis
        const aqiImpact = analyzeAQIImpact(environmentalData);

        // Recent mood trends
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentMoodJournals = journalsWithMoodScore.filter(j => new Date(j.created_at) >= sevenDaysAgo);
        const avgRecentMood = recentMoodJournals.reduce((sum, j) => sum + j.mood_score!, 0) / recentMoodJournals.length || 0;
        const avgMoodOverall = journalsWithMoodScore.reduce((sum, j) => sum + j.mood_score!, 0) / journalsWithMoodScore.length || 0;

        // Top emotions
        const emotionCounts: { [key: string]: number } = {};
        journals.forEach(journal => {
            if (journal.emotion_analysis) {
                try {
                    const emotions = typeof journal.emotion_analysis === 'string' 
                        ? JSON.parse(journal.emotion_analysis) 
                        : journal.emotion_analysis;
                    
                    if (emotions.dominant_emotion) {
                        emotionCounts[emotions.dominant_emotion] = (emotionCounts[emotions.dominant_emotion] || 0) + 1;
                    }
                } catch (e) {
                    // Skip invalid emotion data
                }
            }
        });

        const topEmotions = Object.entries(emotionCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([emotion, count]) => ({ emotion, count }));

        // Add detailed daily breakdown for worst air quality
        const worstAQIDays = environmentalData
            .filter(d => d && d.pm25 !== null)
            .sort((a, b) => (b?.pm25 || 0) - (a?.pm25 || 0))
            .slice(0, 5)
            .map(d => ({
                date: d!.dateFormatted,
                mood: d!.mood,
                pm25: d!.pm25,
                aqi: d!.aqi,
                title: d!.title
            }));

        return NextResponse.json({
            // Condensed summary for efficient token usage
            summary: {
                total: totalJournals,
                days: new Set(journals.map(j => new Date(j.created_at).toISOString().split('T')[0])).size,
                avgMood: Number(avgMoodOverall.toFixed(2)),
                recentMood: Number(avgRecentMood.toFixed(2)),
                moodCounts: {
                    positive: positiveEmotionJournals.length,
                    neutral: neutralEmotionJournals.length,
                    negative: negativeEmotionJournals.length
                },
                topEmotions: topEmotions.slice(0, 3)
            },
            environmental: {
                correlations: envCorrelations,
                seasonal: seasonalAnalysis,
                aqiImpact: aqiImpact,
                dataPoints: environmentalData.length,
                worstAQIDays: worstAQIDays, // Add this for specific examples
                rawData: environmentalData.slice(0, 10) // Add sample raw data for AI context
            }
        });

    } catch (error) {
        console.error("Error in journal analysis:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// Helper functions
function getSeason(date: Date): string {
    const month = date.getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
}

function analyzeEnvironmentalCorrelations(data: any[]) {
    if (data.length < 3) return null;

    const correlations: any = {};
    
    // PM2.5 impact analysis (using correct field name)
    const pm25Data = data.filter(d => d.pm25 !== null && d.pm25 !== undefined);
    console.log("PM2.5 data points:", pm25Data.length); // Debug log
    
    if (pm25Data.length > 2) {
        // WHO guideline: PM2.5 should be ≤15 μg/m³ (annual), ≤45 μg/m³ (24h)
        const highPM25 = pm25Data.filter(d => d.pm25 > 35); // High pollution
        const lowPM25 = pm25Data.filter(d => d.pm25 <= 15);  // Good air quality
        
        if (highPM25.length > 0 && lowPM25.length > 0) {
            const highPM25Mood = highPM25.reduce((sum, d) => sum + d.mood, 0) / highPM25.length;
            const lowPM25Mood = lowPM25.reduce((sum, d) => sum + d.mood, 0) / lowPM25.length;
            
            correlations.pm25 = {
                highPM25Mood: Number(highPM25Mood.toFixed(3)),
                lowPM25Mood: Number(lowPM25Mood.toFixed(3)),
                impact: Number((lowPM25Mood - highPM25Mood).toFixed(3)),
                highPM25Days: highPM25.length,
                lowPM25Days: lowPM25.length,
                totalDays: pm25Data.length,
                highPM25Percentage: Number(((highPM25.length / pm25Data.length) * 100).toFixed(1))
            };
        }
    }

    // US EPA AQI impact (1-6 scale)
    const aqiData = data.filter(d => d.aqi !== null && d.aqi !== undefined);
    console.log("AQI data points:", aqiData.length); // Debug log
    
    if (aqiData.length > 2) {
        // EPA AQI categories: 1=Good, 2=Moderate, 3=Unhealthy for Sensitive, 4=Unhealthy, 5=Very Unhealthy, 6=Hazardous
        const goodAQI = aqiData.filter(d => d.aqi <= 2); // Good to Moderate
        const badAQI = aqiData.filter(d => d.aqi >= 4);  // Unhealthy+
        
        if (goodAQI.length > 0 && badAQI.length > 0) {
            correlations.aqi = {
                goodAQIMood: Number((goodAQI.reduce((sum, d) => sum + d.mood, 0) / goodAQI.length).toFixed(3)),
                badAQIMood: Number((badAQI.reduce((sum, d) => sum + d.mood, 0) / badAQI.length).toFixed(3)),
                goodDays: goodAQI.length,
                badDays: badAQI.length,
                totalDays: aqiData.length
            };
        }
    }

    return correlations;
}

function analyzeSeasonalMoods(data: any[]) {
    const seasons = ['spring', 'summer', 'autumn', 'winter'];
    const seasonalData: any = {};

    seasons.forEach(season => {
        const seasonData = data.filter(d => d.season === season);
        if (seasonData.length > 0) {
            seasonalData[season] = {
                avgMood: Number((seasonData.reduce((sum, d) => sum + d.mood, 0) / seasonData.length).toFixed(3)),
                count: seasonData.length,
                avgPM25: seasonData.filter(d => d.pm25 !== null).length > 0 
                    ? Number((seasonData.filter(d => d.pm25 !== null).reduce((sum, d) => sum + d.pm25, 0) / seasonData.filter(d => d.pm25 !== null).length).toFixed(1))
                    : null,
                avgAQI: seasonData.filter(d => d.aqi !== null).length > 0 
                    ? Number((seasonData.filter(d => d.aqi !== null).reduce((sum, d) => sum + d.aqi, 0) / seasonData.filter(d => d.aqi !== null).length).toFixed(1))
                    : null
            };
        }
    });

    return seasonalData;
}

function analyzeAQIImpact(data: any[]) {
    const aqiData = data.filter(d => d.aqi !== null && d.aqi !== undefined);
    if (aqiData.length < 3) return null;

    // Categorize by US EPA standards (1-6 scale)
    const categories = {
        good: aqiData.filter(d => d.aqi === 1),        // Good
        moderate: aqiData.filter(d => d.aqi === 2),    // Moderate  
        sensitive: aqiData.filter(d => d.aqi === 3),   // Unhealthy for Sensitive Groups
        unhealthy: aqiData.filter(d => d.aqi >= 4)     // Unhealthy and above
    };

    const result: any = {};
    Object.entries(categories).forEach(([category, categoryData]) => {
        if (categoryData.length > 0) {
            result[category] = {
                avgMood: Number((categoryData.reduce((sum, d) => sum + d.mood, 0) / categoryData.length).toFixed(3)),
                count: categoryData.length,
                percentage: Number(((categoryData.length / aqiData.length) * 100).toFixed(1))
            };
        }
    });

    return result;
}