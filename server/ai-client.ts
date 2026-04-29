import Anthropic from "@anthropic-ai/sdk";

// Shared Anthropic client
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Model constants
// Haiku: fast + cheap — use for chat, onboarding, classifier (~$0.80/M input)
// Sonnet: smarter — use for complex program intelligence (~$3/M input)
export const CHAT_MODEL = "claude-haiku-3-5-20241022";
export const INTELLIGENCE_MODEL = "claude-sonnet-4-5";

// ---------------------------------------------------------------------------
// Per-user rate limiting (in-memory, resets on server restart)
// Season Pass: 50 AI messages/day | Pro: 200 AI messages/day
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  windowStart: number; // epoch ms at start of current day window
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const DAILY_LIMITS: Record<"season" | "pro", number> = {
  season: 50,
  pro: 200,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function checkRateLimit(
  userId: string,
  tier: "season" | "pro"
): { allowed: boolean; remaining: number; resetAt: Date } {
  const now = Date.now();
  const limit = DAILY_LIMITS[tier];

  let entry = rateLimitStore.get(userId);

  // Reset if window has expired (new day)
  if (!entry || now - entry.windowStart >= MS_PER_DAY) {
    entry = { count: 0, windowStart: now };
    rateLimitStore.set(userId, entry);
  }

  const resetAt = new Date(entry.windowStart + MS_PER_DAY);

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, resetAt };
}
