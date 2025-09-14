'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { AirQualityData, AqiLevel, AqiColorMapping } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';

// Dynamic import with SSR disabled
const MapComponent = dynamic(() => import('../home/MapComponent'), {
    ssr: false,
    loading: () => (
        <div className="flex justify-center items-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading map...</span>
        </div>
    )
});

// AQI color mappings based on US EPA standard
const aqiColorMappings: AqiColorMapping[] = [
  { 
    level: AqiLevel.GOOD, 
    color: '#00E400', 
    range: [0, 1], 
    description: 'Good' 
  },
  { 
    level: AqiLevel.MODERATE, 
    color: '#FFFF00', 
    range: [2, 2], 
    description: 'Moderate' 
  },
  { 
    level: AqiLevel.UNHEALTHY_SENSITIVE, 
    color: '#FF7E00', 
    range: [3, 3], 
    description: 'Unhealthy for Sensitive Groups' 
  },
  { 
    level: AqiLevel.UNHEALTHY, 
    color: '#FF0000', 
    range: [4, 4], 
    description: 'Unhealthy' 
  },
  { 
    level: AqiLevel.VERY_UNHEALTHY, 
    color: '#99004C', 
    range: [5, 5], 
    description: 'Very Unhealthy' 
  },
  { 
    level: AqiLevel.HAZARDOUS, 
    color: '#7E0023', 
    range: [6, 6], 
    description: 'Hazardous' 
  }
];

export default function AirQualityHeatmap() {
    const [airQualityData, setAirQualityData] = useState<AirQualityData[]>([]);
    const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days'>('today');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>([-6.2, 106.816666]);

    // Simple effect - exactly matching MoodTrendChart pattern
    useEffect(() => {
        setLoading(true);
        fetch(`/api/air-quality?timeRange=${timeRange}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Failed to fetch air quality data: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                if (!data.data || data.data.length === 0) {
                    setError("No air quality data available for the selected period");
                    setAirQualityData([]);
                } else {
                    setAirQualityData(data.data);
                    setMapCenter([data.data[0].location.lat, data.data[0].location.lon]);
                }
            })
            .catch(err => {
                console.error("Error fetching air quality data:", err);
                setError(err.message || "An unknown error occurred");
            })
            .finally(() => setLoading(false));
    }, [timeRange]);

    const getAqiColor = (aqi: number) => {
        const mapping = aqiColorMappings.find(m => aqi >= m.range[0] && aqi <= m.range[1]);
        return mapping ? mapping.color : '#CCCCCC';
    };

    const getAqiDescription = (aqi: number) => {
        const mapping = aqiColorMappings.find(m => aqi >= m.range[0] && aqi <= m.range[1]);
        return mapping ? mapping.description : 'Unknown';
    };

    return (
        <Card className="w-full shadow-md">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-bold">Air Quality Heatmap</CardTitle>
                    <Select
                        value={timeRange}
                        onValueChange={(value) => setTimeRange(value as 'today' | '7days' | '30days')}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Time Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="7days">Last 7 Days</SelectItem>
                            <SelectItem value="30days">Last 30 Days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-[400px]">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="ml-2">Loading air quality data...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col justify-center items-center h-[400px] text-red-500">
                        <p className="mb-4">{error}</p>
                        <Button onClick={() => {
                            setLoading(true);
                            setError(null);
                            fetch(`/api/air-quality?timeRange=${timeRange}`)
                                .then(res => res.json())
                                .then(data => {
                                    if (!data.data || data.data.length === 0) {
                                        setError("No air quality data available for the selected period");
                                        setAirQualityData([]);
                                    } else {
                                        setAirQualityData(data.data);
                                        setMapCenter([data.data[0].location.lat, data.data[0].location.lon]);
                                    }
                                })
                                .catch(err => setError(err.message || "An unknown error occurred"))
                                .finally(() => setLoading(false));
                        }}>Try Again</Button>
                    </div>
                ) : (
                    <>
                        <div className="h-[400px] w-full rounded-md overflow-hidden">
                            <MapComponent
                                airQualityData={airQualityData}
                                mapCenter={mapCenter}
                                getAqiColor={getAqiColor}
                                getAqiDescription={getAqiDescription}
                            />
                        </div>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {aqiColorMappings.map((mapping) => (
                                <div key={mapping.level} className="flex items-center">
                                    <div
                                        className="w-4 h-4 mr-1 rounded-full"
                                        style={{ backgroundColor: mapping.color }}
                                    ></div>
                                    <span className="text-xs">{mapping.description}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}