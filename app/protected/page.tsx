import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from 'next';
import { Calendar, TrendingUp, Award, Clock, BookOpen, Sparkles, Heart, LucideProps, Plus, BarChart3, Target, Smile, Flame, Activity, Brain, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import DashboardNotifications from "@/components/dashboard/DashboardNotifications";
import MoodTrendChart from "@/components/dashboard/MoodTrendChart";
import { ForwardRefExoticComponent, RefAttributes } from "react";

export const metadata: Metadata = {
  title: 'Dashboard | AtmosFeel',
  description: 'Your personal wellness and journaling dashboard',
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Ambil data ringkasan
  const { data: journalCount } = await supabase
    .from("journal_entries")
    .select("id", { count: 'exact' })
    .eq("user_id", user.id);

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("total_points, current_streak")
    .eq("user_id", user.id)
    .single();

  // Ambil data mood trend untuk 7 hari terakhir
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentMoodData } = await supabase
    .from("journal_entries")
    .select("created_at, mood_score")
    .eq("user_id", user.id)
    .gte("created_at", sevenDaysAgo.toISOString())
    .not("mood_score", "is", null)
    .order("created_at", { ascending: true });

  // Ambil aktivitas terbaru (5 jurnal terakhir)
  const { data: recentJournals } = await supabase
    .from("journal_entries")
    .select("id, title, created_at, emotion_analysis, emotion_source, emotions(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Ambil achievements yang baru diraih (7 hari terakhir)
  const { data: recentAchievements } = await supabase
    .from("user_achievements")
    .select("*, achievements(name, description, points_reward)")
    .eq("user_id", user.id)
    .gte("earned_at", sevenDaysAgo.toISOString())
    .order("earned_at", { ascending: false })
    .limit(3);

  // Ambil data untuk quick insights
  const { data: weeklyJournalCount } = await supabase
    .from("journal_entries")
    .select("id", { count: 'exact' })
    .eq("user_id", user.id)
    .gte("created_at", sevenDaysAgo.toISOString());

  // Hitung rata-rata mood minggu ini
  const weeklyAverageMood = recentMoodData && recentMoodData.length > 0
    ? recentMoodData.reduce((sum, entry) => sum + (entry.mood_score || 0), 0) / recentMoodData.length
    : null;

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';

  // Fungsi untuk mendapatkan emosi display
  const getEmotionDisplay = (journal: any) => {
    if (journal.emotion_source === "ai" && journal.emotion_analysis?.top_prediction?.label) {
      return {
        emotion: journal.emotion_analysis.top_prediction.label,
        source: "AI",
        icon: Sparkles,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50"
      };
    } else if (journal.emotion_source === "manual" && journal.emotions?.name) {
      return {
        emotion: journal.emotions.name,
        source: "Manual",
        icon: Heart,
        color: "text-rose-600",
        bgColor: "bg-rose-50"
      };
    }
    return null;
  };

  // Gabungkan aktivitas terbaru
  const activities: { id: string; type: string; title: any; subtitle: string; time: any; icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>; color: string; bgColor: string; href: string; emotionDisplay?: { emotion: any; source: string; icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>; color: string; bgColor: string; } | null; }[] = [];

  // Tambahkan jurnal terbaru
  if (recentJournals) {
    recentJournals.forEach(journal => {
      const emotionDisplay = getEmotionDisplay(journal);
      activities.push({
        id: `journal-${journal.id}`,
        type: 'journal',
        title: journal.title || 'Jurnal Tanpa Judul',
        subtitle: emotionDisplay
          ? `Emosi: ${emotionDisplay.emotion} (${emotionDisplay.source})`
          : 'Menulis jurnal',
        time: journal.created_at,
        icon: BookOpen,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        href: `/protected/journal/${journal.id}`,
        emotionDisplay
      });
    });
  }

  // Tambahkan achievements terbaru
  if (recentAchievements) {
    recentAchievements.forEach(achievement => {
      activities.push({
        id: `achievement-${achievement.id}`,
        type: 'achievement',
        title: 'Meraih Lencana!',
        subtitle: `${achievement.achievements.name} (+${achievement.achievements.points_reward} poin)`,
        time: achievement.earned_at,
        icon: Award,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        href: '/protected/garden'
      });
    });
  }

  // Urutkan berdasarkan waktu terbaru
  activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  // Ambil 5 aktivitas terbaru untuk desktop
  const recentActivities = activities.slice(0, 5);

  // Fungsi untuk format waktu relatif
  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? 'Baru saja' : `${diffInMinutes} menit lalu`;
    } else if (diffInHours < 24) {
      return `${diffInHours} jam lalu`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return diffInDays === 1 ? 'Kemarin' : `${diffInDays} hari lalu`;
    }
  };

  return (
    <>
      <DashboardNotifications />

      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-8 py-12">
          {/* Header Welcome Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light text-slate-800 mb-2">
                  Selamat datang kembali, {displayName}
                </h1>
                <p className="text-lg text-slate-500">
                  Mari lanjutkan perjalanan wellness-mu hari ini
                </p>
              </div>
              <Button 
                asChild 
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl text-base font-medium shadow-sm border-0 h-auto"
              >
                <Link href="/protected/journal/new" className="flex items-center gap-3">
                  <Plus className="h-5 w-5" />
                  Tulis Jurnal Baru
                </Link>
              </Button>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Left Column - Main Overview */}
            <div className="lg:col-span-3 space-y-8">
              
              {/* Mood Check-in Card */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <div className="text-center max-w-md mx-auto">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Smile className="h-10 w-10 text-blue-500" />
                  </div>
                  <h2 className="text-xl font-medium text-slate-800 mb-3">
                    Bagaimana perasaanmu hari ini?
                  </h2>
                  <p className="text-slate-500 mb-6 leading-relaxed">
                    Luangkan waktu sejenak untuk merefleksikan emosi dan pengalamanmu
                  </p>
                  <Button 
                    asChild 
                    variant="outline"
                    className="rounded-2xl px-6 py-3 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                  >
                    <Link href="/protected/journal/new">
                      Mulai Refleksi
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-6 text-center shadow-sm border border-slate-100">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="text-3xl font-light text-slate-800 mb-2">
                    {journalCount?.length || 0}
                  </div>
                  <div className="text-sm text-slate-500 font-medium">Total Jurnal</div>
                </div>

                <div className="bg-white rounded-3xl p-6 text-center shadow-sm border border-slate-100">
                  <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Flame className="h-8 w-8 text-orange-500" />
                  </div>
                  <div className="text-3xl font-light text-slate-800 mb-2">
                    {profile?.current_streak || 0}
                  </div>
                  <div className="text-sm text-slate-500 font-medium">Hari Berturut</div>
                </div>

                <div className="bg-white rounded-3xl p-6 text-center shadow-sm border border-slate-100">
                  <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Award className="h-8 w-8 text-amber-500" />
                  </div>
                  <div className="text-3xl font-light text-slate-800 mb-2">
                    {profile?.total_points || 0}
                  </div>
                  <div className="text-sm text-slate-500 font-medium">Total Poin</div>
                </div>
              </div>

              {/* High-Level Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Mood Trend Chart */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-slate-800 flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                      </div>
                      Tren Mood
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      asChild 
                      className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                    >
                      <Link href="/protected/profile">
                        Detail
                      </Link>
                    </Button>
                  </div>
                  
                  {recentMoodData && recentMoodData.length > 0 ? (
                    <MoodTrendChart />
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 text-sm">
                        Belum ada data mood. Mulai menulis jurnal untuk melihat tren mood Anda.
                      </p>
                    </div>
                  )}
                </div>

                {/* Weekly Summary */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-slate-800 flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center">
                        <Activity className="h-4 w-4 text-green-600" />
                      </div>
                      Ringkasan Minggu Ini
                    </h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">Jurnal Ditulis</p>
                          <p className="text-sm text-slate-500">7 hari terakhir</p>
                        </div>
                      </div>
                      <div className="text-2xl font-light text-slate-800">
                        {weeklyJournalCount?.length || 0}
                      </div>
                    </div>

                    {weeklyAverageMood !== null && (
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Brain className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">Rata-rata Mood</p>
                            <p className="text-sm text-slate-500">Minggu ini</p>
                          </div>
                        </div>
                        <div className="text-2xl font-light text-slate-800">
                          {weeklyAverageMood.toFixed(1)}
                        </div>
                      </div>
                    )}

                    <Button 
                      asChild 
                      variant="outline" 
                      className="w-full rounded-2xl border-slate-200 hover:bg-slate-50"
                    >
                      <Link href="/protected/profile">
                        Lihat Analitik Lengkap
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Button 
                  asChild 
                  variant="outline" 
                  className="h-24 rounded-3xl border-slate-200 hover:bg-slate-50 hover:border-slate-300 p-6"
                >
                  <Link href="/protected/journal/history" className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-slate-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-slate-800">Riwayat Jurnal</div>
                      <div className="text-sm text-slate-500">Lihat semua jurnal yang pernah ditulis</div>
                    </div>
                  </Link>
                </Button>

                <Button 
                  asChild 
                  variant="outline" 
                  className="h-24 rounded-3xl border-slate-200 hover:bg-slate-50 hover:border-slate-300 p-6"
                >
                  <Link href="/protected/garden" className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                      <Award className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-slate-800">Pencapaian</div>
                      <div className="text-sm text-slate-500">Lihat koleksi lencana dan pencapaian</div>
                    </div>
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Column - Activity Feed */}
            <div className="space-y-8">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center">
                      <Clock className="h-4 w-4 text-slate-600" />
                    </div>
                    Aktivitas Terbaru
                  </h3>
                  {recentActivities.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      asChild 
                      className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                    >
                      <Link href="/protected/journal/history">
                        Lihat Semua
                      </Link>
                    </Button>
                  )}
                </div>

                {recentActivities.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-slate-300" />
                    </div>
                    <h4 className="font-medium text-slate-800 mb-2">Belum ada aktivitas</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Mulai dengan menulis jurnal pertamamu untuk melihat aktivitas di sini
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivities.map((activity) => {
                      const ActivityIcon = activity.icon;
                      const EmotionIcon = activity.emotionDisplay?.icon;

                      return (
                        <div key={activity.id} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors duration-200">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${activity.bgColor} flex-shrink-0`}>
                            <ActivityIcon className={`h-5 w-5 ${activity.color}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-medium text-slate-800 truncate">
                                {activity.title}
                              </p>
                              {activity.emotionDisplay && EmotionIcon && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs px-2 py-1 rounded-lg border-slate-200 text-slate-600"
                                >
                                  <EmotionIcon className="h-3 w-3 mr-1" />
                                  {activity.emotionDisplay.emotion}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 mb-2 leading-relaxed">{activity.subtitle}</p>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getRelativeTime(activity.time)}
                            </p>
                          </div>

                          {activity.href && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              asChild 
                              className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl px-3 flex-shrink-0"
                            >
                              <Link href={activity.href}>
                                Lihat
                              </Link>
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}