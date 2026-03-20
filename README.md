# Gobrax IA Strategist

Dashboard estrategico com IA para operacao e frota, desenhado para responder perguntas prontas com base em dados do BigQuery.

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS 4
- OpenRouter para geracao dos insights
- BigQuery como camada de dados

## O que o MVP entrega

- Home inspirada no print de referencia
- Blocos estrategicos com perguntas prontas
- Backend que consulta as duas views mais recentes no BigQuery
- Consolidacao de KPIs e listas criticas antes de chamar a IA
- Resposta da IA em formato executivo com:
  - headline
  - resumo
  - KPIs
  - insights
  - recomendacoes priorizadas

## Perguntas iniciais do MVP

- Importante / Atencao
- Resultados gerais
- O que esta indo bem
- Oportunidades

As perguntas estao centralizadas em [src/lib/questions.ts](/Users/cristiancassoli/Documents/Painel_Estrategico_IA/src/lib/questions.ts).

## Configuracao

1. Copie as variaveis de [.env.example](/Users/cristiancassoli/Documents/Painel_Estrategico_IA/.env.example) para `.env.local`.
2. Preencha `OPENROUTER_API_KEY`.
3. Preencha `GCP_SERVICE_ACCOUNT_JSON` com o JSON completo da service account.
4. Ajuste `BIGQUERY_LOCATION` se seu dataset nao estiver em `US`.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Publicacao

### GitHub

1. Crie um repositorio vazio no GitHub.
2. Adicione o remote:

```bash
git remote add origin <URL_DO_REPOSITORIO>
git push -u origin main
```

### Cloudflare Workers

Este projeto esta preparado para deploy em Cloudflare Workers usando `@opennextjs/cloudflare`.

Arquivos adicionados para isso:

- `wrangler.jsonc`
- `open-next.config.ts`
- `public/_headers`
- `.dev.vars.example`

Scripts disponiveis:

```bash
npm run preview
npm run deploy
```

Variaveis e secrets necessarios no Cloudflare:

- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL` opcional
- `OPENROUTER_SITE_URL` opcional
- `OPENROUTER_APP_NAME` opcional
- `BIGQUERY_LOCATION` opcional
- `GCP_SERVICE_ACCOUNT_JSON`

Exemplo de publicacao manual:

```bash
npx wrangler login
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler secret put GCP_SERVICE_ACCOUNT_JSON
npx wrangler deploy
```

Se voce preferir deploy automatico, conecte o repositorio no painel da Cloudflare e configure as mesmas variaveis/secrets por ambiente.

## Integracoes principais

- API route: [src/app/api/insights/route.ts](/Users/cristiancassoli/Documents/Painel_Estrategico_IA/src/app/api/insights/route.ts)
- BigQuery client: [src/lib/bigquery.ts](/Users/cristiancassoli/Documents/Painel_Estrategico_IA/src/lib/bigquery.ts)
- OpenRouter client: [src/lib/openrouter.ts](/Users/cristiancassoli/Documents/Painel_Estrategico_IA/src/lib/openrouter.ts)
- Analise e consolidacao: [src/lib/analysis.ts](/Users/cristiancassoli/Documents/Painel_Estrategico_IA/src/lib/analysis.ts)

## Modelo OpenRouter

O projeto vem configurado por padrao com `stepfun/step-3.5-flash:free`, mas voce pode trocar em `OPENROUTER_MODEL`.
