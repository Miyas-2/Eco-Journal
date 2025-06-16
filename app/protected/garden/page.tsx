import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Trophy, Target, Coins, TrendingUp } from "lucide-react";
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

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <section className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">🌿 Taman Pencapaian</h1>
        <p className="text-gray-600">Kumpulkan lencana dengan rajin menulis jurnal</p>
      </section>

      {/* Stats Overview */}
      <section className="bg-gradient-to-r from-green-400 to-blue-500 rounded-xl p-6 text-white">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <Coins className="h-8 w-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{profile?.total_points || 0}</div>
            <div className="text-sm text-green-100">Total Poin</div>
          </div>
          <div className="text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{profile?.current_streak || 0}</div>
            <div className="text-sm text-green-100">Hari Berturut</div>
          </div>
        </div>
      </section>

      {/* Earned Achievements */}
      <section>
        <div className="flex items-center mb-4">
          <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
          <h2 className="text-lg font-semibold">Lencana Diraih ({earnedAchievements?.length || 0})</h2>
        </div>
        
        {earnedAchievements && earnedAchievements.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {earnedAchievements.map((achievement) => (
              <div key={achievement.id} className="bg-white border rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="font-medium text-sm mb-1">{achievement.achievements.name}</h3>
                <p className="text-xs text-gray-600 mb-2">{achievement.achievements.description}</p>
                <Badge variant="secondary" className="text-xs">
                  +{achievement.achievements.points_reward} poin
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-lg border">
            <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Belum ada lencana yang diraih</p>
          </div>
        )}
      </section>

      {/* Target Achievements */}
      <section>
        <div className="flex items-center mb-4">
          <Target className="h-5 w-5 text-blue-500 mr-2" />
          <h2 className="text-lg font-semibold">Target Lencana</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {unearnedAchievements.map((achievement) => (
            <div key={achievement.id} className="bg-white border rounded-lg p-4 text-center opacity-60">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="font-medium text-sm mb-1">{achievement.name}</h3>
              <p className="text-xs text-gray-600 mb-2">{achievement.description}</p>
              <Badge variant="outline" className="text-xs">
                +{achievement.points_reward} poin
              </Badge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}