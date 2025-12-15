import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from 'next';
import { 
  Award, 
  Trophy, 
  Star,
  BookOpen,
  Zap,
  CheckCircle,
  Lock,
  ArrowLeft,
  Flame,
  TrendingUp,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export const metadata: Metadata = {
  title: 'Journey & Achievements | Jurnalin',
  description: 'Your mindful consistency and wellness achievements',
};

export default async function GardenPage() {
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

  // Ambil semua achievements yang tersedia
  const { data: allAchievements } = await supabase
    .from("achievements")
    .select("*")
    .order("points_reward", { ascending: false });

  // Ambil achievements yang sudah diraih user
  const { data: userAchievements } = await supabase
    .from("user_achievements")
    .select("*, achievements(*)")
    .eq("user_id", user.id)
    .order("earned_at", { ascending: false });

  // Ambil data untuk progress tracking
  const { data: journalCount } = await supabase
    .from("journal_entries")
    .select("id", { count: 'exact' })
    .eq("user_id", user.id);

  const { data: weeklyJournals } = await supabase
    .from("journal_entries")
    .select("id", { count: 'exact' })
    .eq("user_id", user.id)
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const totalJournals = journalCount?.length || 0;
  const weeklyJournalCount = weeklyJournals?.length || 0;
  const currentStreak = profile?.current_streak || 0;
  const totalPoints = profile?.total_points || 0;
  const totalEarned = userAchievements?.length || 0;
  const totalAvailable = allAchievements?.length || 0;

  // Buat map dari earned achievements
  const earnedAchievementIds = new Set(
    userAchievements?.map(ua => ua.achievement_id) || []
  );

  // Kategorisasi achievements
  const categorizedAchievements = {
    writing: allAchievements?.filter(a => 
      a.name.toLowerCase().includes('jurnal') || 
      a.name.toLowerCase().includes('menulis') ||
      a.description.toLowerCase().includes('jurnal')
    ) || [],
    streak: allAchievements?.filter(a => 
      a.name.toLowerCase().includes('konsisten') || 
      a.name.toLowerCase().includes('berturut') ||
      a.description.toLowerCase().includes('berturut')
    ) || [],
    milestone: allAchievements?.filter(a => 
      a.name.toLowerCase().includes('milestone') || 
      a.name.toLowerCase().includes('pencapaian') ||
      a.points_reward >= 100
    ) || [],
    special: allAchievements?.filter(a => 
      !a.name.toLowerCase().includes('jurnal') && 
      !a.name.toLowerCase().includes('menulis') &&
      !a.name.toLowerCase().includes('konsisten') && 
      !a.name.toLowerCase().includes('berturut') &&
      !a.name.toLowerCase().includes('milestone') &&
      a.points_reward < 100
    ) || []
  };

  // Achievement icon mapping
  const getAchievementIcon = (achievementName: string, isEarned: boolean) => {
    const name = achievementName.toLowerCase();
    let IconComponent;
    let colorClass = isEarned ? 'text-amber-500' : 'text-slate-400';
    let bgColorClass = isEarned ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-slate-50 dark:bg-slate-700';

    if (name.includes('jurnal') || name.includes('menulis')) {
      IconComponent = BookOpen;
      if (isEarned) {
        colorClass = 'text-blue-500 dark:text-blue-400';
        bgColorClass = 'bg-blue-50 dark:bg-blue-900/20';
      }
    } else if (name.includes('konsisten') || name.includes('berturut')) {
      IconComponent = Zap;
      if (isEarned) {
        colorClass = 'text-orange-500 dark:text-orange-400';
        bgColorClass = 'bg-orange-50 dark:bg-orange-900/20';
      }
    } else if (name.includes('milestone') || name.includes('pencapaian')) {
      IconComponent = Trophy;
      if (isEarned) {
        colorClass = 'text-purple-500 dark:text-purple-400';
        bgColorClass = 'bg-purple-50 dark:bg-purple-900/20';
      }
    } else {
      IconComponent = Star;
      if (isEarned) {
        colorClass = 'text-emerald-500 dark:text-emerald-400';
        bgColorClass = 'bg-emerald-50 dark:bg-emerald-900/20';
      }
    }

    return { IconComponent, colorClass, bgColorClass };
  };

  // Calculate progress for achievements
  const getAchievementProgress = (achievement: any) => {
    const name = achievement.name.toLowerCase();
    const description = achievement.description.toLowerCase();

    // Jurnal writing achievements
    if (name.includes('jurnal') || description.includes('jurnal')) {
      if (description.includes('10')) return { current: totalJournals, target: 10, percentage: Math.min((totalJournals / 10) * 100, 100) };
      if (description.includes('25')) return { current: totalJournals, target: 25, percentage: Math.min((totalJournals / 25) * 100, 100) };
      if (description.includes('50')) return { current: totalJournals, target: 50, percentage: Math.min((totalJournals / 50) * 100, 100) };
      if (description.includes('100')) return { current: totalJournals, target: 100, percentage: Math.min((totalJournals / 100) * 100, 100) };
    }

    // Streak achievements
    if (name.includes('berturut') || description.includes('berturut')) {
      if (description.includes('7')) return { current: currentStreak, target: 7, percentage: Math.min((currentStreak / 7) * 100, 100) };
      if (description.includes('14')) return { current: currentStreak, target: 14, percentage: Math.min((currentStreak / 14) * 100, 100) };
      if (description.includes('30')) return { current: currentStreak, target: 30, percentage: Math.min((currentStreak / 30) * 100, 100) };
    }

    return { current: 0, target: 0, percentage: 0 };
  };

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';

  // Calculate level based on points
  const getLevel = (points: number) => {
    if (points >= 1000) return { level: 5, name: "Mindful Master", next: 2000 };
    if (points >= 750) return { level: 4, name: "Rooted Sapling", next: 1000 };
    if (points >= 500) return { level: 3, name: "Growing Seed", next: 750 };
    if (points >= 250) return { level: 2, name: "Budding Sprout", next: 500 };
    return { level: 1, name: "New Seedling", next: 250 };
  };

  const currentLevel = getLevel(totalPoints);
  const levelProgress = ((totalPoints % currentLevel.next) / currentLevel.next) * 100;

  return (
    <div style={{ fontFamily: 'Lexend, sans-serif' }} className="min-h-screen bg-[#f8fafc] dark:bg-[#101a22]">
      <div className="max-w-[960px] mx-auto px-4 md:px-10 py-8">
        
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

        {/* Page Heading */}
        <div className="flex flex-col gap-3 mb-8">
          <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-light tracking-[-0.033em]">
            Your Mindful Consistency
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-light leading-normal max-w-2xl">
            See how your reflection practice is growing alongside the seasons. A gentle record of your journey inward.
          </p>
        </div>

        {/* Hero Section: Streak */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="w-full md:w-1/2 bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-700 dark:to-slate-800 min-h-[240px] flex items-center justify-center p-8">
              <div className="text-center">
                <div className="text-6xl mb-4">🌱</div>
                <p className="text-slate-600 dark:text-slate-300 text-sm">Keep growing</p>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-6 p-6 md:p-8 w-full md:w-1/2">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#2b9dee]">
                  <Flame className="h-5 w-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">Current Streak</span>
                </div>
                <h2 className="text-slate-900 dark:text-white text-4xl md:text-5xl font-light tracking-[-0.033em]">
                  {currentStreak} Days
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-light">
                  {currentStreak === 0 
                    ? "Start your journey today. Every great story begins with a single step."
                    : currentStreak < 7
                    ? "You are flowing well. Your practice is taking root like a sapling in spring."
                    : "Excellent consistency! You're building a strong foundation for mindfulness."}
                </p>
              </div>
              <Link
                href="/protected/journal/new"
                className="flex w-fit items-center justify-center gap-2 overflow-hidden rounded-xl h-12 px-6 bg-[#2b9dee] hover:bg-[#1e7ac7] text-white transition-all shadow-md shadow-[#2b9dee]/20"
              >
                <Sparkles className="h-5 w-5" />
                <span className="text-base font-bold tracking-[0.015em]">Check In Today</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Progress & Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Progress Bar Column */}
          <div className="md:col-span-3 flex flex-col gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-end">
              <div className="flex flex-col gap-1">
                <p className="text-slate-900 dark:text-white text-lg font-bold">Deepening Practice</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Level {currentLevel.level}: {currentLevel.name}</p>
              </div>
              <span className="text-[#2b9dee] font-bold text-sm bg-[#2b9dee]/10 px-3 py-1 rounded-full">
                {currentLevel.next - totalPoints} points to go
              </span>
            </div>
            <div className="relative h-4 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div 
                className="absolute h-full rounded-full bg-gradient-to-r from-sky-300 to-[#2b9dee] transition-all duration-1000 ease-out"
                style={{ width: `${levelProgress}%` }}
              ></div>
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-xs text-right">
              {totalPoints} / {currentLevel.next} Total Points
            </p>
          </div>

          {/* Stats Card 1 */}
          <div className="flex flex-col gap-3 rounded-2xl p-6 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="size-10 rounded-full bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center text-[#2b9dee] mb-2">
              <BookOpen className="h-5 w-5" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Total Entries</p>
            <p className="text-slate-900 dark:text-white text-3xl font-bold leading-tight">{totalJournals}</p>
          </div>

          {/* Stats Card 2 */}
          <div className="flex flex-col gap-3 rounded-2xl p-6 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="size-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 mb-2">
              <Award className="h-5 w-5" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Reflection Points</p>
            <p className="text-slate-900 dark:text-white text-3xl font-bold leading-tight">{totalPoints}</p>
          </div>

          {/* Environmental Insight Card */}
          <div className="flex flex-col gap-3 rounded-2xl p-6 bg-emerald-50/50 dark:bg-emerald-900/10 shadow-sm border border-emerald-100 dark:border-emerald-900/30 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-emerald-100 dark:text-emerald-900/20 opacity-50 group-hover:scale-110 transition-transform duration-500 text-[120px]">
              ☁️
            </div>
            <div className="size-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2 z-10">
              <TrendingUp className="h-5 w-5" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider z-10">Achievements</p>
            <p className="text-slate-900 dark:text-white text-lg font-bold leading-tight z-10">
              {totalEarned} of {totalAvailable} unlocked
            </p>
          </div>
        </div>

        {/* Milestones Section */}
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h3 className="text-slate-900 dark:text-white text-2xl font-bold">Milestones</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {allAchievements?.slice(0, 8).map((achievement) => {
              const isEarned = earnedAchievementIds.has(achievement.id);
              const { IconComponent, colorClass, bgColorClass } = getAchievementIcon(achievement.name, isEarned);
              const progress = getAchievementProgress(achievement);
              const inProgress = !isEarned && progress.percentage > 0;

              return (
                <div
                  key={achievement.id}
                  className={`flex flex-col gap-4 rounded-2xl p-5 border shadow-sm transition-all ${
                    isEarned
                      ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:shadow-md'
                      : inProgress
                      ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 relative overflow-hidden'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800/50 opacity-70 grayscale'
                  }`}
                >
                  {inProgress && (
                    <div className="absolute bottom-0 left-0 h-1 bg-[#2b9dee]/20 w-full">
                      <div className="h-full bg-[#2b9dee]" style={{ width: `${progress.percentage}%` }}></div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start">
                    <div className={`size-12 rounded-full flex items-center justify-center ${bgColorClass}`}>
                      <IconComponent className={`h-6 w-6 ${colorClass}`} />
                    </div>
                    {isEarned ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    ) : inProgress ? (
                      <span className="text-xs font-bold text-[#2b9dee] bg-[#2b9dee]/10 px-2 py-1 rounded">
                        {progress.current}/{progress.target}
                      </span>
                    ) : (
                      <Lock className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                  
                  <div>
                    <p className="text-slate-900 dark:text-white font-bold text-lg mb-1">
                      {achievement.name}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      {achievement.description}
                    </p>
                  </div>
                  
                  {isEarned && (
                    <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700">
                      <span className="text-xs font-bold text-amber-500">
                        +{achievement.points_reward} points earned
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Spacer */}
        <div className="h-20"></div>
      </div>
    </div>
  );
}