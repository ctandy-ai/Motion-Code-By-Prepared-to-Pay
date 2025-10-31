import {
  type User,
  type InsertUser,
  type Exercise,
  type InsertExercise,
  type Athlete,
  type InsertAthlete,
  type Program,
  type InsertProgram,
  type ProgramExercise,
  type InsertProgramExercise,
  type AthleteProgram,
  type InsertAthleteProgram,
  type WorkoutLog,
  type InsertWorkoutLog,
  type PersonalRecord,
  type InsertPersonalRecord,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Exercise methods
  getExercises(): Promise<Exercise[]>;
  getExercise(id: string): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  updateExercise(id: string, exercise: Partial<InsertExercise>): Promise<Exercise | undefined>;
  deleteExercise(id: string): Promise<boolean>;

  // Athlete methods
  getAthletes(): Promise<Athlete[]>;
  getAthlete(id: string): Promise<Athlete | undefined>;
  createAthlete(athlete: InsertAthlete): Promise<Athlete>;
  updateAthlete(id: string, athlete: Partial<InsertAthlete>): Promise<Athlete | undefined>;
  deleteAthlete(id: string): Promise<boolean>;

  // Program methods
  getPrograms(): Promise<Program[]>;
  getProgram(id: string): Promise<Program | undefined>;
  createProgram(program: InsertProgram): Promise<Program>;
  updateProgram(id: string, program: Partial<InsertProgram>): Promise<Program | undefined>;
  deleteProgram(id: string): Promise<boolean>;

  // Program Exercise methods
  getProgramExercises(programId: string): Promise<ProgramExercise[]>;
  createProgramExercise(programExercise: InsertProgramExercise): Promise<ProgramExercise>;
  deleteProgramExercise(id: string): Promise<boolean>;

  // Athlete Program methods
  getAthletePrograms(athleteId: string): Promise<AthleteProgram[]>;
  createAthleteProgram(athleteProgram: InsertAthleteProgram): Promise<AthleteProgram>;
  updateAthleteProgram(id: string, status: string): Promise<AthleteProgram | undefined>;

  // Workout Log methods
  getWorkoutLogs(athleteId?: string): Promise<WorkoutLog[]>;
  createWorkoutLog(workoutLog: InsertWorkoutLog): Promise<WorkoutLog>;

  // Personal Record methods
  getPersonalRecords(athleteId?: string): Promise<PersonalRecord[]>;
  createPersonalRecord(record: InsertPersonalRecord): Promise<PersonalRecord>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private exercises: Map<string, Exercise>;
  private athletes: Map<string, Athlete>;
  private programs: Map<string, Program>;
  private programExercises: Map<string, ProgramExercise>;
  private athletePrograms: Map<string, AthleteProgram>;
  private workoutLogs: Map<string, WorkoutLog>;
  private personalRecords: Map<string, PersonalRecord>;

  constructor() {
    this.users = new Map();
    this.exercises = new Map();
    this.athletes = new Map();
    this.programs = new Map();
    this.programExercises = new Map();
    this.athletePrograms = new Map();
    this.workoutLogs = new Map();
    this.personalRecords = new Map();

    this.seedData();
  }

  private seedData() {
    const sampleExercises: InsertExercise[] = [
      {
        name: "Barbell Squat",
        category: "Strength",
        muscleGroup: "Legs",
        equipment: "Barbell",
        difficulty: "Intermediate",
        instructions: "Stand with feet shoulder-width apart, bar on upper back. Lower by bending knees and hips, keeping chest up. Drive through heels to return to start.",
        videoUrl: "https://www.youtube.com/watch?v=ultWZbUMPL8",
        thumbnailUrl: "",
      },
      {
        name: "Bench Press",
        category: "Strength",
        muscleGroup: "Chest",
        equipment: "Barbell",
        difficulty: "Intermediate",
        instructions: "Lie on bench with feet flat on floor. Lower bar to chest with controlled motion. Press bar up until arms are fully extended.",
        videoUrl: "https://www.youtube.com/watch?v=rT7DgCr-3pg",
        thumbnailUrl: "",
      },
      {
        name: "Deadlift",
        category: "Strength",
        muscleGroup: "Back",
        equipment: "Barbell",
        difficulty: "Advanced",
        instructions: "Stand with feet hip-width apart, bar over midfoot. Bend at hips and knees to grip bar. Lift by extending hips and knees, keeping back straight.",
        videoUrl: "https://www.youtube.com/watch?v=op9kVnSso6Q",
        thumbnailUrl: "",
      },
      {
        name: "Pull-ups",
        category: "Strength",
        muscleGroup: "Back",
        equipment: "Bodyweight",
        difficulty: "Intermediate",
        instructions: "Hang from bar with overhand grip. Pull body up until chin is over bar. Lower with control to full hang.",
        videoUrl: "https://www.youtube.com/watch?v=eGo4IYlbE5g",
        thumbnailUrl: "",
      },
      {
        name: "Push-ups",
        category: "Strength",
        muscleGroup: "Chest",
        equipment: "Bodyweight",
        difficulty: "Beginner",
        instructions: "Start in plank position with hands shoulder-width apart. Lower body until chest nearly touches floor. Push back up to start.",
        videoUrl: "https://www.youtube.com/watch?v=IODxDxX7oi4",
        thumbnailUrl: "",
      },
    ];

    sampleExercises.forEach(exercise => {
      const id = randomUUID();
      this.exercises.set(id, { ...exercise, id });
    });

    const sampleAthletes: InsertAthlete[] = [
      {
        name: "John Smith",
        email: "john.smith@example.com",
        team: "Varsity Football",
        position: "Quarterback",
        avatarUrl: "",
      },
      {
        name: "Sarah Johnson",
        email: "sarah.j@example.com",
        team: "Women's Basketball",
        position: "Point Guard",
        avatarUrl: "",
      },
      {
        name: "Mike Williams",
        email: "mike.w@example.com",
        team: "Track & Field",
        position: "Sprinter",
        avatarUrl: "",
      },
    ];

    sampleAthletes.forEach(athlete => {
      const id = randomUUID();
      this.athletes.set(id, { ...athlete, id, dateJoined: new Date() });
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getExercises(): Promise<Exercise[]> {
    return Array.from(this.exercises.values());
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    return this.exercises.get(id);
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const id = randomUUID();
    const newExercise: Exercise = { ...exercise, id };
    this.exercises.set(id, newExercise);
    return newExercise;
  }

  async updateExercise(id: string, exercise: Partial<InsertExercise>): Promise<Exercise | undefined> {
    const existing = this.exercises.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...exercise };
    this.exercises.set(id, updated);
    return updated;
  }

  async deleteExercise(id: string): Promise<boolean> {
    return this.exercises.delete(id);
  }

  async getAthletes(): Promise<Athlete[]> {
    return Array.from(this.athletes.values());
  }

  async getAthlete(id: string): Promise<Athlete | undefined> {
    return this.athletes.get(id);
  }

  async createAthlete(athlete: InsertAthlete): Promise<Athlete> {
    const id = randomUUID();
    const newAthlete: Athlete = { ...athlete, id, dateJoined: new Date() };
    this.athletes.set(id, newAthlete);
    return newAthlete;
  }

  async updateAthlete(id: string, athlete: Partial<InsertAthlete>): Promise<Athlete | undefined> {
    const existing = this.athletes.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...athlete };
    this.athletes.set(id, updated);
    return updated;
  }

  async deleteAthlete(id: string): Promise<boolean> {
    return this.athletes.delete(id);
  }

  async getPrograms(): Promise<Program[]> {
    return Array.from(this.programs.values());
  }

  async getProgram(id: string): Promise<Program | undefined> {
    return this.programs.get(id);
  }

  async createProgram(program: InsertProgram): Promise<Program> {
    const id = randomUUID();
    const newProgram: Program = { ...program, id, createdAt: new Date() };
    this.programs.set(id, newProgram);
    return newProgram;
  }

  async updateProgram(id: string, program: Partial<InsertProgram>): Promise<Program | undefined> {
    const existing = this.programs.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...program };
    this.programs.set(id, updated);
    return updated;
  }

  async deleteProgram(id: string): Promise<boolean> {
    return this.programs.delete(id);
  }

  async getProgramExercises(programId: string): Promise<ProgramExercise[]> {
    return Array.from(this.programExercises.values()).filter(
      (pe) => pe.programId === programId
    );
  }

  async createProgramExercise(programExercise: InsertProgramExercise): Promise<ProgramExercise> {
    const id = randomUUID();
    const newProgramExercise: ProgramExercise = { ...programExercise, id };
    this.programExercises.set(id, newProgramExercise);
    return newProgramExercise;
  }

  async deleteProgramExercise(id: string): Promise<boolean> {
    return this.programExercises.delete(id);
  }

  async getAthletePrograms(athleteId: string): Promise<AthleteProgram[]> {
    return Array.from(this.athletePrograms.values()).filter(
      (ap) => ap.athleteId === athleteId
    );
  }

  async createAthleteProgram(athleteProgram: InsertAthleteProgram): Promise<AthleteProgram> {
    const id = randomUUID();
    const newAthleteProgram: AthleteProgram = { ...athleteProgram, id };
    this.athletePrograms.set(id, newAthleteProgram);
    return newAthleteProgram;
  }

  async updateAthleteProgram(id: string, status: string): Promise<AthleteProgram | undefined> {
    const existing = this.athletePrograms.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, status };
    this.athletePrograms.set(id, updated);
    return updated;
  }

  async getWorkoutLogs(athleteId?: string): Promise<WorkoutLog[]> {
    const allLogs = Array.from(this.workoutLogs.values());
    if (athleteId) {
      return allLogs.filter((log) => log.athleteId === athleteId);
    }
    return allLogs;
  }

  async createWorkoutLog(workoutLog: InsertWorkoutLog): Promise<WorkoutLog> {
    const id = randomUUID();
    const newLog: WorkoutLog = { ...workoutLog, id, completedAt: new Date() };
    this.workoutLogs.set(id, newLog);
    return newLog;
  }

  async getPersonalRecords(athleteId?: string): Promise<PersonalRecord[]> {
    const allRecords = Array.from(this.personalRecords.values());
    if (athleteId) {
      return allRecords.filter((record) => record.athleteId === athleteId);
    }
    return allRecords;
  }

  async createPersonalRecord(record: InsertPersonalRecord): Promise<PersonalRecord> {
    const id = randomUUID();
    const newRecord: PersonalRecord = { ...record, id, achievedAt: new Date() };
    this.personalRecords.set(id, newRecord);
    return newRecord;
  }
}

export const storage = new MemStorage();
