import {
  type User,
  type InsertUser,
  type Exercise,
  type InsertExercise,
  type Athlete,
  type InsertAthlete,
  type Team,
  type InsertTeam,
  type Program,
  type InsertProgram,
  type ProgramExercise,
  type InsertProgramExercise,
  type ProgramTemplate,
  type InsertProgramTemplate,
  type TemplateExercise,
  type InsertTemplateExercise,
  type TemplateWeekMetadata,
  type InsertTemplateWeekMetadata,
  type TemplatePhase,
  type InsertTemplatePhase,
  type TemplateWeek,
  type InsertTemplateWeek,
  type TemplateTrainingBlock,
  type InsertTemplateTrainingBlock,
  type TemplateTrainingBlockExercise,
  type InsertTemplateTrainingBlockExercise,
  type ProgramPhase,
  type InsertProgramPhase,
  type ProgramWeek,
  type InsertProgramWeek,
  type TrainingBlock,
  type InsertTrainingBlock,
  type BlockExercise,
  type InsertBlockExercise,
  type BlockTemplate,
  type InsertBlockTemplate,
  type TemplateBlockExercise,
  type InsertTemplateBlockExercise,
  type AthleteProgram,
  type InsertAthleteProgram,
  type WorkoutLog,
  type InsertWorkoutLog,
  type PersonalRecord,
  type InsertPersonalRecord,
  type ReadinessSurvey,
  type InsertReadinessSurvey,
  type CoachHeuristic,
  type InsertCoachHeuristic,
  type PendingAiAction,
  type InsertPendingAiAction,
  type ValdProfile,
  type InsertValdProfile,
  type ValdTest,
  type InsertValdTest,
  type ValdTrialResult,
  type InsertValdTrialResult,
  type ValdSyncLog,
  type InsertValdSyncLog,
  type AthleteTrainingProfile,
  type InsertAthleteTrainingProfile,
  type AthleteBeltClassification,
  type InsertAthleteBeltClassification,
  type DoseBudget,
  type InsertDoseBudget,
  type StageOverlay,
  type InsertStageOverlay,
  type Message,
  type InsertMessage,
  type Notification,
  type InsertNotification,
  type AuditLog,
  type InsertAuditLog,
  users,
  exercises,
  athletes,
  teams,
  athleteTeams,
  programs,
  programExercises,
  programTemplates,
  templateExercises,
  templateWeekMetadata,
  templatePhases,
  templateWeeks,
  templateTrainingBlocks,
  templateTrainingBlockExercises,
  programPhases,
  programWeeks,
  trainingBlocks,
  blockExercises,
  blockTemplates,
  templateBlockExercises,
  athletePrograms,
  workoutLogs,
  personalRecords,
  readinessSurveys,
  coachHeuristics,
  pendingAiActions,
  valdProfiles,
  valdTests,
  valdTrialResults,
  valdSyncLog,
  athleteTrainingProfiles,
  athleteBeltClassifications,
  doseBudgets,
  stageOverlays,
  messages,
  notifications,
  auditLogs,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lt } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getExercises(): Promise<Exercise[]>;
  getExercise(id: string): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  updateExercise(id: string, exercise: Partial<InsertExercise>): Promise<Exercise | undefined>;
  deleteExercise(id: string): Promise<boolean>;

  getAthletes(): Promise<Athlete[]>;
  getAthlete(id: string): Promise<Athlete | undefined>;
  createAthlete(athlete: InsertAthlete): Promise<Athlete>;
  updateAthlete(id: string, athlete: Partial<InsertAthlete>): Promise<Athlete | undefined>;
  deleteAthlete(id: string): Promise<boolean>;
  bulkCreateAthletes(athletes: InsertAthlete[]): Promise<Athlete[]>;

  getTeams(): Promise<Team[]>;
  getTeam(id: string): Promise<Team | undefined>;
  getTeamByName(name: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  getOrCreateTeam(name: string): Promise<Team>;
  
  getAthleteTeams(athleteId: string): Promise<Team[]>;
  addAthleteToTeam(athleteId: string, teamId: string): Promise<void>;
  removeAthleteFromTeam(athleteId: string, teamId: string): Promise<void>;

  getPrograms(): Promise<Program[]>;
  getProgram(id: string): Promise<Program | undefined>;
  createProgram(program: InsertProgram): Promise<Program>;
  updateProgram(id: string, program: Partial<InsertProgram>): Promise<Program | undefined>;
  deleteProgram(id: string): Promise<boolean>;

  getProgramExercises(programId?: string): Promise<ProgramExercise[]>;
  createProgramExercise(programExercise: InsertProgramExercise): Promise<ProgramExercise>;
  deleteProgramExercise(id: string): Promise<boolean>;

  getProgramTemplates(): Promise<ProgramTemplate[]>;
  getProgramTemplate(id: string): Promise<ProgramTemplate | undefined>;
  createProgramTemplate(template: InsertProgramTemplate): Promise<ProgramTemplate>;
  deleteProgramTemplate(id: string): Promise<boolean>;

  getTemplateExercises(templateId: string): Promise<TemplateExercise[]>;
  createTemplateExercise(templateExercise: InsertTemplateExercise): Promise<TemplateExercise>;
  deleteTemplateExercise(id: string): Promise<boolean>;

  getTemplateWeekMetadata(templateId: string): Promise<TemplateWeekMetadata[]>;
  createTemplateWeekMetadata(metadata: InsertTemplateWeekMetadata): Promise<TemplateWeekMetadata>;
  bulkCreateTemplateWeekMetadata(metadataList: InsertTemplateWeekMetadata[]): Promise<TemplateWeekMetadata[]>;

  instantiateProgramFromTemplate(templateId: string, programName: string): Promise<Program>;

  getAthletePrograms(athleteId: string): Promise<AthleteProgram[]>;
  createAthleteProgram(athleteProgram: InsertAthleteProgram): Promise<AthleteProgram>;
  updateAthleteProgram(id: string, status: string): Promise<AthleteProgram | undefined>;

  getWorkoutLogs(athleteId?: string): Promise<WorkoutLog[]>;
  createWorkoutLog(workoutLog: InsertWorkoutLog): Promise<WorkoutLog>;

  getPersonalRecords(athleteId?: string): Promise<PersonalRecord[]>;
  createPersonalRecord(record: InsertPersonalRecord): Promise<PersonalRecord>;

  getProgramPhases(programId: string): Promise<ProgramPhase[]>;
  createProgramPhase(phase: InsertProgramPhase): Promise<ProgramPhase>;
  updateProgramPhase(id: string, phase: Partial<InsertProgramPhase>): Promise<ProgramPhase | undefined>;
  deleteProgramPhase(id: string): Promise<boolean>;

  getProgramWeeks(programId: string): Promise<ProgramWeek[]>;
  getProgramWeek(id: string): Promise<ProgramWeek | undefined>;
  createProgramWeek(week: InsertProgramWeek): Promise<ProgramWeek>;
  updateProgramWeek(id: string, week: Partial<InsertProgramWeek>): Promise<ProgramWeek | undefined>;

  getTrainingBlocks(programId: string, weekNumber?: number, dayNumber?: number): Promise<TrainingBlock[]>;
  getTrainingBlock(id: string): Promise<TrainingBlock | undefined>;
  createTrainingBlock(block: InsertTrainingBlock): Promise<TrainingBlock>;
  updateTrainingBlock(id: string, block: Partial<InsertTrainingBlock>): Promise<TrainingBlock | undefined>;
  deleteTrainingBlock(id: string): Promise<boolean>;
  bulkInsertTrainingBlocks(blocks: InsertTrainingBlock[]): Promise<TrainingBlock[]>;
  
  getBlockExercises(blockId: string): Promise<BlockExercise[]>;
  createBlockExercise(exercise: InsertBlockExercise): Promise<BlockExercise>;
  deleteBlockExercise(id: string): Promise<boolean>;
  bulkInsertBlockExercises(exercises: InsertBlockExercise[]): Promise<BlockExercise[]>;

  getBlockTemplates(): Promise<BlockTemplate[]>;
  getBlockTemplate(id: string): Promise<BlockTemplate | undefined>;
  createBlockTemplate(template: InsertBlockTemplate): Promise<BlockTemplate>;
  deleteBlockTemplate(id: string): Promise<boolean>;

  getTemplateBlockExercises(templateId: string): Promise<TemplateBlockExercise[]>;
  createTemplateBlockExercise(exercise: InsertTemplateBlockExercise): Promise<TemplateBlockExercise>;

  getWeekWithBlocks(programId: string, weekNumber: number): Promise<{ week: ProgramWeek | undefined, blocks: (TrainingBlock & { exercises: BlockExercise[] })[] }>;
  getProgramStructure(programId: string): Promise<{ phases: ProgramPhase[], weeks: ProgramWeek[], blocks: (TrainingBlock & { exercises: BlockExercise[] })[] }>;
  createPhaseWithWeeks(phase: InsertProgramPhase, weekNumbers: number[]): Promise<ProgramPhase>;
  instantiateBlockFromTemplate(templateId: string, programId: string, weekNumber: number, dayNumber: number, orderIndex: number): Promise<TrainingBlock>;
  duplicateWeekBlocks(programId: string, sourceWeek: number, targetWeek: number): Promise<TrainingBlock[]>;
  moveBlock(blockId: string, newWeekNumber: number, newDayNumber: number, newOrderIndex: number): Promise<TrainingBlock | undefined>;
  reorderBlocks(programId: string, weekNumber: number, dayNumber: number, blockIds: string[]): Promise<void>;
  importProgramFromCSV(programId: string, csvData: any, coachId: string): Promise<{ phases: ProgramPhase[], weeks: ProgramWeek[] }>;
  duplicatePhase(phaseId: string, coachId: string, targetProgramId?: string): Promise<ProgramPhase>;
  duplicateWeeks(programId: string, startWeek: number, endWeek: number, insertAtWeek: number, shiftSubsequent: boolean, coachId: string): Promise<ProgramWeek[]>;
  assertProgramOwner(programId: string, coachId: string): Promise<void>;
  assertPhaseOwner(phaseId: string, coachId: string): Promise<void>;
  
  createTemplate(template: InsertProgramTemplate): Promise<ProgramTemplate>;
  listTemplates(): Promise<ProgramTemplate[]>;
  getTemplateWithStructure(templateId: string): Promise<{
    template: ProgramTemplate;
    phases: TemplatePhase[];
    weeks: TemplateWeek[];
    blocks: (TemplateTrainingBlock & { exercises: TemplateTrainingBlockExercise[] })[];
  }>;
  copyTemplateToProgram(templateId: string, coachId: string, programName?: string): Promise<Program>;
  copyTemplatePhasesToProgram(templateId: string, phaseIds: string[], targetProgramId: string, coachId: string): Promise<ProgramPhase[]>;
  copyTemplateWeeksToProgram(templateId: string, startWeek: number, endWeek: number, targetProgramId: string, insertAtWeek: number, coachId: string): Promise<ProgramWeek[]>;

  getAllReadinessSurveys(): Promise<ReadinessSurvey[]>;
  getReadinessSurveys(athleteId: string): Promise<ReadinessSurvey[]>;
  getReadinessSurvey(id: string): Promise<ReadinessSurvey | undefined>;
  getTodaysSurvey(athleteId: string): Promise<ReadinessSurvey | undefined>;
  createReadinessSurvey(survey: InsertReadinessSurvey): Promise<ReadinessSurvey>;

  getMessages(athleteId: string): Promise<Message[]>;
  getAllMessages(): Promise<Message[]>;
  getRecentMessages(limit?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(athleteId: string, userId: string): Promise<void>;

  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;

  getStageOverlays(): Promise<StageOverlay[]>;
  getStageOverlay(name: string): Promise<StageOverlay | undefined>;
  
  getAthleteTrainingProfile(athleteId: string): Promise<AthleteTrainingProfile | undefined>;
  upsertAthleteTrainingProfile(profile: InsertAthleteTrainingProfile): Promise<AthleteTrainingProfile>;

  getAuditLogs(params: {
    limit?: number;
    offset?: number;
    action?: string;
    resourceType?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditLog[]>;
  getAuditLogSummary(days: number): Promise<{
    totalActions: number;
    byAction: Record<string, number>;
    byResourceType: Record<string, number>;
    recentActivity: AuditLog[];
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getExercises(): Promise<Exercise[]> {
    return await db.select().from(exercises);
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    const [exercise] = await db.select().from(exercises).where(eq(exercises.id, id));
    return exercise || undefined;
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const [newExercise] = await db.insert(exercises).values(exercise).returning();
    return newExercise;
  }

  async updateExercise(id: string, exercise: Partial<InsertExercise>): Promise<Exercise | undefined> {
    const [updated] = await db
      .update(exercises)
      .set(exercise)
      .where(eq(exercises.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteExercise(id: string): Promise<boolean> {
    const result = await db.delete(exercises).where(eq(exercises.id, id)).returning();
    return result.length > 0;
  }

  async getAthletes(): Promise<Athlete[]> {
    return await db.select().from(athletes);
  }

  async getAthlete(id: string): Promise<Athlete | undefined> {
    const [athlete] = await db.select().from(athletes).where(eq(athletes.id, id));
    return athlete || undefined;
  }

  async createAthlete(athlete: InsertAthlete): Promise<Athlete> {
    const [newAthlete] = await db.insert(athletes).values(athlete).returning();
    return newAthlete;
  }

  async updateAthlete(id: string, athlete: Partial<InsertAthlete>): Promise<Athlete | undefined> {
    const [updated] = await db
      .update(athletes)
      .set(athlete)
      .where(eq(athletes.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAthlete(id: string): Promise<boolean> {
    const result = await db.delete(athletes).where(eq(athletes.id, id)).returning();
    return result.length > 0;
  }

  async bulkCreateAthletes(athletesList: InsertAthlete[]): Promise<Athlete[]> {
    if (athletesList.length === 0) return [];
    const results = await db.insert(athletes).values(athletesList).returning();
    return results;
  }

  async getTeams(): Promise<Team[]> {
    return await db.select().from(teams);
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async getTeamByName(name: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.name, name));
    return team;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async getOrCreateTeam(name: string): Promise<Team> {
    const existing = await this.getTeamByName(name);
    if (existing) return existing;
    return await this.createTeam({ name });
  }

  async getAthleteTeams(athleteId: string): Promise<Team[]> {
    const results = await db
      .select({ team: teams })
      .from(athleteTeams)
      .innerJoin(teams, eq(athleteTeams.teamId, teams.id))
      .where(eq(athleteTeams.athleteId, athleteId));
    return results.map(r => r.team);
  }

  async addAthleteToTeam(athleteId: string, teamId: string): Promise<void> {
    await db.insert(athleteTeams).values({ athleteId, teamId });
  }

  async removeAthleteFromTeam(athleteId: string, teamId: string): Promise<void> {
    await db
      .delete(athleteTeams)
      .where(
        and(
          eq(athleteTeams.athleteId, athleteId),
          eq(athleteTeams.teamId, teamId)
        )
      );
  }

  async getPrograms(): Promise<Program[]> {
    return await db.select().from(programs);
  }

  async getProgram(id: string): Promise<Program | undefined> {
    const [program] = await db.select().from(programs).where(eq(programs.id, id));
    return program || undefined;
  }

  async createProgram(program: InsertProgram): Promise<Program> {
    const [newProgram] = await db.insert(programs).values(program).returning();
    return newProgram;
  }

  async updateProgram(id: string, program: Partial<InsertProgram>): Promise<Program | undefined> {
    const [updated] = await db
      .update(programs)
      .set(program)
      .where(eq(programs.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProgram(id: string): Promise<boolean> {
    const result = await db.delete(programs).where(eq(programs.id, id)).returning();
    return result.length > 0;
  }

  async getProgramExercises(programId?: string): Promise<ProgramExercise[]> {
    if (programId) {
      return await db.select().from(programExercises).where(eq(programExercises.programId, programId));
    }
    return await db.select().from(programExercises);
  }

  async createProgramExercise(programExercise: InsertProgramExercise): Promise<ProgramExercise> {
    const [newProgramExercise] = await db.insert(programExercises).values(programExercise).returning();
    return newProgramExercise;
  }

  async deleteProgramExercise(id: string): Promise<boolean> {
    const result = await db.delete(programExercises).where(eq(programExercises.id, id)).returning();
    return result.length > 0;
  }

  async getProgramTemplates(): Promise<ProgramTemplate[]> {
    return await db.select().from(programTemplates);
  }

  async getProgramTemplate(id: string): Promise<ProgramTemplate | undefined> {
    const [template] = await db.select().from(programTemplates).where(eq(programTemplates.id, id));
    return template || undefined;
  }

  async createProgramTemplate(template: InsertProgramTemplate): Promise<ProgramTemplate> {
    const [newTemplate] = await db.insert(programTemplates).values(template).returning();
    return newTemplate;
  }

  async deleteProgramTemplate(id: string): Promise<boolean> {
    await db.delete(templateExercises).where(eq(templateExercises.templateId, id));
    const result = await db.delete(programTemplates).where(eq(programTemplates.id, id)).returning();
    return result.length > 0;
  }

  async getTemplateExercises(templateId: string): Promise<TemplateExercise[]> {
    return await db.select().from(templateExercises).where(eq(templateExercises.templateId, templateId));
  }

  async createTemplateExercise(templateExercise: InsertTemplateExercise): Promise<TemplateExercise> {
    const [newTemplateExercise] = await db.insert(templateExercises).values(templateExercise).returning();
    return newTemplateExercise;
  }

  async deleteTemplateExercise(id: string): Promise<boolean> {
    const result = await db.delete(templateExercises).where(eq(templateExercises.id, id)).returning();
    return result.length > 0;
  }

  async getTemplateWeekMetadata(templateId: string): Promise<TemplateWeekMetadata[]> {
    return await db.select().from(templateWeekMetadata).where(eq(templateWeekMetadata.templateId, templateId));
  }

  async createTemplateWeekMetadata(metadata: InsertTemplateWeekMetadata): Promise<TemplateWeekMetadata> {
    const [newMetadata] = await db.insert(templateWeekMetadata).values(metadata).returning();
    return newMetadata;
  }

  async bulkCreateTemplateWeekMetadata(metadataList: InsertTemplateWeekMetadata[]): Promise<TemplateWeekMetadata[]> {
    if (metadataList.length === 0) return [];
    
    return await db.transaction(async (tx) => {
      const result = await tx.insert(templateWeekMetadata).values(metadataList).returning();
      return result;
    });
  }

  async instantiateProgramFromTemplate(templateId: string, programName: string): Promise<Program> {
    const template = await this.getProgramTemplate(templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    const [newProgram] = await db.insert(programs).values({
      name: programName,
      description: template.description,
      duration: template.duration,
    }).returning();

    const templateExs = await this.getTemplateExercises(templateId);
    
    for (const te of templateExs) {
      await db.insert(programExercises).values({
        programId: newProgram.id,
        exerciseId: te.exerciseId,
        weekNumber: te.weekNumber,
        dayNumber: te.dayNumber,
        sets: te.sets,
        reps: te.reps,
        restSeconds: te.restSeconds,
        notes: te.notes,
        orderIndex: te.orderIndex,
      });
    }

    return newProgram;
  }

  async getAthletePrograms(athleteId: string): Promise<AthleteProgram[]> {
    return await db.select().from(athletePrograms).where(eq(athletePrograms.athleteId, athleteId));
  }

  async createAthleteProgram(athleteProgram: InsertAthleteProgram): Promise<AthleteProgram> {
    const [newAthleteProgram] = await db.insert(athletePrograms).values(athleteProgram).returning();
    return newAthleteProgram;
  }

  async updateAthleteProgram(id: string, status: string): Promise<AthleteProgram | undefined> {
    const [updated] = await db
      .update(athletePrograms)
      .set({ status })
      .where(eq(athletePrograms.id, id))
      .returning();
    return updated || undefined;
  }

  async getWorkoutLogs(athleteId?: string): Promise<WorkoutLog[]> {
    if (athleteId) {
      return await db.select().from(workoutLogs).where(eq(workoutLogs.athleteId, athleteId));
    }
    return await db.select().from(workoutLogs);
  }

  async createWorkoutLog(workoutLog: InsertWorkoutLog): Promise<WorkoutLog> {
    const [newLog] = await db.insert(workoutLogs).values(workoutLog).returning();
    return newLog;
  }

  async getPersonalRecords(athleteId?: string): Promise<PersonalRecord[]> {
    if (athleteId) {
      return await db.select().from(personalRecords).where(eq(personalRecords.athleteId, athleteId));
    }
    return await db.select().from(personalRecords);
  }

  async createPersonalRecord(record: InsertPersonalRecord): Promise<PersonalRecord> {
    const [newRecord] = await db.insert(personalRecords).values(record).returning();
    return newRecord;
  }

  async getProgramPhases(programId: string): Promise<ProgramPhase[]> {
    return await db.select().from(programPhases).where(eq(programPhases.programId, programId));
  }

  async createProgramPhase(phase: InsertProgramPhase): Promise<ProgramPhase> {
    const [newPhase] = await db.insert(programPhases).values(phase).returning();
    return newPhase;
  }

  async updateProgramPhase(id: string, phase: Partial<InsertProgramPhase>): Promise<ProgramPhase | undefined> {
    const [updated] = await db.update(programPhases).set(phase).where(eq(programPhases.id, id)).returning();
    return updated || undefined;
  }

  async deleteProgramPhase(id: string): Promise<boolean> {
    const result = await db.delete(programPhases).where(eq(programPhases.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getProgramWeeks(programId: string): Promise<ProgramWeek[]> {
    return await db.select().from(programWeeks).where(eq(programWeeks.programId, programId));
  }

  async getProgramWeek(id: string): Promise<ProgramWeek | undefined> {
    const [week] = await db.select().from(programWeeks).where(eq(programWeeks.id, id));
    return week || undefined;
  }

  async createProgramWeek(week: InsertProgramWeek): Promise<ProgramWeek> {
    const [newWeek] = await db.insert(programWeeks).values(week).returning();
    return newWeek;
  }

  async updateProgramWeek(id: string, week: Partial<InsertProgramWeek>): Promise<ProgramWeek | undefined> {
    const [updated] = await db.update(programWeeks).set(week).where(eq(programWeeks.id, id)).returning();
    return updated || undefined;
  }

  async getTrainingBlocks(programId: string, weekNumber?: number, dayNumber?: number): Promise<TrainingBlock[]> {
    if (weekNumber !== undefined && dayNumber !== undefined) {
      return await db.select().from(trainingBlocks).where(
        and(
          eq(trainingBlocks.programId, programId),
          eq(trainingBlocks.weekNumber, weekNumber),
          eq(trainingBlocks.dayNumber, dayNumber)
        )
      );
    } else if (weekNumber !== undefined) {
      return await db.select().from(trainingBlocks).where(
        and(
          eq(trainingBlocks.programId, programId),
          eq(trainingBlocks.weekNumber, weekNumber)
        )
      );
    }
    
    return await db.select().from(trainingBlocks).where(eq(trainingBlocks.programId, programId));
  }

  async getTrainingBlock(id: string): Promise<TrainingBlock | undefined> {
    const [block] = await db.select().from(trainingBlocks).where(eq(trainingBlocks.id, id));
    return block || undefined;
  }

  async createTrainingBlock(block: InsertTrainingBlock): Promise<TrainingBlock> {
    const [newBlock] = await db.insert(trainingBlocks).values(block).returning();
    return newBlock;
  }

  async updateTrainingBlock(id: string, block: Partial<InsertTrainingBlock>): Promise<TrainingBlock | undefined> {
    const [updated] = await db.update(trainingBlocks).set(block).where(eq(trainingBlocks.id, id)).returning();
    return updated || undefined;
  }

  async deleteTrainingBlock(id: string): Promise<boolean> {
    const result = await db.delete(trainingBlocks).where(eq(trainingBlocks.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async bulkInsertTrainingBlocks(blocks: InsertTrainingBlock[]): Promise<TrainingBlock[]> {
    if (blocks.length === 0) return [];
    return await db.insert(trainingBlocks).values(blocks).returning();
  }

  async getBlockExercises(blockId: string): Promise<BlockExercise[]> {
    return await db.select().from(blockExercises).where(eq(blockExercises.blockId, blockId));
  }

  async createBlockExercise(exercise: InsertBlockExercise): Promise<BlockExercise> {
    const [newExercise] = await db.insert(blockExercises).values(exercise).returning();
    return newExercise;
  }

  async deleteBlockExercise(id: string): Promise<boolean> {
    const result = await db.delete(blockExercises).where(eq(blockExercises.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async bulkInsertBlockExercises(exercises: InsertBlockExercise[]): Promise<BlockExercise[]> {
    if (exercises.length === 0) return [];
    return await db.insert(blockExercises).values(exercises).returning();
  }

  async getBlockTemplates(): Promise<BlockTemplate[]> {
    return await db.select().from(blockTemplates);
  }

  async getBlockTemplate(id: string): Promise<BlockTemplate | undefined> {
    const [template] = await db.select().from(blockTemplates).where(eq(blockTemplates.id, id));
    return template || undefined;
  }

  async createBlockTemplate(template: InsertBlockTemplate): Promise<BlockTemplate> {
    const [newTemplate] = await db.insert(blockTemplates).values(template).returning();
    return newTemplate;
  }

  async deleteBlockTemplate(id: string): Promise<boolean> {
    const result = await db.delete(blockTemplates).where(eq(blockTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getTemplateBlockExercises(templateId: string): Promise<TemplateBlockExercise[]> {
    return await db.select().from(templateBlockExercises).where(eq(templateBlockExercises.templateId, templateId));
  }

  async createTemplateBlockExercise(exercise: InsertTemplateBlockExercise): Promise<TemplateBlockExercise> {
    const [newExercise] = await db.insert(templateBlockExercises).values(exercise).returning();
    return newExercise;
  }

  async getWeekWithBlocks(programId: string, weekNumber: number): Promise<{ week: ProgramWeek | undefined, blocks: (TrainingBlock & { exercises: BlockExercise[] })[] }> {
    const [week] = await db.select().from(programWeeks).where(
      and(eq(programWeeks.programId, programId), eq(programWeeks.weekNumber, weekNumber))
    );
    
    const blocks = await db.select().from(trainingBlocks).where(
      and(eq(trainingBlocks.programId, programId), eq(trainingBlocks.weekNumber, weekNumber))
    );
    
    const blocksWithExercises = await Promise.all(
      blocks.map(async (block) => {
        const exercises = await db.select().from(blockExercises).where(eq(blockExercises.blockId, block.id));
        return { ...block, exercises };
      })
    );
    
    return { week: week || undefined, blocks: blocksWithExercises };
  }

  async getProgramStructure(programId: string): Promise<{ phases: ProgramPhase[], weeks: ProgramWeek[], blocks: (TrainingBlock & { exercises: BlockExercise[] })[] }> {
    const [phases, weeks, blocks] = await Promise.all([
      this.getProgramPhases(programId),
      this.getProgramWeeks(programId),
      this.getTrainingBlocks(programId)
    ]);
    
    const blocksWithExercises = await Promise.all(
      blocks.map(async (block) => {
        const exercises = await db.select().from(blockExercises).where(eq(blockExercises.blockId, block.id));
        return { ...block, exercises };
      })
    );
    
    return { phases, weeks, blocks: blocksWithExercises };
  }

  async createPhaseWithWeeks(phase: InsertProgramPhase, weekNumbers: number[]): Promise<ProgramPhase> {
    return await db.transaction(async (tx) => {
      const [newPhase] = await tx.insert(programPhases).values(phase).returning();
      
      const weekValues = weekNumbers.map(weekNum => ({
        programId: phase.programId,
        phaseId: newPhase.id,
        weekNumber: weekNum
      }));
      
      if (weekValues.length > 0) {
        await tx.insert(programWeeks).values(weekValues);
      }
      
      return newPhase;
    });
  }

  async instantiateBlockFromTemplate(templateId: string, programId: string, weekNumber: number, dayNumber: number, orderIndex: number): Promise<TrainingBlock> {
    return await db.transaction(async (tx) => {
      const [template] = await tx.select().from(blockTemplates).where(eq(blockTemplates.id, templateId));
      if (!template) throw new Error("Template not found");
      
      const [newBlock] = await tx.insert(trainingBlocks).values({
        programId,
        weekNumber,
        dayNumber,
        title: template.name,
        belt: template.belt,
        focus: template.focus,
        scheme: template.scheme,
        orderIndex,
        aiGenerated: 0
      }).returning();
      
      const templateExs = await tx.select().from(templateBlockExercises).where(eq(templateBlockExercises.templateId, templateId));
      
      if (templateExs.length > 0) {
        const blockExValues = templateExs.map(te => ({
          blockId: newBlock.id,
          exerciseId: te.exerciseId,
          scheme: te.scheme,
          notes: te.notes,
          orderIndex: te.orderIndex
        }));
        await tx.insert(blockExercises).values(blockExValues);
      }
      
      return newBlock;
    });
  }

  async duplicateWeekBlocks(programId: string, sourceWeek: number, targetWeek: number): Promise<TrainingBlock[]> {
    return await db.transaction(async (tx) => {
      const sourceBlocks = await tx.select().from(trainingBlocks).where(
        and(eq(trainingBlocks.programId, programId), eq(trainingBlocks.weekNumber, sourceWeek))
      );
      
      if (sourceBlocks.length === 0) return [];
      
      const newBlocks: TrainingBlock[] = [];
      
      for (const block of sourceBlocks) {
        const [newBlock] = await tx.insert(trainingBlocks).values({
          programId: block.programId,
          weekNumber: targetWeek,
          dayNumber: block.dayNumber,
          title: block.title,
          belt: block.belt,
          focus: block.focus,
          notes: block.notes,
          scheme: block.scheme,
          orderIndex: block.orderIndex,
          aiGenerated: 0
        }).returning();
        
        const sourceExercises = await tx.select().from(blockExercises).where(eq(blockExercises.blockId, block.id));
        
        if (sourceExercises.length > 0) {
          const newExValues = sourceExercises.map(ex => ({
            blockId: newBlock.id,
            exerciseId: ex.exerciseId,
            scheme: ex.scheme,
            notes: ex.notes,
            orderIndex: ex.orderIndex
          }));
          await tx.insert(blockExercises).values(newExValues);
        }
        
        newBlocks.push(newBlock);
      }
      
      return newBlocks;
    });
  }

  async moveBlock(blockId: string, newWeekNumber: number, newDayNumber: number, newOrderIndex: number): Promise<TrainingBlock | undefined> {
    const [updated] = await db.update(trainingBlocks).set({
      weekNumber: newWeekNumber,
      dayNumber: newDayNumber,
      orderIndex: newOrderIndex
    }).where(eq(trainingBlocks.id, blockId)).returning();
    
    return updated || undefined;
  }

  async reorderBlocks(programId: string, weekNumber: number, dayNumber: number, blockIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < blockIds.length; i++) {
        await tx.update(trainingBlocks).set({ orderIndex: i }).where(
          and(
            eq(trainingBlocks.id, blockIds[i]),
            eq(trainingBlocks.programId, programId),
            eq(trainingBlocks.weekNumber, weekNumber),
            eq(trainingBlocks.dayNumber, dayNumber)
          )
        );
      }
    });
  }

  async assertProgramOwner(programId: string, coachId: string): Promise<void> {
    const [program] = await db.select().from(programs).where(eq(programs.id, programId));
    if (!program) {
      throw new Error('Program not found');
    }
    if (program.coachId !== coachId) {
      throw new Error('Unauthorized: You do not own this program');
    }
  }

  async assertPhaseOwner(phaseId: string, coachId: string): Promise<void> {
    const [phase] = await db.select().from(programPhases).where(eq(programPhases.id, phaseId));
    if (!phase) {
      throw new Error('Phase not found');
    }
    const [program] = await db.select().from(programs).where(eq(programs.id, phase.programId));
    if (!program || program.coachId !== coachId) {
      throw new Error('Unauthorized: You do not own this phase');
    }
  }

  async importProgramFromCSV(programId: string, csvData: any, coachId: string): Promise<{ phases: ProgramPhase[], weeks: ProgramWeek[] }> {
    await this.assertProgramOwner(programId, coachId);
    
    return await db.transaction(async (tx) => {
      const createdPhases: ProgramPhase[] = [];
      const createdWeeks: ProgramWeek[] = [];

      for (const phase of csvData.phases) {
        const [newPhase] = await tx.insert(programPhases).values({
          programId,
          name: phase.name,
          phaseType: phase.type,
          startWeek: phase.startWeek,
          endWeek: phase.endWeek,
          goals: phase.goals,
          orderIndex: 0,
        }).returning();
        createdPhases.push(newPhase);

        for (const week of phase.weeks) {
          const [newWeek] = await tx.insert(programWeeks).values({
            programId,
            phaseId: newPhase.id,
            weekNumber: week.weekNumber,
            beltTarget: week.beltTarget,
            focus: week.focus,
            runningQualities: week.runningQualities,
            mbsPrimary: week.mbsPrimary,
            strengthTheme: week.strengthTheme,
            plyoContactsCap: week.plyoContactsCap,
            testingGateway: week.testingGateway,
            notes: week.notes,
          }).returning();
          createdWeeks.push(newWeek);
        }
      }

      return { phases: createdPhases, weeks: createdWeeks };
    });
  }

  async duplicatePhase(phaseId: string, coachId: string, targetProgramId?: string): Promise<ProgramPhase> {
    await this.assertPhaseOwner(phaseId, coachId);
    
    return await db.transaction(async (tx) => {
      const [sourcePhase] = await tx.select().from(programPhases).where(eq(programPhases.id, phaseId));
      if (!sourcePhase) throw new Error('Phase not found');

      const destinationProgramId = targetProgramId || sourcePhase.programId;
      
      await this.assertProgramOwner(destinationProgramId, coachId);

      const [newPhase] = await tx.insert(programPhases).values({
        programId: destinationProgramId,
        name: `${sourcePhase.name} (Copy)`,
        phaseType: sourcePhase.phaseType,
        startWeek: sourcePhase.startWeek,
        endWeek: sourcePhase.endWeek,
        goals: sourcePhase.goals,
        orderIndex: sourcePhase.orderIndex,
      }).returning();

      const sourceWeeks = await tx.select().from(programWeeks).where(eq(programWeeks.phaseId, phaseId));

      for (const week of sourceWeeks) {
        const [newWeek] = await tx.insert(programWeeks).values({
          programId: destinationProgramId,
          phaseId: newPhase.id,
          weekNumber: week.weekNumber,
          beltTarget: week.beltTarget,
          focus: week.focus,
          runningQualities: week.runningQualities,
          mbsPrimary: week.mbsPrimary,
          strengthTheme: week.strengthTheme,
          plyoContactsCap: week.plyoContactsCap,
          testingGateway: week.testingGateway,
          notes: week.notes,
        }).returning();

        const sourceBlocks = await tx.select().from(trainingBlocks).where(
          and(eq(trainingBlocks.programId, sourcePhase.programId), eq(trainingBlocks.weekNumber, week.weekNumber))
        );

        for (const block of sourceBlocks) {
          const [newBlock] = await tx.insert(trainingBlocks).values({
            programId: destinationProgramId,
            weekNumber: block.weekNumber,
            dayNumber: block.dayNumber,
            title: block.title,
            belt: block.belt,
            focus: block.focus,
            scheme: block.scheme,
            notes: block.notes,
            orderIndex: block.orderIndex,
            aiGenerated: block.aiGenerated,
          }).returning();

          const sourceExercises = await tx.select().from(blockExercises).where(eq(blockExercises.blockId, block.id));
          if (sourceExercises.length > 0) {
            const newExValues = sourceExercises.map(ex => ({
              blockId: newBlock.id,
              exerciseId: ex.exerciseId,
              scheme: ex.scheme,
              notes: ex.notes,
              orderIndex: ex.orderIndex,
            }));
            await tx.insert(blockExercises).values(newExValues);
          }
        }
      }

      return newPhase;
    });
  }

  async duplicateWeeks(programId: string, startWeek: number, endWeek: number, insertAtWeek: number, shiftSubsequent: boolean, coachId: string): Promise<ProgramWeek[]> {
    await this.assertProgramOwner(programId, coachId);
    
    return await db.transaction(async (tx) => {
      const sourceWeeks = await tx.select().from(programWeeks).where(
        and(
          eq(programWeeks.programId, programId),
          // NOTE: Drizzle doesn't have gte/lte, so we need to use sql
        )
      );

      const weeksToClone = sourceWeeks.filter(w => w.weekNumber >= startWeek && w.weekNumber <= endWeek);
      const weekCount = endWeek - startWeek + 1;

      if (shiftSubsequent) {
        const subsequentWeeks = sourceWeeks.filter(w => w.weekNumber >= insertAtWeek);
        for (const week of subsequentWeeks) {
          await tx.update(programWeeks).set({
            weekNumber: week.weekNumber + weekCount,
          }).where(eq(programWeeks.id, week.id));
        }

        const subsequentBlocks = await tx.select().from(trainingBlocks).where(
          and(eq(trainingBlocks.programId, programId))
        );
        const blocksToShift = subsequentBlocks.filter(b => b.weekNumber >= insertAtWeek);
        for (const block of blocksToShift) {
          await tx.update(trainingBlocks).set({
            weekNumber: block.weekNumber + weekCount,
          }).where(eq(trainingBlocks.id, block.id));
        }
      }

      const newWeeks: ProgramWeek[] = [];
      for (let i = 0; i < weeksToClone.length; i++) {
        const week = weeksToClone[i];
        const newWeekNumber = insertAtWeek + i;

        const [newWeek] = await tx.insert(programWeeks).values({
          programId,
          phaseId: week.phaseId,
          weekNumber: newWeekNumber,
          beltTarget: week.beltTarget,
          focus: week.focus,
          runningQualities: week.runningQualities,
          mbsPrimary: week.mbsPrimary,
          strengthTheme: week.strengthTheme,
          plyoContactsCap: week.plyoContactsCap,
          testingGateway: week.testingGateway,
          notes: week.notes,
        }).returning();
        newWeeks.push(newWeek);

        const sourceBlocks = await tx.select().from(trainingBlocks).where(
          and(eq(trainingBlocks.programId, programId), eq(trainingBlocks.weekNumber, week.weekNumber))
        );

        for (const block of sourceBlocks) {
          const [newBlock] = await tx.insert(trainingBlocks).values({
            programId,
            weekNumber: newWeekNumber,
            dayNumber: block.dayNumber,
            title: block.title,
            belt: block.belt,
            focus: block.focus,
            scheme: block.scheme,
            notes: block.notes,
            orderIndex: block.orderIndex,
            aiGenerated: block.aiGenerated,
          }).returning();

          const sourceExercises = await tx.select().from(blockExercises).where(eq(blockExercises.blockId, block.id));
          if (sourceExercises.length > 0) {
            const newExValues = sourceExercises.map(ex => ({
              blockId: newBlock.id,
              exerciseId: ex.exerciseId,
              scheme: ex.scheme,
              notes: ex.notes,
              orderIndex: ex.orderIndex,
            }));
            await tx.insert(blockExercises).values(newExValues);
          }
        }
      }

      return newWeeks;
    });
  }

  async createTemplate(template: InsertProgramTemplate): Promise<ProgramTemplate> {
    const [newTemplate] = await db.insert(programTemplates).values(template).returning();
    return newTemplate;
  }

  async listTemplates(): Promise<ProgramTemplate[]> {
    return await db.select().from(programTemplates).where(eq(programTemplates.isPublic, 1));
  }

  async getTemplateWithStructure(templateId: string): Promise<{
    template: ProgramTemplate;
    phases: TemplatePhase[];
    weeks: TemplateWeek[];
    blocks: (TemplateTrainingBlock & { exercises: TemplateTrainingBlockExercise[] })[];
  }> {
    const [template] = await db.select().from(programTemplates).where(eq(programTemplates.id, templateId));
    if (!template) {
      throw new Error('Template not found');
    }

    const phases = await db.select().from(templatePhases).where(eq(templatePhases.templateId, templateId));
    const weeks = await db.select().from(templateWeeks).where(eq(templateWeeks.templateId, templateId));
    const allBlocks = await db.select().from(templateTrainingBlocks).where(eq(templateTrainingBlocks.templateId, templateId));

    const blocksWithExercises = await Promise.all(
      allBlocks.map(async (block) => {
        const blockExercises = await db.select({
          id: templateTrainingBlockExercises.id,
          blockId: templateTrainingBlockExercises.blockId,
          exerciseId: templateTrainingBlockExercises.exerciseId,
          scheme: templateTrainingBlockExercises.scheme,
          notes: templateTrainingBlockExercises.notes,
          orderIndex: templateTrainingBlockExercises.orderIndex,
          exerciseName: exercises.name,
          exerciseCategory: exercises.category,
          exerciseMuscleGroup: exercises.muscleGroup,
          exerciseDifficulty: exercises.difficulty,
        })
        .from(templateTrainingBlockExercises)
        .leftJoin(exercises, eq(templateTrainingBlockExercises.exerciseId, exercises.id))
        .where(eq(templateTrainingBlockExercises.blockId, block.id))
        .orderBy(templateTrainingBlockExercises.orderIndex);
        return { ...block, exercises: blockExercises };
      })
    );

    return { template, phases, weeks, blocks: blocksWithExercises };
  }

  async copyTemplateToProgram(templateId: string, coachId: string, programName?: string): Promise<Program> {
    const { template, phases, weeks, blocks } = await this.getTemplateWithStructure(templateId);

    if (phases.length === 0 || weeks.length === 0) {
      throw new Error(`Cannot copy template "${template.name}": template has no phases or weeks defined`);
    }

    const weeksWithoutPhase = weeks.filter(w => !w.phaseId || w.phaseId.trim().length === 0);
    if (weeksWithoutPhase.length > 0) {
      throw new Error(`Cannot copy template "${template.name}": template has ${weeksWithoutPhase.length} week(s) with missing phaseId`);
    }

    const phaseIds = new Set(phases.map(p => p.id));
    const orphanWeeks = weeks.filter(w => w.phaseId != null && !phaseIds.has(w.phaseId));
    if (orphanWeeks.length > 0) {
      const badIds = orphanWeeks.map(w => w.phaseId).join(', ');
      throw new Error(`Cannot copy template "${template.name}": template has ${orphanWeeks.length} week(s) with invalid phaseId (${badIds})`);
    }

    for (const phase of phases) {
      const phaseWeeks = weeks.filter(w => w.phaseId === phase.id);
      if (phaseWeeks.length === 0) {
        throw new Error(`Cannot copy template "${template.name}": phase "${phase.name}" has no associated weeks`);
      }
    }

    return await db.transaction(async (tx) => {
      const [newProgram] = await tx.insert(programs).values({
        coachId,
        name: programName || template.name,
        description: template.description,
        duration: template.duration,
      }).returning();

      for (const phase of phases) {
        const [newPhase] = await tx.insert(programPhases).values({
          programId: newProgram.id,
          name: phase.name,
          startWeek: phase.startWeek,
          endWeek: phase.endWeek,
          phaseType: phase.phaseType,
          goals: phase.goals,
          orderIndex: phase.orderIndex,
        }).returning();

        for (const week of weeks.filter(w => w.phaseId === phase.id)) {
          const [newWeek] = await tx.insert(programWeeks).values({
            programId: newProgram.id,
            phaseId: newPhase.id,
            weekNumber: week.weekNumber,
            beltTarget: week.beltTarget,
            focus: week.focus,
            volumeTarget: week.volumeTarget,
            intensityZone: week.intensityZone,
            runningQualities: week.runningQualities,
            mbsPrimary: week.mbsPrimary,
            strengthTheme: week.strengthTheme,
            plyoContactsCap: week.plyoContactsCap,
            testingGateway: week.testingGateway,
            notes: week.notes,
          }).returning();

          const weekBlocks = blocks.filter(b => b.templateWeekId === week.id);
          for (const block of weekBlocks) {
            const [newBlock] = await tx.insert(trainingBlocks).values({
              programId: newProgram.id,
              programWeekId: newWeek.id,
              weekNumber: block.weekNumber,
              dayNumber: block.dayNumber,
              title: block.title,
              belt: block.belt,
              focus: block.focus,
              scheme: block.scheme,
              notes: block.notes,
              orderIndex: block.orderIndex,
            }).returning();

            if (block.exercises.length > 0) {
              const newExercises = block.exercises.map(ex => ({
                blockId: newBlock.id,
                exerciseId: ex.exerciseId,
                scheme: ex.scheme,
                notes: ex.notes,
                orderIndex: ex.orderIndex,
              }));
              await tx.insert(blockExercises).values(newExercises);
            }
          }
        }
      }

      return newProgram;
    });
  }

  async copyTemplatePhasesToProgram(templateId: string, phaseIds: string[], targetProgramId: string, coachId: string): Promise<ProgramPhase[]> {
    await this.assertProgramOwner(targetProgramId, coachId);
    const { phases, weeks, blocks } = await this.getTemplateWithStructure(templateId);

    const phasesToCopy = phases.filter(p => phaseIds.includes(p.id));
    if (phasesToCopy.length === 0) {
      throw new Error('No matching phases found');
    }

    return await db.transaction(async (tx) => {
      const existingWeeks = await tx.select().from(programWeeks).where(eq(programWeeks.programId, targetProgramId));
      const maxWeek = existingWeeks.length > 0 ? Math.max(...existingWeeks.map(w => w.weekNumber)) : 0;

      const newPhases: ProgramPhase[] = [];
      let weekOffset = maxWeek;

      for (const phase of phasesToCopy) {
        const [newPhase] = await tx.insert(programPhases).values({
          programId: targetProgramId,
          name: phase.name,
          startWeek: phase.startWeek + weekOffset,
          endWeek: phase.endWeek + weekOffset,
          phaseType: phase.phaseType,
          goals: phase.goals,
          orderIndex: phase.orderIndex,
        }).returning();
        newPhases.push(newPhase);

        const phaseWeeks = weeks.filter(w => w.phaseId === phase.id);
        for (const week of phaseWeeks) {
          const [newWeek] = await tx.insert(programWeeks).values({
            programId: targetProgramId,
            phaseId: newPhase.id,
            weekNumber: week.weekNumber + weekOffset,
            beltTarget: week.beltTarget,
            focus: week.focus,
            runningQualities: week.runningQualities,
            mbsPrimary: week.mbsPrimary,
            strengthTheme: week.strengthTheme,
            plyoContactsCap: week.plyoContactsCap,
            testingGateway: week.testingGateway,
            notes: week.notes,
          }).returning();

          const weekBlocks = blocks.filter(b => b.templateWeekId === week.id);
          for (const block of weekBlocks) {
            const [newBlock] = await tx.insert(trainingBlocks).values({
              programId: targetProgramId,
              programWeekId: newWeek.id,
              weekNumber: block.weekNumber + weekOffset,
              dayNumber: block.dayNumber,
              title: block.title,
              belt: block.belt,
              focus: block.focus,
              scheme: block.scheme,
              notes: block.notes,
              orderIndex: block.orderIndex,
            }).returning();

            if (block.exercises.length > 0) {
              const newExercises = block.exercises.map(ex => ({
                blockId: newBlock.id,
                exerciseId: ex.exerciseId,
                scheme: ex.scheme,
                notes: ex.notes,
                orderIndex: ex.orderIndex,
              }));
              await tx.insert(blockExercises).values(newExercises);
            }
          }
        }
      }

      return newPhases;
    });
  }

  async copyTemplateWeeksToProgram(templateId: string, startWeek: number, endWeek: number, targetProgramId: string, insertAtWeek: number, coachId: string): Promise<ProgramWeek[]> {
    await this.assertProgramOwner(targetProgramId, coachId);
    const { weeks, blocks } = await this.getTemplateWithStructure(templateId);

    const weeksToCopy = weeks.filter(w => w.weekNumber >= startWeek && w.weekNumber <= endWeek);
    if (weeksToCopy.length === 0) {
      throw new Error('No matching weeks found in template');
    }

    return await db.transaction(async (tx) => {
      const newWeeks: ProgramWeek[] = [];
      for (let i = 0; i < weeksToCopy.length; i++) {
        const week = weeksToCopy[i];
        const newWeekNumber = insertAtWeek + i;

        const [newWeek] = await tx.insert(programWeeks).values({
          programId: targetProgramId,
          phaseId: null,
          weekNumber: newWeekNumber,
          beltTarget: week.beltTarget,
          focus: week.focus,
          runningQualities: week.runningQualities,
          mbsPrimary: week.mbsPrimary,
          strengthTheme: week.strengthTheme,
          plyoContactsCap: week.plyoContactsCap,
          testingGateway: week.testingGateway,
          notes: week.notes,
        }).returning();
        newWeeks.push(newWeek);

        const weekBlocks = blocks.filter(b => b.templateWeekId === week.id);
        for (const block of weekBlocks) {
          const [newBlock] = await tx.insert(trainingBlocks).values({
            programId: targetProgramId,
            programWeekId: newWeek.id,
            weekNumber: newWeekNumber,
            dayNumber: block.dayNumber,
            title: block.title,
            belt: block.belt,
            focus: block.focus,
            scheme: block.scheme,
            notes: block.notes,
            orderIndex: block.orderIndex,
          }).returning();

          if (block.exercises.length > 0) {
            const newExercises = block.exercises.map(ex => ({
              blockId: newBlock.id,
              exerciseId: ex.exerciseId,
              scheme: ex.scheme,
              notes: ex.notes,
              orderIndex: ex.orderIndex,
            }));
            await tx.insert(blockExercises).values(newExercises);
          }
        }
      }

      return newWeeks;
    });
  }

  async getAllReadinessSurveys(): Promise<ReadinessSurvey[]> {
    return await db
      .select()
      .from(readinessSurveys)
      .orderBy(desc(readinessSurveys.surveyDate));
  }

  async getReadinessSurveys(athleteId: string): Promise<ReadinessSurvey[]> {
    return await db
      .select()
      .from(readinessSurveys)
      .where(eq(readinessSurveys.athleteId, athleteId))
      .orderBy(desc(readinessSurveys.surveyDate));
  }

  async getReadinessSurvey(id: string): Promise<ReadinessSurvey | undefined> {
    const [survey] = await db.select().from(readinessSurveys).where(eq(readinessSurveys.id, id));
    return survey || undefined;
  }

  async getTodaysSurvey(athleteId: string): Promise<ReadinessSurvey | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [survey] = await db
      .select()
      .from(readinessSurveys)
      .where(
        and(
          eq(readinessSurveys.athleteId, athleteId),
          gte(readinessSurveys.surveyDate, today),
          lt(readinessSurveys.surveyDate, tomorrow)
        )
      );
    return survey || undefined;
  }

  async createReadinessSurvey(survey: InsertReadinessSurvey): Promise<ReadinessSurvey> {
    const [newSurvey] = await db.insert(readinessSurveys).values(survey).returning();
    return newSurvey;
  }

  async getCoachHeuristics(coachId?: string): Promise<CoachHeuristic[]> {
    if (coachId) {
      return await db
        .select()
        .from(coachHeuristics)
        .where(eq(coachHeuristics.coachId, coachId))
        .orderBy(desc(coachHeuristics.priority));
    }
    return await db.select().from(coachHeuristics).orderBy(desc(coachHeuristics.priority));
  }

  async getActiveCoachHeuristics(coachId?: string): Promise<CoachHeuristic[]> {
    const heuristics = await this.getCoachHeuristics(coachId);
    return heuristics.filter(h => h.isActive === 1);
  }

  async getCoachHeuristic(id: string): Promise<CoachHeuristic | undefined> {
    const [heuristic] = await db.select().from(coachHeuristics).where(eq(coachHeuristics.id, id));
    return heuristic || undefined;
  }

  async createCoachHeuristic(heuristic: InsertCoachHeuristic): Promise<CoachHeuristic> {
    const [newHeuristic] = await db.insert(coachHeuristics).values(heuristic).returning();
    return newHeuristic;
  }

  async updateCoachHeuristic(id: string, heuristic: Partial<InsertCoachHeuristic>): Promise<CoachHeuristic | undefined> {
    const [updated] = await db
      .update(coachHeuristics)
      .set({ ...heuristic, updatedAt: new Date() })
      .where(eq(coachHeuristics.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCoachHeuristic(id: string): Promise<boolean> {
    const result = await db.delete(coachHeuristics).where(eq(coachHeuristics.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getPendingAiActions(): Promise<PendingAiAction[]> {
    return await db.select().from(pendingAiActions).orderBy(desc(pendingAiActions.createdAt));
  }

  async getPendingAiActionsByStatus(status: string): Promise<PendingAiAction[]> {
    return await db
      .select()
      .from(pendingAiActions)
      .where(eq(pendingAiActions.status, status))
      .orderBy(desc(pendingAiActions.createdAt));
  }

  async getPendingAiAction(id: string): Promise<PendingAiAction | undefined> {
    const [action] = await db.select().from(pendingAiActions).where(eq(pendingAiActions.id, id));
    return action || undefined;
  }

  async createPendingAiAction(action: InsertPendingAiAction): Promise<PendingAiAction> {
    const [newAction] = await db.insert(pendingAiActions).values(action).returning();
    return newAction;
  }

  async updatePendingAiAction(id: string, action: Partial<InsertPendingAiAction>): Promise<PendingAiAction | undefined> {
    const [updated] = await db
      .update(pendingAiActions)
      .set({ ...action, updatedAt: new Date() })
      .where(eq(pendingAiActions.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePendingAiAction(id: string): Promise<boolean> {
    const result = await db.delete(pendingAiActions).where(eq(pendingAiActions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getValdProfiles(): Promise<ValdProfile[]> {
    return await db.select().from(valdProfiles);
  }

  async getValdProfile(id: string): Promise<ValdProfile | undefined> {
    const [profile] = await db.select().from(valdProfiles).where(eq(valdProfiles.id, id));
    return profile || undefined;
  }

  async getValdProfileByValdId(valdProfileId: string): Promise<ValdProfile | undefined> {
    const [profile] = await db.select().from(valdProfiles).where(eq(valdProfiles.valdProfileId, valdProfileId));
    return profile || undefined;
  }

  async getValdProfileByAthleteId(athleteId: string): Promise<ValdProfile | undefined> {
    const [profile] = await db.select().from(valdProfiles).where(eq(valdProfiles.athleteId, athleteId));
    return profile || undefined;
  }

  async createValdProfile(profile: InsertValdProfile): Promise<ValdProfile> {
    const [newProfile] = await db.insert(valdProfiles).values(profile).returning();
    return newProfile;
  }

  async updateValdProfile(id: string, profile: Partial<InsertValdProfile>): Promise<ValdProfile | undefined> {
    const [updated] = await db
      .update(valdProfiles)
      .set({ ...profile, syncedAt: new Date() })
      .where(eq(valdProfiles.id, id))
      .returning();
    return updated || undefined;
  }

  async linkValdProfileToAthlete(valdProfileId: string, athleteId: string): Promise<ValdProfile | undefined> {
    const [updated] = await db
      .update(valdProfiles)
      .set({ athleteId, syncedAt: new Date() })
      .where(eq(valdProfiles.id, valdProfileId))
      .returning();
    return updated || undefined;
  }

  async getValdTestsForAthlete(athleteId: string): Promise<ValdTest[]> {
    return await db
      .select()
      .from(valdTests)
      .where(eq(valdTests.athleteId, athleteId))
      .orderBy(desc(valdTests.recordedAt));
  }

  async getValdTestsForProfile(valdProfileId: string): Promise<ValdTest[]> {
    return await db
      .select()
      .from(valdTests)
      .where(eq(valdTests.valdProfileId, valdProfileId))
      .orderBy(desc(valdTests.recordedAt));
  }

  async getValdTest(id: string): Promise<ValdTest | undefined> {
    const [test] = await db.select().from(valdTests).where(eq(valdTests.id, id));
    return test || undefined;
  }

  async getValdTestByValdId(valdTestId: string): Promise<ValdTest | undefined> {
    const [test] = await db.select().from(valdTests).where(eq(valdTests.valdTestId, valdTestId));
    return test || undefined;
  }

  async createValdTest(test: InsertValdTest): Promise<ValdTest> {
    const [newTest] = await db.insert(valdTests).values(test).returning();
    return newTest;
  }

  async updateValdTestAthleteLink(testId: string, athleteId: string): Promise<ValdTest | undefined> {
    const [updated] = await db
      .update(valdTests)
      .set({ athleteId })
      .where(eq(valdTests.id, testId))
      .returning();
    return updated || undefined;
  }

  async updateValdTest(id: string, test: Partial<InsertValdTest>): Promise<ValdTest | undefined> {
    const [updated] = await db
      .update(valdTests)
      .set(test)
      .where(eq(valdTests.id, id))
      .returning();
    return updated || undefined;
  }

  async bulkCreateValdTests(tests: InsertValdTest[]): Promise<ValdTest[]> {
    if (tests.length === 0) return [];
    return await db.insert(valdTests).values(tests).returning();
  }

  async getValdTrialResults(valdTestId: string): Promise<ValdTrialResult[]> {
    return await db
      .select()
      .from(valdTrialResults)
      .where(eq(valdTrialResults.valdTestId, valdTestId));
  }

  async createValdTrialResult(result: InsertValdTrialResult): Promise<ValdTrialResult> {
    const [newResult] = await db.insert(valdTrialResults).values(result).returning();
    return newResult;
  }

  async bulkCreateValdTrialResults(results: InsertValdTrialResult[]): Promise<ValdTrialResult[]> {
    if (results.length === 0) return [];
    return await db.insert(valdTrialResults).values(results).returning();
  }

  async getValdSyncLogs(limit: number = 10): Promise<ValdSyncLog[]> {
    return await db
      .select()
      .from(valdSyncLog)
      .orderBy(desc(valdSyncLog.startedAt))
      .limit(limit);
  }

  async createValdSyncLog(log: InsertValdSyncLog): Promise<ValdSyncLog> {
    const [newLog] = await db.insert(valdSyncLog).values(log).returning();
    return newLog;
  }

  async updateValdSyncLog(id: string, log: Partial<InsertValdSyncLog & { completedAt: Date }>): Promise<ValdSyncLog | undefined> {
    const [updated] = await db
      .update(valdSyncLog)
      .set(log)
      .where(eq(valdSyncLog.id, id))
      .returning();
    return updated || undefined;
  }

  async getAthleteValdData(athleteId: string): Promise<{
    profile: ValdProfile | undefined;
    tests: ValdTest[];
    latestResults: Map<string, ValdTrialResult[]>;
  }> {
    const profile = await this.getValdProfileByAthleteId(athleteId);
    const tests = await this.getValdTestsForAthlete(athleteId);
    
    const latestResults = new Map<string, ValdTrialResult[]>();
    for (const test of tests.slice(0, 5)) {
      const results = await this.getValdTrialResults(test.id);
      latestResults.set(test.id, results);
    }
    
    return { profile, tests, latestResults };
  }

  async getAthleteTrainingProfile(athleteId: string): Promise<AthleteTrainingProfile | undefined> {
    const [profile] = await db
      .select()
      .from(athleteTrainingProfiles)
      .where(eq(athleteTrainingProfiles.athleteId, athleteId));
    return profile || undefined;
  }

  async createAthleteTrainingProfile(profile: InsertAthleteTrainingProfile): Promise<AthleteTrainingProfile> {
    const [newProfile] = await db.insert(athleteTrainingProfiles).values(profile).returning();
    return newProfile;
  }

  async updateAthleteTrainingProfile(athleteId: string, profile: Partial<InsertAthleteTrainingProfile>): Promise<AthleteTrainingProfile | undefined> {
    const [updated] = await db
      .update(athleteTrainingProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(athleteTrainingProfiles.athleteId, athleteId))
      .returning();
    return updated || undefined;
  }

  async upsertAthleteTrainingProfile(profile: InsertAthleteTrainingProfile): Promise<AthleteTrainingProfile> {
    const existing = await this.getAthleteTrainingProfile(profile.athleteId);
    if (existing) {
      const updated = await this.updateAthleteTrainingProfile(profile.athleteId, profile);
      return updated!;
    }
    return await this.createAthleteTrainingProfile(profile);
  }

  async getLatestBeltClassification(athleteId: string): Promise<AthleteBeltClassification | undefined> {
    const [classification] = await db
      .select()
      .from(athleteBeltClassifications)
      .where(eq(athleteBeltClassifications.athleteId, athleteId))
      .orderBy(desc(athleteBeltClassifications.computedAt))
      .limit(1);
    return classification || undefined;
  }

  async getBeltClassificationHistory(athleteId: string, limit: number = 10): Promise<AthleteBeltClassification[]> {
    return await db
      .select()
      .from(athleteBeltClassifications)
      .where(eq(athleteBeltClassifications.athleteId, athleteId))
      .orderBy(desc(athleteBeltClassifications.computedAt))
      .limit(limit);
  }

  async createBeltClassification(classification: InsertAthleteBeltClassification): Promise<AthleteBeltClassification> {
    const [newClassification] = await db.insert(athleteBeltClassifications).values(classification).returning();
    return newClassification;
  }

  async overrideBeltClassification(
    athleteId: string, 
    belt: string, 
    overriddenBy: string, 
    reason: string
  ): Promise<AthleteBeltClassification> {
    const latest = await this.getLatestBeltClassification(athleteId);
    const newClassification: InsertAthleteBeltClassification = {
      athleteId,
      belt,
      score: latest?.score ?? 0,
      confidence: latest?.confidence ?? 100,
      reasons: [...(latest?.reasons || []), `Override: ${reason}`],
      needsCapacityWork: latest?.needsCapacityWork ?? 0,
      capReactiveContacts: latest?.capReactiveContacts ?? 0,
      capStrengthVolume: latest?.capStrengthVolume ?? 0,
      needsTopUps: latest?.needsTopUps ?? 0,
      isOverridden: 1,
      overriddenBy,
      overrideReason: reason,
    };
    return await this.createBeltClassification(newClassification);
  }

  async getDoseBudget(belt: string, phase: string, waveWeek: number): Promise<DoseBudget | undefined> {
    const [budget] = await db
      .select()
      .from(doseBudgets)
      .where(
        and(
          eq(doseBudgets.belt, belt),
          eq(doseBudgets.phase, phase),
          eq(doseBudgets.waveWeek, waveWeek)
        )
      );
    return budget || undefined;
  }

  async createDoseBudget(budget: InsertDoseBudget): Promise<DoseBudget> {
    const [newBudget] = await db.insert(doseBudgets).values(budget).returning();
    return newBudget;
  }

  async getAllDoseBudgets(): Promise<DoseBudget[]> {
    return await db.select().from(doseBudgets);
  }

  async upsertDoseBudget(budget: InsertDoseBudget): Promise<DoseBudget> {
    const existing = await this.getDoseBudget(budget.belt, budget.phase, budget.waveWeek);
    if (existing) {
      const [updated] = await db
        .update(doseBudgets)
        .set(budget)
        .where(eq(doseBudgets.id, existing.id))
        .returning();
      return updated;
    }
    return await this.createDoseBudget(budget);
  }

  // Messages
  async getMessages(athleteId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.athleteId, athleteId))
      .orderBy(desc(messages.createdAt));
  }

  async getAllMessages(): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .orderBy(desc(messages.createdAt));
  }

  async getRecentMessages(limit: number = 50): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async markMessagesAsRead(athleteId: string, recipientId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: 1 })
      .where(and(eq(messages.athleteId, athleteId), eq(messages.recipientId, recipientId)));
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.userId, userId));
  }

  async getStageOverlays(): Promise<StageOverlay[]> {
    return await db
      .select()
      .from(stageOverlays)
      .orderBy(stageOverlays.orderIndex);
  }

  async getStageOverlay(name: string): Promise<StageOverlay | undefined> {
    const [stage] = await db
      .select()
      .from(stageOverlays)
      .where(eq(stageOverlays.name, name));
    return stage || undefined;
  }

  async getAuditLogs(params: {
    limit?: number;
    offset?: number;
    action?: string;
    resourceType?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditLog[]> {
    const conditions = [];
    
    if (params.action) {
      conditions.push(eq(auditLogs.action, params.action));
    }
    if (params.resourceType) {
      conditions.push(eq(auditLogs.resourceType, params.resourceType));
    }
    if (params.userId) {
      conditions.push(eq(auditLogs.userId, params.userId));
    }
    if (params.startDate) {
      conditions.push(gte(auditLogs.createdAt, params.startDate));
    }
    if (params.endDate) {
      conditions.push(lt(auditLogs.createdAt, params.endDate));
    }

    const query = db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(params.limit || 100)
      .offset(params.offset || 0);

    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }
    
    return await query;
  }

  async getAuditLogSummary(days: number): Promise<{
    totalActions: number;
    byAction: Record<string, number>;
    byResourceType: Record<string, number>;
    recentActivity: AuditLog[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const logs = await db
      .select()
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, startDate))
      .orderBy(desc(auditLogs.createdAt));

    const byAction: Record<string, number> = {};
    const byResourceType: Record<string, number> = {};
    
    logs.forEach(log => {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      byResourceType[log.resourceType] = (byResourceType[log.resourceType] || 0) + 1;
    });

    return {
      totalActions: logs.length,
      byAction,
      byResourceType,
      recentActivity: logs.slice(0, 20),
    };
  }
}

export const storage = new DatabaseStorage();
