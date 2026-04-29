import { anthropic, INTELLIGENCE_MODEL } from "./ai-client";
import { IStorage } from "./storage";
import { Athlete, Program, Exercise } from "@shared/schema";

export type AILevel = "athlete" | "program" | "exercise" | "team" | "analytics" | "coaching";

interface AIContext {
  level: AILevel;
  entityId?: string;
  additionalContext?: Record<string, unknown>;
}

interface AIResponse {
  message: string;
  suggestions?: Array<{
    type: string;
    title: string;
    description: string;
    action?: string;
    data?: Record<string, unknown>;
  }>;
  insights?: Array<{
    category: string;
    insight: string;
    severity?: "info" | "warning" | "critical";
  }>;
  predictions?: Array<{
    metric: string;
    prediction: string;
    confidence: number;
  }>;
}

async function buildAthleteContext(storage: any, athleteId?: string): Promise<string> {
  if (athleteId) {
    const athlete = await storage.getAthlete(athleteId);
    const workoutLogs = await storage.getWorkoutLogs(athleteId);
    const surveys = await storage.getReadinessSurveys(athleteId);
    const prs = await storage.getPersonalRecords(athleteId);

    return `
ATHLETE PROFILE:
- Name: ${athlete?.name}
- Team: ${athlete?.team || "Unassigned"}
- Position: ${athlete?.position || "N/A"}
- Status: ${athlete?.status || "Active"}

RECENT WORKOUTS (last 10):
${workoutLogs.slice(0, 10).map((w: any) => `- Exercise ${w.exerciseId}: ${w.sets} sets @ ${w.weightPerSet}`).join("\n")}

WELLNESS TRENDS (last 7 days):
${surveys.slice(0, 7).map((s: any) => `- Readiness: ${s.overallReadiness}/10, Sleep: ${s.sleepQuality}/10, Soreness: ${s.muscleSoreness}/10`).join("\n")}

PERSONAL RECORDS: ${prs.length} total
${prs.slice(0, 5).map((pr: any) => `- Exercise ${pr.exerciseId}: ${pr.maxWeight}kg`).join("\n")}
`;
  }

  const athletes = await storage.getAthletes();
  return `ROSTER: ${athletes.length} athletes\n${athletes.slice(0, 20).map((a: any) => `- ${a.name} (${a.team || "No team"})`).join("\n")}`;
}

async function buildProgramContext(storage: any, programId?: string): Promise<string> {
  if (programId) {
    const program = await storage.getProgram(programId);
    const phases = await storage.getProgramPhases(programId);
    const weeks = await storage.getProgramWeeks(programId);

    return `
PROGRAM: ${program?.name}
- Description: ${program?.description || "N/A"}
- Duration: ${weeks.length} weeks across ${phases.length} phases

PHASES:
${phases.map((p: any) => `- ${p.name}: Weeks ${p.startWeek}-${p.endWeek}`).join("\n")}
`;
  }

  const programs = await storage.getPrograms();
  return `PROGRAMS: ${programs.length} total\n${programs.map((p: any) => `- ${p.name}`).join("\n")}`;
}

async function buildTeamContext(storage: any): Promise<string> {
  const athletes = await storage.getAthletes();
  const allSurveys = await storage.getAllReadinessSurveys();
  const recentSurveys = allSurveys.filter((s: any) => {
    const surveyDate = new Date(s.surveyDate || Date.now());
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    return surveyDate >= threeDaysAgo;
  });

  const avgReadiness =
    recentSurveys.length > 0
      ? (recentSurveys.reduce((sum: number, s: any) => sum + (s.overallReadiness || 0), 0) / recentSurveys.length).toFixed(1)
      : "N/A";

  const sorenessAlerts = recentSurveys.filter((s: any) => (s.muscleSoreness || 0) >= 7).length;

  return `
TEAM OVERVIEW:
- Total Athletes: ${athletes.length}
- Recent Surveys: ${recentSurveys.length}
- Average Readiness: ${avgReadiness}/10
- High Soreness Alerts: ${sorenessAlerts}

ATHLETES BY STATUS:
${Object.entries(
  athletes.reduce((acc: Record<string, number>, a: any) => {
    const status = a.status || "Unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)
)
  .map(([status, count]) => `- ${status}: ${count}`)
  .join("\n")}
`;
}

