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

  // Ambil 3 aktivitas terbaru
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
      
      <div className="space-organic-y-lg">
        {/* Welcome Section - Modern Organik Style */}
        <section className="card-organic m-2 rounded-3xl p-6 bg-gradient-to-br from-emerald-400/10 via-teal-400/10 to-sky-blue/10 border-0 pattern-organic relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200/40 float-organic">
                <span className="text-white text-xl">🌱</span>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-organic-title mb-1">
                  Halo, {displayName}! 
                </h1>
                <p className="text-organic-secondary text-sm">
                  Selamat datang kembali di perjalanan mindfulness-mu
                </p>
              </div>
            </div>
            
            <p className="text-organic-body mb-6 leading-relaxed">
              Bagaimana perasaanmu hari ini? Mari luangkan waktu sejenak untuk merefleksikan momen-momen berharga.
            </p>
            
            <Button asChild className="btn-organic-primary">
              <Link href="/protected/journal/new" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Mulai Menulis Jurnal
              </Link>
            </Button>
          </div>
        </section>

        {/* Quick Stats - Modern Organik Grid */}
        <section className="grid grid-cols-3 gap-4 m-2">
          <div className="card-organic rounded-2xl p-4 text-center hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-organic-title mb-1">
              {journalCount?.length || 0}
            </div>
            <div className="text-xs text-organic-secondary font-medium">
              Total Jurnal
            </div>
          </div>
          
          <div className="card-organic rounded-2xl p-4 text-center hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-organic-title mb-1">
              {profile?.current_streak || 0}
            </div>
            <div className="text-xs text-organic-secondary font-medium">
              Hari Berturut
            </div>
          </div>
          
          <div className="card-organic rounded-2xl p-4 text-center hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-yellow-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Award className="h-6 w-6 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-organic-title mb-1">
              {profile?.total_points || 0}
            </div>
            <div className="text-xs text-organic-secondary font-medium">
              Total Poin
            </div>
          </div>
        </section>

        {/* Recent Activity - Modern Organik Design */}
        <section className="card-organic rounded-3xl p-6 m-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-organic-title flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-stone-100 to-stone-200 rounded-xl flex items-center justify-center">
          <Clock className="h-4 w-4 text-stone-600" />
              </div>
              Aktivitas Terbaru
            </h2>
            {recentActivities.length > 0 && (
              <Button variant="ghost" size="sm" asChild className="text-organic-accent hover:bg-emerald-50 rounded-xl">
          <Link href="/protected/journal/history">
            Lihat Semua
          </Link>
              </Button>
            )}
          </div>

          {recentActivities.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-stone-100 to-stone-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Calendar className="h-8 w-8 text-stone-400" />
              </div>
              <h3 className="text-lg font-medium text-organic-title mb-2">
          Belum ada aktivitas
              </h3>
              <p className="text-organic-secondary mb-4">
          Mulai perjalanan mindfulness-mu dengan menulis jurnal pertama
              </p>
              <Button asChild className="btn-organic-secondary">
          <Link href="/protected/journal/new">
            Tulis Jurnal Pertama
          </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((activity) => {
          const ActivityIcon = activity.icon;
          const EmotionIcon = activity.emotionDisplay?.icon;
          
          return (
            <div 
              key={activity.id} 
              className="flex items-center gap-4 p-4 rounded-2xl hover:bg-stone-50/50 transition-all duration-300 group border border-stone-100/50"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${activity.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                <ActivityIcon className={`h-5 w-5 ${activity.color}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-organic-title truncate">
              {activity.title}
            </h3>
            {activity.emotionDisplay && EmotionIcon && (
              <Badge 
                variant="outline" 
                className="text-xs px-2 py-1 rounded-full border-emerald-200 text-emerald-700 bg-emerald-50"
              >
                <EmotionIcon className="h-3 w-3 mr-1" />
                {activity.emotionDisplay.emotion}
              </Badge>
            )}
                </div>
                <p className="text-sm text-organic-secondary truncate mb-1">
            {activity.subtitle}
                </p>
                <p className="text-xs text-organic-caption flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {getRelativeTime(activity.time)}
                </p>
              </div>

              {activity.href && (
                <Button 
            variant="ghost" 
            size="sm" 
            asChild 
            className="text-organic-accent hover:bg-emerald-50 rounded-xl"
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
        </section>

        {/* Quick Actions - Modern Organik Style */}
        <section className="grid grid-cols-2 gap-4 m-2">
          <Button 
            asChild 
            variant="outline" 
            className="h-20 flex-col gap-3 border-stone-200/50 hover:border-emerald-200 hover:bg-emerald-50/50 rounded-2xl transition-all duration-300"
          >
            <Link href="/protected/journal/history">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-organic-title">Riwayat Jurnal</span>
            </Link>
          </Button>
          
          <Button 
            asChild 
            variant="outline" 
            className="h-20 flex-col gap-3 border-stone-200/50 hover:border-emerald-200 hover:bg-emerald-50/50 rounded-2xl transition-all duration-300"
          >
            <Link href="/protected/garden">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-yellow-200 rounded-xl flex items-center justify-center">
                <Award className="h-4 w-4 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-organic-title">Taman Lencana</span>
            </Link>
          </Button>
        </section>

        {/* Mindfulness Quote - Organic Touch */}
        <section className="card-organic rounded-3xl p-6 bg-gradient-to-r from-stone-50/50 to-white/50 border-stone-200/30">
          <div className="text-center">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-lg">🌸</span>
            </div>
            <blockquote className="text-organic-body italic leading-relaxed mb-2">
              "Setiap hari adalah kesempatan baru untuk tumbuh dan merefleksikan diri."
            </blockquote>
            <cite className="text-xs text-organic-caption font-medium">
              — Atmosfeel
            </cite>
          </div>
        </section>
      </div>
    </>
  );
}