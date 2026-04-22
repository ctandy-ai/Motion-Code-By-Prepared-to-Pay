import type { Express } from "express";
import Stripe from "stripe";
import { requireAuth } from "./auth";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const APP_URL = process.env.APP_URL || "https://motioncode.app";

function getStripe(): Stripe | null {
  if (!STRIPE_SECRET) return null;
  return new Stripe(STRIPE_SECRET, { apiVersion: "2025-02-24.acacia" });
}

// Pricing configuration — update price IDs after creating in Stripe dashboard
const PRICES = {
  season_pass_annual: process.env.STRIPE_PRICE_SEASON_ANNUAL || "price_season_pass_annual",
  season_pass_monthly: process.env.STRIPE_PRICE_SEASON_MONTHLY || "price_season_pass_monthly",
  pro_annual: process.env.STRIPE_PRICE_PRO_ANNUAL || "price_pro_annual",
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "price_pro_monthly",
};

export const PLAN_DETAILS = {
  season_pass: {
    name: "Season Pass",
    annualPrice: 149,
    monthlyPrice: 14.99,
    currency: "AUD",
    tier: "season_pass",
  },
  pro: {
    name: "Pro",
    annualPrice: 399,
    monthlyPrice: 39.99,
    currency: "AUD",
    tier: "pro",
  },
};

function tierFromPriceId(priceId: string): string {
  if (priceId === PRICES.pro_annual || priceId === PRICES.pro_monthly) return "pro";
  if (priceId === PRICES.season_pass_annual || priceId === PRICES.season_pass_monthly) return "season_pass";
  return "season_pass";
}

async function upsertStripeCustomer(stripe: Stripe, user: any): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const customer = await stripe.customers.create({
    email: user.email,
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
    metadata: { userId: user.id },
  });
  await db.update(users).set({ stripeCustomerId: customer.id }).where(eq(users.id, user.id));
  return customer.id;
}

export function setupStripeRoutes(app: Express) {
  // ── BILLING STATUS ────────────────────────────────────────────────────────
  app.get("/api/billing/status", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      const stripe = getStripe();
      let subscription = null;

      if (stripe && user.stripeSubscriptionId) {
        try {
          subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        } catch {}
      }

      const trialDaysLeft = user.trialEndsAt
        ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / 86400000))
        : 0;

      res.json({
        tier: user.subscriptionTier || "trial",
        status: user.subscriptionStatus || "trial",
        trialEndsAt: user.trialEndsAt,
        trialDaysLeft,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        stripeSubscriptionId: user.stripeSubscriptionId,
        currentPeriodEnd: subscription ? new Date((subscription as any).current_period_end * 1000) : null,
        cancelAtPeriodEnd: subscription ? (subscription as any).cancel_at_period_end : false,
        stripePriceId: user.stripePriceId,
      });
    } catch (err) {
      console.error("Billing status error:", err);
      res.status(500).json({ error: "Failed to get billing status" });
    }
  });

  // ── CREATE CHECKOUT SESSION ────────────────────────────────────────────────
  app.post("/api/checkout/session", requireAuth, async (req: any, res) => {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({
        error: "Payment processing not configured",
        code: "STRIPE_NOT_CONFIGURED",
        message: "Stripe keys not yet set up. Please contact support.",
      });
    }

    try {
      const { plan, billing } = req.body; // plan: season_pass | pro; billing: annual | monthly
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      const customerId = await upsertStripeCustomer(stripe, user);

      const priceKey = `${plan}_${billing || "annual"}` as keyof typeof PRICES;
      const priceId = PRICES[priceKey];
      if (!priceId) return res.status(400).json({ error: "Invalid plan or billing cycle" });

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${APP_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_URL}/upgrade`,
        metadata: { userId: user.id, plan, billing: billing || "annual" },
        subscription_data: {
          metadata: { userId: user.id, tier: plan },
          trial_end: user.trialEndsAt && new Date(user.trialEndsAt) > new Date()
            ? Math.floor(new Date(user.trialEndsAt).getTime() / 1000)
            : undefined,
        },
        allow_promotion_codes: true,
        billing_address_collection: "auto",
        currency: "aud",
      });

      res.json({ url: session.url, sessionId: session.id });
    } catch (err: any) {
      console.error("Checkout session error:", err);
      res.status(500).json({ error: err.message || "Failed to create checkout session" });
    }
  });

  // ── CUSTOMER PORTAL ────────────────────────────────────────────────────────
  app.post("/api/billing/portal", requireAuth, async (req: any, res) => {
    const stripe = getStripe();
    if (!stripe) return res.status(503).json({ error: "Stripe not configured" });

    try {
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      if (!user.stripeCustomerId) return res.status(400).json({ error: "No billing account found" });

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${APP_URL}/settings`,
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error("Portal error:", err);
      res.status(500).json({ error: err.message || "Failed to open billing portal" });
    }
  });

  // ── STRIPE WEBHOOK ─────────────────────────────────────────────────────────
  app.post("/api/webhooks/stripe", async (req: any, res) => {
    const stripe = getStripe();
    if (!stripe) return res.status(503).send("Stripe not configured");

    const sig = req.headers["stripe-signature"];
    if (!sig || !STRIPE_WEBHOOK_SECRET) {
      return res.status(400).send("Missing webhook signature or secret");
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error("Webhook signature failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          if (!userId || !session.subscription) break;

          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = subscription.items.data[0]?.price?.id || "";
          const tier = tierFromPriceId(priceId);
          const expiresAt = new Date((subscription as any).current_period_end * 1000);

          await db.update(users).set({
            subscriptionTier: tier,
            subscriptionStatus: "active",
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            subscriptionExpiresAt: expiresAt,
            trialEndsAt: null,
          }).where(eq(users.id, userId));

          console.log(`✅ Subscription activated: ${userId} → ${tier}`);
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = (subscription.metadata as any)?.userId;
          if (!userId) break;

          const priceId = subscription.items.data[0]?.price?.id || "";
          const tier = tierFromPriceId(priceId);
          const status = subscription.status === "active" ? "active"
            : subscription.status === "canceled" ? "cancelled"
            : subscription.status === "past_due" ? "expired"
            : "active";

          await db.update(users).set({
            subscriptionTier: status === "active" ? tier : "starter",
            subscriptionStatus: status,
            stripePriceId: priceId,
            subscriptionExpiresAt: new Date((subscription as any).current_period_end * 1000),
          }).where(eq(users.id, userId));

          console.log(`🔄 Subscription updated: ${userId} → ${tier} (${status})`);
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = (subscription.metadata as any)?.userId;
          if (!userId) break;

          await db.update(users).set({
            subscriptionTier: "starter",
            subscriptionStatus: "cancelled",
            stripeSubscriptionId: null,
            stripePriceId: null,
            subscriptionExpiresAt: new Date(),
          }).where(eq(users.id, userId));

          console.log(`❌ Subscription cancelled: ${userId}`);
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;
          const customer = await stripe.customers.retrieve(customerId);
          if ((customer as Stripe.Customer).metadata?.userId) {
            await db.update(users).set({
              subscriptionStatus: "expired",
              subscriptionTier: "starter",
            }).where(eq(users.id, (customer as Stripe.Customer).metadata.userId));
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (err) {
      console.error("Webhook processing error:", err);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
}
