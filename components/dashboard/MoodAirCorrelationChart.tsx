'use client';
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Loader2 } from "lucide-react";

type CorrelationData = {
    date: string;
    avgMood: number | null;
    avgEpaIndex: number | null;
};

export default function MoodAirCorrelationChart() {
    const [range, setRange] = useState<'7' | '30' | 'all'>('7');
    const [data, setData] = useState<CorrelationData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/dashboard/mood-air-correlation?range=${range}`)
            .then(res => res.json())
            .then(res => setData(res.data || []))
            .finally(() => setLoading(false));
    }, [range]);

    return (
        <div className="mb-8 p-6 bg-card border rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
                {/* <h2 className="text-lg font-semibold">Korelasi Mood & Kualitas Udara</h2> */}
                <select
                    className="border rounded px-2 py-1 text-sm"
                    value={range}
                    onChange={e => setRange(e.target.value as '7' | '30' | 'all')}
                >
                    <option value="7">7 Hari</option>
                    <option value="30">30 Hari</option>
                    <option value="all">Semua Waktu</option>
                </select>
            </div>
            {loading ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                    <Loader2 className="animate-spin mr-2" /> Memuat grafik...
                </div>
            ) : data.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">Belum ada data untuk ditampilkan.</div>
            ) : (
                <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" fontSize={12} />
                        <YAxis
                            yAxisId="left"
                            domain={[-1, 1]}
                            ticks={[-1, -0.5, 0, 0.5, 1]}
                            label={{ value: "Mood", angle: -90, position: "insideLeft", fontSize: 12 }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={[0, 6]}
                            ticks={[1, 2, 3, 4, 5, 6]}
                            label={{ value: "US EPA Index", angle: 90, position: "insideRight", fontSize: 12 }}
                        />
                        <Tooltip
                            formatter={(
                                value: any,
                                key: string,
                                item: any
                            ) => {
                                if (item.dataKey === "avgMood") {
                                    return [`${value?.toFixed(2)}`, "Mood"];
                                }
                                if (item.dataKey === "avgEpaIndex") {
                                    return [value, "US EPA Index"];
                                }
                                return [value, key];
                            }}
                            labelFormatter={label => `Tanggal: ${label}`}
                        />
                        <Legend />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="avgMood"
                            name="Mood"
                            stroke="#22c55e"
                            strokeWidth={2.5}
                            dot
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="avgEpaIndex"
                            name="US EPA Index"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            dot
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
            <div className="text-xs text-muted-foreground mt-2">
                Mood: -1 (Negatif) s/d +1 (Positif) &nbsp; | &nbsp; US EPA Index: 1 (Baik) s/d 6 (Berbahaya)
            </div>
        </div>
    );
}