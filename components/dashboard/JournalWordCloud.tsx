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
  const [dimensions, setDimensions] = useState({ width: 600, height: 320 });

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      if (width < 640) {
        // Mobile
        setDimensions({ width: width - 48, height: 250 });
      } else if (width < 768) {
        // Tablet
        setDimensions({ width: width - 64, height: 280 });
      } else {
        // Desktop
        setDimensions({ width: 600, height: 320 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/word-cloud?range=${range}`)
      .then(res => res.json())
      .then(res => setData(res.data || []))
      .finally(() => setLoading(false));
  }, [range]);

  return (
    <div className="mb-8 p-4 sm:p-6 bg-card border rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <h2 className="text-lg font-semibold">Awan Kata Jurnal</h2>
        <select
          className="border rounded px-2 py-1 text-sm w-full sm:w-auto"
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
          <Loader2 className="animate-spin mr-2" /> Memuat word cloud...
        </div>
      ) : data.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">Belum ada data kata untuk ditampilkan.</div>
      ) : (
        <div className="w-full overflow-hidden" style={{ height: dimensions.height }}>
          <ReactD3Cloud
            data={data.map(d => ({ text: d.word, value: d.count }))}
            font="Impact"
            fontSize={word => Math.max(12, 14 + word.value * (dimensions.width < 640 ? 2 : 4))}
            rotate={word => (word.value % 2 === 0 ? 0 : 90)}
            padding={dimensions.width < 640 ? 1 : 2}
            width={dimensions.width}
            height={dimensions.height}
          />
        </div>
      )}
      <div className="text-xs text-muted-foreground mt-2">
        Kata yang lebih besar adalah yang paling sering muncul di jurnal Anda.
      </div>
    </div>
  );
}