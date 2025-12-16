import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from 'next';
import { 
  User, 
  Calendar, 
  Award, 
  TrendingUp, 
  BarChart3, 
  Heart, 
  Cloud, 
  Target,
  BookOpen,
  Clock,
  Zap,
  Activity,
  PieChart,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import MoodTrendChart from "@/components/dashboard/MoodTrendChart";
import EmotionCompositionPie from "@/components/dashboard/EmotionCompositionPie";
import MoodAirCorrelationChart from "@/components/dashboard/MoodAirCorrelationChart";
import JournalWordCloud from "@/components/dashboard/JournalWordCloud";

export const metadata: Metadata = {
  title: 'Profile & Analytics | Jurnalin',
  description: 'Your detailed personal statistics and analytics',
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Ambil profile data
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Ambil semua jurnal untuk analitik
  const { data: allJournals } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Ambil data achievements
  const { data: achievements } = await supabase
    .from("user_achievements")
    .select("*, achievements(name, description, points_reward, icon_url)")
    .eq("user_id", user.id)
    .order("earned_at", { ascending: false });

  // Analitik untuk 30 hari terakhir
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: monthlyJournals } = await supabase
    .from("journal_entries")
    .select("created_at, mood_score, emotion_analysis, emotions(name), weather_data")
    .eq("user_id", user.id)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  // Analitik untuk 90 hari terakhir
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data: quarterlyJournals } = await supabase
    .from("journal_entries")
    .select("created_at, mood_score, emotion_analysis, emotions(name)")
    .eq("user_id", user.id)
    .gte("created_at", ninetyDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
  const email = user.email || '';
  const joinDate = new Date(user.created_at);

  // Calculate statistics
  const totalJournals = allJournals?.length || 0;
  const monthlyJournalCount = monthlyJournals?.length || 0;
  const currentStreak = profile?.current_streak || 0;
  const totalPoints = profile?.total_points || 0;
  const totalAchievements = achievements?.length || 0;

  // Calculate average mood
  const journalsWithMood = monthlyJournals?.filter(j => j.mood_score !== null) || [];
  const averageMood = journalsWithMood.length > 0 
    ? journalsWithMood.reduce((sum, j) => sum + (j.mood_score || 0), 0) / journalsWithMood.length
    : null;

  // Calculate writing frequency
  const daysWithJournals = monthlyJournals ? 
    [...new Set(monthlyJournals.map(j => new Date(j.created_at).toDateString()))].length 
    : 0;
  const writingFrequency = daysWithJournals / 30 * 100;

  // Most common emotions
  const emotionCounts: { [key: string]: number } = {};
  monthlyJournals?.forEach(journal => {
    let emotion = null;
    if (journal.emotion_analysis?.top_prediction?.label) {
      emotion = journal.emotion_analysis.top_prediction.label;
    } else if (Array.isArray(journal.emotions) && journal.emotions.length > 0 && journal.emotions[0]?.name) {
      emotion = journal.emotions[0].name;
    }
    if (emotion) {
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    }
  });

  const topEmotions = Object.entries(emotionCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
   <div className="bg-[#f8fafd] dark:bg-[#101a22] min-h-screen" style={{ fontFamily: 'Lexend, sans-serif' }}>
      <div className="flex-1 w-full px-4 py-8 md:px-10 lg:px-12 xl:px-16 justify-center md:py-12">
        
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/protected"
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-[#2b9dee] dark:hover:text-[#2b9dee] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-light tracking-[-0.033em]">
              Profile & Analytics
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base font-light leading-normal max-w-2xl">
              Analisa mendalam dari perjalanan wellness Anda. Pahami pola, tren, dan perkembangan diri Anda.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Profile Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-10 w-10 text-[#2b9dee]" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{displayName}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 truncate">{email}</p>
                <div className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded-xl">
                  Bergabung {formatDate(joinDate)}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">Statistik Cepat</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#2b9dee]" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Total Jurnal</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{totalJournals}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Current Streak</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{currentStreak} hari</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Total Poin</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{totalPoints}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Pencapaian</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{totalAchievements}</span>
                </div>
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-slate-900 dark:text-white">Pencapaian Terbaru</h4>
                <Link 
                  href="/protected/garden"
                  className="text-xs font-bold text-[#2b9dee] hover:text-[#1e7ac7] transition-colors"
                >
                  Lihat Semua
                </Link>
              </div>
              
              {achievements && achievements.length > 0 ? (
                <div className="space-y-3">
                  {achievements.slice(0, 3).map((achievement) => (
                    <div key={achievement.id} className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                          {achievement.achievements.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          +{achievement.achievements.points_reward} poin
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada pencapaian</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Detailed Analytics */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Monthly Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="w-12 h-12 bg-sky-50 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-6 w-6 text-[#2b9dee]" />
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  {monthlyJournalCount}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Jurnal 30 Hari</div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-indigo-500" />
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  {averageMood ? averageMood.toFixed(1) : 'N/A'}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Rata-rata Mood</div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  {writingFrequency.toFixed(0)}%
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Frekuensi Menulis</div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 text-orange-500" />
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mb-2 capitalize">
                  {topEmotions.length > 0 ? topEmotions[0][0] : 'N/A'}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Emosi Dominan</div>
              </div>
            </div>

            {/* Detailed Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Mood Trend Chart */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-sky-50 dark:bg-sky-900/30 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-[#2b9dee]" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Mood Trend 
                  </h3>
                </div>
                
                {monthlyJournals && monthlyJournals.length > 0 ? (
                  <MoodTrendChart />
                ) : (
                  <div className="text-center py-12">
                    <TrendingUp className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-light">Belum ada data mood</p>
                  </div>
                )}
              </div>

              {/* Emotion Composition */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                    <PieChart className="h-5 w-5 text-indigo-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Emotional Composition
                  </h3>
                </div>
                
                {quarterlyJournals && quarterlyJournals.length > 0 ? (
                  <EmotionCompositionPie/>
                ) : (
                  <div className="text-center py-12">
                    <PieChart className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-light">Belum ada data emosi</p>
                  </div>
                )}
              </div>

              {/* Mood vs Air Quality Correlation */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-cyan-50 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center">
                    <Cloud className="h-5 w-5 text-cyan-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Mood vs Air Quality
                  </h3>
                </div>
                
                {monthlyJournals && monthlyJournals.length > 0 ? (
                  <MoodAirCorrelationChart/>
                ) : (
                  <div className="text-center py-12">
                    <Cloud className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-light">Belum ada data korelasi</p>
                  </div>
                )}
              </div>

              {/* Word Cloud */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Frequently Appearing Words
                  </h3>
                </div>
                
                {allJournals && allJournals.length > 0 ? (
                  <JournalWordCloud />
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-light">Belum ada data untuk word cloud</p>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Insights */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                Insight Personal
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Writing Patterns */}
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#2b9dee]" />
                    Pola Menulis
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Hari aktif menulis</span>
                      <span className="font-bold text-slate-900 dark:text-white">{daysWithJournals}/30</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Konsistensi</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        writingFrequency > 70 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                          : writingFrequency > 40 
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {writingFrequency > 70 ? "Tinggi" : writingFrequency > 40 ? "Sedang" : "Rendah"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Emotional Insights */}
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-orange-500" />
                    Pola Emosi
                  </h4>
                  <div className="space-y-3">
                    {topEmotions.length > 0 ? (
                      topEmotions.slice(0, 3).map(([emotion, count], index) => (
                        <div key={emotion} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                          <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">{emotion}</span>
                          <span className="font-bold text-slate-900 dark:text-white">{count}x</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4 font-light">
                        Belum ada data emosi yang cukup
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
        
        {/* Footer Spacer */}
        <div className="h-20"></div>
      </div>
    </div>
  );
}