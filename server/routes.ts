import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { getPermissions, USER_ROLES, requireHeadCoach, requireCoach } from "./auth";
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
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication BEFORE registering other routes
  await setupAuth(app);
  registerAuthRoutes(app);
  
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
          const athleteStats = await storage.getAthleteStatsOrCreate(athleteId);
          athleteContext = {
            athlete,
            personalRecords,
            recentActivity: {
              totalWorkouts: athleteStats.totalWorkouts,
              totalSets: athleteStats.totalSetsCompleted,
              totalPRs: personalRecords.length,
              streak: athleteStats.currentStreak,
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
      res.status(201).json(log);
    } catch (error) {
      res.status(400).json({ error: "Invalid workout log data" });
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
          const existing = await storage.getValdProfileByValdId(apiProfile.id);
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
        const apiTests = await valdHubService.getAllTests(deviceType, modifiedFromUtc);
        
        let processed = 0;
        for (const apiTest of apiTests) {
          const existingTest = await storage.getValdTestByValdId(apiTest.id);
          if (existingTest) continue;

          const valdProfile = await storage.getValdProfileByValdId(apiTest.profileId);
          if (!valdProfile) continue;

          const insertData = valdHubService.transformTestToInsert(
            apiTest, 
            valdProfile.id, 
            valdProfile.athleteId,
            deviceType
          );
          await storage.createValdTest(insertData);
          processed++;
        }

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

      res.json({ 
        success: true, 
        setNumber, 
        reps, 
        weight,
        workoutLogId: workoutLog.id,
        isPR,
        newPR: newPR ? { maxWeight: newPR.maxWeight, reps: newPR.reps } : null,
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

  const httpServer = createServer(app);
  return httpServer;
}
