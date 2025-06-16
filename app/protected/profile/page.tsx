'use client';

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserCircle, Edit3, LogOut, Settings, BarChart3, Calendar, Flower2, BookOpen, TrendingUp, Smile, Cloud } from "lucide-react";
import EditDisplayNameModal from "@/components/profile/edit-display-name-modal";
import { User } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import Link from "next/link";

// Import komponen dashboard statistik
import MoodTrendChart from "@/components/dashboard/MoodTrendChart";
import EmotionCompositionPie from "@/components/dashboard/EmotionCompositionPie";
import JournalWordCloud from "@/components/dashboard/JournalWordCloud";
import MoodAirCorrelationChart from "@/components/dashboard/MoodAirCorrelationChart";

interface UserProfileData {
    user_id: string;
    total_points: number;
    current_streak: number;
    last_entry_date: string | null;
}

interface JournalStats {
  total_entries: number;
  this_month: number;
  this_week: number;
  average_mood: number;
}

interface JournalEntry {
  id: string;
  created_at: string;
  mood_score: number | null;
}

interface EmotionData {
  sentiment_score: number;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [journalStats, setJournalStats] = useState<JournalStats>({ 
    total_entries: 0, 
    this_month: 0, 
    this_week: 0,
    average_mood: 0 
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');

  const supabase = createClient();
  const router = useRouter();

  // Function untuk menghitung mood score
  const calculateMoodScore = async (journalEntries: JournalEntry[]) => {
    let totalMoodScore = 0;
    let validEntries = 0;

    for (const entry of journalEntries) {
      let moodScore = entry.mood_score;

      // Jika mood_score null, ambil dari sentiment_score di tabel emotions
      if (moodScore === null) {
        const { data: emotions, error } = await supabase
          .from("emotions")
          .select("sentiment_score")
          .eq("journal_entry_id", entry.id);

        if (!error && emotions && emotions.length > 0) {
          // Hitung rata-rata sentiment_score jika ada multiple emotions
          const avgSentiment = emotions.reduce((sum: number, emotion: EmotionData) => 
            sum + emotion.sentiment_score, 0) / emotions.length;
          moodScore = avgSentiment;
        }
      }

      // Jika berhasil mendapat mood score, tambahkan ke perhitungan
      if (moodScore !== null && !isNaN(moodScore)) {
        totalMoodScore += moodScore;
        validEntries++;
      }
    }

    return validEntries > 0 ? totalMoodScore / validEntries : 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !currentUser) {
          console.error("User not authenticated:", userError);
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

        // Ambil data jurnal dengan mood_score
        const { data: journalEntries, error: journalError } = await supabase
          .from("journal_entries")
          .select("id, created_at, mood_score")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });

        if (!journalError && journalEntries) {
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          
          const thisMonthEntries = journalEntries.filter(entry => {
            const entryDate = new Date(entry.created_at);
            return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
          });

          const thisWeekEntries = journalEntries.filter(entry => {
            const entryDate = new Date(entry.created_at);
            return entryDate >= oneWeekAgo;
          });

          // Hitung rata-rata mood dengan fallback ke emotions table
          const averageMood = await calculateMoodScore(thisMonthEntries);

          setJournalStats({
            total_entries: journalEntries.length,
            this_month: thisMonthEntries.length,
            this_week: thisWeekEntries.length,
            average_mood: averageMood
          });
        }

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
    
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        toast.error('Gagal keluar dari akun');
      } else {
        toast.success('Berhasil keluar dari akun');
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Error during sign out:', error);
      toast.error('Terjadi kesalahan saat keluar');
    } finally {
      setIsSigningOut(false);
    }
  };

  const getMoodLabel = (score: number) => {
    // Sesuaikan dengan skala yang digunakan di aplikasi
    if (score >= 0.6) return { text: "Sangat Positif", color: "text-green-600" };
    if (score >= 0.2) return { text: "Positif", color: "text-green-500" };
    if (score >= -0.2) return { text: "Netral", color: "text-yellow-500" };
    if (score >= -0.6) return { text: "Negatif", color: "text-orange-500" };
    return { text: "Sangat Negatif", color: "text-red-500" };
  };

  const formatMoodScore = (score: number) => {
    // Tampilkan nilai asli dengan 2 desimal
    return score.toFixed(3);
  };

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

  const moodInfo = getMoodLabel(journalStats.average_mood);

  return (
    <div className="p-4 space-y-6">
      {/* Profile Header */}
      <section className="bg-white rounded-lg p-6 border">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <UserCircle className="h-10 w-10 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="h-8 w-8 p-0"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Ringkasan
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'analytics'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Analitik
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Quick Stats Grid */}
          <section className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border text-center">
              <TrendingUp className="h-6 w-6 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{profile?.current_streak || 0}</div>
              <div className="text-xs text-gray-500">Hari Berturut</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border text-center">
              <BookOpen className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{journalStats.total_entries}</div>
              <div className="text-xs text-gray-500">Total Jurnal</div>
            </div>

            <div className="bg-white rounded-lg p-4 border text-center">
              <Calendar className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{journalStats.this_week}</div>
              <div className="text-xs text-gray-500">Minggu Ini</div>
            </div>

            <div className="bg-white rounded-lg p-4 border text-center">
              <Smile className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <div className={`text-lg font-bold ${moodInfo.color}`}>
                {formatMoodScore(journalStats.average_mood)}
              </div>
              <div className="text-xs text-gray-500">Rata-rata Mood</div>
            </div>
          </section>

          {/* Monthly Progress */}
          <section className="bg-white rounded-lg p-4 border">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Progress Bulan Ini
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Jurnal ditulis</span>
                <span className="font-medium">{journalStats.this_month} entri</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Poin terkumpul</span>
                <span className="font-medium">{profile?.total_points || 0} poin</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Mood rata-rata</span>
                <div className="flex flex-col items-end">
                  <span className={`font-medium ${moodInfo.color}`}>
                    {moodInfo.text}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({formatMoodScore(journalStats.average_mood)})
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Navigation */}
          <section>
            <h2 className="text-lg font-semibold mb-3 text-gray-900">Navigasi Cepat</h2>
            <div className="space-y-3">
              <Button asChild variant="outline" className="w-full h-14 justify-start">
                <Link href="/protected/journal/history" className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <div className="text-left">
                    <div className="font-medium">Riwayat Jurnal</div>
                    <div className="text-sm text-gray-500">{journalStats.this_month} entri bulan ini</div>
                  </div>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full h-14 justify-start">
                <Link href="/protected/garden" className="flex items-center gap-3">
                  <Flower2 className="h-5 w-5 text-green-500" />
                  <div className="text-left">
                    <div className="font-medium">Taman Pencapaian</div>
                    <div className="text-sm text-gray-500">{profile?.total_points || 0} poin terkumpul</div>
                  </div>
                </Link>
              </Button>
            </div>
          </section>
        </>
      ) : (
        /* Analytics Tab */
        <div className="space-y-6">
          {/* Mood Trend Chart */}
          <MoodTrendChart />
          
          {/* Emotion Composition */}
          <EmotionCompositionPie />
          
          {/* Word Cloud */}
          <JournalWordCloud />
          
          {/* Mood Air Correlation */}
          <MoodAirCorrelationChart />
        </div>
      )}

      {/* Settings & Actions */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-gray-900">Pengaturan</h2>
        <div className="space-y-3">
          {/* Future: Settings page */}
          <Button variant="outline" className="w-full h-12 justify-start" disabled>
            <Settings className="h-5 w-5 mr-3 text-gray-400" />
            <span className="text-gray-400">Pengaturan (Segera Hadir)</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full h-12 justify-start text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="h-5 w-5 mr-3" />
            {isSigningOut ? 'Keluar...' : 'Keluar dari Akun'}
          </Button>
        </div>
      </section>

      {/* App Info */}
      <section className="text-center py-4 text-sm text-gray-500">
        <p>Eco Journal v1.0</p>
        <p>Aplikasi jurnal untuk kesehatan mental</p>
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