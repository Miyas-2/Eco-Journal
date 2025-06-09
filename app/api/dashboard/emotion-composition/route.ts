import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    .select('emotion_id, emotions(name), created_at')
    .eq('user_id', user.id);

  if (fromDate) query = query.gte('created_at', fromDate);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Hitung frekuensi
  const freq: Record<string, number> = {};
  let total = 0;
  data.forEach((entry: any) => {
    const name = entry.emotions?.name || 'Tidak Diketahui';
    freq[name] = (freq[name] || 0) + 1;
    total++;
  });

  const result = Object.entries(freq).map(([emotion, count]) => ({
    emotion,
    count,
    percent: Number(((count / total) * 100).toFixed(2)),
  }));

  return NextResponse.json({ data: result });
}