/**
 * Template Seeder - Clinically Safe Exercise Selection
 * 
 * Uses curated exercise pools from exercise-pools.ts with phase-specific
 * loading schemes to ensure appropriate exercise selection for each
 * pathway and phase of rehabilitation or training.
 */

import { readFileSync } from 'fs';
import { db } from './db';
import { 
  exercises, 
  programTemplates, 
  templatePhases, 
  templateWeeks, 
  templateTrainingBlocks,
  templateTrainingBlockExercises 
} from '../shared/schema';
import { eq, and, like } from 'drizzle-orm';
import { 
  CURATED_TEMPLATE_TAXONOMY, 
  PHASE_SCHEMES,
  CuratedTemplateConfig,
  CuratedBlockConfig
} from './exercise-pools';

interface MasterExercise {
  id: string;
  name: string;
  tracking: string;
  tags: string;
  attributes: string;
  variables_default: {
    sets: number;
    reps: string;
    intensity: string;
  };
  belt_min: string;
  belt_max: string;
  notes: string;
}

// Load master exercises for metadata lookup
let masterExerciseCache: MasterExercise[] | null = null;

function loadMasterExercises(): MasterExercise[] {
  if (!masterExerciseCache) {
    masterExerciseCache = JSON.parse(
      readFileSync('client/public/master_exercises.json', 'utf-8')
    ) as MasterExercise[];
  }
  return masterExerciseCache;
}

function inferCategory(name: string): string {
  const lower = name.toLowerCase();
  
  if (lower.includes('squat') || lower.includes('deadlift') || lower.includes('press') || lower.includes('row') || lower.includes('rdl')) return 'Strength';
  if (lower.includes('jump') || lower.includes('bound') || lower.includes('hop') || lower.includes('plyo') || lower.includes('depth')) return 'Power';
  if (lower.includes('sprint') || lower.includes('run') || lower.includes('agility') || lower.includes('shuttle') || lower.includes('drill')) return 'Speed';
  if (lower.includes('stretch') || lower.includes('mobility') || lower.includes('foam') || lower.includes('cat cow') || lower.includes('pigeon')) return 'Mobility';
  if (lower.includes('core') || lower.includes('plank') || lower.includes('ab') || lower.includes('bird dog') || lower.includes('dead bug')) return 'Core';
  if (lower.includes('bridge') || lower.includes('glute') || lower.includes('hip thrust')) return 'Glutes';
  if (lower.includes('nordic') || lower.includes('curl') || lower.includes('hamstring')) return 'Posterior Chain';
  if (lower.includes('quad') || lower.includes('extension') || lower.includes('leg press')) return 'Quads';
  if (lower.includes('activation') || lower.includes('isometric') || lower.includes('hold')) return 'Activation';
  
  return 'Strength';
}

function inferMuscleGroup(name: string): string {
  const lower = name.toLowerCase();
  
  if (lower.includes('squat') || lower.includes('lunge') || lower.includes('leg') || lower.includes('step up')) return 'Legs';
  if (lower.includes('deadlift') || lower.includes('rdl') || lower.includes('hinge') || lower.includes('hamstring') || lower.includes('nordic')) return 'Posterior Chain';
  if (lower.includes('bench') || lower.includes('chest') || lower.includes('push up')) return 'Chest';
  if (lower.includes('row') || lower.includes('pull') || lower.includes('lat') || lower.includes('chin')) return 'Back';
  if (lower.includes('shoulder') || lower.includes('press') || lower.includes('overhead') || lower.includes('pike')) return 'Shoulders';
  if (lower.includes('arm') || lower.includes('bicep') || lower.includes('tricep') || lower.includes('curl')) return 'Arms';
  if (lower.includes('core') || lower.includes('ab') || lower.includes('plank') || lower.includes('dead bug') || lower.includes('bird dog')) return 'Core';
  if (lower.includes('glute') || lower.includes('hip') || lower.includes('bridge') || lower.includes('thrust')) return 'Glutes';
  if (lower.includes('calf') || lower.includes('ankle')) return 'Lower Leg';
  if (lower.includes('sprint') || lower.includes('jump') || lower.includes('bound')) return 'Full Body';
  
  return 'Full Body';
}

function inferEquipment(name: string): string {
  const lower = name.toLowerCase();
  
  if (lower.includes('barbell') || lower.includes('bb ') || lower.startsWith('bb ')) return 'Barbell';
  if (lower.includes('dumbbell') || lower.includes('db ') || lower.startsWith('db ')) return 'Dumbbell';
  if (lower.includes('kettlebell') || lower.includes('kb ') || lower.startsWith('kb ')) return 'Kettlebell';
  if (lower.includes('machine') || lower.includes('cable') || lower.includes('leg press') || lower.includes('lat pulldown')) return 'Machine';
  if (lower.includes('band') || lower.includes('resistance')) return 'Bands';
  if (lower.includes('slider') || lower.includes('slide')) return 'Sliders';
  if (lower.includes('swiss ball') || lower.includes('stability ball')) return 'Swiss Ball';
  if (lower.includes('foam') || lower.includes('roller')) return 'Foam Roller';
  if (lower.includes('med ball') || lower.includes('medicine ball')) return 'Medicine Ball';
  if (lower.includes('box')) return 'Box';
  if (lower.includes('sled')) return 'Sled';
  if (lower.includes('bodyweight') || lower.includes('bw') || lower.includes('push up') || lower.includes('squat') && !lower.includes('bar')) return 'Bodyweight';
  
  return 'Various';
}

