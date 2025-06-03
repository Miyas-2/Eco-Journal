'use client';

import JournalForm from '@/components/journal/journal-form';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft } from 'lucide-react'; // Tambahkan ArrowLeft
import { Button } from '@/components/ui/button';

export default function NewJournalPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      setLoadingUser(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/auth/login');
      } else {
        setUser(currentUser);
      }
      setLoadingUser(false);
    };
    getUser();
  }, [supabase, router]);

  if (loadingUser) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Memuat...</p>
      </div>
    );
  }

  if (!user) { // Seharusnya sudah di-redirect, tapi sebagai fallback
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <p>Anda harus login untuk membuat jurnal.</p>
        <Link href="/auth/login" className="text-blue-600 hover:underline mt-2">
          Login di sini
        </Link>
      </div>
    );
  }

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
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Buat Entri Jurnal Baru</h1>
      <div className="max-w-2xl mx-auto bg-card p-6 sm:p-8 rounded-lg shadow-md border">
        <JournalForm userId={user.id} />
      </div>
    </div>
  );
}