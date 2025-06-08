'use client';

import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { Award } from 'lucide-react';
// Jika Anda ingin menggunakan DynamicLucideIcon di sini, pastikan path importnya benar
// import { DynamicLucideIcon } from '@/components/ui/dynamic-lucide-icon';

interface Achievement {
    name: string;
    description: string;
    icon_url: string | null;
    points_reward: number;
}

export default function DashboardNotifications() {
  useEffect(() => {
    // Cek notifikasi umum "Jurnal berhasil disimpan"
    const journalSaveSuccess = sessionStorage.getItem('journalSaveSuccess');
    if (journalSaveSuccess) {
        toast.success("Jurnal berhasil disimpan!");
        sessionStorage.removeItem('journalSaveSuccess'); // Hapus setelah ditampilkan
    }

    // Cek notifikasi achievement
    const achievementsString = sessionStorage.getItem('newlyAwardedAchievements');
    if (achievementsString) {
      try {
        const newlyAwardedAchievements: Achievement[] = JSON.parse(achievementsString);
        if (newlyAwardedAchievements && newlyAwardedAchievements.length > 0) {
          newlyAwardedAchievements.forEach((ach, index) => {
            // Tambahkan sedikit delay agar toast tidak muncul bersamaan jika ada banyak
            setTimeout(() => {
              toast.success(
                (t) => (
                  <div className="flex items-center gap-3">
                    {/* Ganti dengan DynamicLucideIcon jika sudah siap dan diuji */}
                    <Award className="h-8 w-8 text-yellow-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-md">Pencapaian Diraih!</p>
                      <p className="text-sm">{ach.name}</p>
                    </div>
                  </div>
                ), {
                  duration: 5000 + index * 300, // Durasi sedikit lebih lama untuk setiap toast
                  id: `achievement-toast-${ach.name.replace(/\s+/g, '-')}-${index}`, // ID unik untuk toast
                }
              );
            }, index * 600); // Stagger kemunculan toast
          });
        }
      } catch (e) {
        console.error("Error memproses atau menampilkan achievement dari sessionStorage:", e);
      } finally {
        sessionStorage.removeItem('newlyAwardedAchievements'); // Hapus setelah ditampilkan
      }
    }
  }, []); // Array dependensi kosong agar hanya berjalan sekali saat komponen dimuat

  return null; // Komponen ini tidak merender UI secara langsung
}