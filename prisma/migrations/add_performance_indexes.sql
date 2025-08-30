-- Performance optimization indexes for Kairos Fitness
-- Run this after the main schema migration

-- User queries optimization
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users("createdAt");

-- Workout queries optimization
CREATE INDEX IF NOT EXISTS idx_workouts_creator_id ON workouts("creatorId");
CREATE INDEX IF NOT EXISTS idx_workouts_assigned_to_id ON workouts("assignedToId");
CREATE INDEX IF NOT EXISTS idx_workouts_category ON workouts(category);
CREATE INDEX IF NOT EXISTS idx_workouts_is_template ON workouts("isTemplate");
CREATE INDEX IF NOT EXISTS idx_workouts_is_public ON workouts("isPublic");
CREATE INDEX IF NOT EXISTS idx_workouts_created_at ON workouts("createdAt");

-- Composite index for common workout queries
CREATE INDEX IF NOT EXISTS idx_workouts_user_template ON workouts("creatorId", "isTemplate");
CREATE INDEX IF NOT EXISTS idx_workouts_assigned_active ON workouts("assignedToId", "isTemplate") WHERE "assignedToId" IS NOT NULL;

-- Workout sessions optimization
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions("userId");
CREATE INDEX IF NOT EXISTS idx_workout_sessions_workout_id ON workout_sessions("workoutId");
CREATE INDEX IF NOT EXISTS idx_workout_sessions_status ON workout_sessions(status);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_start_time ON workout_sessions("startTime");

-- Composite index for session analytics
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON workout_sessions("userId", "startTime");
CREATE INDEX IF NOT EXISTS idx_sessions_status_date ON workout_sessions(status, "startTime");

-- Exercise logs optimization
CREATE INDEX IF NOT EXISTS idx_exercise_logs_session_id ON exercise_logs("sessionId");
CREATE INDEX IF NOT EXISTS idx_exercise_logs_exercise_id ON exercise_logs("exerciseId");

-- Exercise queries
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX IF NOT EXISTS idx_exercises_active ON exercises("isActive");
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_groups ON exercises("muscleGroups") WHERE "muscleGroups" IS NOT NULL;

-- Workout exercises optimization
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON workout_exercises("workoutId");
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise_id ON workout_exercises("exerciseId");

-- Subscription queries optimization
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions("userId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions("stripeCustomerId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON subscriptions("planType");

-- Body measurements optimization
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_id ON body_measurements("userId");
CREATE INDEX IF NOT EXISTS idx_body_measurements_measured_at ON body_measurements("measuredAt");

-- Personal records optimization
CREATE INDEX IF NOT EXISTS idx_personal_records_user_id ON personal_records("userId");
CREATE INDEX IF NOT EXISTS idx_personal_records_exercise_id ON personal_records("exerciseId");
CREATE INDEX IF NOT EXISTS idx_personal_records_type ON personal_records("recordType");

-- Client and trainer profile optimization
CREATE INDEX IF NOT EXISTS idx_client_profiles_user_id ON client_profiles("userId");
CREATE INDEX IF NOT EXISTS idx_client_profiles_trainer_id ON client_profiles("trainerId") WHERE "trainerId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_user_id ON trainer_profiles("userId");
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_active ON trainer_profiles("isActive");

-- Messages optimization
CREATE INDEX IF NOT EXISTS idx_messages_from_id ON messages("fromId");
CREATE INDEX IF NOT EXISTS idx_messages_to_id ON messages("toId");
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages("createdAt");
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages("isRead");

-- Composite index for message threads
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages("fromId", "toId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages("toId", "isRead") WHERE "isRead" = false;

-- Analyze tables for optimal query planning
ANALYZE users;
ANALYZE workouts;
ANALYZE workout_sessions;
ANALYZE exercise_logs;
ANALYZE exercises;
ANALYZE subscriptions;
ANALYZE body_measurements;
ANALYZE personal_records;
ANALYZE client_profiles;
ANALYZE trainer_profiles;
ANALYZE messages;