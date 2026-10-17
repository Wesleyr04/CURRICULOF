"use client";

import React, { useState } from "react";
import { PersonalInfo, CreationMode } from "@/types/resume";
import { User, Mail, Phone, MapPin, Globe, ShieldAlert, Plus } from "lucide-react";
import { LinkedinIcon } from "@/components/common/Icons";

interface Step1Props {
  data: PersonalInfo;
  mode?: CreationMode;
  onChange: (data: PersonalInfo) => void;
  onNext: () => void;
}

export function Step1Personal({ data, mode = "simple", onChange, onNext }: Step1Props) {
  const [showOptionalLinks, setShowOptionalLinks] = useState<boolean>(
    Boolean(data.linkedin || data.portfolio || mode === "complete")
  );

  const updateField = (field: keyof PersonalInfo, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.fullName.trim() || !data.email.trim() || !data.phone.trim() || !data.city.trim() || !data.state.trim()) {
      alert("Por favor, preencha Nome Completo, E-mail, Telefone e Cidade/Estado para continuar.");
      return;
    }
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-900">Etapa 1 — Dados Pessoais</h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
            Modo {mode === "simple" ? "Simples" : "Completo"}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Informe seus dados de contato direto. Recrutadores precisam de telefone, e-mail e localização atualizados.
        </p>
      </div>

      {/* Diretriz de RH e Privacidade: Sem documentos sensíveis */}
      <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg flex items-start gap-2.5 text-xs text-blue-900">
        <ShieldAlert className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <span>
          <strong>Diretriz de Recrutamento & Privacidade:</strong> Nunca inclua CPF, RG, endereço completo de rua, estado civil ou religião no currículo. O FastCurrículo bloqueia dados desnecessários e protege suas informações.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nome Completo */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Nome Completo <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              value={data.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              placeholder="Ex: Carlos Eduardo Silva"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900"
            />
          </div>
        </div>

        {/* E-mail */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            E-mail Profissional <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="email"
              required
              value={data.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="Ex: carlos.silva@email.com"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900"
            />
          </div>
        </div>

        {/* Telefone / WhatsApp */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Telefone / WhatsApp <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="tel"
              required
              value={data.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="Ex: (11) 98765-4321"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900"
            />
          </div>
        </div>

        {/* Cidade */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Cidade <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              value={data.city}
              onChange={(e) => updateField("city", e.target.value)}
              placeholder="Ex: São Paulo"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900"
            />
          </div>
        </div>

        {/* Estado (UF) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Estado (UF) <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={2}
            value={data.state}
            onChange={(e) => updateField("state", e.target.value.toUpperCase())}
            placeholder="Ex: SP"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 uppercase text-slate-900"
          />
        </div>

        {/* Links opcionais: modo completo ou se expandido */}
        {(showOptionalLinks || mode === "complete") ? (
          <>
            {/* LinkedIn (Opcional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Perfil no LinkedIn <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <div className="relative">
                <LinkedinIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="url"
                  value={data.linkedin || ""}
                  onChange={(e) => updateField("linkedin", e.target.value)}
                  placeholder="https://linkedin.com/in/seuperfil"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900"
                />
              </div>
            </div>

            {/* Portfólio ou GitHub (Opcional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Portfólio / GitHub / Site <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="url"
                  value={data.portfolio || ""}
                  onChange={(e) => updateField("portfolio", e.target.value)}
                  placeholder="https://seusite.com.br"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="md:col-span-2 pt-1">
            <button
              type="button"
              onClick={() => setShowOptionalLinks(true)}
              className="text-xs text-blue-900 hover:underline font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar LinkedIn ou Portfólio (Opcional)</span>
            </button>
          </div>
        )}
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          className="px-6 py-2.5 text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs transition-all"
        >
          Avançar para Objetivo Profissional →
        </button>
      </div>
    </form>
  );
}
