import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function JournalHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Ambil histori jurnal user
  const { data: journals, error } = await supabase
    .from("journal_entries")
    .select("id, content, created_at, emotion_analysis")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/protected" className="text-blue-600 hover:underline">
          &larr; Kembali ke Dashboard
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-6">Histori Jurnal Saya</h1>
      {error && (
        <div className="text-red-600 mb-4">Gagal memuat data jurnal: {error.message}</div>
      )}
      {!journals || journals.length === 0 ? (
        <div className="text-muted-foreground">Belum ada entri jurnal.</div>
      ) : (
        <div className="space-y-4">
          {journals.map((journal: any) => (
            <div key={journal.id} className="p-4 border rounded-lg bg-muted/30">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">
                  {new Date(journal.created_at).toLocaleString("id-ID")}
                </span>
                {journal.emotion_analysis?.top_prediction?.label && (
                  <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-semibold">
                    {journal.emotion_analysis.top_prediction.label}
                  </span>
                )}
              </div>
              <div className="whitespace-pre-line">{journal.content}</div>
              {/* Tambahkan link ke detail jika ingin */}
              {/* <Link href={`/protected/journal/${journal.id}`} className="text-blue-600 text-xs hover:underline">Lihat detail</Link> */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}