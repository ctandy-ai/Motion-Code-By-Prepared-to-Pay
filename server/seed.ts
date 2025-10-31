import { db } from "./db";
import { exercises, athletes } from "@shared/schema";

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

  console.log("✓ Database seeded successfully");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});
