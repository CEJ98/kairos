/**
 * Tipos para la navegación de la aplicación
 */

export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
  Onboarding: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: {
    token?: string;
    email?: string;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Workouts: undefined;
  Progress: undefined;
  Health: undefined;
  Profile: undefined;
};

export type WorkoutsStackParamList = {
  WorkoutsList: undefined;
  WorkoutDetail: { workoutId: string };
  WorkoutExecution: { workoutId: string };
  CreateWorkout: undefined;
  EditWorkout: { workoutId: string };
};

export type ProgressStackParamList = {
  ProgressOverview: undefined;
  ProgressDetail: { metricId: string };
  AddProgress: undefined;
};

export type ProfileStackParamList = {
  ProfileOverview: undefined;
  EditProfile: undefined;
  Settings: undefined;
  OfflineSettings: undefined;
  ThemeSettings: undefined;
  HealthSettings: undefined;
  Subscription: undefined;
  Help: undefined;
};