import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const STOPWORDS = [
  "dan", "yang", "di", "ke", "dari", "untuk", "dengan", "atau", "pada", "ini", "itu", "saya", "kamu", "dia", "adalah", "akan", "dalam", "sebagai", "juga", "tidak", "ya", "apa", "bisa", "karena", "lebih", "sudah", "ada", "oleh", "mereka", "kita", "saat", "hanya", "saja", "jadi", "agar", "bagi", "oleh", "setelah", "sebelum", "tentang", "namun", "masih", "semua", "bukan", "pun", "lah", "punya", "aku", "kau", "engkau", "mu", "nya", "itu", "ini"
];

interface JournalEntry {
  content: string | null;
  created_at: string;
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const range = url.searchParams.get('range'); // '7', '30', 'all'
  let fromDate: string | undefined = undefined;
  if (range === '7' || range === '30') {
    const d = new Date();
    d.setDate(d.getDate() - Number(range));
    fromDate = d.toISOString().split('T')[0];
  }

  let query = supabase
    .from('journal_entries')
    .select('content, created_at')
    .eq('user_id', user.id);

  if (fromDate) query = query.gte('created_at', fromDate);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Gabungkan semua konten jurnal
  const allText = (data as JournalEntry[]).map((entry) => entry.content || "").join(" ");
  // Tokenisasi, hilangkan tanda baca, lowercase
  const words = allText
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.includes(w));

  // Hitung frekuensi
  const freq: Record<string, number> = {};
  words.forEach(word => {
    freq[word] = (freq[word] || 0) + 1;
  });

  // Urutkan dari yang paling sering
  const result = Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50); // Batasi 50 kata teratas

  return NextResponse.json({ data: result });
}