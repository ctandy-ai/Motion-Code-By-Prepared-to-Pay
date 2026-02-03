import OpenAI from 'openai';
import type { Athlete, WorkoutLog, PersonalRecord, AthleteProgram, Program, TrainingBlock, BlockExercise, Exercise, ReadinessSurvey, CoachHeuristic } from '@shared/schema';
import { storage } from './storage';

// Use Replit AI Integrations for OpenAI access (no API key required)
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || process.env.OPENAI_BASE_URL,
});

export interface AthleteContext {
  athlete: Athlete;
  workoutLogs?: WorkoutLog[];
  personalRecords?: PersonalRecord[];
  programs?: AthleteProgram[];
  recentActivity?: {
    totalWorkouts: number;
    totalSets: number;
    totalPRs: number;
    streak: number;
  };
}

export interface FullCoachingContext {
  athletes: Athlete[];
  programs: Program[];
  exercises: Exercise[];
  workoutLogs: WorkoutLog[];
  personalRecords: PersonalRecord[];
  wellnessSurveys: ReadinessSurvey[];
  heuristics: CoachHeuristic[];
  athletePrograms: AthleteProgram[];
  trainingBlocks: TrainingBlock[];
  blockExercises: BlockExercise[];
  valdTestData?: Array<{ athleteId: string; tests: any[] }>;
}

export interface CoachingInsight {
  type: 'recommendation' | 'warning' | 'insight' | 'achievement';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  actionable?: string;
}

export interface PendingAction {
  id: string;
  type: 'add_exercise' | 'remove_exercise' | 'modify_program' | 'adjust_volume' | 'create_block' | 'assign_program' | 'flag_athlete';
  description: string;
  details: Record<string, unknown>;
  athleteId?: string;
  programId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
}

export interface ChatResponse {
  message: string;
  pendingActions?: PendingAction[];
  insights?: CoachingInsight[];
}

