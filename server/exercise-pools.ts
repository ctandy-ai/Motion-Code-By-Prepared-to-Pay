/**
 * Curated Exercise Pools for Pathway Templates
 * 
 * CLINICAL SAFETY: These pools contain vetted, phase-appropriate exercises
 * that are safe for each stage of rehabilitation or training progression.
 * 
 * DO NOT use pattern matching against master database for rehab templates.
 * Always use explicit exercise names from these curated pools.
 */

// Phase-specific scheme overrides - ignores exercise defaults
export const PHASE_SCHEMES: Record<string, { sets: number; reps: string; intensity: string }> = {
  // P1: Acute/Early - Isometric, activation, bodyweight focus
  'P1_isometric': { sets: 3, reps: '10-15s hold', intensity: 'Bodyweight, RPE 3-4' },
  'P1_activation': { sets: 2, reps: '12-15', intensity: 'Bodyweight, RPE 4-5' },
  'P1_gentle_eccentric': { sets: 2, reps: '8-10 (slow)', intensity: 'Bodyweight, RPE 4-5' },
  
  // P2: Strength Building - Controlled loading, progressive overload
  'P2_strength': { sets: 3, reps: '8-12', intensity: '60-70%, RPE 6-7' },
  'P2_eccentric': { sets: 3, reps: '6-8 (3s eccentric)', intensity: '65-75%, RPE 6-7' },
  'P2_power_intro': { sets: 3, reps: '5-8', intensity: 'Controlled, RPE 6-7' },
  
  // P3: Power/Speed Development - Higher intensities, reactive work
  'P3_strength': { sets: 4, reps: '4-6', intensity: '80-85%, RPE 7-8' },
  'P3_power': { sets: 3, reps: '3-5', intensity: '70-80%, RPE 7-8' },
  'P3_reactive': { sets: 3, reps: '5-8', intensity: 'Max intent, RPE 8' },
  'P3_speed': { sets: 4, reps: '4-6', intensity: '90-95% effort' },
  
  // P4: Maintenance - Reduced volume, maintain adaptations
  'P4_maintenance': { sets: 2, reps: '6-8', intensity: '70-75%, RPE 6' },
  'P4_power_maintain': { sets: 2, reps: '4-6', intensity: '75%, RPE 6-7' },
  
  // Performance templates (non-rehab)
  'Perf_strength': { sets: 4, reps: '4-6', intensity: '80-90%, RPE 7-8' },
  'Perf_power': { sets: 4, reps: '3-5', intensity: '75-85%, RPE 8' },
  'Perf_hypertrophy': { sets: 3, reps: '8-12', intensity: '65-75%, RPE 7-8' },
  
  // Fallback/Deload
  'Deload': { sets: 2, reps: '8-10', intensity: '50-60%, RPE 5' },
  'Mobility': { sets: 2, reps: '30-60s', intensity: 'Bodyweight' },
};

// Equipment constraints by environment
export const ENVIRONMENT_EQUIPMENT: Record<string, string[]> = {
  'Home': ['Bodyweight', 'Bands', 'Dumbbells', 'Sliders', 'Swiss Ball', 'Foam Roller'],
  'Gym': ['Barbell', 'Dumbbells', 'Kettlebells', 'Machines', 'Cable', 'Bands', 'Bodyweight'],
  'Field+Gym': ['Barbell', 'Dumbbells', 'Kettlebells', 'Machines', 'Field', 'Cones', 'Sleds'],
  'InSeason': ['Barbell', 'Dumbbells', 'Machines', 'Minimal Volume'],
};

// ============================================
// HAMSTRING PATHWAY - Curated Exercise Pools
// ============================================

export const HAMS_P1_ISOMETRIC = [
  'Bosch Hamstring Bridge',
  'bosch yielding isometric hamstring bridge hold',
  'Bridge - Hamstring Dominant',
  'Glute Bridge Iso Hold',
  'Prone Hamstring Iso Hold',
  '1/4 Squat on Wall Holds',
];

