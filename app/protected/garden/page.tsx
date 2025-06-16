import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Trophy, Target, Coins, TrendingUp, Sparkles, Award, Star, Crown, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function GardenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Ambil data profil dan achievements
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: earnedAchievements } = await supabase
    .from("user_achievements")
    .select("*, achievements(*)")
    .eq("user_id", user.id);

  const { data: allAchievements } = await supabase
    .from("achievements")
    .select("*")
    .order("points_reward", { ascending: true });

  const earnedIds = earnedAchievements?.map(ea => ea.achievement_id) || [];
  const unearnedAchievements = allAchievements?.filter(a => !earnedIds.includes(a.id)) || [];

  // Helper untuk mendapatkan level berdasarkan poin
  const getLevel = (points: number) => {
    if (points >= 1000) return { level: 'Master', icon: Crown, color: 'text-purple-700', bg: 'from-purple-100 to-purple-200' };
    if (points >= 500) return { level: 'Expert', icon: Star, color: 'text-blue-700', bg: 'from-blue-100 to-blue-200' };
    if (points >= 200) return { level: 'Advanced', icon: Zap, color: 'text-emerald-700', bg: 'from-emerald-100 to-emerald-200' };
    if (points >= 50) return { level: 'Intermediate', icon: Award, color: 'text-amber-700', bg: 'from-amber-100 to-amber-200' };
    return { level: 'Beginner', icon: Sparkles, color: 'text-stone-700', bg: 'from-stone-100 to-stone-200' };
  };

  const userLevel = getLevel(profile?.total_points || 0);
  const LevelIcon = userLevel.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-emerald-50/30 font-organik">
      <div className="container-organic py-8 space-organic-y-lg">
        
        {/* Header Section - Modern Organik */}
        <section className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200/40 float-organic">
            <span className="text-3xl">🌿</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-organic-title mb-3 leading-tight">
            Taman Pencapaian
          </h1>
          <p className="text-lg text-organic-body max-w-2xl mx-auto leading-relaxed">
            Kembangkan kebiasaan journaling Anda dan kumpulkan lencana sebagai tanda pencapaian perjalanan refleksi diri
          </p>
        </section>

        {/* User Level & Stats Overview - Modern Organik */}
        <section className="card-organic rounded-3xl p-8 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-4 left-4 w-24 h-24 bg-white rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* User Level */}
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${userLevel.bg} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <LevelIcon className={`h-8 w-8 ${userLevel.color}`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-emerald-100 mb-1">Level Saat Ini</div>
                    <div className="text-2xl font-bold text-white">{userLevel.level}</div>
                  </div>
                </div>
                <p className="text-emerald-100 text-sm max-w-xs">
                  Terus menulis jurnal untuk naik level dan membuka pencapaian baru!
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-6 w-full lg:w-auto">
                <div className="card-organic rounded-2xl p-6 bg-white/20 backdrop-blur-sm text-center">
                  <div className="w-12 h-12 bg-white/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Coins className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {profile?.total_points || 0}
                  </div>
                  <div className="text-sm text-emerald-100 font-medium">Total Poin</div>
                </div>

                <div className="card-organic rounded-2xl p-6 bg-white/20 backdrop-blur-sm text-center">
                  <div className="w-12 h-12 bg-white/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {profile?.current_streak || 0}
                  </div>
                  <div className="text-sm text-emerald-100 font-medium">Hari Berturut</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Progress to Next Level */}
        <section className="card-organic rounded-3xl p-6 bg-gradient-to-br from-amber-50/50 to-orange-50/50 border border-amber-200/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-organic-title">Progress ke Level Selanjutnya</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-organic-secondary">Poin yang dibutuhkan:</span>
              <span className="font-medium text-organic-title">
                {profile?.total_points || 0} / {
                  profile?.total_points >= 1000 ? '∞' :
                  profile?.total_points >= 500 ? '1000' :
                  profile?.total_points >= 200 ? '500' :
                  profile?.total_points >= 50 ? '200' : '50'
                }
              </span>
            </div>
            <div className="w-full bg-gradient-to-r from-stone-200 to-stone-100 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-700 ease-out shadow-sm"
                style={{
                  width: `${Math.min(100, 
                    profile?.total_points >= 1000 ? 100 :
                    profile?.total_points >= 500 ? ((profile?.total_points || 0) / 1000) * 100 :
                    profile?.total_points >= 200 ? ((profile?.total_points || 0) / 500) * 100 :
                    profile?.total_points >= 50 ? ((profile?.total_points || 0) / 200) * 100 :
                    ((profile?.total_points || 0) / 50) * 100
                  )}%`
                }}
              ></div>
            </div>
          </div>
        </section>

        {/* Earned Achievements - Modern Organik */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-200/40">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-organic-title">
              Lencana Diraih ({earnedAchievements?.length || 0})
            </h2>
          </div>
          
          {earnedAchievements && earnedAchievements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {earnedAchievements.map((achievement) => (
                <div key={achievement.id} className="card-organic rounded-3xl p-6 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 border border-yellow-200/30 text-center group hover:shadow-lg transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-200/40 group-hover:shadow-yellow-300/60 transition-all duration-300 float-organic">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-organic-title mb-2">
                    {achievement.achievements.name}
                  </h3>
                  <p className="text-sm text-organic-secondary mb-4 leading-relaxed">
                    {achievement.achievements.description}
                  </p>
                  <Badge className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200/50 font-medium rounded-full px-4 py-2">
                    <Coins className="h-3 w-3 mr-1" />
                    +{achievement.achievements.points_reward} poin
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-organic rounded-3xl p-12 text-center bg-gradient-to-br from-stone-50/50 to-white/80 border border-stone-200/30">
              <div className="w-20 h-20 bg-gradient-to-br from-stone-100 to-stone-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trophy className="h-10 w-10 text-stone-400" />
              </div>
              <h3 className="text-xl font-semibold text-organic-title mb-3">
                Belum Ada Lencana
              </h3>
              <p className="text-organic-secondary leading-relaxed max-w-md mx-auto">
                Mulai menulis jurnal secara rutin untuk mendapatkan lencana pertama Anda. Setiap pencapaian adalah langkah menuju kebiasaan yang lebih baik!
              </p>
            </div>
          )}
        </section>

        {/* Target Achievements - Modern Organik */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200/40">
              <Target className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-organic-title">
              Target Lencana ({unearnedAchievements.length})
            </h2>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {unearnedAchievements.map((achievement) => (
              <div key={achievement.id} className="card-organic rounded-3xl p-6 bg-gradient-to-br from-stone-50/50 to-white/80 border border-stone-200/30 text-center group hover:shadow-lg hover:border-emerald-200/50 transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-stone-100 to-stone-200 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:shadow-md transition-all duration-300">
              <Trophy className="h-8 w-8 text-stone-400 group-hover:text-stone-500 transition-colors duration-300" />
            </div>
            <h3 className="font-bold text-lg text-organic-title mb-2">
              {achievement.name}
            </h3>
            <p className="text-sm text-organic-secondary mb-4 leading-relaxed">
              {achievement.description}
            </p>
            <Badge variant="outline" className="border-stone-300 text-stone-600 font-medium rounded-full px-4 py-2 group-hover:border-emerald-300 group-hover:text-emerald-700 transition-all duration-300">
              <Coins className="h-3 w-3 mr-1" />
              +{achievement.points_reward} poin
            </Badge>
              </div>
            ))}
          </div>
        </section>

        {/* Motivation Section - Modern Organik */}
        <section className="card-organic rounded-3xl p-8 bg-gradient-to-br from-emerald-50/30 via-white/50 to-teal-50/30 pattern-organic relative overflow-hidden text-center">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200/40 float-organic">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-organic-title mb-4">
              Terus Berkembang!
            </h3>
            <p className="text-organic-body leading-relaxed max-w-2xl mx-auto mb-6">
              Setiap jurnal yang Anda tulis adalah investasi untuk kesehatan mental dan pengembangan diri. 
              Mari bersama-sama membangun kebiasaan positif yang berkelanjutan.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-organic-caption">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span>Konsistensi adalah kunci</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                <span>Setiap refleksi berharga</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <span>Pertumbuhan bertahap</span>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Spacer for Mobile Navigation */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}