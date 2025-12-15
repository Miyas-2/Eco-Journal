// app/protected/map/page.tsx - Fixed version
'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Waves, Wind, Moon, TreePine, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const MapView = dynamic(() => import('@/components/home/PublicAirQualityMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="text-slate-500">Loading map...</div>
        </div>
    )
});

interface AirQualityDetails {
    pm2_5: number;
    pm10: number;
    co: number;
    no2: number;
    o3: number;
    so2: number;
    'us-epa-index': number;
    'gb-defra-index': number;
}

interface MapPoint {
    id: string;
    lat: number;
    lng: number;
    emotion: string;
    moodScore: number | null;
    aqi: number | null;
    airQualityDetails: AirQualityDetails | null;
    temperature: number | null;
    condition: string | null;
    timestamp: string;
}

interface Statistics {
    avgAqi: number;
    dominantMood: string;
    totalEntries: number;
    timeRange: string;
}

export default function GlobalMapPage() {
    const [mapData, setMapData] = useState<MapPoint[]>([]);
    const [statistics, setStatistics] = useState<Statistics>({
        avgAqi: 0,
        dominantMood: 'Loading...',
        totalEntries: 0,
        timeRange: 'today'
    });
    const [timeRange, setTimeRange] = useState('today');
    const [loading, setLoading] = useState(true);
    const [showAirQuality, setShowAirQuality] = useState(true);
    const [showMood, setShowMood] = useState(true);
    const [showGreenSpaces, setShowGreenSpaces] = useState(true);

    useEffect(() => {
        fetchMapData();
    }, [timeRange]);

    const fetchMapData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/map/data?timeRange=${timeRange}`);
            const data = await response.json();

            if (data.error) {
                console.error('Error fetching map data:', data.error);
            } else {
                const patchedPoints = (data.points || []).map((point: any) => ({
                    ...point,
                    airQualityDetails: point.airQualityDetails
                        ? {
                            pm2_5: point.airQualityDetails.pm2_5,
                            pm10: point.airQualityDetails.pm10,
                            co: point.airQualityDetails.co,
                            no2: point.airQualityDetails.no2,
                            o3: point.airQualityDetails.o3,
                            so2: point.airQualityDetails.so2,
                            'us-epa-index': point.airQualityDetails['us-epa-index'] ?? 0,
                            'gb-defra-index': point.airQualityDetails['gb-defra-index'] ?? 0,
                        }
                        : null,
                }));
                setMapData(patchedPoints);
                setStatistics(data.statistics || statistics);
            }
        } catch (error) {
            console.error('Error fetching map data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getAqiLabel = (aqi: number) => {
        if (aqi <= 1) return 'Good';
        if (aqi <= 2) return 'Moderate';
        if (aqi <= 3) return 'Unhealthy (Sensitive)';
        if (aqi <= 4) return 'Unhealthy';
        if (aqi <= 5) return 'Very Unhealthy';
        return 'Hazardous';
    };

    return (
        <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap" rel="stylesheet" />

            <div style={{ fontFamily: 'Lexend, sans-serif' }} className="min-h-screen bg-slate-50 dark:bg-[#101a22] md:ml-16">
                <div className="px-4 py-6 md:px-8 lg:px-12">
                    {/* Page Header */}
                    <div className="mb-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                           
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                    Community Map
                                </h1>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Explore how air quality and mood patterns connect across the community
                                </p>
                            </div>

                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                <option value="today">Today</option>
                                <option value="7days">Last 7 Days</option>
                                <option value="30days">Last 30 Days</option>
                            </select>
                        </div>
                    </div>

                    {/* Map and Sidebar Container */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

                        {/* Sidebar */}
                        <aside className="lg:col-span-3 flex flex-col gap-3">

                            {/* Global Overview Card */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                                    Global Overview
                                </h3>

                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex flex-col">
                                        <span className="text-3xl font-bold text-slate-900 dark:text-white">
                                            {statistics.avgAqi}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            Avg AQI ({getAqiLabel(statistics.avgAqi)})
                                        </span>
                                    </div>
                                    <div className="size-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <Waves className="w-5 h-5" />
                                    </div>
                                </div>

                                <div className="w-full h-px bg-slate-200 dark:bg-slate-700 mb-3"></div>

                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                            {statistics.dominantMood}
                                            <Moon className="w-4 h-4 text-blue-500" />
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            Dominant Mood
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Map Layers Card */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                                    Map Layers
                                </h3>

                                <label className="flex items-center justify-between cursor-pointer group mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                            <Wind className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Air Quality
                                        </span>
                                    </div>
                                    <input
                                        checked={showAirQuality}
                                        onChange={(e) => setShowAirQuality(e.target.checked)}
                                        className="form-checkbox h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                        type="checkbox"
                                    />
                                </label>

                                <label className="flex items-center justify-between cursor-pointer group mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Community Mood
                                        </span>
                                    </div>
                                    <input
                                        checked={showMood}
                                        onChange={(e) => setShowMood(e.target.checked)}
                                        className="form-checkbox h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                        type="checkbox"
                                    />
                                </label>

                                <label className="flex items-center justify-between cursor-pointer group">
                                    <div className="flex items-center gap-2">
                                        <div className="size-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                                            <TreePine className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Green Spaces
                                        </span>
                                    </div>
                                    <input
                                        checked={showGreenSpaces}
                                        onChange={(e) => setShowGreenSpaces(e.target.checked)}
                                        className="form-checkbox h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                        type="checkbox"
                                    />
                                </label>
                            </div>

                            {/* Legend Card */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                                    Legend
                                </h3>

                                <div className="mb-3">
                                    <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                        <span>Good</span>
                                        <span>Hazardous</span>
                                    </div>
                                    <div className="h-2.5 w-full rounded-full flex overflow-hidden">
                                        <div className="flex-1 bg-emerald-400"></div>
                                        <div className="flex-1 bg-yellow-400"></div>
                                        <div className="flex-1 bg-orange-400"></div>
                                        <div className="flex-1 bg-red-500"></div>
                                        <div className="flex-1 bg-red-700"></div>
                                        <div className="flex-1 bg-red-900"></div>
                                    </div>
                                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                        Air Quality Index (EPA 1-6)
                                    </p>
                                </div>

                                <div className="mb-3">
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-2">
                                        Pollutants
                                    </span>
                                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded">
                                            <strong className="text-slate-700 dark:text-slate-300">PM2.5</strong>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Fine particles</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded">
                                            <strong className="text-slate-700 dark:text-slate-300">PM10</strong>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Coarse particles</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded">
                                            <strong className="text-slate-700 dark:text-slate-300">O3</strong>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Ozone</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded">
                                            <strong className="text-slate-700 dark:text-slate-300">CO</strong>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Carbon monoxide</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded">
                                            <strong className="text-slate-700 dark:text-slate-300">NO2</strong>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Nitrogen dioxide</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded">
                                            <strong className="text-slate-700 dark:text-slate-300">SO2</strong>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Sulfur dioxide</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-2">
                                        Community Mood
                                    </span>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 p-1.5 rounded">
                                            <span className="size-2.5 rounded-full bg-yellow-400"></span>
                                            <span className="text-xs text-slate-700 dark:text-slate-300">Happy</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 p-1.5 rounded">
                                            <span className="size-2.5 rounded-full bg-blue-400"></span>
                                            <span className="text-xs text-slate-700 dark:text-slate-300">Calm</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded">
                                            <span className="size-2.5 rounded-full bg-slate-400"></span>
                                            <span className="text-xs text-slate-700 dark:text-slate-300">Anxious</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900/50 p-1.5 rounded">
                                            <span className="size-2.5 rounded-full bg-gray-500"></span>
                                            <span className="text-xs text-slate-700 dark:text-slate-300">Sad</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-2">
                                        Green Spaces
                                    </span>
                                    <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 p-1.5 rounded">
                                        <div className="w-3 h-3 rounded bg-emerald-400/20 border-2 border-emerald-400"></div>
                                        <span className="text-xs text-slate-700 dark:text-slate-300">Parks & Forests</span>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Map Container */}
                        <div className="lg:col-span-9 h-[600px] lg:h-[calc(100vh-180px)] relative rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 z-0">

                            {/* Live Data Badge */}
                            <div className="absolute top-4 left-4 z-[100] flex items-center gap-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                    Live Data
                                </span>
                            </div>

                            {/* Map Component */}
                            <MapView
                                mapData={mapData}
                                showAirQuality={showAirQuality}
                                showMood={showMood}
                                showGreenSpaces={showGreenSpaces}
                            />

                            {/* Refresh Button */}
                            <div className="absolute bottom-4 right-4 z-[100]">
                                <button
                                    onClick={() => fetchMapData()}
                                    className="size-10 rounded-lg bg-white dark:bg-slate-800 shadow-md text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                                    title="Refresh"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}