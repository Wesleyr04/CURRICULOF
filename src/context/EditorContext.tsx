"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";

export interface PaymentSessionData {
  isPaid: boolean;
  downloadToken?: string;
  orderId?: string;
  paidAt?: number;
  expiresAt?: number;
}

interface EditorContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isPaid: boolean;
  setIsPaid: (paid: boolean) => void;
  downloadToken: string | null;
  orderId: string | null;
  setPaymentSession: (session: { downloadToken?: string; orderId?: string }) => void;
  triggerDownloadModal: () => void;
  registerDownloadTrigger: (trigger: () => void) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [downloadToken, setDownloadToken] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const downloadTriggerRef = useRef<(() => void) | null>(null);

  const registerDownloadTrigger = useCallback((trigger: () => void) => {
    downloadTriggerRef.current = trigger;
  }, []);

  const triggerDownloadModal = useCallback(() => {
    if (downloadTriggerRef.current) {
      downloadTriggerRef.current();
    }
  }, []);

  const setPaymentSession = useCallback(
    (session: { downloadToken?: string; orderId?: string }) => {
      setIsPaid(true);
      if (session.downloadToken) setDownloadToken(session.downloadToken);
      if (session.orderId) setOrderId(session.orderId);
    },
    []
  );

  return (
    <EditorContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        isPaid,
        setIsPaid,
        downloadToken,
        orderId,
        setPaymentSession,
        triggerDownloadModal,
        registerDownloadTrigger,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    // Retorna fallback seguro para componentes fora do provider (ex: páginas estáticas)
    return {
      currentStep: 1,
      setCurrentStep: () => {},
      isPaid: false,
      setIsPaid: () => {},
      downloadToken: null,
      orderId: null,
      setPaymentSession: () => {},
      triggerDownloadModal: () => {},
      registerDownloadTrigger: () => {},
    };
  }
  return context;
}

