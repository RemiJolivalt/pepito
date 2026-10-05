import { prisma } from "@/lib/prisma";

/**
 * Tarifs par modèle (USD / million de tokens). Source : tarification
 * officielle Anthropic au 2026-10. À mettre à jour si le modèle change
 * (cf. AGENT_MODEL dans src/lib/anthropic.ts) ou si les prix évoluent —
 * sinon les coûts affichés dans la vue admin dérivent silencieusement.
 */
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-opus-5-5": { input: 4, output: 20 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const price = PRICING[model];
  if (!price) return 0; // modèle inconnu du barème : on trace les tokens, coût à 0 plutôt qu'un chiffre inventé
  return (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
}

type UsageLike = { input_tokens?: number; output_tokens?: number } | undefined;

/**
 * `await anthropic.beta.messages.toolRunner({...})` ne résout qu'au DERNIER
 * tour de la boucle d'outils — si l'agent fait plusieurs aller-retours
 * (web_search, plusieurs propositions...), son `.usage` ne reflète que ce
 * dernier appel, pas la somme réelle facturée par Anthropic. Bug réel
 * signalé le 2026-10-05 : le crédit API se consommait bien plus vite que
 * les coûts affichés dans /admin. Corrigé en itérant la boucle
 * (`for await`, cf. doc Tool Runner) et en sommant l'usage de CHAQUE tour.
 */
export async function runToolLoop<T extends { usage: { input_tokens: number; output_tokens: number } }>(
  runner: AsyncIterable<T>,
): Promise<{ finalMessage: T; usage: { input_tokens: number; output_tokens: number } }> {
  let input_tokens = 0;
  let output_tokens = 0;
  let finalMessage: T | undefined;
  for await (const message of runner) {
    input_tokens += message.usage.input_tokens;
    output_tokens += message.usage.output_tokens;
    finalMessage = message;
  }
  if (!finalMessage) {
    throw new Error("Le modèle n'a renvoyé aucun message.");
  }
  return { finalMessage, usage: { input_tokens, output_tokens } };
}

/** Enregistre un appel modèle pour la vue admin. Ne doit jamais faire échouer l'agent appelant en cas d'erreur d'écriture. */
export async function recordUsage(params: {
  companyId: string;
  agent: string;
  model: string;
  usage: UsageLike;
}) {
  const inputTokens = params.usage?.input_tokens ?? 0;
  const outputTokens = params.usage?.output_tokens ?? 0;
  try {
    await prisma.usageEvent.create({
      data: {
        companyId: params.companyId,
        agent: params.agent,
        model: params.model,
        inputTokens,
        outputTokens,
        costUsd: estimateCostUsd(params.model, inputTokens, outputTokens),
      },
    });
  } catch (error) {
    console.error("Erreur enregistrement usage (non bloquant):", error);
  }
}
