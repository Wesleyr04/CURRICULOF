"use client";

import React, { useState } from "react";
import { PersonalInfo, CreationMode } from "@/types/resume";
import { User, Mail, Phone, MapPin, Globe, ShieldAlert, Plus, AlertCircle } from "lucide-react";
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitErrorBanner, setSubmitErrorBanner] = useState<string | null>(null);

  const updateField = (field: keyof PersonalInfo, value: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (submitErrorBanner) {
      setSubmitErrorBanner(null);
    }
    onChange({ ...data, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!data.fullName.trim()) newErrors.fullName = "Informe seu nome completo.";
    if (!data.email.trim()) {
      newErrors.email = "Informe seu e-mail profissional.";
    } else if (!data.email.includes("@") || !data.email.includes(".")) {
      newErrors.email = "Informe um e-mail válido (ex: nome@dominio.com).";
    }
    if (!data.phone.trim()) newErrors.phone = "Informe seu telefone ou WhatsApp com DDD.";
    if (!data.city.trim()) newErrors.city = "Informe a cidade onde você reside.";
    if (!data.state.trim()) newErrors.state = "Informe a UF (ex: SP).";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitErrorBanner("Por favor, preencha os campos obrigatórios destacados abaixo para avançar.");
      const firstFieldId = Object.keys(newErrors)[0];
      const targetElement = document.getElementById(firstFieldId);
      if (targetElement) {
        targetElement.focus();
        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setErrors({});
    setSubmitErrorBanner(null);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Etapa 1 — Dados Pessoais</h2>
        <p className="text-xs text-slate-500 mt-1">
          Preencha apenas o que fizer sentido para sua trajetória — o FastCurrículo organiza e adapta a estrutura automaticamente para você.
        </p>
      </div>

      {/* Banner de Erros de Submissão Inline */}
      {submitErrorBanner && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex items-center gap-2.5 text-xs text-rose-900 shadow-2xs animate-in fade-in duration-200"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{submitErrorBanner}</span>
        </div>
      )}

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
          <label htmlFor="fullName" className="block text-xs font-bold text-slate-700 mb-1">
            Nome Completo <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" aria-hidden="true" />
            <input
              id="fullName"
              type="text"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? "error-fullName" : undefined}
              value={data.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              placeholder="Ex: Carlos Eduardo Silva"
              className={`w-full pl-9 pr-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 text-slate-900 transition-colors ${
                errors.fullName
                  ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20"
                  : "border-slate-300 focus:ring-blue-800"
              }`}
            />
          </div>
          {errors.fullName && (
            <p id="error-fullName" role="alert" className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{errors.fullName}</span>
            </p>
          )}
        </div>

        {/* E-mail */}
        <div>
          <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1">
            E-mail Profissional <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" aria-hidden="true" />
            <input
              id="email"
              type="email"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "error-email" : undefined}
              value={data.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="Ex: carlos.silva@email.com"
              className={`w-full pl-9 pr-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 text-slate-900 transition-colors ${
                errors.email
                  ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20"
                  : "border-slate-300 focus:ring-blue-800"
              }`}
            />
          </div>
          {errors.email && (
            <p id="error-email" role="alert" className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        {/* Telefone / WhatsApp */}
        <div>
          <label htmlFor="phone" className="block text-xs font-bold text-slate-700 mb-1">
            Telefone / WhatsApp <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" aria-hidden="true" />
            <input
              id="phone"
              type="tel"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "error-phone" : undefined}
              value={data.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="Ex: (11) 98765-4321"
              className={`w-full pl-9 pr-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 text-slate-900 transition-colors ${
                errors.phone
                  ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20"
                  : "border-slate-300 focus:ring-blue-800"
              }`}
            />
          </div>
          {errors.phone && (
            <p id="error-phone" role="alert" className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{errors.phone}</span>
            </p>
          )}
        </div>

        {/* Cidade */}
        <div>
          <label htmlFor="city" className="block text-xs font-bold text-slate-700 mb-1">
            Cidade <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" aria-hidden="true" />
            <input
              id="city"
              type="text"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.city)}
              aria-describedby={errors.city ? "error-city" : undefined}
              value={data.city}
              onChange={(e) => updateField("city", e.target.value)}
              placeholder="Ex: São Paulo"
              className={`w-full pl-9 pr-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 text-slate-900 transition-colors ${
                errors.city
                  ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20"
                  : "border-slate-300 focus:ring-blue-800"
              }`}
            />
          </div>
          {errors.city && (
            <p id="error-city" role="alert" className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{errors.city}</span>
            </p>
          )}
        </div>

        {/* Estado (UF) */}
        <div>
          <label htmlFor="state" className="block text-xs font-bold text-slate-700 mb-1">
            Estado (UF) <span className="text-rose-600">*</span>
          </label>
          <input
            id="state"
            type="text"
            required
            maxLength={2}
            aria-required="true"
            aria-invalid={Boolean(errors.state)}
            aria-describedby={errors.state ? "error-state" : undefined}
            value={data.state}
            onChange={(e) => updateField("state", e.target.value.toUpperCase())}
            placeholder="Ex: SP"
            className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 uppercase text-slate-900 transition-colors ${
              errors.state
                ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20"
                : "border-slate-300 focus:ring-blue-800"
            }`}
          />
          {errors.state && (
            <p id="error-state" role="alert" className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{errors.state}</span>
            </p>
          )}
        </div>

        {/* Links opcionais: modo completo ou se expandido */}
        {showOptionalLinks || mode === "complete" ? (
          <>
            {/* LinkedIn (Opcional) */}
            <div>
              <label htmlFor="linkedin" className="block text-xs font-bold text-slate-700 mb-1">
                Perfil no LinkedIn <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <div className="relative">
                <LinkedinIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" aria-hidden="true" />
                <input
                  id="linkedin"
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
              <label htmlFor="portfolio" className="block text-xs font-bold text-slate-700 mb-1">
                Portfólio / GitHub / Site <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" aria-hidden="true" />
                <input
                  id="portfolio"
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
              className="text-xs text-blue-900 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
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
          className="px-6 py-2.5 text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs transition-all cursor-pointer"
        >
          Avançar para Objetivo Profissional →
        </button>
      </div>
    </form>
  );
}
