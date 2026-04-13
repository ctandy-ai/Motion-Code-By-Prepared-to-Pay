/**
 * MotionCode Pro — Program Engine
 * Belt × Phase × WaveWeek → Weekly plan with budgets + unit mix
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type Belt = "WHITE" | "BLUE" | "BLACK";

export type Phase =
  | "PRESEASON_A"
  | "XMAS_BLOCK"
  | "PRESEASON_B"
  | "PRECOMP"
  | "INSEASON_EARLY"
  | "INSEASON_MID"
  | "INSEASON_LATE"
  | "BYE_WEEK";

export type WaveWeek = 1 | 2 | 3;

export type UnitType = "STRENGTH_PLYO" | "JUMP_PLYO_MBS" | "RUNNING";
export type PlyoBand = "SHORT_FAST" | "MEDIUM" | "LONG";

export type AclStage =
  | "ACL_STAGE_1_EARLY_REHAB"
  | "ACL_STAGE_2_TRAIN_TO_TRAIN"
  | "ACL_STAGE_3_TRAIN_TO_COMPETE"
  | "ACL_STAGE_4_RETURN_TO_SPORT"
  | "ACL_STAGE_5_FULL_CLEARANCE";

export interface AthleteMeta {
  ageYears: number;
  trainingAgeYears: number;
  movementQualityScore: 1 | 2 | 3 | 4 | 5;
  injuryFlags: {
    recentRTP?: boolean;
    aclStage?: AclStage;
    recurrentHamstring?: boolean;
    recurrentCalf?: boolean;
    recurrentGroin?: boolean;
  };
  recentExposure14d: {
    speedTouches: number;
    highDecelSessions: number;
  };
  availability: {
    daysPerWeek: number;
    gymAccess: boolean;
  };
}

export interface WeeklyBudgets {
  plyoContacts: number;
  hardLowerSets: number;
  speedTouches: number;
}

export interface DoseRange {
  sets?: [number, number];
  reps?: [number, number];
  contacts?: [number, number];
  rpe?: [number, number];
}

export interface UnitRuleSet {
  prerequisites: string[];
  regressions: string[];
  progressions: string[];
  stopRules: string[];
}

export interface TrainingUnit {
  id: string;
  name: string;
  type: UnitType;
  tags: string[];
  plyoBandsUsed?: PlyoBand[];
  doseGuidelines: {
    byBelt: Record<Belt, DoseRange>;
    byPhase?: Partial<Record<Phase, Partial<DoseRange>>>;
    byWaveWeek?: Partial<Record<WaveWeek, Partial<DoseRange>>>;
  };
  rules: UnitRuleSet;
}

export interface StageConstraints {
  allowedUnitTypes: UnitType[];
  allowedPlyoBands: PlyoBand[];
  plyoContactsCap?: number;
  hardLowerSetsCap?: number;
  speedTouchesCap?: number;
  notes: string[];
}

export interface WeeklyPlan {
  belt: Belt;
  beltReasons: string[];
  beltModifiers: string[];
  phase: Phase;
  waveWeek: WaveWeek;
  budgets: WeeklyBudgets;
  units: TrainingUnit[];
  stageConstraints?: StageConstraints;
  globalStopRules: string[];
}

// ─── Belt Classification ──────────────────────────────────────────────────────

export function classifyBelt(meta: AthleteMeta): {
  belt: Belt;
  reasons: string[];
  modifiers: string[];
} {
  const reasons: string[] = [];
  const modifiers: string[] = [];
  let score = 0;

  // Training age
  if (meta.trainingAgeYears >= 3) score += 2;
  else if (meta.trainingAgeYears >= 1) score += 1;
  else reasons.push("Low training age — build structural tolerance first");

  // Movement quality
  if (meta.movementQualityScore >= 4) score += 2;
  else if (meta.movementQualityScore === 3) score += 1;
  else reasons.push("Movement quality unstable at speed — prioritise skill before load");

  // Injury / RTP constraints
  if (meta.injuryFlags.recentRTP) {
    score -= 2;
    reasons.push("Recent RTP: cap reactive intensity and volume");
    modifiers.push("CAP_REACTIVE_CONTACTS");
  }
  if (meta.injuryFlags.aclStage) {
    score -= 2;
    reasons.push(`ACL stage active (${meta.injuryFlags.aclStage}) — stage overlay applied`);
    modifiers.push("ACL_STAGE_OVERLAY_ACTIVE");
  }
  if (
    meta.injuryFlags.recurrentHamstring ||
    meta.injuryFlags.recurrentCalf ||
    meta.injuryFlags.recurrentGroin
  ) {
    score -= 1;
    modifiers.push("EXPOSURE_PROGRESSIONS_REQUIRED");
  }

  // Exposure history
  if (meta.recentExposure14d.speedTouches === 0) {
    modifiers.push("REINTRO_SPEED_PROGRESSIVELY");
  }

  let belt: Belt = "WHITE";
  if (score >= 4) belt = "BLACK";
  else if (score >= 2) belt = "BLUE";

  return { belt, reasons, modifiers };
}

// ─── Weekly Budgets ───────────────────────────────────────────────────────────

const baseBudgets: Record<Belt, WeeklyBudgets> = {
  WHITE: { plyoContacts: 110, hardLowerSets: 16, speedTouches: 1 },
  BLUE: { plyoContacts: 140, hardLowerSets: 14, speedTouches: 1 },
  BLACK: { plyoContacts: 110, hardLowerSets: 10, speedTouches: 1 },
};

const phaseFactor: Record<Phase, { plyo: number; sets: number; speed: number }> = {
  PRESEASON_A:    { plyo: 1.05, sets: 1.10, speed: 1.0 },
  XMAS_BLOCK:     { plyo: 0.75, sets: 0.75, speed: 1.0 },
  PRESEASON_B:    { plyo: 1.00, sets: 0.95, speed: 1.2 },
  PRECOMP:        { plyo: 0.85, sets: 0.85, speed: 1.2 },
  INSEASON_EARLY: { plyo: 0.80, sets: 0.80, speed: 1.0 },
  INSEASON_MID:   { plyo: 0.80, sets: 0.80, speed: 1.0 },
  INSEASON_LATE:  { plyo: 0.70, sets: 0.70, speed: 1.0 },
  BYE_WEEK:       { plyo: 0.90, sets: 0.90, speed: 1.1 },
};

const waveFactor: Record<WaveWeek, number> = { 1: 1.0, 2: 0.95, 3: 0.75 };

export function getWeeklyBudgets(
  belt: Belt,
  phase: Phase,
  waveWeek: WaveWeek
): WeeklyBudgets {
  const b = baseBudgets[belt];
  const p = phaseFactor[phase];
  const w = waveFactor[waveWeek];

  return {
    plyoContacts: Math.round(b.plyoContacts * p.plyo * w),
    hardLowerSets: Math.round(b.hardLowerSets * p.sets * w),
    speedTouches: Math.max(1, Math.round(b.speedTouches * p.speed)),
  };
}

// ─── ACL Stage Constraints ────────────────────────────────────────────────────

const ACL_STAGE_CONSTRAINTS: Record<AclStage, StageConstraints> = {
  ACL_STAGE_1_EARLY_REHAB: {
    allowedUnitTypes: ["RUNNING"],
    allowedPlyoBands: [],
    plyoContactsCap: 0,
    hardLowerSetsCap: 8,
    speedTouchesCap: 0,
    notes: [
      "No plyometrics — focus on ROM, oedema, early strength",
      "Walking / low-load running only",
      "Gate: full ROM, no effusion, 70% limb symmetry on strength tests",
    ],
  },
  ACL_STAGE_2_TRAIN_TO_TRAIN: {
    allowedUnitTypes: ["RUNNING", "STRENGTH_PLYO"],
    allowedPlyoBands: ["LONG", "MEDIUM"],
    plyoContactsCap: 150,
    hardLowerSetsCap: 12,
    speedTouchesCap: 1,
    notes: [
      "Accommodating surfaces early — progress load congruent with running load",
      "Strength focus: accumulation phase (2–3 sets × 4–8 reps)",
      "Gate: hop LSI ≥90%, no pain/effusion response within 24h",
    ],
  },
  ACL_STAGE_3_TRAIN_TO_COMPETE: {
    allowedUnitTypes: ["RUNNING", "STRENGTH_PLYO", "JUMP_PLYO_MBS"],
    allowedPlyoBands: ["LONG", "MEDIUM", "SHORT_FAST"],
    plyoContactsCap: 200,
    hardLowerSetsCap: 14,
    speedTouchesCap: 2,
    notes: [
      "Introduce SHORT_FAST contacts cautiously",
      "MBS: stepping (extended) patterns before stopping (hinge/flexed) patterns",
      "Gate: symmetry on CMJ + RSImod, completion of speed reintroduction block",
    ],
  },
  ACL_STAGE_4_RETURN_TO_SPORT: {
    allowedUnitTypes: ["RUNNING", "STRENGTH_PLYO", "JUMP_PLYO_MBS"],
    allowedPlyoBands: ["LONG", "MEDIUM", "SHORT_FAST"],
    plyoContactsCap: 250,
    hardLowerSetsCap: 16,
    speedTouchesCap: 3,
    notes: [
      "Full contact training reintroduction — sport-specific exposure",
      "Monitor training load totals closely across all sessions",
      "Gate: psychological readiness + physical clearance from clinician",
    ],
  },
  ACL_STAGE_5_FULL_CLEARANCE: {
    allowedUnitTypes: ["RUNNING", "STRENGTH_PLYO", "JUMP_PLYO_MBS"],
    allowedPlyoBands: ["LONG", "MEDIUM", "SHORT_FAST"],
    notes: ["Full training. Belt classification applies without stage caps."],
  },
};

export function applyStageConstraints(
  budgets: WeeklyBudgets,
  stage: AclStage
): { budgets: WeeklyBudgets; constraints: StageConstraints } {
  const constraints = ACL_STAGE_CONSTRAINTS[stage];
  return {
    budgets: {
      plyoContacts:
        constraints.plyoContactsCap !== undefined
          ? Math.min(budgets.plyoContacts, constraints.plyoContactsCap)
          : budgets.plyoContacts,
      hardLowerSets:
        constraints.hardLowerSetsCap !== undefined
          ? Math.min(budgets.hardLowerSets, constraints.hardLowerSetsCap)
          : budgets.hardLowerSets,
      speedTouches:
        constraints.speedTouchesCap !== undefined
          ? Math.min(budgets.speedTouches, constraints.speedTouchesCap)
          : budgets.speedTouches,
    },
    constraints,
  };
}

// ─── Unit Library ─────────────────────────────────────────────────────────────

export const UNIT_LIBRARY: TrainingUnit[] = [
  {
    id: "SP_A",
    name: "Strength + Plyo Unit A — Prime → Contrast → Posterior Chain → Trunk",
    type: "STRENGTH_PLYO",
    tags: ["contrast", "balanced", "posterior-chain", "trunk", "squat-bias"],
    plyoBandsUsed: ["SHORT_FAST", "LONG"],
    doseGuidelines: {
      byBelt: {
        WHITE: { sets: [10, 14], contacts: [40, 70], rpe: [6, 8] },
        BLUE:  { sets: [8, 12],  contacts: [50, 85], rpe: [6, 8] },
        BLACK: { sets: [6, 10],  contacts: [35, 70], rpe: [7, 9] },
      },
    },
    rules: {
      prerequisites: [
        "Able to complete primer contacts with clean mechanics",
        "No acute pain or swelling in lower limb",
      ],
      regressions: [
        "Reduce reactive band intensity (SHORT_FAST → MEDIUM)",
        "Swap unilateral to bilateral",
        "Reduce contacts by 20–40%",
        "Extend rest periods",
      ],
      progressions: [
        "Increase intent before volume",
        "Add directional constraints",
        "Reduce reps, increase load intent",
        "Progress from bilateral to unilateral",
      ],
      stopRules: [
        "Stop/downshift if contacts become noisy or slow",
        "Stop sets if technique compensates under fatigue",
        "Stop session if pain > 3/10 or effusion response noted",
      ],
    },
  },
  {
    id: "SP_B",
    name: "Strength + Plyo Unit B — Hinge Focus + Unilateral Emphasis",
    type: "STRENGTH_PLYO",
    tags: ["contrast", "hinge-bias", "unilateral", "posterior-chain"],
    plyoBandsUsed: ["MEDIUM", "LONG"],
    doseGuidelines: {
      byBelt: {
        WHITE: { sets: [8, 12],  contacts: [30, 60], rpe: [6, 8] },
        BLUE:  { sets: [8, 10],  contacts: [40, 70], rpe: [6, 8] },
        BLACK: { sets: [6, 8],   contacts: [30, 60], rpe: [7, 9] },
      },
    },
    rules: {
      prerequisites: [
        "SP_A completed at least once this week or adequate hinge competency",
        "Hamstring tolerance adequate (no soreness >3/10 from previous session)",
      ],
      regressions: [
        "Bilateral RDL before unilateral",
        "Reduce MEDIUM contacts → LONG only",
        "Remove contrast pairing — straight sets only",
      ],
      progressions: [
        "Progress to single-leg throughout",
        "Add Nordic curl as posterior chain anchor",
        "Increase deceleration specificity in contact selection",
      ],
      stopRules: [
        "Stop if hamstring recruitment feels asymmetric",
        "Stop if lumbar compensation noted on hinge",
        "Downshift to straight sets if quality drops on contrasts",
      ],
    },
  },
  {
    id: "JUMP_MBS",
    name: "Jump / Plyo / MBS Unit — Movement Skill + Elastic Qualities",
    type: "JUMP_PLYO_MBS",
    tags: ["speed", "elastic", "mbs", "reactive", "field"],
    plyoBandsUsed: ["SHORT_FAST", "MEDIUM"],
    doseGuidelines: {
      byBelt: {
        WHITE: { contacts: [30, 50], rpe: [5, 7] },
        BLUE:  { contacts: [40, 70], rpe: [6, 8] },
        BLACK: { contacts: [30, 55], rpe: [7, 9] },
      },
    },
    rules: {
      prerequisites: [
        "Movement quality acceptable at submax speed",
        "Adequate warm-up (10+ min activation)",
      ],
      regressions: [
        "Stepping MBS before stopping MBS",
        "Extended knee patterns before flexed/hinge patterns",
        "Reduce speed and direction complexity",
      ],
      progressions: [
        "Add directional change to contacts",
        "Progress from stepping to stopping patterns",
        "Increase velocity of approach",
        "Add reactive component (visual cue → response)",
      ],
      stopRules: [
        "Stop if landing mechanics deteriorate (valgus collapse, excessive trunk lean)",
        "Stop if output (height/distance) drops >15% from peak",
        "Downshift band if contacts sound 'heavy'",
      ],
    },
  },
  {
    id: "RUN_SPEED_TOUCH",
    name: "Running Unit — Speed Touch (Progressive Exposure)",
    type: "RUNNING",
    tags: ["speed", "exposure", "progressive", "accel", "decel"],
    doseGuidelines: {
      byBelt: {
        WHITE: { reps: [6, 12] },
        BLUE:  { reps: [6, 10] },
        BLACK: { reps: [4, 8] },
      },
      byWaveWeek: {
        1: { reps: [6, 12] },
        2: { reps: [6, 10] },
        3: { reps: [4, 8] },
      },
    },
    rules: {
      prerequisites: [
        "No acute pain flare",
        "Movement quality acceptable at submax exposures",
        "Adequate build-up volume before max-intent reps",
      ],
      regressions: [
        "Shorten distances",
        "Reduce reps",
        "Keep more submax build-ups (80% instead of 95%+)",
        "Increase recovery between exposures",
      ],
      progressions: [
        "Slightly increase exposure speed OR distance (not both in same week)",
        "Add deceleration demand at end of run",
        "Progress from linear to curved/COD patterns",
      ],
      stopRules: [
        "Stop if technique degrades (hip drop, arm cross, trunk rotation)",
        "Stop if discomfort escalates beyond 3/10",
        "Stop if athlete reports unusual tightness after reps",
      ],
    },
  },
  {
    id: "RUN_TEMPO",
    name: "Running Unit — Aerobic Base / Tempo",
    type: "RUNNING",
    tags: ["aerobic", "tempo", "base", "conditioning"],
    doseGuidelines: {
      byBelt: {
        WHITE: { reps: [6, 10], rpe: [5, 6] },
        BLUE:  { reps: [6, 10], rpe: [5, 6] },
        BLACK: { reps: [4, 8],  rpe: [5, 6] },
      },
    },
    rules: {
      prerequisites: ["No acute musculoskeletal issue", "Cleared for running load"],
      regressions: ["Reduce total volume by 25%", "Lower intensity (RPE 4–5 cap)"],
      progressions: ["Increase reps before distance", "Add slight incline"],
      stopRules: [
        "Stop if RPE spikes above 7 unexpectedly",
        "Stop if pain >2/10 emerges during run",
      ],
    },
  },
];

// ─── Weekly Plan Builder ──────────────────────────────────────────────────────

export function buildWeeklyPlan(
  meta: AthleteMeta,
  phase: Phase,
  waveWeek: WaveWeek
): WeeklyPlan {
  const { belt, reasons, modifiers } = classifyBelt(meta);
  let budgets = getWeeklyBudgets(belt, phase, waveWeek);
  let stageConstraints: StageConstraints | undefined;

  // Apply ACL stage overlay if present
  if (meta.injuryFlags.aclStage) {
    const { budgets: constrained, constraints } = applyStageConstraints(
      budgets,
      meta.injuryFlags.aclStage
    );
    budgets = constrained;
    stageConstraints = constraints;
  }

  // Determine allowed unit types
  const allowedTypes = stageConstraints
    ? stageConstraints.allowedUnitTypes
    : (["STRENGTH_PLYO", "JUMP_PLYO_MBS", "RUNNING"] as UnitType[]);

  // Select units based on availability + gym access + allowed types
  const units: TrainingUnit[] = [];

  if (meta.availability.gymAccess && allowedTypes.includes("STRENGTH_PLYO")) {
    units.push(UNIT_LIBRARY.find((u) => u.id === "SP_A")!);
    if (meta.availability.daysPerWeek >= 3) {
      units.push(UNIT_LIBRARY.find((u) => u.id === "SP_B")!);
    }
  }

  if (allowedTypes.includes("JUMP_PLYO_MBS") && meta.availability.daysPerWeek >= 2) {
    units.push(UNIT_LIBRARY.find((u) => u.id === "JUMP_MBS")!);
  }

  if (allowedTypes.includes("RUNNING")) {
    units.push(UNIT_LIBRARY.find((u) => u.id === "RUN_SPEED_TOUCH")!);
    if (meta.availability.daysPerWeek >= 4) {
      units.push(UNIT_LIBRARY.find((u) => u.id === "RUN_TEMPO")!);
    }
  }

  // Fallback: always have at least one running unit
  if (units.length === 0) {
    units.push(UNIT_LIBRARY.find((u) => u.id === "RUN_SPEED_TOUCH")!);
  }

  return {
    belt,
    beltReasons: reasons,
    beltModifiers: modifiers,
    phase,
    waveWeek,
    budgets,
    units,
    stageConstraints,
    globalStopRules: [
      "If quality fails: reduce volume/density before reducing intensity.",
      "Capacity work is conditional — only if deficits or history require it.",
      "Never add both speed and distance progression in the same week.",
      "Next-day soreness >4/10 or effusion = mandatory load reduction.",
    ],
  };
}
