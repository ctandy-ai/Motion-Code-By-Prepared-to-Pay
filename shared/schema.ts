import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, real, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";
// Re-export AI chat models  
export * from "./models/chat";

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
  notes: text("notes"),
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
  coachId: varchar("coach_id").default('default-coach'),
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

export const templatePhases = pgTable("template_phases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => programTemplates.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  startWeek: integer("start_week").notNull(),
  endWeek: integer("end_week").notNull(),
  phaseType: text("phase_type").notNull(),
  goals: text("goals"),
  orderIndex: integer("order_index").notNull(),
}, (table) => ({
  templateIdIdx: index("template_phases_template_id_idx").on(table.templateId),
}));

export const insertTemplatePhaseSchema = createInsertSchema(templatePhases).omit({ id: true });
export type InsertTemplatePhase = z.infer<typeof insertTemplatePhaseSchema>;
export type TemplatePhase = typeof templatePhases.$inferSelect;

export const templateWeeks = pgTable("template_weeks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => programTemplates.id, { onDelete: 'cascade' }),
  phaseId: varchar("phase_id").references(() => templatePhases.id, { onDelete: 'set null' }),
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
  templateWeekIdx: index("template_weeks_template_week_idx").on(table.templateId, table.weekNumber),
}));

export const insertTemplateWeekSchema = createInsertSchema(templateWeeks).omit({ id: true });
export type InsertTemplateWeek = z.infer<typeof insertTemplateWeekSchema>;
export type TemplateWeek = typeof templateWeeks.$inferSelect;

export const templateTrainingBlocks = pgTable("template_training_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => programTemplates.id, { onDelete: 'cascade' }),
  templateWeekId: varchar("template_week_id").references(() => templateWeeks.id, { onDelete: 'cascade' }),
  weekNumber: integer("week_number").notNull(),
  dayNumber: integer("day_number").notNull(),
  title: text("title").notNull(),
  belt: text("belt").notNull(),
  focus: text("focus").array().notNull().default(sql`ARRAY[]::text[]`),
  notes: text("notes"),
  scheme: text("scheme"),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  templateWeekDayIdx: index("template_training_blocks_week_day_idx").on(table.templateId, table.weekNumber, table.dayNumber),
  orderIdx: index("template_training_blocks_order_idx").on(table.templateId, table.weekNumber, table.dayNumber, table.orderIndex),
}));

export const insertTemplateTrainingBlockSchema = createInsertSchema(templateTrainingBlocks).omit({ id: true, createdAt: true });
export type InsertTemplateTrainingBlock = z.infer<typeof insertTemplateTrainingBlockSchema>;
export type TemplateTrainingBlock = typeof templateTrainingBlocks.$inferSelect;

export const templateTrainingBlockExercises = pgTable("template_training_block_exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  blockId: varchar("block_id").notNull().references(() => templateTrainingBlocks.id, { onDelete: 'cascade' }),
  exerciseId: varchar("exercise_id").notNull().references(() => exercises.id, { onDelete: 'cascade' }),
  scheme: text("scheme"),
  notes: text("notes"),
  orderIndex: integer("order_index").notNull(),
}, (table) => ({
  blockIdIdx: index("template_training_block_exercises_block_id_idx").on(table.blockId),
}));

export const insertTemplateTrainingBlockExerciseSchema = createInsertSchema(templateTrainingBlockExercises).omit({ id: true });
export type InsertTemplateTrainingBlockExercise = z.infer<typeof insertTemplateTrainingBlockExerciseSchema>;
export type TemplateTrainingBlockExercise = typeof templateTrainingBlockExercises.$inferSelect;

