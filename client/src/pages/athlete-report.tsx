import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Athlete, ValdTest, ValdProfile, ValdTrialResult } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Target, 
  Zap,
  Shield,
  Award,
  ChevronRight,
  Gauge,
  User,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

type StatusLevel = 'green' | 'amber' | 'red';

interface TestMetric {
  name: string;
  value: number;
  unit: string;
  percentile?: number;
  status: StatusLevel;
  normMin?: number;
  normMax?: number;
  normAvg?: number;
}

interface TestCategory {
  id: string;
  name: string;
  shortName: string;
  icon: typeof Activity;
  status: StatusLevel;
  summary: string;
  metrics: TestMetric[];
  strengthStatus: StatusLevel;
  explosiveStatus: StatusLevel;
  asymmetryPercent?: number;
}

interface NormativeData {
  testType: string;
  ageGroup: string;
  sportLevel: string;
  metrics: {
    [key: string]: {
      p25: number;
      p50: number;
      p75: number;
      p90: number;
      unit: string;
    };
  };
}

const NORMATIVE_DATA: Record<string, NormativeData> = {
  cmj: {
    testType: 'Countermovement Jump',
    ageGroup: '20-25',
    sportLevel: 'Semi-Pro Field Sport',
    metrics: {
      jumpHeight: { p25: 35, p50: 42, p75: 50, p90: 58, unit: 'cm' },
      peakPower: { p25: 32, p50: 38, p75: 45, p90: 52, unit: 'W/kg' },
      rsi: { p25: 0.35, p50: 0.45, p75: 0.55, p90: 0.65, unit: 'm/s' },
    }
  },
  dropJump: {
    testType: 'Drop Jump',
    ageGroup: '20-25',
    sportLevel: 'Semi-Pro Field Sport',
    metrics: {
      rsi: { p25: 1.0, p50: 1.3, p75: 1.6, p90: 2.0, unit: 'm/s' },
      contactTime: { p25: 200, p50: 180, p75: 160, p90: 140, unit: 'ms' },
      peakPower: { p25: 90, p50: 120, p75: 150, p90: 180, unit: 'W/kg' },
    }
  },
  isoPushUp: {
    testType: 'Isometric Push-Up',
    ageGroup: '20-25',
    sportLevel: 'Semi-Pro Field Sport',
    metrics: {
      peakForce: { p25: 0.9, p50: 1.1, p75: 1.3, p90: 1.5, unit: 'xBW' },
      rfd: { p25: 800, p50: 1200, p75: 1600, p90: 2000, unit: 'N/s' },
    }
  },
  plyoPushUp: {
    testType: 'Plyometric Push-Up',
    ageGroup: '20-25',
    sportLevel: 'Semi-Pro Field Sport',
    metrics: {
      pushUpHeight: { p25: 6, p50: 9, p75: 12, p90: 15, unit: 'cm' },
      peakForce: { p25: 1.0, p50: 1.2, p75: 1.4, p90: 1.6, unit: 'xBW' },
    }
  },
  shoulderIso: {
    testType: 'Shoulder Isometric',
    ageGroup: '20-25',
    sportLevel: 'Semi-Pro Field Sport',
    metrics: {
      peakForce: { p25: 90, p50: 110, p75: 130, p90: 150, unit: 'N' },
      asymmetry: { p25: 5, p50: 10, p75: 15, p90: 20, unit: '%' },
    }
  }
};

function getPercentile(value: number, norms: { p25: number; p50: number; p75: number; p90: number }): number {
  if (value <= norms.p25) return Math.round((value / norms.p25) * 25);
  if (value <= norms.p50) return 25 + Math.round(((value - norms.p25) / (norms.p50 - norms.p25)) * 25);
  if (value <= norms.p75) return 50 + Math.round(((value - norms.p50) / (norms.p75 - norms.p50)) * 25);
  if (value <= norms.p90) return 75 + Math.round(((value - norms.p75) / (norms.p90 - norms.p75)) * 15);
  return Math.min(100, 90 + Math.round(((value - norms.p90) / norms.p90) * 10));
}

