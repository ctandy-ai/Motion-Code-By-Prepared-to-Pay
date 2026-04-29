import { anthropic, CHAT_MODEL } from "./ai-client";

export interface TeamBuildrExercise {
  id: string;
  name: string;
  tracking?: string;
  tags?: string[];
  attributes?: string[];
  variables_default?: {
    sets?: string;
    reps?: string;
    intensity?: string;
  };
  belt_min?: string;
  belt_max?: string;
  notes?: string;
}

export interface AIClassification {
  exerciseName: string;
  recommendedBeltLevel: "White" | "Blue" | "Black";
  beltReasoning: string;
  recommendedIntensity: string;
  intensityReasoning: string;
  suggestedSets: string;
  suggestedReps: string;
  suggestedRPE: string;
  movementComplexity: "Low" | "Moderate" | "High";
  techniqueRequirements: string;
  injuryRiskFactors: string[];
  confidence: number;
}

const classificationPrompt = `You are an expert strength and conditioning coach analyzing exercises for a belt-based progression system.

BELT LEVEL SYSTEM:
- White Belt (Beginner): 0-12 months training, simple movements, low technique demands, foundational exercises, bodyweight or light resistance
- Blue Belt (Intermediate): 1-2 years training, moderate complexity, competent technique required, heavier loads, multiple movement patterns
- Black Belt (Advanced): 2-5+ years training, high complexity, advanced technique, explosive/plyometric movements, high coordination demands

INTENSITY GUIDELINES:
- Low Intensity: 60-75% 1RM, RPE 6-7, 8-12 reps, hypertrophy/endurance focus
- Moderate Intensity: 75-85% 1RM, RPE 7-8, 6-8 reps, strength building
- High Intensity: 85-100% 1RM, RPE 9-10, 1-5 reps, max strength/power

Analyze the exercise and provide a classification as a JSON object.`;

export async function classifyExercise(exercise: TeamBuildrExercise): Promise<AIClassification> {
  try {
    const exerciseContext = `
Exercise Name: ${exercise.name}
Tracking Type: ${exercise.tracking || "None"}
Tags: ${exercise.tags?.join(", ") || "None"}
Attributes: ${exercise.attributes?.join(", ") || "None"}
Current Programming: Sets: ${exercise.variables_default?.sets || "N/A"}, Reps: ${exercise.variables_default?.reps || "N/A"}, Intensity: ${exercise.variables_default?.intensity || "N/A"}
Current Belt Range: ${exercise.belt_min || "N/A"} to ${exercise.belt_max || "N/A"}
`;

    const response = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 1024,
      system: classificationPrompt,
      messages: [
        {
          role: "user",
          content: `Analyze this exercise and provide a detailed classification:\n\n${exerciseContext}\n\nRespond with ONLY a JSON object in this exact format:
{
  "exerciseName": "string",
  "recommendedBeltLevel": "White" | "Blue" | "Black",
  "beltReasoning": "detailed explanation",
  "recommendedIntensity": "Low/Moderate/High + specific %1RM or RPE range",
  "intensityReasoning": "explanation of why",
  "suggestedSets": "e.g., 3-4",
  "suggestedReps": "e.g., 8-12",
  "suggestedRPE": "e.g., 7-8",
  "movementComplexity": "Low" | "Moderate" | "High",
  "techniqueRequirements": "description of key technique points",
  "injuryRiskFactors": ["factor1", "factor2"],
  "confidence": 0-100
}`
        }
      ],
    });

    const content = response.content[0]?.type === "text" ? response.content[0].text : "";
    if (!content) throw new Error("No response from AI");

    // Strip markdown code fences if present
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned) as AIClassification;
  } catch (error) {
    console.error("AI Classification error:", error);
    throw error;
  }
}

export async function classifyExerciseBatch(
  exercises: TeamBuildrExercise[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, AIClassification>> {
  const results = new Map<string, AIClassification>();

  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i];
    try {
      const classification = await classifyExercise(exercise);
      results.set(exercise.id, classification);

      if (onProgress) {
        onProgress(i + 1, exercises.length);
      }

      // Rate limiting: small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to classify ${exercise.name}:`, error);
    }
  }

  return results;
}
