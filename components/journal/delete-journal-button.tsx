"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteJournalButtonProps {
  journalId: string;
  journalTitle: string;
}

export default function DeleteJournalButton({
  journalId,
  journalTitle,
}: DeleteJournalButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      // Delete journal insights terlebih dahulu (jika ada)
      await supabase
        .from("journal_insights")
        .delete()
        .eq("journal_id", journalId);

      // Delete journal entry
      const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", journalId);

      if (error) {
        throw error;
      }

      toast.success("Jurnal berhasil dihapus!");
      setIsOpen(false);
      router.refresh(); // Refresh halaman untuk update list
    } catch (error: any) {
      console.error("Error deleting journal:", error);
      toast.error("Gagal menghapus jurnal: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          <span className="text-xs">Hapus</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini tidak dapat dibatalkan. Jurnal "{journalTitle}" akan
            dihapus secara permanen dari akun Anda.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              "Hapus Jurnal"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
