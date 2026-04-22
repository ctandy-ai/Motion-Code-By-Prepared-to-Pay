import { db } from "../db";
import { exercises, athleteProfiles } from "@shared/schema";
import { eq, inArray, and } from "drizzle-orm";
import type { AthleteProfile, Exercise } from "@shared/schema";

export const BELT_THRESHOLDS = {
  white: { min: 0, max: 9 },
  blue: { min: 10, max: 29 },
  black: { min: 30, max: Infinity },
};

export function getBeltFromSessions(totalSessions: number): "white" | "blue" | "black" {
  if (totalSessions >= 30) return "black";
  if (totalSessions >= 10) return "blue";
  return "white";
}

export function getBeltProgress(totalSessions: number): number {
  if (totalSessions >= 30) return 100;
  if (totalSessions >= 10) return Math.round(((totalSessions - 10) / 20) * 100);
  return Math.round((totalSessions / 10) * 100);
}

// Movement pillar priorities per sport + position
const POSITION_PILLAR_MAP: Record<string, Record<string, string[]>> = {
  netball: {
    "Goal Shooter": ["acceleration", "deceleration", "top-speed", "change-direction"],
    "Goal Attack": ["acceleration", "change-direction", "deceleration", "top-speed"],
    "Wing Attack": ["acceleration", "change-direction", "deceleration", "top-speed"],
    "Centre": ["change-direction", "deceleration", "acceleration", "top-speed"],
    "Wing Defence": ["change-direction", "deceleration", "top-speed", "acceleration"],
    "Goal Defence": ["deceleration", "change-direction", "acceleration", "top-speed"],
    "Goal Keeper": ["deceleration", "change-direction", "acceleration", "top-speed"],
    default: ["acceleration", "deceleration", "change-direction", "top-speed"],
  },
  afl: {
    "Forward": ["acceleration", "top-speed", "change-direction", "deceleration"],
    "Midfielder": ["top-speed", "acceleration", "change-direction", "deceleration"],
    "Defender": ["deceleration", "change-direction", "acceleration", "top-speed"],
    "Ruck": ["deceleration", "acceleration", "change-direction", "top-speed"],
    default: ["acceleration", "change-direction", "top-speed", "deceleration"],
  },
  basketball: {
    default: ["acceleration", "change-direction", "deceleration", "top-speed"],
  },
  soccer: {
    "Forward": ["acceleration", "top-speed", "change-direction", "deceleration"],
    "Midfielder": ["top-speed", "acceleration", "change-direction", "deceleration"],
    "Defender": ["deceleration", "change-direction", "acceleration", "top-speed"],
    "Goalkeeper": ["deceleration", "acceleration", "change-direction", "top-speed"],
    default: ["acceleration", "change-direction", "top-speed", "deceleration"],
  },
  default: {
    default: ["acceleration", "deceleration", "change-direction", "top-speed"],
  },
};

// Duration per playing level
const DURATION_MAP: Record<string, number> = {
  community: 10,
  club: 15,
  representative: 20,
  elite: 25,
  default: 15,
};

// Pillar display config
export const PILLAR_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  "acceleration": { label: "Acceleration", color: "text-green-400", bgColor: "bg-green-500/20", borderColor: "border-green-500/40" },
  "deceleration": { label: "Deceleration", color: "text-blue-400", bgColor: "bg-blue-500/20", borderColor: "border-blue-500/40" },
  "change-direction": { label: "Change of Direction", color: "text-yellow-400", bgColor: "bg-yellow-500/20", borderColor: "border-yellow-500/40" },
  "top-speed": { label: "Top-Speed Running", color: "text-red-400", bgColor: "bg-red-500/20", borderColor: "border-red-500/40" },
};

