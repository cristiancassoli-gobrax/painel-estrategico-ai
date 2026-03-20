import { STRATEGIC_QUESTIONS, type QuestionId } from "@/lib/questions";

type NumericRow = Record<string, string | number | null | undefined>;

export type VehicleRow = NumericRow & {
  customerId?: string;
  plate?: string;
  identification?: string;
  customerName?: string;
  score?: string;
  averageSpeed?: string;
  totalIdleTime?: string;
  consumptionAverage?: string;
  totalMileage?: string;
  end_date?: string;
};

export type DriverRow = NumericRow & {
  customerId?: string;
  driver_id?: string;
  driver_name?: string;
  general_score?: string;
  idle_percentage?: string;
  total_breaking?: string;
  total_breaking_in_100_km?: string;
  consumption_average?: string;
  average_speed?: string;
  movement_total_km?: string;
  end_date?: string;
};

export type InsightPayload = {
  filters: {
    customerId: string | null;
    customerName: string;
    periodKey: string | null;
    periodKeys?: string[];
    periodLabel: string;
  };
  latestVehiclePeriod: string | null;
  latestDriverPeriod: string | null;
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
  topLists: {
    worstConsumptionVehicles: Array<Record<string, string | number>>;
    highestIdleVehicles: Array<Record<string, string | number>>;
    bestVehicles: Array<Record<string, string | number>>;
    lowestDriverScores: Array<Record<string, string | number>>;
    bestDrivers: Array<Record<string, string | number>>;
    highestBrakingDrivers: Array<Record<string, string | number>>;
  };
  questionContext: {
    id: QuestionId;
    title: string;
    objective: string;
  };
};

const numberFrom = (value: unknown) => {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const average = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const sortDesc = <T,>(items: T[], accessor: (item: T) => number) =>
  [...items].sort((left, right) => accessor(right) - accessor(left));

const sortAsc = <T,>(items: T[], accessor: (item: T) => number) =>
  [...items].sort((left, right) => accessor(left) - accessor(right));

const latestPeriod = (rows: Array<{ end_date?: string }>) =>
  rows
    .map((row) => row.end_date)
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;

const compact = (value: number, digits = 2) => Number(value.toFixed(digits));

export function buildInsightPayload(
  questionId: QuestionId,
  vehicleRows: VehicleRow[],
  driverRows: DriverRow[],
  filters: {
    customerId: string | null;
    customerName: string;
    periodKey: string | null;
    periodKeys?: string[];
    periodLabel: string;
  },
): InsightPayload {
  const vehicleScores = vehicleRows.map((row) => numberFrom(row.score)).filter(Boolean);
  const driverScores = driverRows.map((row) => numberFrom(row.general_score)).filter(Boolean);
  const consumptionValues = vehicleRows
    .map((row) => numberFrom(row.consumptionAverage))
    .filter(Boolean);
  const idleHours = vehicleRows.map((row) => numberFrom(row.totalIdleTime) / 60).filter(Boolean);
  const mileageValues = vehicleRows.map((row) => numberFrom(row.totalMileage)).filter(Boolean);

  const question = STRATEGIC_QUESTIONS.find((item) => item.id === questionId);
  const uniqueVehicles = new Set(
    vehicleRows.map((row) => row.plate ?? row.identification ?? "").filter(Boolean),
  ).size;
  const uniqueDrivers = new Set(
    driverRows.map((row) => row.driver_id ?? row.driver_name ?? "").filter(Boolean),
  ).size;

  if (!question) {
    throw new Error(`Pergunta invalida: ${questionId}`);
  }

  return {
    filters,
    latestVehiclePeriod: latestPeriod(vehicleRows),
    latestDriverPeriod: latestPeriod(driverRows),
    fleetTotals: {
      vehicles: vehicleRows.length,
      uniqueVehicles,
      drivers: driverRows.length,
      uniqueDrivers,
      averageVehicleScore: compact(average(vehicleScores), 1),
      averageDriverScore: compact(average(driverScores), 1),
      averageConsumption: compact(average(consumptionValues), 2),
      averageIdleHours: compact(average(idleHours), 2),
      totalMileage: compact(mileageValues.reduce((sum, value) => sum + value, 0), 0),
    },
    topLists: {
      worstConsumptionVehicles: sortAsc(
        vehicleRows.filter((row) => numberFrom(row.consumptionAverage) > 0),
        (row) => numberFrom(row.consumptionAverage),
      )
        .slice(0, 5)
        .map((row) => ({
          plate: row.plate ?? "-",
          identification: row.identification ?? "-",
          score: compact(numberFrom(row.score), 1),
          consumptionAverage: compact(numberFrom(row.consumptionAverage), 2),
          idleHours: compact(numberFrom(row.totalIdleTime) / 60, 1),
          averageSpeed: compact(numberFrom(row.averageSpeed), 1),
        })),
      highestIdleVehicles: sortDesc(vehicleRows, (row) => numberFrom(row.totalIdleTime))
        .slice(0, 5)
        .map((row) => ({
          plate: row.plate ?? "-",
          identification: row.identification ?? "-",
          idleHours: compact(numberFrom(row.totalIdleTime) / 60, 1),
          consumptionAverage: compact(numberFrom(row.consumptionAverage), 2),
          totalMileage: compact(numberFrom(row.totalMileage), 0),
        })),
      bestVehicles: sortDesc(vehicleRows, (row) => numberFrom(row.consumptionAverage))
        .slice(0, 5)
        .map((row) => ({
          plate: row.plate ?? "-",
          identification: row.identification ?? "-",
          consumptionAverage: compact(numberFrom(row.consumptionAverage), 2),
          score: compact(numberFrom(row.score), 1),
          totalMileage: compact(numberFrom(row.totalMileage), 0),
        })),
      lowestDriverScores: sortAsc(driverRows, (row) => numberFrom(row.general_score))
        .slice(0, 5)
        .map((row) => ({
          driver: row.driver_name ?? "-",
          driverId: row.driver_id ?? "-",
          generalScore: compact(numberFrom(row.general_score), 1),
          idlePercentage: compact(numberFrom(row.idle_percentage), 2),
          brakingPer100Km: compact(numberFrom(row.total_breaking_in_100_km), 2),
          consumptionAverage: compact(numberFrom(row.consumption_average), 2),
        })),
      bestDrivers: sortDesc(driverRows, (row) => numberFrom(row.general_score))
        .slice(0, 5)
        .map((row) => ({
          driver: row.driver_name ?? "-",
          driverId: row.driver_id ?? "-",
          generalScore: compact(numberFrom(row.general_score), 1),
          idlePercentage: compact(numberFrom(row.idle_percentage), 2),
          averageSpeed: compact(numberFrom(row.average_speed), 1),
          consumptionAverage: compact(numberFrom(row.consumption_average), 2),
        })),
      highestBrakingDrivers: sortDesc(driverRows, (row) => numberFrom(row.total_breaking))
        .slice(0, 5)
        .map((row) => ({
          driver: row.driver_name ?? "-",
          driverId: row.driver_id ?? "-",
          totalBreaking: compact(numberFrom(row.total_breaking), 0),
          brakingPer100Km: compact(numberFrom(row.total_breaking_in_100_km), 2),
          generalScore: compact(numberFrom(row.general_score), 1),
        })),
    },
    questionContext: {
      id: question.id,
      title: question.title,
      objective: question.objective,
    },
  };
}
