import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, real, unique, index } from "drizzle-orm/pg-core";
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
  email: text("email").unique(),
  phone: text("phone"),
  team: text("team"),
  position: text("position"),
  status: text("status").default("Registered"),
  avatarUrl: text("avatar_url"),
  dateJoined: timestamp("date_joined").defaultNow(),
});

export const insertAthleteSchema = createInsertSchema(athletes).omit({ 
  id: true, 
  dateJoined: true 
});
export type InsertAthlete = z.infer<typeof insertAthleteSchema>;
export type Athlete = typeof athletes.$inferSelect;

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTeamSchema = createInsertSchema(teams).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

export const athleteTeams = pgTable("athlete_teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull(),
  teamId: varchar("team_id").notNull(),
}, (table) => ({
  uniqueAthleteTeam: unique().on(table.athleteId, table.teamId),
}));

export const insertAthleteTeamSchema = createInsertSchema(athleteTeams).omit({ id: true });
export type InsertAthleteTeam = z.infer<typeof insertAthleteTeamSchema>;
export type AthleteTeam = typeof athleteTeams.$inferSelect;

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

export const programTemplates = pgTable("program_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  duration: integer("duration").notNull(),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  isPublic: integer("is_public").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProgramTemplateSchema = createInsertSchema(programTemplates).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertProgramTemplate = z.infer<typeof insertProgramTemplateSchema>;
export type ProgramTemplate = typeof programTemplates.$inferSelect;

export const templateExercises = pgTable("template_exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull(),
  exerciseId: varchar("exercise_id").notNull(),
  weekNumber: integer("week_number").notNull(),
  dayNumber: integer("day_number").notNull(),
  sets: integer("sets").notNull(),
  reps: integer("reps").notNull(),
  restSeconds: integer("rest_seconds"),
  notes: text("notes"),
  orderIndex: integer("order_index").notNull(),
});

export const insertTemplateExerciseSchema = createInsertSchema(templateExercises).omit({ id: true });
export type InsertTemplateExercise = z.infer<typeof insertTemplateExerciseSchema>;
export type TemplateExercise = typeof templateExercises.$inferSelect;

export const templateWeekMetadata = pgTable("template_week_metadata", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull(),
  weekNumber: integer("week_number").notNull(),
  phase: text("phase"),
  beltTarget: text("belt_target"),
  focus: text("focus"),
  runningQualities: text("running_qualities"),
  mbsPrimary: text("mbs_primary"),
  strengthTheme: text("strength_theme"),
  plyoContactsCap: integer("plyo_contacts_cap"),
  testingGateway: text("testing_gateway"),
  notes: text("notes"),
});

export const insertTemplateWeekMetadataSchema = createInsertSchema(templateWeekMetadata).omit({ id: true });
export type InsertTemplateWeekMetadata = z.infer<typeof insertTemplateWeekMetadataSchema>;
export type TemplateWeekMetadata = typeof templateWeekMetadata.$inferSelect;

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

export const programPhases = pgTable("program_phases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  programId: varchar("program_id").notNull().references(() => programs.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  startWeek: integer("start_week").notNull(),
  endWeek: integer("end_week").notNull(),
  phaseType: text("phase_type").notNull(),
  goals: text("goals"),
  orderIndex: integer("order_index").notNull(),
}, (table) => ({
  programIdIdx: index("program_phases_program_id_idx").on(table.programId),
}));

export const insertProgramPhaseSchema = createInsertSchema(programPhases).omit({ id: true });
export type InsertProgramPhase = z.infer<typeof insertProgramPhaseSchema>;
export type ProgramPhase = typeof programPhases.$inferSelect;

export const programWeeks = pgTable("program_weeks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  programId: varchar("program_id").notNull().references(() => programs.id, { onDelete: 'cascade' }),
  phaseId: varchar("phase_id").references(() => programPhases.id, { onDelete: 'set null' }),
  weekNumber: integer("week_number").notNull(),
  beltTarget: text("belt_target"),
  focus: text("focus").array(),
  volumeTarget: integer("volume_target"),
  intensityZone: text("intensity_zone"),
  notes: text("notes"),
  runningQualities: text("running_qualities"),
  mbsPrimary: text("mbs_primary"),
  strengthTheme: text("strength_theme"),
  plyoContactsCap: integer("plyo_contacts_cap"),
  testingGateway: text("testing_gateway"),
}, (table) => ({
  programWeekIdx: index("program_weeks_program_week_idx").on(table.programId, table.weekNumber),
}));

export const insertProgramWeekSchema = createInsertSchema(programWeeks).omit({ id: true });
export type InsertProgramWeek = z.infer<typeof insertProgramWeekSchema>;
export type ProgramWeek = typeof programWeeks.$inferSelect;

