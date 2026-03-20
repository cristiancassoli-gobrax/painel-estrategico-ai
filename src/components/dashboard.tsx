"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarRange,
  CheckCheck,
  ChevronDown,
  Fuel,
  Gauge,
  LoaderCircle,
  Search,
  Sparkles,
  TimerReset,
  Truck,
  X,
} from "lucide-react";

import {
  QUESTION_CATEGORIES,
  STRATEGIC_QUESTIONS,
  type QuestionCategoryId,
  type QuestionId,
} from "@/lib/questions";

type InsightResponse = {
  generatedAt: string;
  filters?: {
    customerId: string | null;
    customerName: string;
    periodKey: string | null;
    periodKeys?: string[];
    periodLabel: string;
  };
  payload: {
    filters: {
      customerId: string | null;
      customerName: string;
      periodKey: string | null;
      periodKeys?: string[];
      periodLabel: string;
    };
    latestVehiclePeriod: string | { value: string } | null;
    latestDriverPeriod: string | { value: string } | null;
    fleetTotals: {
      vehicles: number;
      uniqueVehicles: number;
      drivers: number;
      uniqueDrivers: number;
      averageVehicleScore: number;
      averageDriverScore: number;
      averageConsumption: number;
      averageIdleHours: number;
      totalMileage: number;
    };
  };
  answer: {
    headline: string;
    summary: string;
    kpis: Array<{ label: string; value: string; context: string }>;
    insights: string[];
    recommendations: string[];
  };
};

type SummaryResponse = {
  generatedAt: string;
  filters: {
    customerId: string | null;
    customerName: string;
    periodKey: string | null;
    periodKeys?: string[];
    periodLabel: string;
  };
  payload: {
    filters: {
      customerId: string | null;
      customerName: string;
      periodKey: string | null;
      periodKeys?: string[];
      periodLabel: string;
    };
    latestVehiclePeriod: string | { value: string } | null;
    latestDriverPeriod: string | { value: string } | null;
    fleetTotals: {
      vehicles: number;
      uniqueVehicles: number;
      drivers: number;
      uniqueDrivers: number;
      averageVehicleScore: number;
      averageDriverScore: number;
      averageConsumption: number;
      averageIdleHours: number;
      totalMileage: number;
    };
  };
};

type FilterOptionsResponse = {
  periods: Array<{ value: string; label: string }>;
  customers: Array<{ value: string; label: string }>;
  defaults: {
    periods: string[];
    customerName: string | null;
  };
};

const categoryIcons: Record<QuestionCategoryId, typeof AlertTriangle> = {
  attention: AlertTriangle,
  results: BarChart3,
  strengths: CheckCheck,
  opportunities: Sparkles,
};

