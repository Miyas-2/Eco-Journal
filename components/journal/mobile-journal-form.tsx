'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

interface MobileJournalFormProps {
  userId: string;
}

export default function MobileJournalForm({ userId }: MobileJournalFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/protected" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Link>
        </Button>
        <h1 className="font-semibold">Tulis Jurnal</h1>
        <Button size="sm" disabled={!title.trim() || !content.trim() || isSaving}>
          <Save className="h-4 w-4 mr-2" />
          Simpan
        </Button>
      </header>

      {/* Form */}
      <div className="p-4 space-y-4">
        <Input
          placeholder="Judul jurnal..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-0 text-xl font-medium placeholder:text-gray-400 p-0 focus-visible:ring-0"
        />
        
        <Textarea
          placeholder="Apa yang kamu rasakan hari ini?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={15}
          className="border-0 resize-none placeholder:text-gray-400 p-0 focus-visible:ring-0"
        />
      </div>
    </div>
  );
}