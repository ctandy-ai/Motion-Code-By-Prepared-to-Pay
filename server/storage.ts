import { 
  exercises, 
  users, 
  organizations,
  programs,
  programSessions,
  sessionExercises,
  athletePrograms,
  workoutLogs,
  exerciseLogs,
  passwordResetTokens,
  athleteProfiles,
  clinics,
  microSessions,
  sessionCompletions,
  coachTeams,
  teamMembers,
  communityBoards,
  communityPosts,
  postComments,
  postLikes,
  commentLikes,
  partnerOrganisations,
  achievements,
  userAchievements,
  type Exercise, 
  type InsertExercise, 
  type User, 
  type UpsertUser,
  type Organization,
  type InsertOrganization,
  type Program,
  type InsertProgram,
  type ProgramSession,
  type InsertProgramSession,
  type SessionExercise,
  type InsertSessionExercise,
  type AthleteProgram,
  type InsertAthleteProgram,
  type WorkoutLog,
  type InsertWorkoutLog,
  type ExerciseLog,
  type InsertExerciseLog,
  type AthleteProfile,
  type InsertAthleteProfile,
  type Clinic,
  type InsertClinic,
  type MicroSession,
  type CoachTeam,
  type InsertCoachTeam,
  type SessionCompletion,
  type CommunityBoard,
  type InsertCommunityBoard,
  type CommunityPost,
  type InsertCommunityPost,
  type PostComment,
  type InsertPostComment,
  type PartnerOrganisation,
  type ClinicReferral,
  type InsertClinicReferral,
  clinicReferrals,
  educationModules,
  moduleCompletions,
  injuryReports,
  athleteSessionCompletions,
  type InjuryReport,
  type InsertInjuryReport,
  type AthleteSessionCompletion,
  type InsertAthleteSessionCompletion,
  // GitHub MC Pro types
  type Athlete,
  type InsertAthlete,
  type Team,
  type InsertTeam,
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
  type AthleteTarget,
  type InsertAthleteTarget,
  type Announcement,
  type InsertAnnouncement,
  type BodyCompositionLog,
  type InsertBodyCompositionLog,
  type CustomSurvey,
  type InsertCustomSurvey,
  type TeamSession,
  type InsertTeamSession,
  type SessionParticipant,
  type InsertSessionParticipant,
  type NormativeCohort,
  type NormativeMetric,
  athletes,
  teams,
  athleteTeams,
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
  athleteTargets,
  announcements,
  bodyCompositionLogs,
  customSurveys,
  teamSessions,
  sessionParticipants,
  normativeCohorts,
  normativeMetrics,
  athleteStats,
  type AthleteStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, ilike, gte, lte, lt, arrayContains, sql, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  
  // Organization operations
  createOrganization(org: InsertOrganization): Promise<Organization>;
  getOrganization(id: number): Promise<Organization | undefined>;
  updateOrganization(id: number, updates: Partial<InsertOrganization>): Promise<Organization>;
  getUsersInOrganization(organizationId: number): Promise<User[]>;
  
  // Password reset operations
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  getPasswordResetToken(token: string): Promise<{id: number, userId: string, token: string, expiresAt: Date, used: boolean} | undefined>;
  markTokenAsUsed(tokenId: number): Promise<void>;
  
  // Exercise operations
  getAllExercises(organizationId?: number): Promise<Exercise[]>;
  getExerciseById(id: number): Promise<Exercise | undefined>;
  getExercisesByComponent(component: string, organizationId?: number): Promise<Exercise[]>;
  getExercisesByBeltLevel(beltLevel: string, organizationId?: number): Promise<Exercise[]>;
  searchExercises(query: string, filters?: any, organizationId?: number): Promise<Exercise[]>;
  getExercisesWithFilters(filters: any, organizationId?: number): Promise<Exercise[]>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  updateExercise(id: number, updates: Partial<InsertExercise>): Promise<Exercise>;
  deleteExercise(id: number): Promise<void>;
  updateExerciseVideoUrls(id: number, videoUrl: string, thumbnailUrl: string): Promise<Exercise>;
  
  // Program operations
  createProgram(program: InsertProgram): Promise<Program>;
  getProgramsByOrganization(organizationId: number): Promise<Program[]>;
  getProgramById(id: number): Promise<Program | undefined>;
  createProgramSession(session: InsertProgramSession): Promise<ProgramSession>;
  addExerciseToSession(sessionExercise: InsertSessionExercise): Promise<SessionExercise>;
  
  // Athlete management
  assignProgramToAthlete(assignment: InsertAthleteProgram): Promise<AthleteProgram>;
  getAthletePrograms(athleteId: string): Promise<AthleteProgram[]>;
  getAthletesForCoach(coachId: string): Promise<User[]>;
  
  // Workout logging
  createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog>;
  logExercise(exerciseLog: InsertExerciseLog): Promise<ExerciseLog>;
  getWorkoutHistory(athleteId: string): Promise<WorkoutLog[]>;
  
  // Athlete profile operations
  getAthleteProfile(userId: string): Promise<AthleteProfile | undefined>;
  upsertAthleteProfile(profile: InsertAthleteProfile & { userId: string }): Promise<AthleteProfile>;
  getTodaySession(userId: string): Promise<MicroSession | null>;
  getWeekProgress(userId: string): Promise<{ completed: number; total: number }>;
  
  // Clinic operations
  getClinics(filters?: { state?: string; services?: string[]; search?: string }): Promise<Clinic[]>;
  getClinicById(id: number): Promise<Clinic | undefined>;
  createClinicReferral(data: InsertClinicReferral): Promise<ClinicReferral>;
  getUserReferrals(userId: string): Promise<(ClinicReferral & { clinic: Clinic })[]>;
  
  // Coach operations
  getCoachTeams(coachId: string): Promise<CoachTeam[]>;
  getCoachStats(coachId: string): Promise<{ totalAthletes: number; completedThisWeek: number; averageCompliance: number }>;
  createTeam(team: InsertCoachTeam & { coachId: string }): Promise<CoachTeam>;
  getCoachComplianceData(coachId: string): Promise<{
    totalAthletes: number;
    averageCompliance: number;
    atRiskCount: number;
    weekNumber: number;
    totalSessionsThisWeek: number;
    mostActiveAthlete: { name: string; sessions: number } | null;
    leastActiveAthlete: { name: string; sessions: number } | null;
    athletes: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      club: string | null;
      beltLevel: string;
      weeklyCompleted: number;
      monthlyCompleted: number[];
      compliancePercent: number;
      status: string;
      lastActive: Date | null;
    }[];
  }>;
  getCoachTeamsWithMembers(coachId: string): Promise<(CoachTeam & { memberCount: number })[]>;
  
  // Community operations
  getCommunityBoards(userRole: string): Promise<CommunityBoard[]>;
  getBoardBySlug(slug: string): Promise<CommunityBoard | undefined>;
  getBoardPosts(boardId: number, limit?: number, offset?: number): Promise<(CommunityPost & { author: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role'> })[]>;
  getPostById(postId: number): Promise<(CommunityPost & { author: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role'> }) | undefined>;
  createPost(post: InsertCommunityPost): Promise<CommunityPost>;
  getPostComments(postId: number): Promise<(PostComment & { author: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role'> })[]>;
  createComment(comment: InsertPostComment): Promise<PostComment>;
  togglePostLike(postId: number, userId: string): Promise<boolean>;
  incrementPostViews(postId: number): Promise<void>;
  
  // Partner organisation operations
  getPartnerOrgByCode(code: string): Promise<PartnerOrganisation | undefined>;
  getPartnerOrgBySlug(slug: string): Promise<PartnerOrganisation | undefined>;
  getPartnerOrgById(id: number): Promise<PartnerOrganisation | undefined>;
  updateUserLocation(userId: string, state: string, region: string, club: string): Promise<void>;

  // NSO Analytics operations
  getNSOAnalytics(partnerOrgId?: number): Promise<{
    totalAthletes: number;
    activeThisWeek: number;
    averageCompliance: number;
    totalSessionsMonth: number;
    byState: {
      state: string;
      athleteCount: number;
      activeCount: number;
      activePercent: number;
      avgSessionsWeek: number;
      topClub: string;
    }[];
    weeklyTrend: { week: string; compliance: number }[];
  }>;
  getNSOWeeklyTrend(partnerOrgId?: number): Promise<{ week: string; compliance: number }[]>;

  // Achievement operations
  // Education module operations
  getEducationModules(accessLevel: string): Promise<any[]>;
  getEducationModule(id: number): Promise<any | undefined>;
  completeModule(userId: string, moduleId: number): Promise<any>;
  getUserModuleCompletions(userId: string): Promise<number[]>;
  getEducationProgress(userId: string): Promise<{ completed: number; total: number }>;

  getAllAchievements(): Promise<any[]>;
  getUserAchievements(userId: string): Promise<any[]>;
  awardAchievement(userId: string, achievementId: number): Promise<void>;

  // Injury reports (T008 — Berkshire commercial priority)
  createInjuryReport(report: InsertInjuryReport): Promise<InjuryReport>;
  getInjuryReportsByCoach(coachId: string): Promise<InjuryReport[]>;
  getInjuryReportStats(): Promise<{ total: number; byBodyPart: Record<string, number>; highPain: number; referralRate: number }>;

  // Athlete session completions (from session player)
  recordSessionCompletion(data: InsertAthleteSessionCompletion): Promise<AthleteSessionCompletion>;
  getSessionCompletionsForUser(userId: string): Promise<AthleteSessionCompletion[]>;

  getAthleteProgress(userId: string): Promise<{
    readinessScore: number;
    currentStreak: number;
    longestStreak: number;
    totalSessions: number;
    weeklyCompleted: number;
    weeklyTarget: number;
    weekDays: boolean[];
    currentBelt: string;
    beltProgress: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Password reset operations
  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
    });
  }

  async getPasswordResetToken(token: string): Promise<{id: number, userId: string, token: string, expiresAt: Date, used: boolean} | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken;
  }

  async markTokenAsUsed(tokenId: number): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, tokenId));
  }

  // Organization operations
  async createOrganization(orgData: InsertOrganization): Promise<Organization> {
    const [organization] = await db
      .insert(organizations)
      .values(orgData)
      .returning();
    return organization;
  }

  async getOrganization(id: number): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async updateOrganization(id: number, updates: Partial<InsertOrganization>): Promise<Organization> {
    const [org] = await db
      .update(organizations)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id))
      .returning();
    return org;
  }

  async getUsersInOrganization(organizationId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.organizationId, organizationId));
  }

  // Exercise operations
  async getAllExercises(organizationId?: number): Promise<Exercise[]> {
    if (organizationId) {
      // Return both global exercises (pre-built) and organization-specific exercises
      return await db.select().from(exercises).where(
        or(
          eq(exercises.isCustom, false), // Global exercises
          eq(exercises.organizationId, organizationId) // Organization exercises
        )
      );
    } else {
      // Return only global exercises
      return await db.select().from(exercises).where(eq(exercises.isCustom, false));
    }
  }

  async getExerciseById(id: number): Promise<Exercise | undefined> {
    const [exercise] = await db.select().from(exercises).where(eq(exercises.id, id));
    return exercise;
  }

  async getExercisesByComponent(component: string, organizationId?: number): Promise<Exercise[]> {
    const baseQuery = eq(exercises.component, component);
    
    if (organizationId) {
      return await db.select().from(exercises).where(
        and(
          baseQuery,
          or(
            eq(exercises.isCustom, false),
            eq(exercises.organizationId, organizationId)
          )
        )
      );
    } else {
      return await db.select().from(exercises).where(
        and(baseQuery, eq(exercises.isCustom, false))
      );
    }
  }

  async getExercisesByBeltLevel(beltLevel: string, organizationId?: number): Promise<Exercise[]> {
    const baseQuery = eq(exercises.beltLevel, beltLevel);
    
    if (organizationId) {
      return await db.select().from(exercises).where(
        and(
          baseQuery,
          or(
            eq(exercises.isCustom, false),
            eq(exercises.organizationId, organizationId)
          )
        )
      );
    } else {
      return await db.select().from(exercises).where(
        and(baseQuery, eq(exercises.isCustom, false))
      );
    }
  }

  async getExercisesByComponentAndBeltLevel(component: string, beltLevel: string, organizationId?: number): Promise<Exercise[]> {
    const baseQuery = and(
      eq(exercises.component, component),
      eq(exercises.beltLevel, beltLevel)
    );
    
    if (organizationId) {
      return await db.select().from(exercises).where(
        and(
          baseQuery,
          or(
            eq(exercises.isCustom, false),
            eq(exercises.organizationId, organizationId)
          )
        )
      );
    } else {
      return await db.select().from(exercises).where(
        and(baseQuery, eq(exercises.isCustom, false))
      );
    }
  }

  async searchExercises(query: string, filters?: any, organizationId?: number): Promise<Exercise[]> {
    const lowerQuery = `%${query.toLowerCase()}%`;
    const searchConditions = or(
      ilike(exercises.name, lowerQuery),
      ilike(exercises.description, lowerQuery),
      ilike(exercises.category, lowerQuery),
      ilike(exercises.equipment, lowerQuery)
    );

    // Build additional filter conditions
    const filterConditions = this.buildFilterConditions(filters);
    
    const allConditions = filterConditions.length > 0 
      ? and(searchConditions, ...filterConditions)
      : searchConditions;
    
    if (organizationId) {
      return await db.select().from(exercises).where(
        and(
          allConditions,
          or(
            eq(exercises.isCustom, false),
            eq(exercises.organizationId, organizationId)
          )
        )
      );
    } else {
      return await db.select().from(exercises).where(
        and(allConditions, eq(exercises.isCustom, false))
      );
    }
  }

  async getExercisesWithFilters(filters: any, organizationId?: number): Promise<Exercise[]> {
    const filterConditions = this.buildFilterConditions(filters);
    
    if (organizationId) {
      const baseConditions = filterConditions.length > 0 
        ? and(...filterConditions) 
        : undefined;
        
      const whereClause = baseConditions 
        ? and(
            baseConditions,
            or(
              eq(exercises.isCustom, false),
              eq(exercises.organizationId, organizationId)
            )
          )
        : or(
            eq(exercises.isCustom, false),
            eq(exercises.organizationId, organizationId)
          );
          
      return await db.select().from(exercises).where(whereClause);
    } else {
      const baseConditions = filterConditions.length > 0 
        ? and(...filterConditions, eq(exercises.isCustom, false))
        : eq(exercises.isCustom, false);
        
      return await db.select().from(exercises).where(baseConditions);
    }
  }

  private buildFilterConditions(filters?: any): any[] {
    if (!filters) return [];
    
    const conditions: any[] = [];
    
    if (filters.component) {
      conditions.push(eq(exercises.component, filters.component));
    }
    if (filters.beltLevel) {
      conditions.push(eq(exercises.beltLevel, filters.beltLevel));
    }
    if (filters.trainingPhase) {
      conditions.push(eq(exercises.trainingPhase, filters.trainingPhase));
    }
    if (filters.progressionLevel) {
      conditions.push(eq(exercises.progressionLevel, filters.progressionLevel));
    }
    if (filters.weekIntroduced) {
      conditions.push(eq(exercises.weekIntroduced, filters.weekIntroduced));
    }
    if (filters.complexityRating) {
      conditions.push(eq(exercises.complexityRating, filters.complexityRating));
    }
    if (filters.skillFocus && Array.isArray(filters.skillFocus)) {
      // Check if exercise skill_focus array contains any of the requested skills
      const skillConditions = filters.skillFocus.map((skill: string) => 
        ilike(exercises.skillFocus, `%${skill}%`)
      );
      conditions.push(or(...skillConditions));
    }
    
    return conditions;
  }

  async createExercise(exerciseData: InsertExercise): Promise<Exercise> {
    const [exercise] = await db
      .insert(exercises)
      .values(exerciseData)
      .returning();
    return exercise;
  }

  async updateExercise(id: number, updates: Partial<InsertExercise>): Promise<Exercise> {
    const [exercise] = await db
      .update(exercises)
      .set({ ...updates })
      .where(eq(exercises.id, id))
      .returning();
    return exercise;
  }

  async deleteExercise(id: number): Promise<void> {
    await db.delete(exercises).where(eq(exercises.id, id));
  }

  async updateExerciseVideoUrls(id: number, videoUrl: string, thumbnailUrl: string): Promise<Exercise> {
    const [exercise] = await db
      .update(exercises)
      .set({ 
        videoUrl: videoUrl,
        thumbnailUrl: thumbnailUrl 
      })
      .where(eq(exercises.id, id))
      .returning();
    return exercise;
  }

  // Program operations
  async createProgram(programData: InsertProgram): Promise<Program> {
    const [program] = await db
      .insert(programs)
      .values(programData)
      .returning();
    return program;
  }

  async getProgramsByOrganization(organizationId: number): Promise<Program[]> {
    return await db.select().from(programs).where(eq(programs.organizationId, organizationId));
  }

  async getProgramById(id: number): Promise<Program | undefined> {
    const [program] = await db.select().from(programs).where(eq(programs.id, id));
    return program;
  }

  async createProgramSession(sessionData: InsertProgramSession): Promise<ProgramSession> {
    const [session] = await db
      .insert(programSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async addExerciseToSession(sessionExerciseData: InsertSessionExercise): Promise<SessionExercise> {
    const [sessionExercise] = await db
      .insert(sessionExercises)
      .values(sessionExerciseData)
      .returning();
    return sessionExercise;
  }

  // Athlete management
  async assignProgramToAthlete(assignmentData: InsertAthleteProgram): Promise<AthleteProgram> {
    const [assignment] = await db
      .insert(athletePrograms)
      .values(assignmentData)
      .returning();
    return assignment;
  }

  async getAthletePrograms(athleteId: string): Promise<AthleteProgram[]> {
    return await db.select().from(athletePrograms).where(eq(athletePrograms.athleteId, athleteId));
  }

  async getAthletesForCoach(coachId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.coachId, coachId));
  }

  // Workout logging
  async createWorkoutLog(logData: InsertWorkoutLog): Promise<WorkoutLog> {
    const [log] = await db
      .insert(workoutLogs)
      .values(logData)
      .returning();
    return log;
  }

  async logExercise(exerciseLogData: InsertExerciseLog): Promise<ExerciseLog> {
    const [exerciseLog] = await db
      .insert(exerciseLogs)
      .values(exerciseLogData)
      .returning();
    return exerciseLog;
  }

  async getWorkoutHistory(athleteId: string): Promise<WorkoutLog[]> {
    return await db.select().from(workoutLogs).where(eq(workoutLogs.athleteId, athleteId));
  }

  // Initialize database with seed data
  async initializeDatabase(): Promise<void> {
    // Check if exercises already exist
    const existingExercises = await db.select().from(exercises).limit(1);
    if (existingExercises.length > 0) {
      return; // Database already initialized
    }

    // Seed with P2P exercise data
    const seedExercises = this.getSeedExercises();
    for (const exercise of seedExercises) {
      await this.createExercise(exercise);
    }
  }

  private generateVideoUrl(component: string, beltLevel: string, exerciseName: string): string {
    // Map component names to folder names
    const componentFolders = {
      'acceleration': 'starting',
      'deceleration': 'stopping', 
      'change-direction': 'stepping',
      'top-speed': 'sprinting'
    };
    
    const folder = componentFolders[component as keyof typeof componentFolders] || component;
    const fileName = exerciseName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `/public-objects/${folder}/${beltLevel}-belt/${fileName}.mp4`;
  }

  private generateThumbnailUrl(component: string, beltLevel: string, exerciseName: string): string {
    // Generate dynamic thumbnail URL that will extract from video
    const exerciseId = `${component}-${beltLevel}-${exerciseName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    return `/api/thumbnails/${exerciseId}`;
  }

  private getSeedExercises(): InsertExercise[] {
    const exercises = this.getBaseExercises();
    // Generate video URLs automatically based on folder structure
    return exercises.map(exercise => ({
      ...exercise,
      videoUrl: this.generateVideoUrl(exercise.component, exercise.beltLevel, exercise.name),
      thumbnailUrl: this.generateThumbnailUrl(exercise.component, exercise.beltLevel, exercise.name)
    }));
  }
  
  private getBaseExercises() {
    return [
      // ACCELERATION (STARTING) - 300-180ms contact times
      // White Belt
      {
        name: "Bosch Lateral Box Jump",
        description: "Rudimentary lateral jumping exercise developing basic reactive strength patterns. Foundation movement for acceleration power development with 300-180ms contact times.",
        category: "Starting Fundamentals",
        component: "acceleration",
        beltLevel: "white",
        duration: "8-12 min",
        equipment: "Plyo box",
        coachingCues: ["Soft landing", "Quick ground contact", "Maintain balance", "Control lateral movement"],

        isCustom: false
      },
      {
        name: "Split Jump (1 Exchange)",
        description: "Basic alternating leg jump focusing on producing-extending force patterns. Essential for initial acceleration mechanics development.",
        category: "Starting Fundamentals", 
        component: "acceleration",
        beltLevel: "white",
        duration: "6-10 min",
        equipment: "Body weight",
        coachingCues: ["Drive through front leg", "Quick leg exchange", "Maintain upright posture", "Land with control"],
        isCustom: false
      },
      {
        name: "Knees to Feet → CMJ",
        description: "Progressive movement from kneeling to countermovement jump. Develops initial power production for acceleration starts.",
        category: "Starting Fundamentals",
        component: "acceleration", 
        beltLevel: "white",
        duration: "5-8 min",
        equipment: "Body weight",
        coachingCues: ["Explosive hip extension", "Quick transition", "Full body coordination", "Soft landing"],
        isCustom: false
      },
      // Blue Belt
      {
        name: "Split Jump (1-2 Exchanges)",
        description: "Progressive alternating leg jumps with multiple exchanges. Develops intermediate reactive strength for acceleration power.",
        category: "Starting Intermediate",
        component: "acceleration",
        beltLevel: "blue", 
        duration: "10-15 min",
        equipment: "Body weight",
        coachingCues: ["Maintain rhythm", "Quick leg turnover", "Consistent jump height", "Control breathing"],
        isCustom: false
      },
      {
        name: "Knees to Feet → Jump",
        description: "Advanced progression from kneeling position to vertical jump. Enhanced power development for acceleration mechanics.",
        category: "Starting Intermediate",
        component: "acceleration",
        beltLevel: "blue",
        duration: "8-12 min", 
        equipment: "Body weight",
        coachingCues: ["Explosive transition", "Maximum jump height", "Athletic landing", "Quick recovery"],
        isCustom: false
      },
      {
        name: "Lizard Leaps (Discontinuous)",
        description: "Dynamic forward bounding movement with rest between reps. Develops horizontal force production for acceleration.",
        category: "Starting Intermediate",
        component: "acceleration",
        beltLevel: "blue",
        duration: "12-18 min",
        equipment: "Body weight",
        coachingCues: ["Forward projection", "Powerful push-off", "Athletic landing position", "Reset between reps"],
        isCustom: false
      },
      // Black Belt
      {
        name: "Knees to Feet → Hop",
        description: "Elite progression combining kneeling start with single-leg hopping. Maximum reactive strength development for acceleration.",
        category: "Starting Advanced", 
        component: "acceleration",
        beltLevel: "black",
        duration: "15-20 min",
        equipment: "Body weight",
        coachingCues: ["Maximal power output", "Perfect technique", "Single-leg stability", "Immediate reactive response"],
        isCustom: false
      },
      {
        name: "Standing Triple Jump (Decel Not Emphasised)",
        description: "Advanced horizontal power exercise focusing on distance and speed. Elite acceleration power development.",
        category: "Starting Advanced",
        component: "acceleration", 
        beltLevel: "black",
        duration: "18-25 min",
        equipment: "Body weight, measuring tape",
        coachingCues: ["Maximum horizontal distance", "Consistent rhythm", "Powerful take-offs", "Focus on projection not landing"],
        isCustom: false
      },

      // DECELERATION (STOPPING) - 200-250ms contact times  
      // White Belt
      {
        name: "Korean Skaters",
        description: "Basic lateral deceleration exercise developing reception-bending force patterns. Foundation for safe stopping mechanics with 200-250ms contact times.",
        category: "Stopping Fundamentals",
        component: "deceleration",
        beltLevel: "white",
        duration: "8-12 min",
        equipment: "Body weight",
        coachingCues: ["Control the landing", "Absorb force through legs", "Maintain posture", "Stable single-leg stance"],
        isCustom: false
      },
      {
        name: "Borzov Hop",
        description: "Controlled single-leg hopping exercise focusing on eccentric strength. Essential for developing deceleration capacity.",
        category: "Stopping Fundamentals",
        component: "deceleration", 
        beltLevel: "white",
        duration: "6-10 min",
        equipment: "Body weight",
        coachingCues: ["Soft landings", "Control each hop", "Maintain alignment", "Focus on absorption"],
        isCustom: false
      },
      // Blue Belt  
      {
        name: "Frog Hops (Discontinuous)",
        description: "Bilateral hopping with emphasis on controlled landings. Intermediate deceleration strength development.",
        category: "Stopping Intermediate",
        component: "deceleration",
        beltLevel: "blue",
        duration: "12-16 min", 
        equipment: "Body weight",
        coachingCues: ["Deep landing position", "Pause between reps", "Control descent", "Powerful extension"],
        isCustom: false
      },
      {
        name: "Lateral Bounding (Low-Med Amplitude)",
        description: "Controlled lateral movements focusing on deceleration and stabilization. Progressive overload for stopping mechanics.",
        category: "Stopping Intermediate",
        component: "deceleration",
        beltLevel: "blue",
        duration: "10-15 min",
        equipment: "Body weight",
        coachingCues: ["Controlled lateral movement", "Stable landings", "Progressive distance", "Maintain balance"],
        isCustom: false
      },
      // Black Belt
      {
        name: "Depth Jumps", 
        description: "Advanced reactive exercise emphasizing rapid deceleration from height. Elite eccentric strength development.",
        category: "Stopping Advanced",
        component: "deceleration",
        beltLevel: "black",
        duration: "15-20 min",
        equipment: "Plyo box (30-45cm)",
        coachingCues: ["Minimal ground contact", "Immediate reactive jump", "Perfect landing mechanics", "Maximum power output"],
        isCustom: false
      },
      {
        name: "Standing Triple Jump (Fixed 2-Foot Landing)", 
        description: "Elite horizontal jumping with emphasis on controlled bilateral landing. Advanced deceleration training.",
        category: "Stopping Advanced",
        component: "deceleration",
        beltLevel: "black", 
        duration: "18-25 min",
        equipment: "Body weight, measuring tape",
        coachingCues: ["Stick the landing", "Absorb all force", "Perfect bilateral control", "No forward steps"],
        isCustom: false
      },

      // CHANGE OF DIRECTION (STEPPING) - 200-250ms contact times
      // White Belt
      {
        name: "Bosch Lateral Box Jump (COD)",
        description: "Basic lateral jumping focusing on redirection-extending forces. Foundation for 45-degree cutting mechanics with 200-250ms contact times.", 
        category: "Stepping Fundamentals",
        component: "change-direction",
        beltLevel: "white",
        duration: "8-12 min",
        equipment: "Plyo box",
        coachingCues: ["Land and redirect", "Control lateral force", "Maintain body position", "Quick directional change"],
        isCustom: false
      },
      {
        name: "Lateral Bounds (Basic)",
        description: "Fundamental lateral bounding exercise developing basic change of direction patterns. Essential for high-speed stepping mechanics.",
        category: "Stepping Fundamentals", 
        component: "change-direction",
        beltLevel: "white",
        duration: "6-10 min",
        equipment: "Body weight",
        coachingCues: ["Push off outside leg", "Land on opposite leg", "Control lateral momentum", "Maintain forward lean"],
        isCustom: false
      },
      {
        name: "Tuck Jumps",
        description: "Vertical jumping with knee-to-chest emphasis. Develops reactive strength for multi-directional movement patterns.",
        category: "Stepping Fundamentals",
        component: "change-direction",
        beltLevel: "white", 
        duration: "5-8 min",
        equipment: "Body weight", 
        coachingCues: ["Quick knee lift", "Soft landings", "Rapid cycle time", "Maintain vertical position"],
        isCustom: false
      },
      {
        name: "Pogos",
        description: "Rapid ankle-dominant jumping developing reactive stiffness for change of direction. Foundation for stepping mechanics.",
        category: "Stepping Fundamentals",
        component: "change-direction", 
        beltLevel: "white",
        duration: "4-8 min",
        equipment: "Body weight",
        coachingCues: ["Minimal knee bend", "Quick ground contact", "High frequency", "Spring-like action"],
        isCustom: false
      },
      {
        name: "Tic Tacs", 
        description: "Rapid alternating foot contacts developing coordination and reactive strength for directional changes.",
        category: "Stepping Fundamentals",
        component: "change-direction",
        beltLevel: "white",
        duration: "5-10 min", 
        equipment: "Body weight",
        coachingCues: ["Quick foot contacts", "Light on feet", "Maintain rhythm", "Stay on balls of feet"],
        isCustom: false
      },
      // Blue Belt
      {
        name: "Lateral Hops (Low-Med Amplitude)",
        description: "Progressive single-leg lateral hopping developing intermediate change of direction strength.",
        category: "Stepping Intermediate",
        component: "change-direction",
        beltLevel: "blue",
        duration: "10-15 min", 
        equipment: "Body weight",
        coachingCues: ["Single-leg control", "Progressive distance", "Stick landings", "Maintain alignment"],
        isCustom: false
      },
      {
        name: "Hurdle Jumps",
        description: "Multi-directional jumping over obstacles. Develops spatial awareness and reactive strength for complex movements.",
        category: "Stepping Intermediate", 
        component: "change-direction",
        beltLevel: "blue",
        duration: "12-18 min",
        equipment: "Hurdles (15-30cm)",
        coachingCues: ["Clear obstacles cleanly", "Maintain forward momentum", "Quick recovery", "Athletic landings"],
        isCustom: false
      },
      {
        name: "Alternate Amplitude Hops",
        description: "Variable distance hopping developing adaptability in change of direction movements.",
        category: "Stepping Intermediate",
        component: "change-direction", 
        beltLevel: "blue",
        duration: "10-16 min",
        equipment: "Body weight, markers",
        coachingCues: ["Vary hop distances", "Maintain balance", "Adapt to changes", "Consistent technique"],
        isCustom: false
      },
      // Black Belt
      {
        name: "Lateral Bounding (Speed & Distance)",
        description: "Elite lateral bounding emphasizing maximum velocity and distance. Advanced change of direction development.",
        category: "Stepping Advanced",
        component: "change-direction", 
        beltLevel: "black",
        duration: "15-25 min",
        equipment: "Body weight, measuring tape",
        coachingCues: ["Maximum lateral velocity", "Powerful push-offs", "Maintain speed", "Perfect technique at speed"],
        isCustom: false
      },
      {
        name: "Single Side Bounding (Speed)", 
        description: "Unilateral lateral bounding at maximum velocity. Elite single-leg power for high-speed direction changes.",
        category: "Stepping Advanced",
        component: "change-direction",
        beltLevel: "black",
        duration: "12-20 min",
        equipment: "Body weight", 
        coachingCues: ["Same leg only", "Maximum speed", "Perfect single-leg mechanics", "Maintain velocity throughout"],
        isCustom: false
      },

      // TOP SPEED (SPRINTING) - 90-120ms contact times
      // White Belt 
      {
        name: "Pogos (Top Speed)",
        description: "High-frequency ankle bouncing developing striking force patterns. Foundation for maximum speed with 90-120ms contact times.",
        category: "Sprinting Fundamentals",
        component: "top-speed", 
        beltLevel: "white",
        duration: "4-8 min",
        equipment: "Body weight",
        coachingCues: ["Minimal ground contact", "High frequency", "Ankle stiffness", "Light foot contacts"],
        isCustom: false
      },
      {
        name: "Tic Tacs (Top Speed)",
        description: "Rapid alternating contacts developing coordination and reactive stiffness for maximum velocity running.",
        category: "Sprinting Fundamentals",
        component: "top-speed",
        beltLevel: "white", 
        duration: "5-10 min",
        equipment: "Body weight",
        coachingCues: ["Quick light contacts", "High cadence", "Forward lean", "Minimal ground time"],
        isCustom: false
      },
      // Blue Belt
      {
        name: "Progressive Pogos",
        description: "Advanced ankle-spring exercise with increasing intensity. Intermediate development of maximum speed mechanics.",
        category: "Sprinting Intermediate", 
        component: "top-speed",
        beltLevel: "blue",
        duration: "8-15 min",
        equipment: "Body weight",
        coachingCues: ["Progressive intensity", "Maintain frequency", "Perfect technique", "Build to maximum"],
        isCustom: false
      },
      // Black Belt
      {
        name: "Speed Bounding",
        description: "Elite horizontal bounding at maximum velocity. Advanced development of striking force patterns for top speed.",
        category: "Sprinting Advanced",
        component: "top-speed",
        beltLevel: "black", 
        duration: "15-25 min",
        equipment: "Body weight, measuring tape",
        coachingCues: ["Maximum horizontal velocity", "Powerful ground strikes", "Maintain speed", "Perfect technique at pace"],
        isCustom: false
      },
      {
        name: "Speed Hops", 
        description: "Elite single-leg hopping at maximum velocity. Ultimate reactive strength development for sprinting performance.",
        category: "Sprinting Advanced", 
        component: "top-speed",
        beltLevel: "black",
        duration: "12-20 min",
        equipment: "Body weight",
        coachingCues: ["Maximum hop frequency", "Minimal ground contact", "Perfect single-leg mechanics", "Maintain maximum velocity"],
        isCustom: false
      }
    ];
  }

  // ========== ATHLETE PROFILE OPERATIONS ==========

  async getAthleteProfile(userId: string): Promise<AthleteProfile | undefined> {
    const [profile] = await db
      .select()
      .from(athleteProfiles)
      .where(eq(athleteProfiles.userId, userId));
    return profile;
  }

  async upsertAthleteProfile(profileData: InsertAthleteProfile & { userId: string }): Promise<AthleteProfile> {
    const [profile] = await db
      .insert(athleteProfiles)
      .values(profileData)
      .onConflictDoUpdate({
        target: athleteProfiles.userId,
        set: {
          ...profileData,
          updatedAt: new Date()
        }
      })
      .returning();
    return profile;
  }

  async getTodaySession(userId: string): Promise<MicroSession | null> {
    const profile = await this.getAthleteProfile(userId);
    const dayOfWeek = new Date().getDay() || 7;
    
    const conditions = [
      eq(microSessions.isActive, true)
    ];
    
    if (profile?.sport) {
      conditions.push(
        or(
          eq(microSessions.sport, profile.sport),
          eq(microSessions.sport, "general")
        ) as any
      );
    }
    
    const [session] = await db
      .select()
      .from(microSessions)
      .where(and(...conditions))
      .limit(1);
    
    return session || null;
  }

  async getWeekProgress(userId: string): Promise<{ completed: number; total: number }> {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const completions = await db
      .select()
      .from(athleteSessionCompletions)
      .where(
        and(
          eq(athleteSessionCompletions.userId, userId),
          gte(athleteSessionCompletions.completedAt, startOfWeek)
        )
      );
    
    return {
      completed: completions.length,
      total: 3
    };
  }

  // ========== CLINIC OPERATIONS ==========

  async getClinics(filters?: { state?: string; services?: string[]; search?: string }): Promise<Clinic[]> {
    const conditions = [eq(clinics.isActive, true)];
    
    if (filters?.state && filters.state !== "all") {
      conditions.push(eq(clinics.state, filters.state));
    }
    
    if (filters?.search) {
      conditions.push(
        or(
          ilike(clinics.name, `%${filters.search}%`),
          ilike(clinics.suburb, `%${filters.search}%`)
        ) as any
      );
    }
    
    const results = await db
      .select()
      .from(clinics)
      .where(and(...conditions))
      .orderBy(clinics.name);
    
    return results;
  }

  async getClinicById(id: number): Promise<Clinic | undefined> {
    const [clinic] = await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, id));
    return clinic;
  }

  async createClinicReferral(data: InsertClinicReferral): Promise<ClinicReferral> {
    const [referral] = await db
      .insert(clinicReferrals)
      .values(data)
      .returning();
    return referral;
  }

  async getUserReferrals(userId: string): Promise<(ClinicReferral & { clinic: Clinic })[]> {
    const results = await db
      .select({
        id: clinicReferrals.id,
        userId: clinicReferrals.userId,
        clinicId: clinicReferrals.clinicId,
        referralType: clinicReferrals.referralType,
        status: clinicReferrals.status,
        notes: clinicReferrals.notes,
        createdAt: clinicReferrals.createdAt,
        clinic: {
          id: clinics.id,
          name: clinics.name,
          description: clinics.description,
          address: clinics.address,
          suburb: clinics.suburb,
          state: clinics.state,
          postcode: clinics.postcode,
          country: clinics.country,
          latitude: clinics.latitude,
          longitude: clinics.longitude,
          phone: clinics.phone,
          email: clinics.email,
          website: clinics.website,
          bookingUrl: clinics.bookingUrl,
          logoUrl: clinics.logoUrl,
          isTripleHopProvider: clinics.isTripleHopProvider,
          isMovementScreeningProvider: clinics.isMovementScreeningProvider,
          isRehabBondClinic: clinics.isRehabBondClinic,
          isPreparedToPlayPartner: clinics.isPreparedToPlayPartner,
          services: clinics.services,
          specialties: clinics.specialties,
          managedByUserId: clinics.managedByUserId,
          isVerified: clinics.isVerified,
          isActive: clinics.isActive,
          createdAt: clinics.createdAt,
          updatedAt: clinics.updatedAt,
        }
      })
      .from(clinicReferrals)
      .leftJoin(clinics, eq(clinicReferrals.clinicId, clinics.id))
      .where(eq(clinicReferrals.userId, userId))
      .orderBy(desc(clinicReferrals.createdAt));
    return results as (ClinicReferral & { clinic: Clinic })[];
  }

  // ========== COACH OPERATIONS ==========

  async getCoachTeams(coachId: string): Promise<CoachTeam[]> {
    const teams = await db
      .select()
      .from(coachTeams)
      .where(and(eq(coachTeams.coachId, coachId), eq(coachTeams.isActive, true)))
      .orderBy(desc(coachTeams.createdAt));
    return teams;
  }

  async getCoachStats(coachId: string): Promise<{ totalAthletes: number; completedThisWeek: number; averageCompliance: number }> {
    const teams = await this.getCoachTeams(coachId);
    
    if (teams.length === 0) {
      return { totalAthletes: 0, completedThisWeek: 0, averageCompliance: 0 };
    }
    
    let totalAthletes = 0;
    
    for (const team of teams) {
      const members = await db
        .select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, team.id),
            eq(teamMembers.isActive, true)
          )
        );
      totalAthletes += members.length;
    }
    
    return {
      totalAthletes,
      completedThisWeek: 0,
      averageCompliance: 0
    };
  }

  async createTeam(teamData: InsertCoachTeam & { coachId: string }): Promise<CoachTeam> {
    const [team] = await db
      .insert(coachTeams)
      .values(teamData)
      .returning();
    return team;
  }

  async getCoachComplianceData(coachId: string): Promise<{
    totalAthletes: number;
    averageCompliance: number;
    atRiskCount: number;
    weekNumber: number;
    totalSessionsThisWeek: number;
    mostActiveAthlete: { name: string; sessions: number } | null;
    leastActiveAthlete: { name: string; sessions: number } | null;
    athletes: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      club: string | null;
      beltLevel: string;
      weeklyCompleted: number;
      monthlyCompleted: number[];
      compliancePercent: number;
      status: string;
      lastActive: Date | null;
    }[];
  }> {
    const teams = await this.getCoachTeams(coachId);
    
    if (teams.length === 0) {
      return {
        totalAthletes: 0, averageCompliance: 0, atRiskCount: 0,
        weekNumber: this.getCurrentWeekNumber(), totalSessionsThisWeek: 0,
        mostActiveAthlete: null, leastActiveAthlete: null, athletes: []
      };
    }

    const teamIds = teams.map(t => t.id);
    const allMembers = await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(and(
        sql`${teamMembers.teamId} IN (${sql.join(teamIds.map(id => sql`${id}`), sql`, `)})`,
        eq(teamMembers.isActive, true)
      ));

    const uniqueUserIds = Array.from(new Set(allMembers.map(m => m.userId)));

    if (uniqueUserIds.length === 0) {
      return {
        totalAthletes: 0, averageCompliance: 0, atRiskCount: 0,
        weekNumber: this.getCurrentWeekNumber(), totalSessionsThisWeek: 0,
        mostActiveAthlete: null, leastActiveAthlete: null, athletes: []
      };
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() + mondayOffset);
    thisMonday.setHours(0, 0, 0, 0);
    const thisSunday = new Date(thisMonday);
    thisSunday.setDate(thisMonday.getDate() + 6);
    thisSunday.setHours(23, 59, 59, 999);

    const fourWeeksAgo = new Date(thisMonday);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const twoWeeksAgo = new Date(thisMonday);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const athleteResults = [];
    let totalCompliance = 0;
    let atRiskCount = 0;
    let totalSessionsThisWeek = 0;
    let mostActive: { name: string; sessions: number } | null = null;
    let leastActive: { name: string; sessions: number } | null = null;

    for (const userId of uniqueUserIds) {
      const [userData] = await db.select().from(users).where(eq(users.id, userId));
      if (!userData) continue;

      const profile = await db.select().from(athleteProfiles).where(eq(athleteProfiles.userId, userId));
      const athleteProfile = profile.length > 0 ? profile[0] : null;

      const weekCompletions = await db
        .select()
        .from(athleteSessionCompletions)
        .where(and(
          eq(athleteSessionCompletions.userId, userId),
          gte(athleteSessionCompletions.completedAt, thisMonday),
          lte(athleteSessionCompletions.completedAt, thisSunday)
        ));
      const weeklyCompleted = weekCompletions.length;
      totalSessionsThisWeek += weeklyCompleted;

      const monthCompletions = await db
        .select()
        .from(athleteSessionCompletions)
        .where(and(
          eq(athleteSessionCompletions.userId, userId),
          gte(athleteSessionCompletions.completedAt, fourWeeksAgo),
          lte(athleteSessionCompletions.completedAt, thisSunday)
        ));

      const monthlyCompleted: number[] = [0, 0, 0, 0];
      for (const completion of monthCompletions) {
        if (completion.completedAt) {
          const weeksDiff = Math.floor((thisSunday.getTime() - completion.completedAt.getTime()) / (7 * 24 * 60 * 60 * 1000));
          const weekIndex = Math.min(3, weeksDiff);
          monthlyCompleted[3 - weekIndex]++;
        }
      }

      const twoWeekTarget = 6;
      const twoWeekCompletions = await db
        .select()
        .from(athleteSessionCompletions)
        .where(and(
          eq(athleteSessionCompletions.userId, userId),
          gte(athleteSessionCompletions.completedAt, twoWeeksAgo),
          lte(athleteSessionCompletions.completedAt, thisSunday)
        ));
      const twoWeekCompliance = Math.round((twoWeekCompletions.length / twoWeekTarget) * 100);

      const weeklyTarget = 3;
      const fourWeekTarget = weeklyTarget * 4;
      const totalFourWeekSessions = monthCompletions.length;
      const compliancePercent = Math.min(100, Math.round((totalFourWeekSessions / fourWeekTarget) * 100));

      let status = "On Track";
      if (compliancePercent < 50) {
        status = "At Risk";
        atRiskCount++;
      } else if (compliancePercent < 80) {
        status = "At Risk";
      }
      if (twoWeekCompletions.length === 0) {
        status = "Inactive";
      }

      const lastCompletion = await db
        .select()
        .from(athleteSessionCompletions)
        .where(eq(athleteSessionCompletions.userId, userId))
        .orderBy(desc(athleteSessionCompletions.completedAt))
        .limit(1);

      let currentBelt = "white";
      const totalSessions = athleteProfile?.totalSessionsCompleted || 0;
      if (totalSessions >= 36) currentBelt = "black";
      else if (totalSessions >= 12) currentBelt = "blue";

      const name = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email;
      if (mostActive === null || weeklyCompleted > mostActive.sessions) {
        mostActive = { name, sessions: weeklyCompleted };
      }
      if (leastActive === null || weeklyCompleted < leastActive.sessions) {
        leastActive = { name, sessions: weeklyCompleted };
      }

      totalCompliance += compliancePercent;

      athleteResults.push({
        id: userId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        club: userData.club,
        beltLevel: currentBelt,
        weeklyCompleted,
        monthlyCompleted,
        compliancePercent,
        status,
        lastActive: lastCompletion.length > 0 ? lastCompletion[0].completedAt : null,
      });
    }

    athleteResults.sort((a, b) => a.compliancePercent - b.compliancePercent);

    return {
      totalAthletes: uniqueUserIds.length,
      averageCompliance: uniqueUserIds.length > 0 ? Math.round(totalCompliance / uniqueUserIds.length) : 0,
      atRiskCount,
      weekNumber: this.getCurrentWeekNumber(),
      totalSessionsThisWeek,
      mostActiveAthlete: mostActive,
      leastActiveAthlete: leastActive,
      athletes: athleteResults,
    };
  }

  async getCoachTeamsWithMembers(coachId: string): Promise<(CoachTeam & { memberCount: number })[]> {
    const teams = await this.getCoachTeams(coachId);
    const results = [];
    for (const team of teams) {
      const members = await db
        .select()
        .from(teamMembers)
        .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.isActive, true)));
      results.push({ ...team, memberCount: members.length });
    }
    return results;
  }

  private getCurrentWeekNumber(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.ceil(diff / oneWeek);
  }

  // Community operations
  async getCommunityBoards(userRole: string): Promise<CommunityBoard[]> {
    const allBoards = await db
      .select()
      .from(communityBoards)
      .where(eq(communityBoards.isActive, true))
      .orderBy(communityBoards.sortOrder);
    
    return allBoards.filter(board => {
      if (board.accessLevel === 'all') return true;
      if (board.accessLevel === 'admin' && userRole === 'admin') return true;
      if (board.accessLevel === 'coach' && ['admin', 'coach'].includes(userRole)) return true;
      if (board.accessLevel === 'clinician' && ['admin', 'clinician'].includes(userRole)) return true;
      if (board.accessLevel === 'athlete' && ['admin', 'coach', 'athlete'].includes(userRole)) return true;
      return false;
    });
  }

  async getBoardBySlug(slug: string): Promise<CommunityBoard | undefined> {
    const [board] = await db
      .select()
      .from(communityBoards)
      .where(eq(communityBoards.slug, slug));
    return board;
  }

  async getBoardPosts(boardId: number, limit = 20, offset = 0): Promise<(CommunityPost & { author: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role'> })[]> {
    const posts = await db
      .select({
        id: communityPosts.id,
        boardId: communityPosts.boardId,
        authorId: communityPosts.authorId,
        title: communityPosts.title,
        content: communityPosts.content,
        isPinned: communityPosts.isPinned,
        isLocked: communityPosts.isLocked,
        viewCount: communityPosts.viewCount,
        likeCount: communityPosts.likeCount,
        commentCount: communityPosts.commentCount,
        createdAt: communityPosts.createdAt,
        updatedAt: communityPosts.updatedAt,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role,
        }
      })
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.authorId, users.id))
      .where(eq(communityPosts.boardId, boardId))
      .orderBy(desc(communityPosts.isPinned), desc(communityPosts.createdAt))
      .limit(limit)
      .offset(offset);
    
    return posts as (CommunityPost & { author: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role'> })[];
  }

  async getPostById(postId: number): Promise<(CommunityPost & { author: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role'> }) | undefined> {
    const [post] = await db
      .select({
        id: communityPosts.id,
        boardId: communityPosts.boardId,
        authorId: communityPosts.authorId,
        title: communityPosts.title,
        content: communityPosts.content,
        isPinned: communityPosts.isPinned,
        isLocked: communityPosts.isLocked,
        viewCount: communityPosts.viewCount,
        likeCount: communityPosts.likeCount,
        commentCount: communityPosts.commentCount,
        createdAt: communityPosts.createdAt,
        updatedAt: communityPosts.updatedAt,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role,
        }
      })
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.authorId, users.id))
      .where(eq(communityPosts.id, postId));
    
    return post as (CommunityPost & { author: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role'> }) | undefined;
  }

  async createPost(post: InsertCommunityPost): Promise<CommunityPost> {
    const [newPost] = await db
      .insert(communityPosts)
      .values(post)
      .returning();
    return newPost;
  }

  async getPostComments(postId: number): Promise<(PostComment & { author: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role'> })[]> {
    const comments = await db
      .select({
        id: postComments.id,
        postId: postComments.postId,
        authorId: postComments.authorId,
        parentId: postComments.parentId,
        content: postComments.content,
        likeCount: postComments.likeCount,
        createdAt: postComments.createdAt,
        updatedAt: postComments.updatedAt,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role,
        }
      })
      .from(postComments)
      .leftJoin(users, eq(postComments.authorId, users.id))
      .where(eq(postComments.postId, postId))
      .orderBy(postComments.createdAt);
    
    return comments as (PostComment & { author: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role'> })[];
  }

  async createComment(comment: InsertPostComment): Promise<PostComment> {
    const [newComment] = await db
      .insert(postComments)
      .values(comment)
      .returning();
    
    await db
      .update(communityPosts)
      .set({ commentCount: sql`${communityPosts.commentCount} + 1` })
      .where(eq(communityPosts.id, comment.postId));
    
    return newComment;
  }

  async togglePostLike(postId: number, userId: string): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
    
    if (existing) {
      await db
        .delete(postLikes)
        .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
      
      await db
        .update(communityPosts)
        .set({ likeCount: sql`${communityPosts.likeCount} - 1` })
        .where(eq(communityPosts.id, postId));
      
      return false;
    } else {
      await db
        .insert(postLikes)
        .values({ postId, userId });
      
      await db
        .update(communityPosts)
        .set({ likeCount: sql`${communityPosts.likeCount} + 1` })
        .where(eq(communityPosts.id, postId));
      
      return true;
    }
  }

  async incrementPostViews(postId: number): Promise<void> {
    await db
      .update(communityPosts)
      .set({ viewCount: sql`${communityPosts.viewCount} + 1` })
      .where(eq(communityPosts.id, postId));
  }

  async getPartnerOrgByCode(code: string): Promise<PartnerOrganisation | undefined> {
    const [org] = await db
      .select()
      .from(partnerOrganisations)
      .where(and(eq(partnerOrganisations.entryCode, code), eq(partnerOrganisations.isActive, true)));
    return org;
  }

  async getPartnerOrgBySlug(slug: string): Promise<PartnerOrganisation | undefined> {
    const [org] = await db
      .select()
      .from(partnerOrganisations)
      .where(and(eq(partnerOrganisations.slug, slug), eq(partnerOrganisations.isActive, true)));
    return org;
  }

  async getPartnerOrgById(id: number): Promise<PartnerOrganisation | undefined> {
    const [org] = await db
      .select()
      .from(partnerOrganisations)
      .where(eq(partnerOrganisations.id, id));
    return org;
  }

  async updateUserLocation(userId: string, state: string, region: string, club: string): Promise<void> {
    await db
      .update(users)
      .set({ state, region, club, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async getAllAchievements(): Promise<any[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.isActive, true))
      .orderBy(achievements.sortOrder);
  }

  async getUserAchievements(userId: string): Promise<any[]> {
    const results = await db
      .select({
        id: userAchievements.id,
        userId: userAchievements.userId,
        achievementId: userAchievements.achievementId,
        earnedAt: userAchievements.earnedAt,
        achievement: {
          id: achievements.id,
          name: achievements.name,
          description: achievements.description,
          icon: achievements.icon,
          category: achievements.category,
          criteria: achievements.criteria,
          criteriaValue: achievements.criteriaValue,
          tier: achievements.tier,
        }
      })
      .from(userAchievements)
      .leftJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId));
    return results;
  }

  async awardAchievement(userId: string, achievementId: number): Promise<void> {
    await db.insert(userAchievements).values({ userId, achievementId }).onConflictDoNothing();
  }

  // ========== NSO ANALYTICS OPERATIONS ==========

  async getNSOAnalytics(partnerOrgId?: number): Promise<{
    totalAthletes: number;
    activeThisWeek: number;
    averageCompliance: number;
    totalSessionsMonth: number;
    byState: {
      state: string;
      athleteCount: number;
      activeCount: number;
      activePercent: number;
      avgSessionsWeek: number;
      topClub: string;
    }[];
    weeklyTrend: { week: string; compliance: number }[];
  }> {
    const conditions: any[] = [eq(users.role, 'athlete'), eq(users.isActive, true)];
    if (partnerOrgId) {
      conditions.push(eq(users.partnerOrgId, partnerOrgId));
    }

    const allAthletes = await db
      .select()
      .from(users)
      .where(and(...conditions));

    const totalAthletes = allAthletes.length;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() + mondayOffset);
    thisMonday.setHours(0, 0, 0, 0);
    const thisSunday = new Date(thisMonday);
    thisSunday.setDate(thisMonday.getDate() + 6);
    thisSunday.setHours(23, 59, 59, 999);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const fourWeeksAgo = new Date(thisMonday);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    let activeThisWeek = 0;
    let totalCompliance = 0;
    let totalSessionsMonth = 0;

    const stateMap: Record<string, {
      athletes: typeof allAthletes;
      activeCount: number;
      totalWeekSessions: number;
      clubCounts: Record<string, number>;
    }> = {};

    const australianStates = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];
    for (const st of australianStates) {
      stateMap[st] = { athletes: [], activeCount: 0, totalWeekSessions: 0, clubCounts: {} };
    }

    for (const athlete of allAthletes) {
      const state = athlete.state || 'Unknown';
      if (!stateMap[state]) {
        stateMap[state] = { athletes: [], activeCount: 0, totalWeekSessions: 0, clubCounts: {} };
      }
      stateMap[state].athletes.push(athlete);

      if (athlete.club) {
        stateMap[state].clubCounts[athlete.club] = (stateMap[state].clubCounts[athlete.club] || 0) + 1;
      }

      const weekCompletions = await db
        .select()
        .from(athleteSessionCompletions)
        .where(and(
          eq(athleteSessionCompletions.userId, athlete.id),
          gte(athleteSessionCompletions.completedAt, thisMonday),
          lte(athleteSessionCompletions.completedAt, thisSunday)
        ));

      if (weekCompletions.length > 0) {
        activeThisWeek++;
        stateMap[state].activeCount++;
      }
      stateMap[state].totalWeekSessions += weekCompletions.length;

      const monthCompletions = await db
        .select()
        .from(athleteSessionCompletions)
        .where(and(
          eq(athleteSessionCompletions.userId, athlete.id),
          gte(athleteSessionCompletions.completedAt, monthStart),
          lte(athleteSessionCompletions.completedAt, monthEnd)
        ));
      totalSessionsMonth += monthCompletions.length;

      const fourWeekCompletions = await db
        .select()
        .from(athleteSessionCompletions)
        .where(and(
          eq(athleteSessionCompletions.userId, athlete.id),
          gte(athleteSessionCompletions.completedAt, fourWeeksAgo),
          lte(athleteSessionCompletions.completedAt, thisSunday)
        ));
      const weeklyTarget = 3;
      const fourWeekTarget = weeklyTarget * 4;
      const compliancePercent = Math.min(100, Math.round((fourWeekCompletions.length / fourWeekTarget) * 100));
      totalCompliance += compliancePercent;
    }

    const averageCompliance = totalAthletes > 0 ? Math.round(totalCompliance / totalAthletes) : 0;

    const byState = Object.entries(stateMap)
      .filter(([_, data]) => data.athletes.length > 0 || australianStates.includes(_))
      .map(([state, data]) => {
        const clubEntries = Object.entries(data.clubCounts);
        const topClub = clubEntries.length > 0
          ? clubEntries.sort((a, b) => b[1] - a[1])[0][0]
          : '—';

        return {
          state,
          athleteCount: data.athletes.length,
          activeCount: data.activeCount,
          activePercent: data.athletes.length > 0 ? Math.round((data.activeCount / data.athletes.length) * 100) : 0,
          avgSessionsWeek: data.athletes.length > 0 ? Math.round((data.totalWeekSessions / data.athletes.length) * 10) / 10 : 0,
          topClub,
        };
      })
      .filter(s => australianStates.includes(s.state))
      .sort((a, b) => b.athleteCount - a.athleteCount);

    const weeklyTrend = await this.getNSOWeeklyTrend(partnerOrgId);

    return {
      totalAthletes,
      activeThisWeek,
      averageCompliance,
      totalSessionsMonth,
      byState,
      weeklyTrend,
    };
  }

  async getNSOWeeklyTrend(partnerOrgId?: number): Promise<{ week: string; compliance: number }[]> {
    const conditions: any[] = [eq(users.role, 'athlete'), eq(users.isActive, true)];
    if (partnerOrgId) {
      conditions.push(eq(users.partnerOrgId, partnerOrgId));
    }

    const allAthletes = await db
      .select({ id: users.id })
      .from(users)
      .where(and(...conditions));

    const athleteCount = allAthletes.length;
    if (athleteCount === 0) {
      return Array.from({ length: 8 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (7 - i) * 7);
        return { week: `Week ${i + 1}`, compliance: 0 };
      });
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() + mondayOffset);
    currentMonday.setHours(0, 0, 0, 0);

    const results: { week: string; compliance: number }[] = [];
    const weeklyTarget = 3;

    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(currentMonday);
      weekStart.setDate(currentMonday.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      let totalCompliance = 0;
      for (const athlete of allAthletes) {
        const completions = await db
          .select()
          .from(athleteSessionCompletions)
          .where(and(
            eq(athleteSessionCompletions.userId, athlete.id),
            gte(athleteSessionCompletions.completedAt, weekStart),
            lte(athleteSessionCompletions.completedAt, weekEnd)
          ));
        totalCompliance += Math.min(100, Math.round((completions.length / weeklyTarget) * 100));
      }

      const weekLabel = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
      results.push({
        week: weekLabel,
        compliance: Math.round(totalCompliance / athleteCount),
      });
    }

    return results;
  }

  // ========== EDUCATION MODULE OPERATIONS ==========

  async getEducationModules(accessLevel: string): Promise<any[]> {
    const allModules = await db
      .select()
      .from(educationModules)
      .where(eq(educationModules.isPublished, true))
      .orderBy(educationModules.sortOrder);

    return allModules.filter(mod => {
      if (accessLevel === 'admin') return true;
      if (mod.accessLevel === 'all') return true;
      if (mod.accessLevel === accessLevel) return true;
      return false;
    });
  }

  async getEducationModule(id: number): Promise<any | undefined> {
    const [mod] = await db
      .select()
      .from(educationModules)
      .where(eq(educationModules.id, id));
    return mod;
  }

  async completeModule(userId: string, moduleId: number): Promise<any> {
    const existing = await db
      .select()
      .from(moduleCompletions)
      .where(and(eq(moduleCompletions.userId, userId), eq(moduleCompletions.moduleId, moduleId)));

    if (existing.length > 0) {
      return existing[0];
    }

    const [completion] = await db
      .insert(moduleCompletions)
      .values({ userId, moduleId })
      .returning();
    return completion;
  }

  async getUserModuleCompletions(userId: string): Promise<number[]> {
    const completions = await db
      .select({ moduleId: moduleCompletions.moduleId })
      .from(moduleCompletions)
      .where(eq(moduleCompletions.userId, userId));
    return completions.map(c => c.moduleId);
  }

  async getEducationProgress(userId: string): Promise<{ completed: number; total: number }> {
    const totalModules = await db
      .select()
      .from(educationModules)
      .where(eq(educationModules.isPublished, true));

    const completions = await db
      .select()
      .from(moduleCompletions)
      .where(eq(moduleCompletions.userId, userId));

    return {
      completed: completions.length,
      total: totalModules.length,
    };
  }

  async getAthleteProgress(userId: string): Promise<{
    readinessScore: number;
    currentStreak: number;
    longestStreak: number;
    totalSessions: number;
    weeklyCompleted: number;
    weeklyTarget: number;
    weekDays: boolean[];
    currentBelt: string;
    beltProgress: number;
  }> {
    const profile = await this.getAthleteProfile(userId);

    const weeklyTarget = profile?.trainingFrequency || 3;
    const currentStreak = profile?.currentStreak || 0;
    const longestStreak = profile?.longestStreak || 0;
    const totalSessions = profile?.totalSessionsCompleted || 0;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weekCompletions = await db
      .select()
      .from(athleteSessionCompletions)
      .where(
        and(
          eq(athleteSessionCompletions.userId, userId),
          gte(athleteSessionCompletions.completedAt, monday),
          lte(athleteSessionCompletions.completedAt, sunday)
        )
      );

    const weekDays: boolean[] = [false, false, false, false, false, false, false];
    for (const completion of weekCompletions) {
      if (completion.completedAt) {
        const completionDay = completion.completedAt.getDay();
        const index = completionDay === 0 ? 6 : completionDay - 1;
        weekDays[index] = true;
      }
    }

    const weeklyCompleted = weekDays.filter(Boolean).length;
    const readinessScore = Math.min(100, Math.round((weeklyCompleted / weeklyTarget) * 100));

    let currentBelt = "white";
    let beltProgress = 0;

    if (totalSessions >= 36) {
      currentBelt = "black";
      beltProgress = Math.min(100, Math.round(((totalSessions - 36) / 36) * 100));
    } else if (totalSessions >= 12) {
      currentBelt = "blue";
      beltProgress = Math.round(((totalSessions - 12) / 24) * 100);
    } else {
      currentBelt = "white";
      beltProgress = Math.round((totalSessions / 12) * 100);
    }

    return {
      readinessScore,
      currentStreak,
      longestStreak,
      totalSessions,
      weeklyCompleted,
      weeklyTarget,
      weekDays,
      currentBelt,
      beltProgress,
    };
  }

  // ─── INJURY REPORTS (T008) ────────────────────────────────────────────────
  async createInjuryReport(report: InsertInjuryReport): Promise<InjuryReport> {
    const [created] = await db.insert(injuryReports).values(report).returning();
    return created;
  }

  async getInjuryReportsByCoach(coachId: string): Promise<InjuryReport[]> {
    // Return injury reports for athletes coached by this coach
    const athletes = await db.select({ id: users.id }).from(users).where(eq(users.coachId, coachId));
    const athleteIds = athletes.map(a => a.id);
    if (athleteIds.length === 0) return [];
    const reports = await db.select().from(injuryReports)
      .where(sql`${injuryReports.userId} = ANY(${sql.raw(`ARRAY[${athleteIds.map(id => `'${id}'`).join(",")}]::varchar[]`)})`);
    return reports;
  }

  async getInjuryReportStats(): Promise<{ total: number; byBodyPart: Record<string, number>; highPain: number; referralRate: number }> {
    const all = await db.select().from(injuryReports);
    const byBodyPart: Record<string, number> = {};
    let highPain = 0;
    let referred = 0;
    for (const r of all) {
      byBodyPart[r.bodyPart] = (byBodyPart[r.bodyPart] || 0) + 1;
      if (r.painRating >= 6) highPain++;
      if (r.referredToClinicId) referred++;
    }
    return {
      total: all.length,
      byBodyPart,
      highPain,
      referralRate: all.length > 0 ? Math.round((referred / all.length) * 100) : 0,
    };
  }

  // ─── ATHLETE SESSION COMPLETIONS (from session player) ───────────────────
  async recordSessionCompletion(data: InsertAthleteSessionCompletion): Promise<AthleteSessionCompletion> {
    const now = new Date();
    const weekNumber = getISOWeek(now);
    const yearNumber = now.getFullYear();
    const [created] = await db.insert(athleteSessionCompletions).values({
      ...data,
      weekNumber,
      yearNumber,
    }).returning();
    // Update athlete profile: increment sessions, update streak
    const profile = await this.getAthleteProfile(data.userId);
    if (profile) {
      const lastCompleted = profile.lastSessionDate;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const isConsecutive = lastCompleted && 
        lastCompleted >= yesterday &&
        lastCompleted < now;
      const newStreak = isConsecutive ? (profile.currentStreak || 0) + 1 : 1;
      const newTotal = (profile.totalSessionsCompleted || 0) + 1;
      await db.update(athleteProfiles)
        .set({
          totalSessionsCompleted: newTotal,
          currentStreak: newStreak,
          longestStreak: Math.max(profile.longestStreak || 0, newStreak),
          lastSessionDate: now,
          updatedAt: now,
        })
        .where(eq(athleteProfiles.userId, data.userId));
    }
    return created;
  }

  async getSessionCompletionsForUser(userId: string): Promise<AthleteSessionCompletion[]> {
    return db.select().from(athleteSessionCompletions)
      .where(eq(athleteSessionCompletions.userId, userId))
      .orderBy(desc(athleteSessionCompletions.completedAt));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MC PRO COACHING ENGINE METHODS (from GitHub main branch)
  // ══════════════════════════════════════════════════════════════════════════
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

  async createMCTeam(team: InsertTeam): Promise<Team> {
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

  // createProgram already defined above

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

  async updateProgramExercise(id: string, updates: Partial<InsertProgramExercise>): Promise<ProgramExercise | undefined> {
    const [updated] = await db.update(programExercises)
      .set(updates)
      .where(eq(programExercises.id, id))
      .returning();
    return updated || undefined;
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

  // getAthletePrograms already defined above

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

  // createWorkoutLog already defined above

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
    let tests = await this.getValdTestsForAthlete(athleteId);
    
    if (tests.length === 0 && profile) {
      tests = await this.getValdTestsForProfile(profile.id);
      for (const test of tests) {
        if (!test.athleteId) {
          await this.updateValdTestAthleteLink(test.id, athleteId);
        }
      }
    }
    
    const latestResults = new Map<string, ValdTrialResult[]>();
    for (const test of tests.slice(0, 10)) {
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

  async getAthleteTargets(athleteId: string): Promise<AthleteTarget[]> {
    return await db
      .select()
      .from(athleteTargets)
      .where(eq(athleteTargets.athleteId, athleteId))
      .orderBy(desc(athleteTargets.createdAt));
  }

  async getAthleteTarget(id: string): Promise<AthleteTarget | undefined> {
    const [target] = await db.select().from(athleteTargets).where(eq(athleteTargets.id, id));
    return target || undefined;
  }

  async createAthleteTarget(target: InsertAthleteTarget): Promise<AthleteTarget> {
    const [newTarget] = await db.insert(athleteTargets).values(target).returning();
    return newTarget;
  }

  async updateAthleteTarget(id: string, target: Partial<InsertAthleteTarget>): Promise<AthleteTarget | undefined> {
    const [updated] = await db
      .update(athleteTargets)
      .set({ ...target, updatedAt: new Date() })
      .where(eq(athleteTargets.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAthleteTarget(id: string): Promise<boolean> {
    const result = await db.delete(athleteTargets).where(eq(athleteTargets.id, id)).returning();
    return result.length > 0;
  }

  // Announcements / Noticeboard
  async getAnnouncements(): Promise<Announcement[]> {
    return await db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));
  }

  async getAnnouncement(id: string): Promise<Announcement | undefined> {
    const [announcement] = await db.select().from(announcements).where(eq(announcements.id, id));
    return announcement || undefined;
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [newAnnouncement] = await db.insert(announcements).values(announcement).returning();
    return newAnnouncement;
  }

  async updateAnnouncement(id: string, announcement: Partial<InsertAnnouncement>): Promise<Announcement | undefined> {
    const [updated] = await db
      .update(announcements)
      .set({ ...announcement, updatedAt: new Date() })
      .where(eq(announcements.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    const result = await db.delete(announcements).where(eq(announcements.id, id)).returning();
    return result.length > 0;
  }

  // Body Composition
  async getBodyCompositionLogs(athleteId: string): Promise<BodyCompositionLog[]> {
    return await db
      .select()
      .from(bodyCompositionLogs)
      .where(eq(bodyCompositionLogs.athleteId, athleteId))
      .orderBy(desc(bodyCompositionLogs.loggedAt));
  }

  async getBodyCompositionLog(id: string): Promise<BodyCompositionLog | undefined> {
    const [log] = await db.select().from(bodyCompositionLogs).where(eq(bodyCompositionLogs.id, id));
    return log || undefined;
  }

  async createBodyCompositionLog(log: InsertBodyCompositionLog): Promise<BodyCompositionLog> {
    const [newLog] = await db.insert(bodyCompositionLogs).values(log).returning();
    return newLog;
  }

  async deleteBodyCompositionLog(id: string): Promise<boolean> {
    const result = await db.delete(bodyCompositionLogs).where(eq(bodyCompositionLogs.id, id)).returning();
    return result.length > 0;
  }

  // Custom Surveys
  async getCustomSurveys(): Promise<CustomSurvey[]> {
    return await db
      .select()
      .from(customSurveys)
      .orderBy(desc(customSurveys.createdAt));
  }

  async getCustomSurvey(id: string): Promise<CustomSurvey | undefined> {
    const [survey] = await db.select().from(customSurveys).where(eq(customSurveys.id, id));
    return survey || undefined;
  }

  async createCustomSurvey(survey: InsertCustomSurvey): Promise<CustomSurvey> {
    const [newSurvey] = await db.insert(customSurveys).values(survey).returning();
    return newSurvey;
  }

  async updateCustomSurvey(id: string, survey: Partial<InsertCustomSurvey>): Promise<CustomSurvey | undefined> {
    const [updated] = await db
      .update(customSurveys)
      .set({ ...survey, updatedAt: new Date() })
      .where(eq(customSurveys.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCustomSurvey(id: string): Promise<boolean> {
    const result = await db.delete(customSurveys).where(eq(customSurveys.id, id)).returning();
    return result.length > 0;
  }

  // Team Sessions
  async getTeamSessions(): Promise<TeamSession[]> {
    return await db.select().from(teamSessions).orderBy(desc(teamSessions.scheduledAt));
  }

  async getTeamSession(id: string): Promise<TeamSession | undefined> {
    const [session] = await db.select().from(teamSessions).where(eq(teamSessions.id, id));
    return session || undefined;
  }

  async createTeamSession(session: InsertTeamSession): Promise<TeamSession> {
    const [newSession] = await db.insert(teamSessions).values(session).returning();
    return newSession;
  }

  async updateTeamSession(id: string, session: Partial<InsertTeamSession>): Promise<TeamSession | undefined> {
    const [updated] = await db
      .update(teamSessions)
      .set({ ...session, updatedAt: new Date() })
      .where(eq(teamSessions.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTeamSession(id: string): Promise<boolean> {
    await db.delete(sessionParticipants).where(eq(sessionParticipants.sessionId, id));
    const result = await db.delete(teamSessions).where(eq(teamSessions.id, id)).returning();
    return result.length > 0;
  }

  // Session Participants
  async getSessionParticipants(sessionId: string): Promise<SessionParticipant[]> {
    return await db.select().from(sessionParticipants).where(eq(sessionParticipants.sessionId, sessionId));
  }

  async addSessionParticipant(participant: InsertSessionParticipant): Promise<SessionParticipant> {
    const [newParticipant] = await db.insert(sessionParticipants).values(participant).returning();
    return newParticipant;
  }

  async updateSessionParticipant(id: string, participant: Partial<InsertSessionParticipant>): Promise<SessionParticipant | undefined> {
    const [updated] = await db
      .update(sessionParticipants)
      .set(participant)
      .where(eq(sessionParticipants.id, id))
      .returning();
    return updated || undefined;
  }

  async removeSessionParticipant(sessionId: string, athleteId: string): Promise<boolean> {
    const result = await db
      .delete(sessionParticipants)
      .where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.athleteId, athleteId)))
      .returning();
    return result.length > 0;
  }

  async checkInParticipant(sessionId: string, athleteId: string): Promise<SessionParticipant | undefined> {
    const [updated] = await db
      .update(sessionParticipants)
      .set({ status: 'attended', checkedInAt: new Date() })
      .where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.athleteId, athleteId)))
      .returning();
    return updated || undefined;
  }

  async getNormativeCohorts(filters?: { deviceType?: string; testType?: string; sex?: string; sport?: string }): Promise<NormativeCohort[]> {
    const conditions = [];
    if (filters?.deviceType) conditions.push(eq(normativeCohorts.deviceType, filters.deviceType));
    if (filters?.testType) conditions.push(eq(normativeCohorts.testType, filters.testType));
    if (filters?.sex) conditions.push(eq(normativeCohorts.sex, filters.sex));
    if (filters?.sport) conditions.push(eq(normativeCohorts.sport, filters.sport));
    if (conditions.length === 0) return db.select().from(normativeCohorts);
    return db.select().from(normativeCohorts).where(and(...conditions));
  }

  async getNormativeCohort(id: string): Promise<NormativeCohort | undefined> {
    const [cohort] = await db.select().from(normativeCohorts).where(eq(normativeCohorts.id, id));
    return cohort || undefined;
  }

  async getNormativeMetrics(cohortId: string): Promise<NormativeMetric[]> {
    return db.select().from(normativeMetrics).where(eq(normativeMetrics.cohortId, cohortId));
  }

  // ── COMPATIBILITY ALIASES (for consumer routes using older method names) ──
  async getExercises(organizationId?: number): Promise<Exercise[]> {
    return this.getAllExercises(organizationId);
  }
  async getExercise(id: string): Promise<Exercise | undefined> {
    const [ex] = await db.select().from(exercises).where(eq(exercises.id, id));
    return ex || undefined;
  }
  async getAthleteProgramAssignments(athleteId: string): Promise<any[]> {
    return this.getAthletePrograms(athleteId);
  }
  async getTrainingBlocksByProgram(programId: string): Promise<any[]> {
    return db.select().from(trainingBlocks).where(eq(trainingBlocks.programId, programId));
  }
  async getAthleteStatsOrCreate(athleteId: string): Promise<any> {
    return db.select().from(athleteStats).where(eq(athleteStats.athleteId, athleteId)).then(r => r[0] || { athleteId, xp: 0, level: 1 });
  }

  async getMatchingCohorts(params: { deviceType: string; testType: string; sex?: string | null; sport?: string | null; age?: number | null }): Promise<NormativeCohort[]> {
    const conditions = [
      eq(normativeCohorts.deviceType, params.deviceType),
      eq(normativeCohorts.testType, params.testType),
    ];
    if (params.sex) conditions.push(eq(normativeCohorts.sex, params.sex));
    const allCohorts = await db.select().from(normativeCohorts).where(and(...conditions));
    return allCohorts.filter(c => {
      if (c.sport) {
        if (!params.sport) return false;
        if (c.sport !== params.sport) return false;
      }
      if (params.age !== undefined && params.age !== null) {
        if (c.ageMin && params.age < c.ageMin) return false;
        if (c.ageMax && params.age > c.ageMax) return false;
      }
      return true;
    }).sort((a, b) => {
      const aSpecificity = (a.sport ? 2 : 0) + (a.ageMin && a.ageMax ? 1 : 0);
      const bSpecificity = (b.sport ? 2 : 0) + (b.ageMin && b.ageMax ? 1 : 0);
      return bSpecificity - aSpecificity;
    });
  }
}

// ISO week helper (from Replit)
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export const storage = new DatabaseStorage();