async function buildExerciseContext(storage: any, exerciseId?: string): Promise<string> {
  if (exerciseId) {
    const exercise = await storage.getExercise(exerciseId);
    return `
EXERCISE: ${exercise?.name}
- Category: ${exercise?.category || "Uncategorized"}
- Equipment: ${exercise?.equipment || "None"}
- Muscle Group: ${exercise?.muscleGroup || "N/A"}
`;
  }

  const exercises = await storage.getAllExercises();
  const categorySet = new Set(exercises.map((e: any) => e.category).filter(Boolean));
  return `EXERCISE LIBRARY: ${exercises.length} exercises across ${categorySet.size} categories`;
}

async function buildAnalyticsContext(storage: any): Promise<string> {
  const workoutLogs = await storage.getWorkoutLogs();
  const prs = await storage.getPersonalRecords();
  const surveys = await storage.getAllReadinessSurveys();

  const last30Days = workoutLogs.filter((w: any) => {
    const logDate = new Date(w.completedAt || Date.now());
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return logDate >= thirtyDaysAgo;
  });

  return `
ANALYTICS SUMMARY (30 days):
- Total Workouts Logged: ${last30Days.length}
- Total PRs Achieved: ${
    prs.filter((pr: any) => {
      const prDate = new Date(pr.achievedAt || Date.now());
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return prDate >= thirtyDaysAgo;
    }).length
  }
- Wellness Surveys: ${surveys.length}
- Unique Athletes Training: ${new Set(last30Days.map((w: any) => w.athleteId)).size}
`;
}

function getSystemPrompt(level: AILevel): string {
  const basePrompt = `You are the AI Intelligence system for MotionCode Pro, an elite strength and conditioning platform. You provide intelligent insights, recommendations, and predictions to help coaches optimise athlete performance.

Always respond with JSON in this exact format:
{
  "message": "Your main response to the coach",
  "suggestions": [
    {"type": "action|recommendation|warning", "title": "Short title", "description": "Details", "action": "optional_action_id", "data": {}}
  ],
  "insights": [
    {"category": "performance|wellness|risk|trend", "insight": "The insight", "severity": "info|warning|critical"}
  ],
  "predictions": [
    {"metric": "What you're predicting", "prediction": "The prediction", "confidence": 0.85}
  ]
}`;

  const levelPrompts: Record<AILevel, string> = {
    athlete: `${basePrompt}\n\nATHLETE-LEVEL INTELLIGENCE:\nFocus on individual athlete optimisation: profile updates, injury risk, performance predictions, readiness, belt progression.`,
    program: `${basePrompt}\n\nPROGRAM-LEVEL INTELLIGENCE:\nFocus on program design: smart exercise selection, periodisation, volume/intensity balance, phase transitions, recovery week placement.`,
    exercise: `${basePrompt}\n\nEXERCISE-LEVEL INTELLIGENCE:\nFocus on exercise selection: context-aware recommendations, substitutions for injuries/equipment, progression pathways, risk assessment.`,
    team: `${basePrompt}\n\nTEAM-LEVEL INTELLIGENCE:\nFocus on roster-wide insights: workload distribution, readiness trends, injury risk patterns, compliance, resource allocation.`,
    analytics: `${basePrompt}\n\nANALYTICS-LEVEL INTELLIGENCE:\nAnswer natural language queries: interpret trends, summarise performance, compare metrics, identify anomalies, provide actionable recommendations.`,
    coaching: `${basePrompt}\n\nCOACHING-LEVEL INTELLIGENCE:\nStrategic coaching support: decision support, what-if scenarios, proactive alerts, best practices, competition preparation.`,
  };

  return levelPrompts[level];
}

