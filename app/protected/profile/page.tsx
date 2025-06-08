import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { DynamicLucideIcon } from "@/components/ui/dynamic-lucide-icon";
import { Award, BarChart3, Coins, UserCircle, CheckCircle2, Circle, Trophy, Target } from "lucide-react"; // Tambahkan Trophy dan Target
import { CalendarDays } from "lucide-react"; // Tambahkan CalendarDays untuk judul section

// Definisikan tipe untuk data yang diambil agar lebih jelas
interface AchievementData {
    id: string;
    name: string;
    description: string;
    icon_url: string | null;
    points_reward: number;
}

// Tipe baru untuk data entri jurnal kalender
interface JournalEntryDate {
  date: string; // YYYY-MM-DD
  count: number; // Jumlah entri pada tanggal tersebut
}

// Tipe baru untuk achievement yang digabungkan
interface DisplayAchievement extends AchievementData {
    earned_at: string | null;
    is_earned: boolean;
}

interface UserProfileData {
    user_id: string;
    total_points: number;
    current_streak: number;
    last_entry_date: string | null;
}


export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("User not authenticated or error fetching user:", userError);
    redirect("/auth/login");
  }

  // Ambil profil user
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("user_id, total_points, current_streak, last_entry_date")
    .eq("user_id", user.id)
    .single<UserProfileData>();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error("Error fetching profile:", profileError.message);
  }

  // 1. Ambil SEMUA achievement yang tersedia
  const { data: allAchievements, error: allAchievementsError } = await supabase
    .from("achievements")
    .select("id, name, description, icon_url, points_reward")
    .order("points_reward", { ascending: true })
    .returns<AchievementData[]>();

  if (allAchievementsError) {
    console.error("Error fetching all achievements:", allAchievementsError.message);
  }

  // 2. Ambil achievement yang SUDAH DIRAIH user
  const { data: userEarnedAchievementsData, error: userAchievementsError } = await supabase
    .from("user_achievements")
    .select("earned_at, achievement_id, achievements(id, name, description, icon_url, points_reward)")
    .eq("user_id", user.id)
    .returns<Array<{ earned_at: string; achievement_id: string; achievements: AchievementData }>>();


  if (userAchievementsError) {
    console.error("Error fetching user achievements:", userAchievementsError.message);
  }

  // 3. Gabungkan data dan pisahkan
  const earnedAchievements: DisplayAchievement[] = [];
  const unearnedAchievements: DisplayAchievement[] = [];

  if (allAchievements && allAchievements.length > 0) {
    allAchievements.forEach(ach => {
      const earnedVersion = userEarnedAchievementsData?.find(ua => ua.achievement_id === ach.id);
      if (earnedVersion) {
        earnedAchievements.push({
          ...ach,
          is_earned: true,
          earned_at: earnedVersion.earned_at,
        });
      } else {
        unearnedAchievements.push({
          ...ach,
          is_earned: false,
          earned_at: null,
        });
      }
    });
  }

  // Helper function untuk merender kartu achievement
  const renderAchievementCard = (achievement: DisplayAchievement) => (
    <div
      key={achievement.id}
      className={`p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center relative
                  ${achievement.is_earned ? 'bg-card' : 'bg-muted/30 opacity-70'}`}
    >
      {achievement.is_earned && (
        <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-green-500" aria-label="Sudah Diraih">
           <title>Sudah Diraih</title>
        </CheckCircle2>
      )}
      {!achievement.is_earned && (
        <Circle className="absolute top-2 right-2 h-5 w-5 text-gray-400" aria-label="Belum Diraih">
           <title>Belum Diraih</title>
        </Circle>
      )}

      {achievement.icon_url ? (
        <DynamicLucideIcon
          name={achievement.icon_url}
          className={`w-12 h-12 mb-3 ${achievement.is_earned ? 'text-primary' : 'text-muted-foreground'}`}
        />
      ) : (
        <div className={`w-12 h-12 mb-3 rounded-full flex items-center justify-center ${achievement.is_earned ? 'bg-muted' : 'bg-gray-200'}`}>
            <Award className={`w-6 h-6 ${achievement.is_earned ? 'text-muted-foreground' : 'text-gray-400'}`} />
        </div>
      )}
      <h3 className={`font-semibold text-md mb-1 ${achievement.is_earned ? 'text-foreground' : 'text-muted-foreground'}`}>{achievement.name}</h3>
      <p className="text-xs text-muted-foreground mb-2 h-10 line-clamp-2">
        {achievement.description}
      </p>
      <div className="mt-auto w-full">
        {achievement.is_earned && achievement.earned_at && (
            <Badge variant="secondary" className="text-xs mb-1 w-full block">
              Diraih: {new Date(achievement.earned_at).toLocaleDateString("id-ID", {day: 'numeric', month: 'short', year: 'numeric'})}
            </Badge>
        )}
        {achievement.points_reward > 0 && (
            <span className={`text-xs font-bold block ${achievement.is_earned ? 'text-yellow-600' : 'text-gray-500'}`}>
                +{achievement.points_reward} Poin
            </span>
        )}
        {!achievement.is_earned && achievement.points_reward === 0 && (
             <span className="text-xs text-gray-500 block italic">Milestone</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-8 p-6 bg-card border rounded-lg shadow-sm">
        {/* ... (kode header profil tetap sama) ... */}
        <div className="flex items-center gap-4 mb-4">
            <UserCircle className="h-16 w-16 text-primary" />
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    Profil & Pencapaian
                </h1>
                <p className="text-muted-foreground">{user.email}</p>
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <Coins className="h-5 w-5 text-yellow-500" />
                <span>Total Poin:</span>
                <span className="font-bold text-lg">{profile?.total_points ?? 0}</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <span>Streak Saat Ini:</span>
                <span className="font-bold text-lg">{profile?.current_streak ?? 0} hari</span>
            </div>
        </div>
      </header>

      {/* Section untuk Achievement yang Sudah Diraih */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-green-600">
            <Trophy className="h-6 w-6" />
            Lencana yang Sudah Diraih ({earnedAchievements.length})
        </h2>
        {earnedAchievements.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {earnedAchievements.map(renderAchievementCard)}
          </div>
        ) : (
          <div className="text-center py-6 px-4 border-2 border-dashed rounded-lg border-gray-300">
            <Trophy className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Kamu belum meraih lencana penghargaan apapun.</p>
            <p className="text-sm text-muted-foreground">Teruslah menulis jurnal untuk mendapatkannya!</p>
          </div>
        )}
      </section>

      {/* Section untuk Achievement yang Belum Diraih */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-600">
            <Target className="h-6 w-6" />
            Target Lencana Berikutnya ({unearnedAchievements.length})
        </h2>
        {unearnedAchievements.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {unearnedAchievements.map(renderAchievementCard)}
          </div>
        ) : (
          <div className="text-center py-6 px-4 border-2 border-dashed rounded-lg border-gray-300">
            <Target className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Selamat! Kamu telah meraih semua lencana yang tersedia!</p>
          </div>
        )}
      </section>
    </div>
  );
}