export const programExercises = pgTable("program_exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  programId: varchar("program_id").notNull(),
  exerciseId: varchar("exercise_id").notNull(),
  weekNumber: integer("week_number").notNull(),
  dayNumber: integer("day_number").notNull(),
  sets: integer("sets").notNull(),
  reps: integer("reps").notNull(),
  restSeconds: integer("rest_seconds"),
  targetWeight: varchar("target_weight"),
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
  waveWeek: integer("wave_week").default(1),
  stageOverlay: text("stage_overlay"),
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
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: text("username"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
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

export const readinessSurveys = pgTable("readiness_surveys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull(),
  surveyDate: timestamp("survey_date").defaultNow(),
  sleepQuality: integer("sleep_quality").notNull(),
  sleepHours: real("sleep_hours").notNull(),
  muscleSoreness: integer("muscle_soreness").notNull(),
  energyLevel: integer("energy_level").notNull(),
  stressLevel: integer("stress_level").notNull(),
  mood: integer("mood").notNull(),
  overallReadiness: integer("overall_readiness").notNull(),
  notes: text("notes"),
}, (table) => ({
  athleteDateIdx: index("readiness_surveys_athlete_date_idx").on(table.athleteId, table.surveyDate),
}));

export const insertReadinessSurveySchema = createInsertSchema(readinessSurveys).omit({
  id: true,
  surveyDate: true
});
export type InsertReadinessSurvey = z.infer<typeof insertReadinessSurveySchema>;
export type ReadinessSurvey = typeof readinessSurveys.$inferSelect;

export const coachHeuristics = pgTable("coach_heuristics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coachId: varchar("coach_id").default('default-coach'),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: text("trigger_type").notNull(),
  triggerCondition: text("trigger_condition").notNull(),
  actionType: text("action_type").notNull(),
  actionDetails: text("action_details").notNull(),
  isActive: integer("is_active").notNull().default(1),
  priority: integer("priority").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCoachHeuristicSchema = createInsertSchema(coachHeuristics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCoachHeuristic = z.infer<typeof insertCoachHeuristicSchema>;
export type CoachHeuristic = typeof coachHeuristics.$inferSelect;

export const pendingAiActions = pgTable("pending_ai_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actionType: varchar("action_type").notNull(),
  description: text("description").notNull(),
  details: text("details").notNull(),
  athleteId: varchar("athlete_id"),
  programId: varchar("program_id"),
  status: varchar("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPendingAiActionSchema = createInsertSchema(pendingAiActions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPendingAiAction = z.infer<typeof insertPendingAiActionSchema>;
export type PendingAiAction = typeof pendingAiActions.$inferSelect;

export const valdProfiles = pgTable("vald_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").references(() => athletes.id, { onDelete: 'cascade' }),
  valdProfileId: varchar("vald_profile_id").notNull().unique(),
  valdTenantId: varchar("vald_tenant_id").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  dateOfBirth: timestamp("date_of_birth"),
  syncedAt: timestamp("synced_at").defaultNow(),
}, (table) => ({
  athleteIdIdx: index("vald_profiles_athlete_id_idx").on(table.athleteId),
  valdProfileIdIdx: index("vald_profiles_vald_profile_id_idx").on(table.valdProfileId),
}));

export const insertValdProfileSchema = createInsertSchema(valdProfiles).omit({
  id: true,
  syncedAt: true,
});
export type InsertValdProfile = z.infer<typeof insertValdProfileSchema>;
export type ValdProfile = typeof valdProfiles.$inferSelect;

export const valdTests = pgTable("vald_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  valdProfileId: varchar("vald_profile_id").notNull().references(() => valdProfiles.id, { onDelete: 'cascade' }),
  athleteId: varchar("athlete_id").references(() => athletes.id, { onDelete: 'cascade' }),
  valdTestId: varchar("vald_test_id").notNull().unique(),
  testType: text("test_type").notNull(),
  deviceType: text("device_type").notNull(),
  testName: text("test_name"),
  recordedAt: timestamp("recorded_at").notNull(),
  syncedAt: timestamp("synced_at").defaultNow(),
  metadata: text("metadata"),
}, (table) => ({
  athleteIdIdx: index("vald_tests_athlete_id_idx").on(table.athleteId),
  testTypeIdx: index("vald_tests_test_type_idx").on(table.testType),
  recordedAtIdx: index("vald_tests_recorded_at_idx").on(table.recordedAt),
}));

export const insertValdTestSchema = createInsertSchema(valdTests).omit({
  id: true,
  syncedAt: true,
});
export type InsertValdTest = z.infer<typeof insertValdTestSchema>;
export type ValdTest = typeof valdTests.$inferSelect;

export const valdTrialResults = pgTable("vald_trial_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  valdTestId: varchar("vald_test_id").notNull().references(() => valdTests.id, { onDelete: 'cascade' }),
  trialNumber: integer("trial_number").notNull(),
  limb: text("limb"),
  metricName: text("metric_name").notNull(),
  metricValue: real("metric_value").notNull(),
  metricUnit: text("metric_unit"),
  startTime: real("start_time"),
  endTime: real("end_time"),
}, (table) => ({
  valdTestIdIdx: index("vald_trial_results_test_id_idx").on(table.valdTestId),
  metricNameIdx: index("vald_trial_results_metric_name_idx").on(table.metricName),
}));

export const insertValdTrialResultSchema = createInsertSchema(valdTrialResults).omit({
  id: true,
});
export type InsertValdTrialResult = z.infer<typeof insertValdTrialResultSchema>;
export type ValdTrialResult = typeof valdTrialResults.$inferSelect;

export const valdSyncLog = pgTable("vald_sync_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  syncType: text("sync_type").notNull(),
  status: text("status").notNull(),
  recordsProcessed: integer("records_processed").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertValdSyncLogSchema = createInsertSchema(valdSyncLog).omit({
  id: true,
  startedAt: true,
});
export type InsertValdSyncLog = z.infer<typeof insertValdSyncLogSchema>;
export type ValdSyncLog = typeof valdSyncLog.$inferSelect;

// VALD API Request Validation Schemas
export const valdDeviceTypes = ['forcedecks', 'nordbord', 'dynamo', 'smartspeed', 'airband', 'humantrak'] as const;
export type ValdDeviceType = typeof valdDeviceTypes[number];

export const valdSyncTestsRequestSchema = z.object({
  deviceType: z.enum(valdDeviceTypes).default('forcedecks'),
  modifiedFromUtc: z.string().datetime().optional(),
});
export type ValdSyncTestsRequest = z.infer<typeof valdSyncTestsRequestSchema>;

export const valdLinkProfileRequestSchema = z.object({
  athleteId: z.string().min(1, 'athleteId is required'),
});
export type ValdLinkProfileRequest = z.infer<typeof valdLinkProfileRequestSchema>;

// Belt Classification System
export const beltTypes = ['WHITE', 'BLUE', 'BLACK'] as const;
export type Belt = typeof beltTypes[number];

export const phaseTypes = [
  'TRANSITION', 'PRESEASON_A', 'XMAS_BLOCK', 'PRESEASON_B', 
  'PRECOMP', 'INSEASON_EARLY', 'INSEASON_MID', 'INSEASON_LATE', 'BYE_WEEK'
] as const;
export type Phase = typeof phaseTypes[number];

export const waveWeekTypes = [1, 2, 3] as const;
export type WaveWeek = 1 | 2 | 3;

// Athlete Training Profile - extends athlete with periodization-specific data
export const athleteTrainingProfiles = pgTable("athlete_training_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull().unique(),
  dateOfBirth: timestamp("date_of_birth"),
  trainingAgeYears: real("training_age_years").default(0),
  
  // Injury flags - Soft tissue
  recurrentHamstring: integer("recurrent_hamstring").default(0),
  recurrentCalf: integer("recurrent_calf").default(0),
  recurrentGroin: integer("recurrent_groin").default(0),
  recentRTP: integer("recent_rtp").default(0),
  
  // Injury flags - Joint/Ligament
  aclHistory: integer("acl_history").default(0),
  ankleInjury: integer("ankle_injury").default(0),
  kneeIssues: integer("knee_issues").default(0),
  shoulderInjury: integer("shoulder_injury").default(0),
  lowerBackIssues: integer("lower_back_issues").default(0),
  
  // Concussion protocol
  concussionProtocol: integer("concussion_protocol").default(0),
  
  // Recent exposure tracking (updated periodically)
  sprintExposuresLast14d: integer("sprint_exposures_last_14d").default(0),
  highDecelSessionsLast14d: integer("high_decel_sessions_last_14d").default(0),
  strengthSessionsLast7d: integer("strength_sessions_last_7d").default(0),
  
  // Movement quality score (1-5 coach/physio rating)
  movementQualityScore: integer("movement_quality_score").default(3),
  
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAthleteTrainingProfileSchema = createInsertSchema(athleteTrainingProfiles).omit({
  id: true,
  updatedAt: true,
});
export type InsertAthleteTrainingProfile = z.infer<typeof insertAthleteTrainingProfileSchema>;
export type AthleteTrainingProfile = typeof athleteTrainingProfiles.$inferSelect;

// Belt Classification Snapshots - stores computed belt assignments
export const athleteBeltClassifications = pgTable("athlete_belt_classifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull(),
  belt: text("belt").notNull(),
  score: integer("score").notNull(),
  confidence: integer("confidence").notNull(),
  reasons: text("reasons").array().notNull().default(sql`ARRAY[]::text[]`),
  
  // Modifiers
  needsCapacityWork: integer("needs_capacity_work").default(0),
  capReactiveContacts: integer("cap_reactive_contacts").default(0),
  capStrengthVolume: integer("cap_strength_volume").default(0),
  needsTopUps: integer("needs_top_ups").default(0),
  
  // Staff override
  isOverridden: integer("is_overridden").default(0),
  overriddenBy: varchar("overridden_by"),
  overrideReason: text("override_reason"),
  
  computedAt: timestamp("computed_at").defaultNow(),
}, (table) => ({
  athleteIdIdx: index("belt_classifications_athlete_id_idx").on(table.athleteId),
  computedAtIdx: index("belt_classifications_computed_at_idx").on(table.computedAt),
}));

export const insertAthleteBeltClassificationSchema = createInsertSchema(athleteBeltClassifications).omit({
  id: true,
  computedAt: true,
});
export type InsertAthleteBeltClassification = z.infer<typeof insertAthleteBeltClassificationSchema>;
export type AthleteBeltClassification = typeof athleteBeltClassifications.$inferSelect;

// Dose Budgets - lookup table for weekly volume caps
export const doseBudgets = pgTable("dose_budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  belt: text("belt").notNull(),
  phase: text("phase").notNull(),
  waveWeek: integer("wave_week").notNull(),
  
  plyoContactsWeek: integer("plyo_contacts_week").notNull(),
  hardLowerSetsWeek: integer("hard_lower_sets_week").notNull(),
  speedExposureTouchesWeek: integer("speed_exposure_touches_week").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueBeltPhaseWeek: unique().on(table.belt, table.phase, table.waveWeek),
}));

