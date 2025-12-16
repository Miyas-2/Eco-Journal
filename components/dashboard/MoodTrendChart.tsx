'use client';
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { Loader2, TrendingUp } from "lucide-react";

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
    <div className="mb-8 p-6 bg-card border rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
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
        <div className="text-center text-muted-foreground py-8">Belum ada data mood_score untuk ditampilkan.</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis domain={[-1, 1]} ticks={[-1, -0.5, 0, 0.5, 1]} />
            <Tooltip formatter={(v: number) => v.toFixed(2)} />
            <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="avgMood" stroke="#22c55e" strokeWidth={2.5} dot />
          </LineChart>
        </ResponsiveContainer>
      )}
      <div className="text-xs text-muted-foreground mt-2">
        -1: Negatif, 0: Netral, +1: Positif
      </div>
    </div>
  );
}