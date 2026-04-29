import Anthropic from "@anthropic-ai/sdk";
import { anthropic, CHAT_MODEL, INTELLIGENCE_MODEL, checkRateLimit } from "./ai-client";
import type {
  Athlete,
  WorkoutLog,
  PersonalRecord,
  AthleteProgram,
  Program,
  TrainingBlock,
  BlockExercise,
  Exercise,
  ReadinessSurvey,
  CoachHeuristic,
} from "@shared/schema";
import { storage as _storage } from "./storage";
const storage = _storage as any;

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
  type: "recommendation" | "warning" | "insight" | "achievement";
  title: string;
  message: string;
  priority: "high" | "medium" | "low";
  actionable?: string;
}

export interface PendingAction {
  id: string;
  type:
    | "add_exercise"
    | "remove_exercise"
    | "modify_program"
    | "adjust_volume"
    | "create_block"
    | "assign_program"
    | "flag_athlete";
  description: string;
  details: Record<string, unknown>;
  athleteId?: string;
  programId?: string;
  status: "pending" | "approved" | "rejected" | "executed";
}

export interface ChatResponse {
  message: string;
  pendingActions?: PendingAction[];
  insights?: CoachingInsight[];
}

// ---------------------------------------------------------------------------
// Anthropic tool definitions (replaces OpenAI FUNCTION_DEFINITIONS)
// ---------------------------------------------------------------------------
const TOOLS: Anthropic.Tool[] = [
  {
    name: "add_exercises_to_program",
    description:
      "Add one or more exercises to an athlete's program or training block. Use this when the coach wants to add exercises like mobility work, rehab exercises, or additional training.",
    input_schema: {
      type: "object" as const,
      properties: {
        athleteId: { type: "string", description: "The ID of the athlete to modify program for" },
        athleteName: { type: "string", description: "The name of the athlete (if ID not provided, will search by name)" },
        blockId: { type: "string", description: "The training block ID to add exercises to (optional)" },
        exercises: {
          type: "array",
          items: {
            type: "object",
            properties: {
              exerciseId: { type: "string" },
              exerciseName: { type: "string" },
              sets: { type: "number" },
              reps: { type: "string" },
              notes: { type: "string" },
            },
          },
          description: "List of exercises to add with sets/reps configuration",
        },
        frequency: {
          type: "string",
          enum: ["daily", "every_session", "twice_weekly", "once_weekly"],
          description: "How often to include these exercises",
        },
        reason: { type: "string", description: "Reason for adding these exercises" },
      },
      required: ["exercises", "reason"],
    },
  },
  {
    name: "adjust_training_volume",
    description: "Adjust the training volume (sets, reps, weight) for an athlete based on readiness, fatigue, or coach instruction.",
    input_schema: {
      type: "object" as const,
      properties: {
        athleteId: { type: "string" },
        athleteName: { type: "string" },
        adjustmentType: { type: "string", enum: ["reduce", "increase", "maintain"] },
        percentageChange: { type: "number", description: "Percentage to adjust by (e.g., -20 for 20% reduction)" },
        affectedExercises: { type: "array", items: { type: "string" } },
        duration: { type: "string", enum: ["this_session", "this_week", "next_two_weeks"] },
        reason: { type: "string" },
      },
      required: ["adjustmentType", "percentageChange", "duration", "reason"],
    },
  },
  {
    name: "flag_athlete_for_review",
    description: "Flag an athlete for coach review due to concerning data patterns, missed sessions, or other issues.",
    input_schema: {
      type: "object" as const,
      properties: {
        athleteId: { type: "string" },
        athleteName: { type: "string" },
        flagType: {
          type: "string",
          enum: ["low_readiness", "missed_sessions", "high_soreness", "performance_decline", "injury_risk", "general_concern"],
        },
        urgency: { type: "string", enum: ["urgent", "moderate", "informational"] },
        details: { type: "string" },
        suggestedActions: { type: "array", items: { type: "string" } },
      },
      required: ["flagType", "urgency", "details"],
    },
  },
  {
    name: "assign_program_to_athlete",
    description: "Assign a training program or template to an athlete.",
    input_schema: {
      type: "object" as const,
      properties: {
        athleteId: { type: "string" },
        athleteName: { type: "string" },
        programId: { type: "string" },
        programName: { type: "string" },
        startDate: { type: "string", description: "ISO date or relative like 'next_monday'" },
        notes: { type: "string" },
      },
      required: ["startDate"],
    },
  },
  {
    name: "get_athlete_wellness_summary",
    description: "Get a summary of an athlete's recent wellness data.",
    input_schema: {
      type: "object" as const,
      properties: {
        athleteId: { type: "string" },
        athleteName: { type: "string" },
        timeframe: { type: "string", enum: ["last_7_days", "last_14_days", "last_30_days"] },
      },
      required: ["timeframe"],
    },
  },
  {
    name: "apply_heuristic_rule",
    description: "Apply a coach-defined heuristic rule to make automatic adjustments based on conditions.",
    input_schema: {
      type: "object" as const,
      properties: {
        heuristicId: { type: "string" },
        heuristicName: { type: "string" },
        targetAthletes: { type: "array", items: { type: "string" } },
        override: { type: "object" },
      },
      required: [],
    },
  },
  {
    name: "analyze_program",
    description: "Analyse and explain the contents of an athlete's program, including exercise breakdown, volume distribution, and periodisation structure.",
    input_schema: {
      type: "object" as const,
      properties: {
        athleteId: { type: "string" },
        athleteName: { type: "string" },
        programId: { type: "string" },
        analysisType: {
          type: "string",
          enum: ["overview", "volume_breakdown", "exercise_categories", "periodization", "plyo_jump_analysis", "full"],
        },
      },
      required: ["analysisType"],
    },
  },
  {
    name: "suggest_exercises",
    description: "Suggest exercises based on category, training goals, or gaps in current programming.",
    input_schema: {
      type: "object" as const,
      properties: {
        athleteId: { type: "string" },
        athleteName: { type: "string" },
        category: {
          type: "string",
          enum: ["Power", "Plyometric", "Speed", "Strength", "Core", "Mobility", "Conditioning", "Jump"],
        },
        beltLevel: { type: "string", enum: ["WHITE", "BLUE", "BLACK"] },
        weeklyBudget: {
          type: "object",
          properties: {
            plyoContacts: { type: "number" },
            jumpVolume: { type: "number" },
            speedTouches: { type: "number" },
          },
        },
        goals: { type: "array", items: { type: "string" } },
        count: { type: "number" },
      },
      required: ["category"],
    },
  },
];

