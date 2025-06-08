'use client';

import { useState } from 'react'; // useState mungkin tidak lagi dibutuhkan jika hanya untuk modal
import { WeatherApiResponse } from '@/types';
// import { Lightbulb } from 'lucide-react'; // Hapus jika tidak ada lagi Lightbulb yang digunakan
// import FunFactModal from './FunFactModal'; // HAPUS BARIS INI

interface JournalDetailWeatherSectionProps {
    weatherData: WeatherApiResponse | null;
    journalCreatedAt: string;
}
export default function JournalDetailWeatherSection({ weatherData, journalCreatedAt }: JournalDetailWeatherSectionProps) {
    // HAPUS STATE BERIKUT JIKA HANYA UNTUK MODAL FUNFACT:
    // const [isModalOpen, setIsModalOpen] = useState(false);
    // const [modalTitle, setModalTitle] = useState('');
    // const [modalContent, setModalContent] = useState('');
    // const [isLoadingFact, setIsLoadingFact] = useState(false);

    // HAPUS FUNGSI BERIKUT:
    // const handleShowFact = async (
    //     indicatorTypeForTitle: string,
    //     value: number | string,
    //     unit?: string,
    //     generalContextForAI?: string
    // ) => {
    //     // ...isi fungsi handleShowFact...
    // };

    if (!weatherData) {
        return <p className="text-sm text-muted-foreground">Data cuaca tidak tersedia untuk jurnal ini.</p>;
    }

    const { location, current } = weatherData;
    const airQuality = current.air_quality;

    const renderIndicatorCard = (
        label: string,
        value?: number,
        unit?: string,
        // contextForAI?: string, // Hapus jika hanya untuk funfact
        valueFixed?: number
    ) => {
        if (value === undefined) return null;
        return (
            <div className="bg-white p-2 rounded border">
                <div className="font-medium flex items-center justify-between">
                    {label}
                    {/* HAPUS LIGHTBULB ICON DARI SINI 
                       <Lightbulb
                        className="h-4 w-4 text-yellow-400 hover:text-yellow-500 cursor-pointer ml-1 transition-colors"
                        onClick={() => handleShowFact(label, value, unit, contextForAI || label)}
                        aria-label={`Info tentang ${label}`}
                    />
                    */}
                </div>
                <div>{value.toFixed(valueFixed !== undefined ? valueFixed : 1)} {unit}</div>
            </div>
        );
    };

    const renderIndexDisplay = (
        label: string,
        indexValue?: number,
        indexText?: string,
        bgColorClass?: string
        // contextForAI?: string // Hapus jika hanya untuk funfact
    ) => {
        if (indexValue === undefined) return null;
        return (
            <div className="bg-white p-2 rounded border flex justify-between items-center">
                <span className="font-medium">{label}:</span>
                <span className={`px-2 py-1 text-xs rounded text-white ${bgColorClass}`}>
                    {indexValue} - {indexText}
                    {/* HAPUS LIGHTBULB ICON DARI SINI */}
                </span>
            </div>
        );
    };

    return (
        <>
            <section>
                <h2 className="text-xl font-semibold mb-2 flex items-center">
                    <span className="mr-2">🌤️</span> Data Cuaca & Lingkungan Saat Itu
                </h2>
                <div className="bg-muted/30 p-4 rounded-md text-sm space-y-3">
                    {/* ... (bagian lokasi tetap sama) ... */}
                    <div className="border-b pb-2">
                        <h4 className="font-medium text-base mb-1">📍 Lokasi</h4>
                        <div><strong>Nama:</strong> {location.name}</div>
                        <div><strong>Wilayah:</strong> {location.region}, {location.country}</div>
                        <div><strong>Koordinat:</strong> {location.lat}°, {location.lon}°</div>
                        <div><strong>Zona Waktu:</strong> {location.tz_id}</div>
                    </div>

                    <div className="border-b pb-2">
                        <h4 className="font-medium text-base mb-1">☀️ Kondisi Cuaca</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div><strong>Cuaca:</strong> {current.condition.text}</div>
                            <div><strong>Suhu:</strong> {current.temp_c}°C (terasa {current.feelslike_c}°C)</div>
                            <div><strong>Kelembapan:</strong> {current.humidity}%</div>
                            <div><strong>Tekanan Udara:</strong> {current.pressure_mb} mb</div>
                            <div><strong>Visibilitas:</strong> {current.vis_km} km</div>
                            <div className="flex items-center justify-between">
                                <span><strong>Indeks UV:</strong> {current.uv}</span>
                                {/* HAPUS LIGHTBULB ICON DARI SINI */}
                            </div>
                        </div>
                    </div>

                    {/* ... (bagian kualitas udara tetap sama, tapi tanpa ikon Lightbulb di dalamnya) ... */}
                    {airQuality && (
                        <div>
                            <h4 className="font-medium text-base mb-1">🏭 Kualitas Udara</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mb-2">
                                {renderIndicatorCard("PM2.5", airQuality.pm2_5, "µg/m³")}
                                {renderIndicatorCard("PM10", airQuality.pm10, "µg/m³")}
                                {renderIndicatorCard("CO", airQuality.co, "µg/m³", 2)}
                                {renderIndicatorCard("NO₂", airQuality.no2, "µg/m³", 2)}
                                {renderIndicatorCard("O₃", airQuality.o3, "µg/m³", 2)}
                                {renderIndicatorCard("SO₂", airQuality.so2, "µg/m³", 2)}
                            </div>

                            <div className="mt-2 text-xs space-y-2">
                                {airQuality.pm2_5 !== undefined && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-medium">Status Kualitas Udara (PM2.5):</span>
                                        <span className={`px-2 py-1 rounded text-white ${airQuality.pm2_5 <= 12 ? 'bg-green-500' :
                                            airQuality.pm2_5 <= 35.4 ? 'bg-yellow-500 text-black' :
                                                airQuality.pm2_5 <= 55.4 ? 'bg-orange-500' :
                                                    airQuality.pm2_5 <= 150.4 ? 'bg-red-500' :
                                                        airQuality.pm2_5 <= 250.4 ? 'bg-purple-600' : 'bg-maroon-700'
                                            }`}>
                                            {airQuality.pm2_5 <= 12 ? 'Baik' :
                                                airQuality.pm2_5 <= 35.4 ? 'Sedang' :
                                                    airQuality.pm2_5 <= 55.4 ? 'Tidak Sehat (Kelompok Sensitif)' :
                                                        airQuality.pm2_5 <= 150.4 ? 'Tidak Sehat' :
                                                            airQuality.pm2_5 <= 250.4 ? 'Sangat Tidak Sehat' : 'Berbahaya'}
                                            {/* HAPUS LIGHTBULB ICON DARI SINI */}
                                        </span>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {renderIndexDisplay(
                                        "US EPA Index",
                                        airQuality['us-epa-index'],
                                        airQuality['us-epa-index'] !== undefined ? (
                                            airQuality['us-epa-index'] <= 1 ? 'Good' :
                                                airQuality['us-epa-index'] <= 2 ? 'Moderate' :
                                                    airQuality['us-epa-index'] <= 3 ? 'Unhealthy for Sensitive' :
                                                        airQuality['us-epa-index'] <= 4 ? 'Unhealthy' :
                                                            airQuality['us-epa-index'] <= 5 ? 'Very Unhealthy' : 'Hazardous'
                                        ) : '',
                                        airQuality['us-epa-index'] !== undefined ? (
                                            airQuality['us-epa-index'] <= 1 ? 'bg-green-500' :
                                                airQuality['us-epa-index'] <= 2 ? 'bg-yellow-500 text-black' :
                                                    airQuality['us-epa-index'] <= 3 ? 'bg-orange-500' :
                                                        airQuality['us-epa-index'] <= 4 ? 'bg-red-500' :
                                                            airQuality['us-epa-index'] <= 5 ? 'bg-purple-600' : 'bg-maroon-700'
                                        ) : ''
                                    )}
                                    {renderIndexDisplay(
                                        "UK DEFRA Index",
                                        airQuality['gb-defra-index'],
                                        airQuality['gb-defra-index'] !== undefined ? (
                                            airQuality['gb-defra-index'] <= 3 ? 'Low' :
                                                airQuality['gb-defra-index'] <= 6 ? 'Moderate' :
                                                    airQuality['gb-defra-index'] <= 9 ? 'High' : 'Very High'
                                        ) : '',
                                        airQuality['gb-defra-index'] !== undefined ? (
                                            airQuality['gb-defra-index'] <= 3 ? 'bg-green-500' :
                                                airQuality['gb-defra-index'] <= 6 ? 'bg-yellow-500 text-black' :
                                                    airQuality['gb-defra-index'] <= 9 ? 'bg-orange-500' : 'bg-red-500'
                                        ) : ''
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
            {/* HAPUS BAGIAN PEMANGGILAN FUNFACTMODAL BERIKUT: */}
            {/* <FunFactModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalTitle}
                content={modalContent}
                isLoading={isLoadingFact}
            /> */}
        </>
    );
}