export const insertDoseBudgetSchema = createInsertSchema(doseBudgets).omit({
  id: true,
  createdAt: true,
});
export type InsertDoseBudget = z.infer<typeof insertDoseBudgetSchema>;
export type DoseBudget = typeof doseBudgets.$inferSelect;

// Stage Overlays - RTP/ACL stage constraints
export const stageOverlays = pgTable("stage_overlays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  
  allowedPlyoBands: text("allowed_plyo_bands").array().default(sql`ARRAY[]::text[]`),
  maxPlyoContactsWeek: integer("max_plyo_contacts_week"),
  maxSpeedExposures: integer("max_speed_exposures"),
  allowBilateralOnly: integer("allow_bilateral_only").default(0),
  requiresGateCheck: integer("requires_gate_check").default(0),
  gateCheckCriteria: text("gate_check_criteria"),
  
  stopRules: text("stop_rules").array().default(sql`ARRAY[]::text[]`),
  requiredExerciseTypes: text("required_exercise_types").array().default(sql`ARRAY[]::text[]`),
  forbiddenExerciseTypes: text("forbidden_exercise_types").array().default(sql`ARRAY[]::text[]`),
  
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStageOverlaySchema = createInsertSchema(stageOverlays).omit({
  id: true,
  createdAt: true,
});
export type InsertStageOverlay = z.infer<typeof insertStageOverlaySchema>;
export type StageOverlay = typeof stageOverlays.$inferSelect;

// Belt classification request/response schemas
export const computeBeltRequestSchema = z.object({
  athleteId: z.string().min(1),
});
export type ComputeBeltRequest = z.infer<typeof computeBeltRequestSchema>;

export const overrideBeltRequestSchema = z.object({
  belt: z.enum(beltTypes),
  reason: z.string().min(1),
  overriddenBy: z.string().optional(),
});
export type OverrideBeltRequest = z.infer<typeof overrideBeltRequestSchema>;

// ============================================
// MOBILE ATHLETE PORTAL - New Schema Tables
// ============================================

// User Roles - links auth users to their role (coach or athlete)
export const userRoles = pgTable("user_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  role: text("role").notNull().default("athlete"),
  athleteId: varchar("athlete_id"),
  coachId: varchar("coach_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("user_roles_user_id_idx").on(table.userId),
}));

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  id: true,
  createdAt: true,
});
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type UserRole = typeof userRoles.$inferSelect;