// ---------------------------------------------------------------------------
// Context builders
// ---------------------------------------------------------------------------
async function buildFullContext(): Promise<FullCoachingContext> {
  const [athletes, programs, exercises, heuristics] = await Promise.all([
    storage.getAthletes(),
    storage.getPrograms(),
    storage.getAllExercises(),
    storage.getActiveCoachHeuristics(),
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
      storage.getValdTestsForAthlete(athlete.id).catch(() => []),
    ]);
    workoutLogs.push(...logs);
    personalRecords.push(...prs);
    wellnessSurveys.push(...surveys);
    athletePrograms.push(...assignments);
    if (valdData.length > 0) valdTestData.push({ athleteId: athlete.id, tests: valdData });
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
    valdTestData,
  };
}

function buildContextSummary(context: FullCoachingContext): string {
  const athleteSummary = context.athletes
    .map(a => {
      const recentLogs = context.workoutLogs.filter(l => l.athleteId === a.id).slice(-5);
      const recentSurveys = context.wellnessSurveys.filter(s => s.athleteId === a.id).slice(-3);
      const prs = context.personalRecords.filter(p => p.athleteId === a.id);
      const programs = context.athletePrograms.filter(p => p.athleteId === a.id);
      const latestSurvey = recentSurveys[0];

      return `
ATHLETE: ${a.name} (ID: ${a.id})
- Status: ${a.status} | Team: ${a.team || "N/A"} | Position: ${a.position || "N/A"}
- Total Workouts: ${context.workoutLogs.filter(l => l.athleteId === a.id).length} | PRs: ${prs.length}
- Assigned Programs: ${programs.length}
- Latest Readiness: ${
        latestSurvey
          ? `${latestSurvey.overallReadiness}/10 (Sleep: ${latestSurvey.sleepQuality}, Soreness: ${latestSurvey.muscleSoreness})`
          : "No recent survey"
      }`;
    })
    .join("\n");

  const programSummary = context.programs
    .slice(0, 10)
    .map(p => {
      const blocks = context.trainingBlocks.filter(b => b.programId === p.id);
      return `- ${p.name} (ID: ${p.id}): ${p.description || "No description"} | ${blocks.length} blocks`;
    })
    .join("\n");

  const heuristicsSummary = context.heuristics
    .map(
      h =>
        `- ${h.name}: WHEN ${h.triggerType} (${h.triggerCondition}) THEN ${h.actionType} (${h.actionDetails}) [Priority: ${h.priority}]`
    )
    .join("\n");

  return `
=== COACHING DASHBOARD CONTEXT ===

ATHLETES (${context.athletes.length} total):
${athleteSummary}

PROGRAMS (${context.programs.length} total):
${programSummary || "No programs created yet"}

EXERCISE DATABASE: ${context.exercises.length} exercises available

ACTIVE COACHING RULES (Heuristics):
${heuristicsSummary || "No active heuristics defined"}

RECENT WELLNESS DATA:
- Surveys collected: ${context.wellnessSurveys.length}
- Average readiness: ${
    context.wellnessSurveys.length > 0
      ? (
          context.wellnessSurveys.reduce((sum, s) => sum + s.overallReadiness, 0) /
          context.wellnessSurveys.length
        ).toFixed(1)
      : "N/A"
  }
- Athletes with low readiness (<5): ${context.wellnessSurveys.filter(s => s.overallReadiness < 5).length} surveys

TRAINING VOLUME:
- Total workout logs: ${context.workoutLogs.length}
- Total PRs recorded: ${context.personalRecords.length}

VALD TESTING DATA:
${
  context.valdTestData && context.valdTestData.length > 0
    ? context.valdTestData
        .map(v => {
          const athlete = context.athletes.find(a => a.id === v.athleteId);
          const recentTests = v.tests.slice(0, 3);
          return `- ${athlete?.name || "Unknown"}: ${v.tests.length} tests (${recentTests.map((t: any) => t.testType || "Test").join(", ")})`;
        })
        .join("\n")
    : "No VALD testing data available"
}
`;
}

