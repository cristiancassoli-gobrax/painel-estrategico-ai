import type { InsightPayload } from "@/lib/analysis";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "stepfun/step-3.5-flash:free";

type StrategicAnswer = {
  headline: string;
  summary: string;
  kpis: Array<{ label: string; value: string; context: string }>;
  insights: string[];
  recommendations: string[];
};

function normalizePromptComplement(promptComplement?: string | null) {
  const trimmed = promptComplement?.trim();
  return trimmed ? trimmed : null;
}

function buildPrompt(payload: InsightPayload, promptComplement?: string | null) {
  const normalizedComplement = normalizePromptComplement(promptComplement);

  return `
Voce e um analista executivo senior de operacao e frota.
Responda em portugues do Brasil, com tom estrategico, objetivo e acionavel.
Nao invente dados fora do contexto enviado.
Quando houver limitacoes dos dados, explicite isso com elegancia.
Considere que o dashboard ja mostra explicitamente:
- total rodado
- quantidade de veiculos
- quantidade de motoristas
- consumo medio
- motor ligado parado

Sua resposta NAO deve repetir esses numeros de forma redundante.
Em vez disso, entregue apenas fatos novos, relacoes, concentracoes de problema, anomalias, prioridades e decisoes praticas.

Estruture a resposta em JSON com este formato:
{
  "headline": "frase curta",
  "summary": "leitura executiva de 2 a 4 frases",
  "kpis": [
    { "label": "string", "value": "string", "context": "string" }
  ],
  "insights": [
    "string"
  ],
  "recommendations": [
    "string"
  ]
}

Regras:
- Traga no maximo 4 KPIs.
- Traga entre 3 e 5 insights.
- Traga entre 3 e 5 recomendacoes priorizadas.
- Conecte os achados ao objetivo da pergunta.
- Priorize consumos, score, ociosidade, frenagens e velocidade media quando fizer sentido.
- Os KPIs devem ser derivados e novos, nunca repetir os cards do dashboard.
- Bons exemplos de KPI: gap para benchmark, quantidade de ativos criticos, concentracao do problema, percentual de risco, potencial de ganho.
- Os insights devem responder "o que esta acontecendo que ainda nao esta obvio no dashboard?".
- As recomendacoes devem ser especificas, priorizadas e orientadas a resultado rapido.
- Evite resumir o dashboard. Interprete o dashboard.

${normalizedComplement ? `Instrucao prioritaria do usuario:
- Voce DEVE incorporar esta orientacao na headline, no summary, nos insights e nas recommendations sempre que os dados suportarem.
- Se houver conflito entre a orientacao do usuario e uma resposta generica, priorize a orientacao do usuario.
- Nao apenas mencione essa orientacao; reorganize a analise a partir dela.
- Orientacao adicional do usuario: "${normalizedComplement}"` : "Nenhuma instrucao adicional do usuario foi enviada."}

Contexto estruturado:
${JSON.stringify(payload, null, 2)}
  `.trim();
}

function extractJsonObject(content: string) {
  const trimmed = content.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch?.[1]) {
    const block = codeBlockMatch[1].trim();
    if (block.startsWith("{") && block.endsWith("}")) {
      return block;
    }
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new Error("Nao foi possivel extrair JSON da resposta da IA.");
}

function normalizeAnswer(value: unknown): StrategicAnswer {
  const parsed = (value ?? {}) as Partial<StrategicAnswer>;

  return {
    headline:
      typeof parsed.headline === "string" && parsed.headline.trim()
        ? parsed.headline.trim()
        : "Leitura executiva indisponivel",
    summary:
      typeof parsed.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : "A IA nao retornou um resumo estruturado nesta tentativa.",
    kpis: Array.isArray(parsed.kpis)
      ? parsed.kpis
          .filter(Boolean)
          .slice(0, 4)
          .map((item) => {
            const kpi = item as {
              label?: string;
              value?: string;
              context?: string;
            };

            return {
              label: kpi.label?.trim() || "KPI",
              value: kpi.value?.trim() || "-",
              context: kpi.context?.trim() || "Sem contexto adicional.",
            };
          })
      : [],
    insights: Array.isArray(parsed.insights)
      ? parsed.insights
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .slice(0, 5)
      : [],
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .slice(0, 5)
      : [],
  };
}

