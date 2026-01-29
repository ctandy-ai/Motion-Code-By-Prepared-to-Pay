import { db } from "./db";
import { exercises, athletes, programs, athletePrograms, programExercises } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  const existingExercises = await db.select().from(exercises);
  if (existingExercises.length === 0) {
    console.log("Adding sample exercises...");
    await db.insert(exercises).values([
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
    ]);
    console.log("✓ Exercises added");
  }

  const existingAthletes = await db.select().from(athletes);
  if (existingAthletes.length === 0) {
    console.log("Adding sample athletes...");
    await db.insert(athletes).values([
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
    ]);
    console.log("✓ Athletes added");
  }

  // Add Jake Smith as sample athlete with full program
  const existingJake = await db.select().from(athletes).where(eq(athletes.name, 'Jake Smith'));
  let jakeId = existingJake[0]?.id;
  if (!jakeId) {
    console.log("Adding Jake Smith athlete...");
    const [jake] = await db.insert(athletes).values({
      name: "Jake Smith",
      email: "jake.smith@example.com",
      team: "Varsity Football",
      position: "Wide Receiver",
      avatarUrl: "",
      beltLevel: "BLUE",
      trainingAge: 3,
    }).returning();
    jakeId = jake.id;
    console.log("✓ Jake Smith added");
  }

  // Add Jake's program
  const existingJakeProgram = await db.select().from(programs).where(eq(programs.name, 'Jake Smith - Preseason Strength Block'));
  let jakeProgramId = existingJakeProgram[0]?.id;
  if (!jakeProgramId) {
    console.log("Adding Jake Smith's program...");
    const [program] = await db.insert(programs).values({
      name: "Jake Smith - Preseason Strength Block",
      description: "4-week preseason strength program with periodization",
      duration: 4,
      difficulty: "Intermediate",
      createdBy: "Coach Wilson",
    }).returning();
    jakeProgramId = program.id;

    // Assign program to Jake
    await db.insert(athletePrograms).values({
      athleteId: jakeId,
      programId: jakeProgramId,
      startDate: new Date().toISOString().split('T')[0],
      status: 'active',
    });
    console.log("✓ Jake's program created and assigned");
  }

  // Add program exercises for Jake's program (if not already present)
  if (jakeProgramId) {
    const existingProgramExercises = await db.select().from(programExercises).where(eq(programExercises.programId, jakeProgramId));
    if (existingProgramExercises.length === 0) {
      console.log("Adding exercises to Jake's program...");
      
      const allExercises = await db.select().from(exercises);
      const getExerciseId = (name: string) => allExercises.find(e => e.name === name)?.id;
      
      const squatId = getExerciseId('Barbell Squat');
      const benchId = getExerciseId('Bench Press');
      const deadliftId = getExerciseId('Deadlift');
      const pullupId = getExerciseId('Pull-ups');
      const pushupId = getExerciseId('Push-ups');

      if (squatId && benchId && deadliftId && pullupId && pushupId) {
        const programExerciseData = [
          // Week 1
          { programId: jakeProgramId, exerciseId: squatId, weekNumber: 1, dayNumber: 1, sets: 4, reps: 8, restSeconds: 120, notes: 'Focus on depth and control', orderIndex: 0 },
          { programId: jakeProgramId, exerciseId: deadliftId, weekNumber: 1, dayNumber: 1, sets: 3, reps: 6, restSeconds: 150, notes: 'Hip hinge emphasis', orderIndex: 1 },
          { programId: jakeProgramId, exerciseId: benchId, weekNumber: 1, dayNumber: 2, sets: 4, reps: 8, restSeconds: 120, notes: 'Full ROM, controlled tempo', orderIndex: 0 },
          { programId: jakeProgramId, exerciseId: pushupId, weekNumber: 1, dayNumber: 2, sets: 3, reps: 15, restSeconds: 60, notes: 'Chest to floor', orderIndex: 1 },
          { programId: jakeProgramId, exerciseId: pullupId, weekNumber: 1, dayNumber: 4, sets: 4, reps: 6, restSeconds: 120, notes: 'Full extension at bottom', orderIndex: 0 },
          // Week 2
          { programId: jakeProgramId, exerciseId: squatId, weekNumber: 2, dayNumber: 1, sets: 4, reps: 10, restSeconds: 120, notes: 'Add 5-10lbs from last week', orderIndex: 0 },
          { programId: jakeProgramId, exerciseId: deadliftId, weekNumber: 2, dayNumber: 1, sets: 4, reps: 6, restSeconds: 150, notes: 'Progressive overload', orderIndex: 1 },
          { programId: jakeProgramId, exerciseId: benchId, weekNumber: 2, dayNumber: 2, sets: 4, reps: 10, restSeconds: 120, notes: 'Increase weight 5lbs', orderIndex: 0 },
          { programId: jakeProgramId, exerciseId: pushupId, weekNumber: 2, dayNumber: 2, sets: 3, reps: 20, restSeconds: 60, notes: 'Max effort', orderIndex: 1 },
          { programId: jakeProgramId, exerciseId: pullupId, weekNumber: 2, dayNumber: 4, sets: 4, reps: 8, restSeconds: 120, notes: 'Add weight if possible', orderIndex: 0 },
          // Week 3
          { programId: jakeProgramId, exerciseId: squatId, weekNumber: 3, dayNumber: 1, sets: 5, reps: 6, restSeconds: 150, notes: 'Heavy day - 85% 1RM', orderIndex: 0 },
          { programId: jakeProgramId, exerciseId: deadliftId, weekNumber: 3, dayNumber: 1, sets: 4, reps: 5, restSeconds: 180, notes: 'Heavy singles', orderIndex: 1 },
          { programId: jakeProgramId, exerciseId: benchId, weekNumber: 3, dayNumber: 2, sets: 5, reps: 6, restSeconds: 150, notes: 'Peak weight', orderIndex: 0 },
          { programId: jakeProgramId, exerciseId: pushupId, weekNumber: 3, dayNumber: 2, sets: 4, reps: 15, restSeconds: 60, notes: 'Explosive tempo', orderIndex: 1 },
          { programId: jakeProgramId, exerciseId: pullupId, weekNumber: 3, dayNumber: 4, sets: 5, reps: 6, restSeconds: 120, notes: 'Weighted pull-ups', orderIndex: 0 },
          // Week 4 - Deload
          { programId: jakeProgramId, exerciseId: squatId, weekNumber: 4, dayNumber: 1, sets: 3, reps: 8, restSeconds: 120, notes: 'Deload - 70% intensity', orderIndex: 0 },
          { programId: jakeProgramId, exerciseId: benchId, weekNumber: 4, dayNumber: 2, sets: 3, reps: 8, restSeconds: 120, notes: 'Recovery focus', orderIndex: 0 },
          { programId: jakeProgramId, exerciseId: pullupId, weekNumber: 4, dayNumber: 4, sets: 3, reps: 6, restSeconds: 120, notes: 'Bodyweight only', orderIndex: 0 },
        ];

        await db.insert(programExercises).values(programExerciseData);
        console.log("✓ Program exercises added");
      }
    }
  }

  console.log("✓ Database seeded successfully");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});
