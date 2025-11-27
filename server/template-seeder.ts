import { readFileSync } from 'fs';
import { db } from './db';
import { 
  exercises, 
  programTemplates, 
  templatePhases, 
  templateWeeks, 
  templateTrainingBlocks,
  templateTrainingBlockExercises 
} from '../shared/schema';
import { eq } from 'drizzle-orm';

interface MasterExercise {
  id: string;
  name: string;
  tracking: string;
  tags: string;
  attributes: string;
  variables_default: {
    sets: number;
    reps: string;
    intensity: string;
  };
  belt_min: string;
  belt_max: string;
  notes: string;
}

interface TemplateConfig {
  name: string;
  pathway: 'ACL' | 'Hams' | 'Perf' | 'Fallback';
  phase: 'P1' | 'P2' | 'P3' | 'P4' | 'Special';
  level: 'White' | 'Blue' | 'Black';
  environment: 'Home' | 'Gym' | 'Field+Gym' | 'InSeason';
  frequency: '2x' | '3x' | '4x';
  description: string;
  durationWeeks: number;
  blocks: BlockConfig[];
}

interface BlockConfig {
  day: number;
  title: string;
  belt: string;
  focus: string[];
  exercisePatterns: string[];
}

const TEMPLATE_TAXONOMY: TemplateConfig[] = [
  // ACL Pathway (9 templates)
  {
    name: 'ACL_P1_White_Home_3x',
    pathway: 'ACL',
    phase: 'P1',
    level: 'White',
    environment: 'Home',
    frequency: '3x',
    description: 'Early stage ACL rehab with minimal gear. Focus on load tolerance and basic movement patterns.',
    durationWeeks: 4,
    blocks: [
      { day: 1, title: 'Lower Activation A', belt: 'White', focus: ['activation', 'stability'], exercisePatterns: ['glute', 'bridge', 'clam', 'isometric'] },
      { day: 3, title: 'Core & Balance', belt: 'White', focus: ['core', 'balance'], exercisePatterns: ['plank', 'bird dog', 'balance', 'core'] },
      { day: 5, title: 'Lower Activation B', belt: 'White', focus: ['activation', 'mobility'], exercisePatterns: ['squat', 'hinge', 'step', 'mobility'] },
    ],
  },
  {
    name: 'ACL_P1_Blue_Gym_3x',
    pathway: 'ACL',
    phase: 'P1',
    level: 'Blue',
    environment: 'Gym',
    frequency: '3x',
    description: 'Machine + basic barbell intro for ACL. Building load tolerance with controlled movements.',
    durationWeeks: 4,
    blocks: [
      { day: 1, title: 'Quad Focus', belt: 'Blue', focus: ['quad', 'strength'], exercisePatterns: ['leg press', 'extension', 'squat', 'step'] },
      { day: 3, title: 'Posterior Chain', belt: 'Blue', focus: ['hamstring', 'glute'], exercisePatterns: ['curl', 'bridge', 'rdl', 'hip'] },
      { day: 5, title: 'Integrated Lower', belt: 'Blue', focus: ['compound', 'stability'], exercisePatterns: ['squat', 'lunge', 'step', 'balance'] },
    ],
  },
  {
    name: 'ACL_P2_Blue_Gym_3x',
    pathway: 'ACL',
    phase: 'P2',
    level: 'Blue',
    environment: 'Gym',
    frequency: '3x',
    description: 'Main workhorse ACL template. Strength & capacity building phase.',
    durationWeeks: 6,
    blocks: [
      { day: 1, title: 'Strength Lower A', belt: 'Blue', focus: ['quad', 'strength'], exercisePatterns: ['squat', 'leg press', 'lunge', 'extension'] },
      { day: 3, title: 'Strength Lower B', belt: 'Blue', focus: ['posterior', 'strength'], exercisePatterns: ['rdl', 'deadlift', 'curl', 'hip thrust'] },
      { day: 5, title: 'Power Intro', belt: 'Blue', focus: ['power', 'plyometric'], exercisePatterns: ['jump', 'hop', 'step', 'landing'] },
    ],
  },
  {
    name: 'ACL_P2_Black_Gym_4x',
    pathway: 'ACL',
    phase: 'P2',
    level: 'Black',
    environment: 'Gym',
    frequency: '4x',
    description: 'High training age ACL athletes. Advanced strength & capacity phase.',
    durationWeeks: 6,
    blocks: [
      { day: 1, title: 'Max Strength Lower', belt: 'Black', focus: ['maximal', 'strength'], exercisePatterns: ['squat', 'deadlift', 'press'] },
      { day: 2, title: 'Unilateral Power', belt: 'Black', focus: ['unilateral', 'power'], exercisePatterns: ['split', 'lunge', 'step', 'single leg'] },
      { day: 4, title: 'Posterior Strength', belt: 'Black', focus: ['posterior', 'strength'], exercisePatterns: ['rdl', 'nordic', 'glute', 'hip'] },
      { day: 5, title: 'Reactive Power', belt: 'Black', focus: ['reactive', 'power'], exercisePatterns: ['jump', 'hop', 'bound', 'drop'] },
    ],
  },
  {
    name: 'ACL_P2_Blue_Field+Gym_3x',
    pathway: 'ACL',
    phase: 'P2',
    level: 'Blue',
    environment: 'Field+Gym',
    frequency: '3x',
    description: 'Starting to integrate running/COD with gym work.',
    durationWeeks: 4,
    blocks: [
      { day: 1, title: 'Gym: Strength', belt: 'Blue', focus: ['strength', 'compound'], exercisePatterns: ['squat', 'lunge', 'press', 'row'] },
      { day: 3, title: 'Field: Linear Speed', belt: 'Blue', focus: ['speed', 'running'], exercisePatterns: ['sprint', 'acceleration', 'tempo'] },
      { day: 5, title: 'Gym: Power + COD Prep', belt: 'Blue', focus: ['power', 'cod'], exercisePatterns: ['jump', 'cut', 'lateral', 'decel'] },
    ],
  },
  {
    name: 'ACL_P3_Blue_Field+Gym_3x',
    pathway: 'ACL',
    phase: 'P3',
    level: 'Blue',
    environment: 'Field+Gym',
    frequency: '3x',
    description: 'Higher-speed work, deceleration, and change of direction.',
    durationWeeks: 4,
    blocks: [
      { day: 1, title: 'Reactive Strength', belt: 'Blue', focus: ['reactive', 'strength'], exercisePatterns: ['squat', 'jump', 'landing', 'drop'] },
      { day: 3, title: 'Speed & Agility', belt: 'Blue', focus: ['speed', 'agility'], exercisePatterns: ['sprint', 'cut', 'shuffle', 'backpedal'] },
      { day: 5, title: 'Power & COD', belt: 'Blue', focus: ['power', 'cod'], exercisePatterns: ['bound', 'lateral', 'decel', 'reactive'] },
    ],
  },
  {
    name: 'ACL_P3_Black_Field+Gym_4x',
    pathway: 'ACL',
    phase: 'P3',
    level: 'Black',
    environment: 'Field+Gym',
    frequency: '4x',
    description: 'Performance return for higher level athletes.',
    durationWeeks: 4,
    blocks: [
      { day: 1, title: 'Max Strength', belt: 'Black', focus: ['maximal', 'strength'], exercisePatterns: ['squat', 'deadlift', 'press'] },
      { day: 2, title: 'Speed Development', belt: 'Black', focus: ['speed', 'acceleration'], exercisePatterns: ['sprint', 'acceleration', 'flying'] },
      { day: 4, title: 'Reactive Power', belt: 'Black', focus: ['reactive', 'power'], exercisePatterns: ['jump', 'bound', 'drop', 'depth'] },
      { day: 5, title: 'Sport-Specific COD', belt: 'Black', focus: ['cod', 'agility'], exercisePatterns: ['cut', 'shuffle', 'reactive', 'sport'] },
    ],
  },
  {
    name: 'ACL_P4_Blue_Field+Gym_2x',
    pathway: 'ACL',
    phase: 'P4',
    level: 'Blue',
    environment: 'Field+Gym',
    frequency: '2x',
    description: 'In-season ACL maintenance. Minimal volume, maintain strength.',
    durationWeeks: 8,
    blocks: [
      { day: 2, title: 'Maintenance Strength', belt: 'Blue', focus: ['maintenance', 'strength'], exercisePatterns: ['squat', 'rdl', 'lunge', 'glute'] },
      { day: 5, title: 'Power Maintenance', belt: 'Blue', focus: ['maintenance', 'power'], exercisePatterns: ['jump', 'bound', 'reactive'] },
    ],
  },
  {
    name: 'ACL_P4_Black_Field+Gym_2x',
    pathway: 'ACL',
    phase: 'P4',
    level: 'Black',
    environment: 'Field+Gym',
    frequency: '2x',
    description: 'High-level in-season ACL athlete maintenance.',
    durationWeeks: 8,
    blocks: [
      { day: 2, title: 'Strength Maintain', belt: 'Black', focus: ['maintenance', 'strength'], exercisePatterns: ['squat', 'deadlift', 'single leg'] },
      { day: 5, title: 'Power Maintain', belt: 'Black', focus: ['maintenance', 'power'], exercisePatterns: ['clean', 'jump', 'reactive'] },
    ],
  },

  // Hamstring Pathway (6 templates)
  {
    name: 'Hams_P1_White_Home_3x',
    pathway: 'Hams',
    phase: 'P1',
    level: 'White',
    environment: 'Home',
    frequency: '3x',
    description: 'Acute hamstring injury, minimal gear. Isometrics and gentle loading.',
    durationWeeks: 3,
    blocks: [
      { day: 1, title: 'Isometric Loading', belt: 'White', focus: ['isometric', 'activation'], exercisePatterns: ['bridge', 'isometric', 'hold', 'glute'] },
      { day: 3, title: 'Gentle Eccentrics', belt: 'White', focus: ['eccentric', 'control'], exercisePatterns: ['slide', 'bridge', 'hip', 'stretch'] },
      { day: 5, title: 'Progressive Loading', belt: 'White', focus: ['progressive', 'strength'], exercisePatterns: ['bridge', 'hinge', 'glute', 'core'] },
    ],
  },
  {
    name: 'Hams_P1_Blue_Gym_3x',
    pathway: 'Hams',
    phase: 'P1',
    level: 'Blue',
    environment: 'Gym',
    frequency: '3x',
    description: 'Intro strength for hamstring rehab with gym equipment.',
    durationWeeks: 3,
    blocks: [
      { day: 1, title: 'Machine Eccentrics', belt: 'Blue', focus: ['eccentric', 'control'], exercisePatterns: ['curl', 'press', 'bridge'] },
      { day: 3, title: 'Hinge Patterns', belt: 'Blue', focus: ['hinge', 'strength'], exercisePatterns: ['rdl', 'deadlift', 'good morning'] },
      { day: 5, title: 'Integrated Strength', belt: 'Blue', focus: ['compound', 'strength'], exercisePatterns: ['squat', 'lunge', 'hip', 'glute'] },
    ],
  },
  {
    name: 'Hams_P2_Blue_Gym_3x',
    pathway: 'Hams',
    phase: 'P2',
    level: 'Blue',
    environment: 'Gym',
    frequency: '3x',
    description: 'Nordics, RDLs, hinges. Main hamstring strengthening phase.',
    durationWeeks: 4,
    blocks: [
      { day: 1, title: 'Nordic Progression', belt: 'Blue', focus: ['eccentric', 'nordic'], exercisePatterns: ['nordic', 'curl', 'eccentric'] },
      { day: 3, title: 'Hinge Strength', belt: 'Blue', focus: ['hinge', 'strength'], exercisePatterns: ['rdl', 'deadlift', 'good morning', 'hip'] },
      { day: 5, title: 'Power Prep', belt: 'Blue', focus: ['power', 'reactive'], exercisePatterns: ['swing', 'jump', 'hip', 'explosive'] },
    ],
  },
  {
    name: 'Hams_P2_Black_Gym_4x',
    pathway: 'Hams',
    phase: 'P2',
    level: 'Black',
    environment: 'Gym',
    frequency: '4x',
    description: 'Higher density hamstring work for trained athletes.',
    durationWeeks: 4,
    blocks: [
      { day: 1, title: 'Max Eccentric', belt: 'Black', focus: ['eccentric', 'strength'], exercisePatterns: ['nordic', 'rdl', 'curl'] },
      { day: 2, title: 'Hip Dominant', belt: 'Black', focus: ['hip', 'power'], exercisePatterns: ['hip thrust', 'swing', 'clean'] },
      { day: 4, title: 'Hinge Power', belt: 'Black', focus: ['hinge', 'power'], exercisePatterns: ['deadlift', 'rdl', 'snatch'] },
      { day: 5, title: 'Reactive', belt: 'Black', focus: ['reactive', 'speed'], exercisePatterns: ['jump', 'bound', 'sprint'] },
    ],
  },
  {
    name: 'Hams_P3_Blue_Field+Gym_3x',
    pathway: 'Hams',
    phase: 'P3',
    level: 'Blue',
    environment: 'Field+Gym',
    frequency: '3x',
    description: 'Sprint integration phase for hamstring return.',
    durationWeeks: 4,
    blocks: [
      { day: 1, title: 'Strength Maintain', belt: 'Blue', focus: ['strength', 'eccentric'], exercisePatterns: ['nordic', 'rdl', 'deadlift'] },
      { day: 3, title: 'Sprint Development', belt: 'Blue', focus: ['speed', 'acceleration'], exercisePatterns: ['sprint', 'acceleration', 'tempo'] },
      { day: 5, title: 'Reactive Power', belt: 'Blue', focus: ['reactive', 'power'], exercisePatterns: ['bound', 'hop', 'sprint'] },
    ],
  },
  {
    name: 'Hams_P4_Blue_Field+Gym_2x',
    pathway: 'Hams',
    phase: 'P4',
    level: 'Blue',
    environment: 'Field+Gym',
    frequency: '2x',
    description: 'In-season hamstring maintenance.',
    durationWeeks: 8,
    blocks: [
      { day: 2, title: 'Eccentric Maintain', belt: 'Blue', focus: ['eccentric', 'maintenance'], exercisePatterns: ['nordic', 'rdl', 'curl'] },
      { day: 5, title: 'Speed Maintain', belt: 'Blue', focus: ['speed', 'maintenance'], exercisePatterns: ['sprint', 'acceleration'] },
    ],
  },

  // Performance Pathway (6 templates)
  {
    name: 'Perf_P2_White_Gym_2x',
    pathway: 'Perf',
    phase: 'P2',
    level: 'White',
    environment: 'Gym',
    frequency: '2x',
    description: 'General population, low training age. Foundation building.',
    durationWeeks: 6,
    blocks: [
      { day: 2, title: 'Full Body A', belt: 'White', focus: ['compound', 'strength'], exercisePatterns: ['squat', 'press', 'row', 'hinge'] },
      { day: 5, title: 'Full Body B', belt: 'White', focus: ['compound', 'strength'], exercisePatterns: ['lunge', 'pull', 'push', 'core'] },
    ],
  },
  {
    name: 'Perf_P2_Blue_Gym_3x',
    pathway: 'Perf',
    phase: 'P2',
    level: 'Blue',
    environment: 'Gym',
    frequency: '3x',
    description: 'Bread-and-butter performance template. Intermediate strength focus.',
    durationWeeks: 6,
    blocks: [
      { day: 1, title: 'Lower Strength', belt: 'Blue', focus: ['lower', 'strength'], exercisePatterns: ['squat', 'rdl', 'lunge', 'leg'] },
      { day: 3, title: 'Upper Strength', belt: 'Blue', focus: ['upper', 'strength'], exercisePatterns: ['bench', 'row', 'press', 'pull'] },
      { day: 5, title: 'Full Body Power', belt: 'Blue', focus: ['power', 'compound'], exercisePatterns: ['clean', 'jump', 'push', 'pull'] },
    ],
  },
  {
    name: 'Perf_P3_Blue_Field+Gym_3x',
    pathway: 'Perf',
    phase: 'P3',
    level: 'Blue',
    environment: 'Field+Gym',
    frequency: '3x',
    description: 'Field sport athletes off-season. Power and speed development.',
    durationWeeks: 6,
    blocks: [
      { day: 1, title: 'Strength Day', belt: 'Blue', focus: ['strength', 'compound'], exercisePatterns: ['squat', 'deadlift', 'press', 'row'] },
      { day: 3, title: 'Speed & Agility', belt: 'Blue', focus: ['speed', 'agility'], exercisePatterns: ['sprint', 'cut', 'shuffle', 'acceleration'] },
      { day: 5, title: 'Power Development', belt: 'Blue', focus: ['power', 'explosive'], exercisePatterns: ['clean', 'jump', 'bound', 'throw'] },
    ],
  },
  {
    name: 'Perf_P3_Black_Field+Gym_4x',
    pathway: 'Perf',
    phase: 'P3',
    level: 'Black',
    environment: 'Field+Gym',
    frequency: '4x',
    description: 'High performance off-season. Elite training volume.',
    durationWeeks: 6,
    blocks: [
      { day: 1, title: 'Max Strength Lower', belt: 'Black', focus: ['maximal', 'lower'], exercisePatterns: ['squat', 'deadlift', 'single leg'] },
      { day: 2, title: 'Speed Development', belt: 'Black', focus: ['speed', 'acceleration'], exercisePatterns: ['sprint', 'flying', 'acceleration'] },
      { day: 4, title: 'Max Strength Upper', belt: 'Black', focus: ['maximal', 'upper'], exercisePatterns: ['bench', 'row', 'press', 'pull'] },
      { day: 5, title: 'Power & Reactive', belt: 'Black', focus: ['power', 'reactive'], exercisePatterns: ['clean', 'snatch', 'jump', 'bound'] },
    ],
  },
  {
    name: 'Perf_P4_Blue_InSeason_2x',
    pathway: 'Perf',
    phase: 'P4',
    level: 'Blue',
    environment: 'InSeason',
    frequency: '2x',
    description: 'Most community footballers. In-season maintenance.',
    durationWeeks: 12,
    blocks: [
      { day: 2, title: 'Strength Maintain', belt: 'Blue', focus: ['maintenance', 'strength'], exercisePatterns: ['squat', 'rdl', 'press', 'row'] },
      { day: 5, title: 'Power Maintain', belt: 'Blue', focus: ['maintenance', 'power'], exercisePatterns: ['jump', 'clean', 'reactive'] },
    ],
  },
  {
    name: 'Perf_P4_Black_InSeason_2x',
    pathway: 'Perf',
    phase: 'P4',
    level: 'Black',
    environment: 'InSeason',
    frequency: '2x',
    description: 'Higher level athletes in-season. Elite maintenance.',
    durationWeeks: 12,
    blocks: [
      { day: 2, title: 'Strength Maintain', belt: 'Black', focus: ['maintenance', 'strength'], exercisePatterns: ['squat', 'deadlift', 'press'] },
      { day: 5, title: 'Power Maintain', belt: 'Black', focus: ['maintenance', 'power'], exercisePatterns: ['clean', 'snatch', 'jump'] },
    ],
  },

  // Fallback Templates (3 templates)
  {
    name: 'Fallback_BusyWeek_2x',
    pathway: 'Fallback',
    phase: 'Special',
    level: 'Blue',
    environment: 'Gym',
    frequency: '2x',
    description: 'Shorter, high-yield sessions when time is limited.',
    durationWeeks: 1,
    blocks: [
      { day: 2, title: 'Efficient Full Body A', belt: 'Blue', focus: ['efficient', 'compound'], exercisePatterns: ['squat', 'press', 'row', 'core'] },
      { day: 5, title: 'Efficient Full Body B', belt: 'Blue', focus: ['efficient', 'compound'], exercisePatterns: ['deadlift', 'pull', 'push', 'carry'] },
    ],
  },
  {
    name: 'Fallback_Deload_2x',
    pathway: 'Fallback',
    phase: 'Special',
    level: 'White',
    environment: 'Gym',
    frequency: '2x',
    description: 'Low volume/intensity recovery week.',
    durationWeeks: 1,
    blocks: [
      { day: 2, title: 'Light Movement A', belt: 'White', focus: ['recovery', 'mobility'], exercisePatterns: ['mobility', 'stretch', 'light', 'activation'] },
      { day: 5, title: 'Light Movement B', belt: 'White', focus: ['recovery', 'mobility'], exercisePatterns: ['foam', 'stretch', 'activation', 'core'] },
    ],
  },
  {
    name: 'Fallback_HomeOnly_3x',
    pathway: 'Fallback',
    phase: 'Special',
    level: 'Blue',
    environment: 'Home',
    frequency: '3x',
    description: 'Bands & dumbbells only. For travel or home training.',
    durationWeeks: 1,
    blocks: [
      { day: 1, title: 'Home Lower', belt: 'Blue', focus: ['lower', 'bodyweight'], exercisePatterns: ['squat', 'lunge', 'bridge', 'split'] },
      { day: 3, title: 'Home Upper', belt: 'Blue', focus: ['upper', 'bodyweight'], exercisePatterns: ['push up', 'row', 'press', 'pull'] },
      { day: 5, title: 'Home Full Body', belt: 'Blue', focus: ['full', 'bodyweight'], exercisePatterns: ['squat', 'push', 'hinge', 'core'] },
    ],
  },
];

