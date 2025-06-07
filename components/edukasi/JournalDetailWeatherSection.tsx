'use client';

import { useState } from 'react';
import { WeatherApiResponse } from '@/types';
import { Lightbulb } from 'lucide-react';
import FunFactModal from './FunFactModal';

interface JournalDetailWeatherSectionProps {
    weatherData: WeatherApiResponse | null;
    journalCreatedAt: string; // <-- TAMBAHKAN PROPERTI BARU
}
export default function JournalDetailWeatherSection({ weatherData, journalCreatedAt }: JournalDetailWeatherSectionProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalContent, setModalContent] = useState('');
    const [isLoadingFact, setIsLoadingFact] = useState(false);

    const handleShowFact = async (
        indicatorTypeForTitle: string,
        value: number | string,
        unit?: string,
        generalContextForAI?: string
    ) => {
        if (value === undefined || value === null) return;

        let titleDisplay = `Tentang ${indicatorTypeForTitle}`;
        setModalTitle(titleDisplay);
        setIsModalOpen(true);
        setIsLoadingFact(true);
        setModalContent('');

        try {
            const response = await fetch('/api/funfact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    indicatorType: indicatorTypeForTitle,
                    value,
                    unit,
                    locationName: weatherData?.location.name,
                    generalContext: generalContextForAI || indicatorTypeForTitle,
                    journalDate: journalCreatedAt, // <-- KIRIM TANGGAL JURNAL
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setModalContent(data.fact);
            } else {
                setModalContent(data.error || 'Gagal memuat informasi edukasi.');
            }
        } catch (error) {
            setModalContent('Terjadi kesalahan saat mengambil informasi.');
            console.error("Error fetching fun fact:", error);
        } finally {
            setIsLoadingFact(false);
        }
    };

    if (!weatherData) {
        return <p className="text-sm text-muted-foreground">Data cuaca tidak tersedia untuk jurnal ini.</p>;
    }

    const { location, current } = weatherData;
    const airQuality = current.air_quality;

    const renderIndicatorCard = (
        label: string,
        value?: number,
        unit?: string,
        contextForAI?: string,
        valueFixed?: number
    ) => {
        if (value === undefined) return null;
        return (
            <div className="bg-white p-2 rounded border">
                <div className="font-medium flex items-center justify-between">
                    {label}
                    <Lightbulb
                        className="h-4 w-4 text-yellow-400 hover:text-yellow-500 cursor-pointer ml-1 transition-colors"
                        onClick={() => handleShowFact(label, value, unit, contextForAI || label)}
                        aria-label={`Info tentang ${label}`}
                    />
                </div>
                <div>{value.toFixed(valueFixed !== undefined ? valueFixed : 1)} {unit}</div>
            </div>
        );
    };

    const renderIndexDisplay = (
        label: string,
        indexValue?: number,
        indexText?: string,
        bgColorClass?: string,
        contextForAI?: string
    ) => {
        if (indexValue === undefined) return null;
        return (
            <div className="bg-white p-2 rounded border flex justify-between items-center">
                <span className="font-medium">{label}:</span>
                <span className={`px-2 py-1 text-xs rounded text-white ${bgColorClass}`}>
                    {indexValue} - {indexText}
                    <Lightbulb
                        className="h-3 w-3 text-white hover:text-gray-200 cursor-pointer ml-1 inline-block transition-colors"
                        onClick={() => handleShowFact(label, indexValue, undefined, contextForAI || label)}
                        aria-label={`Info tentang ${label}`}
                    />
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
                                <Lightbulb
                                    className="h-4 w-4 text-yellow-400 hover:text-yellow-500 cursor-pointer ml-1 transition-colors"
                                    onClick={() => handleShowFact("Indeks UV", current.uv, undefined, "Indeks UltraViolet (UV) dan dampaknya bagi kulit dan mata")}
                                    aria-label="Info tentang Indeks UV"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Informasi Angin (jika ingin diaktifkan kembali dan diberi edukasi) */}
                    {/* <div className="border-b pb-2">...</div> */}

                    {airQuality && (
                        <div>
                            <h4 className="font-medium text-base mb-1">🏭 Kualitas Udara</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mb-2">
                                {renderIndicatorCard("PM2.5", airQuality.pm2_5, "µg/m³", "Partikulat Halus PM2.5 dan dampaknya bagi kesehatan")}
                                {renderIndicatorCard("PM10", airQuality.pm10, "µg/m³", "Partikulat Kasar PM10 dan dampaknya bagi kesehatan")}
                                {renderIndicatorCard("CO", airQuality.co, "µg/m³", "Gas Karbon Monoksida (CO) dan dampaknya bagi kesehatan", 2)}
                                {renderIndicatorCard("NO₂", airQuality.no2, "µg/m³", "Gas Nitrogen Dioksida (NO₂) dan dampaknya bagi lingkungan dan kesehatan", 2)}
                                {renderIndicatorCard("O₃", airQuality.o3, "µg/m³", "Gas Ozon Permukaan (O₃) dan dampaknya bagi kesehatan", 2)}
                                {renderIndicatorCard("SO₂", airQuality.so2, "µg/m³", "Gas Sulfur Dioksida (SO₂) dan dampaknya bagi lingkungan dan kesehatan", 2)}
                            </div>

                            <div className="mt-2 text-xs space-y-2">
                                {airQuality.pm2_5 !== undefined && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-medium">Status Kualitas Udara (PM2.5):</span>
                                        <span className={`px-2 py-1 rounded text-white ${airQuality.pm2_5 <= 12 ? 'bg-green-500' :
                                            airQuality.pm2_5 <= 35.4 ? 'bg-yellow-500 text-black' :
                                                airQuality.pm2_5 <= 55.4 ? 'bg-orange-500' :
                                                    airQuality.pm2_5 <= 150.4 ? 'bg-red-500' :
                                                        airQuality.pm2_5 <= 250.4 ? 'bg-purple-600' : 'bg-maroon-700' // Sesuaikan dengan standar AQI PM2.5
                                            }`}>
                                            {airQuality.pm2_5 <= 12 ? 'Baik' :
                                                airQuality.pm2_5 <= 35.4 ? 'Sedang' :
                                                    airQuality.pm2_5 <= 55.4 ? 'Tidak Sehat (Kelompok Sensitif)' :
                                                        airQuality.pm2_5 <= 150.4 ? 'Tidak Sehat' :
                                                            airQuality.pm2_5 <= 250.4 ? 'Sangat Tidak Sehat' : 'Berbahaya'}
                                            <Lightbulb
                                                className="h-3 w-3 text-white hover:text-gray-200 cursor-pointer ml-1 inline-block transition-colors"
                                                onClick={() => handleShowFact("Status Kualitas Udara", airQuality.pm2_5!, "berdasarkan PM2.5", "Status Kualitas Udara berdasarkan PM2.5 dan artinya bagi aktivitas luar ruangan")}
                                                aria-label="Info tentang Status Kualitas Udara"
                                            />
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
                                        ) : '',
                                        "Indeks Kualitas Udara standar US EPA dan artinya"
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
                                        ) : '',
                                        "Indeks Kualitas Udara standar UK DEFRA dan artinya"
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
            <FunFactModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalTitle}
                content={modalContent}
                isLoading={isLoadingFact}
            />
        </>
    );
}