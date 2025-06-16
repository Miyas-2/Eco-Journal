"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
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

      toast.success("Jurnal berhasil dihapus!", {
        style: {
          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
          color: '#065f46',
          border: '1px solid #a7f3d0',
          borderRadius: '1rem',
          fontFamily: 'Poppins, sans-serif',
          fontWeight: '500'
        },
        iconTheme: {
          primary: '#10b981',
          secondary: '#ecfdf5',
        },
      });
      setIsOpen(false);
      router.refresh(); // Refresh halaman untuk update list
    } catch (error: any) {
      console.error("Error deleting journal:", error);
      toast.error("Gagal menghapus jurnal: " + error.message, {
        style: {
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          color: '#991b1b',
          border: '1px solid #fca5a5',
          borderRadius: '1rem',
          fontFamily: 'Poppins, sans-serif',
          fontWeight: '500'
        },
        iconTheme: {
          primary: '#ef4444',
          secondary: '#fef2f2',
        },
      });
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
          className="text-red-600 hover:bg-red-50/80 hover:text-red-700 border border-transparent hover:border-red-200/50 rounded-xl h-10 transition-all duration-300 font-medium"
        >
          <div className="w-4 h-4 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center mr-2">
            <Trash2 className="h-3 w-3 text-red-600" />
          </div>
          <span className="text-sm">Hapus</span>
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent className="bg-white/95 backdrop-blur-lg border-stone-200/50 shadow-xl rounded-3xl font-organik max-w-md mx-4">
        <AlertDialogHeader className="text-center pb-6">
          {/* Warning Icon - Modern Organik */}
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-200/40">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
          
          <AlertDialogTitle className="text-xl font-semibold text-organic-title mb-3">
            Hapus Jurnal Ini?
          </AlertDialogTitle>
          
          <AlertDialogDescription className="text-organic-body leading-relaxed">
            Tindakan ini tidak dapat dibatalkan. Jurnal{" "}
            <span className="font-medium text-organic-title bg-gradient-to-r from-stone-50 to-stone-100 px-2 py-1 rounded-lg border border-stone-200/50">
              "{journalTitle}"
            </span>{" "}
            akan dihapus secara permanen dari akun Anda beserta semua data yang terkait.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 pt-6">
          <AlertDialogCancel 
            disabled={isDeleting}
            className="btn-organic-secondary w-full sm:w-auto order-2 sm:order-1"
          >
            Batal
          </AlertDialogCancel>
          
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl px-6 py-3 font-medium shadow-lg shadow-red-200/40 transition-all duration-300 hover:shadow-xl hover:shadow-red-200/60 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Menghapus...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Trash2 className="h-4 w-4" />
                <span>Hapus Jurnal</span>
              </div>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}