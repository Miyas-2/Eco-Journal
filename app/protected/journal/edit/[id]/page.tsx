"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import JournalEditForm from "@/components/journal/journal-edit-form";

interface JournalEditPageProps {
  params: { id: string };
}

export default function JournalEditPage({ params }: JournalEditPageProps) {
  const [journal, setJournal] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUser(user);

      const { id: journalId } = await params;
      const { data: journal, error: journalError } = await supabase
        .from("journal_entries")
        .select("*, emotions(name)")
        .eq("id", journalId)
        .eq("user_id", user.id)
        .single();

      if (journalError || !journal) {
        console.error("Error fetching journal or journal not found:", journalError);
        router.push("/protected/journal/history?error=notfound");
        return;
      }

      setJournal(journal);
      setLoading(false);
    };

    loadData();
  }, [params, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-600">Memuat jurnal...</p>
        </div>
      </div>
    );
  }

  if (!journal || !user) return null;

  return (
    <JournalEditForm
      userId={user.id}
      existingJournal={journal}
    />
  );
}