function formatDate(date: string | { value: string } | null) {
  if (!date) return "Sem periodo";

  const normalizedDate = typeof date === "string" ? date : date.value;
  if (!normalizedDate) return "Sem periodo";

  const parsedDate = new Date(normalizedDate);
  if (Number.isNaN(parsedDate.getTime())) return "Periodo invalido";

  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatIdleHours(hours: number) {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  return `${String(wholeHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function Dashboard() {
  const [selectedQuestionId, setSelectedQuestionId] = useState<QuestionId | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptionsResponse | null>(null);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [promptComplement, setPromptComplement] = useState<string>("");
  const [isPeriodsOpen, setIsPeriodsOpen] = useState<boolean>(false);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [response, setResponse] = useState<InsightResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtersError, setFiltersError] = useState<string | null>(null);
  const [isApplyingFilters, startApplyingFilters] = useTransition();
  const [isGeneratingInsight, startGeneratingInsight] = useTransition();

  useEffect(() => {
    const loadInitialFilters = async () => {
      try {
        const result = await fetch("/api/filters");
        const json = (await result.json()) as FilterOptionsResponse & { error?: string };

        if (!result.ok) {
          throw new Error(json.error ?? "Nao foi possivel carregar os filtros.");
        }

        setFiltersError(null);
        setFilterOptions(json);
        setSelectedPeriods(json.defaults.periods ?? []);
      } catch (requestError) {
        setFiltersError(
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel carregar os filtros.",
        );
      }
    };

    void loadInitialFilters();
  }, []);

  useEffect(() => {
    if (selectedPeriods.length === 0) return;

    const query = new URLSearchParams();
    selectedPeriods.forEach((period) => query.append("period", period));

    const loadCustomersByPeriods = async () => {
      try {
        const result = await fetch(`/api/filters?${query.toString()}`);
        const json = (await result.json()) as FilterOptionsResponse & { error?: string };

        if (!result.ok) {
          throw new Error(json.error ?? "Nao foi possivel atualizar os clientes.");
        }

        setFiltersError(null);
        setFilterOptions((currentValue) => ({
          periods: currentValue?.periods ?? json.periods,
          customers: json.customers,
          defaults: json.defaults,
        }));

        setSelectedCustomerName((currentValue) => {
          const stillExists = json.customers.some(
            (customer) => customer.value === currentValue,
          );
          return stillExists ? currentValue : "";
        });

        setCustomerSearch((currentValue) => {
          const stillExists = json.customers.some(
            (customer) => customer.value === currentValue,
          );
          return stillExists ? currentValue : "";
        });
      } catch (requestError) {
        setFiltersError(
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel atualizar os clientes.",
        );
      }
    };

    void loadCustomersByPeriods();
  }, [selectedPeriods]);

  const selectedQuestion = useMemo(
    () =>
      selectedQuestionId
        ? STRATEGIC_QUESTIONS.find((item) => item.id === selectedQuestionId)
        : undefined,
    [selectedQuestionId],
  );

  const filteredCustomers = useMemo(() => {
    const search = customerSearch.trim().toLowerCase();

    if (!filterOptions) return [];
    if (!search) return filterOptions.customers.slice(0, 18);

    return filterOptions.customers
      .filter((customer) => customer.label.toLowerCase().includes(search))
      .slice(0, 18);
  }, [customerSearch, filterOptions]);

  const groupedPeriods = useMemo(() => {
    if (!filterOptions) return [];

    const groups = new Map<string, Array<{ value: string; label: string }>>();

    filterOptions.periods.forEach((period) => {
      const year = period.value.split("-")[0] ?? "Sem ano";
      const currentGroup = groups.get(year) ?? [];
      currentGroup.push(period);
      groups.set(year, currentGroup);
    });

    return Array.from(groups.entries()).map(([year, periods]) => ({
      year,
      periods,
    }));
  }, [filterOptions]);

  const topMetrics = useMemo(
    () => [
      {
        label: "Total rodado",
        value: summary
          ? `${formatNumber(summary.payload.fleetTotals.totalMileage)} km`
          : "0 km",
        icon: Gauge,
        accent: "from-[#dbeafe] to-[#eff6ff]",
        iconBg: "bg-[#dcecff]",
        iconColor: "text-[#1d4ed8]",
      },
      {
        label: "Qtde de veiculos",
        value: summary ? formatNumber(summary.payload.fleetTotals.uniqueVehicles) : "0",
        icon: Truck,
        accent: "from-[#dcfce7] to-[#f0fdf4]",
        iconBg: "bg-[#dcfce7]",
        iconColor: "text-[#15803d]",
      },
      {
        label: "Qtde de motoristas",
        value: summary ? formatNumber(summary.payload.fleetTotals.uniqueDrivers) : "0",
        icon: BarChart3,
        accent: "from-[#ede9fe] to-[#f5f3ff]",
        iconBg: "bg-[#ede9fe]",
        iconColor: "text-[#6d28d9]",
      },
      {
        label: "Media de consumo",
        value: summary
          ? `${formatNumber(summary.payload.fleetTotals.averageConsumption, 2)} km/L`
          : "-- km/L",
        icon: Fuel,
        accent: "from-[#fef3c7] to-[#fffbeb]",
        iconBg: "bg-[#fff1c2]",
        iconColor: "text-[#b45309]",
      },
      {
        label: "Motor ligado parado",
        value: summary
          ? formatIdleHours(summary.payload.fleetTotals.averageIdleHours)
          : "--:--",
        icon: TimerReset,
        accent: "from-[#fee2e2] to-[#fff1f2]",
        iconBg: "bg-[#fee2e2]",
        iconColor: "text-[#be123c]",
      },
    ],
    [summary],
  );

  const activeCustomerLabel =
    summary?.filters.customerName ||
    response?.filters?.customerName ||
    selectedCustomerName ||
    "Selecione um cliente";

  const activePeriodLabel =
    summary?.filters.periodLabel ||
    response?.filters?.periodLabel ||
    selectedPeriods
      .map(
        (periodValue) =>
          filterOptions?.periods.find((period) => period.value === periodValue)?.label,
      )
      .filter(Boolean)
      .join(", ") ||
    "Selecione pelo menos um periodo";

  const compactPeriodsLabel =
    selectedPeriods.length === 0
      ? "Selecione os meses"
      : selectedPeriods.length <= 2
        ? activePeriodLabel
        : `${selectedPeriods.length} meses selecionados`;

  const togglePeriod = (period: string) => {
    setSelectedPeriods((currentValue) =>
      currentValue.includes(period)
        ? currentValue.filter((item) => item !== period)
        : [period, ...currentValue],
    );
  };

  const selectCustomer = (customerName: string) => {
    setSelectedCustomerName(customerName);
    setCustomerSearch(customerName);
  };

  const clearCustomer = () => {
    setSelectedCustomerName("");
    setCustomerSearch("");
  };

  const applyFilters = () => {
    setFiltersError(null);
    setError(null);
    setResponse(null);

    startApplyingFilters(async () => {
      try {
        const result = await fetch("/api/summary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            periods: selectedPeriods,
            customerName: selectedCustomerName || null,
          }),
        });

        const json = (await result.json()) as SummaryResponse & { error?: string };

        if (!result.ok) {
          throw new Error(json.error ?? "Nao foi possivel atualizar o resumo.");
        }

        setSummary(json);
      } catch (requestError) {
        setSummary(null);
        setFiltersError(
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel atualizar o resumo.",
        );
      }
    });
  };

  const selectQuestion = (questionId: QuestionId) => {
    setSelectedQuestionId(questionId);
  };

  const runQuestion = (questionId: QuestionId) => {
    setSelectedQuestionId(questionId);
    setError(null);

    startGeneratingInsight(async () => {
      try {
        const result = await fetch("/api/insights", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questionId,
            periods: selectedPeriods,
            customerName: selectedCustomerName || null,
            promptComplement: promptComplement.trim() || null,
          }),
        });

        const json = (await result.json()) as InsightResponse & { error?: string };

        if (!result.ok) {
          throw new Error(json.error ?? "Nao foi possivel gerar o insight.");
        }

        setResponse(json);
      } catch (requestError) {
        setResponse(null);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel gerar o insight.",
        );
      }
    });
  };

  return (
    <main className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col gap-4 px-4 py-4 md:px-6">
      <section className="rounded-[26px] bg-white px-6 py-5 panel-shadow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://manutencao.gobrax.com.br/imgs/gobrax.svg"
              alt="Gobrax"
              className="h-12 w-auto object-contain"
            />
          </div>

          <div className="max-w-[320px] text-left lg:text-right">
            <p className="text-[16px] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#111] md:text-[22px]">
              A melhor conectividade
              <br />
              de frotas da America Latina
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[26px] bg-white px-5 py-5 panel-shadow md:px-6">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr_auto]">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#9a9aa0]">
              Periodos da analise
            </p>
            <div className="rounded-[20px] border border-[#eceef2] bg-[#f8fafc] p-2.5">
              <button
                type="button"
                onClick={() => setIsPeriodsOpen((currentValue) => !currentValue)}
                className="flex w-full items-center justify-between rounded-[14px] bg-white px-4 py-3 text-left shadow-[0_6px_18px_rgba(15,23,42,0.06)]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f0ff] text-[#315ed8]">
                    <CalendarRange className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a9aa0]">
                      Competencias
                    </p>
                    <p className="truncate text-sm font-semibold text-[#202020]">
                      {compactPeriodsLabel}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-[#666] transition ${
                    isPeriodsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {selectedPeriods.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedPeriods.map((periodValue) => {
                    const label =
                      filterOptions?.periods.find((period) => period.value === periodValue)
                        ?.label ?? periodValue;

                    return (
                      <button
                        key={periodValue}
                        type="button"
                        onClick={() => togglePeriod(periodValue)}
                        className="rounded-full bg-[#fff3bf] px-3 py-1.5 text-xs font-bold text-[#6e5700]"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {isPeriodsOpen ? (
                <div className="mt-3 max-h-[220px] space-y-4 overflow-auto rounded-[16px] bg-white p-3.5">
                  {groupedPeriods.map((group) => (
                    <div key={group.year}>
                      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#8b8f97]">
                        {group.year}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {group.periods.map((period) => {
                          const active = selectedPeriods.includes(period.value);

                          return (
                            <button
                              key={period.value}
                              type="button"
                              onClick={() => togglePeriod(period.value)}
                              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                active
                                  ? "bg-[#2f6fed] text-white"
                                  : "bg-[#f5f6f8] text-[#666] hover:bg-[#eceff4]"
                              }`}
                            >
                              {period.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#9a9aa0]">
              Buscar cliente
            </p>
            <div className="rounded-[20px] border border-[#d9e5ff] bg-[#f7faff] p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2f6fed]" />
                <input
                  value={customerSearch}
                  onChange={(event) => {
                    setCustomerSearch(event.target.value);
                    if (event.target.value !== selectedCustomerName) {
                      setSelectedCustomerName("");
                    }
                  }}
                  placeholder="Digite o nome do cliente"
                  className="w-full rounded-[16px] border border-[#d9e5ff] bg-white py-3 pl-11 pr-12 text-base font-medium text-[#202020] outline-none transition focus:border-[#2f6fed]"
                />
                {customerSearch ? (
                  <button
                    type="button"
                    onClick={clearCustomer}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 rounded-[14px] bg-white px-4 py-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9a9aa0]">
                    Cliente selecionado
                  </p>
                  <p className="text-sm font-semibold text-[#202020]">
                    {selectedCustomerName || "Nenhum cliente selecionado"}
                  </p>
                </div>
                <span className="rounded-full bg-[#eef2f6] px-3 py-1 text-xs font-semibold text-[#5f6670]">
                  {filterOptions ? `${filterOptions.customers.length} clientes` : "carregando"}
                </span>
              </div>

              <div className="mt-3 max-h-[220px] overflow-auto rounded-[16px] bg-white p-2 ring-1 ring-[#edf0f4]">
                {filteredCustomers.length > 0 ? (
                  <div className="space-y-2">
                    {filteredCustomers.map((customer) => {
                      const active = selectedCustomerName === customer.value;

                      return (
                        <button
                          key={customer.value}
                          type="button"
                          onClick={() => selectCustomer(customer.value)}
                          className={`flex w-full items-center justify-between rounded-[14px] px-4 py-2.5 text-left text-sm transition ${
                            active
                              ? "bg-[#e8f0ff] font-semibold text-[#1f4db8]"
                              : "bg-[#fbfcfd] text-[#404040] hover:bg-[#eef2f6]"
                          }`}
                        >
                          <span className="truncate">{customer.label}</span>
                          {active ? (
                            <span className="ml-3 rounded-full bg-[#cfe0ff] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1f4db8]">
                              Selecionado
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="px-3 py-4 text-sm text-[#7d7d84]">
                    Nenhum cliente encontrado para esse recorte.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={applyFilters}
              disabled={
                isApplyingFilters ||
                isGeneratingInsight ||
                selectedPeriods.length === 0 ||
                !selectedCustomerName
              }
              className="inline-flex h-[54px] w-full items-center justify-center gap-3 rounded-[18px] bg-gradient-to-r from-[#1f1f1f] to-[#2f6fed] px-6 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
            >
              {isApplyingFilters ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Atualizando cards
                </>
              ) : (
                <>
                  Aplicar filtro
                  <Sparkles className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {filtersError ? (
          <p className="mt-4 text-sm text-[#9b4a4a]">{filtersError}</p>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {topMetrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className={`rounded-[24px] bg-gradient-to-br ${metric.accent} px-6 py-6 text-center panel-shadow`}
            >
              <div
                className={`mx-auto flex h-[60px] w-[60px] items-center justify-center rounded-full ${metric.iconBg} ${metric.iconColor}`}
              >
                <Icon className="h-7 w-7" strokeWidth={1.8} />
              </div>
              <p className="mt-6 text-2xl font-extrabold tracking-[-0.04em] text-[#222] md:text-[34px]">
                {metric.value}
              </p>
              <p className="mt-2 text-sm font-semibold text-[#606068]">{metric.label}</p>
            </div>
          );
        })}
      </section>

      <section className="rounded-[28px] bg-white px-5 py-5 panel-shadow md:px-7 md:py-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9a9aa0]">
              Insight geral
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.05em] text-[#111] md:text-[42px]">
              Veja como melhorar sua frota hoje
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#707070] md:text-base">
              Selecione informacoes relevantes e selecionadas sobre a sua operacao
              para identificar riscos, ganhos rapidos e prioridades de acao.
            </p>
          </div>

          <div className="rounded-full bg-[#f4f4f6] px-5 py-2.5 text-sm font-semibold text-[#6c6c72]">
            Atualizacao D-1
          </div>
        </div>

        <div className="rounded-[26px] bg-[linear-gradient(180deg,#fcfcfd_0%,#f7f9fc_100%)] px-4 py-5 md:px-6 md:py-6">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff2b4] text-lg font-extrabold text-[#111]">
              IA
            </div>
            <h2 className="text-3xl font-extrabold tracking-[-0.05em] text-[#111] md:text-[38px]">
              Veja como melhorar sua frota hoje
            </h2>
          </div>

          <div className="grid gap-6 xl:grid-cols-4">
            {QUESTION_CATEGORIES.map((category) => {
              const Icon = categoryIcons[category.id];

              return (
                <div key={category.id}>
                  <div className="mb-4 text-center">
                    <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[#f1d34a] text-[#e0b500]">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <h3 className="text-[18px] font-bold tracking-[-0.03em] text-[#222]">
                      {category.title}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {STRATEGIC_QUESTIONS.filter(
                      (question) => question.category === category.id,
                    ).map((question) => {
                      const active = selectedQuestionId === question.id;

                      return (
                        <button
                          key={question.id}
                          type="button"
                          onClick={() => selectQuestion(question.id)}
                          className={`flex min-h-[90px] w-full items-center justify-between gap-4 rounded-[16px] px-5 py-4 text-left transition ${
                            active
                              ? "bg-[#fff8d8] ring-2 ring-[#f1d34a] shadow-[0_14px_30px_rgba(241,211,74,0.25)]"
                              : "bg-[#f2f4f7] hover:bg-[#eceff4]"
                          }`}
                        >
                          <span className="text-[15px] leading-6 text-[#4a4a4a]">
                            {question.title}
                          </span>
                          <ArrowRight className="h-5 w-5 shrink-0 text-[#111]" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-[26px] bg-white px-5 py-5 panel-shadow md:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9a9aa0]">
                Pergunta ativa
              </p>
              <h3 className="mt-2 text-[28px] font-extrabold tracking-[-0.04em] text-[#111]">
                {selectedQuestion?.promptLabel ?? "Selecione uma pergunta"}
              </h3>
            </div>
            <div className="rounded-full bg-[#e9f1ff] px-4 py-2 text-sm font-bold text-[#1f4db8]">
              OpenRouter + BigQuery
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-[#707070] md:text-base">
            {selectedQuestion?.objective ??
              "Escolha uma pergunta estrategica para definir qual analise a IA vai gerar com base no filtro aplicado."}
          </p>

          <div className="mt-6 rounded-[20px] bg-[#eef4ff] p-4">
            <p className="text-sm font-semibold text-[#202020]">Como a resposta sera montada</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[#52607a]">
              <li>1. Le um ou mais meses selecionados nas duas views.</li>
              <li>2. Filtra o cliente escolhido e consolida score, consumo e ociosidade.</li>
              <li>3. Gera resposta executiva com recomendacoes priorizadas.</li>
            </ul>
          </div>

          <div className="mt-4 rounded-[20px] bg-[#f2fbea] p-4 text-sm leading-6 text-[#446226]">
            <p>
              <strong>Cliente:</strong> {activeCustomerLabel}
            </p>
            <p className="mt-2">
              <strong>Periodos:</strong> {activePeriodLabel}
            </p>
          </div>

          <div className="mt-4 rounded-[20px] border border-[#e7eaef] bg-[#fafbfc] p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7b8088]">
              Complemento do prompt
            </p>
            <p className="mt-2 text-sm leading-6 text-[#6f7480]">
              Use este campo para orientar a IA com contexto extra, meta, foco ou restricao.
            </p>
            <textarea
              value={promptComplement}
              onChange={(event) => setPromptComplement(event.target.value)}
              placeholder="Ex.: priorize ganhos rapidos com baixo esforco e destaque apenas riscos operacionais da ultima competencia."
              className="mt-3 min-h-[110px] w-full resize-y rounded-[16px] border border-[#dde2ea] bg-white px-4 py-3 text-sm leading-6 text-[#202020] outline-none transition focus:border-[#2f6fed]"
            />
          </div>

          <button
            type="button"
            onClick={() => selectedQuestionId && runQuestion(selectedQuestionId)}
            disabled={
              isApplyingFilters ||
              isGeneratingInsight ||
              selectedPeriods.length === 0 ||
              !selectedCustomerName ||
              !selectedQuestionId
            }
            className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-[18px] bg-gradient-to-r from-[#111111] to-[#ffb400] px-6 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isGeneratingInsight ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Gerando insight
              </>
            ) : (
              <>
                Gerar leitura agora
                <Sparkles className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        <div className="rounded-[26px] bg-white px-5 py-5 panel-shadow md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9a9aa0]">
                Leitura estrategica
              </p>
              <h3 className="mt-2 text-[28px] font-extrabold tracking-[-0.04em] text-[#111]">
                Fatos novos e acoes prioritarias
              </h3>
            </div>

            {response ? (
              <div className="rounded-full bg-[#f4f4f6] px-4 py-2 text-sm text-[#777]">
                Veiculos: {formatDate(response.payload.latestVehiclePeriod)} | Motoristas:{" "}
                {formatDate(response.payload.latestDriverPeriod)}
              </div>
            ) : null}
          </div>

          {!response && !error ? (
            <div className="mt-6 rounded-[20px] border border-dashed border-[#d6dae0] bg-[#fbfbfc] px-5 py-8 text-center">
              <p className="text-lg font-semibold text-[#222]">
                Aplique o filtro, selecione uma pergunta e gere o insight.
              </p>
              <p className="mt-3 text-sm leading-6 text-[#7a7a80]">
                O painel esta configurado para operar com perguntas prontas.
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-[20px] border border-[#f2d2d2] bg-[#fff6f6] px-5 py-4">
              <p className="font-semibold text-[#7e1f1f]">Falha ao gerar insight</p>
              <p className="mt-2 text-sm leading-6 text-[#9b4a4a]">{error}</p>
            </div>
          ) : null}

          {response ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-[20px] bg-gradient-to-r from-[#fff6c8] to-[#fffdf0] px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8c6e00]">
                      O que nao esta obvio
                    </p>
                    <h4 className="mt-2 text-[26px] font-extrabold tracking-[-0.04em] text-[#111]">
                      {response.answer.headline}
                    </h4>
                  </div>
                  <div className="rounded-full bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#7a6500]">
                    IA estrategica
                  </div>
                </div>
                <div className="mt-4 rounded-[16px] bg-white/70 px-4 py-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8c6e00]">
                    Leitura estrategica
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#4d4d53] md:text-base">
                    {response.answer.summary}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {response.answer.kpis.map((item) => (
                  <div
                    key={`${item.label}-${item.value}`}
                    className="rounded-[18px] bg-gradient-to-b from-[#f4f6f9] to-[#ffffff] p-4 ring-1 ring-[#edf0f4]"
                  >
                    <p className="text-sm font-semibold text-[#7d7d84]">{item.label}</p>
                    <p className="mt-2 text-[28px] font-extrabold tracking-[-0.04em] text-[#171717]">
                      {item.value}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#76767b]">{item.context}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-[20px] bg-[#eef6ff] p-5">
                  <p className="text-lg font-bold text-[#1d1d1d]">Onde agir primeiro</p>
                  <div className="mt-4 space-y-3">
                    {response.answer.insights.map((item, index) => (
                      <div
                        key={item}
                        className="rounded-[14px] bg-white px-4 py-3 text-sm leading-7 text-[#4f5f78]"
                      >
                        <span className="mr-2 font-bold text-[#1f4db8]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[20px] bg-gradient-to-br from-[#1f1f1f] to-[#3b1f00] p-5 text-white">
                  <p className="text-lg font-bold">Ganho rapido esperado</p>
                  <div className="mt-4 space-y-3">
                    {response.answer.recommendations.map((item, index) => (
                      <div
                        key={item}
                        className="rounded-[14px] bg-white/8 px-4 py-3 text-sm leading-7 text-white/82"
                      >
                        <span className="mr-2 font-bold text-[#ffd35b]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
