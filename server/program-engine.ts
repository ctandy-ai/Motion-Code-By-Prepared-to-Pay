import { AthleteTrainingProfile, AthleteBeltClassification, DoseBudget, StageOverlay } from "@shared/schema";

export type Belt = "WHITE" | "BLUE" | "BLACK";
export type Phase = 
  | "PRESEASON_A" | "XMAS_BLOCK" | "PRESEASON_B" | "PRECOMP"
  | "INSEASON_EARLY" | "INSEASON_MID" | "INSEASON_LATE" | "BYE_WEEK";
export type WaveWeek = 1 | 2 | 3;
export type PlyoBand = "SHORT_FAST" | "MEDIUM" | "LONG";

export interface WeeklyBudgets {
  plyoContacts: number;
  hardLowerSets: number;
  speedTouches: number;
}

export interface BeltClassificationResult {
  belt: Belt;
  score: number;
  confidence: number;
  reasons: string[];
  modifiers: string[];
}

export interface EngineGuidance {
  belt: Belt;
  beltReasons: string[];
  modifiers: string[];
  phase: Phase;
  waveWeek: WaveWeek;
  budgets: WeeklyBudgets;
  sessionCaps: {
    plyoContactsPerSession: number;
    hardLowerSetsPerSession: number;
  };
  stageConstraints: {
    active: boolean;
    stageName?: string;
    allowedPlyoBands: PlyoBand[];
    maxPlyoContactsWeek?: number;
    stopRules: string[];
    requiredExerciseTypes: string[];
    forbiddenExerciseTypes: string[];
  };
  globalStopRules: string[];
  warnings: string[];
  recommendations: string[];
}

const BASE_BUDGETS: Record<Belt, WeeklyBudgets> = {
  WHITE: { plyoContacts: 110, hardLowerSets: 16, speedTouches: 1 },
  BLUE:  { plyoContacts: 140, hardLowerSets: 14, speedTouches: 1 },
  BLACK: { plyoContacts: 110, hardLowerSets: 10, speedTouches: 1 },
};

const PHASE_FACTORS: Record<Phase, { plyo: number; sets: number; speed: number }> = {
  PRESEASON_A:    { plyo: 1.05, sets: 1.10, speed: 1.0 },
  XMAS_BLOCK:     { plyo: 0.75, sets: 0.75, speed: 1.0 },
  PRESEASON_B:    { plyo: 1.00, sets: 0.95, speed: 1.2 },
  PRECOMP:        { plyo: 0.85, sets: 0.85, speed: 1.2 },
  INSEASON_EARLY: { plyo: 0.80, sets: 0.80, speed: 1.0 },
  INSEASON_MID:   { plyo: 0.80, sets: 0.80, speed: 1.0 },
  INSEASON_LATE:  { plyo: 0.70, sets: 0.70, speed: 1.0 },
  BYE_WEEK:       { plyo: 0.90, sets: 0.90, speed: 1.1 },
};

const WAVE_FACTORS: Record<WaveWeek, number> = { 1: 1.0, 2: 0.95, 3: 0.75 };

export function classifyBelt(profile: AthleteTrainingProfile | null): BeltClassificationResult {
  const reasons: string[] = [];
  const modifiers: string[] = [];
  let score = 0;

  if (!profile) {
    return {
      belt: "WHITE",
      score: 0,
      confidence: 50,
      reasons: ["No training profile available - defaulting to WHITE"],
      modifiers: [],
    };
  }

  if ((profile.trainingAgeYears || 0) >= 3) {
    score += 2;
    reasons.push("3+ years training age");
  } else if ((profile.trainingAgeYears || 0) >= 1) {
    score += 1;
    reasons.push("1-3 years training age");
  } else {
    reasons.push("Low training age (<1 year)");
  }

  const movementScore = profile.movementQualityScore || 3;
  if (movementScore >= 4) {
    score += 2;
    reasons.push("High movement quality (4-5)");
  } else if (movementScore === 3) {
    score += 1;
    reasons.push("Moderate movement quality (3)");
  } else {
    reasons.push("Movement quality needs improvement (1-2)");
  }

  if (profile.recentRTP) {
    score -= 2;
    reasons.push("Recent RTP: cap reactive intensity/volume");
    modifiers.push("CAP_REACTIVE_CONTACTS");
  }
  
  if (profile.recurrentHamstring || profile.recurrentCalf || profile.recurrentGroin) {
    score -= 1;
    modifiers.push("EXPOSURE_PROGRESSIONS_REQUIRED");
    if (profile.recurrentHamstring) reasons.push("Recurrent hamstring history");
    if (profile.recurrentCalf) reasons.push("Recurrent calf history");
    if (profile.recurrentGroin) reasons.push("Recurrent groin history");
  }

  if ((profile.sprintExposuresLast14d || 0) === 0) {
    modifiers.push("REINTRO_SPEED_PROGRESSIVELY");
    reasons.push("No sprint exposures in last 14 days");
  }

  let belt: Belt = "WHITE";
  if (score >= 3) belt = "BLACK";
  else if (score >= 2) belt = "BLUE";

  const confidence = Math.min(100, Math.max(50, 60 + (score * 10)));

  return { belt, score, confidence, reasons, modifiers };
}

export function calculateWeeklyBudgets(
  belt: Belt, 
  phase: Phase, 
  waveWeek: WaveWeek
): WeeklyBudgets {
  const base = BASE_BUDGETS[belt];
  const phaseFactor = PHASE_FACTORS[phase];
  const waveFactor = WAVE_FACTORS[waveWeek];

  return {
    plyoContacts: Math.round(base.plyoContacts * phaseFactor.plyo * waveFactor),
    hardLowerSets: Math.round(base.hardLowerSets * phaseFactor.sets * waveFactor),
    speedTouches: Math.max(1, Math.round(base.speedTouches * phaseFactor.speed)),
  };
}