// ---------------------------------------------------------------------------
// Insights generation
// ---------------------------------------------------------------------------
export async function generateCoachingInsights(context: AthleteContext): Promise<CoachingInsight[]> {
  const systemPrompt = `You are an elite strength and conditioning coach AI assistant for MotionCode Pro.
Analyse athlete data and provide 3-5 actionable coaching insights as a JSON array.
Each insight: { "type": "recommendation"|"warning"|"insight"|"achievement", "title": "...", "message": "...", "priority": "high"|"medium"|"low", "actionable": "..." }
NEVER provide medical diagnoses or injury treatment advice.`;

  const athleteData = `
ATHLETE: ${context.athlete.name}
Status: ${context.athlete.status} | Team: ${context.athlete.team || "N/A"} | Position: ${context.athlete.position || "N/A"}
Workouts: ${context.recentActivity?.totalWorkouts || 0} | Sets: ${context.recentActivity?.totalSets || 0} | PRs: ${context.recentActivity?.totalPRs || 0} | Streak: ${context.recentActivity?.streak || 0} days

RECENT WORKOUT LOGS:
${context.workoutLogs?.slice(0, 10).map(log => `- ${log.exerciseId}: ${log.sets} sets, reps: ${log.repsPerSet}, weight: ${log.weightPerSet}`).join("\n") || "None"}

PERSONAL RECORDS:
${context.personalRecords?.slice(0, 5).map(pr => `- ${pr.exerciseId}: ${pr.maxWeight}kg x ${pr.reps} reps`).join("\n") || "None"}`;

  try {
    const response = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: `Analyse this athlete and provide insights:\n\n${athleteData}\n\nRespond with a JSON array only.` }],
    });

    const content = response.content[0]?.type === "text" ? response.content[0].text : "[]";
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("AI coaching insights error:", error);
    return [
      {
        type: "insight",
        title: "Keep Going!",
        message: `${context.athlete.name} has logged ${context.recentActivity?.totalWorkouts || 0} workouts. Consistency is key to progress.`,
        priority: "low",
      },
    ];
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
  const prompt = `ATHLETE: ${athleteContext.athlete.name}
GOAL: ${goal || "General Performance Enhancement"}
POSITION: ${athleteContext.athlete.position || "N/A"}
ACTIVITY: ${athleteContext.recentActivity?.totalWorkouts || 0} workouts, ${athleteContext.recentActivity?.totalPRs || 0} PRs

Recommend an optimal training program. Respond with ONLY a JSON object:
{
  "programName": "string",
  "description": "string",
  "duration": 8,
  "focusAreas": ["Strength","Power","Conditioning"],
  "reasoning": "2-3 sentences"
}`;

  try {
    const response = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 500,
      system: "You are an elite S&C coach. Respond only with valid JSON.",
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0]?.type === "text" ? response.content[0].text : "{}";
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Program recommendation error:", error);
    return {
      programName: "Foundation Strength Program",
      description: "A balanced program focusing on fundamental strength and movement patterns",
      duration: 8,
      focusAreas: ["Strength", "Mobility", "Conditioning"],
      reasoning: "This program provides a solid foundation for athletes looking to build overall capacity and resilience.",
    };
  }
}

