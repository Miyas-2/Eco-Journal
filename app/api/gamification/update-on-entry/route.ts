import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@/lib/supabase/server"; // Menggunakan alias untuk kejelasan
import { SupabaseClient } from "@supabase/supabase-js"; // Impor tipe SupabaseClient

// Definisikan tipe untuk achievement agar lebih jelas
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  points_reward: number;
}

interface UserProfile {
  user_id: string;
  total_points: number;
  current_streak: number;
  last_entry_date: string | null;
}

async function tryAwardAchievement(
  supabase: SupabaseClient,
  userId: string,
  achievementName: string
): Promise<{ awardedAchievement: Achievement | null; pointsGained: number }> {
  const { data: achievement, error: achError } = await supabase
    .from("achievements")
    .select("id, name, description, icon_url, points_reward")
    .eq("name", achievementName)
    .single<Achievement>(); // Tentukan tipe data yang diharapkan

  if (achError || !achievement) {
    // console.warn(`Achievement '${achievementName}' not found or error: ${achError?.message}`);
    return { awardedAchievement: null, pointsGained: 0 };
  }

  const { data: existingUserAch, error: existingError } = await supabase
    .from("user_achievements")
    .select("id")
    .eq("user_id", userId)
    .eq("achievement_id", achievement.id)
    .maybeSingle(); // Gunakan maybeSingle untuk menghindari error jika tidak ada

  if (existingError) {
    // console.error(`Error checking existing achievement '${achievementName}' for user ${userId}: ${existingError.message}`);
    return { awardedAchievement: null, pointsGained: 0 };
  }

  if (!existingUserAch) {
    const { error: insertError } = await supabase
      .from("user_achievements")
      .insert({ user_id: userId, achievement_id: achievement.id, earned_at: new Date().toISOString() });

    if (insertError) {
      // console.error(`Error inserting achievement '${achievementName}' for user ${userId}: ${insertError.message}`);
      return { awardedAchievement: null, pointsGained: 0 };
    }
    // Kembalikan achievement yang baru diberikan dan poinnya
    return { awardedAchievement: achievement, pointsGained: achievement.points_reward };
  }
  return { awardedAchievement: null, pointsGained: 0 }; // Sudah pernah didapatkan
}

