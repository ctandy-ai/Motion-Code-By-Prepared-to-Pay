import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart3, AlertTriangle, Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useState } from "react";

interface PercentileResult {
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

interface NormativeComparisonData {
  testId: string;
  recordedAt: string;
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

interface NormativeComparisonProps {
  athleteId: string;
}

function PercentileBar({ percentile, bandColor }: { percentile: number; bandColor: string }) {
  return (
    <div className="relative w-full h-3 rounded-full bg-muted overflow-hidden" data-testid="percentile-bar">
      <div
        className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
        style={{ width: `${percentile}%`, backgroundColor: bandColor }}
      />
      <div
        className="absolute top-0 h-full w-0.5 bg-foreground/50"
        style={{ left: '25%' }}
      />
      <div
        className="absolute top-0 h-full w-0.5 bg-foreground/50"
        style={{ left: '50%' }}
      />
      <div
        className="absolute top-0 h-full w-0.5 bg-foreground/50"
        style={{ left: '75%' }}
      />
    </div>
  );
}

function MetricRow({ metric }: { metric: PercentileResult }) {
  const trendIcon = metric.trendDirection === 'positive' 
    ? <TrendingUp className="w-3 h-3 text-muted-foreground" />
    : metric.trendDirection === 'negative'
    ? <TrendingDown className="w-3 h-3 text-muted-foreground" />
    : <Minus className="w-3 h-3 text-muted-foreground" />;

  return (
    <div className="space-y-1.5" data-testid={`norm-metric-${metric.metricName.replace(/\s+/g, '-').toLowerCase()}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {trendIcon}
          <span className="text-sm font-medium truncate">{metric.metricName}</span>
          {metric.riskFlag && (
            <Tooltip>
              <TooltipTrigger>
                <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{metric.riskFlag}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-muted-foreground">
            {metric.value.toFixed(1)} {metric.metricUnit}
          </span>
          <Badge
            className="text-xs no-default-hover-elevate no-default-active-elevate"
            style={{ backgroundColor: metric.bandColor, color: '#fff' }}
          >
            P{metric.percentile}
          </Badge>
        </div>
      </div>
      <PercentileBar percentile={metric.percentile} bandColor={metric.bandColor} />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">5th</span>
        <span className="text-[10px] text-muted-foreground font-medium" style={{ color: metric.bandColor }}>
          {metric.band}
        </span>
        <span className="text-[10px] text-muted-foreground">95th</span>
      </div>
    </div>
  );
}

function ComparisonCard({ comparison, onCohortChange }: { 
  comparison: NormativeComparisonData;
  onCohortChange: (testId: string, cohortId: string) => void;
}) {
  const hasRisks = comparison.metrics.some(m => m.riskFlag);
  
  return (
    <Card className="border-0" data-testid={`norm-comparison-${comparison.testId}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              {comparison.testType} Normative Comparison
              {hasRisks && (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {comparison.recordedAt 
                ? new Date(comparison.recordedAt).toLocaleDateString() 
                : 'Unknown date'}
            </p>
          </div>
          
          {comparison.availableCohorts.length > 1 && (
            <Select 
              value={comparison.matchedCohort.id}
              onValueChange={(v) => onCohortChange(comparison.testId, v)}
            >
              <SelectTrigger className="w-auto max-w-[200px]" data-testid="select-cohort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {comparison.availableCohorts.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-wrap mt-1">
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-[10px] gap-1">
                <Info className="w-3 h-3" />
                {comparison.matchedCohort.name}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-1">
                <p>Age range: {comparison.matchedCohort.ageRange}</p>
                {comparison.matchedCohort.sampleSize && <p>Sample size: n={comparison.matchedCohort.sampleSize}</p>}
                {comparison.matchedCohort.sourceCitation && <p>Source: {comparison.matchedCohort.sourceCitation}</p>}
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {comparison.metrics.map((metric) => (
          <MetricRow key={metric.metricName} metric={metric} />
        ))}
        
        {comparison.metrics.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No matching metrics found for this test
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function NormativeComparison({ athleteId }: NormativeComparisonProps) {
  const [cohortOverrides, setCohortOverrides] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery<{ comparisons: NormativeComparisonData[] }>({
    queryKey: ["/api/vald/athletes", athleteId, "norms"],
    queryFn: async () => {
      const res = await fetch(`/api/vald/athletes/${athleteId}/norms`);
      if (!res.ok) throw new Error("Failed to fetch normative data");
      return res.json();
    },
    enabled: !!athleteId,
  });

  const { data: overrideData } = useQuery<{ comparisons: NormativeComparisonData[] }>({
    queryKey: ["/api/vald/athletes", athleteId, "norms", "override", cohortOverrides],
    queryFn: async () => {
      const overrideEntries = Object.entries(cohortOverrides);
      if (overrideEntries.length === 0) return { comparisons: [] };
      const cohortId = overrideEntries[overrideEntries.length - 1][1];
      const res = await fetch(`/api/vald/athletes/${athleteId}/norms?cohortId=${cohortId}`);
      if (!res.ok) throw new Error("Failed to fetch normative data");
      return res.json();
    },
    enabled: !!athleteId && Object.keys(cohortOverrides).length > 0,
  });

  const mergedComparisons = (data?.comparisons || []).map(comparison => {
    const overrideCohortId = cohortOverrides[comparison.testId];
    if (!overrideCohortId) return comparison;
    const overridden = overrideData?.comparisons?.find(c => c.testId === comparison.testId);
    return overridden || comparison;
  });

  const handleCohortChange = (testId: string, cohortId: string) => {
    setCohortOverrides(prev => ({ ...prev, [testId]: cohortId }));
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <Card key={i} className="border-0 animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/3 mb-4" />
              <div className="space-y-3">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data?.comparisons?.length) {
    return null;
  }

  return (
    <div className="space-y-3" data-testid="normative-comparisons">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-semibold">Normative Benchmarks</h2>
        <Tooltip>
          <TooltipTrigger>
            <Info className="w-4 h-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs">
              Compares athlete test results against research-backed normative data. 
              Percentile rankings show where this athlete falls relative to their peer group.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      
      {mergedComparisons.map((comparison) => (
        <ComparisonCard
          key={comparison.testId}
          comparison={comparison}
          onCohortChange={handleCohortChange}
        />
      ))}
    </div>
  );
}