// ---------------------------------------------------------------------------
// Tool call processing (Anthropic format)
// ---------------------------------------------------------------------------
function generateActionId(): string {
  return `action_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function processToolUse(
  toolUseBlocks: Anthropic.ToolUseBlock[],
  context: FullCoachingContext
): PendingAction[] {
  const actions: PendingAction[] = [];

  for (const block of toolUseBlocks) {
    const args = block.input as Record<string, any>;

    switch (block.name) {
      case "add_exercises_to_program":
        actions.push({
          id: generateActionId(),
          type: "add_exercise",
          description: `Add ${args.exercises?.length || 0} exercise(s) to ${args.athleteName || "athlete"}'s program: ${args.reason}`,
          details: args,
          athleteId: args.athleteId,
          status: "pending",
        });
        break;

      case "adjust_training_volume":
        actions.push({
          id: generateActionId(),
          type: "adjust_volume",
          description: `${args.adjustmentType === "reduce" ? "Reduce" : "Increase"} training volume by ${Math.abs(args.percentageChange)}% for ${args.athleteName || "athlete"} (${args.duration}): ${args.reason}`,
          details: args,
          athleteId: args.athleteId,
          status: "pending",
        });
        break;

      case "flag_athlete_for_review":
        actions.push({
          id: generateActionId(),
          type: "flag_athlete",
          description: `Flag ${args.athleteName || "athlete"} for review: ${args.flagType} (${args.urgency}): ${args.details}`,
          details: args,
          athleteId: args.athleteId,
          status: "pending",
        });
        break;

      case "assign_program_to_athlete":
        actions.push({
          id: generateActionId(),
          type: "assign_program",
          description: `Assign program "${args.programName || args.programId}" to ${args.athleteName || "athlete"} starting ${args.startDate}`,
          details: args,
          athleteId: args.athleteId,
          programId: args.programId,
          status: "pending",
        });
        break;

      case "apply_heuristic_rule":
        actions.push({
          id: generateActionId(),
          type: "modify_program",
          description: `Apply heuristic rule "${args.heuristicName || args.heuristicId}" to ${args.targetAthletes?.length || "selected"} athlete(s)`,
          details: args,
          status: "pending",
        });
        break;

      case "analyze_program":
        // Informational — no pending action needed, AI will respond with analysis
        break;

      case "suggest_exercises": {
        const categoryLabel = args.category || "recommended";
        const suggestedExercises = getSuggestedExercisesForCategory(args.category, args.beltLevel, args.count || 3, context);
        if (suggestedExercises.length > 0) {
          actions.push({
            id: generateActionId(),
            type: "add_exercise",
            description: `Add ${suggestedExercises.length} ${categoryLabel} exercise(s) to ${args.athleteName || "athlete"}'s program`,
            details: {
              athleteId: args.athleteId,
              athleteName: args.athleteName,
              exercises: suggestedExercises,
              frequency: "twice_weekly",
              reason: `AI-suggested ${categoryLabel} exercises based on training goals`,
            },
            athleteId: args.athleteId,
            status: "pending",
          });
        }
        break;
      }
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
  const categoryExercises = context.exercises.filter(ex => {
    const exCategory = (ex.category || "").toLowerCase();
    const searchCategory = (category || "").toLowerCase();

    if (["power", "plyometric", "jump"].includes(searchCategory)) {
      return ["power", "plyometric", "plyo", "jump", "explosive"].some(
        term => exCategory.includes(term) || (ex.name || "").toLowerCase().includes(term)
      );
    }
    if (searchCategory === "speed") {
      return ["speed", "sprint", "agility", "acceleration"].some(
        term => exCategory.includes(term) || (ex.name || "").toLowerCase().includes(term)
      );
    }
    return exCategory.includes(searchCategory);
  });

  const shuffled = categoryExercises.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  return selected.map(ex => {
    let sets = 3;
    let reps = "8-10";

    if (["power", "plyometric", "jump"].includes((category || "").toLowerCase())) {
      switch (beltLevel) {
        case "WHITE":
          sets = 2;
          reps = "5-6";
          break;
        case "BLACK":
          sets = 4;
          reps = "6-8";
          break;
        default:
          sets = 3;
          reps = "6-8";
      }
    }

    return {
      exerciseId: ex.id,
      exerciseName: ex.name,
      sets,
      reps,
      notes: `AI suggested - ${category} exercise for ${beltLevel || "BLUE"} level athlete`,
    };
  });
}