export function applyStageConstraints(
  budgets: WeeklyBudgets, 
  stage: StageOverlay | null
): WeeklyBudgets {
  if (!stage) return budgets;

  return {
    plyoContacts: stage.maxPlyoContactsWeek 
      ? Math.min(budgets.plyoContacts, stage.maxPlyoContactsWeek) 
      : budgets.plyoContacts,
    hardLowerSets: budgets.hardLowerSets,
    speedTouches: stage.maxSpeedExposures 
      ? Math.min(budgets.speedTouches, stage.maxSpeedExposures) 
      : budgets.speedTouches,
  };
}

export function generateEngineGuidance(
  profile: AthleteTrainingProfile | null,
  existingClassification: AthleteBeltClassification | null,
  phase: Phase,
  waveWeek: WaveWeek,
  stageOverlay: StageOverlay | null,
  trainingDaysPerWeek: number = 3
): EngineGuidance {
  const beltResult = existingClassification?.isOverridden 
    ? { 
        belt: existingClassification.belt as Belt, 
        score: existingClassification.score, 
        confidence: existingClassification.confidence,
        reasons: existingClassification.reasons || [],
        modifiers: [] 
      }
    : classifyBelt(profile);

  const baseBudgets = calculateWeeklyBudgets(beltResult.belt, phase, waveWeek);
  const adjustedBudgets = applyStageConstraints(baseBudgets, stageOverlay);

  const sessionCaps = {
    plyoContactsPerSession: Math.round(adjustedBudgets.plyoContacts / trainingDaysPerWeek),
    hardLowerSetsPerSession: Math.round(adjustedBudgets.hardLowerSets / trainingDaysPerWeek),
  };

  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (beltResult.modifiers.includes("CAP_REACTIVE_CONTACTS")) {
    warnings.push("RTP athlete: reduce reactive/plyometric intensity");
    recommendations.push("Focus on bilateral exercises before progressing to unilateral");
  }

  if (beltResult.modifiers.includes("REINTRO_SPEED_PROGRESSIVELY")) {
    warnings.push("No recent speed exposure: reintroduce progressively");
    recommendations.push("Start with submax build-ups before high-intensity speed work");
  }

  if (beltResult.modifiers.includes("EXPOSURE_PROGRESSIONS_REQUIRED")) {
    warnings.push("Injury history: follow exposure progressions carefully");
  }

  if (waveWeek === 3) {
    recommendations.push("Week 3 deload: reduce volume by ~25%, maintain intensity");
  }

  const stageConstraints = {
    active: !!stageOverlay,
    stageName: stageOverlay?.name,
    allowedPlyoBands: (stageOverlay?.allowedPlyoBands || ["SHORT_FAST", "MEDIUM", "LONG"]) as PlyoBand[],
    maxPlyoContactsWeek: stageOverlay?.maxPlyoContactsWeek || undefined,
    stopRules: stageOverlay?.stopRules || [],
    requiredExerciseTypes: stageOverlay?.requiredExerciseTypes || [],
    forbiddenExerciseTypes: stageOverlay?.forbiddenExerciseTypes || [],
  };

  const globalStopRules = [
    "If quality fails: reduce volume/density before reducing intensity",
    "Stop/downshift if contacts become noisy/slow or quality fails",
    "Capacity work is conditional, not blanket - only if data indicates it's a limiter",
    "Stop sets if intent drops or technique compensates",
  ];

  return {
    belt: beltResult.belt,
    beltReasons: beltResult.reasons,
    modifiers: beltResult.modifiers,
    phase,
    waveWeek,
    budgets: adjustedBudgets,
    sessionCaps,
    stageConstraints,
    globalStopRules,
    warnings,
    recommendations,
  };
}

export function validateBlockAgainstBudgets(
  blockPlyoContacts: number,
  blockHardSets: number,
  sessionCaps: { plyoContactsPerSession: number; hardLowerSetsPerSession: number },
  warnings: string[]
): string[] {
  const blockWarnings = [...warnings];

  if (blockPlyoContacts > sessionCaps.plyoContactsPerSession * 1.1) {
    blockWarnings.push(
      `Plyo contacts (${blockPlyoContacts}) exceed session cap (${sessionCaps.plyoContactsPerSession})`
    );
  }

  if (blockHardSets > sessionCaps.hardLowerSetsPerSession * 1.1) {
    blockWarnings.push(
      `Hard lower sets (${blockHardSets}) exceed session cap (${sessionCaps.hardLowerSetsPerSession})`
    );
  }

  return blockWarnings;
}

export const PHASE_OPTIONS: { value: Phase; label: string }[] = [
  { value: "PRESEASON_A", label: "Pre-Season A (Build)" },
  { value: "XMAS_BLOCK", label: "Xmas Block (Maintain)" },
  { value: "PRESEASON_B", label: "Pre-Season B (Build)" },
  { value: "PRECOMP", label: "Pre-Competition" },
  { value: "INSEASON_EARLY", label: "In-Season Early" },
  { value: "INSEASON_MID", label: "In-Season Mid" },
  { value: "INSEASON_LATE", label: "In-Season Late" },
  { value: "BYE_WEEK", label: "Bye Week" },
];

export const WAVE_WEEK_OPTIONS: { value: WaveWeek; label: string; description: string }[] = [
  { value: 1, label: "Week 1", description: "Build: establish baseline volume" },
  { value: 2, label: "Week 2", description: "Intensify: slight reduction, higher intent" },
  { value: 3, label: "Week 3", description: "Express/Deload: reduced volume, peak quality" },
];
