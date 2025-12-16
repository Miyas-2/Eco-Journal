import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from 'next';
import { 
  Award, 
  BookOpen,
  Flame,
  TrendingUp,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import AchievementsSection from "@/components/garden/AchievementsSection";

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
    <div style={{ fontFamily: 'Lexend, sans-serif' }} className="min-h-screen bg-[#f8fafc] dark:bg-[#101a22] md:ml-16">
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

        {/* Milestones Section with Toggle */}
        <AchievementsSection
          allAchievements={allAchievements || []}
          earnedAchievementIds={earnedAchievementIds}
          totalJournals={totalJournals}
          currentStreak={currentStreak}
        />

        {/* Footer Spacer */}
        <div className="h-20"></div>
      </div>
    </div>
  );
}