// Session RPE - athlete logs how hard their workout felt
export const sessionRpe = pgTable("session_rpe", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull(),
  workoutLogId: varchar("workout_log_id"),
  rpeScore: integer("rpe_score").notNull(),
  duration: integer("duration_minutes"),
  notes: text("notes"),
  loggedAt: timestamp("logged_at").defaultNow(),
}, (table) => ({
  athleteIdIdx: index("session_rpe_athlete_id_idx").on(table.athleteId),
  loggedAtIdx: index("session_rpe_logged_at_idx").on(table.loggedAt),
}));

export const insertSessionRpeSchema = createInsertSchema(sessionRpe).omit({
  id: true,
  loggedAt: true,
});
export type InsertSessionRpe = z.infer<typeof insertSessionRpeSchema>;
export type SessionRpe = typeof sessionRpe.$inferSelect;

// Messages - athlete-coach communication
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull(),
  senderType: text("sender_type").notNull(),
  recipientId: varchar("recipient_id").notNull(),
  recipientType: text("recipient_type").notNull(),
  athleteId: varchar("athlete_id").notNull(),
  content: text("content").notNull(),
  isRead: integer("is_read").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  athleteIdIdx: index("messages_athlete_id_idx").on(table.athleteId),
  senderIdIdx: index("messages_sender_id_idx").on(table.senderId),
  recipientIdIdx: index("messages_recipient_id_idx").on(table.recipientId),
  createdAtIdx: index("messages_created_at_idx").on(table.createdAt),
}));

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true,
});
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Notifications - push notifications for athletes
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  athleteId: varchar("athlete_id"),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  data: text("data"),
  isRead: integer("is_read").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("notifications_user_id_idx").on(table.userId),
  athleteIdIdx: index("notifications_athlete_id_idx").on(table.athleteId),
  createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
}));

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true,
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Scheduled Workouts - today's workout for athlete
export const scheduledWorkouts = pgTable("scheduled_workouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull(),
  athleteProgramId: varchar("athlete_program_id").notNull(),
  blockId: varchar("block_id"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  weekNumber: integer("week_number").notNull(),
  dayNumber: integer("day_number").notNull(),
  status: text("status").default("pending"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  athleteIdIdx: index("scheduled_workouts_athlete_id_idx").on(table.athleteId),
  scheduledDateIdx: index("scheduled_workouts_scheduled_date_idx").on(table.scheduledDate),
  statusIdx: index("scheduled_workouts_status_idx").on(table.status),
}));

