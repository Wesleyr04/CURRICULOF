/**
 * Rate Limiter In-Memory para Rotas de IA do FastCurrículo
 * Protege contra Denial of Wallet / Exaustão de Créditos de API.
 * Limites por IP:
 * - Máximo de 3 requisições por minuto
 * - Máximo de 8 requisições por hora
 */

interface RateLimitRecord {
  minuteRequests: number[];
  hourRequests: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Limpeza periódica do mapa a cada 10 minutos para não vazar memória
const CLEANUP_INTERVAL = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  const oneHourAgo = now - 60 * 60 * 1000;

  for (const [ip, record] of rateLimitStore.entries()) {
    record.hourRequests = record.hourRequests.filter((t) => t > oneHourAgo);
    if (record.hourRequests.length === 0) {
      rateLimitStore.delete(ip);
    }
  }
}

/**
 * Obtém o IP do cliente de forma resiliente a proxies da Vercel / Cloudflare
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }

  return "127.0.0.1";
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
  message?: string;
}

/**
 * Verifica e contabiliza a chamada para o IP especificado.
 */
export function checkAiRateLimit(ip: string): RateLimitResult {
  cleanupExpired();

  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;

  let record = rateLimitStore.get(ip);
  if (!record) {
    record = { minuteRequests: [], hourRequests: [] };
    rateLimitStore.set(ip, record);
  }

  // Filtra registros expirados
  record.minuteRequests = record.minuteRequests.filter((t) => t > oneMinuteAgo);
  record.hourRequests = record.hourRequests.filter((t) => t > oneHourAgo);

  const MAX_PER_MINUTE = 3;
  const MAX_PER_HOUR = 8;

  // 1. Checa limite por minuto
  if (record.minuteRequests.length >= MAX_PER_MINUTE) {
    const oldestInMinute = record.minuteRequests[0];
    const resetSeconds = Math.max(1, Math.ceil((oldestInMinute + 60 * 1000 - now) / 1000));
    return {
      success: false,
      limit: MAX_PER_MINUTE,
      remaining: 0,
      resetSeconds,
      message: `Limite de 3 gerações de IA por minuto atingido. Aguarde ${resetSeconds}s antes de tentar novamente.`,
    };
  }

  // 2. Checa limite por hora
  if (record.hourRequests.length >= MAX_PER_HOUR) {
    const oldestInHour = record.hourRequests[0];
    const resetSeconds = Math.max(1, Math.ceil((oldestInHour + 60 * 60 * 1000 - now) / 1000));
    return {
      success: false,
      limit: MAX_PER_HOUR,
      remaining: 0,
      resetSeconds,
      message: "Limite de 8 gerações gratuitas por hora atingido para o seu endereço de acesso.",
    };
  }

  // Registra a nova requisição
  record.minuteRequests.push(now);
  record.hourRequests.push(now);

  const remaining = Math.min(
    MAX_PER_MINUTE - record.minuteRequests.length,
    MAX_PER_HOUR - record.hourRequests.length
  );

  return {
    success: true,
    limit: MAX_PER_MINUTE,
    remaining,
    resetSeconds: 60,
  };
}

/**
 * Utilitário para resetar a store em testes unitários.
 */
export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}
