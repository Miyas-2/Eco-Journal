'use client';

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DynamicLucideIcon } from "@/components/ui/dynamic-lucide-icon";
import { Award, BarChart3, Coins, UserCircle, CheckCircle2, Circle, Trophy, Target, Edit3 } from "lucide-react";
import EditDisplayNameModal from "@/components/profile/edit-display-name-modal";
import { User } from "@supabase/supabase-js";
import toast from "react-hot-toast";

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

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [earnedAchievements, setEarnedAchievements] = useState<DisplayAchievement[]>([]);
  const [unearnedAchievements, setUnearnedAchievements] = useState<DisplayAchievement[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !currentUser) {
          console.error("User not authenticated or error fetching user:", userError);
          router.push('/auth/login');
          return;
        }

        setUser(currentUser);
        setDisplayName(currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0] || 'User');

        // Ambil profil user
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("user_id, total_points, current_streak, last_entry_date")
          .eq("user_id", currentUser.id)
          .single<UserProfileData>();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching profile:", profileError.message);
        } else {
          setProfile(profileData);
        }

        // 1. Ambil SEMUA achievement yang tersedia
        const { data: allAchievements, error: allAchievementsError } = await supabase
          .from("achievements")
          .select("id, name, description, icon_url, points_reward")
          .order("points_reward", { ascending: true })
          .returns<AchievementData[]>();

        if (allAchievementsError) {
          console.error("Error fetching all achievements:", allAchievementsError.message);
          return;
        }

        // 2. Ambil achievement yang SUDAH DIRAIH user
        const { data: userEarnedAchievementsData, error: userAchievementsError } = await supabase
          .from("user_achievements")
          .select("earned_at, achievement_id, achievements(id, name, description, icon_url, points_reward)")
          .eq("user_id", currentUser.id)
          .returns<Array<{ earned_at: string; achievement_id: string; achievements: AchievementData }>>();

        if (userAchievementsError) {
          console.error("Error fetching user achievements:", userAchievementsError.message);
          return;
        }

        // 3. Gabungkan data dan pisahkan
        const earnedList: DisplayAchievement[] = [];
        const unearnedList: DisplayAchievement[] = [];

        if (allAchievements && allAchievements.length > 0) {
          allAchievements.forEach(ach => {
            const earnedVersion = userEarnedAchievementsData?.find(ua => ua.achievement_id === ach.id);
            if (earnedVersion) {
              earnedList.push({
                ...ach,
                is_earned: true,
                earned_at: earnedVersion.earned_at,
              });
            } else {
              unearnedList.push({
                ...ach,
                is_earned: false,
                earned_at: null,
              });
            }
          });
        }

        setEarnedAchievements(earnedList);
        setUnearnedAchievements(unearnedList);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Terjadi kesalahan saat memuat data profil');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [supabase, router]);

  const handleDisplayNameUpdate = async (newDisplayName: string) => {
    setDisplayName(newDisplayName);
    
    // Refresh user data to get updated metadata
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Memuat profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-8 p-6 bg-card border rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <UserCircle className="h-16 w-16 text-primary" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {displayName}
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                  className="h-8 w-8 p-0 hover:bg-muted"
                  title="Edit Display Name"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
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

      {/* Edit Display Name Modal */}
      <EditDisplayNameModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentDisplayName={displayName}
        onSuccess={handleDisplayNameUpdate}
      />
    </div>
  );
}