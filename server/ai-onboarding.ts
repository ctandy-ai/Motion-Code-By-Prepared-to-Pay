import OpenAI from "openai";
import { IStorage } from "./storage";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface ParsedAthleteData {
  name?: string;
  email?: string;
  phone?: string;
  team?: string;
  position?: string;
  sport?: string;
  dateOfBirth?: string;
  trainingAgeYears?: number;
  movementQualityScore?: number | number[];
  recurrentHamstring?: boolean;
  recurrentCalf?: boolean;
  recurrentGroin?: boolean;
  notes?: string;
  goals?: string[];
  coachingAssessment?: string;
  injuryHistory?: string[];
  chronologicalAgeYears?: number;
}

interface OnboardingResponse {
  message: string;
  extractedData?: ParsedAthleteData;
  isComplete: boolean;
  suggestedPrograms?: Array<{
    id: string;
    name: string;
    description?: string;
    matchReason: string;
  }>;
  athleteCreated?: boolean;
  athleteId?: string;
}

const SYSTEM_PROMPT = `You are an AI assistant for MotionCode Pro, a premium strength and conditioning platform. Your role is to help coaches quickly onboard new athletes through natural conversation.

Your objectives:
1. Extract athlete information from natural language descriptions
2. Mark the profile as COMPLETE as soon as you have a NAME - everything else is optional
3. Be efficient - coaches are busy and want to move fast

MINIMUM REQUIRED to mark complete:
- Name (just a name is enough!)

NICE TO HAVE (extract if mentioned, but NOT required):
- Team/Sport context
- Position
- Training age (years of structured training, as a single number)
- Movement quality (single integer 1-5, NOT a range or array)
- Any injury history (especially hamstring, calf, or groin issues — set recurrentHamstring/recurrentCalf/recurrentGroin booleans if relevant, plus include details in coachingAssessment)
- Current training goals

IMPORTANT: Set isComplete to TRUE as soon as you have at least a name. Do NOT ask unnecessary follow-up questions. Extract what's provided and let the coach decide when they're ready to create.

When a coach describes an athlete, extract all available data and format your response as JSON:
1. "message": Your conversational response confirming what you captured
2. "extractedData": An object containing all parsed athlete fields
3. "isComplete": TRUE if you have at least a name, FALSE only if no name was provided

Example response format:
{
  "message": "Got it! I've captured Jake Smith from the U21s - midfielder with 3 years training, 4/5 movement quality, and a hamstring history. Ready to create his profile!",
  "extractedData": {
    "name": "Jake Smith",
    "team": "U21",
    "position": "Midfielder",
    "trainingAgeYears": 3,
    "movementQualityScore": 4,
    "recurrentHamstring": true,
    "goals": ["Preseason preparation"]
  },
  "isComplete": true
}

Belt Classification Guide (for reference):
- WHITE belt: Training age < 2 years, or movement quality < 3
- BLUE belt: Training age 2-4 years, movement quality 3-4
- BLACK belt: Training age > 4 years, movement quality 4-5, no injury flags

Be professional but efficient. Confirm what you understood without asking unnecessary questions.`;

export async function processOnboardingMessage(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  storage: IStorage
): Promise<OnboardingResponse> {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT },
    ...conversationHistory.map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content
    })),
    { role: "user", content: userMessage }
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages,
    max_completion_tokens: 1024,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  
  try {
    const parsed = JSON.parse(content);
    return {
      message: parsed.message || "I'm having trouble understanding. Could you describe the athlete again?",
      extractedData: parsed.extractedData,
      isComplete: parsed.isComplete || false,
      suggestedPrograms: parsed.suggestedPrograms,
    };
  } catch {
    return {
      message: content || "I'm having trouble processing that. Could you try again?",
      isComplete: false,
    };
  }
}