// Static "Why this works" text per sport + position
export const WHY_IT_WORKS: Record<string, Record<string, string>> = {
  netball: {
    "Goal Shooter": "As a Goal Shooter, your performance depends on creating space with sharp acceleration bursts and holding your ground under defensive pressure. These exercises build the reactive leg power and deceleration control that make you dangerous in the circle and resilient through four quarters.",
    "Goal Attack": "As a Goal Attack, you need explosive acceleration to beat defenders to the ball and precise stopping power to create shooting opportunities. This program builds the lower-limb strength and tendon stiffness that drives repeated short sprints and change-of-direction throughout a full game.",
    "Wing Attack": "As a Wing Attack in netball, your performance depends on repeated short accelerations and changes of direction. These exercises build the leg power and tendon stiffness that drive those movements — making you faster off the mark and more resilient through a full game.",
    "Centre": "As a Centre, you cover more ground than any other position. This program prioritises your ability to change direction under fatigue, decelerate quickly, and re-accelerate repeatedly — the movement qualities that let you dominate centre court for four quarters.",
    "Wing Defence": "As a Wing Defence, your value comes from your ability to intercept and apply pressure. This program builds reactive change-of-direction speed and the hip and ankle stability that lets you mirror your opponent and recover quickly between efforts.",
    "Goal Defence": "As a Goal Defence, you need to shut down attackers and create turnovers. This program prioritises deceleration control and reactive strength — the qualities that let you time your intercepts, absorb contact, and drive back into attack.",
    "Goal Keeper": "As a Goal Keeper, your defensive impact comes from your ability to read the game and react explosively. This program builds the landing mechanics, deceleration strength, and reactive power that reduce your injury risk and make you a dominant last line of defence.",
  },
  afl: {
    "Forward": "As a Forward, your performance depends on explosive acceleration to create separation and the speed to convert those leads into scoring opportunities. This program builds the leg power and tendon reactivity that make you dangerous deep in attack.",
    "Midfielder": "As a Midfielder, you cover the most ground in the game across four quarters. This program prioritises your top-speed running mechanics and repeated sprint capacity — building the engine that keeps you competitive at the highest intensity late in games.",
    "Defender": "As a Defender, shutting down forwards requires elite deceleration, anticipation, and change-of-direction speed. This program builds the landing mechanics and hip stability that reduce your ACL risk while making you a more effective defender.",
    "Ruck": "As a Ruck, your performance depends on explosive vertical power and your ability to compete physically for four quarters. This program prioritises lower-limb strength and reactive power — the foundation of dominant contest work.",
  },
  basketball: {
    default: "In basketball, your performance depends on explosive first-step acceleration and the ability to change direction at high speed. This program builds the leg power, ankle stability, and deceleration control that make you more dangerous with the ball and more resilient over a long season.",
  },
  soccer: {
    "Forward": "As a forward, your threat comes from explosive acceleration and the ability to beat defenders to the ball. This program builds the reactive leg power and tendon stiffness that makes you genuinely difficult to defend in behind.",
    "Midfielder": "As a midfielder, you need to sustain high-quality movement over 90 minutes. This program builds the top-speed mechanics and repeated sprint capacity that keep you running strong from the first minute to the last.",
    "Defender": "As a defender, controlling attackers requires precise deceleration and reactive change-of-direction. This program prioritises landing mechanics and hip stability — reducing your injury risk while making your defensive work more effective.",
    "Goalkeeper": "As a goalkeeper, explosive lateral movement and the ability to decelerate quickly are your core physical tools. This program builds the reactive strength and change-of-direction capacity that underpin dominant goalkeeping.",
  },
};

// Day-of-week labels
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface BlueprintDay {
  dayOfWeek: string;
  dayIndex: number;
  isRestDay: boolean;
  pillar?: string;
  pillarLabel?: string;
  pillarColor?: string;
  pillarBg?: string;
  pillarBorder?: string;
  focus?: string;
  duration?: number;
  beltLevel?: string;
  exercises: BlueprintExercise[];
}

export interface BlueprintExercise {
  id: number;
  name: string;
  description: string;
  beltLevel: string;
  setsRange?: string | null;
  repsRange?: string | null;
  restPeriod?: string | null;
  coachingCues: string[];
  whyItWorks?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  isLocked: boolean;
}

