import type { 
  Belt, Phase, WaveWeek,
  AthleteTrainingProfile, 
  AthleteBeltClassification,
  InsertAthleteBeltClassification,
  DoseBudget,
  InsertDoseBudget,
} from "@shared/schema";

export interface BeltDecision {
  belt: Belt;
  score: number;
  confidence: number;
  reasons: string[];
  modifiers: {
    needsCapacityWork: boolean;
    capReactiveContacts: boolean;
    capStrengthVolume: boolean;
    needsTopUps: boolean;
  };
}

export interface KeyTests {
  cmjHeightCm?: number;
  rsiDropJump?: number;
  hopLSIPct?: number;
  movementQualityScore?: number;
}

export interface AthleteMeta {
  trainingAgeYears: number;
  injuryFlags: {
    recurrentHamstring: boolean;
    recurrentCalf: boolean;
    recurrentGroin: boolean;
    recentRTP: boolean;
  };
  recentExposure: {
    sprintExposuresLast14d: number;
    highDecelSessionsLast14d: number;
    strengthSessionsLast7d: number;
  };
}

export function classifyBelt(meta: AthleteMeta, tests: KeyTests): BeltDecision {
  const reasons: string[] = [];
  let score = 0;

  const mq = tests.movementQualityScore ?? 3;
  if (mq >= 4) score += 25;
  else if (mq === 3) score += 10;
  else {
    score -= 10;
    reasons.push("Movement quality not stable at speed");
  }

  if (meta.trainingAgeYears >= 3) score += 25;
  else if (meta.trainingAgeYears >= 1) score += 10;
  else {
    score -= 10;
    reasons.push("Low training age");
  }

  if (tests.rsiDropJump != null) {
    if (tests.rsiDropJump >= 2.0) score += 25;
    else if (tests.rsiDropJump >= 1.5) score += 10;
    else {
      score -= 5;
      reasons.push("Reactive strength not yet expressed");
    }
  }

  if (tests.hopLSIPct != null) {
    if (tests.hopLSIPct >= 95) score += 10;
    else if (tests.hopLSIPct >= 90) score += 5;
    else reasons.push("Asymmetry present; progress exposure carefully");
  }

  const flags = meta.injuryFlags;
  if (flags.recentRTP) {
    score -= 15;
    reasons.push("Recent RTP: manage reactive volume and exposures");
  }
  if (flags.recurrentHamstring || flags.recurrentCalf || flags.recurrentGroin) {
    score -= 10;
    reasons.push("Recurrent injury flags: enforce exposure progression and caps");
  }

  if (meta.recentExposure.sprintExposuresLast14d === 0) {
    reasons.push("No recent sprint exposure: progressive speed reintroduction required");
  }

  let belt: Belt;
  if (score >= 60) belt = "BLACK";
  else if (score >= 30) belt = "BLUE";
  else belt = "WHITE";

  const needsCapacityWork =
    flags.recurrentCalf || flags.recurrentHamstring || flags.recurrentGroin || flags.recentRTP;

  const capReactiveContacts = belt === "WHITE" || flags.recentRTP || mq <= 3;
  const capStrengthVolume = flags.recentRTP;
  const needsTopUps = meta.recentExposure.strengthSessionsLast7d < 1;

  const confidence = Math.max(0, Math.min(100, 50 + score));

  return {
    belt,
    score,
    confidence,
    reasons,
    modifiers: { needsCapacityWork, capReactiveContacts, capStrengthVolume, needsTopUps },
  };
}

function waveMultiplier(w: WaveWeek): number {
  if (w === 1) return 1.0;
  if (w === 2) return 0.95;
  return 0.75;
}

