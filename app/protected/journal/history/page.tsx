import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button"; // Untuk tombol lihat detail
import { ArrowLeft, Eye } from "lucide-react"; // Tambahkan ikon
import { Badge } from "@/components/ui/badge";

export default async function JournalHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: journals, error } = await supabase
    .from("journal_entries")
    .select("id, title, content, created_at, emotion_analysis") // Ambil field yang dibutuhkan untuk list
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Cek query param untuk error dari halaman detail
  // const searchParams = useSearchParams(); // Ini hanya bisa di client component
  // Untuk server component, Anda bisa meneruskannya sebagai props jika diperlukan,
  // atau handle error dengan cara lain. Untuk kesederhanaan, kita skip ini dulu.

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/protected" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard
          </Link>
        </Button>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center sm:text-left">Histori Jurnal Saya</h1>

      {error && (
        <div className="text-destructive bg-destructive/10 p-3 rounded-md mb-4">
          Gagal memuat data jurnal: {error.message}
        </div>
      )}
      {/* Anda bisa menambahkan pesan jika ada ?error=notfound di URL dari redirect */}

      {!journals || journals.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground text-lg">Belum ada entri jurnal.</p>
          <Button asChild className="mt-4">
            <Link href="/protected/journal/new">Buat Jurnal Pertamamu</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {journals.map((journal: any) => ( // Sebaiknya definisikan tipe untuk journal
            <div key={journal.id} className="p-4 sm:p-5 border rounded-lg bg-card shadow hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                <div>
                  {/* Tampilkan title di sini */}
                  <h2 className="text-lg font-semibold text-primary hover:underline">
                    <Link href={`/protected/journal/${journal.id}`}>
                      {journal.title || <span className="italic">Tanpa Judul</span>}
                    </Link>
                  </h2>
                  <span className="text-xs text-muted-foreground font-medium">
                    {new Date(journal.created_at).toLocaleString("id-ID", { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
                {(journal.emotion_analysis as any)?.top_prediction?.label && (
                  <Badge variant="outline" className="text-xs whitespace-nowrap mt-1 sm:mt-0">
                    {(journal.emotion_analysis as any).top_prediction.label}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground line-clamp-3 mb-3">
                {journal.content || <span className="italic">Tidak ada konten.</span>}
              </p>
              <Button variant="ghost" size="sm" asChild className="text-primary hover:bg-primary/10">
                <Link href={`/protected/journal/${journal.id}`} className="flex items-center gap-1.5 text-xs">
                  <Eye className="h-3.5 w-3.5" />
                  Lihat Detail
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}