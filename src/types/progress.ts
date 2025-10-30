export interface BodyWeightData {
  date: string;
  weight: number;
  bodyFat?: number;
  muscleMass?: number;
}

export interface StrengthData {
  date: string;
  exercise: string;
  oneRepMax: number;
}

export interface VolumeData {
  date: string;
  totalVolume: number;
  sets: number;
  reps: number;
}

export interface AdherenceData {
  week: string;
  adherence: number;
  completed: number;
  planned: number;
}

export interface PersonalRecords {
  squat: number;
  bench: number;
  deadlift: number;
  totalVolume: number;
  longestStreak: number;
}

export interface ProgressMetrics {
  bodyWeight: BodyWeightData[];
  strength: StrengthData[];
  volume: VolumeData[];
  adherence: AdherenceData[];
  personalRecords: PersonalRecords;
  currentStats: {
    weight: number;
    bodyFat: number;
    adherenceRate: number;
    weeklyVolume: number;
  };
}