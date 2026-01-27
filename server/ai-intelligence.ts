import OpenAI from "openai";
import { IStorage } from "./storage";
import { Athlete, Program, Exercise } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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

async function buildAthleteContext(storage: IStorage, athleteId?: string): Promise<string> {
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
${workoutLogs.slice(0, 10).map(w => `- Exercise ${w.exerciseId}: ${w.sets} sets @ ${w.weightPerSet}`).join("\n")}

WELLNESS TRENDS (last 7 days):
${surveys.slice(0, 7).map(s => `- Readiness: ${s.overallReadiness}/10, Sleep: ${s.sleepQuality}/10, Soreness: ${s.muscleSoreness}/10`).join("\n")}

PERSONAL RECORDS: ${prs.length} total
${prs.slice(0, 5).map(pr => `- Exercise ${pr.exerciseId}: ${pr.maxWeight}kg`).join("\n")}
`;
  }
  
  const athletes = await storage.getAthletes();
  return `ROSTER: ${athletes.length} athletes\n${athletes.slice(0, 20).map(a => `- ${a.name} (${a.team || "No team"})`).join("\n")}`;
}

async function buildProgramContext(storage: IStorage, programId?: string): Promise<string> {
  if (programId) {
    const program = await storage.getProgram(programId);
    const phases = await storage.getProgramPhases(programId);
    const weeks = await storage.getProgramWeeks(programId);
    
    return `
PROGRAM: ${program?.name}
- Description: ${program?.description || "N/A"}
- Duration: ${weeks.length} weeks across ${phases.length} phases

PHASES:
${phases.map(p => `- ${p.name}: Weeks ${p.startWeek}-${p.endWeek}`).join("\n")}
`;
  }
  
  const programs = await storage.getPrograms();
  return `PROGRAMS: ${programs.length} total\n${programs.map(p => `- ${p.name}`).join("\n")}`;
}

async function buildTeamContext(storage: IStorage): Promise<string> {
  const athletes = await storage.getAthletes();
  const allSurveys = await storage.getAllReadinessSurveys();
  const recentSurveys = allSurveys.filter(s => {
    const surveyDate = new Date(s.surveyDate || Date.now());
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    return surveyDate >= threeDaysAgo;
  });
  
  const avgReadiness = recentSurveys.length > 0 
    ? (recentSurveys.reduce((sum, s) => sum + (s.overallReadiness || 0), 0) / recentSurveys.length).toFixed(1)
    : "N/A";
  
  const sorenessAlerts = recentSurveys.filter(s => (s.muscleSoreness || 0) >= 7).length;
  
  return `
TEAM OVERVIEW:
- Total Athletes: ${athletes.length}
- Recent Surveys: ${recentSurveys.length}
- Average Readiness: ${avgReadiness}/10
- High Soreness Alerts: ${sorenessAlerts}

ATHLETES BY STATUS:
${Object.entries(
  athletes.reduce((acc, a) => {
    const status = a.status || "Unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)
).map(([status, count]) => `- ${status}: ${count}`).join("\n")}
`;
}

async function buildExerciseContext(storage: IStorage, exerciseId?: string): Promise<string> {
  if (exerciseId) {
    const exercise = await storage.getExercise(exerciseId);
    return `
EXERCISE: ${exercise?.name}
- Category: ${exercise?.category || "Uncategorized"}
- Equipment: ${exercise?.equipment || "None"}
- Muscle Group: ${exercise?.muscleGroup || "N/A"}
`;
  }
  
  const exercises = await storage.getExercises();
  const categorySet = new Set(exercises.map(e => e.category).filter(Boolean));
  return `EXERCISE LIBRARY: ${exercises.length} exercises across ${categorySet.size} categories`;
}

async function buildAnalyticsContext(storage: IStorage): Promise<string> {
  const workoutLogs = await storage.getWorkoutLogs();
  const prs = await storage.getPersonalRecords();
  const surveys = await storage.getAllReadinessSurveys();
  
  const last30Days = workoutLogs.filter(w => {
    const logDate = new Date(w.completedAt || Date.now());
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return logDate >= thirtyDaysAgo;
  });
  
  return `
ANALYTICS SUMMARY (30 days):
- Total Workouts Logged: ${last30Days.length}
- Total PRs Achieved: ${prs.filter(pr => {
    const prDate = new Date(pr.achievedAt || Date.now());
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return prDate >= thirtyDaysAgo;
  }).length}
- Wellness Surveys: ${surveys.length}
- Unique Athletes Training: ${new Set(last30Days.map(w => w.athleteId)).size}
`;
}

function getSystemPrompt(level: AILevel): string {
  const basePrompt = `You are the AI Intelligence system for MotionCode Pro, an elite strength and conditioning platform. You provide intelligent insights, recommendations, and predictions to help coaches optimize athlete performance.

Always respond with JSON in this format:
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
    athlete: `${basePrompt}

ATHLETE-LEVEL INTELLIGENCE:
Focus on individual athlete optimization:
- Profile updates and recommendations
- Injury risk assessment based on training load and wellness
- Performance predictions based on trends
- Readiness optimization suggestions
- Belt progression recommendations`,

    program: `${basePrompt}

PROGRAM-LEVEL INTELLIGENCE:
Focus on program design and optimization:
- Smart exercise selection based on goals
- Periodization recommendations
- Volume and intensity balancing
- Phase transition suggestions
- Recovery week placement`,

    exercise: `${basePrompt}

EXERCISE-LEVEL INTELLIGENCE:
Focus on exercise selection and modifications:
- Context-aware exercise recommendations
- Substitution suggestions for injuries/equipment
- Progression pathways
- Risk assessment for specific movements
- Technique considerations`,

    team: `${basePrompt}

TEAM-LEVEL INTELLIGENCE:
Focus on roster-wide insights:
- Workload distribution analysis
- Team readiness trends
- Injury risk patterns across the roster
- Training compliance monitoring
- Resource allocation recommendations`,

    analytics: `${basePrompt}

ANALYTICS-LEVEL INTELLIGENCE:
Answer natural language queries about data:
- Interpret trends and patterns
- Summarize performance data
- Compare metrics across time periods
- Identify anomalies and outliers
- Provide actionable recommendations from data`,

    coaching: `${basePrompt}

COACHING-LEVEL INTELLIGENCE:
Provide strategic coaching support:
- Decision support for training modifications
- What-if scenario analysis
- Proactive alerts and warnings
- Best practice recommendations
- Competition preparation guidance`
  };

  return levelPrompts[level];
}

export async function processAIQuery(
  query: string,
  context: AIContext,
  storage: IStorage
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
      contextString = await buildTeamContext(storage) + "\n" + await buildAnalyticsContext(storage);
      break;
  }

  const messages: Array<{ role: "system" | "user"; content: string }> = [
    { role: "system", content: getSystemPrompt(context.level) },
    { role: "user", content: `CONTEXT:\n${contextString}\n\nQUERY: ${query}` }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages,
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content || "";
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as AIResponse;
    }
    
    return { message: content };
  } catch (error) {
    console.error("AI Intelligence query failed:", error);
    return { message: "I'm having trouble processing that request. Please try again." };
  }
}