export async function processAIQuery(
  query: string,
  context: AIContext,
  storage: any
): Promise<AIResponse> {
  let contextString = "";

  switch (context.level) {
    case "athlete":
      contextString = await buildAthleteContext(storage, context.entityId);
      break;
    case "program":
      contextString = await buildProgramContext(storage, context.entityId);
      break;
    case "exercise":
      contextString = await buildExerciseContext(storage, context.entityId);
      break;
    case "team":
      contextString = await buildTeamContext(storage);
      break;
    case "analytics":
      contextString = await buildAnalyticsContext(storage);
      break;
    case "coaching":
      contextString = (await buildTeamContext(storage)) + "\n" + (await buildAnalyticsContext(storage));
      break;
  }

  try {
    const response = await anthropic.messages.create({
      model: INTELLIGENCE_MODEL,
      max_tokens: 1500,
      system: getSystemPrompt(context.level),
      messages: [
        { role: "user", content: `CONTEXT:\n${contextString}\n\nQUERY: ${query}\n\nRespond with valid JSON only.` },
      ],
    });

    const content = response.content[0]?.type === "text" ? response.content[0].text : "{}";

    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return {
        message: parsed.message || "Analysis complete",
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        predictions: Array.isArray(parsed.predictions) ? parsed.predictions : [],
      };
    } catch {
      return { message: content, insights: [], suggestions: [], predictions: [] };
    }
  } catch (error) {
    console.error("AI Intelligence query failed:", error);
    return { message: "I'm having trouble processing that request. Please try again." };
  }
}

export async function getAthleteInsights(athleteId: string, storage: any): Promise<AIResponse> {
  return processAIQuery(
    "Analyse this athlete's recent performance, wellness trends, and provide actionable recommendations. Identify any injury risks or areas for improvement.",
    { level: "athlete", entityId: athleteId },
    storage
  );
}

export async function getProgramSuggestions(programId: string, storage: any): Promise<AIResponse> {
  return processAIQuery(
    "Review this program structure and suggest optimisations for periodisation, exercise selection, and recovery placement.",
    { level: "program", entityId: programId },
    storage
  );
}

export async function getExerciseRecommendations(
  goals: string[],
  constraints: { injuries?: string[]; equipment?: string[]; beltLevel?: string; athleteId?: string },
  storage: any
): Promise<AIResponse> {
  let athleteContext = "";

  if (constraints.athleteId) {
    const athlete = await storage.getAthlete(constraints.athleteId);
    const profile = await storage.getAthleteTrainingProfile(constraints.athleteId);
    if (athlete && profile) {
      athleteContext = `
Athlete: ${athlete.name}
Belt Level: ${profile.beltLevel || "BLUE"}
Training Age: ${profile.trainingAge || 1} years
Movement Quality: ${profile.movementQualityScore || 3}/5
Injury Flags: ${profile.injuryFlags?.join(", ") || "None"}`;
    }
  }

  const query = `Recommend exercises for these goals: ${goals.join(", ")}.
${athleteContext}
Constraints: ${constraints.injuries?.length ? `Avoid movements that stress: ${constraints.injuries.join(", ")}` : "No injury restrictions"}
Equipment available: ${constraints.equipment?.join(", ") || "Full gym"}
Athlete level: ${constraints.beltLevel || "BLUE"}

Provide:
1. Primary exercise recommendations (3-5 exercises) with sets/reps
2. Alternative exercises if primary aren't available
3. Progression pathway for each exercise
4. Safety considerations for this athlete's profile`;

  return processAIQuery(query, { level: "exercise" }, storage);
}

export async function getTeamInsights(storage: any): Promise<AIResponse> {
  const athletes = await storage.getAllAthletes();
  const surveys = await storage.getAllReadinessSurveys();
  const workoutLogs = await storage.getWorkoutLogs();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const athleteStats = await Promise.all(
    athletes.map(async (athlete: any) => {
      const profile = await storage.getAthleteTrainingProfile(athlete.id);
      const athleteSurveys = surveys.filter((s: any) => s.athleteId === athlete.id);
      const recentSurveys = athleteSurveys.filter((s: any) => new Date(s.createdAt || 0) >= sevenDaysAgo);
      const athleteWorkouts = workoutLogs.filter((w: any) => w.athleteId === athlete.id);
      const recentWorkouts = athleteWorkouts.filter((w: any) => new Date(w.completedAt || 0) >= sevenDaysAgo);

      const avgReadiness =
        recentSurveys.length > 0
          ? recentSurveys.reduce((sum: number, s: any) => sum + (s.readinessScore || 0), 0) / recentSurveys.length
          : 0;

      const avgSoreness =
        recentSurveys.length > 0
          ? recentSurveys.reduce((sum: number, s: any) => sum + (s.sorenessScore || 0), 0) / recentSurveys.length
          : 0;

      return {
        name: athlete.name,
        beltLevel: profile?.beltLevel || "BLUE",
        avgReadiness: avgReadiness.toFixed(1),
        avgSoreness: avgSoreness.toFixed(1),
        workoutsThisWeek: recentWorkouts.length,
        hasSurveysThisWeek: recentSurveys.length > 0,
        injuryFlags: profile?.injuryFlags || [],
      };
    })
  );

  const teamContext = `
TEAM ROSTER ANALYSIS (${athletes.length} athletes):
${athleteStats
  .map(
    (a: any) =>
      `- ${a.name} (${a.beltLevel}): Readiness ${a.avgReadiness}/10, Soreness ${a.avgSoreness}/10, Workouts: ${a.workoutsThisWeek}/week${
        a.injuryFlags.length ? `, Flags: ${a.injuryFlags.join(", ")}` : ""
      }`
  )
  .join("\n")}
`;

  return processAIQuery(
    `${teamContext}\n\nAnalyse this team and provide:\n1. Overall team health status\n2. Athletes requiring immediate attention\n3. Workload distribution analysis\n4. Specific recommendations for this week\n5. Risk assessment for upcoming training`,
    { level: "team" },
    storage
  );
}

