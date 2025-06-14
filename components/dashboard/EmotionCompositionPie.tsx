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
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Memuat grafik...
        </div>
      ) : data.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          Belum ada data emosi untuk ditampilkan.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={data}
              dataKey="percent"
              nameKey="emotion"
              cx="50%"
              cy="50%"
              outerRadius={110}
              label={({ percent, emotion }) =>
                `${emotion} (${percent.toFixed(0)}%)`
              }
              isAnimationActive
            >
              {data.map((entry, idx) => (
                <Cell key={entry.emotion} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: string, props: any) => [
                `${value}%`,
                "Persentase",
              ]}
              labelFormatter={(label) => `Emosi: ${label}`}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
      <div className="text-xs text-muted-foreground mt-2">
        Persentase dihitung dari total entri jurnal pada periode yang dipilih.
      </div>
    </div>
  );
}