export async function getAthleteInsights(
  athleteId: string,
  storage: IStorage
): Promise<AIResponse> {
  return processAIQuery(
    "Analyze this athlete's recent performance, wellness trends, and provide actionable recommendations. Identify any injury risks or areas for improvement.",
    { level: "athlete", entityId: athleteId },
    storage
  );
}

export async function getProgramSuggestions(
  programId: string,
  storage: IStorage
): Promise<AIResponse> {
  return processAIQuery(
    "Review this program structure and suggest optimizations for periodization, exercise selection, and recovery placement.",
    { level: "program", entityId: programId },
    storage
  );
}

export async function getExerciseRecommendations(
  goals: string[],
  constraints: { injuries?: string[]; equipment?: string[]; beltLevel?: string },
  storage: IStorage
): Promise<AIResponse> {
  const query = `Recommend exercises for these goals: ${goals.join(", ")}. 
Constraints: ${constraints.injuries?.length ? `Avoid movements that stress: ${constraints.injuries.join(", ")}` : "No injury restrictions"}
Equipment available: ${constraints.equipment?.join(", ") || "Full gym"}
Athlete level: ${constraints.beltLevel || "BLUE"}`;

  return processAIQuery(query, { level: "exercise" }, storage);
}

export async function getTeamInsights(storage: IStorage): Promise<AIResponse> {
  return processAIQuery(
    "Provide a comprehensive team health check. Identify athletes at risk, workload imbalances, and overall team readiness trends.",
    { level: "team" },
    storage
  );
}

export async function queryAnalytics(
  naturalLanguageQuery: string,
  storage: IStorage
): Promise<AIResponse> {
  return processAIQuery(naturalLanguageQuery, { level: "analytics" }, storage);
}

export async function getCoachingDecisionSupport(
  scenario: string,
  storage: IStorage
): Promise<AIResponse> {
  return processAIQuery(
    `Help me make a decision: ${scenario}. Consider athlete readiness, team dynamics, and best practices.`,
    { level: "coaching" },
    storage
  );
}

export async function updateAthleteWithAI(
  athleteId: string,
  updateDescription: string,
  storage: IStorage
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

Extract the proposed changes and return JSON:
{
  "message": "Summary of what will be updated",
  "proposedChanges": {
    "field1": "newValue1",
    "field2": "newValue2"
  },
  "trainingProfileUpdates": {
    "trainingAgeYears": number or null,
    "movementQualityScore": number or null,
    "recurrentHamstring": boolean or null,
    "recurrentCalf": boolean or null,
    "recurrentGroin": boolean or null
  }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: "You extract structured updates from natural language. Respond only with valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      proposedChanges: parsed.proposedChanges || {},
      message: parsed.message || "Unable to parse update request",
      confirmed: false
    };
  } catch (error) {
    console.error("Failed to process athlete update:", error);
    return { proposedChanges: {}, message: "Failed to process update request", confirmed: false };
  }
}
