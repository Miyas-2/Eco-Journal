'use client';
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { Loader2 } from "lucide-react";

type MoodData = { date: string; avgMood: number };

export default function MoodTrendChart() {
  const [range, setRange] = useState<'7' | '30' | 'all'>('7');
  const [data, setData] = useState<MoodData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/mood-trend?range=${range}`)
      .then(res => res.json())
      .then(res => setData(res.data || []))
      .finally(() => setLoading(false));
  }, [range]);

  return (
    <div className="mb-4 sm:mb-8 p-3 sm:p-6 bg-card border rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <h2 className="text-base sm:text-lg font-semibold">Grafik Tren Mood</h2>
        <select
          className="border rounded px-2 py-1 text-xs sm:text-sm w-full sm:w-auto"
          value={range}
          onChange={e => setRange(e.target.value as '7' | '30' | 'all')}
        >
          <option value="7">7 Hari</option>
          <option value="30">30 Hari</option>
          <option value="all">Semua Waktu</option>
        </select>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-32 sm:h-40 text-muted-foreground">
          <Loader2 className="animate-spin mr-2 w-4 h-4" />
          <span className="text-sm">Memuat grafik...</span>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center text-muted-foreground py-6 sm:py-8 text-sm">
          Belum ada data mood_score untuk ditampilkan.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              fontSize={10}
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[-1, 1]}
              ticks={[-1, -0.5, 0, 0.5, 1]}
              fontSize={10}
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              formatter={(v: number) => v.toFixed(2)}
              contentStyle={{ fontSize: '12px' }}
            />
            <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="avgMood"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>

      )}
      <div className="text-xs text-muted-foreground mt-2 text-center sm:text-left">
        -1: Negatif, 0: Netral, +1: Positif
      </div>
    </div>
  );
}