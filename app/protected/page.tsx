import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Calendar, TrendingUp, Award, Clock, BookOpen, Sparkles, Heart, LucideProps } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import DashboardNotifications from "@/components/dashboard/DashboardNotifications";
import { ForwardRefExoticComponent, RefAttributes } from "react";

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

  // Ambil aktivitas terbaru (5 jurnal terakhir)
  const { data: recentJournals } = await supabase
    .from("journal_entries")
    .select("id, title, created_at, emotion_analysis, emotion_source, emotions(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Ambil achievements yang baru diraih (7 hari terakhir)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { data: recentAchievements } = await supabase
    .from("user_achievements")
    .select("*, achievements(name, description, points_reward)")
    .eq("user_id", user.id)
    .gte("earned_at", sevenDaysAgo.toISOString())
    .order("earned_at", { ascending: false })
    .limit(3);

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';

  // Fungsi untuk mendapatkan emosi display
  const getEmotionDisplay = (journal: any) => {
    if (journal.emotion_source === "ai" && journal.emotion_analysis?.top_prediction?.label) {
      return {
        emotion: journal.emotion_analysis.top_prediction.label,
        source: "AI",
        icon: Sparkles,
        color: "text-purple-600",
        bgColor: "bg-purple-100"
      };
    } else if (journal.emotion_source === "manual" && journal.emotions?.name) {
      return {
        emotion: journal.emotions.name,
        source: "Manual",
        icon: Heart,
        color: "text-blue-600",
        bgColor: "bg-blue-100"
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
        color: 'text-blue-500',
        bgColor: 'bg-blue-100',
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
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-100',
        href: '/protected/garden'
      });
    });
  }

  // Urutkan berdasarkan waktu terbaru
  activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  // Ambil 5 aktivitas terbaru
  const recentActivities = activities.slice(0, 3);

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
      
      <div className="p-4 space-y-6">
        {/* Welcome Section */}
        <section className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Halo, {displayName}! 👋</h1>
          <p className="text-blue-100 mb-4">
            Bagaimana perasaanmu hari ini? Yuk ceritakan dalam jurnal.
          </p>
          <Button asChild variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50">
            <Link href="/protected/journal/new">
              Mulai Menulis
            </Link>
          </Button>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 text-center border">
            <Calendar className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{journalCount?.length || 0}</div>
            <div className="text-xs text-gray-500">Jurnal</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 text-center border">
            <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{profile?.current_streak || 0}</div>
            <div className="text-xs text-gray-500">Hari Berturut</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 text-center border">
            <Award className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{profile?.total_points || 0}</div>
            <div className="text-xs text-gray-500">Poin</div>
          </div>
        </section>

        {/* Recent Activity - Dynamic */}
        <section className="bg-white rounded-lg p-4 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              Aktivitas Terbaru
            </h2>
            {recentActivities.length > 0 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/protected/journal/history" className="text-blue-600 text-sm">
                  Lihat Semua
                </Link>
              </Button>
            )}
          </div>

          {recentActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Belum ada aktivitas</p>
              <p className="text-sm">Mulai dengan menulis jurnal pertamamu!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity) => {
                const ActivityIcon = activity.icon;
                const EmotionIcon = activity.emotionDisplay?.icon;
                
                return (
                  <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.bgColor}`}>
                      <ActivityIcon className={`h-5 w-5 ${activity.color}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        {activity.emotionDisplay && EmotionIcon && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            <EmotionIcon className="h-3 w-3 mr-1" />
                            {activity.emotionDisplay.emotion}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{activity.subtitle}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {getRelativeTime(activity.time)}
                      </p>
                    </div>

                    {activity.href && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={activity.href}>
                          <span className="text-blue-600 text-sm">Lihat</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-4">
          <Button asChild variant="outline" className="h-16">
            <Link href="/protected/journal/history" className="flex flex-col items-center">
              <Calendar className="h-5 w-5 mb-1" />
              <span className="text-sm">Lihat Riwayat</span>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-16">
            <Link href="/protected/garden" className="flex flex-col items-center">
              <Award className="h-5 w-5 mb-1" />
              <span className="text-sm">Lencana Saya</span>
            </Link>
          </Button>
        </section>
      </div>
    </>
  );
}