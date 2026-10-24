"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Coins,
  Cpu,
  Activity,
  Layers,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Lock,
  ArrowUpDown,
  Info,
  CheckCircle2,
  XCircle,
  Database,
} from "lucide-react";

interface MetricsResponse {
  success: boolean;
  storage?: {
    type: "kv_remote" | "local_jsonl" | "serverless_ephemeral" | "memory_test";
    isPersistent: boolean;
    description: string;
    filePath?: string;
    remoteConfigured?: boolean;
    setupInstructions?: string | null;
  };
  period: {
    startDate: string;
    endDate: string;
    earliestRecord: string | null;
    latestRecord: string | null;
  };
  integrity: {
    hasIncompleteCalls: boolean;
    incompleteCallsCount: number;
    legacyIncompleteCount: number;
    productionCallsCount?: number;
    syntheticCallsCount?: number;
    hasPartialCosts: boolean;
    warningMessage: string | null;
  };
  metrics: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    incompleteCalls: number;
    legacyIncompleteCount: number;
    productionCallsCount?: number;
    syntheticCallsCount?: number;
    hasPartialCosts: boolean;
    period: {
      earliestTimestamp: string | null;
      latestTimestamp: string | null;
    };
    totalTokens: {
      inputTokens: number;
      outputTokens: number;
      cacheCreationTokens: number;
      cacheReadTokens: number;
      grandTotalTokens: number;
    };
    tokensStatusSummary: {
      complete: number;
      partial: number;
      unavailable: number;
    };
    totalCost: {
      usd: number;
      brl: number;
    };
    averageCostPerCall: {
      usd: number;
      brl: number;
    };
    averageCostPerResumeGeneration: {
      totalGenerations: number;
      averageUsd: number;
      averageBrl: number;
    };
    breakdownByOperation: Record<
      string,
      {
        calls: number;
        tokens: number;
        costUsd: number;
        costBrl: number;
        incompleteCalls: number;
      }
    >;
    breakdownByModel: Record<
      string,
      {
        calls: number;
        tokens: number;
        costUsd: number;
        costBrl: number;
        incompleteCalls: number;
      }
    >;
    unmappedModelsCount: number;
    disclaimer: string;
  };
  records?: Array<{
    id: string;
    responseId: string | null;
    correlationId: string;
    timestamp: string;
    model: string;
    requestedModel?: string;
    actualModel?: string;
    operationType: string;
    status: "success" | "error";
    source?: "production" | "synthetic_test" | "fallback" | "error";
    attempt: number;
    usage: {
      inputTokens: number | null;
      outputTokens: number | null;
      cacheCreationInputTokens: number | null;
      cacheReadInputTokens: number | null;
      tokensStatus?: string;
    };
    cost: {
      usd: number | null;
      brl: number | null;
      exchangeRate: number;
      pricingSnapshot: {
        model: string;
        pricingStatus: string;
      };
    };
    durationMs: number;
    errorCode?: string | null;
  }>;
}

