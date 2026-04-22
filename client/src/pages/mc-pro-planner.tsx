import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Activity, Target, AlertTriangle, ChevronRight, Shield } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Belt = "WHITE" | "BLUE" | "BLACK";
type Phase =
  | "PRESEASON_A" | "XMAS_BLOCK" | "PRESEASON_B" | "PRECOMP"
  | "INSEASON_EARLY" | "INSEASON_MID" | "INSEASON_LATE" | "BYE_WEEK";
type WaveWeek = 1 | 2 | 3;

interface WeeklyBudgets {
  plyoContacts: number;
  hardLowerSets: number;
  speedTouches: number;
}

interface TrainingUnit {
  id: string;
  name: string;
  type: "STRENGTH_PLYO" | "JUMP_PLYO_MBS" | "RUNNING";
  tags: string[];
  rules: {
    prerequisites: string[];
    regressions: string[];
    progressions: string[];
    stopRules: string[];
  };
}

interface WeeklyPlan {
  belt: Belt;
  beltReasons: string[];
  beltModifiers: string[];
  phase: Phase;
  waveWeek: WaveWeek;
  budgets: WeeklyBudgets;
  units: TrainingUnit[];
  stageConstraints?: {
    notes: string[];
    allowedPlyoBands: string[];
  };
  globalStopRules: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PHASES: { value: Phase; label: string }[] = [
  { value: "PRESEASON_A",    label: "Pre-Season A" },
  { value: "XMAS_BLOCK",     label: "Christmas Block" },
  { value: "PRESEASON_B",    label: "Pre-Season B" },
  { value: "PRECOMP",        label: "Pre-Competition" },
  { value: "INSEASON_EARLY", label: "In-Season Early" },
  { value: "INSEASON_MID",   label: "In-Season Mid" },
  { value: "INSEASON_LATE",  label: "In-Season Late" },
  { value: "BYE_WEEK",       label: "Bye Week" },
];

const BELT_CLASSES: Record<Belt, { wrapper: string; label: string }> = {
  WHITE: { wrapper: "bg-white text-black border border-gray-200",     label: "White Belt" },
  BLUE:  { wrapper: "bg-p2p-electric text-white border border-p2p-electric", label: "Blue Belt" },
  BLACK: { wrapper: "bg-p2p-dark text-white border border-white/25",  label: "Black Belt" },
};

const UNIT_TYPE_CONFIG = {
  STRENGTH_PLYO: { icon: Zap,      label: "Strength + Plyo",   colorClass: "text-amber-400" },
  JUMP_PLYO_MBS: { icon: Activity, label: "Jump / Plyo / MBS", colorClass: "text-emerald-400" },
  RUNNING:       { icon: Target,   label: "Running",            colorClass: "text-indigo-400" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function BeltBadge({ belt }: { belt: Belt }) {
  const cfg = BELT_CLASSES[belt];
  return (
    <span className={`px-3 py-1 rounded-full font-bold text-[13px] tracking-wide ${cfg.wrapper}`}>
      {cfg.label}
    </span>
  );
}

function BudgetBar({ label, value, max, colorClass }: {
  label: string; value: number; max: number; colorClass: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-[13px] text-p2p-muted">{label}</span>
        <span className="text-[13px] font-semibold text-p2p-text">{value}</span>
      </div>
      <div className="h-1.5 bg-p2p-border rounded-full">
        <div
          className={`h-full rounded-full transition-all duration-400 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function UnitCard({ unit }: { unit: TrainingUnit }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = UNIT_TYPE_CONFIG[unit.type];
  const Icon = cfg.icon;

  return (
    <Card className="bg-p2p-surface border border-p2p-border mb-3">
      <CardContent className="p-4">
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => setExpanded(v => !v)}
        >
          <Icon size={18} className={cfg.colorClass} />
          <div className="flex-1">
            <div className="font-semibold text-sm text-p2p-text">{unit.name}</div>
            <div className="flex gap-1.5 mt-1 flex-wrap">
              {unit.tags.slice(0, 4).map(t => (
                <Badge key={t} variant="outline" className="text-[10px] py-0 px-1.5">{t}</Badge>
              ))}
            </div>
          </div>
          <ChevronRight
            size={16}
            className={`text-p2p-muted transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
          />
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-p2p-border">
            {unit.rules.prerequisites.length > 0 && (
              <div className="mb-3">
                <div className="text-[11px] font-bold text-p2p-muted uppercase tracking-[0.08em] mb-1.5">Prerequisites</div>
                <ul className="m-0 pl-4 list-disc">
                  {unit.rules.prerequisites.map((p, i) => (
                    <li key={i} className="text-[13px] text-p2p-text mb-0.5">{p}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-[0.08em] mb-1.5">Progressions</div>
                <ul className="m-0 pl-4 list-disc">
                  {unit.rules.progressions.map((p, i) => (
                    <li key={i} className="text-[12px] text-p2p-muted mb-0.5">{p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-[0.08em] mb-1.5">Regressions</div>
                <ul className="m-0 pl-4 list-disc">
                  {unit.rules.regressions.map((p, i) => (
                    <li key={i} className="text-[12px] text-p2p-muted mb-0.5">{p}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-[11px] font-bold text-red-400 uppercase tracking-[0.08em] mb-1.5">Stop Rules</div>
              <ul className="m-0 pl-4 list-disc">
                {unit.rules.stopRules.map((p, i) => (
                  <li key={i} className="text-[12px] text-p2p-muted mb-0.5">{p}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function McProPlanner() {
  const [phase, setPhase] = useState<Phase>("PRESEASON_A");
  const [waveWeek, setWaveWeek] = useState<WaveWeek>(1);

  const { data: plan, isLoading, error } = useQuery<WeeklyPlan>({
    queryKey: ["/api/mc-pro/plan", phase, waveWeek],
    queryFn: () =>
      fetch(`/api/mc-pro/plan?phase=${phase}&waveWeek=${waveWeek}`).then(r => r.json()),
  });

  return (
    <div className="px-8 py-6 max-w-[900px] mx-auto">
      <PageHeader
        title="MC Pro Planner"
        description="Belt-classified weekly program with dose budgets and unit selection"
      />

      {/* Controls */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex-1 min-w-[180px]">
          <div className="text-xs text-p2p-muted mb-1.5">Training Phase</div>
          <Select value={phase} onValueChange={v => setPhase(v as Phase)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PHASES.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-[140px]">
          <div className="text-xs text-p2p-muted mb-1.5">Wave Week</div>
          <Select value={String(waveWeek)} onValueChange={v => setWaveWeek(Number(v) as WaveWeek)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Week 1 — Build</SelectItem>
              <SelectItem value="2">Week 2 — Intensify</SelectItem>
              <SelectItem value="3">Week 3 — Express / Deload</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="text-center text-p2p-muted py-12">Generating plan…</div>
      )}

      {error && (
        <div className="text-red-400 p-4">Failed to load plan. Check server connection.</div>
      )}

      {plan && (
        <div className="grid grid-cols-2 gap-5">
          {/* Belt + Classification */}
          <Card className="bg-p2p-surface border-p2p-border col-span-2">
            <CardContent className="p-5">
              <div className="flex items-center gap-4 flex-wrap">
                <BeltBadge belt={plan.belt} />
                <div className="flex-1">
                  {plan.beltReasons.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {plan.beltReasons.map((r, i) => (
                        <Badge key={i} variant="outline" className="text-[11px] text-amber-400 border-amber-400/25">{r}</Badge>
                      ))}
                    </div>
                  )}
                  {plan.beltModifiers.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-1.5">
                      {plan.beltModifiers.map((m, i) => (
                        <Badge key={i} variant="outline" className="text-[11px] text-indigo-400 border-indigo-400/25">{m}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right text-xs text-p2p-muted">
                  <div>{PHASES.find(p => p.value === plan.phase)?.label}</div>
                  <div className="mt-0.5">
                    Wave {plan.waveWeek} — {["Build", "Intensify", "Express / Deload"][plan.waveWeek - 1]}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Budgets */}
          <Card className="bg-p2p-surface border-p2p-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-[15px] text-p2p-text">Weekly Dose Budget</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              <BudgetBar label="Plyo Contacts" value={plan.budgets.plyoContacts} max={280} colorClass="bg-emerald-400" />
              <BudgetBar label="Hard Lower Sets" value={plan.budgets.hardLowerSets} max={20} colorClass="bg-amber-400" />
              <BudgetBar label="Speed Touches" value={plan.budgets.speedTouches} max={5} colorClass="bg-indigo-400" />
            </CardContent>
          </Card>

          {/* ACL Stage Constraints */}
          {plan.stageConstraints && (
            <Card className="bg-p2p-surface border border-red-500/25">
              <CardHeader className="pb-2">
                <CardTitle className="text-[15px] text-p2p-text flex items-center gap-2">
                  <Shield size={16} className="text-red-400" /> Stage Constraints Active
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                <ul className="m-0 pl-4 list-disc">
                  {plan.stageConstraints.notes.map((n, i) => (
                    <li key={i} className="text-[13px] text-p2p-muted mb-1">{n}</li>
                  ))}
                </ul>
                {plan.stageConstraints.allowedPlyoBands.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[11px] text-p2p-muted uppercase mb-1.5">Allowed Plyo Bands</div>
                    <div className="flex gap-1.5">
                      {plan.stageConstraints.allowedPlyoBands.map(b => (
                        <Badge key={b} variant="outline" className="text-[11px]">{b.replace("_", " ")}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Unit Mix */}
          <div className="col-span-2">
            <div className="text-sm font-semibold text-p2p-text mb-3">
              Recommended Unit Mix — {plan.units.length} unit{plan.units.length !== 1 ? "s" : ""}
            </div>
            {plan.units.map(unit => <UnitCard key={unit.id} unit={unit} />)}
          </div>

          {/* Global Stop Rules */}
          <Card className="bg-p2p-surface border border-red-500/20 col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-p2p-text flex items-center gap-2">
                <AlertTriangle size={15} className="text-red-400" /> Global Stop Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              <ul className="m-0 pl-4 list-disc">
                {plan.globalStopRules.map((r, i) => (
                  <li key={i} className="text-[13px] text-p2p-muted mb-1">{r}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
