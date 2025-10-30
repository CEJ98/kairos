export interface BodyWeightData {
  id: string;
  date: Date;
  weight: number;
  bodyFat: number | null;
  muscleMass: number | null;
}

export interface BodyMeasurementsData {
  id: string;
  date: Date;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  leftArm: number | null;
  rightArm: number | null;
  leftThigh: number | null;
  rightThigh: number | null;
  shoulders: number | null;
}

export interface ProgressPhotoData {
  id: string;
  url: string;
  createdAt: Date;
  notes: string | null;
}

export interface MetricsSummary {
  currentWeight: number | null;
  weightChange: number | null;
  currentBodyFat: number | null;
  bodyFatChange: number | null;
  totalMeasurements: number;
  totalPhotos: number;
}

// Client-side input types for forms (avoid importing from server actions)
export interface BodyWeightInput {
  weight: number;
  bodyFat?: number;
  muscleMass?: number;
  date?: string;
}

export interface BodyMeasurementsInput {
  chest?: number;
  waist?: number;
  hips?: number;
  leftArm?: number;
  rightArm?: number;
  leftThigh?: number;
  rightThigh?: number;
  shoulders?: number;
  date?: string;
}