export function getDoseBudget(belt: Belt, phase: Phase, week: WaveWeek): Omit<InsertDoseBudget, 'belt' | 'phase' | 'waveWeek'> & { belt: Belt; phase: Phase; waveWeek: WaveWeek } {
  const base = (() => {
    switch (belt) {
      case "WHITE":
        return { plyoContactsWeek: 110, hardLowerSetsWeek: 16, speedExposureTouchesWeek: 1 };
      case "BLUE":
        return { plyoContactsWeek: 140, hardLowerSetsWeek: 14, speedExposureTouchesWeek: 1 };
      case "BLACK":
        return { plyoContactsWeek: 110, hardLowerSetsWeek: 10, speedExposureTouchesWeek: 1 };
    }
  })();

  const phaseFactor = (() => {
    switch (phase) {
      case "PRESEASON_A":
        return { plyo: 1.05, sets: 1.10, speed: 1.0 };
      case "XMAS_BLOCK":
        return { plyo: 0.75, sets: 0.75, speed: 1.0 };
      case "PRESEASON_B":
        return { plyo: 1.0, sets: 0.95, speed: 1.2 };
      case "PRECOMP":
        return { plyo: 0.85, sets: 0.85, speed: 1.2 };
      case "INSEASON_EARLY":
      case "INSEASON_MID":
        return { plyo: 0.80, sets: 0.80, speed: 1.0 };
      case "INSEASON_LATE":
        return { plyo: 0.70, sets: 0.70, speed: 1.0 };
      case "BYE_WEEK":
        return { plyo: 0.90, sets: 0.90, speed: 1.1 };
      case "TRANSITION":
      default:
        return { plyo: 0.70, sets: 0.75, speed: 1.0 };
    }
  })();

  const wMult = waveMultiplier(week);

  const plyoContactsWeek = Math.round(base.plyoContactsWeek * phaseFactor.plyo * wMult);
  const hardLowerSetsWeek = Math.round(base.hardLowerSetsWeek * phaseFactor.sets * wMult);
  const speedExposureTouchesWeek = Math.max(
    1,
    Math.round(base.speedExposureTouchesWeek * phaseFactor.speed)
  );

  return { belt, phase, waveWeek: week, plyoContactsWeek, hardLowerSetsWeek, speedExposureTouchesWeek };
}

export function profileToMeta(profile: AthleteTrainingProfile | null): AthleteMeta {
  if (!profile) {
    return {
      trainingAgeYears: 0,
      injuryFlags: {
        recurrentHamstring: false,
        recurrentCalf: false,
        recurrentGroin: false,
        recentRTP: false,
      },
      recentExposure: {
        sprintExposuresLast14d: 0,
        highDecelSessionsLast14d: 0,
        strengthSessionsLast7d: 0,
      },
    };
  }

  return {
    trainingAgeYears: profile.trainingAgeYears ?? 0,
    injuryFlags: {
      recurrentHamstring: !!profile.recurrentHamstring,
      recurrentCalf: !!profile.recurrentCalf,
      recurrentGroin: !!profile.recurrentGroin,
      recentRTP: !!profile.recentRTP,
    },
    recentExposure: {
      sprintExposuresLast14d: profile.sprintExposuresLast14d ?? 0,
      highDecelSessionsLast14d: profile.highDecelSessionsLast14d ?? 0,
      strengthSessionsLast7d: profile.strengthSessionsLast7d ?? 0,
    },
  };
}

export function extractTestMetrics(valdTests: Array<{ testType: string; results: Array<{ metricName: string; metricValue: number }> }>): KeyTests {
  const tests: KeyTests = {};

  for (const test of valdTests) {
    const testTypeLower = (test.testType || '').toLowerCase();
    
    for (const result of test.results || []) {
      const metricLower = (result.metricName || '').toLowerCase();
      
      if (metricLower.includes('jump height') || metricLower.includes('cmj height')) {
        if (!tests.cmjHeightCm || result.metricValue > tests.cmjHeightCm) {
          tests.cmjHeightCm = result.metricValue;
        }
      }
      
      if (metricLower.includes('rsi') || metricLower.includes('reactive strength')) {
        if (!tests.rsiDropJump || result.metricValue > tests.rsiDropJump) {
          tests.rsiDropJump = result.metricValue;
        }
      }
      
      if (metricLower.includes('lsi') || metricLower.includes('limb symmetry')) {
        if (!tests.hopLSIPct || result.metricValue < tests.hopLSIPct) {
          tests.hopLSIPct = result.metricValue;
        }
      }
    }
  }

  return tests;
}

export function decisionToInsert(athleteId: string, decision: BeltDecision): InsertAthleteBeltClassification {
  return {
    athleteId,
    belt: decision.belt,
    score: decision.score,
    confidence: decision.confidence,
    reasons: decision.reasons,
    needsCapacityWork: decision.modifiers.needsCapacityWork ? 1 : 0,
    capReactiveContacts: decision.modifiers.capReactiveContacts ? 1 : 0,
    capStrengthVolume: decision.modifiers.capStrengthVolume ? 1 : 0,
    needsTopUps: decision.modifiers.needsTopUps ? 1 : 0,
    isOverridden: 0,
  };
}
