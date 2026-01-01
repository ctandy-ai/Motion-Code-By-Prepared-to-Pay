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
  insertProgramPhaseSchema,
  insertProgramWeekSchema,
  insertTrainingBlockSchema,
  insertBlockExerciseSchema,
  insertBlockTemplateSchema,
  insertTemplateBlockExerciseSchema,
  insertReadinessSurveySchema,
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

  const httpServer = createServer(app);
  return httpServer;
}
