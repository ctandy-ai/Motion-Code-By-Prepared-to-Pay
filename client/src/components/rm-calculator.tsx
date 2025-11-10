import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp } from "lucide-react";
import { ProBadge } from "@/components/pro-badge";

const FORMULAS = {
  epley: { name: "Epley", formula: (weight: number, reps: number) => weight * (1 + reps / 30) },
  brzycki: { name: "Brzycki", formula: (weight: number, reps: number) => weight * (36 / (37 - reps)) },
  lander: { name: "Lander", formula: (weight: number, reps: number) => (100 * weight) / (101.3 - 2.67123 * reps) },
  lombardi: { name: "Lombardi", formula: (weight: number, reps: number) => weight * Math.pow(reps, 0.10) },
  mayhew: { name: "Mayhew", formula: (weight: number, reps: number) => (100 * weight) / (52.2 + 41.9 * Math.exp(-0.055 * reps)) },
  oconner: { name: "O'Conner", formula: (weight: number, reps: number) => weight * (1 + reps / 40) },
  wathan: { name: "Wathan", formula: (weight: number, reps: number) => (100 * weight) / (48.8 + 53.8 * Math.exp(-0.075 * reps)) },
};

export function RMCalculator() {
  const [weight, setWeight] = useState<string>("");
  const [reps, setReps] = useState<string>("");

  const weightNum = parseFloat(weight) || 0;
  const repsNum = parseInt(reps) || 0;

  const isValid = weightNum > 0 && repsNum > 0 && repsNum <= 12;

  const calculate1RM = () => {
    if (!isValid) return null;
    const results = Object.entries(FORMULAS).map(([key, { name, formula }]) => ({
      name,
      value: formula(weightNum, repsNum),
    }));
    return results;
  };

  const results = calculate1RM();
  const average1RM = results ? results.reduce((sum, r) => sum + r.value, 0) / results.length : 0;

  const calculatePercentages = (oneRM: number) => {
    return [
      { percent: 95, label: "95%", value: oneRM * 0.95, use: "Max strength" },
      { percent: 90, label: "90%", value: oneRM * 0.90, use: "Power" },
      { percent: 85, label: "85%", value: oneRM * 0.85, use: "Strength" },
      { percent: 80, label: "80%", value: oneRM * 0.80, use: "Hypertrophy" },
      { percent: 75, label: "75%", value: oneRM * 0.75, use: "Volume" },
      { percent: 70, label: "70%", value: oneRM * 0.70, use: "Endurance" },
      { percent: 65, label: "65%", value: oneRM * 0.65, use: "Warm-up" },
    ];
  };

  return (
    <Card className="bglass shadow-glass border-0 w-full max-w-4xl" data-testid="card-rm-calculator">
      <CardHeader className="border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-brand-400" />
              <CardTitle className="text-lg font-semibold text-slate-100">1RM Calculator</CardTitle>
              <ProBadge className="text-[8px]" />
            </div>
            <CardDescription className="mt-1">
              Calculate your estimated one-rep max using multiple formulas
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight" className="text-slate-200">Weight Lifted (lbs)</Label>
            <Input
              id="weight"
              type="number"
              placeholder="185"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="text-base"
              data-testid="input-weight"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reps" className="text-slate-200">Reps Completed</Label>
            <Input
              id="reps"
              type="number"
              placeholder="8"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="text-base"
              data-testid="input-reps"
            />
            {repsNum > 12 && (
              <p className="text-xs text-amber-400">
                1RM formulas are most accurate for 1-12 reps
              </p>
            )}
          </div>
        </div>

        {isValid && results && (
          <>
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-brand-400" />
                  Estimated 1RM
                </h3>
                <Badge className="bg-brand-600 text-white font-mono text-sm px-3 py-1" data-testid="badge-average-1rm">
                  {average1RM.toFixed(1)} lbs
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {results.map((result) => (
                  <div
                    key={result.name}
                    className="ringify p-3 rounded-lg"
                    data-testid={`result-${result.name.toLowerCase()}`}
                  >
                    <div className="text-xs text-slate-400 mb-1">{result.name}</div>
                    <div className="text-lg font-bold text-slate-100 font-mono">
                      {result.value.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <h3 className="text-sm font-semibold text-slate-100 mb-4">Training Percentages</h3>
              <div className="space-y-2">
                {calculatePercentages(average1RM).map((item) => (
                  <div
                    key={item.percent}
                    className="flex items-center justify-between p-3 rounded-lg ringify hover-elevate transition-colors"
                    data-testid={`percentage-${item.percent}`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-12 justify-center font-mono text-slate-100">
                        {item.label}
                      </Badge>
                      <span className="text-sm text-slate-400">{item.use}</span>
                    </div>
                    <span className="text-base font-bold text-slate-100 font-mono">
                      {item.value.toFixed(1)} lbs
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!isValid && (
          <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-lg">
            <Calculator className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              Enter weight and reps to calculate your 1RM
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