export const HAMS_P1_ACTIVATION = [
  'asymmetrical bridge',
  'Banded Hamstring Curl - Bent Knee',
  'Double Leg Glute Bridge',
  'Single Leg Glute Bridge',
  'Prone Hamstring Curl (BW)',
  'Supine Hip Extension',
];

export const HAMS_P1_GENTLE_ECCENTRIC = [
  '1/2 knealing sliders',
  'Slider Leg Curl',
  'Swiss Ball Hamstring Curl',
  'Slider Bridge Walkout',
  'Eccentric Hamstring Slider',
];

export const HAMS_P2_ECCENTRIC = [
  'band supported Nordic',
  'Nordic Curl - Band Assisted',
  'Razor Curl',
  'Swiss Ball Leg Curl',
  'Slider Hamstring Curl',
  'GHD Glute Ham Raise - Assisted',
];

export const HAMS_P2_STRENGTH = [
  'Bench Supported DB RDL',
  'DB RFE Single Leg RDL',
  'KB Single Leg RDL',
  'Trap Bar RDL',
  'Hip Hinge - Cable',
  'Good Morning - Light',
];

export const HAMS_P3_POWER = [
  'Nordic Curl',
  'Barbell RDL',
  'BB SL RDL',
  'KB Swing',
  'Hip Thrust - Barbell',
  'Glute Ham Raise',
];

export const HAMS_P3_REACTIVE = [
  'Broad Jump',
  'Single Leg Hop',
  'Bounding',
  'Sprint - Acceleration',
  'A Skip',
  'Falling Start Sprint',
];

export const HAMS_P4_MAINTENANCE = [
  'band supported Nordic',
  'DB RDL',
  'Hip Thrust - DB',
  'Glute Bridge - Single Leg',
  'Slider Hamstring Curl',
];

// ============================================
// ACL PATHWAY - Curated Exercise Pools
// ============================================

export const ACL_P1_ACTIVATION = [
  'Quad Sets',
  'Straight Leg Raise',
  'Terminal Knee Extension',
  'VMO Activation',
  'Short Arc Quad',
  'Heel Slides',
];

export const ACL_P1_STABILITY = [
  'Double Leg Glute Bridge',
  'Clamshell',
  'Side Lying Hip Abduction',
  'Bird Dog',
  'Dead Bug',
  'Prone Plank',
];

export const ACL_P1_BALANCE = [
  'Single Leg Stand',
  'Weight Shift - Lateral',
  'Mini Squat - Supported',
  '1/4 Squat Balance',
  'Step Up - Low Box',
  'Single Leg Balance Reach',
];

export const ACL_P2_QUAD_STRENGTH = [
  'Leg Press',
  'Leg Extension',
  'Goblet Squat',
  'Step Up',
  'Split Squat',
  'Bulgarian Split Squat',
];

export const ACL_P2_POSTERIOR = [
  'Leg Curl - Machine',
  'Hip Thrust - DB',
  'RDL - DB',
  'Good Morning - Light',
  'Cable Pull Through',
  'Glute Bridge - Weighted',
];

export const ACL_P2_COMPOUND = [
  'Back Squat',
  'Front Squat',
  'Trap Bar Deadlift',
  'Walking Lunge',
  'Lateral Lunge',
  'Step Up - Weighted',
];

export const ACL_P2_POWER_INTRO = [
  'Box Jump - Step Down',
  'Pogo Jump',
  'Squat Jump - Bodyweight',
  'Hurdle Step Over',
  'Lateral Bound - Small',
  'Drop Landing',
];

export const ACL_P3_REACTIVE = [
  'Depth Jump',
  'Box Jump',
  'Single Leg Hop',
  'Lateral Bound',
  'Hurdle Hop',
  'Drop Jump',
];

export const ACL_P3_SPEED = [
  'Sprint - 10m',
  'Sprint - 20m',
  'A Skip',
  'B Skip',
  'Acceleration Sprint',
  'Flying Sprint',
];

