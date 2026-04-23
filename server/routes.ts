import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { ThumbnailService } from "./thumbnailService";
import { generateBlueprint, getBeltFromSessions, getBeltProgress, getWhyItWorks } from "./lib/blueprint-generator";
import { setupStripeRoutes } from "./stripeRoutes";
import { z } from "zod";
import { db } from "./db";
import { eq, and, or, desc, inArray } from "drizzle-orm";
import { setupAuth } from "./auth";
import { authMiddleware, requireAuth, getPermissions, USER_ROLES, requireHeadCoach, requireCoach, requireTier, requireValidSubscription, generateTeamCode } from "./auth";
import {
  insertExerciseSchema,
  insertAthleteSchema,
  insertProgramSchema,
  insertProgramExerciseSchema,
  insertAthleteProgramSchema,
  insertWorkoutLogSchema,
  insertPersonalRecordSchema,
  insertProgramPhaseSchema,
  insertProgramWeekSchema,
  insertTrainingBlockSchema,
  insertBlockExerciseSchema,
  insertBlockTemplateSchema,
  insertTemplateBlockExerciseSchema,
  insertReadinessSurveySchema,
  insertCoachHeuristicSchema,
  insertPendingAiActionSchema,
  insertSessionRpeSchema,
  insertMessageSchema,
  insertNotificationSchema,
  insertAthleteTargetSchema,
  insertBodyCompositionLogSchema,
  insertCustomSurveySchema,
  insertTeamSessionSchema,
  insertSessionParticipantSchema,
  // Replit-only schema imports
  insertOrganizationSchema,
  insertProWaitlistSchema,
  insertClinicReferralSchema,
  proWaitlist,
  coachMessages,
  trainingBlocks,
  blockExercises,
  programPhases,
  programWeeks,
  wellnessCheckins,
  auditLogs,
  users,
  athleteSessionCompletions,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check (no auth required)
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Setup authentication BEFORE registering other routes
  await setupAuth(app);
  
  
  // Auth middleware must come AFTER passport session setup
  app.use(authMiddleware);
  
  // User permissions and roles API
  app.get("/api/user/permissions", (req, res) => {
    const user = (req as any).user;
    // Default to ATHLETE (least-privileged) for unauthenticated users
    const userRole = user?.role || USER_ROLES.ATHLETE;
    const permissions = getPermissions(userRole);
    
    res.json({
      role: userRole,
      permissions,
      availableRoles: Object.values(USER_ROLES),
      isAuthenticated: !!user,
    });
  });

  app.get("/api/user/role", (req, res) => {
    const user = (req as any).user;
    // Default to ATHLETE (least-privileged) for unauthenticated users
    res.json({
      role: user?.role || USER_ROLES.ATHLETE,
      user: user ? {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      } : null,
      isAuthenticated: !!user,
    });
  });

  // Audit logs API (Admin/Head Coach only)
  app.get("/api/audit-logs", requireHeadCoach, async (req, res) => {
    try {
      const { limit = 100, offset = 0, action, resourceType, userId, startDate, endDate } = req.query;
      const logs = await storage.getAuditLogs({
        limit: Math.min(Number(limit), 500),
        offset: Number(offset),
        action: action as string,
        resourceType: resourceType as string,
        userId: userId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });
      res.json(logs);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/audit-logs/summary", requireHeadCoach, async (req, res) => {
    try {
      const { days = 7 } = req.query;
      const summary = await storage.getAuditLogSummary(Number(days));
      res.json(summary);
    } catch (error) {
      console.error("Failed to fetch audit summary:", error);
      res.status(500).json({ error: "Failed to fetch audit summary" });
    }
  });

  // Athlete Targets routes - 1RM goals and performance targets
  app.get("/api/athletes/:athleteId/targets", async (req, res) => {
    try {
      const targets = await storage.getAthleteTargets(req.params.athleteId);
      res.json(targets);
    } catch (error) {
      console.error("Failed to fetch athlete targets:", error);
      res.status(500).json({ error: "Failed to fetch athlete targets" });
    }
  });

  app.get("/api/athlete-targets/:id", async (req, res) => {
    try {
      const target = await storage.getAthleteTarget(req.params.id);
      if (!target) {
        return res.status(404).json({ error: "Target not found" });
      }
      res.json(target);
    } catch (error) {
      console.error("Failed to fetch athlete target:", error);
      res.status(500).json({ error: "Failed to fetch athlete target" });
    }
  });

  app.post("/api/athletes/:athleteId/targets", requireCoach, async (req, res) => {
    try {
      const validated = insertAthleteTargetSchema.parse({
        ...req.body,
        athleteId: req.params.athleteId,
      });
      const target = await storage.createAthleteTarget(validated);
      res.status(201).json(target);
    } catch (error) {
      console.error("Failed to create athlete target:", error);
      res.status(400).json({ error: "Invalid target data" });
    }
  });

  app.patch("/api/athlete-targets/:id", requireCoach, async (req, res) => {
    try {
      const validated = insertAthleteTargetSchema.partial().parse(req.body);
      const target = await storage.updateAthleteTarget(req.params.id, validated);
      if (!target) {
        return res.status(404).json({ error: "Target not found" });
      }
      res.json(target);
    } catch (error) {
      console.error("Failed to update athlete target:", error);
      res.status(400).json({ error: "Failed to update target" });
    }
  });

  app.delete("/api/athlete-targets/:id", requireCoach, async (req, res) => {
    try {
      const success = await storage.deleteAthleteTarget(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Target not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete athlete target:", error);
      res.status(500).json({ error: "Failed to delete target" });
    }
  });

  // Announcements / Noticeboard routes
  app.get("/api/announcements", async (req, res) => {
    try {
      const allAnnouncements = await storage.getAnnouncements();
      res.json(allAnnouncements);
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  app.get("/api/announcements/:id", async (req, res) => {
    try {
      const announcement = await storage.getAnnouncement(req.params.id);
      if (!announcement) {
        return res.status(404).json({ error: "Announcement not found" });
      }
      res.json(announcement);
    } catch (error) {
      console.error("Failed to fetch announcement:", error);
      res.status(500).json({ error: "Failed to fetch announcement" });
    }
  });

  app.post("/api/announcements", requireCoach, async (req, res) => {
    try {
      const announcement = await storage.createAnnouncement(req.body);
      res.status(201).json(announcement);
    } catch (error) {
      console.error("Failed to create announcement:", error);
      res.status(500).json({ error: "Failed to create announcement" });
    }
  });

  app.patch("/api/announcements/:id", requireCoach, async (req, res) => {
    try {
      const announcement = await storage.updateAnnouncement(req.params.id, req.body);
      if (!announcement) {
        return res.status(404).json({ error: "Announcement not found" });
      }
      res.json(announcement);
    } catch (error) {
      console.error("Failed to update announcement:", error);
      res.status(500).json({ error: "Failed to update announcement" });
    }
  });

  app.delete("/api/announcements/:id", requireCoach, async (req, res) => {
    try {
      const success = await storage.deleteAnnouncement(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Announcement not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete announcement:", error);
      res.status(500).json({ error: "Failed to delete announcement" });
    }
  });

  // Body Composition routes
  app.get("/api/athletes/:athleteId/body-composition", async (req, res) => {
    try {
      const logs = await storage.getBodyCompositionLogs(req.params.athleteId);
      res.json(logs);
    } catch (error) {
      console.error("Failed to fetch body composition logs:", error);
      res.status(500).json({ error: "Failed to fetch body composition logs" });
    }
  });

  app.post("/api/athletes/:athleteId/body-composition", requireCoach, async (req, res) => {
    try {
      const validated = insertBodyCompositionLogSchema.parse({
        ...req.body,
        athleteId: req.params.athleteId,
      });
      const log = await storage.createBodyCompositionLog(validated);
      res.status(201).json(log);
    } catch (error) {
      console.error("Failed to create body composition log:", error);
      res.status(400).json({ error: "Invalid body composition data" });
    }
  });

  app.delete("/api/body-composition/:id", requireCoach, async (req, res) => {
    try {
      const success = await storage.deleteBodyCompositionLog(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Body composition log not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete body composition log:", error);
      res.status(500).json({ error: "Failed to delete body composition log" });
    }
  });

  // Custom Surveys routes
  app.get("/api/custom-surveys", async (req, res) => {
    try {
      const surveys = await storage.getCustomSurveys();
      res.json(surveys);
    } catch (error) {
      console.error("Failed to fetch custom surveys:", error);
      res.status(500).json({ error: "Failed to fetch custom surveys" });
    }
  });

  app.get("/api/custom-surveys/:id", async (req, res) => {
    try {
      const survey = await storage.getCustomSurvey(req.params.id);
      if (!survey) {
        return res.status(404).json({ error: "Survey not found" });
      }
      res.json(survey);
    } catch (error) {
      console.error("Failed to fetch custom survey:", error);
      res.status(500).json({ error: "Failed to fetch custom survey" });
    }
  });

  app.post("/api/custom-surveys", requireCoach, async (req, res) => {
    try {
      const validated = insertCustomSurveySchema.parse(req.body);
      const survey = await storage.createCustomSurvey(validated);
      res.status(201).json(survey);
    } catch (error) {
      console.error("Failed to create custom survey:", error);
      res.status(400).json({ error: "Invalid survey data" });
    }
  });

  app.patch("/api/custom-surveys/:id", requireCoach, async (req, res) => {
    try {
      const validated = insertCustomSurveySchema.partial().parse(req.body);
      const survey = await storage.updateCustomSurvey(req.params.id, validated);
      if (!survey) {
        return res.status(404).json({ error: "Survey not found" });
      }
      res.json(survey);
    } catch (error) {
      console.error("Failed to update custom survey:", error);
      res.status(400).json({ error: "Invalid survey data" });
    }
  });

  app.delete("/api/custom-surveys/:id", requireCoach, async (req, res) => {
    try {
      const success = await storage.deleteCustomSurvey(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Survey not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete custom survey:", error);
      res.status(500).json({ error: "Failed to delete custom survey" });
    }
  });

  // Team Sessions routes
  app.get("/api/team-sessions", async (req, res) => {
    try {
      const sessions = await storage.getTeamSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Failed to fetch team sessions:", error);
      res.status(500).json({ error: "Failed to fetch team sessions" });
    }
  });

  app.get("/api/team-sessions/:id", async (req, res) => {
    try {
      const session = await storage.getTeamSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Failed to fetch team session:", error);
      res.status(500).json({ error: "Failed to fetch team session" });
    }
  });

  app.post("/api/team-sessions", requireCoach, async (req, res) => {
    try {
      const body = {
        ...req.body,
        scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined,
      };
      const validated = insertTeamSessionSchema.parse(body);
      const session = await storage.createTeamSession(validated);
      res.status(201).json(session);
    } catch (error) {
      console.error("Failed to create team session:", error);
      res.status(400).json({ error: "Invalid team session data" });
    }
  });

  app.patch("/api/team-sessions/:id", requireCoach, async (req, res) => {
    try {
      const body = {
        ...req.body,
        ...(req.body.scheduledAt && { scheduledAt: new Date(req.body.scheduledAt) }),
      };
      const validated = insertTeamSessionSchema.partial().parse(body);
      const session = await storage.updateTeamSession(req.params.id, validated);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Failed to update team session:", error);
      res.status(400).json({ error: "Invalid team session data" });
    }
  });

  app.delete("/api/team-sessions/:id", requireCoach, async (req, res) => {
    try {
      const success = await storage.deleteTeamSession(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete team session:", error);
      res.status(500).json({ error: "Failed to delete team session" });
    }
  });

  // Session Participants routes
  app.get("/api/team-sessions/:sessionId/participants", async (req, res) => {
    try {
      const participants = await storage.getSessionParticipants(req.params.sessionId);
      res.json(participants);
    } catch (error) {
      console.error("Failed to fetch participants:", error);
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });

  app.post("/api/team-sessions/:sessionId/participants", requireCoach, async (req, res) => {
    try {
      const validated = insertSessionParticipantSchema.parse({
        sessionId: req.params.sessionId,
        athleteId: req.body.athleteId,
        status: req.body.status || 'registered',
        notes: req.body.notes,
      });
      const participant = await storage.addSessionParticipant(validated);
      res.status(201).json(participant);
    } catch (error) {
      console.error("Failed to add participant:", error);
      res.status(400).json({ error: "Invalid participant data" });
    }
  });

  app.post("/api/team-sessions/:sessionId/participants/:athleteId/check-in", async (req, res) => {
    try {
      const participant = await storage.checkInParticipant(req.params.sessionId, req.params.athleteId);
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }
      res.json(participant);
    } catch (error) {
      console.error("Failed to check in participant:", error);
      res.status(500).json({ error: "Failed to check in participant" });
    }
  });

  app.delete("/api/team-sessions/:sessionId/participants/:athleteId", requireCoach, async (req, res) => {
    try {
      const success = await storage.removeSessionParticipant(req.params.sessionId, req.params.athleteId);
      if (!success) {
        return res.status(404).json({ error: "Participant not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to remove participant:", error);
      res.status(500).json({ error: "Failed to remove participant" });
    }
  });

  // Exercise routes
  app.get("/api/exercises", async (req, res) => {
    try {
      const exercises = await storage.getExercises();
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  });

  app.get("/api/exercises/:id", async (req, res) => {
    try {
      const exercise = await storage.getExercise(req.params.id);
      if (!exercise) {
        return res.status(404).json({ error: "Exercise not found" });
      }
      res.json(exercise);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exercise" });
    }
  });

  app.post("/api/exercises", requireCoach, async (req, res) => {
    try {
      const validated = insertExerciseSchema.parse(req.body);
      const exercise = await storage.createExercise(validated);
      res.status(201).json(exercise);
    } catch (error) {
      res.status(400).json({ error: "Invalid exercise data" });
    }
  });

  app.patch("/api/exercises/:id", async (req, res) => {
    try {
      const validated = insertExerciseSchema.partial().parse(req.body);
      const exercise = await storage.updateExercise(req.params.id, validated);
      if (!exercise) {
        return res.status(404).json({ error: "Exercise not found" });
      }
      res.json(exercise);
    } catch (error) {
      res.status(400).json({ error: "Failed to update exercise" });
    }
  });

  app.delete("/api/exercises/:id", requireHeadCoach, async (req, res) => {
    try {
      const deleted = await storage.deleteExercise(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Exercise not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete exercise" });
    }
  });

  // Athlete stats route
  app.get("/api/athletes/:id/stats", async (req, res) => {
    try {
      const athleteId = req.params.id;
      const athlete = await storage.getAthlete(athleteId);
      
      if (!athlete) {
        return res.status(404).json({ error: "Athlete not found" });
      }
      
      const workoutLogs = await storage.getWorkoutLogs(athleteId);
      const personalRecords = await storage.getPersonalRecords(athleteId);
      
      const totalWorkouts = workoutLogs.length;
      const totalSets = workoutLogs.reduce((sum, log) => sum + log.sets, 0);
      const totalPRs = personalRecords.length;
      
      const xp = (totalWorkouts * 50) + (totalSets * 10) + (totalPRs * 100);
      const level = Math.floor(Math.sqrt(xp / 100)) + 1;
      
      res.json({
        athleteId,
        totalWorkouts,
        totalSets,
        totalPRs,
        xp,
        level,
      });
    } catch (error) {
      console.error("Failed to calculate athlete stats:", error);
      res.status(500).json({ error: "Failed to calculate athlete stats" });
    }
  });

  // Leaderboard routes
  app.get("/api/leaderboards", async (req, res) => {
    try {
      const { category = "prs" } = req.query;
      const athletes = await storage.getAthletes();
      const workoutLogs = await storage.getWorkoutLogs();
      
      const leaderboardData = await Promise.all(athletes.map(async (athlete) => {
        const personalRecords = await storage.getPersonalRecords(athlete.id);
        const athleteWorkouts = workoutLogs.filter(w => w.athleteId === athlete.id);
        const totalSets = athleteWorkouts.reduce((sum, w) => sum + (w.sets || 0), 0);
        const totalVolume = athleteWorkouts.reduce((sum, w) => {
          try {
            const weights = w.weightPerSet ? (Array.isArray(JSON.parse(w.weightPerSet)) ? JSON.parse(w.weightPerSet) : []) : [];
            const reps = w.repsPerSet ? (Array.isArray(JSON.parse(w.repsPerSet)) ? JSON.parse(w.repsPerSet) : []) : [];
            if (!Array.isArray(weights) || !Array.isArray(reps)) return sum;
            return sum + weights.reduce((vol: number, weight: number, i: number) => vol + (weight * (reps[i] || 0)), 0);
          } catch {
            return sum;
          }
        }, 0);
        
        const topPR = personalRecords.length > 0 
          ? personalRecords.reduce((max, pr) => pr.maxWeight > max.maxWeight ? pr : max, personalRecords[0])
          : null;
        
        return {
          athleteId: athlete.id,
          athleteName: athlete.name,
          team: athlete.team,
          position: athlete.position,
          totalPRs: personalRecords.length,
          topPRWeight: topPR?.maxWeight || 0,
          topPRExerciseId: topPR?.exerciseId || null,
          totalWorkouts: athleteWorkouts.length,
          totalSets,
          totalVolume: Math.round(totalVolume),
          complianceRate: athlete.stats?.complianceRate || 0,
          lastWorkout: athleteWorkouts.length > 0 
            ? athleteWorkouts.sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())[0].completedAt 
            : null,
        };
      }));
      
      let sortedData = [...leaderboardData];
      switch(category) {
        case "prs":
          sortedData.sort((a, b) => b.totalPRs - a.totalPRs);
          break;
        case "volume":
          sortedData.sort((a, b) => b.totalVolume - a.totalVolume);
          break;
        case "workouts":
          sortedData.sort((a, b) => b.totalWorkouts - a.totalWorkouts);
          break;
        case "compliance":
          sortedData.sort((a, b) => b.complianceRate - a.complianceRate);
          break;
        case "strongest":
          sortedData.sort((a, b) => b.topPRWeight - a.topPRWeight);
          break;
        default:
          sortedData.sort((a, b) => b.totalPRs - a.totalPRs);
      }
      
      res.json({
        category,
        leaderboard: sortedData.map((item, index) => ({ ...item, rank: index + 1 })),
      });
    } catch (error) {
      console.error("Leaderboard error:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Athlete routes
  app.get("/api/athletes", async (req, res) => {
    try {
      const athletes = await storage.getAthletes();
      res.json(athletes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch athletes" });
    }
  });

  app.get("/api/athletes/:id", async (req, res) => {
    try {
      const athlete = await storage.getAthlete(req.params.id);
      if (!athlete) {
        return res.status(404).json({ error: "Athlete not found" });
      }
      res.json(athlete);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch athlete" });
    }
  });

  app.post("/api/athletes", requireCoach, async (req, res) => {
    try {
      const validated = insertAthleteSchema.parse(req.body);
      const athlete = await storage.createAthlete(validated);
      res.status(201).json(athlete);
    } catch (error) {
      res.status(400).json({ error: "Invalid athlete data" });
    }
  });

  app.patch("/api/athletes/:id", async (req, res) => {
    try {
      const validated = insertAthleteSchema.partial().parse(req.body);
      const athlete = await storage.updateAthlete(req.params.id, validated);
      if (!athlete) {
        return res.status(404).json({ error: "Athlete not found" });
      }
      res.json(athlete);
    } catch (error) {
      res.status(400).json({ error: "Failed to update athlete" });
    }
  });

  app.delete("/api/athletes/:id", requireHeadCoach, async (req, res) => {
    try {
      const deleted = await storage.deleteAthlete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Athlete not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete athlete" });
    }
  });

  // Teams CRUD routes
  app.get("/api/teams", async (req, res) => {
    try {
      const allTeams = await storage.getTeams();
      res.json(allTeams);
    } catch (error) {
      res.status(500).json({ error: "Failed to get teams" });
    }
  });

  app.get("/api/teams/:id", async (req, res) => {
    try {
      const team = await storage.getTeam(req.params.id);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ error: "Failed to get team" });
    }
  });

  app.post("/api/teams", requireCoach, async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Team name is required" });
      }
      const existingTeam = await storage.getTeamByName(name);
      if (existingTeam) {
        return res.status(409).json({ error: "Team with this name already exists" });
      }
      const newTeam = await storage.createTeam({ name, description });
      res.status(201).json(newTeam);
    } catch (error) {
      res.status(500).json({ error: "Failed to create team" });
    }
  });

  // Athlete-Team assignment routes
  app.get("/api/athletes/:athleteId/teams", async (req, res) => {
    try {
      const athleteTeams = await storage.getAthleteTeams(req.params.athleteId);
      res.json(athleteTeams);
    } catch (error) {
      res.status(500).json({ error: "Failed to get athlete teams" });
    }
  });

  app.post("/api/athletes/:athleteId/teams/:teamId", requireCoach, async (req, res) => {
    try {
      await storage.addAthleteToTeam(req.params.athleteId, req.params.teamId);
      res.status(201).json({ success: true });
    } catch (error: any) {
      if (error?.code === '23505') {
        return res.status(409).json({ error: "Athlete already in team" });
      }
      res.status(500).json({ error: "Failed to add athlete to team" });
    }
  });

  app.delete("/api/athletes/:athleteId/teams/:teamId", requireCoach, async (req, res) => {
    try {
      await storage.removeAthleteFromTeam(req.params.athleteId, req.params.teamId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove athlete from team" });
    }
  });

  // Bulk import athletes from CSV
  app.post("/api/athletes/import", requireHeadCoach, async (req, res) => {
    try {
      const { parseTeamBuildrCSV, extractUniqueTeams } = await import("./csv-parser");
      const { csvContent } = req.body;

      if (!csvContent) {
        return res.status(400).json({ error: "CSV content is required" });
      }

      // Parse CSV
      const parsedAthletes = parseTeamBuildrCSV(csvContent);
      
      // Extract unique team names
      const teamNames = extractUniqueTeams(parsedAthletes);

      // Create teams (get or create)
      const teamMap = new Map<string, string>();
      for (const teamName of teamNames) {
        const team = await storage.getOrCreateTeam(teamName);
        teamMap.set(teamName, team.id);
      }

      // Fetch existing athletes once for duplicate checking
      const existingAthletes = await storage.getAthletes();
      const existingEmails = new Set(existingAthletes.map(a => a.email));
      const emailToAthleteMap = new Map<string, any>();
      
      // Add existing athletes to map for team assignment
      existingAthletes.forEach(a => emailToAthleteMap.set(a.email, a));

      // Create new athletes, skipping duplicates
      const createdAthletes: any[] = [];
      const skipped: string[] = [];

      for (const parsed of parsedAthletes) {
        try {
          if (existingEmails.has(parsed.athlete.email)) {
            skipped.push(parsed.athlete.email);
            continue;
          }
          
          const created = await storage.createAthlete(parsed.athlete);
          createdAthletes.push(created);
          emailToAthleteMap.set(created.email, created);
        } catch (err) {
          console.error(`Failed to create athlete ${parsed.athlete.email}:`, err);
          skipped.push(parsed.athlete.email);
        }
      }

      // Create athlete-team relationships using email-based mapping
      for (const parsed of parsedAthletes) {
        const athlete = emailToAthleteMap.get(parsed.athlete.email);
        if (!athlete) continue;
        
        for (const groupName of parsed.groups) {
          const teamId = teamMap.get(groupName);
          if (teamId) {
            try {
              await storage.addAthleteToTeam(athlete.id, teamId);
            } catch (err) {
              // Ignore duplicate team assignments
            }
          }
        }
      }

      res.json({
        success: true,
        athletesCreated: createdAthletes.length,
        athletesSkipped: skipped.length,
        teamsCreated: teamNames.length,
        athletes: createdAthletes,
      });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ error: "Failed to import athletes" });
    }
  });

  // AI Coach routes
  app.post("/api/ai/insights", async (req, res) => {
    try {
      const { generateCoachingInsights } = await import("./ai-coach");
      const { athleteId } = req.body;

      if (!athleteId) {
        return res.status(400).json({ error: "Athlete ID is required" });
      }

      const athlete = await storage.getAthlete(athleteId);
      if (!athlete) {
        return res.status(404).json({ error: "Athlete not found" });
      }

      const workoutLogs = await storage.getWorkoutLogs(athleteId);
      const personalRecords = await storage.getPersonalRecords(athleteId);
      const athleteStats = await storage.getAthleteStatsOrCreate(athleteId);
      
      const recentActivity = {
        totalWorkouts: athleteStats.totalWorkouts,
        totalSets: athleteStats.totalSetsCompleted,
        totalPRs: personalRecords.length,
        streak: athleteStats.currentStreak,
      };

      const insights = await generateCoachingInsights({
        athlete,
        workoutLogs,
        personalRecords,
        recentActivity
      });

      res.json({ insights });
    } catch (error) {
      console.error("AI insights error:", error);
      res.status(500).json({ error: "Failed to generate insights" });
    }
  });

  app.post("/api/ai/recommend-program", async (req, res) => {
    try {
      const { generateProgramRecommendation } = await import("./ai-coach");
      const { athleteId, goal } = req.body;

      if (!athleteId) {
        return res.status(400).json({ error: "Athlete ID is required" });
      }

      const athlete = await storage.getAthlete(athleteId);
      if (!athlete) {
        return res.status(404).json({ error: "Athlete not found" });
      }

      const personalRecords = await storage.getPersonalRecords(athleteId);
      const athleteStats = await storage.getAthleteStatsOrCreate(athleteId);

      const recommendation = await generateProgramRecommendation({
        athlete,
        personalRecords,
        recentActivity: {
          totalWorkouts: athleteStats.totalWorkouts,
          totalSets: athleteStats.totalSetsCompleted,
          totalPRs: personalRecords.length,
          streak: athleteStats.currentStreak,
        }
      }, goal);

      res.json(recommendation);
    } catch (error) {
      console.error("Program recommendation error:", error);
      res.status(500).json({ error: "Failed to generate recommendation" });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { chatWithCoachEnhanced } = await import("./ai-coach");
      const { messages, athleteId } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      let athleteContext;
      if (athleteId) {
        const athlete = await storage.getAthlete(athleteId);
        if (athlete) {
          const personalRecords = await storage.getPersonalRecords(athleteId);
          const workoutLogs = await storage.getWorkoutLogs();
          const athleteWorkouts = workoutLogs.filter(w => w.athleteId === athleteId);
          const totalSets = athleteWorkouts.reduce((sum, w) => sum + (w.setsCompleted || 0), 0);
          
          athleteContext = {
            athlete,
            personalRecords,
            recentActivity: {
              totalWorkouts: athleteWorkouts.length,
              totalSets: totalSets,
              totalPRs: personalRecords.length,
              streak: 0,
            }
          };
        }
      }

      const response = await chatWithCoachEnhanced(messages, athleteContext);
      res.json(response);
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat" });
    }
  });

  // AI Autofill - Generate exercise suggestions for a week
  app.post("/api/ai/autofill-week", requireCoach, async (req, res) => {
    try {
      const { generateWeekAutofill } = await import("./ai-coach");
      const { programId, weekNumber, athleteId, phase, focus, targetDays } = req.body;

      if (!programId || !weekNumber) {
        return res.status(400).json({ error: "programId and weekNumber are required" });
      }

      const result = await generateWeekAutofill({
        programId,
        weekNumber,
        athleteId,
        phase,
        focus,
        targetDays,
      });

      res.json(result);
    } catch (error) {
      console.error("AI Autofill error:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to generate autofill suggestions",
        exercises: [],
      });
    }
  });

  // Program routes
  app.get("/api/programs", async (req, res) => {
    try {
      const programs = await storage.getPrograms();
      res.json(programs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch programs" });
    }
  });

  app.get("/api/programs/:id", async (req, res) => {
    try {
      const program = await storage.getProgram(req.params.id);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      res.json(program);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch program" });
    }
  });

  app.post("/api/programs", requireCoach, async (req, res) => {
    try {
      const validated = insertProgramSchema.parse(req.body);
      const program = await storage.createProgram(validated);
      res.status(201).json(program);
    } catch (error) {
      res.status(400).json({ error: "Invalid program data" });
    }
  });

  app.patch("/api/programs/:id", async (req, res) => {
    try {
      const validated = insertProgramSchema.partial().parse(req.body);
      const program = await storage.updateProgram(req.params.id, validated);
      if (!program) {
        return res.status(404).json({ error: "Program not found" });
      }
      res.json(program);
    } catch (error) {
      res.status(400).json({ error: "Failed to update program" });
    }
  });

  app.delete("/api/programs/:id", requireHeadCoach, async (req, res) => {
    try {
      const deleted = await storage.deleteProgram(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Program not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete program" });
    }
  });

  // Seed Templates route
  app.post("/api/seed-templates", async (req, res) => {
    try {
      const { seedTemplates } = await import("./seed-templates");
      const templates = await seedTemplates();
      res.json({ success: true, count: templates.length, templates });
    } catch (error) {
      res.status(500).json({ error: "Failed to seed templates" });
    }
  });

  // Program Template routes
  app.get("/api/program-templates", async (req, res) => {
    try {
      const templates = await storage.getProgramTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch program templates" });
    }
  });

  app.get("/api/program-templates/:id", async (req, res) => {
    try {
      const template = await storage.getProgramTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  app.post("/api/program-templates", async (req, res) => {
    try {
      const template = await storage.createProgramTemplate(req.body);
      res.status(201).json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  app.delete("/api/program-templates/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProgramTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  app.get("/api/program-templates/:id/exercises", async (req, res) => {
    try {
      const exercises = await storage.getTemplateExercises(req.params.id);
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch template exercises" });
    }
  });

  app.post("/api/program-templates/:id/exercises", async (req, res) => {
    try {
      const exercise = await storage.createTemplateExercise({
        ...req.body,
        templateId: req.params.id,
      });
      res.status(201).json(exercise);
    } catch (error) {
      res.status(500).json({ error: "Failed to add exercise to template" });
    }
  });

  app.post("/api/program-templates/:id/instantiate", async (req, res) => {
    try {
      const { programName } = req.body;
      if (!programName) {
        return res.status(400).json({ error: "Program name is required" });
      }
      const program = await storage.instantiateProgramFromTemplate(req.params.id, programName);
      res.status(201).json(program);
    } catch (error) {
      res.status(500).json({ error: "Failed to instantiate program from template" });
    }
  });

  // Template Week Metadata routes
  app.get("/api/program-templates/:id/weeks", async (req, res) => {
    try {
      const weekData = await storage.getTemplateWeekMetadata(req.params.id);
      res.json(weekData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch week metadata" });
    }
  });

  app.post("/api/import-periodization", async (req, res) => {
    try {
      const { csvContent, templateName, templateDescription } = req.body;

      if (!csvContent || !templateName) {
        return res.status(400).json({ error: "CSV content and template name are required" });
      }

      // Check if template with this name already exists
      const existingTemplates = await storage.getProgramTemplates();
      if (existingTemplates.some(t => t.name === templateName)) {
        return res.status(409).json({ error: "Template with this name already exists" });
      }

      // Parse the CSV
      const { parsePeriodizationCSV } = await import("./periodization-parser");
      const weekMetadata = parsePeriodizationCSV(csvContent);

      // Validate parsed data
      if (weekMetadata.length === 0) {
        return res.status(400).json({ error: "No valid weekly data found in CSV" });
      }

      // Validate using Zod schema (without templateId which is added later)
      const { insertTemplateWeekMetadataSchema } = await import("../shared/schema");
      const validationSchema = insertTemplateWeekMetadataSchema.omit({ templateId: true });
      
      const validatedMetadata = weekMetadata.map((week, idx) => {
        try {
          return validationSchema.parse(week);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          throw new Error(`Invalid data at week ${week.weekNumber || idx + 1}: ${errorMsg}`);
        }
      });

      // Create the template
      const template = await storage.createProgramTemplate({
        name: templateName,
        description: templateDescription || `${validatedMetadata.length}-week periodized training program`,
        category: "Periodization",
        duration: validatedMetadata.length,
        tags: ["periodization", "annual-plan", "belt-progression"],
        isPublic: 1,
      });

      // Bulk insert week metadata with templateId
      const metadataWithTemplateId = validatedMetadata.map(week => ({
        ...week,
        templateId: template.id,
      }));
      
      const createdMetadata = await storage.bulkCreateTemplateWeekMetadata(metadataWithTemplateId);

      res.status(201).json({
        template,
        weekCount: createdMetadata.length,
        message: `Successfully imported ${createdMetadata.length}-week periodization plan`,
      });
    } catch (error) {
      console.error("Failed to import periodization:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to import periodization plan";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Program Exercise routes
  app.get("/api/program-exercises", async (req, res) => {
    try {
      const programExercises = await storage.getProgramExercises();
      res.json(programExercises);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch program exercises" });
    }
  });

  app.get("/api/programs/:programId/exercises", async (req, res) => {
    try {
      const exercises = await storage.getProgramExercises(req.params.programId);
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch program exercises" });
    }
  });

  app.post("/api/program-exercises", async (req, res) => {
    try {
      const validated = insertProgramExerciseSchema.parse(req.body);
      const programExercise = await storage.createProgramExercise(validated);
      res.status(201).json(programExercise);
    } catch (error) {
      res.status(400).json({ error: "Invalid program exercise data" });
    }
  });

  app.patch("/api/program-exercises/:id", async (req, res) => {
    try {
      const updated = await storage.updateProgramExercise(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Program exercise not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update program exercise" });
    }
  });

  app.delete("/api/program-exercises/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProgramExercise(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Program exercise not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete program exercise" });
    }
  });

  // Athlete Program routes
  app.get("/api/athletes/:athleteId/programs", async (req, res) => {
    try {
      const programs = await storage.getAthletePrograms(req.params.athleteId);
      res.json(programs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch athlete programs" });
    }
  });

  // Get all athlete-program assignments with joined details for dashboard
  app.get("/api/athlete-programs/summary", async (req, res) => {
    try {
      const allAthletes = await storage.getAthletes();
      const allPrograms = await storage.getPrograms();
      
      const assignments = [];
      for (const athlete of allAthletes) {
        const athletePrograms = await storage.getAthletePrograms(athlete.id);
        const activePrograms = athletePrograms.filter(ap => ap.status === "active");
        
        for (const ap of activePrograms) {
          const program = allPrograms.find(p => p.id === ap.programId);
          assignments.push({
            id: ap.id,
            athleteId: athlete.id,
            athleteName: athlete.name,
            programId: ap.programId,
            programName: program?.name || "Unknown Program",
            programDuration: program?.duration || 0,
            startDate: ap.startDate,
            status: ap.status,
          });
        }
      }
      
      res.json(assignments);
    } catch (error) {
      console.error("Failed to fetch athlete program summary:", error);
      res.status(500).json({ error: "Failed to fetch athlete program summary" });
    }
  });

  app.post("/api/athlete-programs", requireCoach, async (req, res) => {
    try {
      const body = {
        ...req.body,
        startDate: new Date(req.body.startDate),
      };
      const validated = insertAthleteProgramSchema.parse(body);
      const athleteProgram = await storage.createAthleteProgram(validated);
      res.status(201).json(athleteProgram);
    } catch (error) {
      console.error("Athlete program creation error:", error);
      res.status(400).json({ error: "Invalid athlete program data" });
    }
  });

  app.patch("/api/athlete-programs/:id", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      const athleteProgram = await storage.updateAthleteProgram(req.params.id, status);
      if (!athleteProgram) {
        return res.status(404).json({ error: "Athlete program not found" });
      }
      res.json(athleteProgram);
    } catch (error) {
      res.status(400).json({ error: "Failed to update athlete program" });
    }
  });

  app.get("/api/athletes/:athleteId/today-workout", async (req, res) => {
    try {
      const { athleteId } = req.params;
      
      const athletePrograms = await storage.getAthletePrograms(athleteId);
      const activePrograms = athletePrograms.filter(ap => ap.status === "active");
      
      if (activePrograms.length === 0) {
        return res.json({ exercises: [], hasWorkout: false, message: "No active program assigned" });
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get all exercises for lookup
      const allExercises = await storage.getExercises();
      const exerciseMap = new Map(allExercises.map(e => [e.id, e]));
      
      const todayWorkouts = [];
      
      for (const ap of activePrograms) {
        const program = await storage.getProgram(ap.programId);
        if (!program) continue;
        
        const startDate = new Date(ap.startDate);
        startDate.setHours(0, 0, 0, 0);
        
        const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceStart < 0) continue;
        
        const currentWeek = Math.floor(daysSinceStart / 7) + 1;
        const currentDay = (daysSinceStart % 7) + 1;
        
        // Get training blocks for today using the correct data model
        const blocks = await storage.getTrainingBlocks(ap.programId, currentWeek, currentDay);
        
        for (const block of blocks) {
          const blockExercises = await storage.getBlockExercises(block.id);
          
          for (const be of blockExercises) {
            const exercise = exerciseMap.get(be.exerciseId);
            if (exercise) {
              // Parse scheme to get sets/reps
              const scheme = be.scheme || block.scheme || "3x10";
              const schemeMatch = scheme.match(/(\d+)\s*[xX×]\s*(\d+)/);
              const numSets = schemeMatch ? parseInt(schemeMatch[1]) : 3;
              const targetReps = schemeMatch ? parseInt(schemeMatch[2]) : 10;

              const sets = Array.from({ length: numSets }, (_, i) => ({
                setNumber: i + 1,
                targetReps,
                targetWeight: null,
                completed: false,
              }));

              todayWorkouts.push({
                id: be.id,
                exerciseId: exercise.id,
                exerciseName: exercise.name,
                blockId: block.id,
                blockTitle: block.title,
                scheme: be.scheme || block.scheme,
                notes: be.notes,
                sets,
                program: program,
                athleteProgramId: ap.id,
                currentWeek,
                currentDay,
              });
            }
          }
        }
      }
      
      res.json({
        exercises: todayWorkouts,
        hasWorkout: todayWorkouts.length > 0,
        date: today.toISOString(),
      });
    } catch (error) {
      console.error("Failed to fetch today's workout:", error);
      res.status(500).json({ error: "Failed to fetch today's workout" });
    }
  });

  // Dashboard stats route
  app.get("/api/dashboard-stats", async (req, res) => {
    try {
      const allLogs = await storage.getWorkoutLogs();
      const allAthletes = await storage.getAthletes();
      const allRecords = await storage.getPersonalRecords();
      
      // Calculate total stats
      const totalWorkouts = allLogs.length;
      const totalSets = allLogs.reduce((sum, log) => sum + log.sets, 0);
      
      // Calculate XP: 50 XP per workout + 10 XP per set + 100 XP per PR
      const workoutXP = totalWorkouts * 50;
      const setXP = totalSets * 10;
      const prXP = allRecords.length * 100;
      const totalXP = workoutXP + setXP + prXP;
      
      // Calculate level (exponential: level = floor(sqrt(xp / 100)))
      const level = Math.floor(Math.sqrt(totalXP / 100)) + 1;
      
      // Calculate global streak (days with at least one workout)
      const workoutDates = allLogs.map(log => {
        const date = new Date(log.completedAt);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      }).sort((a, b) => b - a); // Sort descending
      
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      
      if (workoutDates.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTime = today.getTime();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        // Check if streak is active (workout today or yesterday)
        const uniqueDates = [...new Set(workoutDates)];
        const mostRecentWorkout = uniqueDates[0];
        const daysSinceLastWorkout = Math.floor((todayTime - mostRecentWorkout) / oneDayMs);
        
        if (daysSinceLastWorkout <= 1) {
          // Active streak
          let checkDate = todayTime;
          for (const workoutDate of uniqueDates) {
            if (workoutDate === checkDate || workoutDate === checkDate - oneDayMs) {
              currentStreak++;
              checkDate = workoutDate - oneDayMs;
            } else {
              break;
            }
          }
        }
        
        // Calculate longest streak
        for (let i = 0; i < uniqueDates.length; i++) {
          if (i === 0) {
            tempStreak = 1;
          } else {
            const daysDiff = Math.floor((uniqueDates[i - 1] - uniqueDates[i]) / oneDayMs);
            if (daysDiff === 1) {
              tempStreak++;
            } else {
              longestStreak = Math.max(longestStreak, tempStreak);
              tempStreak = 1;
            }
          }
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      }
      
      // Top athletes by workout count
      const athleteWorkoutCounts = allAthletes.map(athlete => {
        const workoutCount = allLogs.filter(log => log.athleteId === athlete.id).length;
        const athleteSets = allLogs
          .filter(log => log.athleteId === athlete.id)
          .reduce((sum, log) => sum + log.sets, 0);
        const athletePRs = allRecords.filter(record => record.athleteId === athlete.id).length;
        const athleteXP = (workoutCount * 50) + (athleteSets * 10) + (athletePRs * 100);
        
        return {
          ...athlete,
          workoutCount,
          xp: athleteXP,
        };
      }).sort((a, b) => b.xp - a.xp).slice(0, 5);
      
      // Recent PRs
      const recentPRs = allRecords
        .sort((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime())
        .slice(0, 5);

      // Daily activity for last 7 days
      const dailyActivity = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayLogs = allLogs.filter(log => {
          const logDate = new Date(log.completedAt);
          return logDate >= date && logDate < nextDate;
        });

        return {
          date: date.toISOString().slice(0, 10),
          workouts: dayLogs.length,
          sets: dayLogs.reduce((sum, log) => sum + log.sets, 0),
        };
      });
      
      res.json({
        totalWorkouts,
        totalSets,
        totalXP,
        totalPRs: allRecords.length,
        level,
        currentStreak,
        longestStreak,
        topAthletes: athleteWorkoutCounts,
        recentPRs,
        dailyActivity,
      });
    } catch (error) {
      console.error("Failed to calculate dashboard stats:", error);
      res.status(500).json({ error: "Failed to calculate dashboard stats" });
    }
  });

  // Team Pulse - At-a-glance athlete status indicators
  app.get("/api/team-pulse", async (req, res) => {
    try {
      const allAthletes = await storage.getAthletes();
      const allWellness = await storage.getAllReadinessSurveys();
      const allLogs = await storage.getWorkoutLogs();
      const athletePrograms = await storage.getAthletePrograms();
      
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      // Calculate status for each athlete
      const athletePulse = allAthletes.map(athlete => {
        // Get recent wellness data (last 3 days)
        const recentWellness = allWellness
          .filter(w => w.athleteId === athlete.id && new Date(w.surveyDate) >= threeDaysAgo)
          .sort((a, b) => new Date(b.surveyDate).getTime() - new Date(a.surveyDate).getTime());
        
        const latestWellness = recentWellness[0];
        
        // Get recent workouts (last 7 days)
        const recentWorkouts = allLogs.filter(log => 
          log.athleteId === athlete.id && 
          new Date(log.completedAt) >= sevenDaysAgo
        );
        
        // Check if athlete has an active assigned program
        const hasProgram = athletePrograms.some(ap => 
          ap.athleteId === athlete.id && ap.status === 'active'
        );
        
        // Calculate readiness score (average of recent wellness)
        let readinessScore = 0;
        let readinessStatus: 'good' | 'moderate' | 'low' | 'unknown' = 'unknown';
        
        if (latestWellness) {
          readinessScore = latestWellness.readinessScore || 0;
          if (readinessScore >= 7) {
            readinessStatus = 'good';
          } else if (readinessScore >= 5) {
            readinessStatus = 'moderate';
          } else {
            readinessStatus = 'low';
          }
        }
        
        // Calculate compliance (workouts in last 7 days)
        const workoutsThisWeek = recentWorkouts.length;
        let complianceStatus: 'high' | 'moderate' | 'low' = 'low';
        if (workoutsThisWeek >= 4) {
          complianceStatus = 'high';
        } else if (workoutsThisWeek >= 2) {
          complianceStatus = 'moderate';
        }
        
        // Calculate soreness alert
        const sorenessAlert = latestWellness && (latestWellness.soreness || 0) >= 7;
        
        // Check for missed workouts (has program but no workout in 3+ days)
        const threeDaysAgoTime = threeDaysAgo.getTime();
        const hasRecentWorkout = recentWorkouts.some(log => 
          new Date(log.completedAt).getTime() >= threeDaysAgoTime
        );
        const missedWorkouts = hasProgram && !hasRecentWorkout;
        
        // Overall status
        let overallStatus: 'green' | 'yellow' | 'red' = 'green';
        if (readinessStatus === 'low' || sorenessAlert || missedWorkouts) {
          overallStatus = 'red';
        } else if (readinessStatus === 'moderate' || complianceStatus === 'low') {
          overallStatus = 'yellow';
        }
        
        return {
          id: athlete.id,
          name: athlete.name,
          team: athlete.team,
          position: athlete.position,
          belt: athlete.belt || 'unclassified',
          overallStatus,
          readinessScore,
          readinessStatus,
          workoutsThisWeek,
          complianceStatus,
          sorenessAlert,
          missedWorkouts,
          hasProgram,
          lastWellnessDate: latestWellness?.surveyDate || null,
          lastWorkoutDate: recentWorkouts[0]?.completedAt || null,
        };
      });
      
      // Summary stats
      const athletesWithReadiness = athletePulse.filter(a => a.readinessScore > 0);
      const avgReadiness = athletesWithReadiness.length > 0 
        ? Math.round(athletesWithReadiness.reduce((sum, a) => sum + a.readinessScore, 0) / athletesWithReadiness.length)
        : 0;
      
      const summary = {
        total: athletePulse.length,
        green: athletePulse.filter(a => a.overallStatus === 'green').length,
        yellow: athletePulse.filter(a => a.overallStatus === 'yellow').length,
        red: athletePulse.filter(a => a.overallStatus === 'red').length,
        avgReadiness,
        sorenessAlerts: athletePulse.filter(a => a.sorenessAlert).length,
        missedWorkouts: athletePulse.filter(a => a.missedWorkouts).length,
      };
      
      res.json({ athletes: athletePulse, summary });
    } catch (error) {
      console.error("Failed to calculate team pulse:", error);
      res.status(500).json({ error: "Failed to calculate team pulse" });
    }
  });

  // Workout Log routes
  app.get("/api/workout-logs", async (req, res) => {
    try {
      const athleteId = req.query.athleteId as string | undefined;
      const logs = await storage.getWorkoutLogs(athleteId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workout logs" });
    }
  });

  app.post("/api/workout-logs", async (req, res) => {
    try {
      const validated = insertWorkoutLogSchema.parse(req.body);
      const log = await storage.createWorkoutLog(validated);

      const weights = validated.weightPerSet.split(",").map(Number).filter(w => w > 0);
      const reps = validated.repsPerSet.split(",").map(Number);

      let bestSetWeight = 0;
      let bestSetReps = 0;
      let totalVolume = 0;
      let estimated1RM = 0;

      weights.forEach((w, i) => {
        const r = reps[i] || 0;
        totalVolume += w * r;
        if (w > bestSetWeight) {
          bestSetWeight = w;
          bestSetReps = r;
        }
      });

      if (bestSetWeight > 0 && bestSetReps > 0) {
        estimated1RM = Math.round(bestSetWeight * (1 + bestSetReps / 30));
      }

      let isPR = false;
      let newPR = null;

      if (bestSetWeight > 0 && validated.athleteId) {
        const existingRecords = await storage.getPersonalRecords(validated.athleteId);
        const exerciseRecords = existingRecords.filter(pr => pr.exerciseId === validated.exerciseId);
        const maxPrevWeight = exerciseRecords.reduce((max, pr) => Math.max(max, pr.maxWeight || 0), 0);

        if (bestSetWeight > maxPrevWeight) {
          isPR = true;
          newPR = await storage.createPersonalRecord({
            athleteId: validated.athleteId,
            exerciseId: validated.exerciseId,
            maxWeight: bestSetWeight,
            reps: bestSetReps,
          });
        }
      }

      res.status(201).json({
        ...log,
        isPR,
        newPR: newPR ? { maxWeight: newPR.maxWeight, reps: newPR.reps } : null,
        estimated1RM,
        totalVolume,
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid workout log data" });
    }
  });

  app.get("/api/workout-logs/:athleteId/exercise-history/:exerciseId", async (req, res) => {
    try {
      const { athleteId, exerciseId } = req.params;
      const allLogs = await storage.getWorkoutLogs(athleteId);
      const exerciseLogs = allLogs
        .filter(l => l.exerciseId === exerciseId)
        .sort((a, b) => {
          const da = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          const db = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          return db - da;
        })
        .slice(0, 10)
        .map(l => {
          const weights = l.weightPerSet.split(",").map(Number);
          const reps = l.repsPerSet.split(",").map(Number);
          const bestWeight = Math.max(...weights.filter(w => w > 0), 0);
          const bestReps = reps[weights.indexOf(bestWeight)] || 0;
          const totalVolume = weights.reduce((sum, w, i) => sum + w * (reps[i] || 0), 0);
          const est1RM = bestWeight > 0 && bestReps > 0 ? Math.round(bestWeight * (1 + bestReps / 30)) : 0;
          return {
            id: l.id,
            date: l.completedAt,
            sets: l.sets,
            repsPerSet: l.repsPerSet,
            weightPerSet: l.weightPerSet,
            bestWeight,
            bestReps,
            totalVolume,
            estimated1RM: est1RM,
            notes: l.notes,
          };
        });
      res.json(exerciseLogs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exercise history" });
    }
  });

  // Personal Record routes
  app.get("/api/personal-records", async (req, res) => {
    try {
      const athleteId = req.query.athleteId as string | undefined;
      const records = await storage.getPersonalRecords(athleteId);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch personal records" });
    }
  });

  app.post("/api/personal-records", async (req, res) => {
    try {
      const validated = insertPersonalRecordSchema.parse(req.body);
      const record = await storage.createPersonalRecord(validated);
      res.status(201).json(record);
    } catch (error) {
      res.status(400).json({ error: "Invalid personal record data" });
    }
  });

  // AI Exercise Classification
  app.post("/api/ai/classify-sample", async (req, res) => {
    try {
      const { classifyExercise } = await import("./ai-classifier");
      const exercises = req.body.exercises as any[];
      
      if (!exercises || !Array.isArray(exercises)) {
        return res.status(400).json({ error: "Exercises array is required" });
      }

      const results = [];
      for (const exercise of exercises) {
        try {
          const classification = await classifyExercise(exercise);
          results.push({
            original: exercise,
            aiClassification: classification
          });
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Failed to classify ${exercise.name}:`, error);
          results.push({
            original: exercise,
            error: "Classification failed"
          });
        }
      }

      res.json({ results });
    } catch (error: any) {
      console.error("AI classification error:", error);
      res.status(500).json({ error: "Failed to classify exercises" });
    }
  });

  // Program Phases
  app.get("/api/programs/:programId/phases", async (req, res) => {
    try {
      const phases = await storage.getProgramPhases(req.params.programId);
      res.json(phases);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch phases" });
    }
  });

  app.post("/api/programs/:programId/phases", async (req, res) => {
    try {
      const validated = insertProgramPhaseSchema.parse({ ...req.body, programId: req.params.programId });
      const phase = await storage.createProgramPhase(validated);
      res.status(201).json(phase);
    } catch (error) {
      res.status(400).json({ error: "Invalid phase data" });
    }
  });

  app.patch("/api/phases/:id", async (req, res) => {
    try {
      const validated = insertProgramPhaseSchema.partial().parse(req.body);
      const phase = await storage.updateProgramPhase(req.params.id, validated);
      if (!phase) return res.status(404).json({ error: "Phase not found" });
      res.json(phase);
    } catch (error) {
      res.status(400).json({ error: "Failed to update phase" });
    }
  });

  app.delete("/api/phases/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProgramPhase(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Phase not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete phase" });
    }
  });

  // Program Weeks
  app.get("/api/programs/:programId/weeks", async (req, res) => {
    try {
      const weeks = await storage.getProgramWeeks(req.params.programId);
      res.json(weeks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weeks" });
    }
  });

  app.get("/api/programs/:programId/weeks/:weekNumber", async (req, res) => {
    try {
      const result = await storage.getWeekWithBlocks(req.params.programId, parseInt(req.params.weekNumber));
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch week" });
    }
  });

  app.post("/api/programs/:programId/weeks", async (req, res) => {
    try {
      const validated = insertProgramWeekSchema.parse({ ...req.body, programId: req.params.programId });
      const week = await storage.createProgramWeek(validated);
      res.status(201).json(week);
    } catch (error) {
      res.status(400).json({ error: "Invalid week data" });
    }
  });

  app.patch("/api/weeks/:id", async (req, res) => {
    try {
      const validated = insertProgramWeekSchema.partial().parse(req.body);
      const week = await storage.updateProgramWeek(req.params.id, validated);
      if (!week) return res.status(404).json({ error: "Week not found" });
      res.json(week);
    } catch (error) {
      res.status(400).json({ error: "Failed to update week" });
    }
  });

  // Training Blocks
  app.get("/api/programs/:programId/blocks", async (req, res) => {
    try {
      const weekNumber = req.query.week ? parseInt(req.query.week as string) : undefined;
      const dayNumber = req.query.day ? parseInt(req.query.day as string) : undefined;
      const blocks = await storage.getTrainingBlocks(req.params.programId, weekNumber, dayNumber);
      res.json(blocks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blocks" });
    }
  });

  // Get all training blocks for calendar view (all active programs)
  app.get("/api/calendar/training-blocks", async (req, res) => {
    try {
      const allAthletes = await storage.getAthletes();
      const allPrograms = await storage.getPrograms();
      const calendarBlocks: Array<{
        athleteId: string;
        athleteName: string;
        programId: string;
        programName: string;
        startDate: Date;
        blockId: string;
        blockTitle: string;
        weekNumber: number;
        dayNumber: number;
        belt: string | null;
        focus: string[];
      }> = [];
      
      for (const athlete of allAthletes) {
        const athletePrograms = await storage.getAthletePrograms(athlete.id);
        const activePrograms = athletePrograms.filter(ap => ap.status === "active");
        
        for (const ap of activePrograms) {
          const program = allPrograms.find(p => p.id === ap.programId);
          if (!program || !ap.startDate) continue;
          
          const blocks = await storage.getTrainingBlocks(ap.programId);
          for (const block of blocks) {
            calendarBlocks.push({
              athleteId: athlete.id,
              athleteName: athlete.name,
              programId: ap.programId,
              programName: program.name,
              startDate: ap.startDate,
              blockId: block.id,
              blockTitle: block.title,
              weekNumber: block.weekNumber,
              dayNumber: block.dayNumber,
              belt: block.belt,
              focus: block.focus || [],
            });
          }
        }
      }
      
      res.json(calendarBlocks);
    } catch (error) {
      console.error("Failed to fetch calendar training blocks:", error);
      res.status(500).json({ error: "Failed to fetch calendar training blocks" });
    }
  });

  app.get("/api/blocks/:id", async (req, res) => {
    try {
      const block = await storage.getTrainingBlock(req.params.id);
      if (!block) return res.status(404).json({ error: "Block not found" });
      res.json(block);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch block" });
    }
  });

  app.post("/api/programs/:programId/blocks", async (req, res) => {
    try {
      const validated = insertTrainingBlockSchema.parse({ ...req.body, programId: req.params.programId });
      const block = await storage.createTrainingBlock(validated);
      res.status(201).json(block);
    } catch (error) {
      res.status(400).json({ error: "Invalid block data" });
    }
  });

  app.post("/api/programs/:programId/blocks/bulk", async (req, res) => {
    try {
      const blocks = req.body.blocks.map((b: any) => insertTrainingBlockSchema.parse({ ...b, programId: req.params.programId }));
      const created = await storage.bulkInsertTrainingBlocks(blocks);
      res.status(201).json(created);
    } catch (error) {
      res.status(400).json({ error: "Invalid blocks data" });
    }
  });

  app.patch("/api/blocks/:id", async (req, res) => {
    try {
      const validated = insertTrainingBlockSchema.partial().parse(req.body);
      const block = await storage.updateTrainingBlock(req.params.id, validated);
      if (!block) return res.status(404).json({ error: "Block not found" });
      res.json(block);
    } catch (error) {
      res.status(400).json({ error: "Failed to update block" });
    }
  });

  app.delete("/api/blocks/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTrainingBlock(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Block not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete block" });
    }
  });

  // Block Exercises
  app.get("/api/blocks/:blockId/exercises", async (req, res) => {
    try {
      const exercises = await storage.getBlockExercises(req.params.blockId);
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch block exercises" });
    }
  });

  app.post("/api/blocks/:blockId/exercises", async (req, res) => {
    try {
      const validated = insertBlockExerciseSchema.parse({ ...req.body, blockId: req.params.blockId });
      const exercise = await storage.createBlockExercise(validated);
      res.status(201).json(exercise);
    } catch (error) {
      res.status(400).json({ error: "Invalid exercise data" });
    }
  });

  app.delete("/api/block-exercises/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBlockExercise(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Exercise not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete exercise" });
    }
  });

  // Block Templates
  app.get("/api/block-templates", async (req, res) => {
    try {
      const templates = await storage.getBlockTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.get("/api/block-templates/:id", async (req, res) => {
    try {
      const template = await storage.getBlockTemplate(req.params.id);
      if (!template) return res.status(404).json({ error: "Template not found" });
      
      const exercises = await storage.getTemplateBlockExercises(req.params.id);
      res.json({ ...template, exercises });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  app.post("/api/block-templates", async (req, res) => {
    try {
      const validated = insertBlockTemplateSchema.parse(req.body);
      const template = await storage.createBlockTemplate(validated);
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ error: "Invalid template data" });
    }
  });

  app.delete("/api/block-templates/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBlockTemplate(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Template not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // Command Operations
  app.get("/api/programs/:programId/structure", async (req, res) => {
    try {
      const structure = await storage.getProgramStructure(req.params.programId);
      res.json(structure);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch program structure" });
    }
  });

  app.post("/api/blocks/:id/move", async (req, res) => {
    try {
      const { weekNumber, dayNumber, orderIndex } = req.body;
      console.log(`[MOVE] Block ${req.params.id}: week=${weekNumber}, day=${dayNumber}, order=${orderIndex}`);
      const block = await storage.moveBlock(req.params.id, weekNumber, dayNumber, orderIndex);
      if (!block) {
        console.log("[MOVE] Block not found in database");
        return res.status(404).json({ error: "Block not found" });
      }
      console.log(`[MOVE] Success - block now at week=${block.weekNumber}, day=${block.dayNumber}`);
      res.json(block);
    } catch (error) {
      console.error("[MOVE] Error:", error);
      res.status(400).json({ error: "Failed to move block" });
    }
  });

  app.post("/api/programs/:programId/blocks/reorder", async (req, res) => {
    try {
      const { weekNumber, dayNumber, blockIds } = req.body;
      await storage.reorderBlocks(req.params.programId, weekNumber, dayNumber, blockIds);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to reorder blocks" });
    }
  });

  app.post("/api/programs/:programId/duplicate-week", async (req, res) => {
    try {
      const { sourceWeek, targetWeek } = req.body;
      const blocks = await storage.duplicateWeekBlocks(req.params.programId, sourceWeek, targetWeek);
      res.status(201).json(blocks);
    } catch (error) {
      res.status(400).json({ error: "Failed to duplicate week" });
    }
  });

  app.post("/api/programs/:programId/instantiate-template", async (req, res) => {
    try {
      const { templateId, weekNumber, dayNumber, orderIndex } = req.body;
      const block = await storage.instantiateBlockFromTemplate(templateId, req.params.programId, weekNumber, dayNumber, orderIndex);
      res.status(201).json(block);
    } catch (error) {
      res.status(400).json({ error: "Failed to instantiate template" });
    }
  });

  app.post("/api/programs/:programId/import-default-template", async (req, res) => {
    try {
      const coachId = req.coachId || 'default-coach';
      const { parseCSVProgram, getDefaultProgramCSVPath } = await import("./program-importer.js");
      const csvPath = getDefaultProgramCSVPath();
      const parsedData = parseCSVProgram(csvPath);
      const result = await storage.importProgramFromCSV(req.params.programId, parsedData, coachId);
      res.status(201).json(result);
    } catch (error: any) {
      console.error("CSV import error:", error);
      res.status(400).json({ error: error.message || "Failed to import CSV template" });
    }
  });

  app.post("/api/programs/:programId/import-csv", async (req, res) => {
    try {
      const coachId = req.coachId || 'default-coach';
      const { csvData } = req.body;
      const result = await storage.importProgramFromCSV(req.params.programId, csvData, coachId);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to import CSV data" });
    }
  });

  app.post("/api/programs/phases/:phaseId/duplicate", async (req, res) => {
    try {
      const coachId = req.coachId || 'default-coach';
      const { targetProgramId } = req.body;
      const newPhase = await storage.duplicatePhase(req.params.phaseId, coachId, targetProgramId);
      res.status(201).json(newPhase);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to duplicate phase" });
    }
  });

  app.post("/api/programs/:programId/duplicate-weeks", async (req, res) => {
    try {
      const coachId = req.coachId || 'default-coach';
      const { startWeek, endWeek, insertAtWeek, shiftSubsequent } = req.body;
      const weeks = await storage.duplicateWeeks(
        req.params.programId,
        startWeek,
        endWeek,
        insertAtWeek,
        shiftSubsequent || false,
        coachId
      );
      res.status(201).json(weeks);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to duplicate weeks" });
    }
  });

  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.listTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const templateData = await storage.getTemplateWithStructure(req.params.id);
      res.json(templateData);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch template" });
    }
  });

  app.get("/api/templates/:id/structure", async (req, res) => {
    try {
      const templateData = await storage.getTemplateWithStructure(req.params.id);
      res.json(templateData);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch template structure" });
    }
  });

  app.post("/api/templates/:id/copy-to-program", async (req, res) => {
    try {
      const coachId = req.coachId || 'default-coach';
      const { programName } = req.body;
      
      const newProgram = await storage.copyTemplateToProgram(req.params.id, coachId, programName);
      res.status(201).json(newProgram);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to copy template to program" });
    }
  });

  app.post("/api/templates/:id/copy-phases", async (req, res) => {
    try {
      const coachId = req.coachId || 'default-coach';
      const { phaseIds, targetProgramId } = req.body;
      
      if (!phaseIds || !Array.isArray(phaseIds) || phaseIds.length === 0) {
        return res.status(400).json({ error: "phaseIds array is required" });
      }
      if (!targetProgramId) {
        return res.status(400).json({ error: "targetProgramId is required" });
      }

      const newPhases = await storage.copyTemplatePhasesToProgram(req.params.id, phaseIds, targetProgramId, coachId);
      res.status(201).json(newPhases);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to copy phases from template" });
    }
  });

  app.post("/api/templates/:id/copy-weeks", async (req, res) => {
    try {
      const coachId = req.coachId || 'default-coach';
      const { startWeek, endWeek, targetProgramId, insertAtWeek } = req.body;
      
      if (startWeek === undefined || endWeek === undefined || !targetProgramId || insertAtWeek === undefined) {
        return res.status(400).json({ error: "startWeek, endWeek, targetProgramId, and insertAtWeek are required" });
      }

      const newWeeks = await storage.copyTemplateWeeksToProgram(
        req.params.id, 
        startWeek, 
        endWeek, 
        targetProgramId, 
        insertAtWeek, 
        coachId
      );
      res.status(201).json(newWeeks);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to copy weeks from template" });
    }
  });

  app.post("/api/templates/import-52week", async (req, res) => {
    try {
      const existingTemplates = await storage.listTemplates();
      if (existingTemplates.some(t => t.name === '52-Week Athletic Performance Program')) {
        return res.status(409).json({ error: "52-Week template already exists" });
      }

      const { importTemplateFromCSV, getDefaultTemplateCSVPath } = await import("./template-csv-importer.js");
      const csvPath = getDefaultTemplateCSVPath();
      const result = await importTemplateFromCSV(
        csvPath,
        '52-Week Athletic Performance Program',
        'Elite 52-week periodization plan covering GPP, SPP, peak, taper, competition, and recovery phases with belt progression system (White→Blue→Black)'
      );
      
      res.status(201).json(result);
    } catch (error: any) {
      console.error("Template import error:", error);
      res.status(500).json({ error: error.message || "Failed to import 52-week template" });
    }
  });

  app.post("/api/templates/seed-pathway-templates", async (req, res) => {
    try {
      const { runFullSeed } = await import("./template-seeder.js");
      await runFullSeed();
      res.status(201).json({ message: "24 pathway templates seeded successfully" });
    } catch (error: any) {
      console.error("Template seed error:", error);
      res.status(500).json({ error: error.message || "Failed to seed pathway templates" });
    }
  });

  // Pending AI Actions routes
  app.get("/api/ai/pending-actions", async (req, res) => {
    try {
      const actions = await storage.getPendingAiActionsByStatus("pending");
      res.json(actions);
    } catch (error) {
      console.error("Failed to fetch pending actions:", error);
      res.status(500).json({ error: "Failed to fetch pending actions" });
    }
  });

  app.post("/api/ai/pending-actions", async (req, res) => {
    try {
      const validated = insertPendingAiActionSchema.parse(req.body);
      const action = await storage.createPendingAiAction(validated);
      res.status(201).json(action);
    } catch (error) {
      console.error("Failed to create pending action:", error);
      res.status(400).json({ error: "Invalid action data" });
    }
  });

  app.post("/api/ai/pending-actions/:id/approve", async (req, res) => {
    try {
      const action = await storage.getPendingAiAction(req.params.id);
      if (!action) {
        return res.status(404).json({ error: "Action not found" });
      }

      const { executeApprovedAction } = await import("./ai-coach");
      const result = await executeApprovedAction({
        id: action.id,
        type: action.actionType as any,
        description: action.description,
        details: JSON.parse(action.details),
        athleteId: action.athleteId || undefined,
        programId: action.programId || undefined,
        status: 'approved'
      });

      await storage.updatePendingAiAction(action.id, { status: result.success ? 'executed' : 'failed' });
      res.json({ ...result, action });
    } catch (error) {
      console.error("Failed to approve action:", error);
      res.status(500).json({ error: "Failed to approve action" });
    }
  });

  app.post("/api/ai/pending-actions/:id/reject", async (req, res) => {
    try {
      const action = await storage.updatePendingAiAction(req.params.id, { status: "rejected" });
      if (!action) {
        return res.status(404).json({ error: "Action not found" });
      }
      res.json({ success: true, action });
    } catch (error) {
      console.error("Failed to reject action:", error);
      res.status(500).json({ error: "Failed to reject action" });
    }
  });

  // Coach Heuristics routes
  app.get("/api/heuristics", async (req, res) => {
    try {
      const coachId = req.query.coachId as string | undefined;
      const heuristics = await storage.getCoachHeuristics(coachId);
      res.json(heuristics);
    } catch (error) {
      console.error("Failed to fetch heuristics:", error);
      res.status(500).json({ error: "Failed to fetch heuristics" });
    }
  });

  app.get("/api/heuristics/active", async (req, res) => {
    try {
      const coachId = req.query.coachId as string | undefined;
      const heuristics = await storage.getActiveCoachHeuristics(coachId);
      res.json(heuristics);
    } catch (error) {
      console.error("Failed to fetch active heuristics:", error);
      res.status(500).json({ error: "Failed to fetch active heuristics" });
    }
  });

  app.get("/api/heuristics/:id", async (req, res) => {
    try {
      const heuristic = await storage.getCoachHeuristic(req.params.id);
      if (!heuristic) {
        return res.status(404).json({ error: "Heuristic not found" });
      }
      res.json(heuristic);
    } catch (error) {
      console.error("Failed to fetch heuristic:", error);
      res.status(500).json({ error: "Failed to fetch heuristic" });
    }
  });

  app.post("/api/heuristics", async (req, res) => {
    try {
      const validated = insertCoachHeuristicSchema.parse(req.body);
      const heuristic = await storage.createCoachHeuristic(validated);
      res.status(201).json(heuristic);
    } catch (error) {
      console.error("Failed to create heuristic:", error);
      res.status(400).json({ error: "Invalid heuristic data" });
    }
  });

  app.patch("/api/heuristics/:id", async (req, res) => {
    try {
      const validated = insertCoachHeuristicSchema.partial().parse(req.body);
      const heuristic = await storage.updateCoachHeuristic(req.params.id, validated);
      if (!heuristic) {
        return res.status(404).json({ error: "Heuristic not found" });
      }
      res.json(heuristic);
    } catch (error) {
      console.error("Failed to update heuristic:", error);
      res.status(400).json({ error: "Failed to update heuristic" });
    }
  });

  app.delete("/api/heuristics/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCoachHeuristic(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Heuristic not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete heuristic:", error);
      res.status(500).json({ error: "Failed to delete heuristic" });
    }
  });

  // Analytics Dashboard routes
  app.get("/api/analytics/overview", async (req, res) => {
    try {
      const athletes = await storage.getAthletes();
      const allWorkoutLogs: any[] = [];
      const allPRs: any[] = [];
      const allSurveys: any[] = [];

      for (const athlete of athletes) {
        const logs = await storage.getWorkoutLogs(athlete.id);
        const prs = await storage.getPersonalRecords(athlete.id);
        const surveys = await storage.getReadinessSurveys(athlete.id);
        
        allWorkoutLogs.push(...logs.map(log => ({ ...log, athleteName: athlete.name })));
        allPRs.push(...prs.map(pr => ({ ...pr, athleteName: athlete.name })));
        allSurveys.push(...surveys.map(s => ({ ...s, athleteName: athlete.name })));
      }

      const exercises = await storage.getExercises();
      const exerciseMap = new Map(exercises.map(e => [e.id, e]));

      // Strength progression data (last 30 days, grouped by exercise)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const strengthData = allWorkoutLogs
        .filter(log => log.completedAt && new Date(log.completedAt) >= thirtyDaysAgo)
        .map(log => {
          const weights = log.weightPerSet?.split(',').map((w: string) => parseFloat(w.trim())).filter((w: number) => !isNaN(w)) || [];
          const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
          const exercise = exerciseMap.get(log.exerciseId);
          return {
            date: new Date(log.completedAt).toISOString().split('T')[0],
            exerciseId: log.exerciseId,
            exerciseName: exercise?.name || 'Unknown',
            maxWeight,
            athleteName: log.athleteName,
          };
        })
        .filter(d => d.maxWeight > 0);

      // PR timeline (last 20 PRs)
      const prTimeline = allPRs
        .sort((a, b) => new Date(b.achievedAt || 0).getTime() - new Date(a.achievedAt || 0).getTime())
        .slice(0, 20)
        .map(pr => {
          const exercise = exerciseMap.get(pr.exerciseId);
          return {
            id: pr.id,
            athleteName: pr.athleteName,
            exerciseName: exercise?.name || 'Unknown',
            weight: pr.maxWeight,
            reps: pr.reps,
            date: pr.achievedAt,
          };
        });

      // Wellness trends (last 14 days)
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      
      const wellnessData = allSurveys
        .filter(s => s.surveyDate && new Date(s.surveyDate) >= fourteenDaysAgo)
        .map(s => {
          const sleepQuality = s.sleepQuality ?? 0;
          const energyLevel = s.energyLevel ?? 0;
          const overallReadiness = s.overallReadiness ?? 0;
          const muscleSoreness = s.muscleSoreness ?? 5;
          const stressLevel = s.stressLevel ?? 5;
          const mood = s.mood ?? 5;
          
          const readinessScore = Math.round(
            (sleepQuality * 0.20) +
            (energyLevel * 0.20) +
            (overallReadiness * 0.20) +
            ((10 - muscleSoreness) * 0.15) +
            ((10 - stressLevel) * 0.15) +
            (mood * 0.10)
          );
          
          return {
            date: new Date(s.surveyDate).toISOString().split('T')[0],
            readinessScore: isNaN(readinessScore) ? 5 : readinessScore,
            sleepQuality,
            energyLevel,
            athleteName: s.athleteName,
          };
        });

      // Volume tracking (workouts per week)
      const volumeByWeek: Record<string, { sets: number; reps: number; workouts: number }> = {};
      allWorkoutLogs.forEach(log => {
        if (!log.completedAt) return;
        const date = new Date(log.completedAt);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!volumeByWeek[weekKey]) {
          volumeByWeek[weekKey] = { sets: 0, reps: 0, workouts: 0 };
        }
        
        volumeByWeek[weekKey].sets += log.sets || 0;
        const repsArray = log.repsPerSet?.split(',').map((r: string) => parseInt(r.trim())).filter((r: number) => !isNaN(r)) || [];
        volumeByWeek[weekKey].reps += repsArray.reduce((sum: number, r: number) => sum + r, 0);
        volumeByWeek[weekKey].workouts += 1;
      });

      const volumeData = Object.entries(volumeByWeek)
        .map(([week, data]) => ({ week, ...data }))
        .sort((a, b) => a.week.localeCompare(b.week))
        .slice(-8);

      // Top exercises by PR count
      const exercisePRCount: Record<string, number> = {};
      allPRs.forEach(pr => {
        exercisePRCount[pr.exerciseId] = (exercisePRCount[pr.exerciseId] || 0) + 1;
      });
      
      const topExercises = Object.entries(exercisePRCount)
        .map(([exerciseId, count]) => ({
          exerciseId,
          exerciseName: exerciseMap.get(exerciseId)?.name || 'Unknown',
          prCount: count,
        }))
        .sort((a, b) => b.prCount - a.prCount)
        .slice(0, 5);

      res.json({
        strengthData,
        prTimeline,
        wellnessData,
        volumeData,
        topExercises,
        summary: {
          totalAthletes: athletes.length,
          totalWorkouts: allWorkoutLogs.length,
          totalPRs: allPRs.length,
          totalSurveys: allSurveys.length,
          avgReadiness: wellnessData.length > 0 
            ? Math.round(wellnessData.reduce((sum, w) => sum + w.readinessScore, 0) / wellnessData.length)
            : 0,
        },
      });
    } catch (error) {
      console.error("Analytics overview error:", error);
      res.status(500).json({ error: "Failed to fetch analytics data" });
    }
  });

  // Readiness Survey routes
  app.get("/api/athletes/:athleteId/readiness-surveys", async (req, res) => {
    try {
      const surveys = await storage.getReadinessSurveys(req.params.athleteId);
      res.json(surveys);
    } catch (error) {
      console.error("Failed to fetch readiness surveys:", error);
      res.status(500).json({ error: "Failed to fetch readiness surveys" });
    }
  });

  app.get("/api/athletes/:athleteId/readiness-surveys/today", async (req, res) => {
    try {
      const survey = await storage.getTodaysSurvey(req.params.athleteId);
      res.json(survey || null);
    } catch (error) {
      console.error("Failed to fetch today's survey:", error);
      res.status(500).json({ error: "Failed to fetch today's survey" });
    }
  });

  app.post("/api/readiness-surveys", async (req, res) => {
    try {
      const validated = insertReadinessSurveySchema.parse(req.body);
      
      // Check if athlete already submitted today
      const existingSurvey = await storage.getTodaysSurvey(validated.athleteId);
      if (existingSurvey) {
        return res.status(409).json({ 
          error: "Survey already submitted today",
          existingSurvey 
        });
      }
      
      const survey = await storage.createReadinessSurvey(validated);
      res.status(201).json(survey);
    } catch (error) {
      console.error("Failed to create readiness survey:", error);
      res.status(400).json({ error: "Invalid survey data" });
    }
  });

  app.get("/api/readiness-surveys/:id", async (req, res) => {
    try {
      const survey = await storage.getReadinessSurvey(req.params.id);
      if (!survey) {
        return res.status(404).json({ error: "Survey not found" });
      }
      res.json(survey);
    } catch (error) {
      console.error("Failed to fetch survey:", error);
      res.status(500).json({ error: "Failed to fetch survey" });
    }
  });

  // VALD Hub Integration routes
  app.get("/api/vald/config", async (req, res) => {
    try {
      const { valdHubService } = await import("./vald-hub");
      const config = valdHubService.getConfiguration();
      res.json(config);
    } catch (error) {
      console.error("Failed to get VALD config:", error);
      res.status(500).json({ error: "Failed to get VALD configuration" });
    }
  });

  app.get("/api/vald/profiles", async (req, res) => {
    try {
      const profiles = await storage.getValdProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Failed to fetch VALD profiles:", error);
      res.status(500).json({ error: "Failed to fetch VALD profiles" });
    }
  });

  app.post("/api/vald/sync/profiles", async (req, res) => {
    try {
      const { valdHubService } = await import("./vald-hub");
      
      if (!valdHubService.isConfigured()) {
        return res.status(400).json({ error: "VALD Hub credentials not configured" });
      }

      const log = await storage.createValdSyncLog({
        syncType: 'profiles',
        status: 'in_progress',
        recordsProcessed: 0,
      });

      try {
        const tenantId = await valdHubService.getTenantId();
        const apiProfiles = await valdHubService.getProfiles();
        
        let processed = 0;
        for (const apiProfile of apiProfiles) {
          const existing = await storage.getValdProfileByValdId(apiProfile.profileId);
          if (!existing) {
            const insertData = valdHubService.transformProfileToInsert(apiProfile, tenantId);
            await storage.createValdProfile(insertData);
            processed++;
          }
        }

        await storage.updateValdSyncLog(log.id, {
          status: 'completed',
          recordsProcessed: processed,
          completedAt: new Date(),
        });

        res.json({ success: true, processed, total: apiProfiles.length });
      } catch (syncError: any) {
        await storage.updateValdSyncLog(log.id, {
          status: 'failed',
          errorMessage: syncError.message,
          completedAt: new Date(),
        });
        throw syncError;
      }
    } catch (error: any) {
      console.error("Failed to sync VALD profiles:", error);
      res.status(500).json({ error: error.message || "Failed to sync VALD profiles" });
    }
  });

  app.post("/api/vald/profiles/:id/link", async (req, res) => {
    try {
      const { valdLinkProfileRequestSchema } = await import("@shared/schema");
      
      const parseResult = valdLinkProfileRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid request body", 
          details: parseResult.error.flatten().fieldErrors 
        });
      }
      
      const { athleteId } = parseResult.data;
      
      const profile = await storage.linkValdProfileToAthlete(req.params.id, athleteId);
      if (!profile) {
        return res.status(404).json({ error: "VALD profile not found" });
      }
      
      // Update existing tests to link to athlete (not create duplicates)
      const tests = await storage.getValdTestsForProfile(profile.id);
      for (const test of tests) {
        if (!test.athleteId) {
          await storage.updateValdTestAthleteLink(test.id, athleteId);
        }
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Failed to link VALD profile:", error);
      res.status(500).json({ error: "Failed to link VALD profile" });
    }
  });

  app.post("/api/vald/sync/tests", async (req, res) => {
    try {
      const { valdHubService } = await import("./vald-hub");
      const { valdSyncTestsRequestSchema } = await import("@shared/schema");
      
      const parseResult = valdSyncTestsRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid request body", 
          details: parseResult.error.flatten().fieldErrors 
        });
      }
      
      const { deviceType, modifiedFromUtc } = parseResult.data;
      
      if (!valdHubService.isConfigured()) {
        return res.status(400).json({ error: "VALD Hub credentials not configured" });
      }

      const log = await storage.createValdSyncLog({
        syncType: `tests-${deviceType}`,
        status: 'in_progress',
        recordsProcessed: 0,
      });

      try {
        const allProfiles = await storage.getValdProfiles();
        const allAthletes = await storage.getAthletes();
        let autoLinked = 0;
        for (const profile of allProfiles) {
          if (profile.athleteId) continue;
          const fullName = `${(profile.firstName || '').trim()} ${(profile.lastName || '').trim()}`.trim();
          if (!fullName) continue;
          const match = allAthletes.find(a => a.name.toLowerCase().trim() === fullName.toLowerCase());
          if (match) {
            const existingLink = allProfiles.find(p => p.athleteId === match.id);
            if (!existingLink) {
              await storage.linkValdProfileToAthlete(profile.id, match.id);
              const profileTests = await storage.getValdTestsForProfile(profile.id);
              for (const test of profileTests) {
                if (!test.athleteId) {
                  await storage.updateValdTestAthleteLink(test.id, match.id);
                }
              }
              autoLinked++;
            }
          }
        }
        if (autoLinked > 0) {
          console.log(`VALD: Auto-linked ${autoLinked} profiles to athletes by name match`);
        }

        const apiTests = await valdHubService.getAllTests(deviceType, modifiedFromUtc);
        
        let processed = 0;
        let metricsStored = 0;
        
        for (const apiTest of apiTests) {
          const existingTest = await storage.getValdTestByValdId(apiTest.testId);
          if (existingTest) {
            if (!existingTest.athleteId) {
              const profile = await storage.getValdProfileByValdId(apiTest.profileId);
              if (profile?.athleteId) {
                await storage.updateValdTestAthleteLink(existingTest.id, profile.athleteId);
              }
            }
            const existingResults = await storage.getValdTrialResults(existingTest.id);
            if (existingResults.length === 0) {
              const metrics = valdHubService.extractMetricsFromTest(apiTest, existingTest.id);
              if (metrics.length > 0) {
                await storage.bulkCreateValdTrialResults(metrics);
                metricsStored++;
              }
            }
            continue;
          }

          const valdProfile = await storage.getValdProfileByValdId(apiTest.profileId);
          if (!valdProfile) continue;

          const insertData = valdHubService.transformTestToInsert(
            apiTest, 
            valdProfile.id, 
            valdProfile.athleteId,
            deviceType
          );
          const newTest = await storage.createValdTest(insertData);
          
          const metrics = valdHubService.extractMetricsFromTest(apiTest, newTest.id);
          if (metrics.length > 0) {
            await storage.bulkCreateValdTrialResults(metrics);
            metricsStored++;
          }
          
          processed++;
        }
        
        console.log(`VALD sync complete: ${processed} new tests, ${metricsStored} tests with inline metrics, ${autoLinked} auto-linked profiles`);

        await storage.updateValdSyncLog(log.id, {
          status: 'completed',
          recordsProcessed: processed,
          completedAt: new Date(),
        });

        res.json({ success: true, processed, total: apiTests.length });
      } catch (syncError: any) {
        await storage.updateValdSyncLog(log.id, {
          status: 'failed',
          errorMessage: syncError.message,
          completedAt: new Date(),
        });
        throw syncError;
      }
    } catch (error: any) {
      console.error("Failed to sync VALD tests:", error);
      res.status(500).json({ error: error.message || "Failed to sync VALD tests" });
    }
  });

  app.get("/api/vald/athletes/:athleteId/tests", async (req, res) => {
    try {
      const tests = await storage.getValdTestsForAthlete(req.params.athleteId);
      res.json(tests);
    } catch (error) {
      console.error("Failed to fetch athlete VALD tests:", error);
      res.status(500).json({ error: "Failed to fetch athlete VALD tests" });
    }
  });

  app.get("/api/vald/athletes/:athleteId/data", async (req, res) => {
    try {
      const data = await storage.getAthleteValdData(req.params.athleteId);
      
      const serializableData = {
        profile: data.profile,
        tests: data.tests,
        latestResults: Object.fromEntries(data.latestResults),
      };
      
      res.json(serializableData);
    } catch (error) {
      console.error("Failed to fetch athlete VALD data:", error);
      res.status(500).json({ error: "Failed to fetch athlete VALD data" });
    }
  });

  app.get("/api/vald/tests/:testId/results", async (req, res) => {
    try {
      const results = await storage.getValdTrialResults(req.params.testId);
      res.json(results);
    } catch (error) {
      console.error("Failed to fetch test results:", error);
      res.status(500).json({ error: "Failed to fetch test results" });
    }
  });

  app.get("/api/vald/sync-logs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const logs = await storage.getValdSyncLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Failed to fetch sync logs:", error);
      res.status(500).json({ error: "Failed to fetch sync logs" });
    }
  });

  // Normative Data Routes
  app.get("/api/normative/cohorts", async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.deviceType) filters.deviceType = req.query.deviceType as string;
      if (req.query.testType) filters.testType = req.query.testType as string;
      if (req.query.sex) filters.sex = req.query.sex as string;
      if (req.query.sport) filters.sport = req.query.sport as string;
      const cohorts = await storage.getNormativeCohorts(Object.keys(filters).length > 0 ? filters : undefined);
      res.json(cohorts);
    } catch (error) {
      console.error("Failed to fetch normative cohorts:", error);
      res.status(500).json({ error: "Failed to fetch normative cohorts" });
    }
  });

  app.get("/api/normative/cohorts/:cohortId/metrics", async (req, res) => {
    try {
      const metrics = await storage.getNormativeMetrics(req.params.cohortId);
      res.json(metrics);
    } catch (error) {
      console.error("Failed to fetch normative metrics:", error);
      res.status(500).json({ error: "Failed to fetch normative metrics" });
    }
  });

  app.post("/api/normative/compare", async (req, res) => {
    try {
      const { compareAthleteToNorms } = await import("./normative-service");
      const { z } = await import("zod");
      const compareSchema = z.object({
        athleteId: z.string().optional(),
        testType: z.string(),
        deviceType: z.string(),
        testResults: z.record(z.string(), z.number()),
        sex: z.string().optional().nullable(),
        sport: z.string().optional().nullable(),
        age: z.number().optional().nullable(),
        cohortId: z.string().optional().nullable(),
      });
      const parseResult = compareSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.errors });
      }
      const { athleteId, testType, deviceType, testResults, sex, sport, age, cohortId } = parseResult.data;
      const result = await compareAthleteToNorms({
        athleteId: athleteId || 'unknown',
        testType,
        deviceType,
        testResults,
        sex,
        sport,
        age,
        cohortId,
      });
      if (!result) {
        return res.status(404).json({ error: "No matching normative cohort found" });
      }
      res.json(result);
    } catch (error) {
      console.error("Failed to compare to norms:", error);
      res.status(500).json({ error: "Failed to compare to normative data" });
    }
  });

  app.get("/api/vald/athletes/:athleteId/norms", async (req, res) => {
    try {
      const { compareAthleteToNorms } = await import("./normative-service");
      const athleteId = req.params.athleteId;
      const valdData = await storage.getAthleteValdData(athleteId);
      if (!valdData || !valdData.tests.length) {
        return res.json({ comparisons: [] });
      }
      const profile = await storage.getAthleteTrainingProfile(athleteId);
      const comparisons = [];
      for (const test of valdData.tests) {
        const results = await storage.getValdTrialResults(test.id);
        if (!results.length) continue;
        const testResults: Record<string, number> = {};
        for (const r of results) {
          if (r.metricName && r.metricValue !== null) {
            testResults[r.metricName] = parseFloat(String(r.metricValue));
          }
        }
        if (Object.keys(testResults).length === 0) continue;
        const comparison = await compareAthleteToNorms({
          athleteId,
          testType: test.testType || 'CMJ',
          deviceType: test.deviceType || 'forcedecks',
          testResults,
          sex: profile?.sex,
          sport: profile?.sport,
          age: null,
          cohortId: req.query.cohortId as string || null,
        });
        if (comparison) {
          comparisons.push({
            testId: test.id,
            recordedAt: test.recordedAt,
            ...comparison,
          });
        }
      }
      res.json({ comparisons });
    } catch (error) {
      console.error("Failed to get normative comparisons:", error);
      res.status(500).json({ error: "Failed to get normative comparisons" });
    }
  });

  // Belt Classification System Routes
  const { 
    classifyBelt, 
    profileToMeta, 
    extractTestMetrics, 
    decisionToInsert,
    getDoseBudget: computeDoseBudget 
  } = await import("./belt-classification");
  const { 
    beltTypes, 
    phaseTypes,
    overrideBeltRequestSchema,
    insertAthleteTrainingProfileSchema 
  } = await import("@shared/schema");

  app.get("/api/athletes/:athleteId/training-profile", async (req, res) => {
    try {
      const profile = await storage.getAthleteTrainingProfile(req.params.athleteId);
      res.json(profile || null);
    } catch (error) {
      console.error("Failed to fetch training profile:", error);
      res.status(500).json({ error: "Failed to fetch training profile" });
    }
  });

  app.post("/api/athletes/:athleteId/training-profile", async (req, res) => {
    try {
      const parseResult = insertAthleteTrainingProfileSchema.safeParse({
        ...req.body,
        athleteId: req.params.athleteId,
      });
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid request body", 
          details: parseResult.error.flatten().fieldErrors 
        });
      }
      
      const profile = await storage.upsertAthleteTrainingProfile(parseResult.data);
      res.json(profile);
    } catch (error) {
      console.error("Failed to save training profile:", error);
      res.status(500).json({ error: "Failed to save training profile" });
    }
  });

  app.get("/api/athletes/:athleteId/belt", async (req, res) => {
    try {
      const athleteId = req.params.athleteId;
      let classification = await storage.getLatestBeltClassification(athleteId);
      
      // Auto-compute belt if missing but training profile exists
      if (!classification) {
        const trainingProfile = await storage.getAthleteTrainingProfile(athleteId);
        if (trainingProfile) {
          const valdData = await storage.getAthleteValdData(athleteId);
          const meta = profileToMeta(trainingProfile);
          
          const testsWithResults = valdData.tests.map(test => ({
            testType: test.testType || '',
            results: (valdData.latestResults.get(test.id) || []).map(r => ({
              metricName: r.metricName,
              metricValue: r.metricValue,
            })),
          }));
          
          const keyTests = extractTestMetrics(testsWithResults);
          if (trainingProfile.movementQualityScore) {
            keyTests.movementQualityScore = trainingProfile.movementQualityScore;
          }
          
          const decision = classifyBelt(meta, keyTests);
          const insertData = decisionToInsert(athleteId, decision);
          classification = await storage.createBeltClassification(insertData);
        }
      }
      
      res.json(classification || null);
    } catch (error) {
      console.error("Failed to fetch belt classification:", error);
      res.status(500).json({ error: "Failed to fetch belt classification" });
    }
  });

  app.get("/api/athletes/:athleteId/belt/history", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const history = await storage.getBeltClassificationHistory(req.params.athleteId, limit);
      res.json(history);
    } catch (error) {
      console.error("Failed to fetch belt history:", error);
      res.status(500).json({ error: "Failed to fetch belt history" });
    }
  });

  app.post("/api/athletes/:athleteId/belt/compute", async (req, res) => {
    try {
      const athleteId = req.params.athleteId;
      
      const trainingProfile = await storage.getAthleteTrainingProfile(athleteId);
      const valdData = await storage.getAthleteValdData(athleteId);
      
      const meta = profileToMeta(trainingProfile);
      
      const testsWithResults = valdData.tests.map(test => ({
        testType: test.testType || '',
        results: (valdData.latestResults.get(test.id) || []).map(r => ({
          metricName: r.metricName,
          metricValue: r.metricValue,
        })),
      }));
      
      const keyTests = extractTestMetrics(testsWithResults);
      if (trainingProfile?.movementQualityScore) {
        keyTests.movementQualityScore = trainingProfile.movementQualityScore;
      }
      
      const decision = classifyBelt(meta, keyTests);
      const insertData = decisionToInsert(athleteId, decision);
      const classification = await storage.createBeltClassification(insertData);
      
      res.json({
        classification,
        inputs: { meta, keyTests },
        decision,
      });
    } catch (error) {
      console.error("Failed to compute belt classification:", error);
      res.status(500).json({ error: "Failed to compute belt classification" });
    }
  });

  app.post("/api/athletes/:athleteId/belt/override", async (req, res) => {
    try {
      const parseResult = overrideBeltRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid request body", 
          details: parseResult.error.flatten().fieldErrors 
        });
      }
      
      const { belt, reason, overriddenBy } = parseResult.data;
      const classification = await storage.overrideBeltClassification(
        req.params.athleteId,
        belt,
        overriddenBy || 'coach',
        reason
      );
      
      res.json(classification);
    } catch (error) {
      console.error("Failed to override belt classification:", error);
      res.status(500).json({ error: "Failed to override belt classification" });
    }
  });

  app.get("/api/dose-budget", async (req, res) => {
    try {
      const { belt, phase, waveWeek } = req.query;
      
      if (!belt || !phase || !waveWeek) {
        return res.status(400).json({ error: "belt, phase, and waveWeek are required" });
      }
      
      if (!beltTypes.includes(belt as any)) {
        return res.status(400).json({ error: `Invalid belt. Must be one of: ${beltTypes.join(', ')}` });
      }
      if (!phaseTypes.includes(phase as any)) {
        return res.status(400).json({ error: `Invalid phase. Must be one of: ${phaseTypes.join(', ')}` });
      }
      
      const week = parseInt(waveWeek as string);
      if (![1, 2, 3].includes(week)) {
        return res.status(400).json({ error: "waveWeek must be 1, 2, or 3" });
      }
      
      const budget = computeDoseBudget(belt as any, phase as any, week as any);
      res.json(budget);
    } catch (error) {
      console.error("Failed to get dose budget:", error);
      res.status(500).json({ error: "Failed to get dose budget" });
    }
  });

  app.get("/api/belt-types", async (_req, res) => {
    res.json({ belts: beltTypes, phases: phaseTypes, waveWeeks: [1, 2, 3] });
  });

  // ============================================
  // MOBILE ATHLETE PORTAL API ENDPOINTS
  // ============================================

  // Get current athlete profile linked to logged-in user
  app.get("/api/mobile/athlete/me", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Try to find athlete linked to this user
      const athletes = await storage.getAthletes();
      const userEmail = req.user?.claims?.email;
      let athlete = athletes.find(a => a.email === userEmail);

      if (!athlete && athletes.length > 0) {
        // Demo mode: return first athlete if no email match
        athlete = athletes[0];
      }

      if (!athlete) {
        return res.status(404).json({ error: "No athlete profile found" });
      }

      // Get athlete stats
      const workoutLogs = await storage.getWorkoutLogs(athlete.id);
      const prs = await storage.getPersonalRecords(athlete.id);
      
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const workoutsThisWeek = workoutLogs.filter(w => w.completedAt && new Date(w.completedAt) >= weekAgo).length;

      const stats = {
        totalWorkouts: workoutLogs.length,
        totalPRs: prs.length,
        workoutsThisWeek,
        streak: Math.min(workoutsThisWeek, 7),
        level: Math.floor(prs.length / 5) + 1,
        xp: prs.length * 100 + workoutLogs.length * 50,
      };

      res.json({ athlete, stats });
    } catch (error) {
      console.error("Failed to get athlete profile:", error);
      res.status(500).json({ error: "Failed to get athlete profile" });
    }
  });

  // Get today's scheduled workout
  app.get("/api/mobile/athlete/today-workout", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Find athlete by email
      const athletes = await storage.getAthletes();
      const userEmail = req.user?.claims?.email;
      let athlete = athletes.find(a => a.email === userEmail);
      
      if (!athlete && athletes.length > 0) {
        // Demo mode: use first athlete
        athlete = athletes[0];
      }

      if (!athlete) {
        return res.json({
          id: null,
          date: new Date().toISOString(),
          exercises: [],
          hasWorkout: false,
          message: "No athlete profile found",
        });
      }

      // Get athlete's active program assignments
      const athletePrograms = await storage.getAthletePrograms(athlete.id);
      const activeProgram = athletePrograms.find(ap => ap.status === "active");

      if (!activeProgram) {
        return res.json({
          id: null,
          date: new Date().toISOString(),
          exercises: [],
          hasWorkout: false,
          message: "No active program assigned",
        });
      }

      // Calculate current week and day based on program start date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(activeProgram.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceStart < 0) {
        return res.json({
          id: null,
          date: new Date().toISOString(),
          exercises: [],
          hasWorkout: false,
          message: "Program hasn't started yet",
          programStartDate: activeProgram.startDate,
        });
      }

      const currentWeek = Math.floor(daysSinceStart / 7) + 1;
      const currentDay = (daysSinceStart % 7) + 1;

      // Get training blocks for today
      const blocks = await storage.getTrainingBlocks(activeProgram.programId, currentWeek, currentDay);
      
      if (blocks.length === 0) {
        // Check if it's a rest day or no blocks scheduled
        return res.json({
          id: null,
          date: new Date().toISOString(),
          exercises: [],
          hasWorkout: false,
          currentWeek,
          currentDay,
          message: "Rest day - no workout scheduled",
        });
      }

      // Get all exercises for lookup
      const allExercises = await storage.getExercises();
      const exerciseMap = new Map(allExercises.map(e => [e.id, e]));

      // Build workout with exercises from all blocks
      const workoutExercises = [];
      for (const block of blocks) {
        const blockExercises = await storage.getBlockExercises(block.id);
        
        for (const be of blockExercises) {
          const exercise = exerciseMap.get(be.exerciseId);
          if (exercise) {
            // Parse scheme to get sets/reps
            const scheme = be.scheme || block.scheme || "3x10";
            const schemeMatch = scheme.match(/(\d+)\s*[xX×]\s*(\d+)/);
            const numSets = schemeMatch ? parseInt(schemeMatch[1]) : 3;
            const targetReps = schemeMatch ? parseInt(schemeMatch[2]) : 10;

            const sets = Array.from({ length: numSets }, (_, i) => ({
              setNumber: i + 1,
              targetReps,
              targetWeight: null,
              completed: false,
              actualReps: null,
              actualWeight: null,
            }));

            workoutExercises.push({
              id: be.id,
              exerciseId: exercise.id,
              exerciseName: exercise.name,
              blockTitle: block.title,
              scheme: be.scheme || block.scheme,
              notes: be.notes,
              sets,
              completed: false,
            });
          }
        }
      }

      // Get program details
      const program = await storage.getProgram(activeProgram.programId);

      res.json({
        id: `workout-${activeProgram.id}-w${currentWeek}d${currentDay}`,
        athleteProgramId: activeProgram.id,
        programId: activeProgram.programId,
        programName: program?.name || "Training Program",
        date: new Date().toISOString(),
        currentWeek,
        currentDay,
        exercises: workoutExercises,
        hasWorkout: workoutExercises.length > 0,
        blocks: blocks.map(b => ({ id: b.id, title: b.title, belt: b.belt })),
      });
    } catch (error) {
      console.error("Failed to get today's workout:", error);
      res.status(500).json({ error: "Failed to get today's workout" });
    }
  });

  // Log a workout set
  app.post("/api/mobile/athlete/log-set", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { exerciseId, setNumber, reps, weight, blockExerciseId, athleteProgramId } = req.body;
      
      // Find athlete by email
      const athletes = await storage.getAthletes();
      const userEmail = req.user?.claims?.email;
      let athlete = athletes.find(a => a.email === userEmail) || athletes[0];

      if (!athlete) {
        return res.status(404).json({ error: "No athlete profile found" });
      }

      // Store workout log with proper structure
      const workoutLog = await storage.createWorkoutLog({
        athleteId: athlete.id,
        exerciseId: exerciseId,
        programExerciseId: blockExerciseId || null,
        completedAt: new Date(),
        sets: 1,
        repsPerSet: reps?.toString() || "0",
        weightPerSet: weight?.toString() || "0",
        notes: `Set ${setNumber}`,
      });

      // Check if this is a potential PR (weight > any previous for this exercise)
      const existingRecords = await storage.getPersonalRecords(athlete.id);
      const exerciseRecords = existingRecords.filter(pr => pr.exerciseId === exerciseId);
      const maxPrevWeight = exerciseRecords.reduce((max, pr) => Math.max(max, pr.maxWeight || 0), 0);
      
      let isPR = false;
      let newPR = null;
      
      if (weight && weight > maxPrevWeight && weight > 0) {
        isPR = true;
        newPR = await storage.createPersonalRecord({
          athleteId: athlete.id,
          exerciseId: exerciseId,
          maxWeight: weight,
          reps: reps,
        });
      }

      const est1RM = weight > 0 && reps > 0 ? Math.round(weight * (1 + reps / 30)) : 0;

      res.json({ 
        success: true, 
        setNumber, 
        reps, 
        weight,
        workoutLogId: workoutLog.id,
        isPR,
        newPR: newPR ? { maxWeight: newPR.maxWeight, reps: newPR.reps } : null,
        estimated1RM: est1RM,
      });
    } catch (error) {
      console.error("Failed to log set:", error);
      res.status(500).json({ error: "Failed to log set" });
    }
  });

  // Complete workout
  app.post("/api/mobile/athlete/complete-workout", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { duration } = req.body;
      res.json({ success: true, duration, completedAt: new Date().toISOString() });
    } catch (error) {
      console.error("Failed to complete workout:", error);
      res.status(500).json({ error: "Failed to complete workout" });
    }
  });

  // Submit session RPE
  app.post("/api/mobile/athlete/session-rpe", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const parseResult = insertSessionRpeSchema.safeParse(req.body);
      // For now, just accept the data - would store in session_rpe table
      res.json({ success: true, ...req.body, loggedAt: new Date().toISOString() });
    } catch (error) {
      console.error("Failed to submit session RPE:", error);
      res.status(500).json({ error: "Failed to submit session RPE" });
    }
  });

  // Check if wellness already submitted today
  app.get("/api/mobile/athlete/wellness/today", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Check if athlete has submitted wellness today
      const athletes = await storage.getAthletes();
      const userEmail = req.user?.claims?.email;
      let athlete = athletes.find(a => a.email === userEmail) || athletes[0];

      if (athlete) {
        const surveys = await storage.getReadinessSurveys(athlete.id);
        const today = new Date().toISOString().split('T')[0];
        const todaySurvey = surveys.find(s => 
          s.surveyDate && new Date(s.surveyDate).toISOString().split('T')[0] === today
        );
        
        if (todaySurvey) {
          return res.json(todaySurvey);
        }
      }
      
      res.json(null);
    } catch (error) {
      console.error("Failed to check today's wellness:", error);
      res.status(500).json({ error: "Failed to check today's wellness" });
    }
  });

  // Submit daily wellness check
  app.post("/api/mobile/athlete/wellness", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const athletes = await storage.getAthletes();
      const userEmail = req.user?.claims?.email;
      let athlete = athletes.find(a => a.email === userEmail) || athletes[0];

      if (!athlete) {
        return res.status(404).json({ error: "No athlete profile found" });
      }

      const { readiness, sleep, soreness, energy, mood, notes } = req.body;

      const survey = await storage.createReadinessSurvey({
        athleteId: athlete.id,
        overallReadiness: readiness || 5,
        sleepQuality: sleep || 5,
        sleepHours: 7,
        muscleSoreness: soreness || 5,
        energyLevel: energy || 5,
        stressLevel: 5,
        mood: mood || 5,
        notes: notes || "",
      });

      res.json(survey);
    } catch (error) {
      console.error("Failed to submit wellness:", error);
      res.status(500).json({ error: "Failed to submit wellness" });
    }
  });

  // Get athlete messages
  app.get("/api/mobile/athlete/messages", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const athletes = await storage.getAthletes();
      const userEmail = req.user?.claims?.email;
      const athlete = athletes.find(a => a.email === userEmail) || athletes[0];

      if (!athlete) {
        return res.json([]);
      }

      const messagesList = await storage.getMessages(athlete.id);
      res.json(messagesList);
    } catch (error) {
      console.error("Failed to get messages:", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  // Send a message
  app.post("/api/mobile/athlete/messages", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const athletes = await storage.getAthletes();
      const userEmail = req.user?.claims?.email;
      const athlete = athletes.find(a => a.email === userEmail) || athletes[0];

      if (!athlete) {
        return res.status(404).json({ error: "No athlete profile found" });
      }

      const { content } = req.body;
      
      const message = await storage.createMessage({
        senderId: userId,
        senderType: "athlete",
        recipientId: "coach",
        recipientType: "coach",
        athleteId: athlete.id,
        content,
      });

      res.json(message);
    } catch (error) {
      console.error("Failed to send message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // ===== COACH MESSAGING ENDPOINTS =====

  // Get all messages (for coach inbox)
  app.get("/api/messages", async (req: any, res) => {
    try {
      const allMessages = await storage.getAllMessages();
      res.json(allMessages);
    } catch (error) {
      console.error("Failed to get all messages:", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  // Get recent messages (for dashboard preview)
  app.get("/api/messages/recent", async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const recentMessages = await storage.getRecentMessages(limit);
      res.json(recentMessages);
    } catch (error) {
      console.error("Failed to get recent messages:", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  // Get messages for a specific athlete (coach view)
  app.get("/api/messages/athlete/:athleteId", async (req: any, res) => {
    try {
      const { athleteId } = req.params;
      const athleteMessages = await storage.getMessages(athleteId);
      res.json(athleteMessages);
    } catch (error) {
      console.error("Failed to get athlete messages:", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  // Send a message to an athlete (coach sending)
  app.post("/api/messages/athlete/:athleteId", async (req: any, res) => {
    try {
      const { athleteId } = req.params;
      const { content } = req.body;
      const userId = req.user?.claims?.sub || "coach";

      const message = await storage.createMessage({
        senderId: userId,
        senderType: "coach",
        recipientId: athleteId,
        recipientType: "athlete",
        athleteId,
        content,
      });

      res.json(message);
    } catch (error) {
      console.error("Failed to send message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Broadcast message to multiple athletes (Head Coach only)
  app.post("/api/messages/broadcast", requireHeadCoach, async (req: any, res) => {
    try {
      const { athleteIds, content } = req.body;
      const userId = req.user?.claims?.sub || "coach";

      if (!athleteIds || !Array.isArray(athleteIds) || athleteIds.length === 0) {
        return res.status(400).json({ error: "athleteIds array required" });
      }

      const sentMessages = [];
      for (const athleteId of athleteIds) {
        const message = await storage.createMessage({
          senderId: userId,
          senderType: "coach",
          recipientId: athleteId,
          recipientType: "athlete",
          athleteId,
          content,
        });
        sentMessages.push(message);
      }

      res.json({ sent: sentMessages.length, messages: sentMessages });
    } catch (error) {
      console.error("Failed to broadcast message:", error);
      res.status(500).json({ error: "Failed to broadcast message" });
    }
  });

  // Mark messages as read
  app.post("/api/messages/athlete/:athleteId/read", async (req: any, res) => {
    try {
      const { athleteId } = req.params;
      const userId = req.user?.claims?.sub || "coach";
      await storage.markMessagesAsRead(athleteId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
      res.status(500).json({ error: "Failed to mark as read" });
    }
  });

  // Get athlete notifications
  app.get("/api/mobile/athlete/notifications", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const notificationsList = await storage.getNotifications(userId);
      res.json(notificationsList);
    } catch (error) {
      console.error("Failed to get notifications:", error);
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  // Mark notification as read
  app.post("/api/mobile/athlete/notifications/:id/read", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      await storage.markNotificationAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.post("/api/mobile/athlete/notifications/read-all", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // Get athlete belt classification
  app.get("/api/mobile/athlete/belt", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const athletes = await storage.getAthletes();
      const userEmail = req.user?.claims?.email;
      let athlete = athletes.find(a => a.email === userEmail) || athletes[0];

      if (!athlete) {
        return res.status(404).json({ error: "No athlete profile found" });
      }

      const classification = await storage.getLatestBeltClassification(athlete.id);
      res.json(classification);
    } catch (error) {
      console.error("Failed to get belt classification:", error);
      res.status(500).json({ error: "Failed to get belt classification" });
    }
  });

  // =============================================
  // PROGRAM ENGINE - Intelligent Coaching Guidance
  // =============================================

  // Get program engine guidance for an athlete (GET version for standard useQuery)
  app.get("/api/program-engine/preview", async (req, res) => {
    try {
      const { generateEngineGuidance } = await import("./program-engine");
      
      const athleteId = req.query.athleteId as string;
      const phase = (req.query.phase as string) || "PRESEASON_A";
      const waveWeek = parseInt(req.query.waveWeek as string) || 1;
      const trainingDaysPerWeek = parseInt(req.query.trainingDaysPerWeek as string) || 3;
      
      if (!athleteId) {
        return res.status(400).json({ error: "athleteId is required" });
      }
      
      const profile = await storage.getAthleteTrainingProfile(athleteId);
      const existingClassification = await storage.getLatestBeltClassification(athleteId);
      
      const guidance = generateEngineGuidance(
        profile || null,
        existingClassification || null,
        phase,
        waveWeek,
        null,
        trainingDaysPerWeek
      );
      
      res.json(guidance);
    } catch (error) {
      console.error("Failed to generate program engine guidance:", error);
      res.status(500).json({ error: "Failed to generate program engine guidance" });
    }
  });

  // Get program engine guidance for an athlete (POST version - deprecated, use GET)
  app.post("/api/program-engine/preview", async (req, res) => {
    try {
      const { generateEngineGuidance, PHASE_OPTIONS, WAVE_WEEK_OPTIONS } = await import("./program-engine");
      
      const { athleteId, phase, waveWeek, stageOverlay, trainingDaysPerWeek } = req.body;
      
      if (!athleteId) {
        return res.status(400).json({ error: "athleteId is required" });
      }
      
      const profile = await storage.getAthleteTrainingProfile(athleteId);
      const existingClassification = await storage.getLatestBeltClassification(athleteId);
      
      const guidance = generateEngineGuidance(
        profile || null,
        existingClassification || null,
        phase || "PRESEASON_A",
        waveWeek || 1,
        null, // TODO: fetch stage overlay from DB
        trainingDaysPerWeek || 3
      );
      
      res.json(guidance);
    } catch (error) {
      console.error("Failed to generate program engine guidance:", error);
      res.status(500).json({ error: "Failed to generate program engine guidance" });
    }
  });

  // Get phase and wave week options
  app.get("/api/program-engine/options", async (req, res) => {
    try {
      const { PHASE_OPTIONS, WAVE_WEEK_OPTIONS } = await import("./program-engine");
      res.json({ phases: PHASE_OPTIONS, waveWeeks: WAVE_WEEK_OPTIONS });
    } catch (error) {
      res.status(500).json({ error: "Failed to get program engine options" });
    }
  });

  // Get stage overlays
  app.get("/api/program-engine/stages", async (req, res) => {
    try {
      const stages = await storage.getStageOverlays();
      res.json(stages);
    } catch (error) {
      console.error("Failed to get stage overlays:", error);
      res.status(500).json({ error: "Failed to get stage overlays" });
    }
  });

  // =============================================
  // AI INTELLIGENCE SYSTEM - Multi-Level AI
  // =============================================
  const { 
    processAIQuery, 
    getAthleteInsights, 
    getProgramSuggestions, 
    getExerciseRecommendations,
    getTeamInsights,
    queryAnalytics,
    getCoachingDecisionSupport,
    updateAthleteWithAI
  } = await import("./ai-intelligence");

  app.post("/api/ai/query", async (req, res) => {
    try {
      const { query, level, entityId } = req.body;
      
      if (!query || !level) {
        return res.status(400).json({ error: "Query and level are required" });
      }
      
      const result = await processAIQuery(query, { level, entityId }, storage);
      res.json(result);
    } catch (error) {
      console.error("AI query failed:", error);
      res.status(500).json({ error: "Failed to process AI query" });
    }
  });

  app.get("/api/ai/athlete/:athleteId/insights", async (req, res) => {
    try {
      const { athleteId } = req.params;
      const insights = await getAthleteInsights(athleteId, storage);
      res.json(insights);
    } catch (error) {
      console.error("Failed to get athlete insights:", error);
      res.status(500).json({ error: "Failed to get insights" });
    }
  });

  app.get("/api/ai/program/:programId/suggestions", async (req, res) => {
    try {
      const { programId } = req.params;
      const suggestions = await getProgramSuggestions(programId, storage);
      res.json(suggestions);
    } catch (error) {
      console.error("Failed to get program suggestions:", error);
      res.status(500).json({ error: "Failed to get suggestions" });
    }
  });

  app.post("/api/ai/exercises/recommend", async (req, res) => {
    try {
      const { goals, constraints } = req.body;
      const recommendations = await getExerciseRecommendations(goals || [], constraints || {}, storage);
      res.json(recommendations);
    } catch (error) {
      console.error("Failed to get exercise recommendations:", error);
      res.status(500).json({ error: "Failed to get recommendations" });
    }
  });

  app.get("/api/ai/team/insights", async (req, res) => {
    try {
      const insights = await getTeamInsights(storage);
      res.json(insights);
    } catch (error) {
      console.error("Failed to get team insights:", error);
      res.status(500).json({ error: "Failed to get team insights" });
    }
  });

  app.post("/api/ai/analytics/query", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }
      
      const result = await queryAnalytics(query, storage);
      res.json(result);
    } catch (error) {
      console.error("Failed to query analytics:", error);
      res.status(500).json({ error: "Failed to query analytics" });
    }
  });

  app.post("/api/ai/coaching/decision", async (req, res) => {
    try {
      const { scenario } = req.body;
      
      if (!scenario) {
        return res.status(400).json({ error: "Scenario is required" });
      }
      
      const support = await getCoachingDecisionSupport(scenario, storage);
      res.json(support);
    } catch (error) {
      console.error("Failed to get coaching decision support:", error);
      res.status(500).json({ error: "Failed to get decision support" });
    }
  });

  app.post("/api/ai/athlete/:athleteId/update", async (req, res) => {
    try {
      const { athleteId } = req.params;
      const { updateDescription } = req.body;
      
      if (!updateDescription) {
        return res.status(400).json({ error: "Update description is required" });
      }
      
      const result = await updateAthleteWithAI(athleteId, updateDescription, storage);
      res.json(result);
    } catch (error) {
      console.error("Failed to process athlete update:", error);
      res.status(500).json({ error: "Failed to process update" });
    }
  });

  // =============================================
  // AI ONBOARDING CHAT - Natural Language Athlete Creation
  // =============================================
  const { processOnboardingMessage, createAthleteFromOnboarding, suggestProgramsForAthlete } = await import("./ai-onboarding");

  app.post("/api/ai/onboarding/chat", async (req, res) => {
    try {
      const { message, conversationHistory = [] } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      
      const response = await processOnboardingMessage(message, conversationHistory, storage);
      res.json(response);
    } catch (error) {
      console.error("Failed to process onboarding chat:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  app.post("/api/ai/onboarding/create-athlete", async (req, res) => {
    try {
      const { athleteData } = req.body;
      
      console.log("[AI Onboarding] Create athlete request:", JSON.stringify(athleteData));
      
      if (!athleteData || !athleteData.name) {
        console.log("[AI Onboarding] Missing athlete data or name");
        return res.status(400).json({ error: "Athlete data with name is required" });
      }
      
      const result = await createAthleteFromOnboarding(athleteData, storage);
      console.log("[AI Onboarding] Create result:", JSON.stringify(result));
      
      if (result.success && result.athleteId) {
        const suggestions = await suggestProgramsForAthlete(athleteData, storage);
        console.log("[AI Onboarding] Suggestions:", suggestions.length);
        res.json({ ...result, suggestedPrograms: suggestions });
      } else {
        console.log("[AI Onboarding] Creation failed:", result.error);
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("[AI Onboarding] Exception:", error);
      res.status(500).json({ error: "Failed to create athlete" });
    }
  });

  app.post("/api/ai/onboarding/suggest-programs", async (req, res) => {
    try {
      const { athleteData } = req.body;
      
      if (!athleteData) {
        return res.status(400).json({ error: "Athlete data is required" });
      }
      
      const suggestions = await suggestProgramsForAthlete(athleteData, storage);
      res.json({ programs: suggestions });
    } catch (error) {
      console.error("Failed to suggest programs:", error);
      res.status(500).json({ error: "Failed to suggest programs" });
    }
  });

  // ─── MC Pro Engine Routes ─────────────────────────────────────────────────

  app.get("/api/mc-pro/plan", async (req, res) => {
    try {
      const {
        buildWeeklyPlan,
        classifyBelt,
        getWeeklyBudgets,
        UNIT_LIBRARY,
      } = await import("./mc-pro-engine");

      const { athleteId, phase, waveWeek } = req.query as {
        athleteId?: string;
        phase?: string;
        waveWeek?: string;
      };

      // Default meta — in production this comes from athlete DB record
      let meta = {
        ageYears: 25,
        trainingAgeYears: 2,
        movementQualityScore: 3 as 1 | 2 | 3 | 4 | 5,
        injuryFlags: {},
        recentExposure14d: { speedTouches: 1, highDecelSessions: 1 },
        availability: { daysPerWeek: 3, gymAccess: true },
      };

      // Pull athlete data from storage if athleteId provided
      if (athleteId) {
        try {
          const athlete = await storage.getAthlete(athleteId);
          if (athlete) {
            meta = {
              ageYears: athlete.age ?? 25,
              trainingAgeYears: (athlete as any).trainingAge ?? 2,
              movementQualityScore: ((athlete as any).movementQualityScore ?? 3) as 1 | 2 | 3 | 4 | 5,
              injuryFlags: (athlete as any).injuryFlags ?? {},
              recentExposure14d: (athlete as any).recentExposure14d ?? { speedTouches: 1, highDecelSessions: 1 },
              availability: {
                daysPerWeek: (athlete as any).daysPerWeek ?? 3,
                gymAccess: (athlete as any).gymAccess ?? true,
              },
            };
          }
        } catch (_) {
          // Use defaults if athlete not found
        }
      }

      const validPhases = [
        "PRESEASON_A", "XMAS_BLOCK", "PRESEASON_B", "PRECOMP",
        "INSEASON_EARLY", "INSEASON_MID", "INSEASON_LATE", "BYE_WEEK",
      ];
      const resolvedPhase = validPhases.includes(phase ?? "") ? phase! : "PRESEASON_A";
      const resolvedWaveWeek = ([1, 2, 3].includes(Number(waveWeek)) ? Number(waveWeek) : 1) as 1 | 2 | 3;

      const plan = buildWeeklyPlan(meta as any, resolvedPhase as any, resolvedWaveWeek);

      res.json(plan);
    } catch (error) {
      console.error("[MC Pro] Plan generation error:", error);
      res.status(500).json({ error: "Failed to generate MC Pro plan" });
    }
  });

  app.get("/api/mc-pro/units", async (req, res) => {
    try {
      const { UNIT_LIBRARY } = await import("./mc-pro-engine");
      res.json({ units: UNIT_LIBRARY });
    } catch (error) {
      res.status(500).json({ error: "Failed to load unit library" });
    }
  });

  app.get("/api/mc-pro/classify", async (req, res) => {
    try {
      const { classifyBelt } = await import("./mc-pro-engine");
      const meta = req.query.meta ? JSON.parse(req.query.meta as string) : null;
      if (!meta) return res.status(400).json({ error: "meta query param required (JSON)" });
      res.json(classifyBelt(meta));
    } catch (error) {
      res.status(500).json({ error: "Failed to classify belt" });
    }
  });


  // ══════════════════════════════════════════════════════════════════════════
  // REPLIT ATHLETE APP ROUTES
  // Consumer-facing routes: auth, organizations, athlete profiles, community,
  // education, clinics, NSO, partner orgs, Stripe, video/storage, etc.
  // ══════════════════════════════════════════════════════════════════════════

  app.get("/api/exercises", async (req, res) => {
    try {
      const { 
        component, 
        beltLevel, 
        search,
        skillFocus,
        trainingPhase,
        progressionLevel,
        weekIntroduced,
        complexityRating 
      } = req.query;
      
      // Build filter object for enhanced filtering
      const filters: any = {};
      if (component && typeof component === "string") filters.component = component;
      if (beltLevel && typeof beltLevel === "string") filters.beltLevel = beltLevel;
      if (skillFocus && typeof skillFocus === "string") filters.skillFocus = skillFocus.split(',');
      if (trainingPhase && typeof trainingPhase === "string") filters.trainingPhase = trainingPhase;
      if (progressionLevel && typeof progressionLevel === "string") filters.progressionLevel = parseInt(progressionLevel);
      if (weekIntroduced && typeof weekIntroduced === "string") filters.weekIntroduced = parseInt(weekIntroduced);
      if (complexityRating && typeof complexityRating === "string") filters.complexityRating = parseInt(complexityRating);

      let exercises;
      if (search && typeof search === "string") {
        exercises = await storage.searchExercises(search, filters);
      } else if (Object.keys(filters).length > 0) {
        exercises = await storage.getExercisesWithFilters(filters);
      } else {
        exercises = await storage.getAllExercises();
      }
      
      res.json(exercises);  
    } catch (error: any) {
      console.error("Error fetching exercises:", error);
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  });
  
  // Single exercise by ID (must come before component routes to avoid conflicts)
  app.get("/api/exercises/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid exercise ID" });
      }
      const exercise = await storage.getExerciseById(id);
      if (!exercise) {
        return res.status(404).json({ error: "Exercise not found" });
      }
      res.json(exercise);
    } catch (error: any) {
      console.error("Error fetching exercise:", error);
      res.status(500).json({ error: "Failed to fetch exercise" });
    }
  });

  // Component-specific exercise routes (for frontend API calls)
  app.get("/api/exercises/:component/:beltLevel?", async (req, res) => {
    try {
      const { component, beltLevel } = req.params;
      const { search } = req.query;
      
      let exercises;
      if (search && typeof search === "string") {
        exercises = await storage.searchExercises(search);
      } else if (beltLevel && beltLevel !== "all") {
        exercises = await storage.getExercisesByComponentAndBeltLevel(component, beltLevel);
      } else {
        exercises = await storage.getExercisesByComponent(component);
      }
      
      res.json(exercises);
    } catch (error: any) {
      console.error("Error fetching exercises by component:", error);
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  });

  // Custom exercise creation (protected)
  app.post("/api/exercises", requireAuth, requireValidSubscription, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || !user.organizationId || (user.role !== "coach" && user.role !== "admin")) {
        return res.status(403).json({ error: "Only coaches can create custom exercises" });
      }

      const exerciseData = insertExerciseSchema.parse({
        ...req.body,
        isCustom: true,
        createdByUserId: userId,
        organizationId: user.organizationId
      });

      const exercise = await storage.createExercise(exerciseData);
      res.status(201).json(exercise);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid exercise data", details: error.errors });
      }
      console.error("Error creating exercise:", error);
      res.status(500).json({ error: "Failed to create exercise" });
    }
  });

  // ─── MOVEMENT BLUEPRINT ────────────────────────────────────────────────────

  // GET /api/athlete/blueprint — personalised 7-day training plan
  app.get("/api/athlete/blueprint", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getAthleteProfile(userId);
      if (!profile) {
        return res.status(404).json({ error: "Athlete profile not found. Complete onboarding first." });
      }
      const user = await storage.getUser(userId);
      const tier = user?.subscriptionTier || "starter";
      const blueprint = await generateBlueprint(profile, tier);

      // Add "Why this works" paragraph
      const whyText = getWhyItWorks(profile.sport || "general", profile.position || "default");

      res.json({ blueprint, whyItWorks: whyText, tier, belt: getBeltFromSessions(profile.totalSessionsCompleted || 0) });
    } catch (error: any) {
      console.error("Blueprint error:", error);
      res.status(500).json({ error: "Failed to generate blueprint" });
    }
  });

  // ─── EXERCISE ADMIN (Chris edits without code changes) ──────────────────────

  // GET /api/admin/exercises — all exercises for admin management
  app.get("/api/admin/exercises", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const allExercises = await storage.getAllExercises();
      res.json(allExercises);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  });

  // POST /api/admin/exercises — create exercise via admin UI
  app.post("/api/admin/exercises", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const exercise = await storage.createExercise({
        ...req.body,
        isCustom: false,
      });
      res.status(201).json(exercise);
    } catch (error: any) {
      console.error("Admin create exercise error:", error);
      res.status(500).json({ error: "Failed to create exercise" });
    }
  });

  // PATCH /api/admin/exercises/:id — update exercise via admin UI
  app.patch("/api/admin/exercises/:id", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const id = parseInt(req.params.id);
      const updated = await storage.updateExercise(id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update exercise" });
    }
  });

  // DELETE /api/admin/exercises/:id — delete exercise
  app.delete("/api/admin/exercises/:id", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const id = parseInt(req.params.id);
      await storage.deleteExercise(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete exercise" });
    }
  });

  // ─── ATHLETE PROGRESS (real data) ──────────────────────────────────────────

  // Organization routes
  app.post("/api/organizations", requireAuth, requireValidSubscription, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.organizationId) {
        return res.status(400).json({ error: "User already belongs to an organization" });
      }

      const orgData = insertOrganizationSchema.parse(req.body);
      const organization = await storage.createOrganization(orgData);
      
      // Update user to be admin of the new organization
      await storage.upsertUser({
        id: userId,
        email: user.email,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        profileImageUrl: user.profileImageUrl || null,
        role: "admin",
        organizationId: organization.id,
      });

      res.status(201).json(organization);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid organization data", details: error.errors });
      }
      console.error("Error creating organization:", error);
      res.status(500).json({ error: "Failed to create organization" });
    }
  });

  // Get organization users (coaches and athletes)
  app.get("/api/organization/users", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.status(404).json({ error: "User not part of an organization" });
      }

      const users = await storage.getUsersInOrganization(user.organizationId);
      res.json(users);
    } catch (error: any) {
      console.error("Error fetching organization users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Coach gets their athletes
  app.get("/api/athletes", requireAuth, requireValidSubscription, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== "coach" && user.role !== "admin")) {
        return res.status(403).json({ error: "Only coaches can view athletes" });
      }

      const athletes = await storage.getAthletesForCoach(userId);
      res.json(athletes);
    } catch (error: any) {
      console.error("Error fetching athletes:", error);
      res.status(500).json({ error: "Failed to fetch athletes" });
    }
  });

  // Program routes
  app.post("/api/programs", requireAuth, requireValidSubscription, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId || (user.role !== "coach" && user.role !== "admin")) {
        return res.status(403).json({ error: "Only coaches can create programs" });
      }

      const programData = insertProgramSchema.parse({
        ...req.body,
        createdByUserId: userId,
        organizationId: user.organizationId
      });

      const program = await storage.createProgram(programData);
      res.status(201).json(program);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid program data", details: error.errors });
      }
      console.error("Error creating program:", error);
      res.status(500).json({ error: "Failed to create program" });
    }
  });

  app.get("/api/programs", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.status(404).json({ error: "User not part of an organization" });
      }

      const programs = await storage.getProgramsByOrganization(user.organizationId);
      res.json(programs);
    } catch (error: any) {
      console.error("Error fetching programs:", error);
      res.status(500).json({ error: "Failed to fetch programs" });
    }
  });

  // Assign program to athlete
  app.post("/api/programs/:programId/assign", requireAuth, requireValidSubscription, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      const { programId } = req.params;
      const { athleteId, startDate, endDate } = req.body;
      
      if (!user || (user.role !== "coach" && user.role !== "admin")) {
        return res.status(403).json({ error: "Only coaches can assign programs" });
      }

      const assignment = await storage.assignProgramToAthlete({
        athleteId,
        programId: parseInt(programId),
        assignedByUserId: userId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        status: "active"
      });

      res.status(201).json(assignment);
    } catch (error: any) {
      console.error("Error assigning program:", error);
      res.status(500).json({ error: "Failed to assign program" });
    }
  });

  // Public program templates (SpeedPowerPlay-style) - NO subscription required
  app.get("/api/program-templates", async (req, res) => {
    try {
      const programTemplates = [
        {
          id: "any-place-any-time",
          name: "Any Place, Any Time",
          description: "Work on your Athleticism & Robustness, wherever you are. No equipment needed. Perfect for at home training or traveling athletes.",
          duration: "9-12 weeks",
          sessions: 9,
          exercises: 70,
          level: "Beginner to Advanced",
          focus: ["Strength", "Stability", "Coordination", "Robustness"],
          features: [
            "No equipment needed",
            "Progressive overload system", 
            "Complete home training solution",
            "Perfect for traveling athletes",
            "Hip-knee coordination focus",
            "Core stability development"
          ],
          programType: "foundation",
          totalWeeks: 9,
          sessionsPerWeek: 3,
          targetPopulation: ["field-sports", "court-sports"],
          skillEmphasis: ["strength", "stability", "coordination"],
          equipmentRequired: ["bodyweight"],
          difficultyLevel: "beginner",
          isFree: true
        },
        {
          id: "speed-foundations",
          name: "Speed Foundations", 
          description: "Build fundamental speed mechanics through structured acceleration, deceleration, and change of direction training.",
          duration: "12 weeks",
          sessions: 12,
          exercises: 85,
          level: "Beginner",
          focus: ["Acceleration", "Deceleration", "Movement Mechanics"],
          features: [
            "Progressive belt system (White to Blue)",
            "Movement pattern mastery",
            "Ground contact time optimization",
            "Force production development"
          ],
          programType: "development",
          totalWeeks: 12,
          sessionsPerWeek: 3,
          targetPopulation: ["field-sports", "court-sports"],
          skillEmphasis: ["power", "agility"],
          equipmentRequired: ["basic"],
          difficultyLevel: "intermediate",
          price: 79
        },
        {
          id: "elite-speed",
          name: "Elite Speed Development",
          description: "Advanced speed training for field and court sport athletes focusing on maximum velocity and reactive strength.",
          duration: "16 weeks", 
          sessions: 16,
          exercises: 120,
          level: "Advanced",
          focus: ["Maximum Speed", "Reactive Strength", "Elite Performance"],
          features: [
            "Black belt exercises only",
            "Sub-120ms contact times",
            "Competition preparation", 
            "Advanced plyometrics",
            "Sport-specific applications"
          ],
          programType: "peak",
          totalWeeks: 16,
          sessionsPerWeek: 4,
          targetPopulation: ["field-sports", "court-sports"],
          skillEmphasis: ["power", "agility", "coordination"],
          equipmentRequired: ["advanced"],
          difficultyLevel: "advanced",
          price: 149
        }
      ];
      
      res.json(programTemplates);
    } catch (error: any) {
      console.error("Error fetching program templates:", error);
      res.status(500).json({ error: "Failed to fetch program templates" });
    }
  });

  // Athlete gets their assigned programs
  app.get("/api/my-programs", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const programs = await storage.getAthletePrograms(userId);
      res.json(programs);
    } catch (error: any) {
      console.error("Error fetching athlete programs:", error);
      res.status(500).json({ error: "Failed to fetch programs" });
    }
  });

  // List all videos from object storage
  app.get("/api/storage/videos", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // Check if user is coach or admin
      if (!user || (user.role !== 'coach' && user.role !== 'admin')) {
        return res.status(403).json({ error: "Only coaches and admins can access video storage" });
      }

      const objectStorageService = new ObjectStorageService();
      const result = await objectStorageService.listObjects();
      
      if (!result.ok) {
        return res.status(500).json({ error: "Failed to list videos" });
      }

      // Component mapping
      const componentMapping: Record<string, string> = {
        'Starting': 'acceleration',
        'Stopping': 'deceleration',
        'Stepping': 'change-direction',
        'Sprinting': 'top-speed'
      };

      // Filter and format video files - accept any video file by extension
      const videoFiles = result.value
        .filter((obj: any) => 
          !obj.name.endsWith('.zip') &&
          (obj.name.toLowerCase().endsWith('.mov') || 
           obj.name.toLowerCase().endsWith('.mp4') ||
           obj.name.toLowerCase().endsWith('.m4v'))
        )
        .map((obj: any) => {
          const pathParts = obj.name.split('/');
          const videoFileName = pathParts[pathParts.length - 1];
          
          // Look for component-belt folder pattern in any path segment
          let component = '';
          let beltLevel = '';
          
          // Try pattern 1: "Component - belt level" (e.g., "Starting - white belt")
          for (let i = pathParts.length - 2; i >= 0; i--) {
            const folderMatch = pathParts[i].match(/^(.+?)\s*-\s*(.+?)$/);
            if (folderMatch) {
              const [, componentName, beltLevelName] = folderMatch;
              const mappedComponent = componentMapping[componentName.trim()];
              if (mappedComponent) {
                component = mappedComponent;
                beltLevel = beltLevelName.trim().replace(/ belt$/i, '').toLowerCase() || '';
                break;
              }
            }
          }
          
          // Try pattern 2: separate component and belt folders if pattern 1 didn't work
          if (!component && pathParts.length >= 3) {
            for (let i = pathParts.length - 2; i >= 0; i--) {
              const mappedComponent = componentMapping[pathParts[i].trim()];
              if (mappedComponent) {
                component = mappedComponent;
                // Look for belt level in adjacent segments
                const beltNames = ['white', 'blue', 'black', 'White', 'Blue', 'Black'];
                for (let j = Math.max(0, i - 1); j < Math.min(pathParts.length, i + 2); j++) {
                  const segment = pathParts[j].toLowerCase().trim();
                  if (beltNames.some(b => segment === b.toLowerCase())) {
                    beltLevel = segment;
                    break;
                  }
                }
                break;
              }
            }
          }

          // Clean up video name
          const cleanName = videoFileName
            .replace(/\.[^.]+$/, '')
            .replace(/_/g, ' ')
            .trim();

          return {
            name: obj.name,
            path: obj.name,
            component,
            beltLevel,
            cleanName
          };
        });

      res.json(videoFiles);
    } catch (error) {
      console.error("Error listing videos:", error);
      res.status(500).json({ error: "Failed to list videos from storage" });
    }
  });

  // Thumbnail generation route
  app.get("/api/thumbnails/:exerciseId", async (req, res) => {
    const { exerciseId } = req.params;
    
    try {
      // Get exercise from database by numeric ID
      const exercise = await storage.getExerciseById(parseInt(exerciseId));
      
      if (!exercise) {
        return res.status(404).json({ error: "Exercise not found" });
      }
      
      if (!exercise.videoUrl) {
        return res.status(404).json({ error: "No video available for this exercise" });
      }
      
      // For now, return a simple SVG placeholder instead of generating thumbnails
      // This allows the video player to work while we set up FFmpeg properly
      const svg = `
        <svg width="640" height="360" xmlns="http://www.w3.org/2000/svg">
          <rect width="640" height="360" fill="#1e293b"/>
          <circle cx="320" cy="180" r="50" fill="#3b82f6" opacity="0.3"/>
          <path d="M 300 160 L 340 180 L 300 200 Z" fill="#3b82f6"/>
          <text x="320" y="250" text-anchor="middle" fill="#94a3b8" font-family="Arial" font-size="16">
            ${exercise.name}
          </text>
          <text x="320" y="280" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="12">
            ${exercise.component.toUpperCase()} • ${exercise.beltLevel.toUpperCase()} BELT
          </text>
        </svg>
      `;
      
      res.set({
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      });
      
      res.send(svg);
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      res.status(500).json({ error: "Failed to generate thumbnail" });
    }
  });

  // Video upload route for coaches/admins
  app.post("/api/exercises/:exerciseId/upload-video", requireAuth, async (req: any, res) => {
    try {
      const { exerciseId } = req.params;
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // Check if user is coach or admin
      if (!user || (user.role !== 'coach' && user.role !== 'admin')) {
        return res.status(403).json({ error: "Only coaches and admins can upload videos" });
      }

      // Get the exercise to update
      const exercise = await storage.getExerciseById(parseInt(exerciseId));
      if (!exercise) {
        return res.status(404).json({ error: "Exercise not found" });
      }

      // Generate paths for video and thumbnail
      const videoPath = `videos/${exercise.component}/${exercise.beltLevel}/${exercise.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.mp4`;
      
      res.json({ 
        uploadPath: videoPath,
        message: "Upload path generated successfully",
        exerciseId: exercise.id,
        videoUrl: `/objects/${videoPath}`,
        thumbnailUrl: `/api/thumbnails/${exercise.id}`
      });
    } catch (error) {
      console.error("Error preparing video upload:", error);
      res.status(500).json({ error: "Failed to prepare video upload" });
    }
  });

  // Update exercise with video URLs after upload
  app.patch("/api/exercises/:exerciseId/video-urls", requireAuth, async (req: any, res) => {
    try {
      const { exerciseId } = req.params;
      const { videoUrl, thumbnailUrl } = req.body;
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // Check if user is coach or admin
      if (!user || (user.role !== 'coach' && user.role !== 'admin')) {
        return res.status(403).json({ error: "Only coaches and admins can update video URLs" });
      }

      // Update exercise with video URLs
      const updatedExercise = await storage.updateExerciseVideoUrls(parseInt(exerciseId), videoUrl, thumbnailUrl);
      
      res.json(updatedExercise);
    } catch (error) {
      console.error("Error updating exercise video URLs:", error);
      res.status(500).json({ error: "Failed to update video URLs" });
    }
  });

  // Object storage routes for serving public videos and thumbnails with range support
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, req, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Handle /objects/ routes for user's video files with range request support
  app.get("/objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "Video file not found" });
      }
      objectStorageService.downloadObject(file, req, res);
    } catch (error) {
      console.error("Error serving video object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin routes for managing complimentary access
  app.get("/api/admin/users", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // Only admins can access this
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: "Email parameter required" });
      }

      const searchResults = await storage.getUserByEmail(email);
      if (!searchResults) {
        return res.json({ user: null, organization: null });
      }

      let organization = null;
      if (searchResults.organizationId) {
        organization = await storage.getOrganization(searchResults.organizationId);
      }

      res.json({ 
        user: {
          id: searchResults.id,
          email: searchResults.email,
          firstName: searchResults.firstName,
          lastName: searchResults.lastName,
          role: searchResults.role,
          organizationId: searchResults.organizationId
        },
        organization: organization ? {
          id: organization.id,
          name: organization.name,
          subscriptionStatus: organization.subscriptionStatus,
          subscriptionTier: organization.subscriptionTier,
          trialEndsAt: organization.trialEndsAt
        } : null
      });
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  app.post("/api/admin/grant-access", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // Only admins can access this
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { targetUserId } = req.body;
      
      if (!targetUserId) {
        return res.status(400).json({ error: "targetUserId required" });
      }

      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!targetUser.organizationId) {
        return res.status(400).json({ error: "User does not have an organization" });
      }

      const organization = await storage.getOrganization(targetUser.organizationId);
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Update organization to active status with no expiration
      const updatedOrg = await storage.updateOrganization(organization.id, {
        subscriptionStatus: 'active',
        trialEndsAt: null // No expiration for complimentary access
      });

      res.json({ 
        success: true, 
        message: "Complimentary access granted successfully",
        organization: updatedOrg
      });
    } catch (error) {
      console.error("Error granting access:", error);
      res.status(500).json({ error: "Failed to grant access" });
    }
  });

  app.post("/api/admin/update-role", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // Only admins can access this
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { targetUserId, newRole } = req.body;
      
      if (!targetUserId || !newRole) {
        return res.status(400).json({ error: "targetUserId and newRole required" });
      }

      if (!['admin', 'coach', 'athlete'].includes(newRole)) {
        return res.status(400).json({ error: "Invalid role. Must be 'admin', 'coach', or 'athlete'" });
      }

      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update the user's role
      await storage.upsertUser({
        id: targetUser.id,
        email: targetUser.email,
        password: targetUser.password,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        role: newRole,
        organizationId: targetUser.organizationId,
        profileImageUrl: targetUser.profileImageUrl,
        isActive: targetUser.isActive,
      });

      res.json({ 
        success: true, 
        message: `User role updated to ${newRole}`,
        newRole
      });
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ error: "Failed to update role" });
    }
  });

  // Motion Code Pro waitlist signup (public endpoint)
  app.post("/api/pro-waitlist", async (req, res) => {
    try {
      const validatedData = insertProWaitlistSchema.parse(req.body);
      
      await db.insert(proWaitlist).values(validatedData);

      res.json({ 
        success: true, 
        message: "Successfully joined the waitlist!" 
      });
    } catch (error: any) {
      // Handle unique constraint violation (duplicate email)
      if (error.code === '23505') {
        return res.status(409).json({ 
          error: "This email is already on the waitlist" 
        });
      }
      
      // Handle validation errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: "Invalid form data", 
          details: error.errors 
        });
      }

      console.error("Error adding to waitlist:", error);
      res.status(500).json({ error: "Failed to join waitlist" });
    }
  });

  // ========== ROLE & ONBOARDING ROUTES ==========

  // Update user role (self-service during onboarding)
  app.patch("/api/auth/user/role", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { role } = req.body;

      if (!role || !['athlete', 'coach', 'clinician'].includes(role)) {
        return res.status(400).json({ error: "Valid role required: athlete, coach, or clinician" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.upsertUser({
        ...user,
        role: role
      });

      res.json({ success: true, role });
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ error: "Failed to update role" });
    }
  });

  // ========== ATHLETE PROFILE ROUTES ==========

  // Get athlete profile
  app.get("/api/athlete/profile", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getAthleteProfile(userId);
      
      if (!profile) {
        return res.json(null);
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching athlete profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Create/Update athlete profile
  app.post("/api/athlete/profile", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { age, sport, playingLevel, position, injuryHistory, trainingFrequency, seasonPhase, onboardingCompleted } = req.body;
      
      const profileData = {
        userId,
        age: age || null,
        sport: sport || "netball",
        playingLevel: playingLevel || null,
        position: position || null,
        injuryHistory: Array.isArray(injuryHistory) ? injuryHistory : null,
        trainingFrequency: trainingFrequency || null,
        seasonPhase: seasonPhase || null,
        onboardingCompleted: onboardingCompleted === true
      };

      const profile = await storage.upsertAthleteProfile(profileData);
      res.json({ success: true, profile });
    } catch (error) {
      console.error("Error saving athlete profile:", error);
      res.status(500).json({ error: "Failed to save profile" });
    }
  });

  // Get today's session for athlete
  app.get("/api/athlete/today-session", requireAuth, async (req: any, res) => {
    try {
      const session = await storage.getTodaySession(req.user.id);
      res.json(session);
    } catch (error) {
      console.error("Error fetching today's session:", error);
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  // Get week progress
  app.get("/api/athlete/week-progress", requireAuth, async (req: any, res) => {
    try {
      const progress = await storage.getWeekProgress(req.user.id);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching week progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  // ========== CLINIC DIRECTORY ROUTES ==========

  // Get all clinics with optional filters
  app.get("/api/clinics", async (req, res) => {
    try {
      const { state, services, search } = req.query;
      const clinics = await storage.getClinics({
        state: state as string,
        services: services ? (services as string).split(",") : undefined,
        search: search as string
      });
      res.json(clinics);
    } catch (error) {
      console.error("Error fetching clinics:", error);
      res.status(500).json({ error: "Failed to fetch clinics" });
    }
  });

  // Get single clinic
  app.get("/api/clinics/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const clinic = await storage.getClinicById(id);
      if (!clinic) {
        return res.status(404).json({ error: "Clinic not found" });
      }
      res.json(clinic);
    } catch (error) {
      console.error("Error fetching clinic:", error);
      res.status(500).json({ error: "Failed to fetch clinic" });
    }
  });

  // ========== COACH ROUTES ==========

  // Get coach compliance data
  app.get("/api/coach/compliance", requireAuth, async (req: any, res) => {
    try {
      const data = await storage.getCoachComplianceData(req.user.id);
      res.json(data);
    } catch (error) {
      console.error("Error fetching coach compliance:", error);
      res.status(500).json({ error: "Failed to fetch compliance data" });
    }
  });

  // Get coach teams with member counts
  app.get("/api/coach/teams", requireAuth, async (req: any, res) => {
    try {
      const teams = await storage.getCoachTeamsWithMembers(req.user.id);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching coach teams:", error);
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  // Get coach stats
  app.get("/api/coach/stats", requireAuth, async (req: any, res) => {
    try {
      const stats = await storage.getCoachStats(req.user.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching coach stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // CSV export of compliance data
  app.get("/api/coach/report/csv", requireAuth, async (req: any, res) => {
    try {
      const data = await storage.getCoachComplianceData(req.user.id);
      const headers = ["Name", "Club", "Belt Level", "This Week", "Week -1", "Week -2", "Week -3", "Week -4", "Compliance %", "Status", "Last Active"];
      const rows = data.athletes.map(a => [
        `${a.firstName || ''} ${a.lastName || ''}`.trim(),
        a.club || '',
        a.beltLevel,
        a.weeklyCompleted.toString(),
        ...(a.monthlyCompleted || [0, 0, 0, 0]).map(String),
        `${a.compliancePercent}%`,
        a.status,
        a.lastActive ? new Date(a.lastActive).toLocaleDateString() : 'Never'
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=compliance-report.csv');
      res.send(csv);
    } catch (error) {
      console.error("Error generating CSV report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  // Create team
  app.post("/api/coach/teams", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const teamData = {
        ...req.body,
        coachId: userId,
        teamCode: generateTeamCode()
      };
      
      const team = await storage.createTeam(teamData);
      res.json({ success: true, team });
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(500).json({ error: "Failed to create team" });
    }
  });

  // ========== COMMUNITY ROUTES ==========

  // Get all boards accessible to user
  app.get("/api/community/boards", requireAuth, async (req: any, res) => {
    try {
      const userRole = req.user.role || 'athlete';
      const boards = await storage.getCommunityBoards(userRole);
      res.json(boards);
    } catch (error) {
      console.error("Error fetching boards:", error);
      res.status(500).json({ error: "Failed to fetch boards" });
    }
  });

  // Get board by slug
  app.get("/api/community/boards/:slug", requireAuth, async (req: any, res) => {
    try {
      const { slug } = req.params;
      const board = await storage.getBoardBySlug(slug);
      
      if (!board) {
        return res.status(404).json({ error: "Board not found" });
      }
      
      res.json(board);
    } catch (error) {
      console.error("Error fetching board:", error);
      res.status(500).json({ error: "Failed to fetch board" });
    }
  });

  // Get posts for a board
  app.get("/api/community/boards/:slug/posts", requireAuth, async (req: any, res) => {
    try {
      const { slug } = req.params;
      const { limit = 20, offset = 0 } = req.query;
      
      const board = await storage.getBoardBySlug(slug);
      if (!board) {
        return res.status(404).json({ error: "Board not found" });
      }
      
      const posts = await storage.getBoardPosts(board.id, Number(limit), Number(offset));
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  // Get single post with comments
  app.get("/api/community/posts/:postId", requireAuth, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const post = await storage.getPostById(postId);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      // Increment view count
      await storage.incrementPostViews(postId);
      
      const comments = await storage.getPostComments(postId);
      res.json({ ...post, comments });
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ error: "Failed to fetch post" });
    }
  });

  // Create new post
  app.post("/api/community/boards/:slug/posts", requireAuth, async (req: any, res) => {
    try {
      const { slug } = req.params;
      const { title, content } = req.body;
      const authorId = req.user.id;
      
      if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required" });
      }
      
      const board = await storage.getBoardBySlug(slug);
      if (!board) {
        return res.status(404).json({ error: "Board not found" });
      }
      
      const post = await storage.createPost({
        boardId: board.id,
        authorId,
        title,
        content
      });
      
      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  // Add comment to post
  app.post("/api/community/posts/:postId/comments", requireAuth, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const { content, parentId } = req.body;
      const authorId = req.user.id;
      
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }
      
      const comment = await storage.createComment({
        postId,
        authorId,
        content,
        parentId: parentId || null
      });
      
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  // Toggle like on post
  app.post("/api/community/posts/:postId/like", requireAuth, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const userId = req.user.id;
      
      const liked = await storage.togglePostLike(postId, userId);
      res.json({ liked });
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ error: "Failed to toggle like" });
    }
  });

  // ========== ACHIEVEMENTS & ATHLETE PROGRESS ROUTES ==========

  app.get("/api/achievements", async (req, res) => {
    try {
      const allAchievements = await storage.getAllAchievements();
      res.json(allAchievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.get("/api/athlete/achievements", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const earned = await storage.getUserAchievements(userId);
      res.json(earned);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ error: "Failed to fetch user achievements" });
    }
  });

  app.get("/api/athlete/progress", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const progress = await storage.getAthleteProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching athlete progress:", error);
      res.status(500).json({ error: "Failed to fetch athlete progress" });
    }
  });

  // ========== PARTNER ORGANISATION ROUTES ==========

  app.get("/api/user/partner-org", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || !user.partnerOrgId) {
        return res.json(null);
      }

      const org = await storage.getPartnerOrgById(user.partnerOrgId);
      if (!org) {
        return res.json(null);
      }

      res.json({
        id: org.id,
        name: org.name,
        slug: org.slug,
        sportName: org.sportName,
        primaryColor: org.primaryColor,
        secondaryColor: org.secondaryColor,
        logoUrl: org.logoUrl,
        welcomeMessage: org.welcomeMessage,
      });
    } catch (error) {
      console.error("Error fetching user partner org:", error);
      res.status(500).json({ error: "Failed to fetch partner organisation" });
    }
  });

  app.get("/api/partner-orgs/validate/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const org = await storage.getPartnerOrgByCode(code);

      if (!org) {
        return res.status(404).json({ error: "Invalid organisation code" });
      }

      res.json({
        name: org.name,
        slug: org.slug,
        sport: org.sportName,
        welcomeMessage: org.welcomeMessage,
        primaryColor: org.primaryColor,
        secondaryColor: org.secondaryColor,
        logoUrl: org.logoUrl,
      });
    } catch (error) {
      console.error("Error validating partner org code:", error);
      res.status(500).json({ error: "Failed to validate code" });
    }
  });

  app.get("/api/partner-orgs/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const org = await storage.getPartnerOrgBySlug(slug);

      if (!org) {
        return res.status(404).json({ error: "Organisation not found" });
      }

      res.json({
        id: org.id,
        name: org.name,
        slug: org.slug,
        sportName: org.sportName,
        primaryColor: org.primaryColor,
        secondaryColor: org.secondaryColor,
        logoUrl: org.logoUrl,
        welcomeMessage: org.welcomeMessage,
        description: org.description,
        website: org.website,
        country: org.country,
      });
    } catch (error) {
      console.error("Error fetching partner org by slug:", error);
      res.status(500).json({ error: "Failed to fetch organisation" });
    }
  });

  app.patch("/api/auth/user/location", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { state, region, club } = req.body;

      if (!state) {
        return res.status(400).json({ error: "State is required" });
      }

      await storage.updateUserLocation(userId, state, region || "", club || "");
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user location:", error);
      res.status(500).json({ error: "Failed to update location" });
    }
  });

  // ========== NSO ADMIN ANALYTICS ROUTES ==========

  const requireNSOAdmin = async (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const user = await storage.getUser(req.user.id);
    if (!user || (user.role !== 'nso_admin' && user.role !== 'admin')) {
      return res.status(403).json({ error: "NSO admin access required" });
    }
    req.nsoUser = user;
    next();
  };

  app.get("/api/nso/analytics", requireAuth, requireNSOAdmin, async (req: any, res) => {
    try {
      const partnerOrgId = req.nsoUser.partnerOrgId || undefined;
      const analytics = await storage.getNSOAnalytics(partnerOrgId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching NSO analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/nso/export/csv", requireAuth, requireNSOAdmin, async (req: any, res) => {
    try {
      const partnerOrgId = req.nsoUser.partnerOrgId || undefined;
      const analytics = await storage.getNSOAnalytics(partnerOrgId);

      const summaryHeaders = ["Metric", "Value"];
      const summaryRows = [
        ["Total Registered Athletes", analytics.totalAthletes.toString()],
        ["Active This Week", analytics.activeThisWeek.toString()],
        ["Average Compliance Rate", `${analytics.averageCompliance}%`],
        ["Total Sessions This Month", analytics.totalSessionsMonth.toString()],
      ];

      const stateHeaders = ["State", "Registered Athletes", "Active Count", "Active %", "Avg Sessions/Week", "Top Club"];
      const stateRows = analytics.byState.map(s => [
        s.state,
        s.athleteCount.toString(),
        s.activeCount.toString(),
        `${s.activePercent}%`,
        s.avgSessionsWeek.toString(),
        s.topClub,
      ]);

      const trendHeaders = ["Week", "Compliance %"];
      const trendRows = analytics.weeklyTrend.map(t => [t.week, `${t.compliance}%`]);

      const csvParts = [
        "NSO ANALYTICS REPORT",
        `Generated: ${new Date().toLocaleDateString()}`,
        "",
        "OVERVIEW",
        summaryHeaders.join(","),
        ...summaryRows.map(r => r.map(v => `"${v}"`).join(",")),
        "",
        "REGIONAL BREAKDOWN",
        stateHeaders.join(","),
        ...stateRows.map(r => r.map(v => `"${v}"`).join(",")),
        "",
        "WEEKLY COMPLIANCE TREND",
        trendHeaders.join(","),
        ...trendRows.map(r => r.map(v => `"${v}"`).join(",")),
      ];

      const csv = csvParts.join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=nso-analytics-report-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (error) {
      console.error("Error generating NSO CSV report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  // ========== CLINIC DIRECTORY ROUTES ==========

  app.get("/api/clinics", async (req, res) => {
    try {
      const { state, search, services } = req.query;
      const filters: { state?: string; search?: string; services?: string[] } = {};
      if (state && typeof state === "string" && state !== "all") filters.state = state;
      if (search && typeof search === "string") filters.search = search;
      if (services && typeof services === "string") filters.services = services.split(",");
      const clinicList = await storage.getClinics(filters);
      res.json(clinicList);
    } catch (error) {
      console.error("Error fetching clinics:", error);
      res.status(500).json({ error: "Failed to fetch clinics" });
    }
  });

  app.get("/api/clinics/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid clinic ID" });
      }
      const clinic = await storage.getClinicById(id);
      if (!clinic) {
        return res.status(404).json({ error: "Clinic not found" });
      }
      res.json(clinic);
    } catch (error) {
      console.error("Error fetching clinic:", error);
      res.status(500).json({ error: "Failed to fetch clinic" });
    }
  });

  app.post("/api/clinics/:id/refer", requireAuth, async (req: any, res) => {
    try {
      const clinicId = parseInt(req.params.id);
      if (isNaN(clinicId)) {
        return res.status(400).json({ error: "Invalid clinic ID" });
      }
      const clinic = await storage.getClinicById(clinicId);
      if (!clinic) {
        return res.status(404).json({ error: "Clinic not found" });
      }
      const { referralType } = req.body;
      if (!referralType || !["assessment", "treatment", "prevention"].includes(referralType)) {
        return res.status(400).json({ error: "Invalid referral type. Must be assessment, treatment, or prevention." });
      }
      const referral = await storage.createClinicReferral({
        userId: req.user.id,
        clinicId,
        referralType,
      });
      res.status(201).json({ referral, clinic });
    } catch (error) {
      console.error("Error creating referral:", error);
      res.status(500).json({ error: "Failed to create referral" });
    }
  });

  app.get("/api/athlete/referrals", requireAuth, async (req: any, res) => {
    try {
      const referrals = await storage.getUserReferrals(req.user.id);
      res.json(referrals);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      res.status(500).json({ error: "Failed to fetch referrals" });
    }
  });

  // ========== EDUCATION MODULE ROUTES ==========

  app.get("/api/education/modules", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      const accessLevel = user?.role || 'coach';
      const modules = await storage.getEducationModules(accessLevel);
      const completedIds = await storage.getUserModuleCompletions(userId);
      const modulesWithStatus = modules.map(mod => ({
        ...mod,
        isCompleted: completedIds.includes(mod.id),
      }));
      res.json(modulesWithStatus);
    } catch (error) {
      console.error("Error fetching education modules:", error);
      res.status(500).json({ error: "Failed to fetch education modules" });
    }
  });

  app.get("/api/education/progress", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const progress = await storage.getEducationProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching education progress:", error);
      res.status(500).json({ error: "Failed to fetch education progress" });
    }
  });

  app.get("/api/education/modules/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid module ID" });
      }
      const mod = await storage.getEducationModule(id);
      if (!mod) {
        return res.status(404).json({ error: "Module not found" });
      }
      const completedIds = await storage.getUserModuleCompletions(req.user.id);
      res.json({ ...mod, isCompleted: completedIds.includes(mod.id) });
    } catch (error) {
      console.error("Error fetching education module:", error);
      res.status(500).json({ error: "Failed to fetch education module" });
    }
  });

  app.post("/api/education/modules/:id/complete", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid module ID" });
      }
      const mod = await storage.getEducationModule(id);
      if (!mod) {
        return res.status(404).json({ error: "Module not found" });
      }
      const completion = await storage.completeModule(req.user.id, id);
      res.json(completion);
    } catch (error) {
      console.error("Error completing module:", error);
      res.status(500).json({ error: "Failed to complete module" });
    }
  });

  // ─── SESSION PLAYER — COMPLETE SESSION (T005) ──────────────────────────────

  // POST /api/session/complete — athlete marks session done, updates streak + belt
  app.post("/api/session/complete", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { exerciseIds, rating, durationSeconds } = req.body;

      if (!exerciseIds || !Array.isArray(exerciseIds) || exerciseIds.length === 0) {
        return res.status(400).json({ error: "exerciseIds required" });
      }

      const completion = await storage.recordSessionCompletion({
        userId,
        exerciseIds: exerciseIds.map(String),
        rating: rating || null,
        durationSeconds: durationSeconds || null,
      });

      // Check for new achievements after session
      const profile = await storage.getAthleteProfile(userId);
      const totalSessions = profile?.totalSessionsCompleted || 0;
      const allAchievements = await storage.getAllAchievements();
      const earned = await storage.getUserAchievements(userId);
      const earnedIds = new Set(earned.map((e: any) => e.achievementId));

      const newAchievements: any[] = [];
      for (const ach of allAchievements) {
        if (earnedIds.has(ach.id)) continue;
        let unlocked = false;
        if (ach.triggerType === "sessions_completed" && totalSessions >= (ach.triggerValue || 0)) {
          unlocked = true;
        } else if (ach.triggerType === "streak" && (profile?.currentStreak || 0) >= (ach.triggerValue || 0)) {
          unlocked = true;
        }
        if (unlocked) {
          await storage.awardAchievement(userId, ach.id);
          newAchievements.push(ach);
        }
      }

      res.json({ completion, newAchievements });
    } catch (error: any) {
      console.error("Session complete error:", error);
      res.status(500).json({ error: "Failed to record session" });
    }
  });

  // ─── INJURY REPORTS (T008 — Berkshire commercial data) ─────────────────────

  // POST /api/injury/report — athlete reports pain mid-session
  app.post("/api/injury/report", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { bodyPart, painRating, notes, sessionExerciseIds } = req.body;

      if (!bodyPart || !painRating) {
        return res.status(400).json({ error: "bodyPart and painRating required" });
      }

      const report = await storage.createInjuryReport({
        userId,
        bodyPart,
        painRating: parseInt(painRating),
        notes: notes || null,
        sessionExerciseIds: sessionExerciseIds || null,
        referredToClinicId: null,
        referralStatus: "none",
      });

      // Return clinic recommendation if pain >= 6
      const shouldRefer = painRating >= 6;
      res.json({ report, shouldRefer });
    } catch (error: any) {
      console.error("Injury report error:", error);
      res.status(500).json({ error: "Failed to save injury report" });
    }
  });

  // GET /api/injury/stats — admin/NSO dashboard stats
  app.get("/api/injury/stats", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || (user.role !== "admin" && user.role !== "nso_admin")) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const stats = await storage.getInjuryReportStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch injury stats" });
    }
  });

  // GET /api/injury/coach — coach sees injury flags for their athletes
  app.get("/api/injury/coach", requireAuth, async (req: any, res) => {
    try {
      const reports = await storage.getInjuryReportsByCoach(req.user.id);
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch injury reports" });
    }
  });

  // ── STRIPE ROUTES ─────────────────────────────────────────────────────────
  setupStripeRoutes(app);

  // ── PROGRAM ENGINE API ────────────────────────────────────────────────────
  app.get("/api/program-engine/options", requireAuth, async (_req, res) => {
    const { PHASE_OPTIONS, WAVE_WEEK_OPTIONS } = await import("./lib/blueprint-generator");
    res.json({ phases: PHASE_OPTIONS, waveWeeks: WAVE_WEEK_OPTIONS });
  });

  app.get("/api/program-engine/load-budget", requireAuth, requireTier("pro"), async (req: any, res) => {
    try {
      const { belt = "WHITE", phase = "PRESEASON_A", waveWeek = "1" } = req.query;
      const { getPhaseBudget } = await import("./lib/blueprint-generator");
      const budget = getPhaseBudget(
        (belt as string).toUpperCase() as "WHITE" | "BLUE" | "BLACK",
        phase as any,
        parseInt(waveWeek as string) as 1 | 2 | 3
      );
      res.json(budget);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Training blocks CRUD
  app.get("/api/programs/:programId/blocks", requireAuth, requireTier("pro"), async (req: any, res) => {
    try {
      const { programId } = req.params;
      const { weekNumber, dayNumber } = req.query;
      let q = db.select().from(trainingBlocks).where(eq(trainingBlocks.programId, parseInt(programId)));
      const blocks = await q;
      let filtered = blocks;
      if (weekNumber) filtered = filtered.filter(b => b.weekNumber === parseInt(weekNumber as string));
      if (dayNumber) filtered = filtered.filter(b => b.dayNumber === parseInt(dayNumber as string));
      res.json(filtered.sort((a, b) => a.orderIndex - b.orderIndex));
    } catch (e) { res.status(500).json({ error: "Failed to fetch blocks" }); }
  });

  app.post("/api/programs/:programId/blocks", requireAuth, requireTier("pro"), async (req: any, res) => {
    try {
      const { programId } = req.params;
      const [block] = await db.insert(trainingBlocks).values({ ...req.body, programId: parseInt(programId) }).returning();
      res.status(201).json(block);
    } catch (e) { res.status(500).json({ error: "Failed to create block" }); }
  });

  app.patch("/api/programs/blocks/:blockId", requireAuth, requireTier("pro"), async (req: any, res) => {
    try {
      const { blockId } = req.params;
      const [updated] = await db.update(trainingBlocks).set(req.body).where(eq(trainingBlocks.id, parseInt(blockId))).returning();
      res.json(updated);
    } catch (e) { res.status(500).json({ error: "Failed to update block" }); }
  });

  app.delete("/api/programs/blocks/:blockId", requireAuth, requireTier("pro"), async (req: any, res) => {
    try {
      const { blockId } = req.params;
      await db.delete(blockExercises).where(eq(blockExercises.blockId, parseInt(blockId)));
      await db.delete(trainingBlocks).where(eq(trainingBlocks.id, parseInt(blockId)));
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Failed to delete block" }); }
  });

  // Block exercises CRUD
  app.get("/api/programs/blocks/:blockId/exercises", requireAuth, requireTier("pro"), async (req: any, res) => {
    try {
      const { blockId } = req.params;
      const exercises = await db.select().from(blockExercises).where(eq(blockExercises.blockId, parseInt(blockId)));
      res.json(exercises.sort((a, b) => a.orderIndex - b.orderIndex));
    } catch (e) { res.status(500).json({ error: "Failed to fetch block exercises" }); }
  });

  app.post("/api/programs/blocks/:blockId/exercises", requireAuth, requireTier("pro"), async (req: any, res) => {
    try {
      const { blockId } = req.params;
      const [ex] = await db.insert(blockExercises).values({ ...req.body, blockId: parseInt(blockId) }).returning();
      res.status(201).json(ex);
    } catch (e) { res.status(500).json({ error: "Failed to add block exercise" }); }
  });

  app.patch("/api/programs/blocks/exercises/:exId", requireAuth, requireTier("pro"), async (req: any, res) => {
    try {
      const { exId } = req.params;
      const [updated] = await db.update(blockExercises).set(req.body).where(eq(blockExercises.id, parseInt(exId))).returning();
      res.json(updated);
    } catch (e) { res.status(500).json({ error: "Failed to update block exercise" }); }
  });

  app.delete("/api/programs/blocks/exercises/:exId", requireAuth, requireTier("pro"), async (req: any, res) => {
    try {
      const { exId } = req.params;
      await db.delete(blockExercises).where(eq(blockExercises.id, parseInt(exId)));
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Failed to delete block exercise" }); }
  });

  // Program phases
  app.get("/api/programs/:programId/phases", requireAuth, requireTier("pro"), async (req: any, res) => {
    try {
      const phases = await db.select().from(programPhases).where(eq(programPhases.programId, parseInt(req.params.programId)));
      res.json(phases.sort((a, b) => a.orderIndex - b.orderIndex));
    } catch (e) { res.status(500).json({ error: "Failed to fetch phases" }); }
  });

  app.post("/api/programs/:programId/phases", requireAuth, requireTier("pro"), async (req: any, res) => {
    try {
      const [phase] = await db.insert(programPhases).values({ ...req.body, programId: parseInt(req.params.programId) }).returning();
      res.status(201).json(phase);
    } catch (e) { res.status(500).json({ error: "Failed to create phase" }); }
  });

  // ── COACH MESSAGING ────────────────────────────────────────────────────────
  app.get("/api/messages", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const msgs = await db.select().from(coachMessages)
        .where(or(eq(coachMessages.fromUserId, userId), eq(coachMessages.toUserId, userId)))
        .orderBy(desc(coachMessages.createdAt));
      // Normalize to frontend-friendly format
      const normalized = msgs.map((m: any) => ({
        id: m.id,
        senderId: m.fromUserId,
        recipientId: m.isBroadcast ? null : m.toUserId,
        subject: "(Message)",
        body: m.content,
        messageType: m.isBroadcast ? "broadcast" : "direct",
        isRead: m.isRead,
        createdAt: m.createdAt,
      }));
      res.json(normalized);
    } catch (e) { res.status(500).json({ error: "Failed to fetch messages" }); }
  });

  app.post("/api/messages/athlete/:athleteId", requireAuth, requireTier("pro"), async (req: any, res) => {
    try {
      const content = req.body.content || req.body.body || req.body.message || "";
      if (!content) return res.status(400).json({ error: "Message content required" });
      const [msg] = await db.insert(coachMessages).values({
        fromUserId: req.user.id,
        toUserId: req.params.athleteId,
        content,
        isBroadcast: false,
      }).returning();
      res.status(201).json(msg);
    } catch (e) { res.status(500).json({ error: "Failed to send message" }); }
  });

  app.post("/api/messages/broadcast", requireAuth, requireTier("pro"), async (req: any, res) => {
    try {
      const content = req.body.content || req.body.body || req.body.message || "";
      if (!content) return res.status(400).json({ error: "Message content required" });
      let { athleteIds } = req.body;
      // If no athleteIds provided, broadcast to all athletes under this coach's organization
      if (!Array.isArray(athleteIds) || athleteIds.length === 0) {
        const orgId = req.user.organizationId;
        let athleteRows: any[] = [];
        if (orgId) {
          athleteRows = await db.select({ id: users.id }).from(users)
            .where(and(eq(users.organizationId, orgId), eq(users.role, "athlete")));
        }
        athleteIds = athleteRows.map((a: any) => a.id);
      }
      if (athleteIds.length === 0) {
        return res.json({ sent: 0, message: "No athletes found to broadcast to" });
      }
      const msgs = await db.insert(coachMessages).values(
        athleteIds.map((toId: string) => ({ fromUserId: req.user.id, toUserId: toId, content, isBroadcast: true }))
      ).returning();
      res.json({ sent: msgs.length });
    } catch (e) { res.status(500).json({ error: "Failed to broadcast" }); }
  });

  app.patch("/api/messages/:msgId/read", requireAuth, async (req: any, res) => {
    try {
      await db.update(coachMessages).set({ isRead: true }).where(and(eq(coachMessages.id, parseInt(req.params.msgId)), eq(coachMessages.toUserId, req.user.id)));
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Failed to mark read" }); }
  });

  // ── WELLNESS CHECK-INS ─────────────────────────────────────────────────────
  app.post("/api/wellness", requireAuth, async (req: any, res) => {
    try {
      const [checkin] = await db.insert(wellnessCheckins).values({ ...req.body, userId: req.user.id }).returning();
      res.status(201).json(checkin);
    } catch (e) { res.status(500).json({ error: "Failed to save wellness check-in" }); }
  });

  app.get("/api/wellness/recent", requireAuth, async (req: any, res) => {
    try {
      const checkins = await db.select().from(wellnessCheckins)
        .where(eq(wellnessCheckins.userId, req.user.id))
        .orderBy(desc(wellnessCheckins.createdAt))
        .limit(14);
      res.json(checkins);
    } catch (e) { res.status(500).json({ error: "Failed to fetch wellness" }); }
  });

  // ── AUDIT LOGS ─────────────────────────────────────────────────────────────
  app.get("/api/audit-logs", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || (user.role !== "admin" && user.role !== "nso_admin")) return res.status(403).json({ error: "Admin only" });
      const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(500);
      res.json(logs);
    } catch (e) { res.status(500).json({ error: "Failed to fetch audit logs" }); }
  });

  // ── ATHLETE MANAGEMENT (T007) ─────────────────────────────────────────────

  // Invite a single athlete — creates account, links to coach
  app.post("/api/athletes/invite", requireAuth, requireTier("pro"), async (req: any, res) => {
    try {
      const { firstName, lastName, email, sport } = req.body;
      if (!firstName || !lastName || !email) return res.status(400).json({ error: "firstName, lastName, and email are required" });

      const existing = await storage.getUserByEmail(email);
      if (existing) return res.status(409).json({ error: "An account with this email already exists" });

      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
      const hashed = await (await import("bcrypt")).default.hash(tempPassword, 10);

      const [newUser] = await db.insert(users).values({
        id: `athlete_${Date.now()}_${Math.random().toString(36).slice(-4)}`,
        email: email.toLowerCase().trim(),
        password: hashed,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: "athlete",
        coachId: req.user.id,
        subscriptionTier: "trial",
        subscriptionStatus: "trial",
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }).returning();

      res.json({ user: { id: newUser.id, email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName }, tempPassword });
    } catch (e: any) {
      console.error("Invite athlete error:", e);
      res.status(500).json({ error: e.message || "Failed to create athlete" });
    }
  });

  // CSV import — accepts CSV text, bulk-creates athletes
  app.post("/api/athletes/csv-import", requireAuth, requireTier("pro"), async (req: any, res) => {
    try {
      const { csvText } = req.body;
      if (!csvText) return res.status(400).json({ error: "csvText is required" });

      const lines = csvText.trim().split(/\r?\n/).filter((l: string) => l.trim());
      const results: { email: string; status: string; tempPassword?: string }[] = [];
      const bcrypt = (await import("bcrypt")).default;

      for (const line of lines) {
        const [firstName, lastName, email] = line.split(",").map((s: string) => s.trim().replace(/^"|"$/g, ""));
        if (!firstName || !lastName || !email || !email.includes("@")) {
          results.push({ email: email || line, status: "skipped — invalid format" });
          continue;
        }
        const existing = await storage.getUserByEmail(email.toLowerCase());
        if (existing) {
          results.push({ email, status: "skipped — already exists" });
          continue;
        }
        const tempPassword = Math.random().toString(36).slice(-8) + "A1";
        const hashed = await bcrypt.hash(tempPassword, 10);
        await db.insert(users).values({
          id: `athlete_${Date.now()}_${Math.random().toString(36).slice(-4)}`,
          email: email.toLowerCase(),
          password: hashed,
          firstName,
          lastName,
          role: "athlete",
          coachId: req.user.id,
          subscriptionTier: "trial",
          subscriptionStatus: "trial",
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        results.push({ email, status: "created", tempPassword });
      }

      res.json({ imported: results.filter(r => r.status === "created").length, results });
    } catch (e: any) {
      console.error("CSV import error:", e);
      res.status(500).json({ error: e.message || "Failed to import" });
    }
  });

  // Bulk assign athletes to a program
  app.post("/api/athletes/bulk-assign", requireAuth, requireTier("pro"), async (req: any, res) => {
    try {
      const { athleteIds, programId } = req.body;
      if (!athleteIds?.length || !programId) return res.status(400).json({ error: "athleteIds and programId required" });
      let assigned = 0;
      for (const athleteId of athleteIds) {
        try {
          await storage.assignProgramToAthlete({ programId: Number(programId), athleteId, assignedByUserId: req.user.id });
          assigned++;
        } catch {}
      }
      res.json({ assigned });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to bulk assign" });
    }
  });

  // Athlete detail — profile, session completions, compliance summary
  app.get("/api/athletes/:id/detail", requireAuth, requireTier("pro"), async (req: any, res) => {
    try {
      const athlete = await storage.getUser(req.params.id);
      if (!athlete) return res.status(404).json({ error: "Athlete not found" });
      if (athlete.coachId !== req.user.id && req.user.role !== "admin") return res.status(403).json({ error: "Not your athlete" });

      const profile = await storage.getAthleteProfile(req.params.id).catch(() => null);
      const sessions = await db.select().from(athleteSessionCompletions)
        .where(eq(athleteSessionCompletions.userId, req.params.id))
        .orderBy(desc(athleteSessionCompletions.completedAt))
        .limit(30);

      res.json({
        athlete: { id: athlete.id, firstName: athlete.firstName, lastName: athlete.lastName, email: athlete.email, role: athlete.role, subscriptionTier: athlete.subscriptionTier, createdAt: athlete.createdAt },
        profile,
        recentSessions: sessions,
        sessionCount: sessions.length,
      });
    } catch (e: any) {
      console.error("Athlete detail error:", e);
      res.status(500).json({ error: e.message || "Failed to get athlete detail" });
    }
  });

  // Remove athlete from coach (unlink, don't delete account)
  app.delete("/api/athletes/:id", requireAuth, requireTier("pro"), async (req: any, res) => {
    try {
      const athlete = await storage.getUser(req.params.id);
      if (!athlete) return res.status(404).json({ error: "Not found" });
      if (athlete.coachId !== req.user.id && req.user.role !== "admin") return res.status(403).json({ error: "Not your athlete" });
      await db.update(users).set({ coachId: null }).where(eq(users.id, req.params.id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to remove athlete" });
    }
  });
  const httpServer = createServer(app);
  return httpServer;
}
