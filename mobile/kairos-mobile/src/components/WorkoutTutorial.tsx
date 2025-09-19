import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';
import Card from './Card';
import AnimatedButton from './AnimatedButton';
import { AnimatedCard } from './AnimatedCard';
import { AnimatedFeedback } from './AnimatedFeedback';

const { width, height } = Dimensions.get('window');

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  target?: string;
  action?: 'tap' | 'swipe' | 'hold' | 'drag';
  position?: 'top' | 'bottom' | 'center';
  highlight?: boolean;
}

interface WorkoutTutorialProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
  tutorialType: 'first_workout' | 'exercise_form' | 'rest_timer' | 'progress_tracking';
}

const tutorialSteps: Record<string, TutorialStep[]> = {
  first_workout: [
    {
      id: '1',
      title: '¡Bienvenido a tu primer workout!',
      description: 'Te guiaremos paso a paso para que tengas la mejor experiencia.',
      icon: 'fitness',
      position: 'center',
    },
    {
      id: '2',
      title: 'Selecciona tu rutina',
      description: 'Elige una rutina que se adapte a tu nivel y objetivos.',
      icon: 'list',
      target: 'workout-list',
      action: 'tap',
      position: 'bottom',
      highlight: true,
    },
    {
      id: '3',
      title: 'Revisa los ejercicios',
      description: 'Puedes ver la descripción y demostración de cada ejercicio.',
      icon: 'eye',
      target: 'exercise-preview',
      action: 'tap',
      position: 'top',
      highlight: true,
    },
    {
      id: '4',
      title: 'Inicia tu workout',
      description: 'Presiona el botón "Comenzar" cuando estés listo.',
      icon: 'play',
      target: 'start-button',
      action: 'tap',
      position: 'top',
      highlight: true,
    },
    {
      id: '5',
      title: 'Sigue las instrucciones',
      description: 'Durante el ejercicio, sigue las indicaciones en pantalla.',
      icon: 'checkmark-circle',
      position: 'center',
    },
  ],
  exercise_form: [
    {
      id: '1',
      title: 'Forma correcta del ejercicio',
      description: 'La técnica correcta es más importante que el peso o las repeticiones.',
      icon: 'body',
      position: 'center',
    },
    {
      id: '2',
      title: 'Mira la demostración',
      description: 'Toca el ícono de video para ver cómo realizar el ejercicio.',
      icon: 'play-circle',
      target: 'video-demo',
      action: 'tap',
      position: 'bottom',
      highlight: true,
    },
    {
      id: '3',
      title: 'Ajusta el peso',
      description: 'Usa los botones + y - para ajustar el peso según tu capacidad.',
      icon: 'barbell',
      target: 'weight-controls',
      action: 'tap',
      position: 'top',
      highlight: true,
    },
    {
      id: '4',
      title: 'Registra tus repeticiones',
      description: 'Marca cada serie completada para llevar un registro preciso.',
      icon: 'checkmark',
      target: 'rep-counter',
      action: 'tap',
      position: 'bottom',
      highlight: true,
    },
  ],
  rest_timer: [
    {
      id: '1',
      title: 'Tiempo de descanso',
      description: 'El descanso entre series es crucial para tu rendimiento.',
      icon: 'timer',
      position: 'center',
    },
    {
      id: '2',
      title: 'Timer automático',
      description: 'El timer se inicia automáticamente al completar una serie.',
      icon: 'time',
      target: 'rest-timer',
      position: 'top',
      highlight: true,
    },
    {
      id: '3',
      title: 'Personaliza el tiempo',
      description: 'Puedes ajustar el tiempo de descanso según tus necesidades.',
      icon: 'settings',
      target: 'timer-settings',
      action: 'tap',
      position: 'bottom',
      highlight: true,
    },
    {
      id: '4',
      title: 'Continúa cuando estés listo',
      description: 'Puedes saltar el descanso si te sientes preparado.',
      icon: 'play-forward',
      target: 'skip-rest',
      action: 'tap',
      position: 'center',
      highlight: true,
    },
  ],
  progress_tracking: [
    {
      id: '1',
      title: 'Seguimiento de progreso',
      description: 'Registra tu progreso para ver tu evolución a lo largo del tiempo.',
      icon: 'trending-up',
      position: 'center',
    },
    {
      id: '2',
      title: 'Historial de workouts',
      description: 'Accede a tu historial para ver workouts anteriores.',
      icon: 'calendar',
      target: 'workout-history',
      action: 'tap',
      position: 'top',
      highlight: true,
    },
    {
      id: '3',
      title: 'Estadísticas personales',
      description: 'Ve tus estadísticas de fuerza, resistencia y progreso general.',
      icon: 'stats-chart',
      target: 'stats-view',
      action: 'tap',
      position: 'bottom',
      highlight: true,
    },
    {
      id: '4',
      title: 'Establece nuevos objetivos',
      description: 'Basándote en tu progreso, establece nuevas metas desafiantes.',
      icon: 'trophy',
      target: 'goals-section',
      action: 'tap',
      position: 'center',
      highlight: true,
    },
  ],
};

