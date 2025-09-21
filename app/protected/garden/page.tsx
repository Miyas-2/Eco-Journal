import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from 'next';
import { 
  Award, 
  Trophy, 
  Star, 
  Crown, 
  Target, 
  Calendar,
  TrendingUp,
  BookOpen,
  Heart,
  Zap,
  CheckCircle,
  Lock,
  Sparkles,
  Gift,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata: Metadata = {
  title: 'Garden of Achievements | AtmosFeel',
  description: 'Your collection of wellness achievements and milestones',
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
    let bgColorClass = isEarned ? 'bg-amber-50' : 'bg-slate-50';

    if (name.includes('jurnal') || name.includes('menulis')) {
      IconComponent = BookOpen;
      if (isEarned) {
        colorClass = 'text-blue-500';
        bgColorClass = 'bg-blue-50';
      }
    } else if (name.includes('konsisten') || name.includes('berturut')) {
      IconComponent = Zap;
      if (isEarned) {
        colorClass = 'text-orange-500';
        bgColorClass = 'bg-orange-50';
      }
    } else if (name.includes('milestone') || name.includes('pencapaian')) {
      IconComponent = Trophy;
      if (isEarned) {
        colorClass = 'text-purple-500';
        bgColorClass = 'bg-purple-50';
      }
    } else {
      IconComponent = Star;
      if (isEarned) {
        colorClass = 'text-emerald-500';
        bgColorClass = 'bg-emerald-50';
      }
    }

    return { IconComponent, colorClass, bgColorClass };
  };

  // Calculate progress for some achievements
  const getAchievementProgress = (achievement: any) => {
    const name = achievement.name.toLowerCase();
    const description = achievement.description.toLowerCase();

    // Jurnal writing achievements
    if (name.includes('jurnal') || description.includes('jurnal')) {
      if (description.includes('10')) return Math.min((totalJournals / 10) * 100, 100);
      if (description.includes('25')) return Math.min((totalJournals / 25) * 100, 100);
      if (description.includes('50')) return Math.min((totalJournals / 50) * 100, 100);
      if (description.includes('100')) return Math.min((totalJournals / 100) * 100, 100);
    }

    // Streak achievements
    if (name.includes('berturut') || description.includes('berturut')) {
      if (description.includes('7')) return Math.min((currentStreak / 7) * 100, 100);
      if (description.includes('14')) return Math.min((currentStreak / 14) * 100, 100);
      if (description.includes('30')) return Math.min((currentStreak / 30) * 100, 100);
    }

    return 0;
  };

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';

  // Recent achievements (last 5)
  const recentAchievements = userAchievements?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-8 py-12">
        
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light text-slate-800 mb-2">
                Garden of Achievements
              </h1>
              <p className="text-lg text-slate-500">
                Koleksi pencapaian dan milestone wellness journey Anda
              </p>
            </div>
            <Button 
              asChild 
              variant="outline"
              className="rounded-2xl px-6 py-3 border-slate-200 hover:bg-slate-50"
            >
              <Link href="/protected" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Dashboard
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column - Progress Overview */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Achievement Summary */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="text-center">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-10 w-10 text-amber-500" />
                </div>
                <h3 className="text-xl font-medium text-slate-800 mb-2">{displayName}</h3>
                <p className="text-sm text-slate-500 mb-4">Achievement Hunter</p>
                
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-light text-slate-800 mb-1">
                      {totalEarned}
                    </div>
                    <div className="text-sm text-slate-500">dari {totalAvailable} achievement</div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                      <div 
                        className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(totalEarned / totalAvailable) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Stats */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h4 className="font-medium text-slate-800 mb-4">Progress Saat Ini</h4>
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
                    <Zap className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-slate-600">Streak Saat Ini</span>
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
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-slate-600">Minggu Ini</span>
                  </div>
                  <span className="font-medium text-slate-800">{weeklyJournalCount} jurnal</span>
                </div>
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h4 className="font-medium text-slate-800 mb-4">Pencapaian Terbaru</h4>
              
              {recentAchievements.length > 0 ? (
                <div className="space-y-3">
                  {recentAchievements.map((achievement) => {
                    const { IconComponent, colorClass, bgColorClass } = getAchievementIcon(achievement.achievements.name, true);
                    
                    return (
                      <div key={achievement.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-2xl">
                        <div className={`w-10 h-10 ${bgColorClass} rounded-xl flex items-center justify-center`}>
                          <IconComponent className={`h-5 w-5 ${colorClass}`} />
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
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Belum ada pencapaian</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Achievement Categories */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-3xl p-6 text-center shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-6 w-6 text-blue-500" />
                </div>
                <div className="text-2xl font-light text-slate-800 mb-2">
                  {categorizedAchievements.writing.filter(a => earnedAchievementIds.has(a.id)).length}
                </div>
                <div className="text-sm text-slate-500 font-medium">Menulis</div>
              </div>

              <div className="bg-white rounded-3xl p-6 text-center shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-orange-500" />
                </div>
                <div className="text-2xl font-light text-slate-800 mb-2">
                  {categorizedAchievements.streak.filter(a => earnedAchievementIds.has(a.id)).length}
                </div>
                <div className="text-sm text-slate-500 font-medium">Konsistensi</div>
              </div>

              <div className="bg-white rounded-3xl p-6 text-center shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-6 w-6 text-purple-500" />
                </div>
                <div className="text-2xl font-light text-slate-800 mb-2">
                  {categorizedAchievements.milestone.filter(a => earnedAchievementIds.has(a.id)).length}
                </div>
                <div className="text-sm text-slate-500 font-medium">Milestone</div>
              </div>

              <div className="bg-white rounded-3xl p-6 text-center shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="text-2xl font-light text-slate-800 mb-2">
                  {categorizedAchievements.special.filter(a => earnedAchievementIds.has(a.id)).length}
                </div>
                <div className="text-sm text-slate-500 font-medium">Spesial</div>
              </div>
            </div>

            {/* Achievement Categories */}
            <div className="space-y-8">
              
              {/* Writing Achievements */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-slate-800">Pencapaian Menulis</h3>
                    <p className="text-sm text-slate-500">Achievement yang berkaitan dengan menulis jurnal</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categorizedAchievements.writing.map((achievement) => {
                    const isEarned = earnedAchievementIds.has(achievement.id);
                    const { IconComponent, colorClass, bgColorClass } = getAchievementIcon(achievement.name, isEarned);
                    const progress = getAchievementProgress(achievement);
                    
                    return (
                      <div 
                        key={achievement.id}
                        className={`
                          relative p-6 rounded-2xl border transition-all duration-200
                          ${isEarned 
                            ? 'bg-blue-50 border-blue-200 shadow-sm' 
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }
                        `}
                      >
                        {isEarned && (
                          <div className="absolute top-3 right-3">
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                          </div>
                        )}
                        
                        <div className="text-center">
                          <div className={`w-16 h-16 ${bgColorClass} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                            <IconComponent className={`h-8 w-8 ${colorClass}`} />
                          </div>
                          
                          <h4 className={`font-medium mb-2 ${isEarned ? 'text-slate-800' : 'text-slate-600'}`}>
                            {achievement.name}
                          </h4>
                          
                          <p className={`text-sm mb-4 leading-relaxed ${isEarned ? 'text-slate-600' : 'text-slate-500'}`}>
                            {achievement.description}
                          </p>
                          
                          <div className="flex items-center justify-center gap-2 mb-4">
                            <Award className={`h-4 w-4 ${isEarned ? 'text-amber-500' : 'text-slate-400'}`} />
                            <span className={`text-sm font-medium ${isEarned ? 'text-amber-600' : 'text-slate-500'}`}>
                              {achievement.points_reward} poin
                            </span>
                          </div>
                          
                          {!isEarned && progress > 0 && (
                            <div className="space-y-2">
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-400 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <p className="text-xs text-slate-500">
                                {progress.toFixed(0)}% selesai
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Streak Achievements */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center">
                    <Zap className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-slate-800">Pencapaian Konsistensi</h3>
                    <p className="text-sm text-slate-500">Achievement untuk konsistensi menulis berturut-turut</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categorizedAchievements.streak.map((achievement) => {
                    const isEarned = earnedAchievementIds.has(achievement.id);
                    const { IconComponent, colorClass, bgColorClass } = getAchievementIcon(achievement.name, isEarned);
                    const progress = getAchievementProgress(achievement);
                    
                    return (
                      <div 
                        key={achievement.id}
                        className={`
                          relative p-6 rounded-2xl border transition-all duration-200
                          ${isEarned 
                            ? 'bg-orange-50 border-orange-200 shadow-sm' 
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }
                        `}
                      >
                        {isEarned && (
                          <div className="absolute top-3 right-3">
                            <CheckCircle className="h-5 w-5 text-orange-500" />
                          </div>
                        )}
                        
                        <div className="text-center">
                          <div className={`w-16 h-16 ${bgColorClass} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                            <IconComponent className={`h-8 w-8 ${colorClass}`} />
                          </div>
                          
                          <h4 className={`font-medium mb-2 ${isEarned ? 'text-slate-800' : 'text-slate-600'}`}>
                            {achievement.name}
                          </h4>
                          
                          <p className={`text-sm mb-4 leading-relaxed ${isEarned ? 'text-slate-600' : 'text-slate-500'}`}>
                            {achievement.description}
                          </p>
                          
                          <div className="flex items-center justify-center gap-2 mb-4">
                            <Award className={`h-4 w-4 ${isEarned ? 'text-amber-500' : 'text-slate-400'}`} />
                            <span className={`text-sm font-medium ${isEarned ? 'text-amber-600' : 'text-slate-500'}`}>
                              {achievement.points_reward} poin
                            </span>
                          </div>
                          
                          {!isEarned && progress > 0 && (
                            <div className="space-y-2">
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div 
                                  className="bg-orange-400 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <p className="text-xs text-slate-500">
                                {progress.toFixed(0)}% selesai
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Milestone Achievements */}
              {categorizedAchievements.milestone.length > 0 && (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium text-slate-800">Milestone Pencapaian</h3>
                      <p className="text-sm text-slate-500">Pencapaian besar dalam perjalanan wellness Anda</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categorizedAchievements.milestone.map((achievement) => {
                      const isEarned = earnedAchievementIds.has(achievement.id);
                      const { IconComponent, colorClass, bgColorClass } = getAchievementIcon(achievement.name, isEarned);
                      
                      return (
                        <div 
                          key={achievement.id}
                          className={`
                            relative p-6 rounded-2xl border transition-all duration-200
                            ${isEarned 
                              ? 'bg-purple-50 border-purple-200 shadow-sm' 
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }
                          `}
                        >
                          {isEarned && (
                            <div className="absolute top-3 right-3">
                              <CheckCircle className="h-5 w-5 text-purple-500" />
                            </div>
                          )}
                          
                          <div className="text-center">
                            <div className={`w-16 h-16 ${bgColorClass} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                              <IconComponent className={`h-8 w-8 ${colorClass}`} />
                            </div>
                            
                            <h4 className={`font-medium mb-2 ${isEarned ? 'text-slate-800' : 'text-slate-600'}`}>
                              {achievement.name}
                            </h4>
                            
                            <p className={`text-sm mb-4 leading-relaxed ${isEarned ? 'text-slate-600' : 'text-slate-500'}`}>
                              {achievement.description}
                            </p>
                            
                            <div className="flex items-center justify-center gap-2">
                              <Award className={`h-4 w-4 ${isEarned ? 'text-amber-500' : 'text-slate-400'}`} />
                              <span className={`text-sm font-medium ${isEarned ? 'text-amber-600' : 'text-slate-500'}`}>
                                {achievement.points_reward} poin
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Special Achievements */}
              {categorizedAchievements.special.length > 0 && (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center">
                      <Star className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium text-slate-800">Pencapaian Spesial</h3>
                      <p className="text-sm text-slate-500">Achievement unik dan spesial lainnya</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categorizedAchievements.special.map((achievement) => {
                      const isEarned = earnedAchievementIds.has(achievement.id);
                      const { IconComponent, colorClass, bgColorClass } = getAchievementIcon(achievement.name, isEarned);
                      
                      return (
                        <div 
                          key={achievement.id}
                          className={`
                            relative p-6 rounded-2xl border transition-all duration-200
                            ${isEarned 
                              ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }
                          `}
                        >
                          {isEarned && (
                            <div className="absolute top-3 right-3">
                              <CheckCircle className="h-5 w-5 text-emerald-500" />
                            </div>
                          )}
                          
                          <div className="text-center">
                            <div className={`w-16 h-16 ${bgColorClass} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                              <IconComponent className={`h-8 w-8 ${colorClass}`} />
                            </div>
                            
                            <h4 className={`font-medium mb-2 ${isEarned ? 'text-slate-800' : 'text-slate-600'}`}>
                              {achievement.name}
                            </h4>
                            
                            <p className={`text-sm mb-4 leading-relaxed ${isEarned ? 'text-slate-600' : 'text-slate-500'}`}>
                              {achievement.description}
                            </p>
                            
                            <div className="flex items-center justify-center gap-2">
                              <Award className={`h-4 w-4 ${isEarned ? 'text-amber-500' : 'text-slate-400'}`} />
                              <span className={`text-sm font-medium ${isEarned ? 'text-amber-600' : 'text-slate-500'}`}>
                                {achievement.points_reward} poin
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}