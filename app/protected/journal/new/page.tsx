'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import JournalFormLexend from '@/components/journal/journal-form-lexend';

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
      <>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#101a22] flex justify-center items-center" style={{ fontFamily: 'Lexend, sans-serif' }}>
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#2b9dee] mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 font-light">Memuat...</p>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#101a22] flex flex-col justify-center items-center" style={{ fontFamily: 'Lexend, sans-serif' }}>
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-medium text-slate-800 dark:text-slate-100 mb-3">Akses Terbatas</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 font-light">Anda harus login untuk membuat jurnal.</p>
            <Button asChild className="bg-[#2b9dee] hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium">
              <Link href="/auth/login">
                Login di sini
              </Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      
      <JournalFormLexend userId={user.id} />
    </>
  );
}