// ---------------------------------------------------------------------------
// Main chat function — Anthropic tool use
// ---------------------------------------------------------------------------
export async function chatWithCoachEnhanced(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  athleteContext?: AthleteContext,
  userId?: string,
  tier: "season" | "pro" = "season"
): Promise<ChatResponse> {
  // Rate limiting
  if (userId) {
    const rateCheck = checkRateLimit(userId, tier);
    if (!rateCheck.allowed) {
      const resetTime = rateCheck.resetAt.toLocaleTimeString();
      return {
        message: `You've reached your daily AI message limit (${tier === "pro" ? 200 : 50} messages). Your limit resets at ${resetTime}. Upgrade to Pro for a higher limit.`,
      };
    }
  }

  const fullContext = await buildFullContext();
  const contextSummary = buildContextSummary(fullContext);

  const systemPrompt = `You are Coach AI, an expert strength and conditioning assistant for MotionCode Pro — a premium B2B platform for elite performance organisations.

You have FULL ACCESS to the coaching dashboard and can:
1. View all athletes, programs, workout logs, PRs, and wellness data
2. Propose program modifications (adding exercises, adjusting volume)
3. Apply coach-defined heuristic rules automatically
4. Flag athletes for review based on data patterns
5. Assign programs to athletes
6. Analyse and explain program contents, volume distribution, and periodisation
7. Suggest exercises including plyometrics, jumps, power, and speed work

${contextSummary}

BELT SYSTEM:
- WHITE: Beginners (0-1 years) — Low intensity plyos, basic movements
- BLUE: Intermediate (1-3 years) — Moderate plyos, standard jumping
- BLACK: Advanced (3+ years) — High intensity plyos, complex combinations

CRITICAL COMPLIANCE RULES:
- You are NOT a medical professional
- NEVER diagnose injuries or provide injury treatment advice
- For pain/injuries/medical concerns: always recommend consulting a qualified healthcare professional
- Keep all advice general and focused on training/coaching aspects

When proposing actions, be specific about what will change and ask for confirmation before executing. Be concise, practical, and evidence-based.`;

  try {
    const response = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 1500,
      system: systemPrompt,
      tools: TOOLS,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    // Extract text blocks and tool use blocks
    const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text");
    const toolUseBlocks = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");

    let responseText = textBlocks.map(b => b.text).join("\n").trim();
    let pendingActions: PendingAction[] = [];

    if (toolUseBlocks.length > 0) {
      const processedActions = processToolUse(toolUseBlocks, fullContext);

      if (processedActions.length > 0) {
        for (const action of processedActions) {
          const savedAction = await storage.createPendingAiAction({
            actionType: action.type,
            description: action.description,
            details: JSON.stringify(action.details),
            athleteId: action.athleteId || null,
            programId: action.programId || null,
            status: "pending",
          });
          pendingActions.push({ ...action, id: savedAction.id });
        }

        const actionDescriptions = pendingActions.map((a, i) => `${i + 1}. ${a.description}`).join("\n");
        responseText = responseText || "I've identified some actions based on your request:";
        responseText += `\n\n**Proposed Changes:**\n${actionDescriptions}\n\nWould you like me to proceed with these changes? Click "Approve" to confirm each action or "Reject" to cancel.`;
      }
    }

    return {
      message: responseText || "I apologise, but I cannot provide a response at this time. Please try again.",
      pendingActions: pendingActions.length > 0 ? pendingActions : undefined,
    };
  } catch (error) {
    console.error("Enhanced chat error:", error);
    return {
      message: "I apologise, but I encountered an error. Please try again or contact support if the issue persists.",
    };
  }
}