export async function queryAnalytics(naturalLanguageQuery: string, storage: any): Promise<AIResponse> {
  return processAIQuery(naturalLanguageQuery, { level: "analytics" }, storage);
}

export async function getCoachingDecisionSupport(scenario: string, storage: any): Promise<AIResponse> {
  const heuristics = await storage.getActiveHeuristics();
  const athletes = await storage.getAllAthletes();
  const surveys = await storage.getAllReadinessSurveys();

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const recentSurveys = surveys.filter((s: any) => new Date(s.createdAt || 0) >= threeDaysAgo);
  const avgReadiness =
    recentSurveys.length > 0
      ? recentSurveys.reduce((sum: number, s: any) => sum + (s.readinessScore || 0), 0) / recentSurveys.length
      : 0;
  const avgSoreness =
    recentSurveys.length > 0
      ? recentSurveys.reduce((sum: number, s: any) => sum + (s.sorenessScore || 0), 0) / recentSurveys.length
      : 0;

  const heuristicsContext =
    heuristics.length > 0
      ? `\nACTIVE COACHING RULES:\n${heuristics.map((h: any) => `- ${h.name}: When ${h.triggerType} triggers, ${h.actionType} (Priority: ${h.priority})`).join("\n")}`
      : "";

  const decisionContext = `
CURRENT TEAM STATUS:
- Active Athletes: ${athletes.length}
- Team Avg Readiness (3 days): ${avgReadiness.toFixed(1)}/10
- Team Avg Soreness (3 days): ${avgSoreness.toFixed(1)}/10
${heuristicsContext}

COACHING SCENARIO:
${scenario}

Provide decision support including:
1. Analysis of the scenario given current team status
2. Recommended course of action with rationale
3. Risk assessment of the recommendation
4. Alternative approaches to consider
5. Key metrics to monitor after decision`;

  return processAIQuery(decisionContext, { level: "coaching" }, storage);
}

export async function updateAthleteWithAI(
  athleteId: string,
  updateDescription: string,
  storage: any
): Promise<{
  proposedChanges: Record<string, unknown>;
  message: string;
  confirmed: boolean;
}> {
  const athlete = await storage.getAthlete(athleteId);
  if (!athlete) {
    return { proposedChanges: {}, message: "Athlete not found", confirmed: false };
  }

  const prompt = `Current athlete profile:
${JSON.stringify(athlete, null, 2)}

Update request: "${updateDescription}"

Extract the proposed changes and return ONLY a JSON object:
{
  "message": "Summary of what will be updated",
  "proposedChanges": {
    "field1": "newValue1"
  },
  "trainingProfileUpdates": {
    "trainingAgeYears": null,
    "movementQualityScore": null,
    "recurrentHamstring": null,
    "recurrentCalf": null,
    "recurrentGroin": null
  }
}`;

  try {
    const response = await anthropic.messages.create({
      model: INTELLIGENCE_MODEL,
      max_tokens: 512,
      system: "You extract structured updates from natural language. Respond only with valid JSON.",
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0]?.type === "text" ? response.content[0].text : "{}";
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      proposedChanges: parsed.proposedChanges || {},
      message: parsed.message || "Unable to parse update request",
      confirmed: false,
    };
  } catch (error) {
    console.error("Failed to process athlete update:", error);
    return { proposedChanges: {}, message: "Failed to process update request", confirmed: false };
  }
}
