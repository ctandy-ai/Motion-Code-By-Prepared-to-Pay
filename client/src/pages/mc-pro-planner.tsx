import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Activity, Target, AlertTriangle, ChevronRight, Shield } from "lucide-react";

// ─── Types (mirrored from engine) ────────────────────────────────────────────

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

// ─── Constants ───────────────────────────────────────────────────────────────

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

const BELT_CONFIG: Record<Belt, { color: string; bg: string; border: string; label: string }> = {
  WHITE: { color: "#0b0b0c", bg: "#ffffff", border: "#e5e7eb", label: "White Belt" },
  BLUE:  { color: "#ffffff", bg: "#3b82f6", border: "#3b82f6", label: "Blue Belt" },
  BLACK: { color: "#ffffff", bg: "#111111", border: "#ffffff40", label: "Black Belt" },
};

const UNIT_TYPE_CONFIG = {
  STRENGTH_PLYO: { icon: Zap,      label: "Strength + Plyo",    color: "#f59e0b" },
  JUMP_PLYO_MBS: { icon: Activity, label: "Jump / Plyo / MBS",  color: "#10b981" },
  RUNNING:       { icon: Target,   label: "Running",             color: "#6366f1" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function BeltBadge({ belt }: { belt: Belt }) {
  const cfg = BELT_CONFIG[belt];
  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        padding: "4px 12px",
        borderRadius: 999,
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: "0.05em",
      }}
    >
      {cfg.label}
    </span>
  );
}

function BudgetBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: "#9aa0a6" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ height: 6, background: "#2a2a2e", borderRadius: 999 }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 999,
            transition: "width 0.4s ease",
          }}
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
    <Card style={{ background: "#121215", border: "1px solid #2a2a2e", marginBottom: 12 }}>
      <CardContent style={{ padding: 16 }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
          onClick={() => setExpanded((v) => !v)}
        >
          <Icon size={18} color={cfg.color} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{unit.name}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
              {unit.tags.slice(0, 4).map((t) => (
                <Badge key={t} variant="outline" style={{ fontSize: 10, padding: "1px 6px" }}>
                  {t}
                </Badge>
              ))}
            </div>
          </div>
          <ChevronRight
            size={16}
            color="#9aa0a6"
            style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}
          />
        </div>

        {expanded && (
          <div style={{ marginTop: 16, borderTop: "1px solid #2a2a2e", paddingTop: 16 }}>
            {unit.rules.prerequisites.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9aa0a6", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Prerequisites
                </div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {unit.rules.prerequisites.map((p, i) => (
                    <li key={i} style={{ fontSize: 13, color: "#e5e7eb", marginBottom: 2 }}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#10b981", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Progressions
                </div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {unit.rules.progressions.map((p, i) => (
                    <li key={i} style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 2 }}>{p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Regressions
                </div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {unit.rules.regressions.map((p, i) => (
                    <li key={i} style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 2 }}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Stop Rules
              </div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {unit.rules.stopRules.map((p, i) => (
                  <li key={i} style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 2 }}>{p}</li>
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
      fetch(`/api/mc-pro/plan?phase=${phase}&waveWeek=${waveWeek}`).then((r) => r.json()),
  });

  return (
    <div style={{ padding: "24px 32px", maxWidth: 900, margin: "0 auto" }}>
      <PageHeader
        title="MC Pro Planner"
        description="Belt-classified weekly program with dose budgets and unit selection"
      />

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 6 }}>Training Phase</div>
          <Select value={phase} onValueChange={(v) => setPhase(v as Phase)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PHASES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div style={{ width: 140 }}>
          <div style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 6 }}>Wave Week</div>
          <Select value={String(waveWeek)} onValueChange={(v) => setWaveWeek(Number(v) as WaveWeek)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Week 1 — Build</SelectItem>
              <SelectItem value="2">Week 2 — Intensify</SelectItem>
              <SelectItem value="3">Week 3 — Express / Deload</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", color: "#9aa0a6", padding: 48 }}>
          Generating plan…
        </div>
      )}

      {error && (
        <div style={{ color: "#ef4444", padding: 16 }}>Failed to load plan. Check server connection.</div>
      )}

      {plan && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Belt + Classification */}
          <Card style={{ background: "#121215", border: "1px solid #2a2a2e", gridColumn: "1 / -1" }}>
            <CardContent style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <BeltBadge belt={plan.belt} />
                <div style={{ flex: 1 }}>
                  {plan.beltReasons.length > 0 && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {plan.beltReasons.map((r, i) => (
                        <Badge key={i} variant="outline" style={{ fontSize: 11, color: "#f59e0b", borderColor: "#f59e0b40" }}>
                          {r}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {plan.beltModifiers.length > 0 && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                      {plan.beltModifiers.map((m, i) => (
                        <Badge key={i} variant="outline" style={{ fontSize: 11, color: "#6366f1", borderColor: "#6366f140" }}>
                          {m}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", fontSize: 12, color: "#9aa0a6" }}>
                  <div>{PHASES.find((p) => p.value === plan.phase)?.label}</div>
                  <div style={{ marginTop: 2 }}>
                    Wave {plan.waveWeek} — {["Build", "Intensify", "Express / Deload"][plan.waveWeek - 1]}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Budgets */}
          <Card style={{ background: "#121215", border: "1px solid #2a2a2e" }}>
            <CardHeader style={{ paddingBottom: 8 }}>
              <CardTitle style={{ fontSize: 15 }}>Weekly Dose Budget</CardTitle>
            </CardHeader>
            <CardContent style={{ padding: "0 20px 20px" }}>
              <BudgetBar label="Plyo Contacts" value={plan.budgets.plyoContacts} max={280} color="#10b981" />
              <BudgetBar label="Hard Lower Sets" value={plan.budgets.hardLowerSets} max={20} color="#f59e0b" />
              <BudgetBar label="Speed Touches" value={plan.budgets.speedTouches} max={5} color="#6366f1" />
            </CardContent>
          </Card>

          {/* ACL Stage Constraints */}
          {plan.stageConstraints && (
            <Card style={{ background: "#121215", border: "1px solid #ef444440" }}>
              <CardHeader style={{ paddingBottom: 8 }}>
                <CardTitle style={{ fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                  <Shield size={16} color="#ef4444" /> Stage Constraints Active
                </CardTitle>
              </CardHeader>
              <CardContent style={{ padding: "0 20px 20px" }}>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {plan.stageConstraints.notes.map((n, i) => (
                    <li key={i} style={{ fontSize: 13, color: "#9aa0a6", marginBottom: 4 }}>{n}</li>
                  ))}
                </ul>
                {plan.stageConstraints.allowedPlyoBands.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, color: "#9aa0a6", marginBottom: 6, textTransform: "uppercase" }}>Allowed Plyo Bands</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {plan.stageConstraints.allowedPlyoBands.map((b) => (
                        <Badge key={b} variant="outline" style={{ fontSize: 11 }}>{b.replace("_", " ")}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Unit Mix */}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
              Recommended Unit Mix — {plan.units.length} unit{plan.units.length !== 1 ? "s" : ""}
            </div>
            {plan.units.map((unit) => (
              <UnitCard key={unit.id} unit={unit} />
            ))}
          </div>

          {/* Global Stop Rules */}
          <Card style={{ background: "#121215", border: "1px solid #ef444430", gridColumn: "1 / -1" }}>
            <CardHeader style={{ paddingBottom: 8 }}>
              <CardTitle style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={15} color="#ef4444" /> Global Stop Rules
              </CardTitle>
            </CardHeader>
            <CardContent style={{ padding: "0 20px 20px" }}>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {plan.globalStopRules.map((r, i) => (
                  <li key={i} style={{ fontSize: 13, color: "#9aa0a6", marginBottom: 4 }}>{r}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
