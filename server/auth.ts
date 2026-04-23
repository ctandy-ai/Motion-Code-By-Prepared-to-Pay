import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { randomUUID } from "crypto";

// ── USER ROLES ─────────────────────────────────────────────────────────────────
export const USER_ROLES = {
  ADMIN: 'admin',
  HEAD_COACH: 'coach',
  ASSISTANT_COACH: 'assistant_coach',
  ATHLETE: 'athlete',
  CLINICIAN: 'clinician',
  NSO_ADMIN: 'nso_admin',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Extend Express types for role middleware compatibility
declare global {
  namespace Express {
    interface Request {
      coachId?: string;
      userRole?: UserRole;
    }
  }
}

// ── SESSION SETUP ───────────────────────────────────────────────────────────────

export function getSession() {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required");
  }

  const sessionTtl = 24 * 60 * 60 * 1000; // 24 hours
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  const isProduction = process.env.NODE_ENV === "production";
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: sessionTtl,
    },
  });
}

// ── PASSPORT SETUP ──────────────────────────────────────────────────────────────

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          
          if (!user || !user.password) {
            return done(null, false, { message: "Invalid email or password" });
          }

          const isValidPassword = await bcrypt.compare(password, user.password);
          
          if (!isValidPassword) {
            return done(null, false, { message: "Invalid email or password" });
          }

          if (!user.isActive) {
            return done(null, false, { message: "Account is deactivated" });
          }

          return done(null, { id: user.id, email: user.email, role: user.role });
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, { id: user.id, email: user.email, role: user.role });
    } catch (error) {
      done(error);
    }
  });

  // ── AUTH ROUTES ─────────────────────────────────────────────────────────────

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName, role: requestedRole, sport, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = randomUUID();
      const userRole = requestedRole === "coach" ? "coach" : "athlete";

      // Split name into firstName/lastName if provided as single field
      let resolvedFirstName = firstName;
      let resolvedLastName = lastName;
      if (!firstName && name) {
        const parts = name.trim().split(" ");
        resolvedFirstName = parts[0];
        resolvedLastName = parts.slice(1).join(" ") || undefined;
      }

      const org = await storage.createOrganization({
        name: `${resolvedFirstName || email}'s Organization`,
        subscriptionStatus: "trial",
        subscriptionTier: "pro",
        maxCoaches: 5,
        maxAthletes: 50,
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      await storage.upsertUser({
        id: userId,
        email,
        password: hashedPassword,
        firstName: resolvedFirstName,
        lastName: resolvedLastName,
        role: userRole,
        organizationId: org.id,
      });

      req.login({ id: userId, email, role: userRole }, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging in after signup" });
        }
        res.json({ success: true, user: { id: userId, email, role: userRole } });
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Error creating account" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging in" });
        }
        res.json({ success: true, user });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Error destroying session" });
        }
        res.clearCookie('connect.sid', { path: '/' });
        res.json({ success: true });
      });
    });
  });

  // Password reset endpoints
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      
      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ 
          success: true, 
          message: "If an account exists with this email, a reset link will be provided" 
        });
      }

      const resetToken = randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.createPasswordResetToken(user.id, resetToken, expiresAt);

      const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
      
      res.json({ 
        success: true, 
        resetLink,
        message: "Password reset link generated successfully"
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Error processing request" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const resetToken = await storage.getPasswordResetToken(token);

      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      if (resetToken.used) {
        return res.status(400).json({ message: "This reset link has already been used" });
      }

      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "This reset link has expired" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(resetToken.userId, hashedPassword);
      await storage.markTokenAsUsed(resetToken.id);

      res.json({ 
        success: true, 
        message: "Password reset successfully" 
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Error resetting password" });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = await storage.getUser((req.user as any).id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        trialEndsAt: user.trialEndsAt,
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });

  app.put("/api/auth/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { firstName, lastName, email } = req.body;
      const userId = (req.user as any).id;

      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (email !== (req.user as any).email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }

      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      await storage.upsertUser({
        id: userId,
        email,
        firstName,
        lastName,
        password: currentUser.password,
        role: currentUser.role,
        organizationId: currentUser.organizationId,
        profileImageUrl: currentUser.profileImageUrl,
        isActive: currentUser.isActive,
      });

      res.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Error updating profile" });
    }
  });

  app.post("/api/auth/change-password", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { currentPassword, newPassword } = req.body;
      const userId = (req.user as any).id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.password) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await storage.upsertUser({
        id: userId,
        email: user.email,
        password: hashedNewPassword,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        profileImageUrl: user.profileImageUrl,
        isActive: user.isActive,
      });

      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ message: "Error changing password" });
    }
  });
}