export const WorkoutTutorial: React.FC<WorkoutTutorialProps> = ({
  visible,
  onComplete,
  onSkip,
  tutorialType,
}) => {
  const { colors, isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const highlightScale = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  const steps = tutorialSteps[tutorialType] || [];
  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (visible) {
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      startPulseAnimation();
    } else {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (currentStepData?.highlight) {
      startHighlightAnimation();
    }
  }, [currentStep]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startHighlightAnimation = () => {
    Animated.sequence([
      Animated.timing(highlightScale, {
        toValue: 1.05,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(highlightScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setShowFeedback(true);
    setTimeout(() => {
      setShowFeedback(false);
      onComplete();
    }, 2000);
  };

  const handleSkip = () => {
    onSkip();
  };

  const getStepPosition = () => {
    switch (currentStepData?.position) {
      case 'top':
        return { top: height * 0.1 };
      case 'bottom':
        return { bottom: height * 0.1 };
      case 'center':
      default:
        return { top: height * 0.4 };
    }
  };

  const renderProgressDots = () => (
    <View style={styles.progressContainer}>
      {steps.map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            {
              backgroundColor: index <= currentStep ? colors.primary : colors.border,
            },
          ]}
        />
      ))}
    </View>
  );

  const renderTutorialCard = () => (
    <Animated.View
      style={[
        styles.tutorialCard,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          transform: [{ scale: pulseAnimation }],
        },
        getStepPosition(),
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
          <Ionicons
            name={currentStepData?.icon as any}
            size={24}
            color={colors.text.inverse}
          />
        </View>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.stepTitle, { color: colors.text.primary }]}>
        {currentStepData?.title}
      </Text>

      <Text style={[styles.stepDescription, { color: colors.text.secondary }]}>
        {currentStepData?.description}
      </Text>

      {currentStepData?.action && (
        <View style={styles.actionHint}>
          <Ionicons
            name={getActionIcon(currentStepData.action)}
            size={16}
            color={colors.primary}
          />
          <Text style={[styles.actionText, { color: colors.primary }]}>
            {getActionText(currentStepData.action)}
          </Text>
        </View>
      )}

      {renderProgressDots()}

      <View style={styles.navigationButtons}>
        {currentStep > 0 && (
          <AnimatedButton
            title="Anterior"
            onPress={handlePrevious}
            variant="outline"
            animationType="scale"
            icon="chevron-back"
            iconPosition="left"
            style={styles.previousButton}
          />
        )}

        <AnimatedButton
          title={currentStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
          onPress={handleNext}
          variant="primary"
          animationType="bounce"
          icon="chevron-forward"
          iconPosition="right"
          style={styles.nextButton}
        />
      </View>
    </Animated.View>
  );

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'tap':
        return 'finger-print';
      case 'swipe':
        return 'swap-horizontal';
      case 'hold':
        return 'hand-left';
      case 'drag':
        return 'move';
      default:
        return 'finger-print';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'tap':
        return 'Toca aquí';
      case 'swipe':
        return 'Desliza';
      case 'hold':
        return 'Mantén presionado';
      case 'drag':
        return 'Arrastra';
      default:
        return 'Interactúa';
    }
  };

  if (!visible || !currentStepData) {
    return null;
  }

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <Animated.View
          style={[
            styles.overlay,
            {
              backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)',
              opacity: overlayOpacity,
            },
          ]}
        >
          {renderTutorialCard()}
        </Animated.View>
      </Modal>

      <AnimatedFeedback
        visible={showFeedback}
        type="success"
        message="¡Tutorial completado!"
        position="center"
        animationType="bounce"
        duration={2000}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorialCard: {
    position: 'absolute',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: width - 40,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    padding: 4,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  previousButton: {
    borderWidth: 1,
  },
  nextButton: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 4,
  },
});

export default WorkoutTutorial;