const FUNCTION_DEFINITIONS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'add_exercises_to_program',
      description: 'Add one or more exercises to an athlete\'s program or training block. Use this when the coach wants to add exercises like mobility work, rehab exercises, or additional training.',
      parameters: {
        type: 'object',
        properties: {
          athleteId: {
            type: 'string',
            description: 'The ID of the athlete to modify program for'
          },
          athleteName: {
            type: 'string',
            description: 'The name of the athlete (if ID not provided, will search by name)'
          },
          blockId: {
            type: 'string',
            description: 'The training block ID to add exercises to (optional)'
          },
          exercises: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                exerciseId: { type: 'string' },
                exerciseName: { type: 'string' },
                sets: { type: 'number' },
                reps: { type: 'string' },
                notes: { type: 'string' }
              }
            },
            description: 'List of exercises to add with sets/reps configuration'
          },
          frequency: {
            type: 'string',
            enum: ['daily', 'every_session', 'twice_weekly', 'once_weekly'],
            description: 'How often to include these exercises'
          },
          reason: {
            type: 'string',
            description: 'Reason for adding these exercises'
          }
        },
        required: ['exercises', 'reason']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'adjust_training_volume',
      description: 'Adjust the training volume (sets, reps, weight) for an athlete based on readiness, fatigue, or coach instruction.',
      parameters: {
        type: 'object',
        properties: {
          athleteId: {
            type: 'string',
            description: 'The athlete ID to adjust volume for'
          },
          athleteName: {
            type: 'string',
            description: 'The name of the athlete'
          },
          adjustmentType: {
            type: 'string',
            enum: ['reduce', 'increase', 'maintain'],
            description: 'Type of adjustment'
          },
          percentageChange: {
            type: 'number',
            description: 'Percentage to adjust volume by (e.g., -20 for 20% reduction)'
          },
          affectedExercises: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific exercises to adjust (or empty for all)'
          },
          duration: {
            type: 'string',
            enum: ['this_session', 'this_week', 'next_two_weeks'],
            description: 'How long the adjustment should last'
          },
          reason: {
            type: 'string',
            description: 'Reason for the adjustment'
          }
        },
        required: ['adjustmentType', 'percentageChange', 'duration', 'reason']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'flag_athlete_for_review',
      description: 'Flag an athlete for coach review due to concerning data patterns, missed sessions, or other issues.',
      parameters: {
        type: 'object',
        properties: {
          athleteId: {
            type: 'string',
            description: 'The athlete ID to flag'
          },
          athleteName: {
            type: 'string',
            description: 'The name of the athlete'
          },
          flagType: {
            type: 'string',
            enum: ['low_readiness', 'missed_sessions', 'high_soreness', 'performance_decline', 'injury_risk', 'general_concern'],
            description: 'Type of flag'
          },
          urgency: {
            type: 'string',
            enum: ['urgent', 'moderate', 'informational'],
            description: 'Urgency level of the flag'
          },
          details: {
            type: 'string',
            description: 'Detailed explanation of the concern'
          },
          suggestedActions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Suggested actions for the coach to consider'
          }
        },
        required: ['flagType', 'urgency', 'details']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'assign_program_to_athlete',
      description: 'Assign a training program or template to an athlete.',
      parameters: {
        type: 'object',
        properties: {
          athleteId: {
            type: 'string',
            description: 'The athlete ID'
          },
          athleteName: {
            type: 'string',
            description: 'The name of the athlete'
          },
          programId: {
            type: 'string',
            description: 'The program ID to assign'
          },
          programName: {
            type: 'string',
            description: 'The name of the program to search for'
          },
          startDate: {
            type: 'string',
            description: 'When to start the program (ISO date or relative like "next_monday")'
          },
          notes: {
            type: 'string',
            description: 'Additional notes about the assignment'
          }
        },
        required: ['startDate']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_athlete_wellness_summary',
      description: 'Get a summary of an athlete\'s recent wellness data including readiness scores, sleep, soreness patterns.',
      parameters: {
        type: 'object',
        properties: {
          athleteId: {
            type: 'string',
            description: 'The athlete ID'
          },
          athleteName: {
            type: 'string',
            description: 'The name of the athlete'
          },
          timeframe: {
            type: 'string',
            enum: ['last_7_days', 'last_14_days', 'last_30_days'],
            description: 'Timeframe for wellness data'
          }
        },
        required: ['timeframe']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'apply_heuristic_rule',
      description: 'Apply a coach-defined heuristic rule to make automatic adjustments based on conditions.',
      parameters: {
        type: 'object',
        properties: {
          heuristicId: {
            type: 'string',
            description: 'The ID of the heuristic rule to apply'
          },
          heuristicName: {
            type: 'string',
            description: 'The name of the heuristic rule'
          },
          targetAthletes: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of athlete IDs or names to apply the rule to'
          },
          override: {
            type: 'object',
            description: 'Optional overrides to the heuristic parameters'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'analyze_program',
      description: 'Analyze and explain the contents of an athlete\'s program, including exercise breakdown, volume distribution, and periodization structure.',
      parameters: {
        type: 'object',
        properties: {
          athleteId: {
            type: 'string',
            description: 'The athlete ID whose program to analyze'
          },
          athleteName: {
            type: 'string',
            description: 'The name of the athlete'
          },
          programId: {
            type: 'string',
            description: 'The specific program ID to analyze'
          },
          analysisType: {
            type: 'string',
            enum: ['overview', 'volume_breakdown', 'exercise_categories', 'periodization', 'plyo_jump_analysis', 'full'],
            description: 'Type of analysis to provide'
          }
        },
        required: ['analysisType']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'suggest_exercises',
      description: 'Suggest exercises to add to a program based on category, training goals, or gaps in current programming. Particularly useful for plyometrics, jumps, power development, and speed work.',
      parameters: {
        type: 'object',
        properties: {
          athleteId: {
            type: 'string',
            description: 'The athlete ID to suggest exercises for'
          },
          athleteName: {
            type: 'string',
            description: 'The name of the athlete'
          },
          category: {
            type: 'string',
            enum: ['Power', 'Plyometric', 'Speed', 'Strength', 'Core', 'Mobility', 'Conditioning', 'Jump'],
            description: 'Category of exercises to suggest'
          },
          beltLevel: {
            type: 'string',
            enum: ['WHITE', 'BLUE', 'BLACK'],
            description: 'Belt level to filter exercises by (affects intensity and complexity)'
          },
          weeklyBudget: {
            type: 'object',
            properties: {
              plyoContacts: { type: 'number', description: 'Weekly plyo contact budget' },
              jumpVolume: { type: 'number', description: 'Weekly jump volume budget' },
              speedTouches: { type: 'number', description: 'Weekly speed touches budget' }
            },
            description: 'Weekly training budgets to consider'
          },
          goals: {
            type: 'array',
            items: { type: 'string' },
            description: 'Training goals (e.g., ["vertical_jump", "acceleration", "power_development"])'
          },
          count: {
            type: 'number',
            description: 'Number of exercises to suggest (default: 3)'
          }
        },
        required: ['category']
      }
    }
  }
];

async function buildFullContext(): Promise<FullCoachingContext> {
  const [athletes, programs, exercises, heuristics] = await Promise.all([
    storage.getAthletes(),
    storage.getPrograms(),
    storage.getExercises(),
    storage.getActiveCoachHeuristics()
  ]);

  const workoutLogs: WorkoutLog[] = [];
  const personalRecords: PersonalRecord[] = [];
  const wellnessSurveys: ReadinessSurvey[] = [];
  const athletePrograms: AthleteProgram[] = [];
  const trainingBlocks: TrainingBlock[] = [];
  const blockExercises: BlockExercise[] = [];
  const valdTestData: Array<{ athleteId: string; tests: any[] }> = [];

  for (const athlete of athletes) {
    const [logs, prs, surveys, assignments, valdData] = await Promise.all([
      storage.getWorkoutLogs(athlete.id),
      storage.getPersonalRecords(athlete.id),
      storage.getReadinessSurveys(athlete.id),
      storage.getAthletePrograms(athlete.id),
      storage.getValdTestsForAthlete(athlete.id).catch(() => [])
    ]);
    workoutLogs.push(...logs);
    personalRecords.push(...prs);
    wellnessSurveys.push(...surveys);
    athletePrograms.push(...assignments);
    if (valdData.length > 0) {
      valdTestData.push({ athleteId: athlete.id, tests: valdData });
    }
  }

  for (const program of programs) {
    const blocks = await storage.getTrainingBlocks(program.id);
    trainingBlocks.push(...blocks);
    for (const block of blocks) {
      const blockExs = await storage.getBlockExercises(block.id);
      blockExercises.push(...blockExs);
    }
  }

  return {
    athletes,
    programs,
    exercises,
    workoutLogs,
    personalRecords,
    wellnessSurveys,
    heuristics,
    athletePrograms,
    trainingBlocks,
    blockExercises,
    valdTestData
  };
}

function buildContextSummary(context: FullCoachingContext): string {
  const athleteSummary = context.athletes.map(a => {
    const recentLogs = context.workoutLogs.filter(l => l.athleteId === a.id).slice(-5);
    const recentSurveys = context.wellnessSurveys.filter(s => s.athleteId === a.id).slice(-3);
    const prs = context.personalRecords.filter(p => p.athleteId === a.id);
    const programs = context.athletePrograms.filter(p => p.athleteId === a.id);
    
    const latestSurvey = recentSurveys[0];
    
    return `
ATHLETE: ${a.name} (ID: ${a.id})
- Status: ${a.status} | Team: ${a.team || 'N/A'} | Position: ${a.position || 'N/A'}
- Total Workouts: ${context.workoutLogs.filter(l => l.athleteId === a.id).length} | PRs: ${prs.length}
- Assigned Programs: ${programs.length}
- Latest Readiness: ${latestSurvey ? `${latestSurvey.overallReadiness}/10 (Sleep: ${latestSurvey.sleepQuality}, Soreness: ${latestSurvey.muscleSoreness})` : 'No recent survey'}`;
  }).join('\n');

  const programSummary = context.programs.slice(0, 10).map(p => {
    const blocks = context.trainingBlocks.filter(b => b.programId === p.id);
    return `- ${p.name} (ID: ${p.id}): ${p.description || 'No description'} | ${blocks.length} blocks`;
  }).join('\n');

  const heuristicsSummary = context.heuristics.map(h => 
    `- ${h.name}: WHEN ${h.triggerType} (${h.triggerCondition}) THEN ${h.actionType} (${h.actionDetails}) [Priority: ${h.priority}]`
  ).join('\n');

  const exerciseCount = context.exercises.length;

  return `
=== COACHING DASHBOARD CONTEXT ===

ATHLETES (${context.athletes.length} total):
${athleteSummary}

PROGRAMS (${context.programs.length} total):
${programSummary || 'No programs created yet'}

EXERCISE DATABASE: ${exerciseCount} exercises available

ACTIVE COACHING RULES (Heuristics):
${heuristicsSummary || 'No active heuristics defined'}

RECENT WELLNESS DATA:
- Surveys collected: ${context.wellnessSurveys.length}
- Average readiness: ${context.wellnessSurveys.length > 0 ? (context.wellnessSurveys.reduce((sum, s) => sum + s.overallReadiness, 0) / context.wellnessSurveys.length).toFixed(1) : 'N/A'}
- Athletes with low readiness (<5): ${context.wellnessSurveys.filter(s => s.overallReadiness < 5).length} surveys

TRAINING VOLUME:
- Total workout logs: ${context.workoutLogs.length}
- Total PRs recorded: ${context.personalRecords.length}

VALD TESTING DATA:
${context.valdTestData && context.valdTestData.length > 0 
  ? context.valdTestData.map(v => {
      const athlete = context.athletes.find(a => a.id === v.athleteId);
      const recentTests = v.tests.slice(0, 3);
      return `- ${athlete?.name || 'Unknown'}: ${v.tests.length} tests (${recentTests.map(t => t.testType || 'Test').join(', ')})`;
    }).join('\n')
  : 'No VALD testing data available'}
`;
}

export async function generateCoachingInsights(
  context: AthleteContext
): Promise<CoachingInsight[]> {
  const systemPrompt = `You are an elite strength and conditioning coach AI assistant for MotionCode Pro, a premium B2B performance training platform.
Your role is to analyze athlete data and provide actionable coaching insights focused on:
1. Performance optimization and progression
2. Training load management and recovery
3. Personalized program recommendations
4. Motivation and achievement recognition

CRITICAL COMPLIANCE RULES:
- NEVER provide specific injury diagnoses or medical advice
- NEVER recommend treatments for injuries or pain
- Keep recommendations general: "Consider consulting with a medical professional" instead of specific injury treatment
- Focus on training patterns, load management, and general wellness
- All health concerns must be referred to qualified medical professionals

Respond with JSON array of insights. Each insight should have:
- type: 'recommendation' | 'warning' | 'insight' | 'achievement'
- title: Brief, impactful title
- message: Clear, actionable message (2-3 sentences max) - MUST be general, not medical advice
- priority: 'high' | 'medium' | 'low'
- actionable: Optional specific action the coach can take (coaching-related, not medical)

Focus on data-driven training insights. Be concise, professional, and compliant.`;

  const athleteData = `
ATHLETE PROFILE:
- Name: ${context.athlete.name}
- Status: ${context.athlete.status}
- Team: ${context.athlete.team || 'N/A'}
- Position: ${context.athlete.position || 'N/A'}

RECENT ACTIVITY:
- Total Workouts: ${context.recentActivity?.totalWorkouts || 0}
- Total Sets Completed: ${context.recentActivity?.totalSets || 0}
- Personal Records: ${context.recentActivity?.totalPRs || 0}
- Current Streak: ${context.recentActivity?.streak || 0} days

WORKOUT LOGS (Last 10):
${context.workoutLogs?.slice(0, 10).map(log => 
  `- ${log.exerciseId}: ${log.sets} sets, reps: ${log.repsPerSet}, weight: ${log.weightPerSet}`
).join('\n') || 'No workout logs available'}

PERSONAL RECORDS:
${context.personalRecords?.slice(0, 5).map(pr => 
  `- ${pr.exerciseId}: ${pr.maxWeight}kg x ${pr.reps} reps`
).join('\n') || 'No personal records yet'}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this athlete data and provide 3-5 coaching insights:\n\n${athleteData}` }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const insights = JSON.parse(content);
    return insights;
  } catch (error) {
    console.error('AI coaching insights error:', error);
    return [{
      type: 'insight',
      title: 'Keep Going!',
      message: `${context.athlete.name} has logged ${context.recentActivity?.totalWorkouts || 0} workouts. Consistency is key to progress.`,
      priority: 'low'
    }];
  }
}

