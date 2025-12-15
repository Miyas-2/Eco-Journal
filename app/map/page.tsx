// app/map/page.tsx - Updated with proper legend
'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Waves, Wind, Moon, TreePine } from 'lucide-react';

const MapView = dynamic(() => import('@/components/home/PublicAirQualityMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-[#eef4f8] dark:bg-[#1a2633]">
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
                // Patch airQualityDetails to include missing properties if needed
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
        if (aqi <= 50) return 'Good';
        if (aqi <= 100) return 'Moderate';
        if (aqi <= 150) return 'Unhealthy (Sensitive)';
        if (aqi <= 200) return 'Unhealthy';
        if (aqi <= 300) return 'Very Unhealthy';
        return 'Hazardous';
    };

    return (
        <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" crossOrigin="anonymous" href="https://fonts.gstatic.com" />
            <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap" rel="stylesheet" />

            <div className="relative flex min-h-screen w-full flex-col bg-[#f6f7f8] dark:bg-[#101a22] text-slate-900 dark:text-white overflow-x-hidden" style={{ fontFamily: 'Lexend, sans-serif' }}>

                {/* Header */}
                <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#101a22]/80 backdrop-blur-md px-6 py-4 lg:px-10">
                    <div className="flex items-center gap-4 text-slate-900 dark:text-white">
                        <div className="size-8 text-[#2b9dee]">
                            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <g clipPath="url(#clip0_6_535)">
                                    <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
                                </g>
                                <defs>
                                    <clipPath id="clip0_6_535"><rect fill="white" height="48" width="48"></rect></clipPath>
                                </defs>
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold leading-tight tracking-[-0.015em] text-slate-900 dark:text-white">Jurnalin</h2>
                    </div>

                    <div className="flex flex-1 justify-end gap-3 items-center">
                        <Link href="/protected">
                            <button className="flex items-center justify-center overflow-hidden rounded-lg h-10 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-4">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span className="hidden md:inline">Dashboard</span>
                            </button>
                        </Link>

                        <button className="flex items-center justify-center overflow-hidden rounded-lg h-10 bg-[#2b9dee]/10 text-[#2b9dee] gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-4">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                            <span className="hidden md:inline">Global Map</span>
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 w-full px-4 py-6 md:px-8 lg:px-12 xl:px-16 flex justify-center">
                    <div className="max-w-[1440px] w-full flex flex-col gap-6">

                        {/* Page Title and Controls */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <div className="flex flex-col gap-1">
                                <h1 className="text-2xl md:text-3xl font-light text-slate-900 dark:text-white tracking-[-0.02em]">
                                    Environmental & Mood Map
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 text-base font-light leading-relaxed">
                                    See how air quality and nature shape community well-being across locations.
                                </p>
                            </div>

                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                <option value="today">Today</option>
                                <option value="7days">Last 7 Days</option>
                                <option value="30days">Last 30 Days</option>
                            </select>
                        </div>

                        {/* Map and Sidebar Container */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[calc(100vh-180px)] min-h-[600px]">

                            {/* Sidebar */}
                            <aside className="lg:col-span-3 flex flex-col gap-6 h-full overflow-y-auto hide-scrollbar pr-1">

                                {/* Global Overview Card */}
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Global Overview</h3>

                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-3xl font-light text-slate-900 dark:text-white">{statistics.avgAqi}</span>
                                            <span className="text-xs text-slate-500 font-medium">Avg AQI ({getAqiLabel(statistics.avgAqi)})</span>
                                        </div>
                                        <div className="size-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                                            <Waves className="w-5 h-5" />
                                        </div>
                                    </div>

                                    <div className="w-full h-px bg-slate-100 dark:bg-slate-700 mb-4"></div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                                {statistics.dominantMood}
                                                <Moon className="w-[18px] h-[18px] text-blue-400" />
                                            </span>
                                            <span className="text-xs text-slate-500 font-medium">Dominant Mood</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Map Layers Card */}
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Map Layers</h3>

                                    <label className="flex items-center justify-between cursor-pointer group mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-200 transition-colors">
                                                <Wind className="w-[18px] h-[18px]" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Air Quality</span>
                                        </div>
                                        <input
                                            checked={showAirQuality}
                                            onChange={(e) => setShowAirQuality(e.target.checked)}
                                            className="form-checkbox h-5 w-5 text-[#2b9dee] rounded border-slate-300 focus:ring-[#2b9dee]/50"
                                            type="checkbox"
                                        />
                                    </label>

                                    <label className="flex items-center justify-between cursor-pointer group mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 transition-colors">
                                                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Community Mood</span>
                                        </div>
                                        <input
                                            checked={showMood}
                                            onChange={(e) => setShowMood(e.target.checked)}
                                            className="form-checkbox h-5 w-5 text-[#2b9dee] rounded border-slate-300 focus:ring-[#2b9dee]/50"
                                            type="checkbox"
                                        />
                                    </label>

                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:bg-green-200 transition-colors">
                                                <TreePine className="w-[18px] h-[18px]" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Green Spaces</span>
                                        </div>
                                        <input
                                            checked={showGreenSpaces}
                                            onChange={(e) => setShowGreenSpaces(e.target.checked)}
                                            className="form-checkbox h-5 w-5 text-[#2b9dee] rounded border-slate-300 focus:ring-[#2b9dee]/50"
                                            type="checkbox"
                                        />
                                    </label>
                                </div>


                                {/* Legend Card */}
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex-1">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Legend</h3>

                                    <div className="mb-6">
                                        <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                                            <span>Good</span>
                                            <span>Moderate</span>
                                            <span>Unhealthy</span>
                                        </div>
                                        <div className="h-4 w-full rounded-md flex overflow-hidden shadow-sm">
                                            <div className="flex-1 bg-green-400"></div>
                                            <div className="flex-1 bg-yellow-300"></div>
                                            <div className="flex-1 bg-orange-400"></div>
                                            <div className="flex-1 bg-red-400"></div>
                                        </div>
                                        <p className="mt-2 text-xs text-slate-400">AQI levels (0-50-100-150+)</p>
                                    </div>

                                    <div className="mb-6">
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-3">Pollutants Measured</span>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                                                <strong className="text-slate-700 dark:text-slate-300">PM2.5</strong>
                                                <p className="text-[10px] text-slate-500">Fine particles</p>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                                                <strong className="text-slate-700 dark:text-slate-300">PM10</strong>
                                                <p className="text-[10px] text-slate-500">Coarse particles</p>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                                                <strong className="text-slate-700 dark:text-slate-300">O3</strong>
                                                <p className="text-[10px] text-slate-500">Ozone</p>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                                                <strong className="text-slate-700 dark:text-slate-300">CO</strong>
                                                <p className="text-[10px] text-slate-500">Carbon monoxide</p>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                                                <strong className="text-slate-700 dark:text-slate-300">NO2</strong>
                                                <p className="text-[10px] text-slate-500">Nitrogen dioxide</p>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                                                <strong className="text-slate-700 dark:text-slate-300">SO2</strong>
                                                <p className="text-[10px] text-slate-500">Sulfur dioxide</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-3">Community Mood</span>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                                                <span className="size-3 rounded-full bg-yellow-400"></span>
                                                <span className="text-xs text-slate-600 dark:text-slate-300">Happy</span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                                <span className="size-3 rounded-full bg-blue-400"></span>
                                                <span className="text-xs text-slate-600 dark:text-slate-300">Calm</span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                                                <span className="size-3 rounded-full bg-slate-400"></span>
                                                <span className="text-xs text-slate-600 dark:text-slate-300">Anxious</span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
                                                <span className="size-3 rounded-full bg-gray-500"></span>
                                                <span className="text-xs text-slate-600 dark:text-slate-300">Sad</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-3">Green Spaces</span>
                                        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                            <div className="w-4 h-4 rounded bg-emerald-400/20 border-2 border-emerald-400"></div>
                                            <span className="text-xs text-slate-600 dark:text-slate-300">Parks & Forests</span>
                                        </div>
                                    </div>
                                </div>
                            </aside>

                            {/* Map Container */}
                            <div className="lg:col-span-9 h-full relative rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 bg-[#eef4f8] dark:bg-[#1a2633]">

                                {/* Live Data Badge */}
                                <div className="absolute top-6 left-6 z-10 flex items-center gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                    </span>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Live Data</span>
                                </div>

                                {/* Map Component */}
                                <MapView
                                    mapData={mapData}
                                    showAirQuality={showAirQuality}
                                    showMood={showMood}
                                    showGreenSpaces={showGreenSpaces}
                                />

                                {/* Map Controls */}
                                <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
                                    <button
                                        onClick={() => fetchMapData()}
                                        className="size-10 rounded-xl bg-white dark:bg-slate-800 shadow-md text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
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
                </main>

                <style jsx global>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
            </div>
        </>
    );
}