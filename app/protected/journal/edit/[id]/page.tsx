import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import JournalEditForm from "@/components/journal/journal-edit-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function EditJournalPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { id: journalId } = await params;
  
  // Ambil data journal untuk di-edit
  const { data: journal, error: journalError } = await supabase
    .from("journal_entries")
    .select("*, emotions(name)")
    .eq("id", journalId)  
    .eq("user_id", user.id)
    .single();

  if (journalError || !journal) {
    redirect("/protected/journal/history?error=notfound");
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/protected/journal/history" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke History
          </Link>
        </Button>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Edit Jurnal</h1>
      <div className="max-w-2xl mx-auto bg-card p-6 sm:p-8 rounded-lg shadow-md border">
        <JournalEditForm userId={user.id} existingJournal={journal} />
      </div>
    </div>
  );
}