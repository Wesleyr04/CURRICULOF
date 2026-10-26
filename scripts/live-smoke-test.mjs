import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

// 1. Carrega variáveis de .env.local sem dependência externa
const envPath = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("ERRO: Arquivo .env.local não encontrado em", envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = (match[2] || "").trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
}

const apiKey = env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("ERRO: ANTHROPIC_API_KEY não encontrada em .env.local");
  process.exit(1);
}

const model = env.ANTHROPIC_MODEL || "claude-3-5-haiku-20241022";

console.log("=== INICIANDO LIVE SMOKE TEST (CATEGORIA B — ANTHROPIC OFICIAL) ===");
console.log("Endpoint: https://api.anthropic.com");
console.log("Modelo solicitado:", model);
console.log("API Key presente: SIM (tamanho:", apiKey.length, "prefixo:", apiKey.slice(0, 12), "...)");

const client = new Anthropic({ apiKey });

try {
  const startTime = Date.now();
  const response = await client.messages.create({
    model,
    max_tokens: 150,
    messages: [
      {
        role: "user",
        content: "Escreva uma frase de resumo profissional para um candidato a Fazendeiro.",
      },
    ],
  });

  const durationMs = Date.now() - startTime;
  const inputTokens = response.usage?.input_tokens ?? 0;
  const outputTokens = response.usage?.output_tokens ?? 0;
  const textContent = response.content
    ?.filter((b) => b.type === "text")
    ?.map((b) => b.text)
    ?.join("")
    ?.trim();

  console.log("\n=== RESULTADO DA VERIFICAÇÃO REAL ===");
  console.log("Status HTTP: 200 OK");
  console.log("Message ID real retornado pela Anthropic:", response.id);
  console.log("Modelo retornado pelo provedor:", response.model);
  console.log("Stop Reason:", response.stop_reason);
  console.log("Tokens de Entrada (input_tokens):", inputTokens);
  console.log("Tokens de Saída (output_tokens):", outputTokens);
  console.log("Duração da chamada:", durationMs, "ms");
  console.log("Texto gerado em tempo real:\n", textContent);

  // Validação estrita dos 4 critérios da Categoria B
  if (!response.id || !response.id.startsWith("msg_")) {
    throw new Error("FALHA: ID da mensagem não é um identificador oficial da Anthropic (msg_*)");
  }
  if (!textContent || textContent.length < 10) {
    throw new Error("FALHA: Conteúdo de texto retornado está vazio ou inválido.");
  }
  if (inputTokens <= 0 || outputTokens <= 0) {
    throw new Error("FALHA: Contagem de tokens retornada pelo provedor é inválida (<= 0).");
  }

  console.log("\n✅ VERIFICAÇÃO REAL DA ANTHROPIC (CATEGORIA B) APROVADA COM SUCESSO!");
  process.exit(0);
} catch (err) {
  console.error("\n❌ FALHA NA VERIFICAÇÃO REAL DA ANTHROPIC:", {
    status: err?.status,
    name: err?.name,
    message: err?.message,
    error: err?.error,
  });
  process.exit(1);
}