export const insertScheduledWorkoutSchema = createInsertSchema(scheduledWorkouts).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});
export type InsertScheduledWorkout = z.infer<typeof insertScheduledWorkoutSchema>;
export type ScheduledWorkout = typeof scheduledWorkouts.$inferSelect;

// Audit Logs - Enterprise compliance tracking
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  userEmail: varchar("user_email"),
  userRole: varchar("user_role"),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: varchar("resource_id"),
  resourceName: text("resource_name"),
  details: text("details"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  success: integer("success").default(1),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
  actionIdx: index("audit_logs_action_idx").on(table.action),
  resourceTypeIdx: index("audit_logs_resource_type_idx").on(table.resourceType),
  createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
}));

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Athlete Targets - 1RM goals and performance targets
export const athleteTargets = pgTable("athlete_targets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull(),
  exerciseId: varchar("exercise_id").notNull(),
  targetType: text("target_type").notNull(), // '1rm', 'volume', 'reps'
  targetValue: real("target_value").notNull(),
  currentValue: real("current_value"),
  unit: text("unit").notNull().default('kg'), // 'kg', 'lbs', 'reps'
  deadline: timestamp("deadline"),
  notes: text("notes"),
  status: text("status").notNull().default('active'), // 'active', 'achieved', 'archived'
  achievedAt: timestamp("achieved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  athleteIdx: index("athlete_targets_athlete_idx").on(table.athleteId),
  exerciseIdx: index("athlete_targets_exercise_idx").on(table.exerciseId),
}));

