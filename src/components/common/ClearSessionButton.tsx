"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, CheckCircle2 } from "lucide-react";

export function ClearSessionButton() {
  const router = useRouter();
  const [cleared, setCleared] = useState(false);

  const handleClearSession = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.clear();
        localStorage.clear();
      } catch (err) {
        console.warn("Erro ao limpar storage:", err);
      }
      setCleared(true);
      setTimeout(() => {
        router.push("/");
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col items-start sm:items-end gap-1.5">
      <button
        type="button"
        onClick={handleClearSession}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Limpar dados da sessão</span>
      </button>
      {cleared && (
        <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Dados apagados com sucesso! Redirecionando...</span>
        </span>
      )}
    </div>
  );
}