export async function chatWithCoach(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  athleteContext?: AthleteContext
): Promise<string> {
  const result = await chatWithCoachEnhanced(messages, athleteContext);
  return result.message;
}

// ---------------------------------------------------------------------------
// Execute approved action
// ---------------------------------------------------------------------------
export async function executeApprovedAction(action: PendingAction): Promise<{ success: boolean; message: string }> {
  try {
    switch (action.type) {
      case "add_exercise": {
        const details = action.details as any;

        let athleteId = details.athleteId;
        if (!athleteId && details.athleteName) {
          const athletes = await storage.getAthletes();
          const found = athletes.find((a: any) => a.name.toLowerCase().includes(details.athleteName.toLowerCase()));
          if (found) athleteId = found.id;
        }

        if (!athleteId) return { success: false, message: "Could not find athlete to add exercises to." };

        const assignments = await storage.getAthleteProgramAssignments(athleteId);
        if (assignments.length === 0) return { success: false, message: "Athlete has no assigned programs. Please assign a program first." };

        const programId = assignments[0].programId;
        const blocks = await storage.getTrainingBlocksByProgram(programId);
        if (blocks.length === 0) return { success: false, message: "No training blocks found in the assigned program." };

        const targetBlockId = details.blockId || blocks[0].id;
        let addedCount = 0;

        for (const ex of details.exercises || []) {
          let exerciseId = ex.exerciseId;
          if (!exerciseId && ex.exerciseName) {
            const exercises = await storage.getAllExercises();
            const found = exercises.find((e: any) => e.name.toLowerCase().includes(ex.exerciseName.toLowerCase()));
            if (found) exerciseId = found.id;
          }

          if (exerciseId) {
            await storage.createBlockExercise({ blockId: targetBlockId, exerciseId, sets: ex.sets || 3, reps: ex.reps || "10", orderIndex: 99 });
            addedCount++;
          }
        }

        return { success: true, message: `Successfully added ${addedCount} exercise(s) to the athlete's training program. Reason: ${details.reason || "AI recommendation"}.` };
      }

      case "adjust_volume": {
        const details = action.details as any;

        let athleteId = details.athleteId;
        if (!athleteId && details.athleteName) {
          const athletes = await storage.getAthletes();
          const found = athletes.find((a: any) => a.name.toLowerCase().includes(details.athleteName.toLowerCase()));
          if (found) athleteId = found.id;
        }

        if (!athleteId) return { success: false, message: "Could not find athlete to adjust volume for." };

        const athlete = await storage.getAthlete(athleteId);
        if (!athlete) return { success: false, message: "Athlete not found." };

        const currentNotes = athlete.notes || "";
        const volumeNote = `\n[AI VOLUME ADJUSTMENT ${new Date().toISOString().split("T")[0]}]: ${details.adjustmentType} volume by ${Math.abs(details.percentageChange)}% for ${details.duration}. Reason: ${details.reason || "AI recommendation"}.`;
        await storage.updateAthlete(athleteId, { notes: currentNotes + volumeNote });

        return { success: true, message: `Volume adjustment (${details.adjustmentType} ${Math.abs(details.percentageChange)}%) recorded for ${athlete.name}. Duration: ${details.duration}.` };
      }

      case "flag_athlete": {
        const details = action.details as any;

        let athleteId = details.athleteId;
        if (!athleteId && details.athleteName) {
          const athletes = await storage.getAthletes();
          const found = athletes.find((a: any) => a.name.toLowerCase().includes(details.athleteName.toLowerCase()));
          if (found) athleteId = found.id;
        }

        if (!athleteId) return { success: false, message: "Could not find athlete to flag." };

        const athlete = await storage.getAthlete(athleteId);
        if (!athlete) return { success: false, message: "Athlete not found." };

        const currentNotes = athlete.notes || "";
        const flagNote = `\n[AI FLAG ${new Date().toISOString().split("T")[0]} - ${details.urgency.toUpperCase()}]: ${details.flagType} - ${details.details}${details.suggestedActions ? "\nSuggested actions: " + details.suggestedActions.join(", ") : ""}`;
        await storage.updateAthlete(athleteId, {
          notes: currentNotes + flagNote,
          status: details.urgency === "urgent" ? "injured" : athlete.status,
        });

        return { success: true, message: `Athlete "${athlete.name}" flagged for ${details.flagType} review with ${details.urgency} urgency.` };
      }

      case "assign_program": {
        const details = action.details as any;

        let athleteId = details.athleteId;
        if (!athleteId && details.athleteName) {
          const athletes = await storage.getAthletes();
          const found = athletes.find((a: any) => a.name.toLowerCase().includes(details.athleteName.toLowerCase()));
          if (found) athleteId = found.id;
        }

        let programId = details.programId;
        if (!programId && details.programName) {
          const programs = await storage.getPrograms();
          const found = programs.find((p: any) => p.name.toLowerCase().includes(details.programName.toLowerCase()));
          if (found) programId = found.id;
        }

        if (!athleteId) return { success: false, message: "Could not find athlete to assign program to." };
        if (!programId) return { success: false, message: "Could not find program to assign." };

        const athlete = await storage.getAthlete(athleteId);
        const program = await storage.getProgram(programId);
        if (!athlete || !program) return { success: false, message: "Athlete or program not found." };

        await storage.createAthleteProgram({
          athleteId,
          programId,
          status: "active",
          notes: details.notes || `Assigned by AI Coach on ${new Date().toLocaleDateString()}`,
        });

        return { success: true, message: `Successfully assigned program "${program.name}" to ${athlete.name}. Start date: ${details.startDate}.` };
      }

      case "modify_program": {
        const details = action.details as any;
        return { success: true, message: `Heuristic rule "${details.heuristicName || details.heuristicId}" queued for application to ${details.targetAthletes?.length || "selected"} athlete(s).` };
      }

      default:
        return { success: false, message: `Unknown action type: ${action.type}` };
    }
  } catch (error) {
    console.error("Action execution error:", error);
    return { success: false, message: `Failed to execute action: ${error}` };
  }
}