export async function createAthleteFromOnboarding(
  data: ParsedAthleteData,
  storage: IStorage
): Promise<{ success: boolean; athleteId?: string; error?: string }> {
  if (!data.name) {
    return { success: false, error: "Athlete name is required" };
  }

  try {
    const generatedEmail = data.email || `${data.name.toLowerCase().replace(/\s+/g, '.')}.${Date.now()}@athlete.local`;
    
    const athlete = await storage.createAthlete({
      name: data.name,
      email: generatedEmail,
      phone: data.phone || undefined,
      team: data.team || undefined,
      position: data.position || undefined,
      notes: [
        data.coachingAssessment,
        data.goals?.length ? `Goals: ${data.goals.join(", ")}` : null,
        data.injuryHistory?.length ? `Injury History: ${data.injuryHistory.join(", ")}` : null,
        data.sport ? `Sport: ${data.sport}` : null,
        !data.email ? `(Email auto-generated during AI onboarding)` : null,
      ].filter(Boolean).join("\n") || undefined,
      status: "Registered",
    });

    const safeInt = (val: any, fallback: number): number => {
      if (val === undefined || val === null) return fallback;
      if (Array.isArray(val)) val = val[0];
      const num = Number(val);
      return isNaN(num) ? fallback : Math.round(num);
    };

    const safeFloat = (val: any, fallback: number): number => {
      if (val === undefined || val === null) return fallback;
      if (Array.isArray(val)) val = val[0];
      const num = Number(val);
      return isNaN(num) ? fallback : num;
    };

    const hasProfileData = data.trainingAgeYears !== undefined || data.movementQualityScore !== undefined
      || data.recurrentHamstring || data.recurrentCalf || data.recurrentGroin;

    if (athlete && hasProfileData) {
      await storage.upsertAthleteTrainingProfile({
        athleteId: athlete.id,
        trainingAgeYears: safeFloat(data.trainingAgeYears, 0),
        movementQualityScore: safeInt(data.movementQualityScore, 3),
        recurrentHamstring: data.recurrentHamstring ? 1 : 0,
        recurrentCalf: data.recurrentCalf ? 1 : 0,
        recurrentGroin: data.recurrentGroin ? 1 : 0,
      });
    }

    return { success: true, athleteId: athlete.id };
  } catch (error) {
    console.error("Failed to create athlete:", error);
    return { success: false, error: "Failed to create athlete profile" };
  }
}

export async function suggestProgramsForAthlete(
  data: ParsedAthleteData,
  storage: IStorage
): Promise<Array<{ id: string; name: string; description?: string | null; matchReason: string }>> {
  const templates = await storage.getProgramTemplates();
  
  const goals = data.goals || [];
  const hasInjury = data.recurrentHamstring || data.recurrentCalf || data.recurrentGroin;
  const trainingAge = data.trainingAgeYears || 0;
  
  const suggestions: Array<{ id: string; name: string; description?: string | null; matchReason: string; score: number }> = [];
  
  for (const template of templates) {
    let score = 0;
    let reasons: string[] = [];
    
    const templateTags = template.tags || [];
    const templateName = template.name.toLowerCase();
    const templateCategory = template.category?.toLowerCase() || "";
    
    if (hasInjury && data.recurrentHamstring && (
      templateTags.some(t => t.toLowerCase().includes("hamstring")) ||
      templateName.includes("hamstring") ||
      templateCategory.includes("rtp")
    )) {
      score += 5;
      reasons.push("Addresses hamstring recovery");
    }
    
    if (goals.some(g => g.toLowerCase().includes("return to play") || g.toLowerCase().includes("rtp"))) {
      if (templateCategory.includes("rtp") || templateTags.some(t => t.toLowerCase().includes("rtp"))) {
        score += 4;
        reasons.push("Designed for return to play");
      }
    }
    
    if (goals.some(g => g.toLowerCase().includes("performance") || g.toLowerCase().includes("strength"))) {
      if (templateCategory.includes("performance") || templateName.includes("performance")) {
        score += 3;
        reasons.push("Matches performance goals");
      }
    }
    
    if (trainingAge < 2 && templateTags.some(t => t.toLowerCase().includes("beginner"))) {
      score += 2;
      reasons.push("Suitable for training level");
    } else if (trainingAge >= 4 && templateTags.some(t => t.toLowerCase().includes("advanced"))) {
      score += 2;
      reasons.push("Matches experience level");
    }
    
    if (score > 0) {
      suggestions.push({
        id: template.id,
        name: template.name,
        description: template.description,
        matchReason: reasons.join("; "),
        score
      });
    }
  }
  
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ score, ...rest }) => rest);
}