function getStatusFromPercentile(percentile: number): StatusLevel {
  if (percentile >= 50) return 'green';
  if (percentile >= 25) return 'amber';
  return 'red';
}

function getAsymmetryStatus(asymmetry: number): StatusLevel {
  if (asymmetry <= 10) return 'green';
  if (asymmetry <= 20) return 'amber';
  return 'red';
}

function StatusBadge({ status, size = 'default', testId }: { status: StatusLevel; size?: 'default' | 'large'; testId?: string }) {
  const colors = {
    green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  
  const labels = {
    green: 'GREEN',
    amber: 'AMBER',
    red: 'RED',
  };

  const icons = {
    green: CheckCircle2,
    amber: AlertTriangle,
    red: AlertTriangle,
  };

  const Icon = icons[status];
  
  return (
    <Badge 
      className={`${colors[status]} border ${size === 'large' ? 'px-4 py-2 text-base gap-2' : 'px-2 py-1 text-xs gap-1'} font-semibold`}
      data-testid={testId}
    >
      <Icon className={size === 'large' ? 'w-5 h-5' : 'w-3 h-3'} />
      {labels[status]}
    </Badge>
  );
}

function PercentileGauge({ percentile, label }: { percentile: number; label: string }) {
  const getGaugeColor = () => {
    if (percentile >= 75) return 'bg-emerald-500';
    if (percentile >= 50) return 'bg-teal-500';
    if (percentile >= 25) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold text-foreground">{percentile}th</span>
      </div>
      <div className="h-2 bg-ink-3 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getGaugeColor()} transition-all duration-500`}
          style={{ width: `${percentile}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>25th</span>
        <span>50th</span>
        <span>75th</span>
        <span>90th</span>
      </div>
    </div>
  );
}

function MetricCard({ metric, testId }: { metric: TestMetric; testId?: string }) {
  const statusColors = {
    green: 'border-emerald-500/30 bg-emerald-500/5',
    amber: 'border-amber-500/30 bg-amber-500/5',
    red: 'border-red-500/30 bg-red-500/5',
  };

  return (
    <div className={`p-4 rounded-lg border ${statusColors[metric.status]}`} data-testid={testId}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm text-muted-foreground">{metric.name}</span>
        <StatusBadge status={metric.status} />
      </div>
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-2xl font-bold font-mono text-foreground" data-testid={testId ? `${testId}-value` : undefined}>{metric.value.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">{metric.unit}</span>
      </div>
      {metric.percentile !== undefined && (
        <PercentileGauge percentile={metric.percentile} label="vs 20-25 y/o field athletes" />
      )}
    </div>
  );
}

function TestCategoryCard({ category }: { category: TestCategory }) {
  const Icon = category.icon;
  const statusColors = {
    green: 'border-emerald-500/20',
    amber: 'border-amber-500/20',
    red: 'border-red-500/20',
  };

  return (
    <Card className={`border-2 ${statusColors[category.status]}`} data-testid={`card-test-${category.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-ocean-blue/20">
              <Icon className="w-5 h-5 text-ocean-blue" />
            </div>
            <div>
              <CardTitle className="text-lg">{category.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{category.shortName}</p>
            </div>
          </div>
          <StatusBadge status={category.status} size="large" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{category.summary}</p>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-ink-3/50">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Strength</span>
            <StatusBadge status={category.strengthStatus} />
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-ink-3/50">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Explosive</span>
            <StatusBadge status={category.explosiveStatus} />
          </div>
        </div>

        {category.asymmetryPercent !== undefined && (
          <div className="p-3 rounded-lg bg-ink-3/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Asymmetry</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold">{category.asymmetryPercent.toFixed(0)}%</span>
                <StatusBadge status={getAsymmetryStatus(category.asymmetryPercent)} />
              </div>
            </div>
            <Progress 
              value={Math.min(100, category.asymmetryPercent * 3)} 
              className="h-1.5 mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">Target: &lt;10-15%</p>
          </div>
        )}

        <Separator />

        <div className="grid gap-3">
          {category.metrics.map((metric, idx) => (
            <MetricCard key={idx} metric={metric} testId={`metric-${category.id}-${idx}`} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StrengthsGapsSection({ strengths, gaps }: { strengths: string[]; gaps: string[] }) {
  return (
    <div className="grid md:grid-cols-2 gap-4" data-testid="section-strengths-gaps">
      <Card className="border-emerald-500/20" data-testid="card-strengths">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Strengths
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {strengths.map((strength, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm" data-testid={`text-strength-${idx}`}>
                <ChevronRight className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-foreground">{strength}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-amber-500/20" data-testid="card-gaps">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Gaps / Watchpoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {gaps.map((gap, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm" data-testid={`text-gap-${idx}`}>
                <ChevronRight className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <span className="text-foreground">{gap}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function RecommendationsSection({ recommendations }: { recommendations: { title: string; items: string[] }[] }) {
  return (
    <Card data-testid="section-recommendations">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-professional-gold" />
          Practical Follow-Up Programming (4-6 Weeks)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-ink-3/50 border border-ink-4/30" data-testid={`card-recommendation-${idx}`}>
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-ocean-blue/20 text-ocean-blue text-sm flex items-center justify-center font-bold">
                  {String.fromCharCode(65 + idx)}
                </span>
                {rec.title}
              </h4>
              <ul className="space-y-2">
                {rec.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-ocean-blue mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AthleteSummarySection({ athleteName, summary }: { athleteName: string; summary: string }) {
  return (
    <Card className="border-professional-gold/20" data-testid="section-athlete-summary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-professional-gold" />
          Athlete Summary
        </CardTitle>
        <p className="text-sm text-muted-foreground">Plain language explanation for {athleteName}</p>
      </CardHeader>
      <CardContent>
        <blockquote className="pl-4 border-l-2 border-professional-gold/50 text-foreground italic" data-testid="text-athlete-summary">
          {summary}
        </blockquote>
      </CardContent>
    </Card>
  );
}

export default function AthleteReport() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const [, setLocation] = useLocation();

  const { data: athlete, isLoading: loadingAthlete } = useQuery<Athlete>({
    queryKey: ["/api/athletes", athleteId],
    queryFn: async () => {
      const response = await fetch(`/api/athletes/${athleteId}`);
      if (!response.ok) throw new Error("Failed to fetch athlete");
      return response.json();
    },
  });

  interface ValdDataResponse {
    profile: ValdProfile | undefined;
    tests: ValdTest[];
    latestResults: Record<string, ValdTrialResult[]>;
  }

  const { data: valdData, isLoading: loadingVald } = useQuery<ValdDataResponse>({
    queryKey: ["/api/vald/athletes", athleteId, "data"],
    queryFn: async () => {
      const response = await fetch(`/api/vald/athletes/${athleteId}/data`);
      if (!response.ok) return { profile: undefined, tests: [], latestResults: {} };
      return response.json();
    },
    enabled: !!athleteId,
  });

  const hasValdData = valdData?.tests && valdData.tests.length > 0;

  const processTestData = (): TestCategory[] => {
    if (!hasValdData) {
      return [];
    }

    const categories: TestCategory[] = [];
    const testsByType: Record<string, ValdTest[]> = {};
    
    valdData.tests.forEach(test => {
      const type = test.testType || 'unknown';
      if (!testsByType[type]) testsByType[type] = [];
      testsByType[type].push(test);
    });

    const getIconForTestType = (testType: string) => {
      const lowerType = testType.toLowerCase();
      if (lowerType.includes('cmj') || lowerType.includes('jump')) return Activity;
      if (lowerType.includes('drop')) return Zap;
      if (lowerType.includes('push') && lowerType.includes('iso')) return Shield;
      if (lowerType.includes('push') && lowerType.includes('plyo')) return TrendingUp;
      if (lowerType.includes('shoulder') || lowerType.includes('shld')) return Target;
      if (lowerType.includes('nordic') || lowerType.includes('hamstring')) return Activity;
      return Activity;
    };

    const formatTestTypeName = (testType: string): { name: string; shortName: string } => {
      const lowerType = testType.toLowerCase();
      if (lowerType.includes('cmj')) return { name: 'Countermovement Jump', shortName: 'CMJ - Global Lower-Limb Power' };
      if (lowerType.includes('dropjump') || lowerType.includes('drop jump')) return { name: 'Drop Jump', shortName: 'DJ - Elasticity, Stiffness & Asymmetry' };
      if (lowerType.includes('isopush') || (lowerType.includes('iso') && lowerType.includes('push'))) return { name: 'Isometric Push-Up', shortName: 'ISOPU - Upper-Body Strength' };
      if (lowerType.includes('plyopush') || (lowerType.includes('plyo') && lowerType.includes('push'))) return { name: 'Plyometric Push-Up', shortName: 'PPU - Upper-Body Power' };
      if (lowerType.includes('shoulder') || lowerType.includes('shld')) return { name: 'Shoulder Isometric', shortName: 'SHLDISO - Shoulder Stability' };
      if (lowerType.includes('nordic')) return { name: 'Nordic Hamstring', shortName: 'Nordic - Hamstring Strength' };
      if (lowerType.includes('squat')) return { name: 'Isometric Squat', shortName: 'ISO Squat - Lower Body Strength' };
      return { name: testType.replace(/([A-Z])/g, ' $1').trim(), shortName: `${testType} Testing` };
    };

    Object.entries(testsByType).forEach(([testType, tests]) => {
      const latestTest = tests[0];
      const results = valdData.latestResults[latestTest.id] || [];
      
      const metrics: TestMetric[] = results.slice(0, 4).map(r => {
        const norms = NORMATIVE_DATA.cmj?.metrics.jumpHeight;
        const percentile = norms ? getPercentile(r.metricValue, norms) : 50;
        return {
          name: r.metricName,
          value: r.metricValue,
          unit: r.metricUnit || '',
          percentile,
          status: getStatusFromPercentile(percentile),
        };
      });

      const categoryStatus: StatusLevel = metrics.length > 0 
        ? (metrics.filter(m => m.status === 'red').length > 0 ? 'red' 
          : metrics.filter(m => m.status === 'amber').length > metrics.length / 2 ? 'amber' 
          : 'green')
        : 'green';

      const { name, shortName } = formatTestTypeName(testType);

      categories.push({
        id: testType,
        name,
        shortName,
        icon: getIconForTestType(testType),
        status: categoryStatus,
        summary: `${tests.length} test session(s) recorded. Latest: ${latestTest.recordedAt ? format(new Date(latestTest.recordedAt), 'MMM d, yyyy') : 'Unknown date'}.`,
        metrics,
        strengthStatus: metrics.some(m => m.percentile && m.percentile >= 50) ? 'green' : 'amber',
        explosiveStatus: metrics.some(m => m.name.toLowerCase().includes('rfd') || m.name.toLowerCase().includes('power')) 
          ? (metrics.find(m => m.name.toLowerCase().includes('rfd') || m.name.toLowerCase().includes('power'))?.status || 'amber')
          : 'green',
      });
    });

    return categories;
  };

  const testCategories = processTestData();
  
  const overallStatus: StatusLevel = !hasValdData ? 'amber' 
    : testCategories.some(c => c.status === 'red') ? 'red' 
    : testCategories.some(c => c.status === 'amber') ? 'amber' 
    : 'green';

  const generateStrengths = (): string[] => {
    if (!hasValdData) return [];
    
    const strengths: string[] = [];
    testCategories.forEach(cat => {
      const greenMetrics = cat.metrics.filter(m => m.status === 'green');
      if (greenMetrics.length > 0) {
        strengths.push(`${cat.name}: ${greenMetrics.map(m => m.name).join(', ')} performing well`);
      }
    });
    return strengths.length > 0 ? strengths : ['No significant strengths identified from current test data'];
  };

  const generateGaps = (): string[] => {
    if (!hasValdData) return [];
    
    const gaps: string[] = [];
    testCategories.forEach(cat => {
      const amberRedMetrics = cat.metrics.filter(m => m.status === 'amber' || m.status === 'red');
      if (amberRedMetrics.length > 0) {
        const severity = amberRedMetrics.some(m => m.status === 'red') ? 'requires attention' : 'needs monitoring';
        gaps.push(`${cat.name}: ${amberRedMetrics.map(m => m.name).join(', ')} - ${severity}`);
      }
      if (cat.asymmetryPercent && cat.asymmetryPercent > 10) {
        gaps.push(`${cat.name}: ${cat.asymmetryPercent}% asymmetry detected - target <10-15%`);
      }
    });
    return gaps.length > 0 ? gaps : ['No significant gaps identified from current test data'];
  };

  const generateRecommendations = (): { title: string; items: string[] }[] => {
    if (!hasValdData) return [];
    
    const recs: { title: string; items: string[] }[] = [];
    
    testCategories.forEach(cat => {
      const amberRedMetrics = cat.metrics.filter(m => m.status === 'amber' || m.status === 'red');
      if (amberRedMetrics.length > 0 || (cat.asymmetryPercent && cat.asymmetryPercent > 10)) {
        const items: string[] = [];
        
        if (cat.id.toLowerCase().includes('jump') || cat.id.toLowerCase().includes('cmj')) {
          items.push('Focus on eccentric loading and landing mechanics');
          items.push('Progress plyometric intensity gradually');
        } else if (cat.id.toLowerCase().includes('push')) {
          items.push('Upper body pressing progressions');
          items.push('Focus on rate of force development drills');
        } else if (cat.id.toLowerCase().includes('shoulder') || cat.id.toLowerCase().includes('shld')) {
          items.push('Isometric holds in multiple positions');
          items.push('Address any asymmetry with unilateral work');
        } else {
          items.push('Progressive overload with proper form');
          items.push('Monitor for improvement on re-test');
        }
        
        if (cat.asymmetryPercent && cat.asymmetryPercent > 10) {
          items.push(`Reduce asymmetry from ${cat.asymmetryPercent}% to <10%`);
        }
        
        recs.push({
          title: `Improve ${cat.name}`,
          items: items.slice(0, 4),
        });
      }
    });
    
    return recs.length > 0 ? recs : [{
      title: 'Maintain Current Performance',
      items: ['Continue current training program', 'Schedule regular re-testing', 'Monitor for any declines'],
    }];
  };

  const strengths = generateStrengths();
  const gaps = generateGaps();
  const recommendations = generateRecommendations();

  const generateAthleteSummary = (): string => {
    if (!athlete) return 'Loading athlete summary...';
    if (!hasValdData) return `No VALD testing data is currently available for ${athlete.name}. Once testing is completed and synced, a detailed performance analysis will appear here.`;
    
    const greenCount = testCategories.filter(c => c.status === 'green').length;
    const amberCount = testCategories.filter(c => c.status === 'amber').length;
    const redCount = testCategories.filter(c => c.status === 'red').length;
    
    if (redCount > 0) {
      return `${athlete.name}'s testing shows some areas that need attention before returning to full activity. ${redCount} test category/categories flagged for review. Work with the coaching staff to address these areas before progressing.`;
    } else if (amberCount > 0) {
      return `${athlete.name} is in a good position overall. ${greenCount} test categories are performing well, with ${amberCount} area(s) to keep working on. Cleared for activity with targeted work ongoing to address the amber-flagged areas.`;
    } else {
      return `${athlete.name} is performing excellently across all tested areas. All ${greenCount} test categories are in the green zone. Cleared for full training and competition load.`;
    }
  };

  const athleteSummary = generateAthleteSummary();

  if (loadingAthlete || loadingVald) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-blue mx-auto mb-4" />
          <p className="text-muted-foreground">Loading performance report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8" data-testid="page-athlete-report">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setLocation(`/athletes/${athleteId}`)}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold gradient-text">Performance Report</h1>
          <p className="text-muted-foreground">VALD Testing Analysis</p>
        </div>
      </div>

      <Card className="border-2 border-professional-gold/30" data-testid="card-report-header">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-ocean-blue/20 flex items-center justify-center">
                <User className="w-8 h-8 text-ocean-blue" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground" data-testid="text-athlete-name">{athlete?.name || 'Athlete'}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{athlete?.team || 'Team'}</span>
                  <span>•</span>
                  <span>{athlete?.position || 'Position'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Calendar className="w-4 h-4" />
                  <span>Report Date: {format(new Date(), 'MMMM d, yyyy')}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <div className="text-sm text-muted-foreground">Overall Status</div>
              <StatusBadge status={overallStatus} size="large" testId="badge-overall-status" />
              <p className="text-xs text-muted-foreground max-w-[250px] text-right" data-testid="text-status-description">
                {overallStatus === 'green' && 'Cleared for full activity'}
                {overallStatus === 'amber' && 'Cleared with targeted work ongoing'}
                {overallStatus === 'red' && 'Requires further assessment'}
              </p>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="p-4 rounded-lg bg-ink-3/50" data-testid="section-big-picture">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-professional-gold" />
              Big Picture Summary
            </h3>
            <p className="text-sm text-muted-foreground" data-testid="text-big-picture-summary">
              {!hasValdData 
                ? "No VALD testing data is available yet for this athlete. Complete testing with VALD devices (ForceDecks, NordBord, etc.) and sync the data to see a full performance analysis."
                : overallStatus === 'amber' 
                  ? "Cleared to return to activity with some areas flagged for ongoing work. Current metrics are adequate but there are opportunities to improve performance and reduce injury risk."
                  : overallStatus === 'green'
                    ? "Excellent physical readiness across all tested domains. All metrics within or above normative ranges for age and sport level. Ready for full training and competition load."
                    : "Some areas require attention before full return to play. Further assessment and targeted intervention recommended."}
            </p>
            {hasValdData && overallStatus === 'amber' && (
              <p className="text-sm font-medium text-foreground mt-2">
                Simple version: Good to go, but we're not done building. The focus now is training while we keep improving the flagged areas.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {hasValdData ? (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-ocean-blue" />
            Test Category Results
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Approximate norms for 20-25 y/o male field-sport athletes (AFL, rugby, soccer). Percentiles based on available training data.
          </p>
          <div className="grid lg:grid-cols-2 gap-4">
            {testCategories.map(category => (
              <TestCategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      ) : (
        <Card className="border-dashed border-2 border-muted-foreground/20" data-testid="card-no-vald-data">
          <CardContent className="py-12 text-center">
            <Activity className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No VALD Testing Data Available</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              This athlete doesn't have any VALD test data synced yet. To generate a performance report:
            </p>
            <ol className="text-sm text-muted-foreground text-left max-w-sm mx-auto space-y-2">
              <li className="flex items-start gap-2">
                <span className="bg-ocean-blue/20 text-ocean-blue text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">1</span>
                Complete testing sessions with VALD devices
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-ocean-blue/20 text-ocean-blue text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">2</span>
                Go to VALD Integration settings and sync profiles
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-ocean-blue/20 text-ocean-blue text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">3</span>
                Link the VALD profile to this athlete
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-ocean-blue/20 text-ocean-blue text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">4</span>
                Sync test data to view the full performance report
              </li>
            </ol>
            <Button 
              variant="outline" 
              className="mt-6"
              onClick={() => setLocation('/vald')}
              data-testid="button-go-to-vald"
            >
              Go to VALD Integration
            </Button>
          </CardContent>
        </Card>
      )}

      {hasValdData && strengths.length > 0 && gaps.length > 0 && (
        <StrengthsGapsSection strengths={strengths} gaps={gaps} />
      )}

      {hasValdData && recommendations.length > 0 && (
        <RecommendationsSection recommendations={recommendations} />
      )}

      <AthleteSummarySection 
        athleteName={athlete?.name || 'Athlete'} 
        summary={athleteSummary} 
      />
    </div>
  );
}