export const ACL_P3_COD = [
  '5-10-5 Shuttle',
  'T-Test',
  'Pro Agility',
  'L Drill',
  'Reactive Agility',
  '180 Cut',
];

export const ACL_P4_MAINTENANCE = [
  'Back Squat',
  'RDL - Barbell',
  'Bulgarian Split Squat',
  'Hip Thrust',
  'Nordic Curl',
  'Single Leg Squat',
];

// ============================================
// PERFORMANCE PATHWAY - Curated Exercise Pools
// ============================================

export const PERF_STRENGTH_LOWER = [
  'Back Squat',
  'Front Squat',
  'Trap Bar Deadlift',
  'Romanian Deadlift',
  'Bulgarian Split Squat',
  'Hip Thrust',
];

export const PERF_STRENGTH_UPPER = [
  'Bench Press',
  'Overhead Press',
  'Bent Over Row',
  'Pull Up',
  'Chin Up',
  'DB Row',
];

export const PERF_POWER = [
  'Power Clean',
  'Hang Clean',
  'Push Press',
  'Box Jump',
  'Med Ball Slam',
  'Kettlebell Swing',
];

export const PERF_SPEED = [
  'Sprint - 10m',
  'Sprint - 20m',
  'Sprint - 40m',
  'Sled Push',
  'Sled Pull',
  'Resisted Sprint',
];

export const PERF_HYPERTROPHY = [
  'Leg Press',
  'Leg Curl',
  'Leg Extension',
  'Lat Pulldown',
  'Cable Row',
  'Face Pull',
];

// ============================================
// FALLBACK TEMPLATES - Curated Exercise Pools
// ============================================

export const FALLBACK_COMPOUND = [
  'Goblet Squat',
  'DB RDL',
  'Push Up',
  'DB Row',
  'Plank',
  'Farmers Walk',
];

export const FALLBACK_DELOAD = [
  'Foam Roll - Full Body',
  'Cat Cow',
  'World Greatest Stretch',
  'Hip Flexor Stretch',
  'Pigeon Stretch',
  'Child Pose',
];

export const FALLBACK_HOME_LOWER = [
  'Bodyweight Squat',
  'Reverse Lunge',
  'Glute Bridge',
  'Single Leg RDL - BW',
  'Step Up - BW',
  'Calf Raise',
];

export const FALLBACK_HOME_UPPER = [
  'Push Up',
  'Pike Push Up',
  'Inverted Row',
  'Band Pull Apart',
  'Band Face Pull',
  'Plank',
];

// ============================================
// Block Configuration with Curated Pools
// ============================================

export interface CuratedBlockConfig {
  day: number;
  title: string;
  belt: 'White' | 'Blue' | 'Black';
  focus: string[];
  exercisePool: string[];  // Curated exercise names
  schemeKey: string;       // Key into PHASE_SCHEMES
}

export interface CuratedTemplateConfig {
  name: string;
  pathway: 'ACL' | 'Hams' | 'Perf' | 'Fallback';
  phase: 'P1' | 'P2' | 'P3' | 'P4' | 'Special';
  level: 'White' | 'Blue' | 'Black';
  environment: 'Home' | 'Gym' | 'Field+Gym' | 'InSeason';
  frequency: '2x' | '3x' | '4x';
  description: string;
  durationWeeks: number;
  blocks: CuratedBlockConfig[];
}

// ============================================
// FULL TEMPLATE TAXONOMY WITH CURATED POOLS
// ============================================

