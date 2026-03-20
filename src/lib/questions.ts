export type QuestionCategoryId =
  | "attention"
  | "results"
  | "strengths"
  | "opportunities";

export type QuestionId =
  | "worst_consumption_vehicles"
  | "highest_idle_vehicles"
  | "lowest_driver_scores"
  | "critical_braking_drivers"
  | "slowest_vehicles_attention"
  | "vehicles_below_score_threshold"
  | "period_highlights"
  | "fleet_evolution"
  | "general_score_actions"
  | "driver_vs_vehicle_correlation"
  | "period_comparison"
  | "performance_concentration"
  | "best_drivers_month"
  | "best_consumption_vehicles"
  | "efficiency_patterns"
  | "safe_driving_spotlight"
  | "best_score_vehicles"
  | "most_consistent_drivers"
  | "reduce_idle_plan"
  | "raise_score_plan"
  | "increase_consumption_efficiency"
  | "coaching_priorities"
  | "maintenance_focus_plan"
  | "quick_wins_plan";

export type QuestionCategory = {
  id: QuestionCategoryId;
  title: string;
  description: string;
};

export type StrategicQuestion = {
  id: QuestionId;
  category: QuestionCategoryId;
  title: string;
  promptLabel: string;
  objective: string;
};

export const QUESTION_CATEGORIES: QuestionCategory[] = [
  {
    id: "attention",
    title: "Importante / Atencao",
    description: "Alertas criticos para reduzir desperdicio, risco e baixa performance.",
  },
  {
    id: "results",
    title: "Resultados gerais",
    description: "Leitura executiva do periodo com comparativos e tendencia da frota.",
  },
  {
    id: "strengths",
    title: "O que esta indo bem",
    description: "Boas praticas, destaques e resultados acima da media.",
  },
  {
    id: "opportunities",
    title: "Oportunidades",
    description: "Recomendacoes praticas para subir score, reduzir ociosidade e melhorar consumo.",
  },
];

