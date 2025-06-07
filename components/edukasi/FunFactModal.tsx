'use client';

import { Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface FunFactModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  isLoading: boolean;
}

export default function FunFactModal({ isOpen, onClose, title, content, isLoading }: FunFactModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background border shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg text-foreground">
            <Lightbulb className="h-5 w-5 mr-2 text-yellow-400" />
            {title || "Informasi Edukasi"}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 min-h-[60px] text-sm text-muted-foreground">
          {isLoading ? (
            <p className="animate-pulse">Memuat informasi...</p>
          ) : (
            <p className="whitespace-pre-line">{content}</p>
          )}
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>
              Tutup
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}