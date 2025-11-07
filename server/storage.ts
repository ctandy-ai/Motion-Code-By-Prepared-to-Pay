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
  type AthleteProgram,
  type InsertAthleteProgram,
  type WorkoutLog,
  type InsertWorkoutLog,
  type PersonalRecord,
  type InsertPersonalRecord,
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
  athletePrograms,
  workoutLogs,
  personalRecords,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

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
    return await db.insert(templateWeekMetadata).values(metadataList).returning();
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
}

export const storage = new DatabaseStorage();