// ── AUTH MIDDLEWARE ─────────────────────────────────────────────────────────────

/** Session-based auth check (Replit/passport) */
export const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

/** Legacy header-based auth middleware (GitHub MC Pro coach routes) */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const coachId = req.header('x-coach-id') || 'default-coach';
  req.coachId = coachId;
  
  const user = (req as any).user;
  if (user?.role) {
    req.userRole = user.role as UserRole;
  } else {
    req.userRole = USER_ROLES.ATHLETE;
  }
  
  next();
}

/** Role-based access: require any of the given roles */
export function requireRole(...allowedRoles: UserRole[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.userRole || ((req as any).user?.role as UserRole) || USER_ROLES.ATHLETE;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        requiredRoles: allowedRoles,
        currentRole: userRole
      });
    }
    
    next();
  };
}

export function requireHeadCoach(req: Request, res: Response, next: NextFunction) {
  const allowedRoles: UserRole[] = [USER_ROLES.HEAD_COACH, USER_ROLES.ADMIN];
  const userRole = req.userRole || ((req as any).user?.role as UserRole) || USER_ROLES.ATHLETE;
  
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'This action requires Head Coach or Admin privileges',
      currentRole: userRole
    });
  }
  
  next();
}

export function requireCoach(req: Request, res: Response, next: NextFunction) {
  const coachRoles: UserRole[] = [USER_ROLES.HEAD_COACH, USER_ROLES.ASSISTANT_COACH, USER_ROLES.ADMIN];
  const userRole = req.userRole || ((req as any).user?.role as UserRole) || USER_ROLES.ATHLETE;
  
  if (!coachRoles.includes(userRole)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'This action requires Coach privileges',
      currentRole: userRole
    });
  }
  
  next();
}

export function getPermissions(role: UserRole) {
  switch (role) {
    case USER_ROLES.ADMIN:
    case USER_ROLES.HEAD_COACH:
      return {
        canManageAthletes: true,
        canManagePrograms: true,
        canDeleteAthletes: true,
        canBroadcastMessages: true,
        canAccessAI: true,
        canManageTeams: true,
        canViewAnalytics: true,
        canEditSettings: true,
        canAssignPrograms: true,
      };
    case USER_ROLES.ASSISTANT_COACH:
      return {
        canManageAthletes: true,
        canManagePrograms: true,
        canDeleteAthletes: false,
        canBroadcastMessages: false,
        canAccessAI: true,
        canManageTeams: false,
        canViewAnalytics: true,
        canEditSettings: false,
        canAssignPrograms: true,
      };
    default:
      return {
        canManageAthletes: false,
        canManagePrograms: false,
        canDeleteAthletes: false,
        canBroadcastMessages: false,
        canAccessAI: false,
        canManageTeams: false,
        canViewAnalytics: false,
        canEditSettings: false,
        canAssignPrograms: false,
      };
  }
}

// ── TIER MIDDLEWARE ─────────────────────────────────────────────────────────────

export function requireTier(...tiers: string[]): RequestHandler {
  return async (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const { storage } = await import('./storage');
      const user = await storage.getUser(req.user.id);
      const userTier = user?.subscriptionTier || 'trial';
      if (tiers.includes(userTier) || userTier === 'admin') {
        return next();
      }
      return res.status(403).json({ error: 'Upgrade required', requiredTier: tiers[0] });
    } catch {
      return next();
    }
  };
}

export function requireValidSubscription(req: any, res: Response, next: NextFunction) {
  // Allow all authenticated users through — subscription enforcement is handled at feature level
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
}

export function generateTeamCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