// ---------------------------------------------------------------------------
// AI Autofill
// ---------------------------------------------------------------------------
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
    const exercises = await storage.getAllExercises();

    let athleteContext = "";
    if (request.athleteId) {
      const athlete = await storage.getAthlete(request.athleteId);
      const profile = await storage.getAthleteTrainingProfile(request.athleteId);
      if (athlete) {
        athleteContext = `
Athlete: ${athlete.name}
Position: ${athlete.position || "Not specified"}
Belt Level: ${profile?.beltLevel || "WHITE"}
Training Age: ${profile?.trainingAge || 0} years
`;
      }
    }

    const exerciseSummary = exercises.slice(0, 100).map((e: any) => ({
      id: e.id,
      name: e.name,
      category: e.category,
      difficulty: e.beltLevel || "beginner",
    }));

    const systemPrompt = `You are an elite strength and conditioning coach AI assistant. Generate a balanced training week.
Rules:
1. Use exercise IDs from the provided list ONLY
2. Balance push/pull/legs throughout the week
3. Typical sets: 3-5, reps vary by goal
4. Include warmup/mobility at start of each day
5. 4-8 exercises per day maximum

Respond with ONLY a JSON object:
{
  "exercises": [{"exerciseId":"id","exerciseName":"name","dayNumber":1,"sets":3,"reps":"10","restSeconds":90,"notes":"cue","orderIndex":0}],
  "reasoning": "brief explanation"
}`;

    const userPrompt = `Generate week ${request.weekNumber} training.
${athleteContext}
Phase: ${request.phase || "PRESEASON"}
Focus: ${request.focus?.join(", ") || "General strength and conditioning"}
Target Days: ${request.targetDays?.join(", ") || "1,2,3,4,5"}

AVAILABLE EXERCISES (use these IDs):
${JSON.stringify(exerciseSummary, null, 2)}`;

    const response = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content[0]?.type === "text" ? response.content[0].text : "";
    if (!content) return { success: false, exercises: [], message: "AI did not return a response" };

    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const validExercises: AutofillExercise[] = [];
    for (const ex of parsed.exercises || []) {
      const dbExercise = exercises.find((e: any) => e.id === ex.exerciseId);
      if (dbExercise) {
        validExercises.push({
          exerciseId: ex.exerciseId,
          exerciseName: dbExercise.name,
          dayNumber: ex.dayNumber || 1,
          sets: ex.sets || 3,
          reps: String(ex.reps || "10"),
          restSeconds: ex.restSeconds || 90,
          notes: ex.notes || "",
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
    console.error("AI Autofill error:", error);
    return {
      success: false,
      exercises: [],
      message: `Failed to generate exercises: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
