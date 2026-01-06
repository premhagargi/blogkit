'use client';

import * as React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';

interface EmbedDialogContextType {
  openDialog: (onInsert: (url: string) => void) => void;
  closeDialog: () => void;
  isOpen: boolean;
  onInsert: ((url: string) => void) | null;
}

const EmbedDialogContext = createContext<EmbedDialogContextType | undefined>(
  undefined
);

// Global store for accessing embed dialog from non-React contexts (like transforms)
let globalEmbedDialogStore: {
  openDialog: ((onInsert: (url: string) => void) => void) | null;
} = {
  openDialog: null,
};

export function setGlobalEmbedDialog(openDialog: (onInsert: (url: string) => void) => void) {
  globalEmbedDialogStore.openDialog = openDialog;
}

export function getGlobalEmbedDialog() {
  return globalEmbedDialogStore.openDialog;
}

export function EmbedDialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [onInsertCallback, setOnInsertCallback] = useState<((url: string) => void) | null>(null);

  const openDialog = useCallback((onInsert: (url: string) => void) => {
    setOnInsertCallback(() => onInsert);
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setOnInsertCallback(null);
  }, []);

  // Set global store when component mounts
  React.useEffect(() => {
    setGlobalEmbedDialog(openDialog);
    return () => {
      setGlobalEmbedDialog(null as any);
    };
  }, [openDialog]);

  return (
    <EmbedDialogContext.Provider
      value={{
        openDialog,
        closeDialog,
        isOpen,
        onInsert: onInsertCallback,
      }}
    >
      {children}
    </EmbedDialogContext.Provider>
  );
}

export function useEmbedDialog() {
  const context = useContext(EmbedDialogContext);
  if (!context) {
    throw new Error('useEmbedDialog must be used within EmbedDialogProvider');
  }
  return context;
}