export default function AdminMetricsPage() {
  const [token, setToken] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [showRecords, setShowRecords] = useState<boolean>(false);
  const [filterSource, setFilterSource] = useState<string>("all");

  const fetchMetrics = useCallback(
    async (adminToken: string) => {
      setLoading(true);
      setErrorMsg(null);

      try {
        const params = new URLSearchParams();
        if (showRecords) params.set("includeRecords", "true");
        if (filterSource !== "all") params.set("source", filterSource);

        const res = await fetch(`/api/internal/ai-usage?${params.toString()}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${adminToken.trim()}`,
          },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: "Erro na autenticação" }));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        const json: MetricsResponse = await res.json();
        setData(json);
        setIsAuthenticated(true);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("ai_admin_metrics_token", adminToken.trim());
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : String(err));
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    },
    [showRecords, filterSource]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("ai_admin_metrics_token");
      if (saved) {
        setToken(saved);
        fetchMetrics(saved);
      }
    }
  }, [fetchMetrics]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    fetchMetrics(token);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("ai_admin_metrics_token");
    }
    setIsAuthenticated(false);
    setData(null);
    setToken("");
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return "Não disponível";
    try {
      const d = new Date(isoString);
      return d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 text-blue-900 rounded-xl">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Telemetria de IA</h1>
              <p className="text-xs text-slate-500">Acesso Administrativo Restrito</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Token Administrativo (ADMIN_METRICS_TOKEN)
              </label>
              <input
                type="password"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Insira o token de auditoria"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validando token...</span>
                </>
              ) : (
                <span>Acessar Dashboard</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics;
  const integrity = data?.integrity;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Superior */}
        <header className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2 bg-blue-900 text-white rounded-xl">
                <Activity className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  Telemetria Financeira e Unit Economics
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monitoramento estrito de tokens, custos auditáveis (USD/BRL) e integridade da Anthropic Claude
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchMetrics(token)}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Atualizar</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3.5 py-2 text-xs font-semibold bg-white hover:bg-rose-50 text-rose-700 rounded-lg border border-rose-200 transition-colors cursor-pointer"
            >
              Desconectar
            </button>
          </div>
        </header>

        {/* Status da Persistência de Dados (Netlify Serverless vs Upstash Redis) */}
        {data?.storage && (
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs ${
              data.storage.isPersistent
                ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                : "bg-blue-50/70 border-blue-200 text-blue-950"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <Database
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  data.storage.isPersistent ? "text-emerald-700" : "text-blue-700"
                }`}
              />
              <div className="leading-relaxed">
                <span className="font-bold">Backend de Armazenamento: </span>
                <span>{data.storage.description}</span>
                {data.storage.setupInstructions && (
                  <p className="mt-1 text-[11px] font-medium text-slate-600">
                    💡 {data.storage.setupInstructions}
                  </p>
                )}
              </div>
            </div>
            <div className="shrink-0">
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  data.storage.isPersistent
                    ? "bg-emerald-200 text-emerald-900 border border-emerald-300"
                    : "bg-amber-100 text-amber-900 border border-amber-300"
                }`}
              >
                {data.storage.isPersistent ? "Persistente (Nuvem)" : "Efêmero / Local"}
              </span>
            </div>
          </div>
        )}

        {/* Banner de Aviso de Custos Parciais ou Registros Incompletos */}
        {integrity?.hasPartialCosts && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-xs">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <p className="font-bold">Aviso de Auditoria: Custos Parciais e Registros Sintéticos Identificados</p>
                <p className="mt-1">
                  Existem <strong>{integrity.incompleteCallsCount}</strong> chamadas com registros incompletos
                  {integrity.legacyIncompleteCount > 0 && (
                    <> (sendo <strong>{integrity.legacyIncompleteCount}</strong> registros legados gerados pelas suítes locais de teste unitário com mock sem tokens)</>
                  )}. Os valores totais de USD e BRL exibidos refletem estritamente as operações com consumo confirmado e tarifas oficiais públicas da Anthropic.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* KPIs Principais */}
        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Chamadas Totais */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Total de Chamadas</span>
                <Layers className="w-4 h-4 text-blue-900" />
              </div>
              <div className="text-2xl font-black text-slate-900">{metrics.totalCalls}</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
                  <CheckCircle2 className="w-3 h-3" /> {metrics.successfulCalls} sucesso
                </span>
                {metrics.failedCalls > 0 && (
                  <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-medium">
                    <XCircle className="w-3 h-3" /> {metrics.failedCalls} erro
                  </span>
                )}
                {metrics.incompleteCalls > 0 && (
                  <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-medium">
                    <AlertTriangle className="w-3 h-3" /> {metrics.incompleteCalls} incompletas
                  </span>
                )}
              </div>
            </div>

            {/* Card 2: Consumo de Tokens */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Volume de Tokens</span>
                <Cpu className="w-4 h-4 text-purple-700" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {metrics.totalTokens.grandTotalTokens.toLocaleString("pt-BR")}
              </div>
              <div className="text-xs text-slate-500 flex justify-between">
                <span>Input: {metrics.totalTokens.inputTokens.toLocaleString("pt-BR")}</span>
                <span>Output: {metrics.totalTokens.outputTokens.toLocaleString("pt-BR")}</span>
              </div>
            </div>

            {/* Card 3: Custo Acumulado */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Custo Acumulado</span>
                <Coins className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700">
                R$ {metrics.totalCost.brl.toFixed(4)}
              </div>
              <div className="text-xs text-slate-500 flex justify-between">
                <span>USD: ${metrics.totalCost.usd.toFixed(6)}</span>
                <span className="text-slate-400 font-mono text-[10px]">Taxa BRL ativa</span>
              </div>
            </div>

            {/* Card 4: Médias Unit Economics */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Custo Médio / Currículo</span>
                <ArrowUpDown className="w-4 h-4 text-blue-700" />
              </div>
              <div className="text-2xl font-black text-blue-900">
                R$ {metrics.averageCostPerResumeGeneration.averageBrl.toFixed(4)}
              </div>
              <div className="text-xs text-slate-500 flex justify-between">
                <span>{metrics.averageCostPerResumeGeneration.totalGenerations} gerações únicas</span>
                <span>Méd/chamada: R$ {metrics.averageCostPerCall.brl.toFixed(4)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Período Temporal de Registros */}
        {data?.period && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-600 gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                <strong>Intervalo dos Registros:</strong> de{" "}
                <span className="font-mono text-slate-900">{formatDate(data.period.earliestRecord)}</span> até{" "}
                <span className="font-mono text-slate-900">{formatDate(data.period.latestRecord)}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Padrão Fail-Open & Zero-PII Ativo</span>
            </div>
          </div>
        )}

        {/* Tabelas de Quebra: Operação e Modelo */}
        {metrics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tabela por Operação */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Consumo por Tipo de Operação
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                      <th className="pb-2">Operação</th>
                      <th className="pb-2 text-right">Chamadas</th>
                      <th className="pb-2 text-right">Tokens</th>
                      <th className="pb-2 text-right">Custo USD</th>
                      <th className="pb-2 text-right">Custo BRL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(metrics.breakdownByOperation).map(([op, stats]) => (
                      <tr key={op} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 font-medium text-slate-800">
                          <span className="font-mono">{op}</span>
                          {stats.incompleteCalls > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800">
                              {stats.incompleteCalls} incompletas
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-right font-mono">{stats.calls}</td>
                        <td className="py-2.5 text-right font-mono">{stats.tokens.toLocaleString("pt-BR")}</td>
                        <td className="py-2.5 text-right font-mono">${stats.costUsd.toFixed(6)}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-emerald-700">
                          R$ {stats.costBrl.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabela por Modelo */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Consumo por Identificador de Modelo
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                      <th className="pb-2">Modelo</th>
                      <th className="pb-2 text-right">Chamadas</th>
                      <th className="pb-2 text-right">Tokens</th>
                      <th className="pb-2 text-right">Custo USD</th>
                      <th className="pb-2 text-right">Custo BRL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(metrics.breakdownByModel).map(([mod, stats]) => (
                      <tr key={mod} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 font-medium text-slate-800">
                          <span className="font-mono text-blue-900 font-bold">{mod}</span>
                          {stats.costUsd === 0 && stats.calls > 0 && mod.includes("fable") && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800">
                              Não Mapeado / Legado
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-right font-mono">{stats.calls}</td>
                        <td className="py-2.5 text-right font-mono">{stats.tokens.toLocaleString("pt-BR")}</td>
                        <td className="py-2.5 text-right font-mono">${stats.costUsd.toFixed(6)}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-emerald-700">
                          R$ {stats.costBrl.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Controles de Registros Individuais */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Registros Individuais Auditáveis
              </h2>
              <p className="text-xs text-slate-500">
                Histórico detalhado por chamada física à API (Zero-PII — sem prompts ou dados pessoais)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterSource}
                onChange={(e) => {
                  setFilterSource(e.target.value);
                  setTimeout(() => fetchMetrics(token), 10);
                }}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-800"
              >
                <option value="all">Todas as Origens</option>
                <option value="production">Apenas Produção Real</option>
                <option value="synthetic_test">Testes Sintéticos Legados</option>
                <option value="error">Erros</option>
              </select>

              <button
                onClick={() => {
                  const nextVal = !showRecords;
                  setShowRecords(nextVal);
                  if (nextVal && (!data?.records || data.records.length === 0)) {
                    fetchMetrics(token);
                  }
                }}
                className="px-4 py-2 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              >
                {showRecords ? "Ocultar Registros" : "Carregar Registros Individuais"}
              </button>
            </div>
          </div>

          {showRecords && data?.records && (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                    <th className="pb-2">Timestamp</th>
                    <th className="pb-2">Origem</th>
                    <th className="pb-2">Operação</th>
                    <th className="pb-2">Modelo</th>
                    <th className="pb-2 text-right">Tokens In/Out</th>
                    <th className="pb-2 text-right">Custo USD</th>
                    <th className="pb-2 text-right">Custo BRL</th>
                    <th className="pb-2 text-right">Duração</th>
                    <th className="pb-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {data.records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 text-slate-600 whitespace-nowrap">{formatDate(r.timestamp)}</td>
                      <td className="py-2.5 font-sans">
                        {r.source === "production" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Produção
                          </span>
                        ) : r.source === "synthetic_test" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                            Teste Sintético
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {r.source || "n/a"}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-slate-900 font-bold">{r.operationType}</td>
                      <td className="py-2.5 text-blue-900">{r.model}</td>
                      <td className="py-2.5 text-right text-slate-700">
                        {r.usage.inputTokens !== null ? r.usage.inputTokens : "indisp."} /{" "}
                        {r.usage.outputTokens !== null ? r.usage.outputTokens : "indisp."}
                      </td>
                      <td className="py-2.5 text-right text-slate-700">
                        {r.cost.usd !== null ? `$${r.cost.usd.toFixed(6)}` : "null"}
                      </td>
                      <td className="py-2.5 text-right font-bold text-emerald-700">
                        {r.cost.brl !== null ? `R$ ${r.cost.brl.toFixed(4)}` : "null"}
                      </td>
                      <td className="py-2.5 text-right text-slate-500">{r.durationMs}ms</td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                            r.status === "success"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-rose-50 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Disclaimer Legal / Contábil */}
        <footer className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>{metrics?.disclaimer}</span>
        </footer>
      </div>
    </div>
  );
}