async function findExercisesForPattern(
  masterExercises: MasterExercise[], 
  patterns: string[], 
  beltLevel: string,
  count: number = 4
): Promise<MasterExercise[]> {
  const beltOrder = ['White', 'Blue', 'Black'];
  const beltIndex = beltOrder.indexOf(beltLevel);
  
  const matchingExercises = masterExercises.filter(ex => {
    const exBeltMinIdx = beltOrder.indexOf(ex.belt_min);
    const exBeltMaxIdx = beltOrder.indexOf(ex.belt_max);
    
    if (exBeltMinIdx === -1 || exBeltMaxIdx === -1) return false;
    if (beltIndex < exBeltMinIdx || beltIndex > exBeltMaxIdx) return false;
    
    const name = ex.name.toLowerCase();
    const tags = (ex.tags || '').toLowerCase();
    
    return patterns.some(pattern => 
      name.includes(pattern.toLowerCase()) || tags.includes(pattern.toLowerCase())
    );
  });
  
  const shuffled = matchingExercises.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function seedExercisesFromMaster(): Promise<number> {
  console.log('Loading master exercises...');
  const masterData = JSON.parse(readFileSync('client/public/master_exercises.json', 'utf-8')) as MasterExercise[];
  
  console.log(`Found ${masterData.length} exercises in master file`);
  
  const existingExercises = await db.select().from(exercises);
  const existingIds = new Set(existingExercises.map(e => e.id));
  
  let inserted = 0;
  const existingNames = new Set(existingExercises.map(e => e.name.toLowerCase()));
  
  for (const ex of masterData) {
    if (!existingNames.has(ex.name.toLowerCase())) {
      try {
        await db.insert(exercises).values({
          name: ex.name,
          category: inferCategory(ex),
          muscleGroup: inferMuscleGroup(ex),
          equipment: inferEquipment(ex),
          difficulty: ex.belt_min || 'White',
          instructions: ex.notes || '',
        });
        inserted++;
      } catch (error) {
        console.error(`Failed to insert exercise ${ex.name}:`, error);
      }
    }
  }
  
  console.log(`Inserted ${inserted} new exercises`);
  return inserted;
}

function inferCategory(ex: MasterExercise): string {
  const name = ex.name.toLowerCase();
  const tags = (ex.tags || '').toLowerCase();
  
  if (name.includes('squat') || name.includes('deadlift') || name.includes('press') || name.includes('row')) return 'Strength';
  if (name.includes('jump') || name.includes('bound') || name.includes('hop') || name.includes('plyo')) return 'Power';
  if (name.includes('sprint') || name.includes('run') || name.includes('agility')) return 'Speed';
  if (name.includes('stretch') || name.includes('mobility') || name.includes('foam')) return 'Mobility';
  if (name.includes('core') || name.includes('plank') || name.includes('ab')) return 'Core';
  if (tags.includes('cardio') || tags.includes('conditioning')) return 'Conditioning';
  
  return 'Strength';
}

function inferMuscleGroup(ex: MasterExercise): string {
  const name = ex.name.toLowerCase();
  
  if (name.includes('squat') || name.includes('lunge') || name.includes('leg')) return 'Legs';
  if (name.includes('deadlift') || name.includes('rdl') || name.includes('hinge') || name.includes('hamstring')) return 'Posterior Chain';
  if (name.includes('bench') || name.includes('chest') || name.includes('push')) return 'Chest';
  if (name.includes('row') || name.includes('pull') || name.includes('lat')) return 'Back';
  if (name.includes('shoulder') || name.includes('press') || name.includes('overhead')) return 'Shoulders';
  if (name.includes('arm') || name.includes('bicep') || name.includes('tricep') || name.includes('curl')) return 'Arms';
  if (name.includes('core') || name.includes('ab') || name.includes('plank')) return 'Core';
  if (name.includes('glute') || name.includes('hip')) return 'Glutes';
  
  return 'Full Body';
}

function inferEquipment(ex: MasterExercise): string {
  const name = ex.name.toLowerCase();
  
  if (name.includes('barbell') || name.includes('bb')) return 'Barbell';
  if (name.includes('dumbbell') || name.includes('db')) return 'Dumbbell';
  if (name.includes('kettlebell') || name.includes('kb')) return 'Kettlebell';
  if (name.includes('machine') || name.includes('cable')) return 'Machine';
  if (name.includes('band') || name.includes('resistance')) return 'Bands';
  if (name.includes('bodyweight') || name.includes('bw')) return 'Bodyweight';
  
  return 'Various';
}

export async function seedTemplates(): Promise<number> {
  console.log('Loading master exercises for template seeding...');
  const masterData = JSON.parse(readFileSync('client/public/master_exercises.json', 'utf-8')) as MasterExercise[];
  
  let templatesCreated = 0;
  
  for (const config of TEMPLATE_TAXONOMY) {
    console.log(`Creating template: ${config.name}`);
    
    const existing = await db.select()
      .from(programTemplates)
      .where(eq(programTemplates.name, config.name));
    
    if (existing.length > 0) {
      console.log(`  Template ${config.name} already exists, skipping`);
      continue;
    }
    
    const category = config.pathway === 'ACL' ? 'Rehab' 
                   : config.pathway === 'Hams' ? 'Rehab'
                   : config.pathway === 'Perf' ? 'Performance'
                   : 'Utility';
    
    const [template] = await db.insert(programTemplates).values({
      name: config.name,
      description: config.description,
      category,
      duration: config.durationWeeks,
      tags: [config.pathway, config.phase, config.level, config.environment, config.frequency],
      isPublic: 1,
    }).returning();
    
    const phaseType = config.phase === 'P1' ? 'base'
                    : config.phase === 'P2' ? 'build'
                    : config.phase === 'P3' ? 'peak'
                    : config.phase === 'P4' ? 'recovery'
                    : 'recovery';
    
    const [phase] = await db.insert(templatePhases).values({
      templateId: template.id,
      name: `${config.pathway} ${config.phase}`,
      startWeek: 1,
      endWeek: config.durationWeeks,
      phaseType,
      goals: config.description,
      orderIndex: 0,
    }).returning();
    
    for (let week = 1; week <= config.durationWeeks; week++) {
      const [templateWeek] = await db.insert(templateWeeks).values({
        templateId: template.id,
        phaseId: phase.id,
        weekNumber: week,
        beltTarget: config.level,
        focus: config.blocks.flatMap(b => b.focus),
        notes: `Week ${week} of ${config.durationWeeks}`,
      }).returning();
      
      for (let blockIdx = 0; blockIdx < config.blocks.length; blockIdx++) {
        const blockConfig = config.blocks[blockIdx];
        
        const [block] = await db.insert(templateTrainingBlocks).values({
          templateId: template.id,
          templateWeekId: templateWeek.id,
          weekNumber: week,
          dayNumber: blockConfig.day,
          title: blockConfig.title,
          belt: blockConfig.belt,
          focus: blockConfig.focus,
          notes: `${config.name} - Week ${week} Day ${blockConfig.day}`,
          scheme: '3-4 sets x 8-12 reps',
          orderIndex: blockIdx,
        }).returning();
        
        const selectedExercises = await findExercisesForPattern(
          masterData,
          blockConfig.exercisePatterns,
          blockConfig.belt,
          4
        );
        
        for (let exIdx = 0; exIdx < selectedExercises.length; exIdx++) {
          const ex = selectedExercises[exIdx];
          
          let [exerciseInDb] = await db.select()
            .from(exercises)
            .where(eq(exercises.name, ex.name));
          
          if (!exerciseInDb) {
            [exerciseInDb] = await db.insert(exercises).values({
              name: ex.name,
              category: inferCategory(ex),
              muscleGroup: inferMuscleGroup(ex),
              equipment: inferEquipment(ex),
              difficulty: ex.belt_min || 'White',
              instructions: ex.notes || '',
            }).returning();
          }
          
          await db.insert(templateTrainingBlockExercises).values({
            blockId: block.id,
            exerciseId: exerciseInDb.id,
            scheme: `${ex.variables_default?.sets || 3} x ${ex.variables_default?.reps || '8-12'} @ ${ex.variables_default?.intensity || 'RPE 7'}`,
            notes: '',
            orderIndex: exIdx,
          });
        }
      }
    }
    
    templatesCreated++;
    console.log(`  Created template ${config.name} with ${config.durationWeeks} weeks and ${config.blocks.length} blocks/week`);
  }
  
  console.log(`\nTotal templates created: ${templatesCreated}`);
  return templatesCreated;
}

export async function runFullSeed(): Promise<void> {
  console.log('=== Starting Full Template Seed ===\n');
  
  await seedExercisesFromMaster();
  
  await seedTemplates();
  
  console.log('\n=== Seed Complete ===');
}
