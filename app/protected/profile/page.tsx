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
  MapPin,
  Thermometer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import MoodTrendChart from "@/components/dashboard/MoodTrendChart";
import EmotionCompositionPie from "@/components/dashboard/EmotionCompositionPie";
import MoodAirCorrelationChart from "@/components/dashboard/MoodAirCorrelationChart";
import JournalWordCloud from "@/components/dashboard/JournalWordCloud";

export const metadata: Metadata = {
  title: 'Profile & Analytics | AtmosFeel',
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
    } else if (journal.emotions?.[0]?.name) {
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-8 py-12">
        
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light text-slate-800 mb-2">
                Profile & Analytics
              </h1>
              <p className="text-lg text-slate-500">
                Analisa mendalam dari perjalanan wellness Anda
              </p>
            </div>
            <Button 
              asChild 
              variant="outline"
              className="rounded-2xl px-6 py-3 border-slate-200 hover:bg-slate-50"
            >
              <Link href="/protected">
                Kembali ke Dashboard
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Profile Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-medium text-slate-800 mb-2">{displayName}</h3>
                <p className="text-sm text-slate-500 mb-4">{email}</p>
                <div className="text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-xl">
                  Bergabung {formatDate(joinDate)}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h4 className="font-medium text-slate-800 mb-4">Statistik Cepat</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-slate-600">Total Jurnal</span>
                  </div>
                  <span className="font-medium text-slate-800">{totalJournals}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-slate-600">Streak Terpanjang</span>
                  </div>
                  <span className="font-medium text-slate-800">{currentStreak} hari</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-slate-600">Total Poin</span>
                  </div>
                  <span className="font-medium text-slate-800">{totalPoints}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-slate-600">Pencapaian</span>
                  </div>
                  <span className="font-medium text-slate-800">{totalAchievements}</span>
                </div>
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-slate-800">Pencapaian Terbaru</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild 
                  className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                >
                  <Link href="/protected/garden">
                    Lihat Semua
                  </Link>
                </Button>
              </div>
              
              {achievements && achievements.length > 0 ? (
                <div className="space-y-3">
                  {achievements.slice(0, 3).map((achievement) => (
                    <div key={achievement.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-2xl">
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                        <Award className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate">
                          {achievement.achievements.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          +{achievement.achievements.points_reward} poin
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Belum ada pencapaian</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Detailed Analytics */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Monthly Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-3xl p-6 text-center shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-6 w-6 text-blue-500" />
                </div>
                <div className="text-2xl font-light text-slate-800 mb-2">
                  {monthlyJournalCount}
                </div>
                <div className="text-sm text-slate-500 font-medium">Jurnal 30 Hari</div>
              </div>

              <div className="bg-white rounded-3xl p-6 text-center shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-purple-500" />
                </div>
                <div className="text-2xl font-light text-slate-800 mb-2">
                  {averageMood ? averageMood.toFixed(1) : 'N/A'}
                </div>
                <div className="text-sm text-slate-500 font-medium">Rata-rata Mood</div>
              </div>

              <div className="bg-white rounded-3xl p-6 text-center shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <div className="text-2xl font-light text-slate-800 mb-2">
                  {writingFrequency.toFixed(0)}%
                </div>
                <div className="text-sm text-slate-500 font-medium">Frekuensi Menulis</div>
              </div>

              <div className="bg-white rounded-3xl p-6 text-center shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 text-orange-500" />
                </div>
                <div className="text-2xl font-light text-slate-800 mb-2">
                  {topEmotions.length > 0 ? topEmotions[0][0] : 'N/A'}
                </div>
                <div className="text-sm text-slate-500 font-medium">Emosi Dominan</div>
              </div>
            </div>

            {/* Detailed Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Mood Trend Chart */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </div>
                    Tren Mood 30 Hari
                  </h3>
                </div>
                
                {monthlyJournals && monthlyJournals.length > 0 ? (
                  <MoodTrendChart />
                ) : (
                  <div className="text-center py-12">
                    <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Belum ada data mood</p>
                  </div>
                )}
              </div>

              {/* Emotion Composition */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center">
                      <PieChart className="h-4 w-4 text-purple-600" />
                    </div>
                    Komposisi Emosi
                  </h3>
                </div>
                
                {quarterlyJournals && quarterlyJournals.length > 0 ? (
                  <EmotionCompositionPie/>
                ) : (
                  <div className="text-center py-12">
                    <PieChart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Belum ada data emosi</p>
                  </div>
                )}
              </div>

              {/* Mood vs Air Quality Correlation */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-50 rounded-xl flex items-center justify-center">
                      <Cloud className="h-4 w-4 text-cyan-600" />
                    </div>
                    Mood vs Kualitas Udara
                  </h3>
                </div>
                
                {monthlyJournals && monthlyJournals.length > 0 ? (
                  <MoodAirCorrelationChart/>
                ) : (
                  <div className="text-center py-12">
                    <Cloud className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Belum ada data korelasi</p>
                  </div>
                )}
              </div>

              {/* Word Cloud */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-indigo-600" />
                    </div>
                    Kata-kata Sering Muncul
                  </h3>
                </div>
                
                {allJournals && allJournals.length > 0 ? (
                  <JournalWordCloud />
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Belum ada data untuk word cloud</p>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Insights */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h3 className="text-xl font-medium text-slate-800 mb-6">
                Insight Personal
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Writing Patterns */}
                <div>
                  <h4 className="font-medium text-slate-800 mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-600" />
                    Pola Menulis
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm text-slate-600">Hari aktif menulis</span>
                      <span className="font-medium text-slate-800">{daysWithJournals}/30</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm text-slate-600">Konsistensi</span>
                      <Badge variant={writingFrequency > 70 ? "default" : writingFrequency > 40 ? "secondary" : "outline"}>
                        {writingFrequency > 70 ? "Tinggi" : writingFrequency > 40 ? "Sedang" : "Rendah"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Emotional Insights */}
                <div>
                  <h4 className="font-medium text-slate-800 mb-4 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-slate-600" />
                    Pola Emosi
                  </h4>
                  <div className="space-y-3">
                    {topEmotions.slice(0, 3).map(([emotion, count], index) => (
                      <div key={emotion} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                        <span className="text-sm text-slate-600 capitalize">{emotion}</span>
                        <span className="font-medium text-slate-800">{count}x</span>
                      </div>
                    ))}
                    {topEmotions.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4">
                        Belum ada data emosi yang cukup
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}