'use client';
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamic import agar SSR aman
const ReactD3Cloud = dynamic(() => import("react-d3-cloud"), { ssr: false });

type WordData = { word: string; count: number };

export default function JournalWordCloud() {
  const [range, setRange] = useState<'7' | '30' | 'all'>('30');
  const [data, setData] = useState<WordData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/word-cloud?range=${range}`)
      .then(res => res.json())
      .then(res => setData(res.data || []))
      .finally(() => setLoading(false));
  }, [range]);

  return (
    <div className="mb-8 p-6 bg-card border rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Awan Kata Jurnal</h2>
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
          <Loader2 className="animate-spin mr-2" /> Memuat word cloud...
        </div>
      ) : data.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">Belum ada data kata untuk ditampilkan.</div>
      ) : (
        <div style={{ width: "100%", height: 320 }}>
          <ReactD3Cloud
            data={data.map(d => ({ text: d.word, value: d.count }))}
            font="Impact"
            fontSize={word => 18 + word.value * 4}
            rotate={word => (word.value % 2 === 0 ? 0 : 90)}
            padding={2}
            width={600}
            height={320}
          />
        </div>
      )}
      <div className="text-xs text-muted-foreground mt-2">
        Kata yang lebih besar adalah yang paling sering muncul di jurnal Anda.
      </div>
    </div>
  );
}