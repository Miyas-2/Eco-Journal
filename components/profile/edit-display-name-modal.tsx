'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import EditDisplayNameForm from './edit-display-name-form';

interface EditDisplayNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDisplayName: string;
  onSuccess: (newDisplayName: string) => void;
}

export default function EditDisplayNameModal({
  isOpen,
  onClose,
  currentDisplayName,
  onSuccess
}: EditDisplayNameModalProps) {
  const handleSuccess = (newDisplayName: string) => {
    onSuccess(newDisplayName);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Display Name</DialogTitle>
          <DialogDescription>
            Ubah nama tampilan yang akan ditampilkan di profil Anda.
          </DialogDescription>
        </DialogHeader>
        <EditDisplayNameForm
          currentDisplayName={currentDisplayName}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}