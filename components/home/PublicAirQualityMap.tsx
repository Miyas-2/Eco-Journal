'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { AirQualityData, EmotionHeatmapData, AqiLevel, AqiColorMapping } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';

// Dynamic import with SSR disabled
const MapComponent = dynamic(() => import('./MapComponent'), {
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

// Emotion color mappings
const emotionColorMap: Record<string, string> = {
    'Joy': '#FFCD29',
    'Fear': '#A375FF',
    'Anger': '#FF5757',
    'Trust': '#73E2A7',
    'Disgust': '#8C7851',
    'Sadness': '#1C77C3',
    'Surprise': '#FF9A3C',
    'Anticipation': '#40BFAA',
    'Unknown': '#AAAAAA'
};

// Emotion icon mappings (emoji representation)
const emotionIconMap: Record<string, string> = {
    'Joy': '😄',
    'Fear': '😨',
    'Anger': '😠',
    'Trust': '🤝',
    'Disgust': '🤢',
    'Sadness': '😢',
    'Surprise': '😲',
    'Anticipation': '🤔',
    'Unknown': '❓'
};

export default function PublicAirQualityMap() {
    const [weatherData, setWeatherData] = useState<AirQualityData[]>([]);
    const [journalData, setJournalData] = useState<EmotionHeatmapData[]>([]);
    const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days'>('today');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>([-6.2, 106.816666]); // Default to Jakarta
    const [isAverage, setIsAverage] = useState<boolean>(false);
    const [visualMode, setVisualMode] = useState<'default' | 'moodscore'>('default');
    

    useEffect(() => {
        setLoading(true);
        setError(null);

        fetch(`/api/public/air-quality?timeRange=${timeRange}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Failed to fetch data: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                console.log('Public data response:', data);

                if ((!data.weatherData || data.weatherData.length === 0) &&
                    (!data.journalData || data.journalData.length === 0)) {
                    setError("No data available for the selected period");
                    setWeatherData([]);
                    setJournalData([]);
                } else {
                    setWeatherData(data.weatherData || []);
                    setJournalData(data.journalData || []);

                    // Set map center based on available data
                    if (data.weatherData && data.weatherData.length > 0) {
                        setMapCenter([data.weatherData[0].location.lat, data.weatherData[0].location.lon]);
                    } else if (data.journalData && data.journalData.length > 0) {
                        setMapCenter([data.journalData[0].location.lat, data.journalData[0].location.lon]);
                    }

                    // Set isAverage based on API response
                    setIsAverage(data.isAverage || false);
                }
            })
            .catch(err => {
                console.error('Error fetching data:', err);
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

    const getEmotionColor = (emotion: string) => {
        return emotionColorMap[emotion] || '#AAAAAA';
    };

    return (
        <div className="w-full shadow-md rounded-lg overflow-hidden">
            <div className="bg-background p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Environmental & Emotional Map</h2>
                    <div className="flex gap-2">
                        <Select
                            value={timeRange}
                            onValueChange={(value) => setTimeRange(value as 'today' | '7days' | '30days')}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Time Range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="7days">Last 7 Days</SelectItem>
                                <SelectItem value="30days">Last 30 Days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
            <div className="p-4">
                {loading ? (
                    <div className="flex justify-center items-center h-[400px]">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="ml-2">Loading data...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col justify-center items-center h-[400px] text-red-500">
                        <p className="mb-4">{error}</p>
                        <Button onClick={() => {
                            setLoading(true);
                            setError(null);
                            fetch(`/api/public/air-quality?timeRange=${timeRange}`)
                                .then(res => res.json())
                                .then(data => {
                                    if ((!data.weatherData || data.weatherData.length === 0) &&
                                        (!data.journalData || data.journalData.length === 0)) {
                                        setError("No data available for the selected period");
                                        setWeatherData([]);
                                        setJournalData([]);
                                    } else {
                                        setWeatherData(data.weatherData || []);
                                        setJournalData(data.journalData || []);
                                        // Set map center
                                        if (data.weatherData && data.weatherData.length > 0) {
                                            setMapCenter([data.weatherData[0].location.lat, data.weatherData[0].location.lon]);
                                        } else if (data.journalData && data.journalData.length > 0) {
                                            setMapCenter([data.journalData[0].location.lat, data.journalData[0].location.lon]);
                                        }
                                        setIsAverage(data.isAverage || false);
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
                                weatherData={weatherData}
                                journalData={journalData}
                                mapCenter={mapCenter}
                                getAqiColor={getAqiColor}
                                getAqiDescription={getAqiDescription}
                                getEmotionColor={getEmotionColor}
                                getEmotionIcon={(emotion) => emotionIconMap[emotion] || '❓'}
                                isAverage={isAverage}
                                timeRange={timeRange}
                            />
                        </div>
                        <div className="mt-4">
                            <div className="flex flex-col gap-2 text-sm">
                                <div className="font-semibold">Map Legend</div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* AQI Legend */}
                                    <div className="border rounded p-2">
                                        <p className="font-medium mb-1">Air Quality (Circles)</p>
                                        <div className="flex flex-wrap gap-2">
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
                                    </div>

                                    {/* Emotion Legend with Icons */}
                                    <div className="border rounded p-2">
                                        <p className="font-medium mb-1">Emotions ({isAverage ? 'Clusters' : 'Points'})</p>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(emotionColorMap).map(([emotion, color]) => (
                                                emotion !== 'Unknown' && (
                                                    <div key={emotion} className="flex items-center">
                                                        <div
                                                            className="w-6 h-6 mr-1 rounded-full flex items-center justify-center text-sm"
                                                            style={{ backgroundColor: color }}
                                                        >
                                                            {emotionIconMap[emotion]}
                                                        </div>
                                                        <span className="text-xs">{emotion}</span>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-xs text-gray-500 mt-2">
                                    <p>
                                        {isAverage 
                                            ? 'Dashed border color around emotion clusters indicates local air quality level.' 
                                            : 'Air quality circles represent regional conditions, while markers show individual journal entries.'}
                                    </p>
                                    <p className="mt-1">
                                        {isAverage
                                            ? 'Larger and more opaque emotion circles indicate more journal entries in that area.'
                                            : 'Hover over any element for quick information, click for details.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}