export const insertAthleteTargetSchema = createInsertSchema(athleteTargets).omit({
  id: true,
  achievedAt: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAthleteTarget = z.infer<typeof insertAthleteTargetSchema>;
export type AthleteTarget = typeof athleteTargets.$inferSelect;

// Team Announcements / Noticeboard
export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coachId: varchar("coach_id").notNull().default('default-coach'),
  title: text("title").notNull(),
  content: text("content").notNull(),
  priority: text("priority").notNull().default('normal'), // 'low', 'normal', 'high', 'urgent'
  targetTeams: text("target_teams").array().default(sql`ARRAY[]::text[]`), // empty = all teams
  isPinned: integer("is_pinned").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  coachIdx: index("announcements_coach_idx").on(table.coachId),
  priorityIdx: index("announcements_priority_idx").on(table.priority),
  createdAtIdx: index("announcements_created_at_idx").on(table.createdAt),
}));

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;

// Body Composition Tracking
export const bodyCompositionLogs = pgTable("body_composition_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id").notNull(),
  weight: real("weight"), // in kg
  bodyFat: real("body_fat"), // percentage
  muscleMass: real("muscle_mass"), // in kg
  bmi: real("bmi"),
  waist: real("waist"), // in cm
  chest: real("chest"), // in cm
  hips: real("hips"), // in cm
  arms: real("arms"), // in cm
  thighs: real("thighs"), // in cm
  notes: text("notes"),
  loggedAt: timestamp("logged_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  athleteIdx: index("body_composition_athlete_idx").on(table.athleteId),
  loggedAtIdx: index("body_composition_logged_at_idx").on(table.loggedAt),
}));

export const insertBodyCompositionLogSchema = createInsertSchema(bodyCompositionLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertBodyCompositionLog = z.infer<typeof insertBodyCompositionLogSchema>;
export type BodyCompositionLog = typeof bodyCompositionLogs.$inferSelect;

// Custom Survey Builder
export const customSurveys = pgTable("custom_surveys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coachId: varchar("coach_id").notNull().default('default-coach'),
  name: text("name").notNull(),
  description: text("description"),
  questions: text("questions").notNull(), // JSON array of questions
  isActive: integer("is_active").notNull().default(1),
  frequency: text("frequency").notNull().default('daily'), // 'daily', 'weekly', 'pre_workout', 'post_workout'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  coachIdx: index("custom_surveys_coach_idx").on(table.coachId),
  activeIdx: index("custom_surveys_active_idx").on(table.isActive),
}));

export const insertCustomSurveySchema = createInsertSchema(customSurveys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCustomSurvey = z.infer<typeof insertCustomSurveySchema>;
export type CustomSurvey = typeof customSurveys.$inferSelect;

// Survey question types for the builder
export type SurveyQuestion = {
  id: string;
  type: 'scale' | 'text' | 'multiChoice' | 'yesNo';
  label: string;
  required: boolean;
  options?: string[]; // for multiChoice
  min?: number; // for scale
  max?: number; // for scale
};

// Team Training Sessions (Group Workouts)
export const teamSessions = pgTable("team_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coachId: varchar("coach_id").notNull().default('default-coach'),
  name: text("name").notNull(),
  description: text("description"),
  programId: varchar("program_id"), // optional program reference
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull().default(60), // in minutes
  location: text("location"),
  maxAthletes: integer("max_athletes"),
  status: text("status").notNull().default('scheduled'), // 'scheduled', 'in_progress', 'completed', 'cancelled'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  coachIdx: index("team_sessions_coach_idx").on(table.coachId),
  scheduledAtIdx: index("team_sessions_scheduled_at_idx").on(table.scheduledAt),
  statusIdx: index("team_sessions_status_idx").on(table.status),
}));

export const insertTeamSessionSchema = createInsertSchema(teamSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTeamSession = z.infer<typeof insertTeamSessionSchema>;
export type TeamSession = typeof teamSessions.$inferSelect;

// Athlete participation in team sessions
export const sessionParticipants = pgTable("session_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  athleteId: varchar("athlete_id").notNull(),
  status: text("status").notNull().default('registered'), // 'registered', 'attended', 'missed', 'cancelled'
  checkedInAt: timestamp("checked_in_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  sessionIdx: index("session_participants_session_idx").on(table.sessionId),
  athleteIdx: index("session_participants_athlete_idx").on(table.athleteId),
  uniqueParticipant: unique().on(table.sessionId, table.athleteId),
}));

export const insertSessionParticipantSchema = createInsertSchema(sessionParticipants).omit({
  id: true,
  checkedInAt: true,
  createdAt: true,
});
export type InsertSessionParticipant = z.infer<typeof insertSessionParticipantSchema>;
export type SessionParticipant = typeof sessionParticipants.$inferSelect;
