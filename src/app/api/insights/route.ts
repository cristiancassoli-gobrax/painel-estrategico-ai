import { NextResponse } from "next/server";

import { buildInsightPayload } from "@/lib/analysis";
import {
  fetchCustomerLabel,
  fetchDrivers,
  fetchVehicles,
} from "@/lib/bigquery";
import { STRATEGIC_QUESTIONS, type QuestionId } from "@/lib/questions";
import { generateStrategicAnswer } from "@/lib/openrouter";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      questionId?: QuestionId;
      periods?: string[];
      customerName?: string | null;
      promptComplement?: string | null;
    };
    const questionId = body.questionId;

    if (!questionId || !STRATEGIC_QUESTIONS.some((item) => item.id === questionId)) {
      return NextResponse.json(
        { error: "Pergunta invalida." },
        { status: 400 },
      );
    }

    const filters = {
      periods: body.periods ?? [],
      customerName: body.customerName ?? null,
    };

    const [vehicleRows, driverRows, customerName] = await Promise.all([
      fetchVehicles(filters),
      fetchDrivers(filters),
      fetchCustomerLabel(filters.customerName),
    ]);

    const payload = buildInsightPayload(questionId, vehicleRows, driverRows, {
      customerId: null,
      customerName,
      periodKey: filters.periods[0] ?? null,
      periodKeys: filters.periods,
      periodLabel:
        filters.periods.length > 0
          ? filters.periods
              .map((period) =>
                new Intl.DateTimeFormat("pt-BR", {
                  month: "long",
                  year: "numeric",
                }).format(new Date(`${period}-01T00:00:00`)),
              )
              .join(", ")
          : "Todos os periodos",
    });
    const answer = await generateStrategicAnswer(
      payload,
      body.promptComplement ?? null,
    );

    return NextResponse.json({
      questionId,
      filters: payload.filters,
      generatedAt: new Date().toISOString(),
      payload,
      answer,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro inesperado ao gerar insight.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