function buildFallbackAnswer(
  payload: InsightPayload,
  promptComplement?: string | null,
): StrategicAnswer {
  const criticalVehicles = payload.topLists.highestIdleVehicles.length;
  const criticalDrivers = payload.topLists.lowestDriverScores.length;
  const normalizedComplement = normalizePromptComplement(promptComplement);
  const complementSummary = normalizedComplement
    ? ` A leitura foi orientada por este foco adicional: ${normalizedComplement}.`
    : "";
  const complementInsight = normalizedComplement
    ? `A orientacao adicional do usuario sugere priorizar uma leitura voltada a "${normalizedComplement}", o que deve guiar a sequencia de decisao.`
    : null;
  const complementRecommendation = normalizedComplement
    ? `Implemente a proxima rodada de analise e coaching seguindo o foco definido pelo usuario: ${normalizedComplement}.`
    : null;

  return {
    headline: `Prioridades operacionais de ${payload.filters.customerName}`,
    summary: `A leitura automatica nao ficou disponivel nesta tentativa, mas o recorte ainda aponta grupos claros de priorizacao. O maior potencial de ganho rapido esta concentrado em poucos veiculos com ociosidade alta e em motoristas com score mais baixo, indicando que a acao pode ser focada sem depender de uma intervencao ampla em toda a frota.${complementSummary}`,
    kpis: [
      {
        label: "Veiculos criticos",
        value: String(criticalVehicles),
        context: "Ativos que ja aparecem entre os maiores focos de ociosidade do recorte.",
      },
      {
        label: "Motoristas prioritarios",
        value: String(criticalDrivers),
        context: "Condutores com pior score e maior chance de ganho via coaching direcionado.",
      },
      {
        label: "Frente mais urgente",
        value: "Ociosidade",
        context: "O recorte mostra repeticao de ativos com tempo parado alto, sugerindo ganho rapido em uso da frota.",
      },
      {
        label: "Tipo de acao",
        value: "Foco tatico",
        context: "A recomendacao e atacar poucos ativos e poucos motoristas antes de escalar a intervencao.",
      },
    ],
    insights: [
      "Os problemas mais relevantes nao parecem estar distribuidos igualmente; eles tendem a se concentrar em poucos ativos e poucos motoristas.",
      "Quando a mesma placa aparece entre baixa eficiencia e alta ociosidade, o ganho rapido costuma vir de uma revisao operacional ou tecnica pontual.",
      "Os piores scores de motoristas sao um bom ponto de partida para uma acao curta de coaching com alto retorno.",
      ...(complementInsight ? [complementInsight] : []),
    ].slice(0, 5),
    recommendations: [
      "Ataque primeiro os veiculos que aparecem simultaneamente em ociosidade alta e baixa eficiencia.",
      "Monte uma lista curta de motoristas de pior score para feedback imediato e acompanhamento na proxima competencia.",
      "Depois de agir nos casos mais concentrados, gere o insight novamente para revisar o deslocamento das prioridades.",
      ...(complementRecommendation ? [complementRecommendation] : []),
    ].slice(0, 5),
  };
}

export async function generateStrategicAnswer(
  payload: InsightPayload,
  promptComplement?: string | null,
) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("Defina OPENROUTER_API_KEY para habilitar a IA.");
  }

  const normalizedComplement = normalizePromptComplement(promptComplement);

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_NAME ?? "Gobrax IA Strategist",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: normalizedComplement
              ? `Voce transforma dados operacionais em leitura executiva clara e recomendacoes praticas. Existe uma instrucao adicional do usuario que deve ser tratada como prioridade editorial da resposta: "${normalizedComplement}".`
              : "Voce transforma dados operacionais em leitura executiva clara e recomendacoes praticas.",
          },
          {
            role: "user",
            content: buildPrompt(payload, promptComplement),
          },
          ...(normalizedComplement
            ? [
                {
                  role: "user" as const,
                  content: `Reforce este foco em toda a resposta: ${normalizedComplement}. Se os dados nao sustentarem parte da orientacao, adapte a resposta para o foco mais proximo suportado pelo recorte.`,
                },
              ]
            : []),
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Falha no OpenRouter: ${response.status} ${errorText}`);
    }

    const json = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const content = json.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("OpenRouter retornou resposta vazia.");
    }

    const extracted = extractJsonObject(content);
    const parsed = JSON.parse(extracted);
    const normalized = normalizeAnswer(parsed);

    if (
      !normalized.kpis.length ||
      !normalized.insights.length ||
      !normalized.recommendations.length
    ) {
      return buildFallbackAnswer(payload, promptComplement);
    }

    return normalized;
  } catch {
    return buildFallbackAnswer(payload, promptComplement);
  }
}
