import { NextResponse } from "next/server";

import { buildInsightPayload } from "@/lib/analysis";
import {
  fetchCustomerLabel,
  fetchDrivers,
  fetchVehicles,
} from "@/lib/bigquery";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      periods?: string[];
      customerName?: string | null;
    };

    const filters = {
      periods: body.periods ?? [],
      customerName: body.customerName ?? null,
    };

    const [vehicleRows, driverRows, customerName] = await Promise.all([
      fetchVehicles(filters),
      fetchDrivers(filters),
      fetchCustomerLabel(filters.customerName),
    ]);

    const payload = buildInsightPayload(
      "period_highlights",
      vehicleRows,
      driverRows,
      {
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
      },
    );

    return NextResponse.json({
      filters: payload.filters,
      generatedAt: new Date().toISOString(),
      payload: {
        filters: payload.filters,
        latestVehiclePeriod: payload.latestVehiclePeriod,
        latestDriverPeriod: payload.latestDriverPeriod,
        fleetTotals: payload.fleetTotals,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro inesperado ao carregar resumo.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
