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
    .select('created_at, mood_score, weather_data')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (fromDate) query = query.gte('created_at', fromDate);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Gabungkan per hari
  const daily: Record<string, { mood: number[], epa: number[] }> = {};
  data.forEach((entry: any) => {
    const date = new Date(entry.created_at).toISOString().split('T')[0];
    if (!daily[date]) daily[date] = { mood: [], epa: [] };
    if (typeof entry.mood_score === 'number') daily[date].mood.push(entry.mood_score);
    // Ambil us-epa-index dari weather_data
    let epaIndex = undefined;
    try {
      const wd = typeof entry.weather_data === 'string' ? JSON.parse(entry.weather_data) : entry.weather_data;
      epaIndex = wd?.current?.air_quality?.['us-epa-index'];
      if (typeof epaIndex === 'string') epaIndex = parseFloat(epaIndex);
      if (typeof epaIndex === 'number') daily[date].epa.push(epaIndex);
    } catch {}
  });

  const result = Object.entries(daily).map(([date, { mood, epa }]) => ({
    date,
    avgMood: mood.length ? Number((mood.reduce((a, b) => a + b, 0) / mood.length).toFixed(2)) : null,
    avgEpaIndex: epa.length ? Number((epa.reduce((a, b) => a + b, 0) / epa.length).toFixed(2)) : null,
  }));

  return NextResponse.json({ data: result });
}