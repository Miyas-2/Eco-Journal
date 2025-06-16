'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import toast from 'react-hot-toast';

interface EditDisplayNameFormProps {
  currentDisplayName: string;
  onSuccess: (newDisplayName: string) => void;
  onCancel: () => void;
}

export default function EditDisplayNameForm({
  currentDisplayName,
  onSuccess,
  onCancel
}: EditDisplayNameFormProps) {
  const [displayName, setDisplayName] = useState(currentDisplayName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (displayName.trim() === currentDisplayName) {
      onCancel();
      return;
    }

    if (displayName.trim().length < 2 || displayName.trim().length > 50) {
      setError("Display name harus antara 2-50 karakter");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/profile/update-display-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memperbarui display name');
      }

      toast.success('Display name berhasil diperbarui!');
      onSuccess(data.displayName);
    } catch (err: any) {
      console.error('Error updating display name:', err);
      setError(err.message || 'Terjadi kesalahan saat memperbarui display name');
      toast.error(err.message || 'Gagal memperbarui display name');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="display-name" className="text-sm font-medium">
          Display Name
        </Label>
        <Input
          id="display-name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Masukkan nama tampilan"
          className="mt-1"
          disabled={isLoading}
          maxLength={50}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {displayName.length}/50 karakter
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          <X className="h-4 w-4 mr-2" />
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isLoading || displayName.trim() === currentDisplayName}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Simpan
        </Button>
      </div>
    </form>
  );
}