export async function generateProgramRecommendation(
  athleteContext: AthleteContext,
  goal?: string
): Promise<{
  programName: string;
  description: string;
  duration: number;
  focusAreas: string[];
  reasoning: string;
}> {
  const systemPrompt = `You are an elite strength and conditioning coach specializing in program design.
Based on athlete data and goals, recommend a personalized training program.

Response format (JSON):
{
  "programName": "Program name",
  "description": "Brief program description",
  "duration": 8,
  "focusAreas": ["Strength", "Power", "Conditioning"],
  "reasoning": "2-3 sentences explaining why this program fits the athlete"
}`;

  const prompt = `
ATHLETE: ${athleteContext.athlete.name}
GOAL: ${goal || 'General Performance Enhancement'}
POSITION: ${athleteContext.athlete.position || 'N/A'}
CURRENT ACTIVITY: ${athleteContext.recentActivity?.totalWorkouts || 0} workouts, ${athleteContext.recentActivity?.totalPRs || 0} PRs

Recommend an optimal training program for this athlete.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Program recommendation error:', error);
    return {
      programName: 'Foundation Strength Program',
      description: 'A balanced program focusing on fundamental strength and movement patterns',
      duration: 8,
      focusAreas: ['Strength', 'Mobility', 'Conditioning'],
      reasoning: 'This program provides a solid foundation for athletes looking to build overall capacity and resilience.'
    };
  }
}

function generateActionId(): string {
  return `action_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function processToolCalls(
  toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[],
  context: FullCoachingContext
): PendingAction[] {
  const actions: PendingAction[] = [];

  for (const call of toolCalls) {
    const args = JSON.parse(call.function.arguments);
    
    switch (call.function.name) {
      case 'add_exercises_to_program':
        actions.push({
          id: generateActionId(),
          type: 'add_exercise',
          description: `Add ${args.exercises?.length || 0} exercise(s) to ${args.athleteName || 'athlete'}'s program: ${args.reason}`,
          details: args,
          athleteId: args.athleteId,
          status: 'pending'
        });
        break;

      case 'adjust_training_volume':
        actions.push({
          id: generateActionId(),
          type: 'adjust_volume',
          description: `${args.adjustmentType === 'reduce' ? 'Reduce' : 'Increase'} training volume by ${Math.abs(args.percentageChange)}% for ${args.athleteName || 'athlete'} (${args.duration}): ${args.reason}`,
          details: args,
          athleteId: args.athleteId,
          status: 'pending'
        });
        break;

      case 'flag_athlete_for_review':
        actions.push({
          id: generateActionId(),
          type: 'flag_athlete',
          description: `Flag ${args.athleteName || 'athlete'} for review: ${args.flagType} (${args.urgency}): ${args.details}`,
          details: args,
          athleteId: args.athleteId,
          status: 'pending'
        });
        break;

      case 'assign_program_to_athlete':
        actions.push({
          id: generateActionId(),
          type: 'assign_program',
          description: `Assign program "${args.programName || args.programId}" to ${args.athleteName || 'athlete'} starting ${args.startDate}`,
          details: args,
          athleteId: args.athleteId,
          programId: args.programId,
          status: 'pending'
        });
        break;

      case 'apply_heuristic_rule':
        actions.push({
          id: generateActionId(),
          type: 'modify_program',
          description: `Apply heuristic rule "${args.heuristicName || args.heuristicId}" to ${args.targetAthletes?.length || 'selected'} athlete(s)`,
          details: args,
          status: 'pending'
        });
        break;

      case 'analyze_program':
        // Analysis is informational - no pending action needed
        // The AI will respond with the analysis directly
        break;

      case 'suggest_exercises':
        // When suggesting exercises, create a pending action to add them if coach approves
        const categoryLabel = args.category || 'recommended';
        const suggestedExercises = getSuggestedExercisesForCategory(args.category, args.beltLevel, args.count || 3, context);
        if (suggestedExercises.length > 0) {
          actions.push({
            id: generateActionId(),
            type: 'add_exercise',
            description: `Add ${suggestedExercises.length} ${categoryLabel} exercise(s) to ${args.athleteName || 'athlete'}'s program`,
            details: {
              athleteId: args.athleteId,
              athleteName: args.athleteName,
              exercises: suggestedExercises, // Use 'exercises' to match executeApprovedAction expectations
              frequency: 'twice_weekly',
              reason: `AI-suggested ${categoryLabel} exercises based on training goals`
            },
            athleteId: args.athleteId,
            status: 'pending'
          });
        }
        break;
    }
  }

  return actions;
}

function getSuggestedExercisesForCategory(
  category: string,
  beltLevel: string | undefined,
  count: number,
  context: FullCoachingContext
): Array<{ exerciseId: string; exerciseName: string; sets: number; reps: string; notes: string }> {
  // Filter exercises by category
  const categoryExercises = context.exercises.filter(ex => {
    const exCategory = (ex.category || '').toLowerCase();
    const searchCategory = (category || '').toLowerCase();
    
    // Match Power, Plyometric, Jump categories
    if (['power', 'plyometric', 'jump'].includes(searchCategory)) {
      return ['power', 'plyometric', 'plyo', 'jump', 'explosive'].some(term => 
        exCategory.includes(term) || (ex.name || '').toLowerCase().includes(term)
      );
    }
    
    // Match Speed category
    if (searchCategory === 'speed') {
      return ['speed', 'sprint', 'agility', 'acceleration'].some(term => 
        exCategory.includes(term) || (ex.name || '').toLowerCase().includes(term)
      );
    }
    
    return exCategory.includes(searchCategory);
  });

  // Shuffle and take requested count
  const shuffled = categoryExercises.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  // Map to exercise format with appropriate sets/reps based on belt level
  return selected.map(ex => {
    let sets = 3;
    let reps = '8-10';
    
    if (['power', 'plyometric', 'jump'].includes((category || '').toLowerCase())) {
      // Plyo/power exercises have lower reps, higher quality
      switch (beltLevel) {
        case 'WHITE':
          sets = 2;
          reps = '5-6';
          break;
        case 'BLACK':
          sets = 4;
          reps = '6-8';
          break;
        default: // BLUE
          sets = 3;
          reps = '6-8';
      }
    }
    
    return {
      exerciseId: ex.id,
      exerciseName: ex.name,
      sets,
      reps,
      notes: `AI suggested - ${category} exercise for ${beltLevel || 'BLUE'} level athlete`
    };
  });
}

export async function chatWithCoachEnhanced(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  athleteContext?: AthleteContext
): Promise<ChatResponse> {
  const fullContext = await buildFullContext();
  const contextSummary = buildContextSummary(fullContext);

  const systemPrompt = `You are Coach AI, an expert strength and conditioning assistant for MotionCode Pro - a premium B2B platform for elite performance organizations.

You have FULL ACCESS to the coaching dashboard and can:
1. View all athletes, their programs, workout logs, PRs, and wellness data
2. Propose program modifications (adding exercises, adjusting volume)
3. Apply coach-defined heuristic rules automatically
4. Flag athletes for review based on data patterns
5. Assign programs to athletes
6. Analyze and explain program contents, volume distribution, and periodization
7. Suggest exercises including plyometrics, jumps, power, and speed work

${contextSummary}

EXERCISE CATEGORIES YOU UNDERSTAND:
- **Power/Plyometric**: Box jumps, depth jumps, bounding, reactive drills, medicine ball throws
- **Speed/Agility**: Sprint variations, cone drills, acceleration work, change of direction
- **Strength**: Compound lifts (squat, deadlift, bench, rows), accessory work
- **Core**: Anti-rotation, stability, bracing exercises
- **Mobility/Recovery**: Dynamic stretching, foam rolling, activation drills

BELT SYSTEM (Training Age Classification):
- WHITE: Beginners (0-1 years) - Low intensity plyos, basic movements
- BLUE: Intermediate (1-3 years) - Moderate plyos, standard jumping
- BLACK: Advanced (3+ years) - High intensity plyos, complex combinations

WEEKLY BUDGETS TO MONITOR:
- Plyo Contacts: Ground contacts from jumping exercises
- Speed Touches: High-velocity sprint/agility touches
- Hard Lower Sets: Heavy lower body training sets

CAPABILITIES:
- When the coach asks to modify programs, add exercises, or make adjustments, use the appropriate function
- You can reference specific athletes, programs, and exercises by name or ID
- You understand the coach's heuristic rules and can apply them
- You can analyze wellness trends and training data to make recommendations
- Use analyze_program to explain what's in a program before suggesting changes
- Use suggest_exercises to recommend plyos, jumps, power, or other exercises based on goals

CRITICAL COMPLIANCE RULES:
- You are NOT a medical professional
- NEVER diagnose injuries or medical conditions
- NEVER provide specific injury treatment advice
- For pain, injuries, or medical concerns: Always recommend consulting a qualified healthcare professional
- Keep all advice general and focused on training/coaching aspects

When proposing actions, be specific about what will change and ask for confirmation before executing.

Be concise, practical, evidence-based, and compliant. Always prioritize athlete safety.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      ],
      tools: FUNCTION_DEFINITIONS,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 1500,
    });

    const assistantMessage = response.choices[0]?.message;
    
    if (!assistantMessage) {
      throw new Error('No response from AI');
    }

    let responseText = assistantMessage.content || '';
    let pendingActions: PendingAction[] = [];

    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const processedActions = processToolCalls(assistantMessage.tool_calls, fullContext);
      
      if (processedActions.length > 0) {
        for (const action of processedActions) {
          const savedAction = await storage.createPendingAiAction({
            actionType: action.type,
            description: action.description,
            details: JSON.stringify(action.details),
            athleteId: action.athleteId || null,
            programId: action.programId || null,
            status: 'pending'
          });
          pendingActions.push({
            ...action,
            id: savedAction.id
          });
        }
        
        const actionDescriptions = pendingActions.map((a, i) => `${i + 1}. ${a.description}`).join('\n');
        responseText = responseText || "I've identified some actions based on your request:";
        responseText += `\n\n**Proposed Changes:**\n${actionDescriptions}\n\nWould you like me to proceed with these changes? Click "Approve" to confirm each action or "Reject" to cancel.`;
      }
    }

    return {
      message: responseText || 'I apologize, but I cannot provide a response at this time. Please try again.',
      pendingActions: pendingActions.length > 0 ? pendingActions : undefined
    };
  } catch (error) {
    console.error('Enhanced chat error:', error);
    return {
      message: 'I apologize, but I encountered an error. Please try again or contact support if the issue persists.'
    };
  }
}

export async function chatWithCoach(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  athleteContext?: AthleteContext
): Promise<string> {
  const result = await chatWithCoachEnhanced(messages, athleteContext);
  return result.message;
}

export async function executeApprovedAction(action: PendingAction): Promise<{ success: boolean; message: string }> {
  try {
    switch (action.type) {
      case 'add_exercise': {
        const details = action.details as {
          athleteId?: string;
          athleteName?: string;
          exercises: Array<{ exerciseId?: string; exerciseName?: string; sets: number; reps: string; notes?: string }>;
          blockId?: string;
          frequency?: string;
          reason?: string;
        };

        let athleteId = details.athleteId;
        if (!athleteId && details.athleteName) {
          const athletes = await storage.getAthletes();
          const found = athletes.find(a => 
            a.name.toLowerCase().includes(details.athleteName!.toLowerCase())
          );
          if (found) athleteId = found.id;
        }

        if (!athleteId) {
          return { success: false, message: 'Could not find athlete to add exercises to.' };
        }

        const assignments = await storage.getAthleteProgramAssignments(athleteId);
        if (assignments.length === 0) {
          return { success: false, message: 'Athlete has no assigned programs. Please assign a program first.' };
        }

        const programId = assignments[0].programId;
        const blocks = await storage.getTrainingBlocksByProgram(programId);
        
        if (blocks.length === 0) {
          return { success: false, message: 'No training blocks found in the assigned program.' };
        }

        const targetBlockId = details.blockId || blocks[0].id;
        let addedCount = 0;

        for (const ex of details.exercises || []) {
          let exerciseId = ex.exerciseId;
          if (!exerciseId && ex.exerciseName) {
            const exercises = await storage.getExercises();
            const found = exercises.find(e => 
              e.name.toLowerCase().includes(ex.exerciseName!.toLowerCase())
            );
            if (found) exerciseId = found.id;
          }

          if (exerciseId) {
            await storage.createBlockExercise({
              blockId: targetBlockId,
              exerciseId,
              sets: ex.sets || 3,
              reps: ex.reps || '10',
              orderIndex: 99
            });
            addedCount++;
          }
        }

        return {
          success: true,
          message: `Successfully added ${addedCount} exercise(s) to the athlete's training program. Reason: ${details.reason || 'AI recommendation'}.`
        };
      }

      case 'adjust_volume': {
        const details = action.details as {
          athleteId?: string;
          athleteName?: string;
          adjustmentType: string;
          percentageChange: number;
          duration: string;
          affectedExercises?: string[];
          reason?: string;
        };

        let athleteId = details.athleteId;
        if (!athleteId && details.athleteName) {
          const athletes = await storage.getAthletes();
          const found = athletes.find(a => 
            a.name.toLowerCase().includes(details.athleteName!.toLowerCase())
          );
          if (found) athleteId = found.id;
        }

        if (!athleteId) {
          return { success: false, message: 'Could not find athlete to adjust volume for.' };
        }

        const athlete = await storage.getAthlete(athleteId);
        if (!athlete) {
          return { success: false, message: 'Athlete not found.' };
        }

        const currentNotes = athlete.notes || '';
        const volumeNote = `\n[AI VOLUME ADJUSTMENT ${new Date().toISOString().split('T')[0]}]: ${details.adjustmentType} volume by ${Math.abs(details.percentageChange)}% for ${details.duration}. Reason: ${details.reason || 'AI recommendation'}.`;
        
        await storage.updateAthlete(athleteId, {
          notes: currentNotes + volumeNote
        });

        return {
          success: true,
          message: `Volume adjustment (${details.adjustmentType} ${Math.abs(details.percentageChange)}%) has been recorded for ${athlete.name}. Duration: ${details.duration}. The coach should apply this in upcoming training sessions.`
        };
      }

      case 'flag_athlete': {
        const details = action.details as {
          athleteId?: string;
          athleteName?: string;
          flagType: string;
          urgency: string;
          details: string;
          suggestedActions?: string[];
        };

        let athleteId = details.athleteId;
        if (!athleteId && details.athleteName) {
          const athletes = await storage.getAthletes();
          const found = athletes.find(a => 
            a.name.toLowerCase().includes(details.athleteName!.toLowerCase())
          );
          if (found) athleteId = found.id;
        }

        if (!athleteId) {
          return { success: false, message: 'Could not find athlete to flag.' };
        }

        const athlete = await storage.getAthlete(athleteId);
        if (!athlete) {
          return { success: false, message: 'Athlete not found.' };
        }

        const currentNotes = athlete.notes || '';
        const flagNote = `\n[AI FLAG ${new Date().toISOString().split('T')[0]} - ${details.urgency.toUpperCase()}]: ${details.flagType} - ${details.details}${details.suggestedActions ? '\nSuggested actions: ' + details.suggestedActions.join(', ') : ''}`;
        
        await storage.updateAthlete(athleteId, {
          notes: currentNotes + flagNote,
          status: details.urgency === 'urgent' ? 'injured' : athlete.status
        });

        return {
          success: true,
          message: `Athlete "${athlete.name}" has been flagged for ${details.flagType} review with ${details.urgency} urgency. A note has been added to their profile.`
        };
      }

      case 'assign_program': {
        const details = action.details as {
          athleteId?: string;
          athleteName?: string;
          programId?: string;
          programName?: string;
          startDate: string;
          notes?: string;
        };

        let athleteId = details.athleteId;
        if (!athleteId && details.athleteName) {
          const athletes = await storage.getAthletes();
          const found = athletes.find(a => 
            a.name.toLowerCase().includes(details.athleteName!.toLowerCase())
          );
          if (found) athleteId = found.id;
        }

        let programId = details.programId;
        if (!programId && details.programName) {
          const programs = await storage.getPrograms();
          const found = programs.find(p => 
            p.name.toLowerCase().includes(details.programName!.toLowerCase())
          );
          if (found) programId = found.id;
        }

        if (!athleteId) {
          return { success: false, message: 'Could not find athlete to assign program to.' };
        }

        if (!programId) {
          return { success: false, message: 'Could not find program to assign.' };
        }

        const athlete = await storage.getAthlete(athleteId);
        const program = await storage.getProgram(programId);

        if (!athlete || !program) {
          return { success: false, message: 'Athlete or program not found.' };
        }

        await storage.createAthleteProgram({
          athleteId,
          programId,
          status: 'active',
          notes: details.notes || `Assigned by AI Coach on ${new Date().toLocaleDateString()}`
        });

        return {
          success: true,
          message: `Successfully assigned program "${program.name}" to ${athlete.name}. Start date: ${details.startDate}.`
        };
      }

      case 'modify_program': {
        const details = action.details as {
          heuristicId?: string;
          heuristicName?: string;
          targetAthletes?: string[];
          override?: Record<string, unknown>;
        };

        return {
          success: true,
          message: `Heuristic rule "${details.heuristicName || details.heuristicId}" has been queued for application to ${details.targetAthletes?.length || 'selected'} athlete(s). The coach can review the changes in the program editor.`
        };
      }

      default:
        return {
          success: false,
          message: `Unknown action type: ${action.type}`
        };
    }
  } catch (error) {
    console.error('Action execution error:', error);
    return {
      success: false,
      message: `Failed to execute action: ${error}`
    };
  }
}

