'use client';

import * as React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import type { FAQData } from './faq-dialog';

interface FAQDialogContextType {
  openDialog: (
    onInsert: (data: FAQData) => void,
    initialData?: Partial<FAQData>
  ) => void;
  closeDialog: () => void;
  isOpen: boolean;
  onInsert: ((data: FAQData) => void) | null;
  initialData: Partial<FAQData> | null;
}

const FAQDialogContext = createContext<FAQDialogContextType | undefined>(
  undefined
);

// Global store for accessing FAQ dialog from non-React contexts (like transforms)
let globalFAQDialogStore: {
  openDialog: ((
    onInsert: (data: FAQData) => void,
    initialData?: Partial<FAQData>
  ) => void) | null;
} = {
  openDialog: null,
};

export function setGlobalFAQDialog(
  openDialog: (
    onInsert: (data: FAQData) => void,
    initialData?: Partial<FAQData>
  ) => void
) {
  globalFAQDialogStore.openDialog = openDialog;
}

export function getGlobalFAQDialog() {
  return globalFAQDialogStore.openDialog;
}

export function FAQDialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [onInsertCallback, setOnInsertCallback] = useState<
    ((data: FAQData) => void) | null
  >(null);
  const [initialData, setInitialData] = useState<Partial<FAQData> | null>(
    null
  );

  const openDialog = useCallback(
    (onInsert: (data: FAQData) => void, initial?: Partial<FAQData>) => {
      setOnInsertCallback(() => onInsert);
      setInitialData(initial || null);
      setIsOpen(true);
    },
    []
  );

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setOnInsertCallback(null);
    setInitialData(null);
  }, []);

  // Set global store when component mounts
  React.useEffect(() => {
    setGlobalFAQDialog(openDialog);
    return () => {
      setGlobalFAQDialog(null as any);
    };
  }, [openDialog]);

  return (
    <FAQDialogContext.Provider
      value={{
        openDialog,
        closeDialog,
        isOpen,
        onInsert: onInsertCallback,
        initialData,
      }}
    >
      {children}
    </FAQDialogContext.Provider>
  );
}

export function useFAQDialog() {
  const context = useContext(FAQDialogContext);
  if (!context) {
    throw new Error('useFAQDialog must be used within FAQDialogProvider');
  }
  return context;
}

