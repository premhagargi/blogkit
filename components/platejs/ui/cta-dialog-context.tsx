'use client';

import * as React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import type { CTAData } from './cta-dialog';

interface CTADialogContextType {
  openDialog: (onInsert: (data: CTAData) => void) => void;
  closeDialog: () => void;
  isOpen: boolean;
  onInsert: ((data: CTAData) => void) | null;
}

const CTADialogContext = createContext<CTADialogContextType | undefined>(
  undefined
);

// Global store for accessing CTA dialog from non-React contexts (like transforms)
let globalCTADialogStore: {
  openDialog: ((onInsert: (data: CTAData) => void) => void) | null;
} = {
  openDialog: null,
};

export function setGlobalCTADialog(
  openDialog: (onInsert: (data: CTAData) => void) => void
) {
  globalCTADialogStore.openDialog = openDialog;
}

export function getGlobalCTADialog() {
  return globalCTADialogStore.openDialog;
}

export function CTADialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [onInsertCallback, setOnInsertCallback] = useState<
    ((data: CTAData) => void) | null
  >(null);

  const openDialog = useCallback((onInsert: (data: CTAData) => void) => {
    setOnInsertCallback(() => onInsert);
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setOnInsertCallback(null);
  }, []);

  // Set global store when component mounts
  React.useEffect(() => {
    setGlobalCTADialog(openDialog);
    return () => {
      setGlobalCTADialog(null as any);
    };
  }, [openDialog]);

  return (
    <CTADialogContext.Provider
      value={{
        openDialog,
        closeDialog,
        isOpen,
        onInsert: onInsertCallback,
      }}
    >
      {children}
    </CTADialogContext.Provider>
  );
}

export function useCTADialog() {
  const context = useContext(CTADialogContext);
  if (!context) {
    throw new Error('useCTADialog must be used within CTADialogProvider');
  }
  return context;
}

