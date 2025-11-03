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

  // Program Exercise routes
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

  const httpServer = createServer(app);
  return httpServer;
}
