import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import MoodTrendChart from '@/components/dashboard/MoodTrendChart';
import RealTimeWeather from '@/components/dashboard/RealTimeWeather';

export const metadata: Metadata = {
  title: 'Dashboard | Jurnalin',
  description: 'Your personal wellness and journaling dashboard',
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Ambil data profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("total_points, current_streak")
    .eq("user_id", user.id)
    .single();

  // Ambil data jurnal
  const { data: journalEntries } = await supabase
    .from("journal_entries")
    .select("id, created_at, mood_score, weather_data, emotion_analysis, emotions(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Ambil mood data untuk 7 hari terakhir
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentMoodData } = await supabase
    .from("journal_entries")
    .select("created_at, mood_score")
    .eq("user_id", user.id)
    .gte("created_at", sevenDaysAgo.toISOString())
    .not("mood_score", "is", null)
    .order("created_at", { ascending: true });

  // Data untuk minggu sebelumnya (untuk perbandingan)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const { data: lastWeekMoodData } = await supabase
    .from("journal_entries")
    .select("mood_score")
    .eq("user_id", user.id)
    .gte("created_at", fourteenDaysAgo.toISOString())
    .lt("created_at", sevenDaysAgo.toISOString())
    .not("mood_score", "is", null);

  // Hitung rata-rata mood minggu ini
  const weeklyAverageMood = recentMoodData && recentMoodData.length > 0
    ? recentMoodData.reduce((sum, entry) => sum + (entry.mood_score || 0), 0) / recentMoodData.length
    : null;

  // Hitung rata-rata mood minggu lalu
  const lastWeekAverageMood = lastWeekMoodData && lastWeekMoodData.length > 0
    ? lastWeekMoodData.reduce((sum, entry) => sum + (entry.mood_score || 0), 0) / lastWeekMoodData.length
    : null;

  // Hitung perubahan mood
  const moodChange = weeklyAverageMood && lastWeekAverageMood
    ? ((weeklyAverageMood - lastWeekAverageMood) / Math.abs(lastWeekAverageMood)) * 100
    : 0;

  // Get mood label
  const getMoodLabel = (score: number | null) => {
    if (score === null) return "No Data";
    if (score >= 0.5) return "Happy";
    if (score >= 0) return "Calm";
    if (score >= -0.5) return "Anxious";
    return "Sad";
  };

  // Get latest weather/AQI data
  const latestEntry = journalEntries?.[0];
  const weatherData = latestEntry?.weather_data;
  const aqiValue = weatherData?.current?.air_quality?.["us-epa-index"];
  const temperature = weatherData?.current?.temp_c;
  const weatherCondition = weatherData?.current?.condition?.text;

  // Get AQI label
  const getAQILabel = (index: number | undefined) => {
    if (!index) return "No Data";
    if (index === 1) return "Good";
    if (index === 2) return "Moderate";
    if (index === 3) return "Unhealthy for Sensitive";
    if (index === 4) return "Unhealthy";
    if (index === 5) return "Very Unhealthy";
    return "Hazardous";
  };

  const aqiLabel = getAQILabel(aqiValue);

  // Get most common emotion
  const emotionCounts: { [key: string]: number } = {};
  journalEntries?.forEach(entry => {
    let emotion = null;
    if (entry.emotion_analysis?.top_prediction?.label) {
      emotion = entry.emotion_analysis.top_prediction.label;
    } else if (Array.isArray(entry.emotions) && entry.emotions.length > 0 && entry.emotions[0]?.name) {
      emotion = entry.emotions[0].name;
    }
    if (emotion) {
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    }
  });

  const mostCommonEmotion = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || "Calm";

  // Calculate days until next streak milestone
  const currentStreak = profile?.current_streak || 0;
  const nextMilestone = currentStreak < 7 ? 7 : currentStreak < 14 ? 14 : currentStreak < 30 ? 30 : currentStreak + 10;
  const daysToMilestone = nextMilestone - currentStreak;

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Get dynamic tip based on AQI
  const getDynamicTip = () => {
    if (!aqiValue) return "Start journaling today to track your wellness journey and environmental patterns.";
    if (aqiValue <= 2) return `Since the AQI is ${aqiLabel.toLowerCase()} today, try opening your windows for 15 minutes to improve indoor circulation and boost alertness.`;
    if (aqiValue === 3) return "Air quality is moderate today. Consider indoor activities and keep track of how you're feeling.";
    return "Air quality is poor today. Stay indoors, use an air purifier if available, and notice how it affects your mood.";
  };

  const totalJournals = journalEntries?.length || 0;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap" rel="stylesheet" />

      <div className="bg-[#f8fafd] dark:bg-[#101a22] min-h-screen" style={{ fontFamily: 'Lexend, sans-serif' }}>
        <main className="flex-1 w-full px-4 py-8 md:px-10 lg:px-12 xl:px-16 flex justify-center">
          <div className="max-w-[1400px] w-full flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1 flex flex-col gap-8">
              {/* Hero Section */}
              <section className="flex flex-col md:flex-row justify-between items-end gap-6 mb-2">
                <div className="flex flex-col gap-1">
                  <h1 className="text-3xl md:text-4xl font-light text-slate-900 dark:text-white tracking-tight">
                    {getGreeting()}, <span className="font-semibold text-slate-900 dark:text-white">{displayName}</span>
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-lg font-light">
                    Ready to reflect on your day? Start your wellness journey today.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link href="/protected/journal/new">
                    <button className="h-11 px-6 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white text-sm font-bold rounded-xl transition-all shadow-sm flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      Quick Note
                    </button>
                  </Link>
                  <Link href="/protected/journal/new">
                    <button className="h-11 px-6 bg-[#2b9dee] hover:bg-[#2b9dee]/90 text-white text-sm font-bold rounded-xl shadow-lg shadow-[#2b9dee]/30 transition-all flex items-center gap-2 transform hover:-translate-y-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      New Entry
                    </button>
                  </Link>
                </div>
              </section>

              {/* Stats Cards */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Mood Average */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mood Average</span>
                      <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{getMoodLabel(weeklyAverageMood)}</span>
                    </div>
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-[#2b9dee]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                        <line x1="9" y1="9" x2="9.01" y2="9" />
                        <line x1="15" y1="9" x2="15.01" y2="9" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {moodChange !== 0 ? (
                      <span className={moodChange > 0 ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                        {moodChange > 0 ? "↑" : "↓"} {Math.abs(moodChange).toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-slate-400 font-bold">—</span>
                    )} {moodChange > 0 ? "better" : moodChange < 0 ? "lower" : "same"} than last week
                  </div>
                </div>

                {/* Entries Streak */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Streak</span>
                      <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{currentStreak} Days</span>
                    </div>
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-orange-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {currentStreak >= nextMilestone ? (
                      <span className="text-green-500 font-bold">Milestone achieved!</span>
                    ) : (
                      <>Keep it up! {daysToMilestone} days to reach {nextMilestone}</>
                    )}
                  </div>
                </div>

                {/* Environment */}
                <RealTimeWeather
                  fallbackWeather={{
                    aqiValue,
                    temperature,
                    condition: weatherCondition,
                  }}
                  variant="card"
                />
              </section>

              {/* Daily Insight Card */}
              <section>
                <div className="flex flex-col overflow-hidden rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 bg-white dark:bg-slate-800 transition-all border border-slate-100 dark:border-slate-700 relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#2b9dee]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                  <div className="flex flex-col md:flex-row h-full">
                    {/* Left Image */}
                    <div className="w-full md:w-2/5 h-48 md:h-auto bg-cover bg-center relative group min-h-[300px]" style={{
                      backgroundImage: 'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800&fit=crop")'
                    }}>
                      <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-end p-6 md:p-8">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded border border-white/20 uppercase tracking-wider">Daily Insight</span>
                        </div>
                        <h3 className="text-white text-2xl md:text-3xl font-medium tracking-tight drop-shadow-md leading-tight">Your Daily Pattern Recognition</h3>
                        <p className="text-white/80 text-sm mt-2 font-light">Generated by Jurnalin AI</p>
                      </div>
                    </div>

                    {/* Right Content */}
                    <div className="flex-1 p-6 md:p-8 flex flex-col justify-center gap-6 relative z-10">
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 px-3 py-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#2b9dee]">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                            <line x1="9" y1="9" x2="9.01" y2="9" />
                            <line x1="15" y1="9" x2="15.01" y2="9" />
                          </svg>
                          <span className="text-slate-600 dark:text-slate-300 text-xs font-bold">{mostCommonEmotion} Mood</span>
                        </div>
                        {/* <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 px-3 py-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={
                            aqiValue && aqiValue <= 2 ? "text-green-500" : aqiValue && aqiValue === 3 ? "text-yellow-500" : "text-red-500"
                          }>
                            <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
                            <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
                            <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
                          </svg>
                          <span className="text-slate-600 dark:text-slate-300 text-xs font-bold">
                            AQI {aqiValue || "N/A"} ({aqiLabel})
                          </span>
                        </div>
                        {temperature && weatherCondition && (
                          <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 px-3 py-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
                              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                            </svg>
                            <span className="text-slate-600 dark:text-slate-300 text-xs font-bold">{weatherCondition}, {temperature}°C</span>
                          </div>
                        )} */}
                        <RealTimeWeather
                          fallbackWeather={{
                            aqiValue,
                            temperature,
                            condition: weatherCondition,
                          }}
                          variant="badges"
                        />
                      </div>

                      <div className="prose prose-slate dark:prose-invert max-w-none">
                        <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
                          {totalJournals === 0 ? (
                            <>Welcome to your journaling journey! Start by creating your first entry to track your mood patterns and environmental influences on your wellbeing.</>
                          ) : totalJournals < 5 ? (
                            <>You're building a great journaling habit! With <span className="text-[#2b9dee] font-medium">{totalJournals} entries</span> so far, you're beginning to create meaningful data about your wellness journey. Keep going to unlock deeper insights!</>
                          ) : (
                            <>
                              Your most common emotion lately has been <span className="text-[#2b9dee] font-medium bg-[#2b9dee]/5 px-1 rounded">{mostCommonEmotion.toLowerCase()}</span>,
                              {aqiLabel === "Good" && " which is great to see alongside the good air quality in your area."}
                              {aqiLabel === "Moderate" && " and the moderate air quality might be influencing your mood patterns."}
                              {(aqiLabel !== "Good" && aqiLabel !== "Moderate" && aqiLabel !== "No Data") && " which interestingly aligns with the changes in air quality this week."}
                              {aqiLabel === "No Data" && ". Continue tracking to see how environmental factors might influence your emotional wellbeing."}
                              {" "}Keep journaling to discover more patterns in your <span className="bg-[#2b9dee]/10 dark:bg-[#2b9dee]/20 px-1 rounded text-[#2b9dee] font-medium">emotional landscape</span>.
                            </>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 mt-auto">
                        <p className="text-xs text-slate-400 font-medium italic">Based on {totalJournals} {totalJournals === 1 ? "entry" : "entries"}</p>
                        <Link href="/protected/profile" className="text-[#2b9dee] font-bold text-sm hover:underline flex items-center gap-1">
                          View Full Analysis
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Charts Section */}
              <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Mood Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-md text-indigo-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 3v18h18" />
                          <path d="M18 17V9" />
                          <path d="M13 17V5" />
                          <path d="M8 17v-3" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-slate-800 dark:text-white">Mood Trend</h3>
                    </div>
                    <span className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-700 px-3 py-1 rounded-md">Last 7 Days</span>
                  </div>

                  {recentMoodData && recentMoodData.length > 0 ? (
                    <MoodTrendChart />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-50">
                        <path d="M3 3v18h18" />
                        <path d="M18 17V9" />
                        <path d="M13 17V5" />
                        <path d="M8 17v-3" />
                      </svg>
                      <p className="text-sm">No mood data available yet</p>
                      <p className="text-xs mt-1">Create journal entries to see your mood trends</p>
                    </div>
                  )}
                </div>

                {/* Tip Card */}
                <div className="bg-gradient-to-br from-blue-50 to-white dark:from-slate-800 dark:to-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100 dark:bg-yellow-900/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-yellow-200 transition-colors duration-500"></div>
                  <div className="flex items-start gap-4 z-10">
                    <div className="size-12 min-w-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
                        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                        <path d="M9 18h6" />
                        <path d="M10 22h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white text-lg">Tip of the day</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {getDynamicTip()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3 z-10 pl-16">
                    <Link href="/protected/journal/new" className="text-xs font-bold bg-[#2b9dee] hover:bg-[#2b9dee]/90 text-white px-4 py-2 rounded-lg shadow-sm transition-colors">
                      Start Journaling
                    </Link>
                    <Link href="/protected/profile" className="text-xs font-bold text-[#2b9dee] hover:text-[#2b9dee]/80 py-2 transition-colors">
                      See more insights
                    </Link>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="w-full lg:w-80 flex flex-col gap-8 shrink-0">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Quick Stats</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Total Entries</span>
                    <span className="text-lg font-bold text-slate-800 dark:text-white">{totalJournals}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Current Streak</span>
                    <span className="text-lg font-bold text-orange-500">{currentStreak} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Total Points</span>
                    <span className="text-lg font-bold text-[#2b9dee]">{profile?.total_points || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link href="/protected/journal/history" className="block w-full text-left px-4 py-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-sm font-medium text-slate-700 dark:text-slate-200">
                    View All Journals
                  </Link>
                  <Link href="/protected/profile" className="block w-full text-left px-4 py-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-sm font-medium text-slate-700 dark:text-slate-200">
                    View Analytics
                  </Link>
                  <Link href="/protected/garden" className="block w-full text-left px-4 py-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-sm font-medium text-slate-700 dark:text-slate-200">
                    View Achievements
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}