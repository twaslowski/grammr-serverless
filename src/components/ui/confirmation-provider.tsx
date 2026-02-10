"use client";

import React, { createContext, useCallback,useContext, useState } from "react";

import { ConfirmationDialog } from "./confirmation-dialog";

interface ConfirmationOptions {
  title: string;
  description: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "default" | "destructive" | "outline" | "ghost";
  onConfirm: () => void | Promise<void>;
}

interface ConfirmationState extends ConfirmationOptions {
  isOpen: boolean;
  isLoading: boolean;
}

interface ConfirmationContextValue {
  confirm: (options: ConfirmationOptions) => void;
}

const ConfirmationContext = createContext<ConfirmationContextValue | null>(
  null,
);

interface ConfirmationProviderProps {
  children: React.ReactNode;
}

export function ConfirmationProvider({ children }: ConfirmationProviderProps) {
  const [state, setState] = useState<ConfirmationState>({
    isOpen: false,
    isLoading: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const confirm = useCallback((options: ConfirmationOptions) => {
    setState({
      ...options,
      isOpen: true,
      isLoading: false,
    });
  }, []);

  const handleClose = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleConfirm = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await state.onConfirm();
      setState((prev) => ({ ...prev, isOpen: false, isLoading: false }));
    } catch (error) {
      // Keep dialog open on error, stop loading state
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error; // Re-throw so consumer can handle it
    }
  }, [state.onConfirm]);

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      <ConfirmationDialog
        open={state.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={state.title}
        description={state.description}
        confirmText={state.confirmText}
        cancelText={state.cancelText}
        confirmVariant={state.confirmVariant}
        isLoading={state.isLoading}
        loadingText={state.isLoading ? "Processing..." : undefined}
      />
    </ConfirmationContext.Provider>
  );
}

export function useConfirm(): (options: ConfirmationOptions) => void {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmationProvider");
  }
  return context.confirm;
}
