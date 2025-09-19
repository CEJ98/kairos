import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  withSpring,
  withTiming,
  runOnJS,
  Extrapolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';
import Button from './Button';
import Card from './Card';
import { AnimatedCard } from './AnimatedCard';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  type: 'welcome' | 'goals' | 'experience' | 'preferences' | 'complete';
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  interactive?: boolean;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    type: 'welcome',
    title: '¡Bienvenido a Kairos!',
    subtitle: 'Tu compañero fitness personal',
    description: 'Descubre una nueva forma de entrenar con rutinas personalizadas y seguimiento inteligente.',
    icon: 'fitness',
  },
  {
    id: '2',
    type: 'goals',
    title: '¿Cuáles son tus objetivos?',
    description: 'Selecciona tus metas principales para personalizar tu experiencia.',
    interactive: true,
  },
  {
    id: '3',
    type: 'experience',
    title: '¿Cuál es tu nivel de experiencia?',
    description: 'Esto nos ayudará a recomendarte rutinas adecuadas.',
    interactive: true,
  },
  {
    id: '4',
    type: 'preferences',
    title: 'Personaliza tu experiencia',
    description: 'Configura tus preferencias de entrenamiento.',
    interactive: true,
  },
  {
    id: '5',
    type: 'complete',
    title: '¡Todo listo!',
    subtitle: 'Tu perfil ha sido configurado',
    description: 'Comienza tu viaje fitness con rutinas personalizadas.',
    icon: 'checkmark-circle',
  },
];

const goals = [
  { id: 'weight_loss', title: 'Perder peso', icon: 'trending-down', color: '#FF6B6B' },
  { id: 'muscle_gain', title: 'Ganar músculo', icon: 'fitness', color: '#4ECDC4' },
  { id: 'endurance', title: 'Resistencia', icon: 'flash', color: '#45B7D1' },
  { id: 'strength', title: 'Fuerza', icon: 'barbell', color: '#96CEB4' },
  { id: 'flexibility', title: 'Flexibilidad', icon: 'body', color: '#FFEAA7' },
  { id: 'general', title: 'Salud general', icon: 'heart', color: '#DDA0DD' },
];

const experienceLevels = [
  { id: 'beginner', title: 'Principiante', description: 'Nuevo en el fitness', icon: 'leaf' },
  { id: 'intermediate', title: 'Intermedio', description: '6 meses - 2 años', icon: 'trending-up' },
  { id: 'advanced', title: 'Avanzado', description: 'Más de 2 años', icon: 'trophy' },
];