export async function POST(req: Request) {
  const supabase = await createSupabaseClient(); // Gunakan alias
  try {
    const { userId, journalDate } = await req.json();
    // Anda mungkin perlu mengirim lebih banyak data di masa depan
    // seperti journalEntryTime, wordCount, dll. untuk achievement yang lebih kompleks

    if (!userId || !journalDate) {
      return NextResponse.json({ error: "userId dan journalDate wajib diisi" }, { status: 400 });
    }

    // 1. Ambil atau Buat Profil Pengguna
    let { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("user_id, total_points, current_streak, last_entry_date")
      .eq("user_id", userId)
      .single<UserProfile>(); // Tentukan tipe data yang diharapkan

    const isFirstEntryEver = !profile; // Tandai jika ini profil baru (belum ada sama sekali)

    // Handle error saat mengambil profil, kecuali jika errornya adalah "baris tidak ditemukan" (PGRST116)
    if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error fetching profile:", profileError.message);
        return NextResponse.json({ error: "Gagal mengambil profil pengguna." }, { status: 500 });
    }
    
    if (!profile) { // Jika profil benar-benar tidak ada (bukan hanya error lain)
      const { data: newProfileData, error: insertProfileError } = await supabase
        .from("user_profiles")
        .insert({ user_id: userId, total_points: 0, current_streak: 0, last_entry_date: null })
        .select("user_id, total_points, current_streak, last_entry_date")
        .single<UserProfile>(); // Tentukan tipe data yang diharapkan

      if (insertProfileError || !newProfileData) {
        console.error("Error creating profile:", insertProfileError?.message);
        return NextResponse.json({ error: "Gagal membuat profil pengguna." }, { status: 500 });
      }
      profile = newProfileData;
    }
    
    const initialTotalPoints = profile.total_points;
    let pointsEarnedThisSession = 10; // Poin dasar untuk membuat jurnal
    const newlyAwardedAchievements: Achievement[] = [];

    // 2. Cek Achievement "Jurnal Pertamaku"
    // Kondisi ini lebih ketat: jika profil baru dibuat ATAU jika profil sudah ada tapi belum pernah ada entri (last_entry_date null dan poin 0)
    if (isFirstEntryEver || (profile.last_entry_date === null && profile.total_points === 0 && profile.current_streak === 0)) {
      const { awardedAchievement, pointsGained } = await tryAwardAchievement(supabase, userId, "Jurnal Pertamaku");
      if (awardedAchievement) {
        newlyAwardedAchievements.push(awardedAchievement);
        pointsEarnedThisSession += pointsGained;
      }
    }

    // 3. Hitung dan Cek Streak Achievements
    const lastEntryDateObj = profile.last_entry_date ? new Date(profile.last_entry_date) : null;
    const currentJournalDateObj = new Date(journalDate); // Tanggal jurnal yang dikirim dari client
    let currentStreak = profile.current_streak;

    if (lastEntryDateObj) {
      // Normalisasi tanggal ke awal hari untuk perbandingan yang akurat
      const lastEntryDayStart = new Date(lastEntryDateObj.getFullYear(), lastEntryDateObj.getMonth(), lastEntryDateObj.getDate());
      const currentJournalDayStart = new Date(currentJournalDateObj.getFullYear(), currentJournalDateObj.getMonth(), currentJournalDateObj.getDate());
      
      const diffTime = currentJournalDayStart.getTime() - lastEntryDayStart.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak += 1;
      } else if (diffDays > 1) {
        currentStreak = 1; // Streak putus
      } // Jika diffDays === 0, streak tidak berubah (entri di hari yang sama)
        // Jika diffDays < 0, ini aneh (jurnal masa lalu?), anggap streak putus atau tidak berubah tergantung kebijakan
    } else {
      // Jika belum ada last_entry_date (tapi profil sudah ada), ini adalah entri pertama yang tercatat untuk streak
      currentStreak = 1;
    }
    // Jika ini adalah pembuatan profil pertama kali, pastikan streak adalah 1
    if (isFirstEntryEver && currentStreak === 0) currentStreak = 1;


    const streakAchievementsToTest = [
      { name: "Streak 3 Hari", days: 3 },
      { name: "Streak 7 Hari", days: 7 },
      { name: "Streak 14 Hari", days: 14 },
      { name: "Streak 30 Hari", days: 30 },
    ];

    for (const sa of streakAchievementsToTest) {
      // Cek jika streak MENCAPAI hari yang ditentukan (bukan lebih besar, agar tidak ter-trigger berkali-kali untuk achievement yang sama)
      if (currentStreak === sa.days) {
        const { awardedAchievement, pointsGained } = await tryAwardAchievement(supabase, userId, sa.name);
        if (awardedAchievement) {
          newlyAwardedAchievements.push(awardedAchievement);
          pointsEarnedThisSession += pointsGained;
        }
      }
    }
    
    // 4. Update Profil Pengguna dengan Poin dan Streak Baru
    const finalTotalPoints = initialTotalPoints + pointsEarnedThisSession;

    const { error: updateProfileError } = await supabase
      .from("user_profiles")
      .update({
        total_points: finalTotalPoints,
        current_streak: currentStreak,
        last_entry_date: currentJournalDateObj.toISOString().split('T')[0], // Simpan YYYY-MM-DD
      })
      .eq("user_id", userId);

    if (updateProfileError) {
        console.error("Error updating profile:", updateProfileError.message);
        // Pertimbangkan apakah akan mengembalikan error atau melanjutkan.
        // Untuk gamifikasi, mungkin lebih baik melanjutkan dan mencatat error.
    }

    // 5. Cek Achievement Berbasis Poin (Milestone) SETELAH total poin diupdate
    const pointsAchievementsToTest = [
        { name: "Kolektor Poin: 100", threshold: 100 },
        { name: "Kolektor Poin: 250", threshold: 250 },
        { name: "Kolektor Poin: 500", threshold: 500 },
    ];

    for (const pa of pointsAchievementsToTest) {
        // Cek jika threshold terlewati di sesi ini DAN belum pernah didapatkan
        if (initialTotalPoints < pa.threshold && finalTotalPoints >= pa.threshold) {
            const { awardedAchievement } = await tryAwardAchievement(supabase, userId, pa.name);
            // Poin untuk milestone achievement biasanya 0 (sudah di-handle di tryAwardAchievement),
            // jadi tidak perlu ditambah ke pointsEarnedThisSession lagi.
            if (awardedAchievement) {
                newlyAwardedAchievements.push(awardedAchievement);
                // Jika achievement milestone memberi poin, tambahkan di sini:
                // pointsEarnedThisSession += awardedAchievement.points_reward;
                // Dan pastikan total poin diupdate lagi atau dihitung dengan benar dari awal.
                // Untuk saat ini, kita asumsikan poin milestone sudah termasuk dalam `points_reward` di tabel `achievements`.
            }
        }
    }

    // TODO: Tambahkan logika untuk achievement lain yang memerlukan data spesifik dari entri jurnal
    // (misal: wordCount, waktu entri, penggunaan fitur AI, dll.)
    // Anda perlu mengirim data ini dari client ke endpoint ini.

    return NextResponse.json({
      success: true,
      currentStreak,
      finalTotalPoints,
      newlyAwardedAchievements, // Kirim detail achievement yang baru didapat
      pointsEarnedThisEntry: pointsEarnedThisSession, // Poin yang didapat dari entri ini + achievement
    });

  } catch (error: any) {
    console.error("Gamification API Error:", error);
    return NextResponse.json({ error: error.message || "Kesalahan pada server gamifikasi." }, { status: 500 });
  }
}