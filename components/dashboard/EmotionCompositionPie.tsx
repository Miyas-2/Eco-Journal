"use client";
import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";

const COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f59e42",
  "#ef4444",
  "#a855f7",
  "#eab308",
  "#14b8a6",
  "#6366f1",
  "#f43f5e",
  "#64748b",
];

type EmotionData = {
  emotion: string;
  count: number;
  percent: number;
};

export default function EmotionCompositionPie() {
  const [range, setRange] = useState<"7" | "30" | "all">("30");
  const [data, setData] = useState<EmotionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/emotion-composition?range=${range}`)
      .then((res) => res.json())
      .then((res) => setData(res.data || []))
      .finally(() => setLoading(false));
  }, [range]);

  return (
    <div className="mb-8 p-6 bg-card border rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Komposisi Emosi</h2>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={range}
          onChange={(e) => setRange(e.target.value as "7" | "30" | "all")}
        >
          <option value="7">7 Hari</option>
          <option value="30">30 Hari</option>
          <option value="all">Semua Waktu</option>
        </select>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-[320px] text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Memuat grafik...
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[320px] text-muted-foreground">
          <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">Belum ada data emosi untuk ditampilkan.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Pie
              data={data}
              dataKey="percent"
              nameKey="emotion"
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={0}
              label={({ percent, emotion }) =>
                percent > 5 ? `${emotion} (${percent.toFixed(0)}%)` : ''
              }
              labelLine={true}
              isAnimationActive
            >
              {data.map((entry, idx) => (
                <Cell key={entry.emotion} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)}%`, "Persentase"]}
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '8px 12px'
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
      <div className="text-xs text-muted-foreground mt-2">
        Persentase dihitung dari total entri jurnal pada periode yang dipilih.
      </div>
    </div>
  );
}