import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TutorialType = 'onboarding' | 'first_workout' | 'exercise_form' | 'rest_timer' | 'progress_tracking';

interface TutorialState {
  [key: string]: boolean;
}

interface UseTutorialReturn {
  // Estado de tutoriales
  tutorialState: TutorialState;
  isLoading: boolean;
  
  // Funciones de control
  isTutorialCompleted: (type: TutorialType) => boolean;
  markTutorialCompleted: (type: TutorialType) => Promise<void>;
  resetTutorial: (type: TutorialType) => Promise<void>;
  resetAllTutorials: () => Promise<void>;
  
  // Funciones de utilidad
  shouldShowTutorial: (type: TutorialType, condition?: boolean) => boolean;
  getTutorialProgress: () => { completed: number; total: number; percentage: number };
}

const TUTORIAL_STORAGE_KEY = '@kairos_tutorials';

const DEFAULT_TUTORIAL_STATE: TutorialState = {
  onboarding: false,
  first_workout: false,
  exercise_form: false,
  rest_timer: false,
  progress_tracking: false,
};

const TUTORIAL_TYPES: TutorialType[] = [
  'onboarding',
  'first_workout',
  'exercise_form',
  'rest_timer',
  'progress_tracking',
];

export const useTutorial = (): UseTutorialReturn => {
  const [tutorialState, setTutorialState] = useState<TutorialState>(DEFAULT_TUTORIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar estado de tutoriales al inicializar
  useEffect(() => {
    loadTutorialState();
  }, []);

  const loadTutorialState = async () => {
    try {
      setIsLoading(true);
      const storedState = await AsyncStorage.getItem(TUTORIAL_STORAGE_KEY);
      
      if (storedState) {
        const parsedState = JSON.parse(storedState);
        setTutorialState({ ...DEFAULT_TUTORIAL_STATE, ...parsedState });
      } else {
        setTutorialState(DEFAULT_TUTORIAL_STATE);
      }
    } catch (error) {
      console.error('Error loading tutorial state:', error);
      setTutorialState(DEFAULT_TUTORIAL_STATE);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTutorialState = async (newState: TutorialState) => {
    try {
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('Error saving tutorial state:', error);
    }
  };

  const isTutorialCompleted = useCallback(
    (type: TutorialType): boolean => {
      return tutorialState[type] || false;
    },
    [tutorialState]
  );

  const markTutorialCompleted = useCallback(
    async (type: TutorialType): Promise<void> => {
      const newState = {
        ...tutorialState,
        [type]: true,
      };
      
      setTutorialState(newState);
      await saveTutorialState(newState);
      
      // Log para analytics (opcional)
      console.log(`Tutorial completed: ${type}`);
    },
    [tutorialState]
  );

  const resetTutorial = useCallback(
    async (type: TutorialType): Promise<void> => {
      const newState = {
        ...tutorialState,
        [type]: false,
      };
      
      setTutorialState(newState);
      await saveTutorialState(newState);
      
      console.log(`Tutorial reset: ${type}`);
    },
    [tutorialState]
  );

  const resetAllTutorials = useCallback(async (): Promise<void> => {
    setTutorialState(DEFAULT_TUTORIAL_STATE);
    await saveTutorialState(DEFAULT_TUTORIAL_STATE);
    
    console.log('All tutorials reset');
  }, []);

  const shouldShowTutorial = useCallback(
    (type: TutorialType, condition: boolean = true): boolean => {
      return !isTutorialCompleted(type) && condition;
    },
    [isTutorialCompleted]
  );

  const getTutorialProgress = useCallback((): {
    completed: number;
    total: number;
    percentage: number;
  } => {
    const completed = TUTORIAL_TYPES.filter(type => isTutorialCompleted(type)).length;
    const total = TUTORIAL_TYPES.length;
    const percentage = Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  }, [isTutorialCompleted]);

  return {
    tutorialState,
    isLoading,
    isTutorialCompleted,
    markTutorialCompleted,
    resetTutorial,
    resetAllTutorials,
    shouldShowTutorial,
    getTutorialProgress,
  };
};

// Hook adicional para manejar secuencias de tutoriales
export const useTutorialSequence = (sequence: TutorialType[]) => {
  const { isTutorialCompleted, markTutorialCompleted } = useTutorial();
  const [currentTutorialIndex, setCurrentTutorialIndex] = useState(0);
  const [isSequenceActive, setIsSequenceActive] = useState(false);

  const startSequence = useCallback(() => {
    // Encontrar el primer tutorial no completado
    const firstIncompleteIndex = sequence.findIndex(type => !isTutorialCompleted(type));
    
    if (firstIncompleteIndex !== -1) {
      setCurrentTutorialIndex(firstIncompleteIndex);
      setIsSequenceActive(true);
    }
  }, [sequence, isTutorialCompleted]);

  const nextTutorial = useCallback(async () => {
    const currentType = sequence[currentTutorialIndex];
    
    if (currentType) {
      await markTutorialCompleted(currentType);
    }
    
    const nextIndex = currentTutorialIndex + 1;
    
    if (nextIndex < sequence.length) {
      setCurrentTutorialIndex(nextIndex);
    } else {
      setIsSequenceActive(false);
    }
  }, [sequence, currentTutorialIndex, markTutorialCompleted]);

  const skipSequence = useCallback(() => {
    setIsSequenceActive(false);
  }, []);

  const getCurrentTutorial = useCallback((): TutorialType | null => {
    if (isSequenceActive && currentTutorialIndex < sequence.length) {
      return sequence[currentTutorialIndex];
    }
    return null;
  }, [sequence, currentTutorialIndex, isSequenceActive]);

  return {
    isSequenceActive,
    currentTutorial: getCurrentTutorial(),
    startSequence,
    nextTutorial,
    skipSequence,
    progress: {
      current: currentTutorialIndex + 1,
      total: sequence.length,
      percentage: Math.round(((currentTutorialIndex + 1) / sequence.length) * 100),
    },
  };
};

export default useTutorial;