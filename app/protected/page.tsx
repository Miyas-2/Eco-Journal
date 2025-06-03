import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ProtectedDashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-center sm:text-left">
          Dashboard Eco-Emosi
        </h1>
        {/* Tambahkan tombol logout jika perlu */}
        <div className="mb-4">
  <Link href="/protected/journal/history" className="text-blue-600 hover:underline">
    Lihat Histori Jurnal &rarr;
  </Link>
</div>
      </div>

      <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center mb-6">
        <InfoIcon size={16} strokeWidth={2} />
        Selamat datang, <span className="font-semibold">{data.user.email}</span>! Ini adalah halaman yang hanya bisa diakses pengguna terautentikasi.
      </div>

      <div className="mb-8 p-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg shadow-lg text-white text-center">
        <h2 className="text-2xl font-semibold mb-2">Bagaimana Perasaanmu Hari Ini?</h2>
        <p className="mb-4">
          Catat emosimu dan lihat bagaimana lingkungan di sekitarmu mungkin berperan.
        </p>
        <Button asChild variant="secondary" size="lg" className="bg-white text-primary hover:bg-gray-100">
          <Link href="/protected/journal/new">Buat Jurnal Baru</Link>
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Aktivitas Jurnalmu</h2>
        <p className="text-muted-foreground">Belum ada entri jurnal terbaru untuk ditampilkan.</p>
      </div>
    </div>
  );
}