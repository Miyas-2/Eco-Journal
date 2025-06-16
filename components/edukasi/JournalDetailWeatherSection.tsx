'use client';

import { WeatherApiResponse } from '@/types';

interface JournalDetailWeatherSectionProps {
    weatherData: WeatherApiResponse | null;
    journalCreatedAt: string;
}

export default function JournalDetailWeatherSection({ weatherData, journalCreatedAt }: JournalDetailWeatherSectionProps) {
    if (!weatherData) {
        return (
            <div className="card-organic rounded-2xl md:rounded-3xl p-4 md:p-6 text-center bg-gradient-to-br from-stone-50/50 to-white/80 border border-stone-200/30">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-3 md:mb-4 bg-gradient-to-br from-stone-100 to-stone-200">
                    <span className="text-lg md:text-2xl">🌫️</span>
                </div>
                <p className="text-stone-500 text-sm md:text-base">Data cuaca tidak tersedia untuk jurnal ini.</p>
            </div>
        );
    }

    const { location, current } = weatherData;
    const airQuality = current.air_quality;

    const getUVIndexColor = (uv: number) => {
        if (uv <= 2) return { bg: 'bg-green-500', text: 'Rendah' };
        if (uv <= 5) return { bg: 'bg-yellow-500', text: 'Sedang' };
        if (uv <= 7) return { bg: 'bg-orange-500', text: 'Tinggi' };
        if (uv <= 10) return { bg: 'bg-red-500', text: 'Sangat Tinggi' };
        return { bg: 'bg-purple-600', text: 'Ekstrem' };
    };

    const getPM25Status = (pm25: number) => {
        if (pm25 <= 12) return { bg: 'bg-green-500', text: 'Baik' };
        if (pm25 <= 35.4) return { bg: 'bg-yellow-500', text: 'Sedang' };
        if (pm25 <= 55.4) return { bg: 'bg-orange-500', text: 'Tidak Sehat' };
        if (pm25 <= 150.4) return { bg: 'bg-red-500', text: 'Tidak Sehat' };
        return { bg: 'bg-purple-600', text: 'Berbahaya' };
    };

    const uvInfo = getUVIndexColor(current.uv);
    const pm25Info = airQuality?.pm2_5 ? getPM25Status(airQuality.pm2_5) : null;

    return (
        <section className="space-y-4 md:space-y-6">
            {/* Header Section - Compact */}
            <div className="card-organic rounded-2xl md:rounded-3xl p-4 md:p-8 bg-gradient-to-br from-sky-400/20 via-blue-400/20 to-indigo-400/20 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-2 right-2 md:top-4 md:right-4 w-16 h-16 md:w-32 md:h-32 bg-blue-400 rounded-full blur-2xl md:blur-3xl"></div>
                    <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 w-12 h-12 md:w-24 md:h-24 bg-sky-400 rounded-full blur-xl md:blur-2xl"></div>
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg shadow-sky-200/40 float-organic">
                            <span className="text-lg md:text-2xl">🌤️</span>
                        </div>
                        <div>
                            <h2 className="text-lg md:text-2xl font-bold text-stone-700">Data Cuaca & Lingkungan</h2>
                            <p className="text-stone-500 text-sm md:text-base">Kondisi saat jurnal dibuat</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Combined Weather & Location - Mobile Optimized */}
            <div className="card-organic rounded-2xl md:rounded-3xl p-4 md:p-6">
                {/* Location Info - Condensed */}
                <div className="mb-4 md:mb-6">
                    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                        <div className="w-6 h-6 md:w-10 md:h-10 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-lg md:rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200/40">
                            <span className="text-sm md:text-lg">📍</span>
                        </div>
                        <h3 className="text-base md:text-lg font-semibold text-stone-700">
                            {location.name}, {location.region}
                        </h3>
                    </div>
                </div>

                {/* Main Weather Info - Compact Grid */}
                <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
                    <div className="card-organic rounded-xl md:rounded-2xl p-3 md:p-6 text-center bg-gradient-to-br from-blue-50/50 to-sky-50/50 border border-blue-200/30">
                        <div className="text-lg md:text-3xl mb-1 md:mb-2">🌤️</div>
                        <div className="text-xs md:text-sm text-stone-500 mb-1">Kondisi</div>
                        <div className="font-semibold text-stone-700 text-xs md:text-base leading-tight">{current.condition.text}</div>
                    </div>
                    <div className="card-organic rounded-xl md:rounded-2xl p-3 md:p-6 text-center bg-gradient-to-br from-red-50/50 to-orange-50/50 border border-red-200/30">
                        <div className="text-lg md:text-3xl mb-1 md:mb-2">🌡️</div>
                        <div className="text-xs md:text-sm text-stone-500 mb-1">Suhu</div>
                        <div className="font-semibold text-stone-700 text-xs md:text-base">{current.temp_c}°C</div>
                        <div className="text-xs text-stone-500 hidden md:block">Terasa {current.feelslike_c}°C</div>
                    </div>
                    <div className="card-organic rounded-xl md:rounded-2xl p-3 md:p-6 text-center bg-gradient-to-br from-teal-50/50 to-cyan-50/50 border border-teal-200/30">
                        <div className="text-lg md:text-3xl mb-1 md:mb-2">💧</div>
                        <div className="text-xs md:text-sm text-stone-500 mb-1">Kelembapan</div>
                        <div className="font-semibold text-stone-700 text-xs md:text-base">{current.humidity}%</div>
                    </div>
                </div>

                {/* Additional Weather Metrics - Compact */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                    <div className="bg-gradient-to-r from-stone-50 to-white rounded-lg md:rounded-xl p-2 md:p-3 border border-stone-200/50 text-center">
                        <div className="text-sm md:text-lg mb-1">📊</div>
                        <div className="text-xs text-stone-500 mb-1">Tekanan</div>
                        <div className="font-medium text-stone-700 text-xs md:text-sm">{current.pressure_mb} mb</div>
                    </div>
                    <div className="bg-gradient-to-r from-stone-50 to-white rounded-lg md:rounded-xl p-2 md:p-3 border border-stone-200/50 text-center">
                        <div className="text-sm md:text-lg mb-1">☀️</div>
                        <div className="text-xs text-stone-500 mb-1">UV Index</div>
                        <div className="font-medium text-stone-700 text-xs md:text-sm">{current.uv}</div>
                    </div>
                    <div className="bg-gradient-to-r from-stone-50 to-white rounded-lg md:rounded-xl p-2 md:p-3 border border-stone-200/50 text-center">
                        <div className="text-sm md:text-lg mb-1">💨</div>
                        <div className="text-xs text-stone-500 mb-1">Angin</div>
                        <div className="font-medium text-stone-700 text-xs md:text-sm">{current.wind_kph} km/h</div>
                    </div>
                    <div className="bg-gradient-to-r from-stone-50 to-white rounded-lg md:rounded-xl p-2 md:p-3 border border-stone-200/50 text-center">
                        <div className="text-sm md:text-lg mb-1">👁️</div>
                        <div className="text-xs text-stone-500 mb-1">Visibilitas</div>
                        <div className="font-medium text-stone-700 text-xs md:text-sm">{current.vis_km} km</div>
                    </div>
                </div>
            </div>

            {/* Air Quality Section - Simplified for Mobile */}
            {airQuality && airQuality.pm2_5 !== undefined && (
                <div className="card-organic rounded-2xl md:rounded-3xl p-4 md:p-6">
                    <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                        <div className="w-6 h-6 md:w-10 md:h-10 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-lg md:rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200/40">
                            <span className="text-sm md:text-lg">🏭</span>
                        </div>
                        <h3 className="text-base md:text-lg font-semibold text-stone-700">Kualitas Udara</h3>
                    </div>

                    {/* PM2.5 Status Card - Simplified */}
                    {pm25Info && (
                        <div className="card-organic rounded-xl md:rounded-2xl p-4 md:p-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border border-indigo-200/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xs md:text-sm text-stone-500 mb-1">Status PM2.5</div>
                                    <div className="text-lg md:text-2xl font-bold text-stone-700">
                                        {airQuality.pm2_5.toFixed(1)} µg/m³
                                    </div>
                                </div>
                                <div className={`px-2 md:px-4 py-1 md:py-2 rounded-full font-medium text-white ${pm25Info.bg} shadow-lg text-xs md:text-sm`}>
                                    {pm25Info.text}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Show warning only on mobile if air quality is bad */}
                    {pm25Info && airQuality.pm2_5 > 35 && (
                        <div className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200/50 rounded-xl md:hidden">
                            <p className="text-xs text-orange-700">
                                ⚠️ Kualitas udara tidak baik. Gunakan masker jika keluar rumah.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Environmental Impact Note - Desktop Only */}
            <div className="hidden md:block card-organic rounded-3xl p-6 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 border border-emerald-200/30">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200/40 mt-1">
                        <span className="text-sm">💡</span>
                    </div>
                    <div>
                        <h4 className="font-semibold text-stone-700 mb-2">Catatan Lingkungan</h4>
                        <p className="text-sm text-stone-600 leading-relaxed">
                            Data cuaca dan kualitas udara ini dapat mempengaruhi mood dan kesehatan Anda. 
                            Kondisi lingkungan saat ini terekam sebagai konteks untuk memahami pola journaling Anda.
                        </p>
                        {pm25Info && airQuality?.pm2_5 && airQuality.pm2_5 > 35 && (
                            <div className="mt-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200/50 rounded-xl">
                                <p className="text-xs text-orange-700">
                                    ⚠️ Kualitas udara saat ini tidak baik. Pastikan untuk mengurangi aktivitas outdoor 
                                    dan gunakan masker jika harus keluar rumah.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}