export const trainingBlocks = pgTable("training_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  programId: varchar("program_id").notNull().references(() => programs.id, { onDelete: 'cascade' }),
  programWeekId: varchar("program_week_id").references(() => programWeeks.id, { onDelete: 'cascade' }),
  weekNumber: integer("week_number").notNull(),
  dayNumber: integer("day_number").notNull(),
  title: text("title").notNull(),
  belt: text("belt").notNull(),
  focus: text("focus").array().notNull().default(sql`ARRAY[]::text[]`),
  notes: text("notes"),
  scheme: text("scheme"),
  orderIndex: integer("order_index").notNull(),
  aiGenerated: integer("ai_generated").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  programWeekDayIdx: index("training_blocks_program_week_day_idx").on(table.programId, table.weekNumber, table.dayNumber),
  orderIdx: index("training_blocks_order_idx").on(table.programId, table.weekNumber, table.dayNumber, table.orderIndex),
}));

export const insertTrainingBlockSchema = createInsertSchema(trainingBlocks).omit({ id: true, createdAt: true });
export type InsertTrainingBlock = z.infer<typeof insertTrainingBlockSchema>;
export type TrainingBlock = typeof trainingBlocks.$inferSelect;

export const blockExercises = pgTable("block_exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  blockId: varchar("block_id").notNull().references(() => trainingBlocks.id, { onDelete: 'cascade' }),
  exerciseId: varchar("exercise_id").notNull().references(() => exercises.id, { onDelete: 'cascade' }),
  scheme: text("scheme"),
  notes: text("notes"),
  orderIndex: integer("order_index").notNull(),
}, (table) => ({
  blockIdIdx: index("block_exercises_block_id_idx").on(table.blockId),
}));

export const insertBlockExerciseSchema = createInsertSchema(blockExercises).omit({ id: true });
export type InsertBlockExercise = z.infer<typeof insertBlockExerciseSchema>;
export type BlockExercise = typeof blockExercises.$inferSelect;

export const blockTemplates = pgTable("block_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  belt: text("belt").notNull(),
  focus: text("focus").array().notNull().default(sql`ARRAY[]::text[]`),
  scheme: text("scheme"),
  isPublic: integer("is_public").notNull().default(0),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBlockTemplateSchema = createInsertSchema(blockTemplates).omit({ id: true, createdAt: true });
export type InsertBlockTemplate = z.infer<typeof insertBlockTemplateSchema>;
export type BlockTemplate = typeof blockTemplates.$inferSelect;

export const templateBlockExercises = pgTable("template_block_exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => blockTemplates.id, { onDelete: 'cascade' }),
  exerciseId: varchar("exercise_id").notNull().references(() => exercises.id, { onDelete: 'cascade' }),
  scheme: text("scheme"),
  notes: text("notes"),
  orderIndex: integer("order_index").notNull(),
}, (table) => ({
  templateIdIdx: index("template_block_exercises_template_id_idx").on(table.templateId),
}));

export const insertTemplateBlockExerciseSchema = createInsertSchema(templateBlockExercises).omit({ id: true });
export type InsertTemplateBlockExercise = z.infer<typeof insertTemplateBlockExerciseSchema>;
export type TemplateBlockExercise = typeof templateBlockExercises.$inferSelect;

export const athletePrograms = pgTable("athlete_programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull(),
  programId: varchar("program_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
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

export const athleteStats = pgTable("athlete_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull().unique(),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastWorkoutDate: timestamp("last_workout_date"),
  totalWorkouts: integer("total_workouts").notNull().default(0),
  totalSetsCompleted: integer("total_sets_completed").notNull().default(0),
});

export const insertAthleteStatsSchema = createInsertSchema(athleteStats).omit({ id: true });
export type InsertAthleteStats = z.infer<typeof insertAthleteStatsSchema>;
export type AthleteStats = typeof athleteStats.$inferSelect;

export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  rarity: text("rarity").notNull(),
  iconUrl: text("icon_url"),
  xpReward: integer("xp_reward").notNull(),
  requirement: text("requirement").notNull(),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({ id: true });
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

export const athleteAchievements = pgTable("athlete_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull(),
  achievementId: varchar("achievement_id").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

export const insertAthleteAchievementSchema = createInsertSchema(athleteAchievements).omit({ 
  id: true,
  unlockedAt: true 
});
export type InsertAthleteAchievement = z.infer<typeof insertAthleteAchievementSchema>;
export type AthleteAchievement = typeof athleteAchievements.$inferSelect;

export const dailyChallenges = pgTable("daily_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  xpReward: integer("xp_reward").notNull(),
  targetValue: integer("target_value").notNull(),
  challengeType: text("challenge_type").notNull(),
});

export const insertDailyChallengeSchema = createInsertSchema(dailyChallenges).omit({ id: true });
export type InsertDailyChallenge = z.infer<typeof insertDailyChallengeSchema>;
export type DailyChallenge = typeof dailyChallenges.$inferSelect;

export const challengeCompletions = pgTable("challenge_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull(),
  challengeId: varchar("challenge_id").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
  progress: integer("progress").notNull(),
});

export const insertChallengeCompletionSchema = createInsertSchema(challengeCompletions).omit({
  id: true,
  completedAt: true
});
export type InsertChallengeCompletion = z.infer<typeof insertChallengeCompletionSchema>;
export type ChallengeCompletion = typeof challengeCompletions.$inferSelect;