/**
 * Find or create an exercise by name with proper metadata
 */
async function findOrCreateExercise(exerciseName: string): Promise<{ id: string; name: string } | null> {
  // First check if it exists in DB
  const [existing] = await db.select()
    .from(exercises)
    .where(eq(exercises.name, exerciseName));
  
  if (existing) {
    return { id: existing.id, name: existing.name };
  }
  
  // Try case-insensitive match
  const [caseInsensitive] = await db.select()
    .from(exercises)
    .where(like(exercises.name, exerciseName));
  
  if (caseInsensitive) {
    return { id: caseInsensitive.id, name: caseInsensitive.name };
  }
  
  // Check master database for metadata
  const masterExercises = loadMasterExercises();
  const masterMatch = masterExercises.find(ex => 
    ex.name.toLowerCase() === exerciseName.toLowerCase()
  );
  
  // Create the exercise with proper metadata
  const [created] = await db.insert(exercises).values({
    name: exerciseName,
    category: masterMatch ? inferCategory(masterMatch.name) : inferCategory(exerciseName),
    muscleGroup: masterMatch ? inferMuscleGroup(masterMatch.name) : inferMuscleGroup(exerciseName),
    equipment: masterMatch ? inferEquipment(masterMatch.name) : inferEquipment(exerciseName),
    difficulty: masterMatch?.belt_min || 'White',
    instructions: masterMatch?.notes || '',
  }).returning();
  
  console.log(`  Created exercise: ${exerciseName}`);
  return { id: created.id, name: created.name };
}

/**
 * Seed exercises from master database into exercises table
 */
export async function seedExercisesFromMaster(): Promise<number> {
  console.log('Loading master exercises...');
  const masterData = loadMasterExercises();
  
  console.log(`Found ${masterData.length} exercises in master file`);
  
  const existingExercises = await db.select().from(exercises);
  const existingNames = new Set(existingExercises.map(e => e.name.toLowerCase()));
  
  let inserted = 0;
  
  for (const ex of masterData) {
    if (!existingNames.has(ex.name.toLowerCase())) {
      try {
        await db.insert(exercises).values({
          name: ex.name,
          category: inferCategory(ex.name),
          muscleGroup: inferMuscleGroup(ex.name),
          equipment: inferEquipment(ex.name),
          difficulty: ex.belt_min || 'White',
          instructions: ex.notes || '',
        });
        inserted++;
      } catch (error) {
        console.error(`Failed to insert exercise ${ex.name}:`, error);
      }
    }
  }
  
  console.log(`Inserted ${inserted} new exercises`);
  return inserted;
}

/**
 * Delete existing pathway templates (for re-seeding with corrected exercises)
 */
export async function deletePathwayTemplates(): Promise<number> {
  console.log('Deleting existing pathway templates...');
  
  let deleted = 0;
  
  for (const config of CURATED_TEMPLATE_TAXONOMY) {
    const [existing] = await db.select()
      .from(programTemplates)
      .where(eq(programTemplates.name, config.name));
    
    if (existing) {
      // Delete in correct order due to foreign keys
      const templateWeeksList = await db.select()
        .from(templateWeeks)
        .where(eq(templateWeeks.templateId, existing.id));
      
      for (const week of templateWeeksList) {
        const blocks = await db.select()
          .from(templateTrainingBlocks)
          .where(eq(templateTrainingBlocks.templateWeekId, week.id));
        
        for (const block of blocks) {
          await db.delete(templateTrainingBlockExercises)
            .where(eq(templateTrainingBlockExercises.blockId, block.id));
        }
        
        await db.delete(templateTrainingBlocks)
          .where(eq(templateTrainingBlocks.templateWeekId, week.id));
      }
      
      await db.delete(templateWeeks)
        .where(eq(templateWeeks.templateId, existing.id));
      
      await db.delete(templatePhases)
        .where(eq(templatePhases.templateId, existing.id));
      
      await db.delete(programTemplates)
        .where(eq(programTemplates.id, existing.id));
      
      deleted++;
      console.log(`  Deleted template: ${config.name}`);
    }
  }
  
  console.log(`Deleted ${deleted} pathway templates`);
  return deleted;
}

/**
 * Seed templates using curated exercise pools with phase-appropriate schemes
 */
