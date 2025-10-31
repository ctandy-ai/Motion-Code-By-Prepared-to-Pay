import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const exercises = pgTable("exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  equipment: text("equipment").notNull(),
  difficulty: text("difficulty").notNull(),
  instructions: text("instructions").notNull(),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({ id: true });
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercises.$inferSelect;

export const athletes = pgTable("athletes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  team: text("team"),
  position: text("position"),
  avatarUrl: text("avatar_url"),
  dateJoined: timestamp("date_joined").defaultNow(),
});

export const insertAthleteSchema = createInsertSchema(athletes).omit({ 
  id: true, 
  dateJoined: true 
});
export type InsertAthlete = z.infer<typeof insertAthleteSchema>;
export type Athlete = typeof athletes.$inferSelect;

export const programs = pgTable("programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProgramSchema = createInsertSchema(programs).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Program = typeof programs.$inferSelect;

export const programExercises = pgTable("program_exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  programId: varchar("program_id").notNull(),
  exerciseId: varchar("exercise_id").notNull(),
  weekNumber: integer("week_number").notNull(),
  dayNumber: integer("day_number").notNull(),
  sets: integer("sets").notNull(),
  reps: integer("reps").notNull(),
  restSeconds: integer("rest_seconds"),
  notes: text("notes"),
  orderIndex: integer("order_index").notNull(),
});

export const insertProgramExerciseSchema = createInsertSchema(programExercises).omit({ id: true });
export type InsertProgramExercise = z.infer<typeof insertProgramExerciseSchema>;
export type ProgramExercise = typeof programExercises.$inferSelect;

export const athletePrograms = pgTable("athlete_programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull(),
  programId: varchar("program_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  status: text("status").notNull(),
});

export const insertAthleteProgramSchema = createInsertSchema(athletePrograms).omit({ id: true });
export type InsertAthleteProgram = z.infer<typeof insertAthleteProgramSchema>;
export type AthleteProgram = typeof athletePrograms.$inferSelect;

export const workoutLogs = pgTable("workout_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull(),
  programExerciseId: varchar("program_exercise_id").notNull(),
  exerciseId: varchar("exercise_id").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
  sets: integer("sets").notNull(),
  repsPerSet: text("reps_per_set").notNull(),
  weightPerSet: text("weight_per_set").notNull(),
  notes: text("notes"),
});

export const insertWorkoutLogSchema = createInsertSchema(workoutLogs).omit({ 
  id: true, 
  completedAt: true 
});
export type InsertWorkoutLog = z.infer<typeof insertWorkoutLogSchema>;
export type WorkoutLog = typeof workoutLogs.$inferSelect;

export const personalRecords = pgTable("personal_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull(),
  exerciseId: varchar("exercise_id").notNull(),
  maxWeight: real("max_weight").notNull(),
  reps: integer("reps").notNull(),
  achievedAt: timestamp("achieved_at").defaultNow(),
});

export const insertPersonalRecordSchema = createInsertSchema(personalRecords).omit({ 
  id: true, 
  achievedAt: true 
});
export type InsertPersonalRecord = z.infer<typeof insertPersonalRecordSchema>;
export type PersonalRecord = typeof personalRecords.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
