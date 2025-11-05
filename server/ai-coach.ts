import OpenAI from 'openai';
import type { Athlete, WorkoutLog, PersonalRecord, AthleteProgram } from '@shared/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
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

export interface CoachingInsight {
  type: 'recommendation' | 'warning' | 'insight' | 'achievement';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  actionable?: string;
}

export async function generateCoachingInsights(
  context: AthleteContext
): Promise<CoachingInsight[]> {
  const systemPrompt = `You are an elite strength and conditioning coach AI assistant for StridePro, a performance training platform.
Your role is to analyze athlete data and provide actionable coaching insights focused on:
1. Performance optimization and progression
2. Injury risk detection and prevention
3. Training load management
4. Personalized program recommendations
5. Motivation and achievement recognition

Respond with JSON array of insights. Each insight should have:
- type: 'recommendation' | 'warning' | 'insight' | 'achievement'
- title: Brief, impactful title
- message: Clear, actionable message (2-3 sentences max)
- priority: 'high' | 'medium' | 'low'
- actionable: Optional specific action the coach can take

Focus on data-driven insights. Be concise and professional.`;

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

    // Parse JSON response
    const insights = JSON.parse(content);
    return insights;
  } catch (error) {
    console.error('AI coaching insights error:', error);
    // Return fallback insights
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

export async function chatWithCoach(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  athleteContext?: AthleteContext
): Promise<string> {
  const systemPrompt = `You are Coach AI, an expert strength and conditioning assistant for StridePro.
You help coaches and athletes with:
- Training program design and modifications
- Exercise technique and progressions
- Injury prevention strategies
- Performance analysis
- Nutrition and recovery guidance

Be concise, practical, and evidence-based. Always prioritize athlete safety.
${athleteContext ? `\n\nCURRENT ATHLETE CONTEXT:\n- Name: ${athleteContext.athlete.name}\n- Workouts: ${athleteContext.recentActivity?.totalWorkouts || 0}\n- PRs: ${athleteContext.recentActivity?.totalPRs || 0}` : ''}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.8,
      max_tokens: 800,
    });

    return response.choices[0]?.message?.content || 'I apologize, but I cannot provide a response at this time. Please try again.';
  } catch (error) {
    console.error('Chat error:', error);
    return 'I apologize, but I encountered an error. Please try again or contact support if the issue persists.';
  }
}