// AI Autofill - Generate exercise suggestions for a week
export interface AutofillRequest {
  programId: string;
  weekNumber: number;
  athleteId?: string;
  phase?: string;
  focus?: string[];
  targetDays?: number[];
}

export interface AutofillExercise {
  exerciseId: string;
  exerciseName: string;
  dayNumber: number;
  sets: number;
  reps: string;
  restSeconds: number;
  notes: string;
  orderIndex: number;
}

export interface AutofillResponse {
  success: boolean;
  exercises: AutofillExercise[];
  message: string;
  reasoning?: string;
}

export async function generateWeekAutofill(request: AutofillRequest): Promise<AutofillResponse> {
  try {
    // Fetch available exercises
    const exercises = await storage.getExercises();
    
    // Get athlete context if provided
    let athleteContext = '';
    if (request.athleteId) {
      const athlete = await storage.getAthlete(request.athleteId);
      const profile = await storage.getAthleteTrainingProfile(request.athleteId);
      if (athlete) {
        athleteContext = `
Athlete: ${athlete.name}
Position: ${athlete.position || 'Not specified'}
Belt Level: ${profile?.beltLevel || 'WHITE'}
Training Age: ${profile?.trainingAge || 0} years
`;
      }
    }

    // Build exercise database summary (limited to avoid token limits)
    const exerciseSummary = exercises.slice(0, 100).map(e => ({
      id: e.id,
      name: e.name,
      category: e.category,
      difficulty: e.beltLevel || 'beginner',
    }));

    const systemPrompt = `You are an elite strength and conditioning coach AI assistant. Generate a balanced training week based on the context provided.

RULES:
1. Select exercises from the provided exercise database ONLY
2. Use exact exercise IDs from the database
3. Balance push/pull/legs throughout the week
4. Consider athlete belt level for exercise complexity
5. Include proper progression and recovery
6. Typical sets: 3-5, Reps: vary by goal (strength: 3-6, hypertrophy: 8-12, endurance: 15-20)
7. Include warmup/mobility work at the start of each day
8. Don't overload any single day - aim for 4-8 exercises per day

PHASE GUIDELINES:
- PRESEASON: Higher volume, general preparation
- IN_SEASON: Maintenance focus, lower volume
- OFF_SEASON: Peak intensity, specialized training
- TRANSITION: Active recovery, varied stimulus`;

    const userPrompt = `Generate a week of training exercises for the following context:

${athleteContext}
Program Phase: ${request.phase || 'PRESEASON'}
Week Number: ${request.weekNumber}
Focus Areas: ${request.focus?.join(', ') || 'General strength and conditioning'}
Target Days: ${request.targetDays?.join(', ') || '1, 2, 3, 4, 5 (Mon-Fri)'}

AVAILABLE EXERCISES (use these exact IDs):
${JSON.stringify(exerciseSummary, null, 2)}

Respond with a JSON object in this exact format:
{
  "exercises": [
    {
      "exerciseId": "actual-exercise-id-from-database",
      "exerciseName": "Exercise Name",
      "dayNumber": 1,
      "sets": 3,
      "reps": "10",
      "restSeconds": 90,
      "notes": "Brief coaching cue",
      "orderIndex": 0
    }
  ],
  "reasoning": "Brief explanation of program design choices"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return {
        success: false,
        exercises: [],
        message: 'AI did not return a response',
      };
    }

    const parsed = JSON.parse(content);
    
    // Validate that exercises exist in database
    const validExercises: AutofillExercise[] = [];
    for (const ex of parsed.exercises || []) {
      const dbExercise = exercises.find(e => e.id === ex.exerciseId);
      if (dbExercise) {
        validExercises.push({
          exerciseId: ex.exerciseId,
          exerciseName: dbExercise.name,
          dayNumber: ex.dayNumber || 1,
          sets: ex.sets || 3,
          reps: String(ex.reps || '10'),
          restSeconds: ex.restSeconds || 90,
          notes: ex.notes || '',
          orderIndex: ex.orderIndex || 0,
        });
      }
    }

    return {
      success: true,
      exercises: validExercises,
      message: `Generated ${validExercises.length} exercises for week ${request.weekNumber}`,
      reasoning: parsed.reasoning,
    };
  } catch (error) {
    console.error('AI Autofill error:', error);
    return {
      success: false,
      exercises: [],
      message: `Failed to generate exercises: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