export default function InteractiveOnboarding() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const { completeOnboarding } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string>('');
  const [userName, setUserName] = useState('');
  const [workoutDays, setWorkoutDays] = useState(3);
  const [workoutDuration, setWorkoutDuration] = useState(45);
  const [isCompleting, setIsCompleting] = useState(false);

  const slideProgress = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    slideProgress.value = withSpring(currentIndex / (slides.length - 1));
  }, [currentIndex]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      const index = Math.round(event.contentOffset.x / width);
      runOnJS(setCurrentIndex)(index);
    },
  });

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      scrollViewRef.current?.scrollTo({
        x: prevIndex * width,
        animated: true,
      });
      setCurrentIndex(prevIndex);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Saltar configuración',
      '¿Estás seguro de que quieres saltar la configuración inicial? Podrás configurar esto más tarde.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Saltar', onPress: () => completeOnboarding() },
      ]
    );
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    
    // Simular guardado de configuración
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Aquí guardarías la configuración del usuario
    const userConfig = {
      name: userName,
      goals: selectedGoals,
      experience: selectedExperience,
      workoutDays,
      workoutDuration,
      onboardingCompleted: true,
    };
    
    console.log('User config:', userConfig);
    
    setIsCompleting(false);
    await completeOnboarding();
  };

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const canProceed = () => {
    const slide = slides[currentIndex];
    switch (slide.type) {
      case 'goals':
        return selectedGoals.length > 0;
      case 'experience':
        return selectedExperience !== '';
      case 'preferences':
        return userName.trim() !== '';
      default:
        return true;
    }
  };

  const renderProgressBar = () => {
    const progressStyle = useAnimatedStyle(() => {
      return {
        width: withTiming(`${(slideProgress.value * 100)}%`, { duration: 300 }),
      };
    });

    return (
      <View style={[styles.progressContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <Animated.View 
            style={[styles.progressBar, { backgroundColor: colors.primary }, progressStyle]} 
          />
        </View>
        <Text style={[styles.progressText, { color: colors.text.secondary }]}>
          {currentIndex + 1} de {slides.length}
        </Text>
      </View>
    );
  };

  const renderWelcomeSlide = (slide: OnboardingSlide) => (
    <View style={styles.slide}>
      <AnimatedCard 
        variant="elevated" 
        animationType="scale" 
        style={styles.welcomeCard}
      >
        <View style={styles.iconContainer}>
          <Ionicons 
            name={slide.icon as any} 
            size={80} 
            color={colors.primary} 
          />
        </View>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {slide.title}
        </Text>
        {slide.subtitle && (
          <Text style={[styles.subtitle, { color: colors.primary }]}>
            {slide.subtitle}
          </Text>
        )}
        <Text style={[styles.description, { color: colors.text.secondary }]}>
          {slide.description}
        </Text>
      </AnimatedCard>
    </View>
  );

  const renderGoalsSlide = (slide: OnboardingSlide) => (
    <View style={styles.slide}>
      <Text style={[styles.title, { color: colors.text.primary }]}>
        {slide.title}
      </Text>
      <Text style={[styles.description, { color: colors.text.secondary, marginBottom: 30 }]}>
        {slide.description}
      </Text>
      
      <View style={styles.goalsGrid}>
        {goals.map((goal) => {
          const isSelected = selectedGoals.includes(goal.id);
          return (
            <TouchableOpacity
              key={goal.id}
              onPress={() => toggleGoal(goal.id)}
              style={{
                ...styles.goalCard,
                backgroundColor: isSelected ? goal.color : colors.background,
                borderColor: isSelected ? goal.color : colors.border,
                borderWidth: 2,
              }}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={goal.icon as any} 
                size={24} 
                color={isSelected ? colors.text.inverse : colors.text.primary} 
              />
              <Text style={[
                styles.goalTitle,
                { color: isSelected ? colors.text.inverse : colors.text.primary }
              ]}>
                {goal.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderExperienceSlide = (slide: OnboardingSlide) => (
    <View style={styles.slide}>
      <Text style={[styles.title, { color: colors.text.primary }]}>
        {slide.title}
      </Text>
      <Text style={[styles.description, { color: colors.text.secondary, marginBottom: 30 }]}>
        {slide.description}
      </Text>
      
      <View style={styles.experienceContainer}>
        {experienceLevels.map((level) => {
          const isSelected = selectedExperience === level.id;
          return (
            <AnimatedCard
              key={level.id}
              variant={isSelected ? "elevated" : "outlined"}
              animationType="scale"
              onPress={() => setSelectedExperience(level.id)}
              style={{
                ...styles.experienceCard,
                backgroundColor: isSelected ? colors.primary : colors.background,
                borderColor: isSelected ? colors.primary : colors.border,
              }}
            >
              <Ionicons 
                name={level.icon as any} 
                size={32} 
                color={isSelected ? colors.text.inverse : colors.primary} 
              />
              <Text style={[
                styles.experienceTitle,
                { color: isSelected ? colors.text.inverse : colors.text.primary }
              ]}>
                {level.title}
              </Text>
              <Text style={[
                styles.experienceDescription,
                { color: isSelected ? colors.text.inverse : colors.text.secondary }
              ]}>
                {level.description}
              </Text>
            </AnimatedCard>
          );
        })}
      </View>
    </View>
  );

  const renderPreferencesSlide = (slide: OnboardingSlide) => (
    <View style={styles.slide}>
      <Text style={[styles.title, { color: colors.text.primary }]}>
        {slide.title}
      </Text>
      <Text style={[styles.description, { color: colors.text.secondary, marginBottom: 30 }]}>
        {slide.description}
      </Text>
      
      <View style={styles.preferencesContainer}>
        <Card style={styles.preferenceCard}>
          <Text style={[styles.preferenceLabel, { color: colors.text.primary }]}>
            ¿Cómo te gustaría que te llamemos?
          </Text>
          <TextInput
            style={[
              styles.nameInput,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text.primary,
              },
            ]}
            placeholder="Tu nombre"
            placeholderTextColor={colors.text.secondary}
            value={userName}
            onChangeText={setUserName}
          />
        </Card>

        <Card style={styles.preferenceCard}>
          <Text style={[styles.preferenceLabel, { color: colors.text.primary }]}>
            ¿Cuántos días por semana quieres entrenar?
          </Text>
          <View style={styles.daysContainer}>
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  {
                    backgroundColor: workoutDays === day ? colors.primary : colors.background,
                    borderColor: workoutDays === day ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setWorkoutDays(day)}
              >
                <Text style={[
                  styles.dayText,
                  { color: workoutDays === day ? colors.text.inverse : colors.text.primary }
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card style={styles.preferenceCard}>
          <Text style={[styles.preferenceLabel, { color: colors.text.primary }]}>
            Duración ideal por sesión: {workoutDuration} min
          </Text>
          <View style={styles.durationContainer}>
            {[30, 45, 60, 90].map((duration) => (
              <TouchableOpacity
                key={duration}
                style={[
                  styles.durationButton,
                  {
                    backgroundColor: workoutDuration === duration ? colors.primary : colors.background,
                    borderColor: workoutDuration === duration ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setWorkoutDuration(duration)}
              >
                <Text style={[
                  styles.durationText,
                  { color: workoutDuration === duration ? colors.text.inverse : colors.text.primary }
                ]}>
                  {duration}min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </View>
    </View>
  );

  const renderCompleteSlide = (slide: OnboardingSlide) => (
    <View style={styles.slide}>
      <AnimatedCard 
        variant="elevated" 
        animationType="scale" 
        style={styles.completeCard}
      >
        <View style={styles.iconContainer}>
          <Ionicons 
            name={slide.icon as any} 
            size={80} 
            color={colors.success || colors.primary} 
          />
        </View>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {slide.title}
        </Text>
        {slide.subtitle && (
          <Text style={[styles.subtitle, { color: colors.success || colors.primary }]}>
            {slide.subtitle}
          </Text>
        )}
        <Text style={[styles.description, { color: colors.text.secondary }]}>
          {slide.description}
        </Text>
        
        <View style={styles.summaryContainer}>
          <Text style={[styles.summaryTitle, { color: colors.text.primary }]}>
            Tu configuración:
          </Text>
          <Text style={[styles.summaryText, { color: colors.text.secondary }]}>
            • Objetivos: {selectedGoals.length} seleccionados
          </Text>
          <Text style={[styles.summaryText, { color: colors.text.secondary }]}>
            • Nivel: {experienceLevels.find(l => l.id === selectedExperience)?.title}
          </Text>
          <Text style={[styles.summaryText, { color: colors.text.secondary }]}>
            • Frecuencia: {workoutDays} días/semana
          </Text>
          <Text style={[styles.summaryText, { color: colors.text.secondary }]}>
            • Duración: {workoutDuration} minutos
          </Text>
        </View>
      </AnimatedCard>
    </View>
  );

  const renderSlide = (slide: OnboardingSlide, index: number) => {
    switch (slide.type) {
      case 'welcome':
        return renderWelcomeSlide(slide);
      case 'goals':
        return renderGoalsSlide(slide);
      case 'experience':
        return renderExperienceSlide(slide);
      case 'preferences':
        return renderPreferencesSlide(slide);
      case 'complete':
        return renderCompleteSlide(slide);
      default:
        return renderWelcomeSlide(slide);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderProgressBar()}
      
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        activeOpacity={0.7}
      >
        <Text style={[styles.skipText, { color: colors.text.secondary }]}>
          Saltar
        </Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide, index) => (
          <View key={slide.id} style={{ width }}>
            {renderSlide(slide, index)}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.navigationContainer}>
          {currentIndex > 0 && (
            <TouchableOpacity
              onPress={handlePrevious}
              style={{
                ...styles.navButton,
                backgroundColor: colors.background,
                borderColor: colors.border,
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text.primary} />
              <Text style={[styles.navButtonText, { color: colors.text.primary }]}>
                Anterior
              </Text>
            </TouchableOpacity>
          )}
          
          <View style={{ flex: 1 }} />
          
          <TouchableOpacity
            onPress={currentIndex === slides.length - 1 ? handleComplete : handleNext}
            style={{
              ...styles.nextButton,
              backgroundColor: canProceed() ? colors.primary : colors.border,
              opacity: canProceed() ? 1 : 0.5,
            }}
            disabled={!canProceed() || isCompleting}
            activeOpacity={0.8}
          >
            {isCompleting ? (
              <Text style={[styles.nextButtonText, { color: colors.text.inverse }]}>
                Configurando...
              </Text>
            ) : (
              <>
                <Text style={[styles.nextButtonText, { color: colors.text.inverse }]}>
                  {currentIndex === slides.length - 1 ? '¡Comenzar!' : 'Siguiente'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.text.inverse} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  welcomeCard: {
    padding: 30,
    alignItems: 'center',
    marginTop: 40,
  },
  completeCard: {
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  goalCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  experienceContainer: {
    gap: 16,
  },
  experienceCard: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
  },
  experienceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  experienceDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  preferencesContainer: {
    gap: 20,
  },
  preferenceCard: {
    padding: 20,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationButton: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryContainer: {
    marginTop: 20,
    alignSelf: 'stretch',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
});