export async function seedCuratedTemplates(): Promise<number> {
  console.log('\n=== Seeding Curated Pathway Templates ===\n');
  
  let templatesCreated = 0;
  const errors: string[] = [];
  
  for (const config of CURATED_TEMPLATE_TAXONOMY) {
    console.log(`Creating template: ${config.name}`);
    
    // Check if already exists
    const [existing] = await db.select()
      .from(programTemplates)
      .where(eq(programTemplates.name, config.name));
    
    if (existing) {
      console.log(`  Template ${config.name} already exists, skipping`);
      continue;
    }
    
    // Determine category
    const category = config.pathway === 'ACL' ? 'Rehab' 
                   : config.pathway === 'Hams' ? 'Rehab'
                   : config.pathway === 'Perf' ? 'Performance'
                   : 'Utility';
    
    // Create template
    const [template] = await db.insert(programTemplates).values({
      name: config.name,
      description: config.description,
      category,
      duration: config.durationWeeks,
      tags: [config.pathway, config.phase, config.level, config.environment, config.frequency],
      isPublic: 1,
    }).returning();
    
    // Determine phase type
    const phaseType = config.phase === 'P1' ? 'base'
                    : config.phase === 'P2' ? 'build'
                    : config.phase === 'P3' ? 'peak'
                    : config.phase === 'P4' ? 'recovery'
                    : 'recovery';
    
    // Create single phase
    const [phase] = await db.insert(templatePhases).values({
      templateId: template.id,
      name: `${config.pathway} ${config.phase}`,
      startWeek: 1,
      endWeek: config.durationWeeks,
      phaseType,
      goals: config.description,
      orderIndex: 0,
    }).returning();
    
    // Create weeks
    for (let week = 1; week <= config.durationWeeks; week++) {
      const [templateWeek] = await db.insert(templateWeeks).values({
        templateId: template.id,
        phaseId: phase.id,
        weekNumber: week,
        beltTarget: config.level,
        focus: config.blocks.flatMap(b => b.focus),
        notes: `Week ${week} of ${config.durationWeeks}`,
      }).returning();
      
      // Create blocks with curated exercises
      for (let blockIdx = 0; blockIdx < config.blocks.length; blockIdx++) {
        const blockConfig = config.blocks[blockIdx];
        
        // Get phase-specific scheme
        const scheme = PHASE_SCHEMES[blockConfig.schemeKey] || PHASE_SCHEMES['P2_strength'];
        const schemeString = `${scheme.sets} x ${scheme.reps} @ ${scheme.intensity}`;
        
        // Create block
        const [block] = await db.insert(templateTrainingBlocks).values({
          templateId: template.id,
          templateWeekId: templateWeek.id,
          weekNumber: week,
          dayNumber: blockConfig.day,
          title: blockConfig.title,
          belt: blockConfig.belt,
          focus: blockConfig.focus,
          notes: `${config.name} - ${blockConfig.title}`,
          scheme: schemeString,
          orderIndex: blockIdx,
        }).returning();
        
        // Add exercises from curated pool (up to 4 per block)
        const exercisesToAdd = blockConfig.exercisePool.slice(0, 4);
        
        for (let exIdx = 0; exIdx < exercisesToAdd.length; exIdx++) {
          const exerciseName = exercisesToAdd[exIdx];
          
          try {
            const exercise = await findOrCreateExercise(exerciseName);
            
            if (exercise) {
              await db.insert(templateTrainingBlockExercises).values({
                blockId: block.id,
                exerciseId: exercise.id,
                scheme: schemeString,
                notes: '',
                orderIndex: exIdx,
              });
            } else {
              errors.push(`Exercise not found: ${exerciseName} in ${config.name}`);
            }
          } catch (error) {
            errors.push(`Failed to add exercise ${exerciseName}: ${error}`);
          }
        }
      }
    }
    
    templatesCreated++;
    console.log(`  Created: ${config.name} (${config.durationWeeks} weeks, ${config.blocks.length} blocks/week)`);
  }
  
  if (errors.length > 0) {
    console.log('\nWarnings:');
    errors.forEach(e => console.log(`  - ${e}`));
  }
  
  console.log(`\nTotal templates created: ${templatesCreated}`);
  return templatesCreated;
}

/**
 * Run full template seed process:
 * 1. Seed exercises from master database
 * 2. Delete existing pathway templates
 * 3. Seed new templates with curated exercises
 */
export async function runFullSeed(): Promise<void> {
  console.log('=== Starting Full Curated Template Seed ===\n');
  
  // First ensure exercises are in DB
  await seedExercisesFromMaster();
  
  // Delete old pathway templates
  await deletePathwayTemplates();
  
  // Seed new templates with curated pools
  await seedCuratedTemplates();
  
  console.log('\n=== Seed Complete ===');
}

// Legacy export for backwards compatibility
export async function seedTemplates(): Promise<number> {
  return seedCuratedTemplates();
}
