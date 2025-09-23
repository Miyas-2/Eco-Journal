import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AirQualityData } from '@/types/index';

export async function GET(request: Request) {
    try {
        // Use the same cookie pattern as your mood-trend API
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
        
        const { searchParams } = new URL(request.url);
        const timeRange = searchParams.get('timeRange') || 'today';
        
        // Get session using the same approach as mood-trend
        const { data: { session } } = await supabase.auth.getSession();
        
        // Don't return 401, just log it and return empty data - matching behavior with working APIs
        if (!session) {
            console.log("No session found in air-quality API");
            return NextResponse.json({ 
                data: [], 
                timeRange,
                message: "No authenticated session found" 
            });
        }
        
        // Calculate date range based on timeRange
        const today = new Date();
        let startDate = new Date();
        
        switch(timeRange) {
            case '7days':
                startDate.setDate(today.getDate() - 7);
                break;
            case '30days':
                startDate.setDate(today.getDate() - 30);
                break;
            default: // today
                startDate.setHours(0, 0, 0, 0);
                break;
        }
        
        // Query data - simplify the query
        console.log(`Fetching air quality data for user ${session.user.id} from ${startDate.toISOString()} to ${today.toISOString()}`);
        
        const { data, error } = await supabase
            .from('journal_entries')
            .select('weather_data, created_at, latitude, longitude')
            .eq('user_id', session.user.id)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', today.toISOString())
            .not('weather_data', 'is', null);
        
        if (error) {
            console.error("Database error:", error.message);
            return NextResponse.json({ 
                data: [], 
                timeRange,
                error: error.message
            });
        }
        
        console.log(`Found ${data.length} journal entries with weather data`);
        
        // Transform data for the heatmap
        const airQualityData: AirQualityData[] = data
            .filter(entry => entry.weather_data?.current?.air_quality)
            .map(entry => ({
                location: {
                    lat: entry.latitude || entry.weather_data.location.lat,
                    lon: entry.longitude || entry.weather_data.location.lon,
                    name: entry.weather_data.location.name
                },
                timestamp: entry.created_at,
                airQuality: {
                    aqi: entry.weather_data.current.air_quality['us-epa-index'] || 0,
                    co: entry.weather_data.current.air_quality.co || 0,
                    no2: entry.weather_data.current.air_quality.no2 || 0,
                    o3: entry.weather_data.current.air_quality.o3 || 0,
                    so2: entry.weather_data.current.air_quality.so2 || 0,
                    pm2_5: entry.weather_data.current.air_quality.pm2_5 || 0,
                    pm10: entry.weather_data.current.air_quality.pm10 || 0,
                }
            }));

        console.log(`Transformed ${airQualityData.length} entries with air quality data`);

        return NextResponse.json({ 
            data: airQualityData, 
            timeRange 
        });
        
    } catch (error: any) {
        console.error('Air quality data fetch error:', error.message);
        // Return empty data with error message
        return NextResponse.json({ 
            data: [], 
            error: error.message || 'Failed to fetch air quality data'
        });
    }
}