import { storage } from "./storage";
import type { NormativeCohort, NormativeMetric } from "@shared/schema";

export interface PercentileResult {
  metricName: string;
  metricUnit: string;
  value: number;
  percentile: number;
  band: string;
  bandColor: string;
  trendDirection: string;
  riskFlag: string | null;
  cohortName: string;
  cohortId: string;
  sampleSize: number | null;
  sourceCitation: string | null;
}

export interface NormativeComparisonResult {
  athleteId: string;
  testType: string;
  deviceType: string;
  matchedCohort: {
    id: string;
    name: string;
    sex: string;
    sport: string | null;
    ageRange: string;
    sampleSize: number | null;
    sourceCitation: string | null;
  };
  metrics: PercentileResult[];
  availableCohorts: { id: string; name: string }[];
}

function calculatePercentileFromBands(value: number, metric: NormativeMetric): number {
  const bands = [
    { p: 5, v: metric.p5 },
    { p: 10, v: metric.p10 },
    { p: 25, v: metric.p25 },
    { p: 50, v: metric.p50 },
    { p: 75, v: metric.p75 },
    { p: 90, v: metric.p90 },
    { p: 95, v: metric.p95 },
  ].filter(b => b.v !== null) as { p: number; v: number }[];

  if (bands.length === 0) {
    if (metric.mean !== null && metric.sd !== null && metric.sd > 0) {
      return calculatePercentileFromZScore(value, metric.mean, metric.sd);
    }
    return 50;
  }

  if (value <= bands[0].v) return Math.max(1, bands[0].p - 2);
  if (value >= bands[bands.length - 1].v) return Math.min(99, bands[bands.length - 1].p + 2);

  for (let i = 0; i < bands.length - 1; i++) {
    if (value >= bands[i].v && value <= bands[i + 1].v) {
      const range = bands[i + 1].v - bands[i].v;
      if (range === 0) return bands[i].p;
      const fraction = (value - bands[i].v) / range;
      return Math.round(bands[i].p + fraction * (bands[i + 1].p - bands[i].p));
    }
  }

  return 50;
}

function calculatePercentileFromZScore(value: number, mean: number, sd: number): number {
  const z = (value - mean) / sd;
  const cdf = 0.5 * (1 + erf(z / Math.sqrt(2)));
  return Math.round(Math.max(1, Math.min(99, cdf * 100)));
}

function erf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

function getPercentileBand(percentile: number): { band: string; color: string } {
  if (percentile >= 90) return { band: "Elite", color: "#10b981" };
  if (percentile >= 75) return { band: "Above Average", color: "#22c55e" };
  if (percentile >= 50) return { band: "Average", color: "#3b82f6" };
  if (percentile >= 25) return { band: "Below Average", color: "#f59e0b" };
  if (percentile >= 10) return { band: "Low", color: "#ef4444" };
  return { band: "Very Low", color: "#dc2626" };
}

function checkRiskFlags(value: number, metric: NormativeMetric): string | null {
  if (metric.riskThresholdLow !== null && value < metric.riskThresholdLow) {
    return metric.riskLabel || "Below risk threshold";
  }
  if (metric.riskThresholdHigh !== null && value > metric.riskThresholdHigh) {
    return metric.riskLabel || "Above risk threshold";
  }
  return null;
}

export async function compareAthleteToNorms(params: {
  athleteId: string;
  testType: string;
  deviceType: string;
  testResults: Record<string, number>;
  sex?: string | null;
  sport?: string | null;
  age?: number | null;
  cohortId?: string | null;
}): Promise<NormativeComparisonResult | null> {
  let matchedCohorts: NormativeCohort[];
  
  if (params.cohortId) {
    const cohort = await storage.getNormativeCohort(params.cohortId);
    matchedCohorts = cohort ? [cohort] : [];
  } else {
    matchedCohorts = await storage.getMatchingCohorts({
      deviceType: params.deviceType,
      testType: params.testType,
      sex: params.sex,
      sport: params.sport,
      age: params.age,
    });
  }

  if (matchedCohorts.length === 0) return null;

  const selectedCohort = matchedCohorts[0];
  const cohortMetrics = await storage.getNormativeMetrics(selectedCohort.id);

  if (cohortMetrics.length === 0) return null;

  const allCohorts = await storage.getMatchingCohorts({
    deviceType: params.deviceType,
    testType: params.testType,
    sex: params.sex,
  });

  const metricResults: PercentileResult[] = [];

  for (const metric of cohortMetrics) {
    const value = params.testResults[metric.metricName];
    if (value === undefined || value === null) continue;

    const adjustedValue = metric.trendDirection === 'negative' ? value : value;
    let percentile: number;

    if (metric.method === 'percentile') {
      percentile = calculatePercentileFromBands(
        metric.trendDirection === 'negative' ? -value : value,
        metric.trendDirection === 'negative'
          ? {
              ...metric,
              p5: metric.p95 !== null ? -metric.p95 : null,
              p10: metric.p90 !== null ? -metric.p90 : null,
              p25: metric.p75 !== null ? -metric.p75 : null,
              p50: metric.p50 !== null ? -metric.p50 : null,
              p75: metric.p25 !== null ? -metric.p25 : null,
              p90: metric.p10 !== null ? -metric.p10 : null,
              p95: metric.p5 !== null ? -metric.p5 : null,
            }
          : metric
      );
    } else if (metric.method === 'z_score' && metric.mean !== null && metric.sd !== null) {
      const zValue = metric.trendDirection === 'negative' ? -value : value;
      const zMean = metric.trendDirection === 'negative' ? -(metric.mean) : metric.mean;
      percentile = calculatePercentileFromZScore(zValue, zMean, metric.sd);
    } else {
      percentile = 50;
    }

    const { band, color } = getPercentileBand(percentile);
    const riskFlag = checkRiskFlags(adjustedValue, metric);

    metricResults.push({
      metricName: metric.metricName,
      metricUnit: metric.metricUnit || '',
      value: adjustedValue,
      percentile,
      band,
      bandColor: color,
      trendDirection: metric.trendDirection || 'positive',
      riskFlag,
      cohortName: selectedCohort.name,
      cohortId: selectedCohort.id,
      sampleSize: selectedCohort.sampleSize,
      sourceCitation: selectedCohort.sourceCitation,
    });
  }

  return {
    athleteId: params.athleteId,
    testType: params.testType,
    deviceType: params.deviceType,
    matchedCohort: {
      id: selectedCohort.id,
      name: selectedCohort.name,
      sex: selectedCohort.sex || 'unknown',
      sport: selectedCohort.sport,
      ageRange: `${selectedCohort.ageMin || '?'}-${selectedCohort.ageMax || '?'}`,
      sampleSize: selectedCohort.sampleSize,
      sourceCitation: selectedCohort.sourceCitation,
    },
    metrics: metricResults,
    availableCohorts: allCohorts.map(c => ({ id: c.id, name: c.name })),
  };
}
