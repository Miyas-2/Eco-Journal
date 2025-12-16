'use client';
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

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

  // Generate word layout with consistent sizing
  const generateWordLayout = () => {
    if (data.length === 0) return [];

    const maxCount = Math.max(...data.map(d => d.count));
    const minCount = Math.min(...data.map(d => d.count));
    
    // Map counts to font sizes (12px to 36px) - smaller range for stability
    const getFontSize = (count: number) => {
      if (maxCount === minCount) return 20;
      const normalized = (count - minCount) / (maxCount - minCount);
      return 12 + normalized * 24;
    };

    // Get color based on frequency
    const getColor = (count: number) => {
      if (maxCount === minCount) return 'rgb(43, 157, 238)'; // primary blue
      const normalized = (count - minCount) / (maxCount - minCount);
      const lightness = 45 - normalized * 20; // 45% to 25%
      return `hsl(206, 80%, ${lightness}%)`;
    };

    return data.map((item) => ({
      ...item,
      fontSize: getFontSize(item.count),
      color: getColor(item.count),
      rotation: Math.random() > 0.85 ? (Math.random() > 0.5 ? 90 : -90) : 0,
    }));
  };

  const words = generateWordLayout();

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
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Memuat word cloud...
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
          <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">Belum ada data kata untuk ditampilkan.</p>
        </div>
      ) : (
        <div className="relative h-[300px] w-full overflow-hidden">
          <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-2 p-4 content-center">
            {words.map((item) => (
              <span
                key={item.word}
                className="inline-block hover:scale-110 transition-transform duration-200 cursor-default select-none"
                style={{
                  fontSize: `${item.fontSize}px`,
                  color: item.color,
                  fontWeight: 700,
                  lineHeight: '1.2',
                  padding: '2px 6px',
                  transform: `rotate(${item.rotation}deg)`,
                  fontFamily: "'Inter', sans-serif",
                }}
                title={`${item.word} (${item.count}x)`}
              >
                {item.word}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="text-xs text-muted-foreground mt-2">
        Kata yang lebih besar adalah yang paling sering muncul di jurnal Anda.
      </div>
    </div>
  );
}