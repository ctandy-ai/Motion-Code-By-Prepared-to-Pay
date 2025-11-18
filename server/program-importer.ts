import Papa from 'papaparse';
import { readFileSync } from 'fs';
import { join } from 'path';

interface ProgramWeekCSV {
  Week: string;
  Phase: string;
  Belt_Target: string;
  Focus: string;
  Running_Qualities: string;
  MBS_Primary: string;
  Strength_Theme: string;
  Plyo_Contacts_Cap: string;
  Testing_Gateway: string;
  Notes: string;
}

interface ParsedPhase {
  name: string;
  type: string;
  startWeek: number;
  endWeek: number;
  goals: string;
  weeks: ParsedWeek[];
}

interface ParsedWeek {
  weekNumber: number;
  beltTarget: string;
  focus: string;
  runningQualities: string;
  mbsPrimary: string;
  strengthTheme: string;
  plyoContactsCap: number;
  testingGateway: string;
  notes: string;
}

export interface ParsedProgram {
  phases: ParsedPhase[];
  totalWeeks: number;
}

export function parseCSVProgram(csvPath: string): ParsedProgram {
  const csvContent = readFileSync(csvPath, 'utf-8');
  const parsed = Papa.parse<ProgramWeekCSV>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  const weeks: ParsedWeek[] = parsed.data.map((row) => ({
    weekNumber: parseInt(row.Week),
    beltTarget: row.Belt_Target,
    focus: row.Focus,
    runningQualities: row.Running_Qualities,
    mbsPrimary: row.MBS_Primary,
    strengthTheme: row.Strength_Theme,
    plyoContactsCap: parseInt(row.Plyo_Contacts_Cap),
    testingGateway: row.Testing_Gateway,
    notes: row.Notes,
  }));

  const phases: ParsedPhase[] = [];
  let currentPhase: ParsedPhase | null = null;

  weeks.forEach((week, index) => {
    const csvRow = parsed.data[index];
    const phaseName = csvRow.Phase;

    if (!currentPhase || currentPhase.name !== phaseName) {
      if (currentPhase) {
        phases.push(currentPhase);
      }

      const phaseType = extractPhaseType(phaseName);
      const goals = extractPhaseGoals(phaseName);

      currentPhase = {
        name: phaseName,
        type: phaseType,
        startWeek: week.weekNumber,
        endWeek: week.weekNumber,
        goals,
        weeks: [],
      };
    }

    currentPhase.endWeek = week.weekNumber;
    currentPhase.weeks.push(week);
  });

  if (currentPhase) {
    phases.push(currentPhase);
  }

  return {
    phases,
    totalWeeks: weeks.length,
  };
}

function extractPhaseType(phaseName: string): string {
  if (phaseName.includes('GPP') || phaseName.includes('Base')) return 'base';
  if (phaseName.includes('SPP-1') || phaseName.includes('Build')) return 'build';
  if (phaseName.includes('SPP-2') || phaseName.includes('Specific')) return 'peak';
  if (phaseName.includes('In-Season')) return 'competition';
  if (phaseName.includes('Performance') || phaseName.includes('Maintain')) return 'recovery';
  return 'base';
}

function extractPhaseGoals(phaseName: string): string {
  const goalMap: Record<string, string> = {
    'GPP-1 (Base)': 'Build aerobic base, teach fundamental movement patterns, develop anatomical adaptation',
    'SPP-1 (Build)': 'Develop reactive strength, introduce max velocity exposure, improve deceleration quality',
    'SPP-2 (Specific)': 'Integrate speed and COD, emphasize elastic qualities, develop race-pace MAS',
    'Cyclical In-Season / Performance': 'Maintain performance qualities, manage fatigue, address asymmetries',
    'Performance (Maintain)': 'Sustain peak performance, prioritize freshness, maintain speed and power exposures',
  };

  return goalMap[phaseName] || 'Achieve optimal performance for this phase';
}

export function getDefaultProgramCSVPath(): string {
  return join(process.cwd(), 'attached_assets', 'stridecode_12m_athlete_program_1762511479489.csv');
}