export const STRATEGIC_QUESTIONS: StrategicQuestion[] = [
  {
    id: "worst_consumption_vehicles",
    category: "attention",
    title: "Quais veiculos estao com pior consumo medio no periodo?",
    promptLabel: "Pior consumo dos veiculos",
    objective: "Encontrar veiculos com menor eficiencia de combustivel para acao imediata.",
  },
  {
    id: "highest_idle_vehicles",
    category: "attention",
    title: "Quais veiculos estao com maior tempo de motor ligado parado?",
    promptLabel: "Maior ociosidade da frota",
    objective: "Listar veiculos com maior ociosidade e impacto operacional.",
  },
  {
    id: "lowest_driver_scores",
    category: "attention",
    title: "Quais motoristas exigem intervencao imediata pelo score?",
    promptLabel: "Motoristas com pior score",
    objective: "Detectar motoristas com nota geral baixa e maior prioridade de coaching.",
  },
  {
    id: "critical_braking_drivers",
    category: "attention",
    title: "Quem concentra mais frenagens e merece atencao agora?",
    promptLabel: "Risco por frenagens",
    objective: "Priorizar condutores com padrao de condução mais agressivo.",
  },
  {
    id: "slowest_vehicles_attention",
    category: "attention",
    title: "Quais veiculos estao operando com velocidade media muito baixa?",
    promptLabel: "Veiculos com velocidade critica",
    objective: "Encontrar ativos com produtividade comprometida ou uso inadequado.",
  },
  {
    id: "vehicles_below_score_threshold",
    category: "attention",
    title: "Quais veiculos estao abaixo da faixa minima de score?",
    promptLabel: "Veiculos abaixo do score minimo",
    objective: "Separar rapidamente os ativos que precisam de plano corretivo.",
  },
  {
    id: "period_highlights",
    category: "results",
    title: "Quais sao os principais destaques executivos do periodo?",
    promptLabel: "Resumo executivo do periodo",
    objective: "Resumir os sinais mais relevantes de operacao e frota.",
  },
  {
    id: "fleet_evolution",
    category: "results",
    title: "Minha frota esta evoluindo em score, consumo e velocidade media?",
    promptLabel: "Evolucao da frota",
    objective: "Medir tendencia geral da frota com base nas views disponiveis.",
  },
  {
    id: "general_score_actions",
    category: "results",
    title: "O que mais pesa na nota geral e onde devo agir primeiro?",
    promptLabel: "Alavancas da nota geral",
    objective: "Explicar quais indicadores mais impactam o score medio.",
  },
  {
    id: "driver_vs_vehicle_correlation",
    category: "results",
    title: "O problema principal esta mais no comportamento ou no ativo?",
    promptLabel: "Comportamento x ativo",
    objective: "Cruzar leitura de condutores e veiculos para direcionar a acao.",
  },
  {
    id: "period_comparison",
    category: "results",
    title: "O que mudou entre os meses selecionados?",
    promptLabel: "Comparativo entre meses",
    objective: "Resumir a variacao de desempenho entre as competencias escolhidas.",
  },
  {
    id: "performance_concentration",
    category: "results",
    title: "Minha performance esta concentrada em poucos ativos ou esta distribuida?",
    promptLabel: "Concentracao de performance",
    objective: "Entender se o resultado depende de poucos destaques ou de consistencia geral.",
  },
  {
    id: "best_drivers_month",
    category: "strengths",
    title: "Quem sao os melhores motoristas do periodo?",
    promptLabel: "Melhores motoristas",
    objective: "Apontar motoristas de destaque para reconhecimento e benchmark interno.",
  },
  {
    id: "best_consumption_vehicles",
    category: "strengths",
    title: "Quais veiculos estao entregando a melhor eficiencia?",
    promptLabel: "Veiculos mais eficientes",
    objective: "Valorizar ativos com melhor consumo medio e boa operacao.",
  },
  {
    id: "efficiency_patterns",
    category: "strengths",
    title: "Quais padroes de boa performance aparecem nos melhores resultados?",
    promptLabel: "Padroes de excelencia",
    objective: "Traduzir os destaques em praticas replicaveis para a operacao.",
  },
  {
    id: "safe_driving_spotlight",
    category: "strengths",
    title: "Quem combina score alto com conducao segura?",
    promptLabel: "Conducao segura em destaque",
    objective: "Encontrar motoristas com alta performance e baixa agressividade.",
  },
  {
    id: "best_score_vehicles",
    category: "strengths",
    title: "Quais veiculos combinam score alto com boa produtividade?",
    promptLabel: "Melhores veiculos em score",
    objective: "Identificar ativos que entregam boa nota e uso eficiente.",
  },
  {
    id: "most_consistent_drivers",
    category: "strengths",
    title: "Quais motoristas sao mais consistentes no periodo analisado?",
    promptLabel: "Motoristas mais consistentes",
    objective: "Apontar condutores com desempenho estavel e replicavel.",
  },
  {
    id: "reduce_idle_plan",
    category: "opportunities",
    title: "Como reduzir o motor ligado parado com maior impacto?",
    promptLabel: "Plano para reduzir ociosidade",
    objective: "Gerar plano de acao pratico para reduzir idle da frota.",
  },
  {
    id: "raise_score_plan",
    category: "opportunities",
    title: "Como aumentar a nota geral dos motoristas mais rapidamente?",
    promptLabel: "Plano para subir score",
    objective: "Montar priorizacao tatica para evolucao do score dos motoristas.",
  },
  {
    id: "increase_consumption_efficiency",
    category: "opportunities",
    title: "Como melhorar o consumo medio da operacao com os dados atuais?",
    promptLabel: "Plano para melhorar consumo",
    objective: "Traduzir os dados de consumo em recomendacoes acionaveis.",
  },
  {
    id: "coaching_priorities",
    category: "opportunities",
    title: "Qual lista de coaching eu devo atacar primeiro?",
    promptLabel: "Prioridades de coaching",
    objective: "Classificar pessoas e ativos por urgencia e impacto esperado.",
  },
  {
    id: "maintenance_focus_plan",
    category: "opportunities",
    title: "Quais ativos deveriam entrar primeiro em uma revisao tecnica?",
    promptLabel: "Prioridade para revisao tecnica",
    objective: "Sugerir foco de manutencao com base em sinais de baixa eficiencia.",
  },
  {
    id: "quick_wins_plan",
    category: "opportunities",
    title: "Quais ganhos rapidos posso capturar ainda neste periodo?",
    promptLabel: "Plano de ganhos rapidos",
    objective: "Montar uma lista curta de acoes de alto impacto e rapida execucao.",
  },
];
