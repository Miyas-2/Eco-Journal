'use client';

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserCircle, Edit3, LogOut, Settings, BarChart3, Calendar, Flower2, BookOpen, TrendingUp, Smile, Cloud, User, Award, Target } from "lucide-react";
import EditDisplayNameModal from "@/components/profile/edit-display-name-modal";
import { User as SupabaseUser } from "@supabase/supabase-js";
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
  const [user, setUser] = useState<SupabaseUser | null>(null);
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
        toast.error('Terjadi kesalahan saat memuat data profil', {
          style: {
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            color: '#991b1b',
            border: '1px solid #fca5a5',
            borderRadius: '1rem',
            fontFamily: 'Poppins, sans-serif',
          },
        });
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
      
      toast.success('Nama berhasil diperbarui!', {
        style: {
          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
          color: '#065f46',
          border: '1px solid #a7f3d0',
          borderRadius: '1rem',
          fontFamily: 'Poppins, sans-serif',
        },
      });
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
        toast.error('Gagal keluar dari akun', {
          style: {
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            color: '#991b1b',
            border: '1px solid #fca5a5',
            borderRadius: '1rem',
            fontFamily: 'Poppins, sans-serif',
          },
        });
      } else {
        toast.success('Berhasil keluar dari akun', {
          style: {
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            color: '#065f46',
            border: '1px solid #a7f3d0',
            borderRadius: '1rem',
            fontFamily: 'Poppins, sans-serif',
          },
        });
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Error during sign out:', error);
      toast.error('Terjadi kesalahan saat keluar', {
        style: {
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          color: '#991b1b',
          border: '1px solid #fca5a5',
          borderRadius: '1rem',
          fontFamily: 'Poppins, sans-serif',
        },
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const getMoodLabel = (score: number) => {
    if (score >= 0.6) return { text: "Sangat Positif", color: "text-emerald-600", bgColor: "bg-emerald-100" };
    if (score >= 0.2) return { text: "Positif", color: "text-emerald-500", bgColor: "bg-emerald-50" };
    if (score >= -0.2) return { text: "Netral", color: "text-amber-500", bgColor: "bg-amber-50" };
    if (score >= -0.6) return { text: "Negatif", color: "text-orange-500", bgColor: "bg-orange-50" };
    return { text: "Sangat Negatif", color: "text-red-500", bgColor: "bg-red-50" };
  };

  const formatMoodScore = (score: number) => {
    return score.toFixed(3);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-emerald-50/30 flex justify-center items-center font-organik">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200/40 float-organic">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
          <p className="text-organic-body font-medium">Memuat profil Anda...</p>
        </div>
      </div>
    );
  }

  const moodInfo = getMoodLabel(journalStats.average_mood);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-emerald-50/30 font-organik">
      <div className="container-organic py-8 space-organic-y-lg">

        {/* Profile Header - Modern Organik */}
        <section className="card-organic rounded-3xl p-8 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-4 left-4 w-24 h-24 bg-white rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-lg">
                <User className="h-10 w-10 text-white" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">{displayName}</h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditModalOpen(true)}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-xl w-fit mx-auto sm:mx-0"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
                <p className="text-emerald-100 text-lg">{user?.email}</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-200 rounded-full"></div>
                    <span className="text-emerald-100">Eco Journalist</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-teal-200 rounded-full"></div>
                    <span className="text-emerald-100">{profile?.total_points || 0} poin terkumpul</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tab Navigation - Modern Organik */}
        <section className="card-organic rounded-3xl p-2 bg-white/50 backdrop-blur-sm border border-stone-200/30">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-3 px-6 rounded-2xl text-sm font-medium transition-all duration-300 ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200/40'
                  : 'text-organic-secondary hover:text-organic-title hover:bg-white/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>Ringkasan</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 py-3 px-6 rounded-2xl text-sm font-medium transition-all duration-300 ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200/40'
                  : 'text-organic-secondary hover:text-organic-title hover:bg-white/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>Analitik</span>
              </div>
            </button>
          </div>
        </section>

        {activeTab === 'overview' ? (
          <>
            {/* Quick Stats Grid - Modern Organik */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card-organic rounded-3xl p-6 text-center bg-gradient-to-br from-orange-50/50 to-red-50/50 border border-orange-200/30">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200/40">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-organic-title mb-1">{profile?.current_streak || 0}</div>
                <div className="text-sm text-organic-secondary">Hari Berturut</div>
              </div>
              
              <div className="card-organic rounded-3xl p-6 text-center bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border border-blue-200/30">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200/40">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-organic-title mb-1">{journalStats.total_entries}</div>
                <div className="text-sm text-organic-secondary">Total Jurnal</div>
              </div>

              <div className="card-organic rounded-3xl p-6 text-center bg-gradient-to-br from-purple-50/50 to-pink-50/50 border border-purple-200/30">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-200/40">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-organic-title mb-1">{journalStats.this_week}</div>
                <div className="text-sm text-organic-secondary">Minggu Ini</div>
              </div>

              <div className="card-organic rounded-3xl p-6 text-center bg-gradient-to-br from-emerald-50/50 to-teal-50/50 border border-emerald-200/30">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200/40">
                  <Smile className="h-6 w-6 text-white" />
                </div>
                <div className={`text-lg font-bold mb-1 ${moodInfo.color}`}>
                  {formatMoodScore(journalStats.average_mood)}
                </div>
                <div className="text-sm text-organic-secondary">Rata-rata Mood</div>
              </div>
            </section>

            {/* Monthly Progress - Modern Organik */}
            <section className="card-organic rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200/40">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-organic-title">Progress Bulan Ini</h3>
              </div>
              
              <div className="space-y-6">
                <div className="card-organic rounded-2xl p-6 bg-gradient-to-br from-stone-50/50 to-white/80">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-organic-title mb-1">{journalStats.this_month}</div>
                      <div className="text-sm text-organic-secondary">Jurnal Ditulis</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-organic-title mb-1">{profile?.total_points || 0}</div>
                      <div className="text-sm text-organic-secondary">Poin Terkumpul</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-bold mb-1 ${moodInfo.color}`}>
                        {moodInfo.text}
                      </div>
                      <div className="text-xs text-organic-caption">
                        ({formatMoodScore(journalStats.average_mood)})
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mood Visual */}
                <div className="card-organic rounded-2xl p-4 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 border border-emerald-200/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-organic-title">Status Mood Bulanan</span>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${moodInfo.bgColor} ${moodInfo.color}`}>
                      {moodInfo.text}
                    </div>
                  </div>
                  <div className="w-full bg-gradient-to-r from-stone-200 to-stone-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        journalStats.average_mood >= 0 
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-400' 
                          : 'bg-gradient-to-r from-orange-400 to-red-400'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.abs(journalStats.average_mood) * 100)}%`,
                        marginLeft: journalStats.average_mood >= 0 ? '50%' : `${50 - (Math.abs(journalStats.average_mood) * 50)}%`
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-organic-caption mt-2">
                    <span>Negatif</span>
                    <span>Netral</span>
                    <span>Positif</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Navigation - Modern Organik */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                  <Target className="h-4 w-4 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-organic-title">Navigasi Cepat</h2>
              </div>
              
              <div className="space-y-4">
                <Link href="/protected/journal/history" className="block">
                  <div className="card-organic rounded-3xl p-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-200/30 hover:shadow-lg hover:border-blue-300/50 transition-all duration-300 group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200/40 group-hover:shadow-blue-300/60 transition-all duration-300">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-organic-title group-hover:text-blue-700 transition-colors duration-300">
                          Riwayat Jurnal
                        </div>
                        <div className="text-sm text-organic-secondary">
                          {journalStats.this_month} entri bulan ini
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 text-xs">→</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
                
                <Link href="/protected/garden" className="block">
                  <div className="card-organic rounded-3xl p-6 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 border border-emerald-200/30 hover:shadow-lg hover:border-emerald-300/50 transition-all duration-300 group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200/40 group-hover:shadow-emerald-300/60 transition-all duration-300">
                        <Flower2 className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-organic-title group-hover:text-emerald-700 transition-colors duration-300">
                          Taman Pencapaian
                        </div>
                        <div className="text-sm text-organic-secondary">
                          {profile?.total_points || 0} poin terkumpul
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <span className="text-emerald-600 text-xs">→</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </section>
          </>
        ) : (
          /* Analytics Tab - Modern Organik */
          <div className="space-organic-y-lg">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-organic-title mb-2">Analitik Perjalanan Anda</h2>
              <p className="text-organic-body">Lihat perkembangan mood dan pola journaling Anda</p>
            </div>
            
            <MoodTrendChart />
            <MoodAirCorrelationChart />
            <EmotionCompositionPie />
            <JournalWordCloud />
          </div>
        )}

        {/* Settings & Actions - Modern Organik */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-stone-100 to-stone-200 rounded-xl flex items-center justify-center">
              <Settings className="h-4 w-4 text-stone-600" />
            </div>
            <h2 className="text-xl font-bold text-organic-title">Pengaturan</h2>
          </div>
          
          <div className="space-y-4">
            <div className="card-organic rounded-3xl p-6 bg-gradient-to-r from-stone-50/50 to-white/80 border border-stone-200/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-stone-100 to-stone-200 rounded-2xl flex items-center justify-center">
                  <Settings className="h-6 w-6 text-stone-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-stone-400">Pengaturan Aplikasi</div>
                  <div className="text-sm text-stone-400">Segera hadir dalam update mendatang</div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full card-organic rounded-3xl p-6 bg-gradient-to-r from-red-50/50 to-pink-50/50 border border-red-200/30 hover:shadow-lg hover:border-red-300/50 transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200/40 group-hover:shadow-red-300/60 transition-all duration-300">
                  {isSigningOut ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <LogOut className="h-6 w-6 text-white" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-red-700 group-hover:text-red-800 transition-colors duration-300">
                    {isSigningOut ? 'Memproses...' : 'Keluar dari Akun'}
                  </div>
                  <div className="text-sm text-red-600">
                    {isSigningOut ? 'Tunggu sebentar' : 'Logout dari aplikasi'}
                  </div>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* App Info - Modern Organik */}
        <section className="card-organic rounded-3xl p-8 text-center bg-gradient-to-br from-emerald-50/30 via-white/50 to-teal-50/30 pattern-organic relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200/40 float-organic">
              <span className="text-white text-lg font-bold">🌱</span>
            </div>
            <h3 className="text-lg font-bold text-organic-title mb-2">Eco Journal v1.0</h3>
            <p className="text-organic-body mb-4">Aplikasi jurnal untuk kesehatan mental dan lingkungan</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-organic-caption">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span>Ramah lingkungan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                <span>Mendukung wellbeing</span>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Spacer for Mobile Navigation */}
        <div className="h-8"></div>
      </div>

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