export async function generateBlueprint(
  profile: AthleteProfile,
  subscriptionTier: string
): Promise<BlueprintDay[]> {
  const sport = profile.sport || "general";
  const position = profile.position || "default";
  const trainingFrequency = profile.trainingFrequency || 3;
  const playingLevel = profile.playingLevel || "club";
  const injuryHistory = profile.injuryHistory || [];
  const totalSessions = profile.totalSessionsCompleted || 0;
  const belt = getBeltFromSessions(totalSessions);
  const duration = DURATION_MAP[playingLevel] || DURATION_MAP.default;

  // Get pillar priority for this sport + position
  const sportMap = POSITION_PILLAR_MAP[sport] || POSITION_PILLAR_MAP.default;
  let pillars = sportMap[position] || sportMap.default || POSITION_PILLAR_MAP.default.default;

  // Adjust for ACL injury history — push deceleration + change-direction to top
  if (injuryHistory.includes("ACL") || injuryHistory.includes("knee")) {
    pillars = ["deceleration", "change-direction", ...pillars.filter(p => p !== "deceleration" && p !== "change-direction")];
  }

  // Distribute session days evenly across the week
  const sessionDayIndices = getSessionDayIndices(trainingFrequency);

  // Load exercises for this belt level
  const allExercises = await db
    .select()
    .from(exercises)
    .where(eq(exercises.beltLevel, belt));

  const blueprint: BlueprintDay[] = [];

  let pillarCursor = 0;
  for (let i = 0; i < 7; i++) {
    const isSessionDay = sessionDayIndices.includes(i);

    if (!isSessionDay) {
      blueprint.push({
        dayOfWeek: DAYS[i],
        dayIndex: i,
        isRestDay: true,
        exercises: [],
      });
      continue;
    }

    const pillar = pillars[pillarCursor % pillars.length];
    pillarCursor++;
    const config = PILLAR_CONFIG[pillar];

    // Get exercises for this pillar (component)
    const pillarExercises = allExercises.filter(e => e.component === pillar);
    const shuffled = [...pillarExercises].sort(() => Math.random() - 0.5).slice(0, 5);

    const blueprintExercises: BlueprintExercise[] = shuffled.map((ex, idx) => ({
      id: ex.id,
      name: ex.name,
      description: ex.description,
      beltLevel: ex.beltLevel,
      setsRange: ex.setsRange,
      repsRange: ex.repsRange,
      restPeriod: ex.restPeriod,
      coachingCues: ex.coachingCues || [],
      whyItWorks: ex.whyItWorks,
      videoUrl: ex.videoUrl,
      thumbnailUrl: ex.thumbnailUrl,
      isLocked: subscriptionTier === "starter" && idx >= 2,
    }));

    blueprint.push({
      dayOfWeek: DAYS[i],
      dayIndex: i,
      isRestDay: false,
      pillar,
      pillarLabel: config?.label || pillar,
      pillarColor: config?.color || "text-white",
      pillarBg: config?.bgColor || "bg-white/10",
      pillarBorder: config?.borderColor || "border-white/20",
      focus: `${config?.label || pillar} Training`,
      duration,
      beltLevel: belt,
      exercises: blueprintExercises,
    });
  }

  return blueprint;
}

function getSessionDayIndices(frequency: number): number[] {
  const patterns: Record<number, number[]> = {
    1: [1],          // Tuesday
    2: [1, 4],       // Tue, Fri
    3: [1, 3, 5],    // Tue, Thu, Sat
    4: [0, 2, 4, 6], // Mon, Wed, Fri, Sun
    5: [0, 1, 3, 4, 5], // Mon, Tue, Thu, Fri, Sat
    6: [0, 1, 2, 3, 4, 5], // Mon–Sat
    7: [0, 1, 2, 3, 4, 5, 6],
  };
  return patterns[Math.min(frequency, 7)] || patterns[3];
}

export function getWhyItWorks(sport: string, position: string): string {
  const sportMap = WHY_IT_WORKS[sport] || {};
  return sportMap[position] || sportMap.default || 
    "This program is built around the movement demands of your sport — developing the speed, strength, and resilience that matter when it counts.";
}

// ── PROGRAM ENGINE EXPORTS ────────────────────────────────────────────────────

export const PHASE_OPTIONS = [
  { value: "PRESEASON_A", label: "Pre-Season A (Build)" },
  { value: "XMAS_BLOCK", label: "Xmas Block (Maintain)" },
  { value: "PRESEASON_B", label: "Pre-Season B (Build)" },
  { value: "PRECOMP", label: "Pre-Competition" },
  { value: "INSEASON_EARLY", label: "In-Season Early" },
  { value: "INSEASON_MID", label: "In-Season Mid" },
  { value: "INSEASON_LATE", label: "In-Season Late" },
  { value: "BYE_WEEK", label: "Bye Week" },
];

export const WAVE_WEEK_OPTIONS = [
  { value: 1, label: "Week 1", description: "Build — establish baseline volume" },
  { value: 2, label: "Week 2", description: "Intensify — slight reduction, higher intent" },
  { value: 3, label: "Week 3", description: "Express/Deload — reduced volume, peak quality" },
];

export type Phase = "PRESEASON_A" | "XMAS_BLOCK" | "PRESEASON_B" | "PRECOMP" | "INSEASON_EARLY" | "INSEASON_MID" | "INSEASON_LATE" | "BYE_WEEK";
export type WaveWeek = 1 | 2 | 3;

const BASE_BUDGETS = {
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

export function getPhaseBudget(belt: "WHITE" | "BLUE" | "BLACK", phase: Phase, waveWeek: WaveWeek) {
  const base = BASE_BUDGETS[belt];
  const pf = PHASE_FACTORS[phase];
  const wf = WAVE_FACTORS[waveWeek];
  return {
    plyoContacts: Math.round(base.plyoContacts * pf.plyo * wf),
    hardLowerSets: Math.round(base.hardLowerSets * pf.sets * wf),
    speedTouches: Math.round(base.speedTouches * pf.speed),
  };
}
