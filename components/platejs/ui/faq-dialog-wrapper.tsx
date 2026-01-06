'use client';

import { useFAQDialog } from './faq-dialog-context';
import { FAQDialog } from './faq-dialog';

export function FAQDialogWrapper() {
  const { isOpen, closeDialog, onInsert, initialData } = useFAQDialog();

  const handleSubmit = (data: Parameters<typeof onInsert>[0]) => {
    if (onInsert) {
      onInsert(data);
    }
    closeDialog();
  };

  return (
    <FAQDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeDialog();
        }
      }}
      onSubmit={handleSubmit}
      initialData={initialData || undefined}
    />
  );
}

