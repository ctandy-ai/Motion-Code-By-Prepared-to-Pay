CREATE TABLE "achievements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"rarity" text NOT NULL,
	"icon_url" text,
	"xp_reward" integer NOT NULL,
	"requirement" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athlete_achievements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" varchar NOT NULL,
	"achievement_id" varchar NOT NULL,
	"unlocked_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "athlete_programs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" varchar NOT NULL,
	"program_id" varchar NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athlete_stats" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" varchar NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_workout_date" timestamp,
	"total_workouts" integer DEFAULT 0 NOT NULL,
	"total_sets_completed" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "athlete_stats_athlete_id_unique" UNIQUE("athlete_id")
);
--> statement-breakpoint
CREATE TABLE "athlete_teams" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" varchar NOT NULL,
	"team_id" varchar NOT NULL,
	CONSTRAINT "athlete_teams_athlete_id_team_id_unique" UNIQUE("athlete_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "athletes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"team" text,
	"position" text,
	"status" text DEFAULT 'Registered',
	"avatar_url" text,
	"date_joined" timestamp DEFAULT now(),
	CONSTRAINT "athletes_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "block_exercises" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"block_id" varchar NOT NULL,
	"exercise_id" varchar NOT NULL,
	"scheme" text,
	"notes" text,
	"order_index" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "block_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"belt" text NOT NULL,
	"focus" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"scheme" text,
	"is_public" integer DEFAULT 0 NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "challenge_completions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" varchar NOT NULL,
	"challenge_id" varchar NOT NULL,
	"completed_at" timestamp DEFAULT now(),
	"progress" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_heuristics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" varchar DEFAULT 'default-coach',
	"name" text NOT NULL,
	"description" text,
	"trigger_type" text NOT NULL,
	"trigger_condition" text NOT NULL,
	"action_type" text NOT NULL,
	"action_details" text NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_challenges" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"xp_reward" integer NOT NULL,
	"target_value" integer NOT NULL,
	"challenge_type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"muscle_group" text NOT NULL,
	"equipment" text NOT NULL,
	"difficulty" text NOT NULL,
	"instructions" text NOT NULL,
	"video_url" text,
	"thumbnail_url" text
);
--> statement-breakpoint
CREATE TABLE "pending_ai_actions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action_type" varchar NOT NULL,
	"description" text NOT NULL,
	"details" text NOT NULL,
	"athlete_id" varchar,
	"program_id" varchar,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "personal_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" varchar NOT NULL,
	"exercise_id" varchar NOT NULL,
	"max_weight" real NOT NULL,
	"reps" integer NOT NULL,
	"achieved_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "program_exercises" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" varchar NOT NULL,
	"exercise_id" varchar NOT NULL,
	"week_number" integer NOT NULL,
	"day_number" integer NOT NULL,
	"sets" integer NOT NULL,
	"reps" integer NOT NULL,
	"rest_seconds" integer,
	"notes" text,
	"order_index" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_phases" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" varchar NOT NULL,
	"name" text NOT NULL,
	"start_week" integer NOT NULL,
	"end_week" integer NOT NULL,
	"phase_type" text NOT NULL,
	"goals" text,
	"order_index" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"duration" integer NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"is_public" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "program_weeks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" varchar NOT NULL,
	"phase_id" varchar,
	"week_number" integer NOT NULL,
	"belt_target" text,
	"focus" text[],
	"volume_target" integer,
	"intensity_zone" text,
	"notes" text,
	"running_qualities" text,
	"mbs_primary" text,
	"strength_theme" text,
	"plyo_contacts_cap" integer,
	"testing_gateway" text
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" varchar DEFAULT 'default-coach',
	"name" text NOT NULL,
	"description" text,
	"duration" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "readiness_surveys" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" varchar NOT NULL,
	"survey_date" timestamp DEFAULT now(),
	"sleep_quality" integer NOT NULL,
	"sleep_hours" real NOT NULL,
	"muscle_soreness" integer NOT NULL,
	"energy_level" integer NOT NULL,
	"stress_level" integer NOT NULL,
	"mood" integer NOT NULL,
	"overall_readiness" integer NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "teams_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "template_block_exercises" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar NOT NULL,
	"exercise_id" varchar NOT NULL,
	"scheme" text,
	"notes" text,
	"order_index" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_exercises" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar NOT NULL,
	"exercise_id" varchar NOT NULL,
	"week_number" integer NOT NULL,
	"day_number" integer NOT NULL,
	"sets" integer NOT NULL,
	"reps" integer NOT NULL,
	"rest_seconds" integer,
	"notes" text,
	"order_index" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_phases" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar NOT NULL,
	"name" text NOT NULL,
	"start_week" integer NOT NULL,
	"end_week" integer NOT NULL,
	"phase_type" text NOT NULL,
	"goals" text,
	"order_index" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_training_block_exercises" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"block_id" varchar NOT NULL,
	"exercise_id" varchar NOT NULL,
	"scheme" text,
	"notes" text,
	"order_index" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_training_blocks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar NOT NULL,
	"template_week_id" varchar,
	"week_number" integer NOT NULL,
	"day_number" integer NOT NULL,
	"title" text NOT NULL,
	"belt" text NOT NULL,
	"focus" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"notes" text,
	"scheme" text,
	"order_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "template_week_metadata" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar NOT NULL,
	"week_number" integer NOT NULL,
	"phase" text,
	"belt_target" text,
	"focus" text,
	"running_qualities" text,
	"mbs_primary" text,
	"strength_theme" text,
	"plyo_contacts_cap" integer,
	"testing_gateway" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "template_weeks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar NOT NULL,
	"phase_id" varchar,
	"week_number" integer NOT NULL,
	"belt_target" text,
	"focus" text[],
	"volume_target" integer,
	"intensity_zone" text,
	"notes" text,
	"running_qualities" text,
	"mbs_primary" text,
	"strength_theme" text,
	"plyo_contacts_cap" integer,
	"testing_gateway" text
);
--> statement-breakpoint
CREATE TABLE "training_blocks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" varchar NOT NULL,
	"program_week_id" varchar,
	"week_number" integer NOT NULL,
	"day_number" integer NOT NULL,
	"title" text NOT NULL,
	"belt" text NOT NULL,
	"focus" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"notes" text,
	"scheme" text,
	"order_index" integer NOT NULL,
	"ai_generated" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "workout_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" varchar NOT NULL,
	"program_exercise_id" varchar NOT NULL,
	"exercise_id" varchar NOT NULL,
	"completed_at" timestamp DEFAULT now(),
	"sets" integer NOT NULL,
	"reps_per_set" text NOT NULL,
	"weight_per_set" text NOT NULL,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "block_exercises" ADD CONSTRAINT "block_exercises_block_id_training_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."training_blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_exercises" ADD CONSTRAINT "block_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_phases" ADD CONSTRAINT "program_phases_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_weeks" ADD CONSTRAINT "program_weeks_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_weeks" ADD CONSTRAINT "program_weeks_phase_id_program_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."program_phases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_block_exercises" ADD CONSTRAINT "template_block_exercises_template_id_block_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."block_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_block_exercises" ADD CONSTRAINT "template_block_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_phases" ADD CONSTRAINT "template_phases_template_id_program_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."program_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_training_block_exercises" ADD CONSTRAINT "template_training_block_exercises_block_id_template_training_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."template_training_blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_training_block_exercises" ADD CONSTRAINT "template_training_block_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_training_blocks" ADD CONSTRAINT "template_training_blocks_template_id_program_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."program_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_training_blocks" ADD CONSTRAINT "template_training_blocks_template_week_id_template_weeks_id_fk" FOREIGN KEY ("template_week_id") REFERENCES "public"."template_weeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_weeks" ADD CONSTRAINT "template_weeks_template_id_program_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."program_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_weeks" ADD CONSTRAINT "template_weeks_phase_id_template_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."template_phases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_blocks" ADD CONSTRAINT "training_blocks_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_blocks" ADD CONSTRAINT "training_blocks_program_week_id_program_weeks_id_fk" FOREIGN KEY ("program_week_id") REFERENCES "public"."program_weeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "block_exercises_block_id_idx" ON "block_exercises" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX "program_phases_program_id_idx" ON "program_phases" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "program_weeks_program_week_idx" ON "program_weeks" USING btree ("program_id","week_number");--> statement-breakpoint
CREATE INDEX "readiness_surveys_athlete_date_idx" ON "readiness_surveys" USING btree ("athlete_id","survey_date");--> statement-breakpoint
CREATE INDEX "template_block_exercises_template_id_idx" ON "template_block_exercises" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "template_phases_template_id_idx" ON "template_phases" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "template_training_block_exercises_block_id_idx" ON "template_training_block_exercises" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX "template_training_blocks_week_day_idx" ON "template_training_blocks" USING btree ("template_id","week_number","day_number");--> statement-breakpoint
CREATE INDEX "template_training_blocks_order_idx" ON "template_training_blocks" USING btree ("template_id","week_number","day_number","order_index");--> statement-breakpoint
CREATE INDEX "template_weeks_template_week_idx" ON "template_weeks" USING btree ("template_id","week_number");--> statement-breakpoint
CREATE INDEX "training_blocks_program_week_day_idx" ON "training_blocks" USING btree ("program_id","week_number","day_number");--> statement-breakpoint
CREATE INDEX "training_blocks_order_idx" ON "training_blocks" USING btree ("program_id","week_number","day_number","order_index");