export const CURATED_TEMPLATE_TAXONOMY: CuratedTemplateConfig[] = [
  // ============ HAMSTRING PATHWAY ============
  {
    name: 'Hams_P1_White_Home_3x',
    pathway: 'Hams',
    phase: 'P1',
    level: 'White',
    environment: 'Home',
    frequency: '3x',
    description: 'Acute hamstring injury, minimal gear. Isometrics and gentle activation only.',
    durationWeeks: 3,
    blocks: [
      { day: 1, title: 'Isometric Loading', belt: 'White', focus: ['isometric', 'activation'], exercisePool: HAMS_P1_ISOMETRIC, schemeKey: 'P1_isometric' },
      { day: 3, title: 'Activation Work', belt: 'White', focus: ['activation', 'control'], exercisePool: HAMS_P1_ACTIVATION, schemeKey: 'P1_activation' },
      { day: 5, title: 'Gentle Eccentrics', belt: 'White', focus: ['eccentric', 'controlled'], exercisePool: HAMS_P1_GENTLE_ECCENTRIC, schemeKey: 'P1_gentle_eccentric' },
    ],
  },
  {
    name: 'Hams_P1_Blue_Gym_3x',
    pathway: 'Hams',
    phase: 'P1',
    level: 'Blue',
    environment: 'Gym',
    frequency: '3x',
    description: 'Gym-based early hamstring rehab with machine support.',
    durationWeeks: 3,
    blocks: [
      { day: 1, title: 'Isometric Loading', belt: 'Blue', focus: ['isometric', 'activation'], exercisePool: HAMS_P1_ISOMETRIC, schemeKey: 'P1_isometric' },
      { day: 3, title: 'Activation Work', belt: 'Blue', focus: ['activation', 'control'], exercisePool: HAMS_P1_ACTIVATION, schemeKey: 'P1_activation' },
      { day: 5, title: 'Gentle Eccentrics', belt: 'Blue', focus: ['eccentric', 'controlled'], exercisePool: HAMS_P1_GENTLE_ECCENTRIC, schemeKey: 'P1_gentle_eccentric' },
    ],
  },
  {
    name: 'Hams_P2_Blue_Gym_3x',
    pathway: 'Hams',
    phase: 'P2',
    level: 'Blue',
    environment: 'Gym',
    frequency: '3x',
    description: 'Main hamstring rehab phase. Nordic progression and controlled loading.',
    durationWeeks: 4,
    blocks: [
      { day: 1, title: 'Eccentric Development', belt: 'Blue', focus: ['eccentric', 'strength'], exercisePool: HAMS_P2_ECCENTRIC, schemeKey: 'P2_eccentric' },
      { day: 3, title: 'Strength Building', belt: 'Blue', focus: ['strength', 'posterior'], exercisePool: HAMS_P2_STRENGTH, schemeKey: 'P2_strength' },
      { day: 5, title: 'Integrated Posterior', belt: 'Blue', focus: ['compound', 'integration'], exercisePool: [...HAMS_P2_ECCENTRIC.slice(0, 2), ...HAMS_P2_STRENGTH.slice(0, 2)], schemeKey: 'P2_strength' },
    ],
  },
  {
    name: 'Hams_P3_Blue_Field+Gym_3x',
    pathway: 'Hams',
    phase: 'P3',
    level: 'Blue',
    environment: 'Field+Gym',
    frequency: '3x',
    description: 'Return to running and sprint integration.',
    durationWeeks: 4,
    blocks: [
      { day: 1, title: 'Power Development', belt: 'Blue', focus: ['power', 'strength'], exercisePool: HAMS_P3_POWER, schemeKey: 'P3_power' },
      { day: 3, title: 'Speed Work', belt: 'Blue', focus: ['speed', 'reactive'], exercisePool: HAMS_P3_REACTIVE, schemeKey: 'P3_speed' },
      { day: 5, title: 'Integrated Power', belt: 'Blue', focus: ['power', 'reactive'], exercisePool: [...HAMS_P3_POWER.slice(0, 2), ...HAMS_P3_REACTIVE.slice(0, 2)], schemeKey: 'P3_reactive' },
    ],
  },
  {
    name: 'Hams_P4_Blue_InSeason_2x',
    pathway: 'Hams',
    phase: 'P4',
    level: 'Blue',
    environment: 'InSeason',
    frequency: '2x',
    description: 'In-season hamstring maintenance. Minimal volume.',
    durationWeeks: 8,
    blocks: [
      { day: 2, title: 'Eccentric Maintenance', belt: 'Blue', focus: ['maintenance', 'eccentric'], exercisePool: HAMS_P4_MAINTENANCE, schemeKey: 'P4_maintenance' },
      { day: 5, title: 'Strength Maintenance', belt: 'Blue', focus: ['maintenance', 'strength'], exercisePool: HAMS_P4_MAINTENANCE, schemeKey: 'P4_maintenance' },
    ],
  },
  {
    name: 'Hams_P4_Black_InSeason_2x',
    pathway: 'Hams',
    phase: 'P4',
    level: 'Black',
    environment: 'InSeason',
    frequency: '2x',
    description: 'Elite athlete in-season hamstring maintenance.',
    durationWeeks: 12,
    blocks: [
      { day: 2, title: 'Power Maintenance', belt: 'Black', focus: ['maintenance', 'power'], exercisePool: HAMS_P3_POWER, schemeKey: 'P4_power_maintain' },
      { day: 5, title: 'Strength Maintenance', belt: 'Black', focus: ['maintenance', 'strength'], exercisePool: HAMS_P4_MAINTENANCE, schemeKey: 'P4_maintenance' },
    ],
  },

  // ============ ACL PATHWAY ============
  {
    name: 'ACL_P1_White_Home_3x',
    pathway: 'ACL',
    phase: 'P1',
    level: 'White',
    environment: 'Home',
    frequency: '3x',
    description: 'Early stage ACL rehab with minimal gear. Quad activation and stability.',
    durationWeeks: 4,
    blocks: [
      { day: 1, title: 'Quad Activation', belt: 'White', focus: ['activation', 'quad'], exercisePool: ACL_P1_ACTIVATION, schemeKey: 'P1_activation' },
      { day: 3, title: 'Core & Stability', belt: 'White', focus: ['core', 'stability'], exercisePool: ACL_P1_STABILITY, schemeKey: 'P1_activation' },
      { day: 5, title: 'Balance & Control', belt: 'White', focus: ['balance', 'control'], exercisePool: ACL_P1_BALANCE, schemeKey: 'P1_activation' },
    ],
  },
  {
    name: 'ACL_P1_Blue_Gym_3x',
    pathway: 'ACL',
    phase: 'P1',
    level: 'Blue',
    environment: 'Gym',
    frequency: '3x',
    description: 'Machine + basic barbell intro for ACL. Building load tolerance.',
    durationWeeks: 4,
    blocks: [
      { day: 1, title: 'Quad Activation', belt: 'Blue', focus: ['activation', 'quad'], exercisePool: ACL_P1_ACTIVATION, schemeKey: 'P1_activation' },
      { day: 3, title: 'Hip Stability', belt: 'Blue', focus: ['stability', 'hip'], exercisePool: ACL_P1_STABILITY, schemeKey: 'P1_activation' },
      { day: 5, title: 'Balance Integration', belt: 'Blue', focus: ['balance', 'integration'], exercisePool: ACL_P1_BALANCE, schemeKey: 'P1_activation' },
    ],
  },
  {
    name: 'ACL_P2_Blue_Gym_3x',
    pathway: 'ACL',
    phase: 'P2',
    level: 'Blue',
    environment: 'Gym',
    frequency: '3x',
    description: 'Main ACL strength phase. Quad and posterior chain development.',
    durationWeeks: 6,
    blocks: [
      { day: 1, title: 'Quad Strength', belt: 'Blue', focus: ['quad', 'strength'], exercisePool: ACL_P2_QUAD_STRENGTH, schemeKey: 'P2_strength' },
      { day: 3, title: 'Posterior Chain', belt: 'Blue', focus: ['posterior', 'strength'], exercisePool: ACL_P2_POSTERIOR, schemeKey: 'P2_strength' },
      { day: 5, title: 'Power Introduction', belt: 'Blue', focus: ['power', 'intro'], exercisePool: ACL_P2_POWER_INTRO, schemeKey: 'P2_power_intro' },
    ],
  },
  {
    name: 'ACL_P2_Black_Gym_4x',
    pathway: 'ACL',
    phase: 'P2',
    level: 'Black',
    environment: 'Gym',
    frequency: '4x',
    description: 'High training age ACL athletes. Advanced strength phase.',
    durationWeeks: 6,
    blocks: [
      { day: 1, title: 'Max Strength Lower', belt: 'Black', focus: ['maximal', 'strength'], exercisePool: ACL_P2_COMPOUND, schemeKey: 'P3_strength' },
      { day: 2, title: 'Unilateral Power', belt: 'Black', focus: ['unilateral', 'power'], exercisePool: ACL_P2_QUAD_STRENGTH.slice(3), schemeKey: 'P2_strength' },
      { day: 4, title: 'Posterior Strength', belt: 'Black', focus: ['posterior', 'strength'], exercisePool: ACL_P2_POSTERIOR, schemeKey: 'P2_eccentric' },
      { day: 5, title: 'Reactive Power', belt: 'Black', focus: ['reactive', 'power'], exercisePool: ACL_P2_POWER_INTRO, schemeKey: 'P3_reactive' },
    ],
  },
  {
    name: 'ACL_P2_Blue_Field+Gym_3x',
    pathway: 'ACL',
    phase: 'P2',
    level: 'Blue',
    environment: 'Field+Gym',
    frequency: '3x',
    description: 'Starting to integrate running with gym work.',
    durationWeeks: 4,
    blocks: [
      { day: 1, title: 'Gym: Strength', belt: 'Blue', focus: ['strength', 'compound'], exercisePool: ACL_P2_COMPOUND, schemeKey: 'P2_strength' },
      { day: 3, title: 'Field: Linear Speed', belt: 'Blue', focus: ['speed', 'running'], exercisePool: ACL_P3_SPEED.slice(0, 4), schemeKey: 'P3_speed' },
      { day: 5, title: 'Power + Landing', belt: 'Blue', focus: ['power', 'landing'], exercisePool: ACL_P2_POWER_INTRO, schemeKey: 'P2_power_intro' },
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
      { day: 1, title: 'Reactive Strength', belt: 'Blue', focus: ['reactive', 'strength'], exercisePool: ACL_P3_REACTIVE, schemeKey: 'P3_reactive' },
      { day: 3, title: 'Speed & Agility', belt: 'Blue', focus: ['speed', 'agility'], exercisePool: ACL_P3_SPEED, schemeKey: 'P3_speed' },
      { day: 5, title: 'COD Development', belt: 'Blue', focus: ['cod', 'reactive'], exercisePool: ACL_P3_COD, schemeKey: 'P3_reactive' },
    ],
  },
  {
    name: 'ACL_P3_Black_Field+Gym_4x',
    pathway: 'ACL',
    phase: 'P3',
    level: 'Black',
    environment: 'Field+Gym',
    frequency: '4x',
    description: 'Performance return for elite athletes.',
    durationWeeks: 4,
    blocks: [
      { day: 1, title: 'Max Strength', belt: 'Black', focus: ['maximal', 'strength'], exercisePool: ACL_P2_COMPOUND, schemeKey: 'P3_strength' },
      { day: 2, title: 'Speed Development', belt: 'Black', focus: ['speed', 'acceleration'], exercisePool: ACL_P3_SPEED, schemeKey: 'P3_speed' },
      { day: 4, title: 'Reactive Power', belt: 'Black', focus: ['reactive', 'power'], exercisePool: ACL_P3_REACTIVE, schemeKey: 'P3_reactive' },
      { day: 5, title: 'Sport-Specific COD', belt: 'Black', focus: ['cod', 'agility'], exercisePool: ACL_P3_COD, schemeKey: 'P3_reactive' },
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
      { day: 2, title: 'Maintenance Strength', belt: 'Blue', focus: ['maintenance', 'strength'], exercisePool: ACL_P4_MAINTENANCE, schemeKey: 'P4_maintenance' },
      { day: 5, title: 'Power Maintenance', belt: 'Blue', focus: ['maintenance', 'power'], exercisePool: ACL_P3_REACTIVE.slice(0, 4), schemeKey: 'P4_power_maintain' },
    ],
  },
  {
    name: 'ACL_P4_Black_Field+Gym_2x',
    pathway: 'ACL',
    phase: 'P4',
    level: 'Black',
    environment: 'Field+Gym',
    frequency: '2x',
    description: 'Elite in-season ACL maintenance.',
    durationWeeks: 12,
    blocks: [
      { day: 2, title: 'Strength Maintenance', belt: 'Black', focus: ['maintenance', 'strength'], exercisePool: ACL_P4_MAINTENANCE, schemeKey: 'P4_maintenance' },
      { day: 5, title: 'Power Maintenance', belt: 'Black', focus: ['maintenance', 'power'], exercisePool: ACL_P3_REACTIVE, schemeKey: 'P4_power_maintain' },
    ],
  },

  // ============ PERFORMANCE PATHWAY ============
  {
    name: 'Perf_P2_Blue_Gym_3x',
    pathway: 'Perf',
    phase: 'P2',
    level: 'Blue',
    environment: 'Gym',
    frequency: '3x',
    description: 'General population strength development.',
    durationWeeks: 8,
    blocks: [
      { day: 1, title: 'Lower Strength', belt: 'Blue', focus: ['lower', 'strength'], exercisePool: PERF_STRENGTH_LOWER, schemeKey: 'Perf_strength' },
      { day: 3, title: 'Upper Strength', belt: 'Blue', focus: ['upper', 'strength'], exercisePool: PERF_STRENGTH_UPPER, schemeKey: 'Perf_strength' },
      { day: 5, title: 'Power Development', belt: 'Blue', focus: ['power', 'explosive'], exercisePool: PERF_POWER, schemeKey: 'Perf_power' },
    ],
  },
  {
    name: 'Perf_P2_Black_Gym_4x',
    pathway: 'Perf',
    phase: 'P2',
    level: 'Black',
    environment: 'Gym',
    frequency: '4x',
    description: 'Advanced strength development for higher level athletes.',
    durationWeeks: 8,
    blocks: [
      { day: 1, title: 'Max Lower', belt: 'Black', focus: ['lower', 'maximal'], exercisePool: PERF_STRENGTH_LOWER, schemeKey: 'Perf_strength' },
      { day: 2, title: 'Max Upper', belt: 'Black', focus: ['upper', 'maximal'], exercisePool: PERF_STRENGTH_UPPER, schemeKey: 'Perf_strength' },
      { day: 4, title: 'Power', belt: 'Black', focus: ['power', 'explosive'], exercisePool: PERF_POWER, schemeKey: 'Perf_power' },
      { day: 5, title: 'Hypertrophy', belt: 'Black', focus: ['volume', 'hypertrophy'], exercisePool: PERF_HYPERTROPHY, schemeKey: 'Perf_hypertrophy' },
    ],
  },
  {
    name: 'Perf_P3_Blue_Field+Gym_3x',
    pathway: 'Perf',
    phase: 'P3',
    level: 'Blue',
    environment: 'Field+Gym',
    frequency: '3x',
    description: 'Speed and power integration phase.',
    durationWeeks: 6,
    blocks: [
      { day: 1, title: 'Strength', belt: 'Blue', focus: ['strength', 'compound'], exercisePool: PERF_STRENGTH_LOWER, schemeKey: 'P3_strength' },
      { day: 3, title: 'Speed', belt: 'Blue', focus: ['speed', 'acceleration'], exercisePool: PERF_SPEED, schemeKey: 'P3_speed' },
      { day: 5, title: 'Power', belt: 'Blue', focus: ['power', 'explosive'], exercisePool: PERF_POWER, schemeKey: 'P3_power' },
    ],
  },
  {
    name: 'Perf_P3_Black_Field+Gym_4x',
    pathway: 'Perf',
    phase: 'P3',
    level: 'Black',
    environment: 'Field+Gym',
    frequency: '4x',
    description: 'Elite speed and power development.',
    durationWeeks: 6,
    blocks: [
      { day: 1, title: 'Max Strength', belt: 'Black', focus: ['maximal', 'strength'], exercisePool: PERF_STRENGTH_LOWER, schemeKey: 'P3_strength' },
      { day: 2, title: 'Speed Development', belt: 'Black', focus: ['speed', 'max velocity'], exercisePool: PERF_SPEED, schemeKey: 'P3_speed' },
      { day: 4, title: 'Olympic Lifts', belt: 'Black', focus: ['olympic', 'power'], exercisePool: PERF_POWER, schemeKey: 'P3_power' },
      { day: 5, title: 'Upper Power', belt: 'Black', focus: ['upper', 'power'], exercisePool: PERF_STRENGTH_UPPER, schemeKey: 'P3_power' },
    ],
  },
  {
    name: 'Perf_P4_Blue_InSeason_2x',
    pathway: 'Perf',
    phase: 'P4',
    level: 'Blue',
    environment: 'InSeason',
    frequency: '2x',
    description: 'In-season maintenance for general population.',
    durationWeeks: 12,
    blocks: [
      { day: 2, title: 'Strength Maintain', belt: 'Blue', focus: ['maintenance', 'strength'], exercisePool: PERF_STRENGTH_LOWER, schemeKey: 'P4_maintenance' },
      { day: 5, title: 'Power Maintain', belt: 'Blue', focus: ['maintenance', 'power'], exercisePool: PERF_POWER, schemeKey: 'P4_power_maintain' },
    ],
  },
  {
    name: 'Perf_P4_Black_InSeason_2x',
    pathway: 'Perf',
    phase: 'P4',
    level: 'Black',
    environment: 'InSeason',
    frequency: '2x',
    description: 'Elite athlete in-season. Minimal volume maintenance.',
    durationWeeks: 12,
    blocks: [
      { day: 2, title: 'Strength Maintain', belt: 'Black', focus: ['maintenance', 'strength'], exercisePool: PERF_STRENGTH_LOWER, schemeKey: 'P4_maintenance' },
      { day: 5, title: 'Power Maintain', belt: 'Black', focus: ['maintenance', 'power'], exercisePool: PERF_POWER, schemeKey: 'P4_power_maintain' },
    ],
  },

  // ============ FALLBACK TEMPLATES ============
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
      { day: 2, title: 'Efficient Full Body A', belt: 'Blue', focus: ['efficient', 'compound'], exercisePool: FALLBACK_COMPOUND, schemeKey: 'P2_strength' },
      { day: 5, title: 'Efficient Full Body B', belt: 'Blue', focus: ['efficient', 'compound'], exercisePool: FALLBACK_COMPOUND, schemeKey: 'P2_strength' },
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
      { day: 2, title: 'Light Movement A', belt: 'White', focus: ['recovery', 'mobility'], exercisePool: FALLBACK_DELOAD, schemeKey: 'Mobility' },
      { day: 5, title: 'Light Movement B', belt: 'White', focus: ['recovery', 'mobility'], exercisePool: FALLBACK_DELOAD, schemeKey: 'Deload' },
    ],
  },
  {
    name: 'Fallback_HomeOnly_3x',
    pathway: 'Fallback',
    phase: 'Special',
    level: 'Blue',
    environment: 'Home',
    frequency: '3x',
    description: 'Bodyweight only. For travel or home training.',
    durationWeeks: 1,
    blocks: [
      { day: 1, title: 'Home Lower', belt: 'Blue', focus: ['lower', 'bodyweight'], exercisePool: FALLBACK_HOME_LOWER, schemeKey: 'P2_strength' },
      { day: 3, title: 'Home Upper', belt: 'Blue', focus: ['upper', 'bodyweight'], exercisePool: FALLBACK_HOME_UPPER, schemeKey: 'P2_strength' },
      { day: 5, title: 'Home Full Body', belt: 'Blue', focus: ['full', 'bodyweight'], exercisePool: [...FALLBACK_HOME_LOWER.slice(0, 3), ...FALLBACK_HOME_UPPER.slice(0, 3)], schemeKey: 'P2_strength' },
    ],
  },
];
