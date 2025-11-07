import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertExerciseSchema,
  insertAthleteSchema,
  insertProgramSchema,
  insertProgramExerciseSchema,
  insertAthleteProgramSchema,
  insertWorkoutLogSchema,
  insertPersonalRecordSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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

  app.post("/api/exercises", async (req, res) => {
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

  app.delete("/api/exercises/:id", async (req, res) => {
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

  app.post("/api/athletes", async (req, res) => {
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

  app.delete("/api/athletes/:id", async (req, res) => {
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
  app.post("/api/athletes/import", async (req, res) => {
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
      const { chatWithCoach } = await import("./ai-coach");
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

      const response = await chatWithCoach(messages, athleteContext);
      res.json({ message: response });
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

  app.post("/api/programs", async (req, res) => {
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

  app.delete("/api/programs/:id", async (req, res) => {
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

  app.post("/api/athlete-programs", async (req, res) => {
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
        return res.json([]);
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
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
        
        const programExercises = await storage.getProgramExercises(ap.programId);
        const todayExercises = programExercises.filter(
          pe => pe.weekNumber === currentWeek && pe.dayNumber === currentDay
        );
        
        for (const pe of todayExercises) {
          const exercise = await storage.getExercise(pe.exerciseId);
          if (exercise) {
            todayWorkouts.push({
              programExercise: pe,
              exercise: exercise,
              program: program,
              athleteProgramId: ap.id,
            });
          }
        }
      }
      
      res.json(todayWorkouts);
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

  const httpServer = createServer(app);
  return httpServer;
}
