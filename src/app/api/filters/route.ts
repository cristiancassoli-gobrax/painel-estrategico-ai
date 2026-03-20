import { NextResponse } from "next/server";

import { fetchDashboardFilterOptions } from "@/lib/bigquery";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periods = searchParams.getAll("period");
    const filters = await fetchDashboardFilterOptions(periods);

    return NextResponse.json(filters);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao carregar filtros.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
