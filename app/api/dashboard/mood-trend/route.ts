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
    .select('created_at, mood_score')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (fromDate) query = query.gte('created_at', fromDate);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Agregasi rata-rata per hari
  const daily: Record<string, number[]> = {};
  data.forEach((entry: any) => {
    if (typeof entry.mood_score !== 'number') return;
    const date = new Date(entry.created_at).toISOString().split('T')[0];
    if (!daily[date]) daily[date] = [];
    daily[date].push(entry.mood_score);
  });

  const result = Object.entries(daily).map(([date, scores]) => ({
    date,
    avgMood: Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)),
  }));

  return NextResponse.json({ data: result });
}