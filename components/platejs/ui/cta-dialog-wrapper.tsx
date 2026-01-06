'use client';

import { useCTADialog } from './cta-dialog-context';
import { CTADialog } from './cta-dialog';

export function CTADialogWrapper() {
  const { isOpen, closeDialog, onInsert } = useCTADialog();

  const handleSubmit = (data: Parameters<typeof onInsert>[0]) => {
    if (onInsert) {
      onInsert(data);
    }
    closeDialog();
  };

  return (
    <CTADialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeDialog();
        }
      }}
      onSubmit={handleSubmit}
    />
  );
}

