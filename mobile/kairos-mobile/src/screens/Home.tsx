import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';
import Card from '../components/Card';
import AnimatedButton from '../components/AnimatedButton';
import ThemeToggle from '../components/ThemeToggle';
import HomeWidget from '../components/HomeWidget';
import { DashboardSkeleton, WorkoutCardSkeleton, SkeletonGroup } from '../components/SkeletonLoader';

export default function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  
  // Datos de ejemplo para la pantalla de inicio
  const recentWorkouts = [
    { id: '1', name: 'Entrenamiento Full Body', date: '2023-07-15', difficulty: 'medium' },
    { id: '2', name: 'Cardio HIIT', date: '2023-07-12', difficulty: 'hard' },
  ];
  
  const upcomingWorkouts = [
    { id: '3', name: 'Día de Piernas', date: '2023-07-18', difficulty: 'hard' },
    { id: '4', name: 'Yoga y Estiramiento', date: '2023-07-20', difficulty: 'easy' },
  ];

  // Simular carga de datos
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // 2 segundos de loading

    return () => clearTimeout(timer);
  }, []);
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return colors.success;
      case 'medium':
        return colors.warning;
      case 'hard':
        return colors.error;
      default:
        return colors.text.secondary;
    }
  };
  
  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'Fácil';
      case 'medium':
        return 'Medio';
      case 'hard':
        return 'Difícil';
      default:
        return '';
    }
  };
  
  const renderWorkoutItem = (workout: any) => (
    <TouchableOpacity
      key={workout.id}
      onPress={() => {}}
      activeOpacity={0.7}
    >
      <Card style={styles.workoutCard}>
        <View style={styles.workoutHeader}>
          <Text style={[styles.workoutName, { color: colors.text.primary }]}>
            {workout.name}
          </Text>
          <View style={[
            styles.difficultyBadge,
            { backgroundColor: getDifficultyColor(workout.difficulty) },
          ]}>
            <Text style={[styles.difficultyText, { color: colors.text.inverse }]}>
              {getDifficultyLabel(workout.difficulty)}
            </Text>
          </View>
        </View>
        
        <View style={styles.workoutFooter}>
          <View style={styles.workoutDate}>
            <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
            <Text style={[styles.dateText, { color: colors.text.secondary }]}>
              {new Date(workout.date).toLocaleDateString()}
            </Text>
          </View>
          
          <AnimatedButton
            title="Iniciar"
            onPress={() => {}}
            variant="primary"
            size="sm"
            animationType="scale"
            icon="play-circle"
          />
        </View>
      </Card>
    </TouchableOpacity>
  );
  
  if (loading) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <DashboardSkeleton />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.text.primary }]}>¡Hola, Usuario!</Text>
        <ThemeToggle showLabel={false} />
      </View>
      
      <HomeWidget onPress={() => navigation.navigate('Progress' as never)} />
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Entrenamientos Recientes
          </Text>
          <TouchableOpacity>
            <Text style={[styles.seeAll, { color: colors.primary }]}>Ver Todos</Text>
          </TouchableOpacity>
        </View>
        
        {recentWorkouts.map(renderWorkoutItem)}
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Próximos Entrenamientos
          </Text>
          <TouchableOpacity>
            <Text style={[styles.seeAll, { color: colors.primary }]}>Ver Todos</Text>
          </TouchableOpacity>
        </View>
        
        {upcomingWorkouts.map(renderWorkoutItem)}
      </View>
      
      <AnimatedButton
        title="Crear Nueva Rutina"
        onPress={() => {}}
        variant="primary"
        animationType="bounce"
        icon="add-circle"
        style={styles.createButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsCard: {
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  workoutCard: {
    marginBottom: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  workoutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 4,
    fontSize: 14,
  },
  createButton: {
    marginTop: 8,
    marginBottom: 24,
    width: '100%',
  },
});