import { BigQuery } from "@google-cloud/bigquery";

import type { DriverRow, VehicleRow } from "@/lib/analysis";

const VEHICLE_VIEW =
  "equipe-dados.datawarehouse_gobrax.vw_panels_month_customer_bi_new";
const DRIVER_VIEW =
  "equipe-dados.datawarehouse_gobrax.vw_v3_drivers_analysis_monthly";

export type DashboardFilterOptions = {
  periods: Array<{
    value: string;
    label: string;
  }>;
  customers: Array<{
    value: string;
    label: string;
  }>;
  defaults: {
    periods: string[];
    customerName: string | null;
  };
};

export type DashboardQueryFilters = {
  periods: string[];
  customerName: string | null;
};

let cachedClient: BigQuery | null = null;

function parseCredentials() {
  const raw = process.env.GCP_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    throw new Error(
      "Defina GCP_SERVICE_ACCOUNT_JSON com o conteudo do service account em JSON.",
    );
  }

  return JSON.parse(raw) as {
    client_email: string;
    private_key: string;
    project_id: string;
  };
}

export function getBigQueryClient() {
  if (cachedClient) return cachedClient;

  const credentials = parseCredentials();

  cachedClient = new BigQuery({
    projectId: process.env.BIGQUERY_PROJECT_ID ?? credentials.project_id,
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
  });

  return cachedClient;
}

async function runQuery<T>(
  query: string,
  params?: Record<string, string | number | string[] | null>,
) {
  const client = getBigQueryClient();
  const [rows] = (await client.query({
    query,
    params,
    location: process.env.BIGQUERY_LOCATION ?? "US",
    useLegacySql: false,
  })) as unknown as [T[]];

  return rows;
}

function formatPeriodLabel(period: string) {
  const [year, month] = period.split("-");

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(Number(year), Number(month) - 1, 1));
}

async function fetchCustomerIdsByName(filters: DashboardQueryFilters) {
  if (!filters.customerName) return null;

  const rows = await runQuery<{ customerId: string }>(
    `
      SELECT DISTINCT CAST(customerId AS STRING) AS customerId
      FROM \`${VEHICLE_VIEW}\`
      WHERE TRIM(REGEXP_REPLACE(customerName, r'\\s+', ' ')) = @customerName
        AND (
          ARRAY_LENGTH(@periods) = 0 OR
          FORMAT_DATE('%Y-%m', DATE(end_date)) IN UNNEST(@periods)
        )
        AND customerId IS NOT NULL
    `,
    {
      customerName: filters.customerName,
      periods: filters.periods,
    },
  );

  return rows.map((row) => row.customerId);
}

export async function fetchDashboardFilterOptions(
  requestedPeriods?: string[],
): Promise<DashboardFilterOptions> {
  const periodRows = await runQuery<{ period: string }>(`
    SELECT DISTINCT FORMAT_DATE('%Y-%m', DATE(end_date)) AS period
    FROM \`${VEHICLE_VIEW}\`
    WHERE end_date IS NOT NULL
    ORDER BY period DESC
    LIMIT 24
  `);

  const periods = periodRows.map((row) => ({
    value: row.period,
    label: formatPeriodLabel(row.period),
  }));

  const activePeriods =
    requestedPeriods && requestedPeriods.length > 0
      ? requestedPeriods
      : periods[0]
        ? [periods[0].value]
        : [];

  const customerRows = await runQuery<{ customerName: string }>(
    `
      WITH normalized_customers AS (
        SELECT
          UPPER(TRIM(REGEXP_REPLACE(customerName, r'\\s+', ' '))) AS customerKey,
          TRIM(REGEXP_REPLACE(customerName, r'\\s+', ' ')) AS customerName
        FROM \`${VEHICLE_VIEW}\`
        WHERE customerName IS NOT NULL
          AND (
            ARRAY_LENGTH(@periods) = 0 OR
            FORMAT_DATE('%Y-%m', DATE(end_date)) IN UNNEST(@periods)
          )
      )
      SELECT ANY_VALUE(customerName) AS customerName
      FROM normalized_customers
      GROUP BY customerKey
      ORDER BY customerName
    `,
    { periods: activePeriods },
  );

  const customers = customerRows.map((row) => ({
    value: row.customerName,
    label: row.customerName,
  }));

  return {
    periods,
    customers,
    defaults: {
      periods: activePeriods,
      customerName: null,
    },
  };
}

export async function fetchCustomerLabel(customerName: string | null) {
  return customerName ?? "Todos os clientes";
}

export async function fetchVehicles(
  filters: DashboardQueryFilters,
  limit?: number,
): Promise<VehicleRow[]> {
  const customerIds = await fetchCustomerIdsByName(filters);
  const limitClause = typeof limit === "number" ? `LIMIT ${limit}` : "";

  return runQuery<VehicleRow>(
    `
      SELECT *
      FROM \`${VEHICLE_VIEW}\`
      WHERE (
        ARRAY_LENGTH(@periods) = 0 OR
        FORMAT_DATE('%Y-%m', DATE(end_date)) IN UNNEST(@periods)
      )
        AND (@customerIds IS NULL OR CAST(customerId AS STRING) IN UNNEST(@customerIds))
      ORDER BY SAFE_CAST(consumptionAverage AS FLOAT64) ASC
      ${limitClause}
    `,
    {
      periods: filters.periods,
      customerIds,
    },
  );
}

export async function fetchDrivers(
  filters: DashboardQueryFilters,
  limit?: number,
): Promise<DriverRow[]> {
  const customerIds = await fetchCustomerIdsByName(filters);
  const limitClause = typeof limit === "number" ? `LIMIT ${limit}` : "";

  return runQuery<DriverRow>(
    `
      SELECT *
      FROM \`${DRIVER_VIEW}\`
      WHERE (
        ARRAY_LENGTH(@periods) = 0 OR
        FORMAT_DATE('%Y-%m', DATE(end_date)) IN UNNEST(@periods)
      )
        AND (@customerIds IS NULL OR CAST(customerId AS STRING) IN UNNEST(@customerIds))
      ORDER BY SAFE_CAST(general_score AS FLOAT64) ASC
      ${limitClause}
    `,
    {
      periods: filters.periods,
      customerIds,
    },
  );
}
