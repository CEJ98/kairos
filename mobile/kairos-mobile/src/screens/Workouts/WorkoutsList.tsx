import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import useTheme from '../../hooks/useTheme';
import useOffline from '../../hooks/useOffline';
import Card from '../../components/Card';
import Button from '../../components/Button';
import OfflineIndicator from '../../components/OfflineIndicator';
import { WorkoutCardSkeleton, SkeletonGroup } from '../../components/SkeletonLoader';
import type { WorkoutsStackParamList } from '../../navigation/types';
import type { OfflineWorkout } from '../../services/OfflineService';

interface Workout {
  id: string;
  name: string;
  description: string;
  duration: number;
  exercises: number;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  category: string;
  lastPerformed?: string;
  isOffline?: boolean;
  syncStatus?: 'pending' | 'synced' | 'failed';
}

const mockWorkouts: Workout[] = [
  {
    id: '1',
    name: 'Rutina de Fuerza',
    description: 'Entrenamiento completo de fuerza para todo el cuerpo',
    duration: 45,
    exercises: 8,
    difficulty: 'Intermedio',
    category: 'Fuerza',
    lastPerformed: '2024-01-15',
  },
  {
    id: '2',
    name: 'Cardio HIIT',
    description: 'Entrenamiento de alta intensidad para quemar grasa',
    duration: 30,
    exercises: 6,
    difficulty: 'Avanzado',
    category: 'Cardio',
    lastPerformed: '2024-01-14',
  },
  {
    id: '3',
    name: 'Yoga Matutino',
    description: 'Secuencia suave para comenzar el día',
    duration: 20,
    exercises: 12,
    difficulty: 'Principiante',
    category: 'Flexibilidad',
  },
  {
    id: '4',
    name: 'Piernas y Glúteos',
    description: 'Entrenamiento específico para tren inferior',
    duration: 40,
    exercises: 10,
    difficulty: 'Intermedio',
    category: 'Fuerza',
    lastPerformed: '2024-01-13',
  },
];

type WorkoutsListNavigationProp = NativeStackNavigationProp<WorkoutsStackParamList, 'WorkoutsList'>;

export default function WorkoutsListScreen() {
  const navigation = useNavigation<WorkoutsListNavigationProp>();
  const { colors } = useTheme();
  const { 
    offlineState, 
    getOfflineWorkouts, 
    deleteWorkoutOffline, 
    syncManually 
  } = useOffline();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [offlineWorkoutsList, setOfflineWorkoutsList] = useState<OfflineWorkout[]>([]);

  // Cargar workouts offline al inicializar
  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      setLoading(true);
      const offlineWorkouts = await getOfflineWorkouts();
      setOfflineWorkoutsList(offlineWorkouts);
      
      // Convertir workouts offline al formato de la interfaz
       const convertedWorkouts: Workout[] = offlineWorkouts.map(workout => ({
         id: workout.id,
         name: workout.name,
         description: 'Rutina personalizada',
         duration: 30,
         exercises: workout.exercises.length,
         difficulty: 'Intermedio' as const,
         category: 'Personalizada',
         lastPerformed: workout.updatedAt ? new Date(workout.updatedAt).toISOString().split('T')[0] : undefined,
         isOffline: true,
         syncStatus: workout.synced ? 'synced' : 'pending'
       }));
      
      // Combinar con workouts mock (simulando workouts del servidor)
      const allWorkouts = [...mockWorkouts, ...convertedWorkouts];
      setWorkouts(allWorkouts);
    } catch (error) {
      console.error('Error loading workouts:', error);
      setWorkouts(mockWorkouts);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      if (offlineState.isConnected) {
        await syncManually();
      }
      await loadWorkouts();
    } catch (error) {
      console.error('Error refreshing workouts:', error);
    } finally {
      setRefreshing(false);
    }
  }, [offlineState.isConnected, syncManually]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Principiante':
        return colors.workout.easy;
      case 'Intermedio':
        return colors.workout.medium;
      case 'Avanzado':
        return colors.workout.hard;
      default:
        return colors.text.secondary;
    }
  };

  const handleDeleteOfflineWorkout = (workoutId: string, workoutName: string) => {
    Alert.alert(
      'Eliminar rutina offline',
      `¿Estás seguro de que quieres eliminar "${workoutName}"? Esta acción no se puede deshacer.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWorkoutOffline(workoutId);
              await loadWorkouts();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la rutina offline');
            }
          },
        },
      ]
    );
  };

  const renderWorkout = ({ item }: { item: Workout }) => {
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('WorkoutDetail', { workoutId: item.id })}
        onLongPress={() => item.isOffline ? handleDeleteOfflineWorkout(item.id, item.name) : undefined}
        activeOpacity={0.7}
      >
        <Card style={styles.workoutCard}>
          <View style={styles.workoutHeader}>
            <View style={styles.workoutTitleContainer}>
              <Text style={[styles.workoutName, { color: colors.text.primary }]}>
                {item.name}
              </Text>
              {item.isOffline && (
                <View style={[styles.offlineBadge, { 
                  backgroundColor: item.syncStatus === 'pending' ? colors.accent + '20' : colors.success + '20' 
                }]}>
                  <Text style={[styles.offlineText, { 
                    color: item.syncStatus === 'pending' ? colors.accent : colors.success 
                  }]}>
                    {item.syncStatus === 'pending' ? 'Sin sincronizar' : 'Sincronizado'}
                  </Text>
                </View>
              )}
            </View>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) + '20' }]}>
              <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
                {item.difficulty}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.workoutDescription, { color: colors.text.secondary }]}>
            {item.description}
          </Text>
          
          <View style={styles.workoutStats}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                {item.duration}min
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Duración
              </Text>
            </View>
            
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                {item.exercises}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Ejercicios
              </Text>
            </View>
            
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                {item.category}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Categoría
              </Text>
            </View>
          </View>
          
          {item.lastPerformed && (
            <Text style={[styles.lastPerformed, { color: colors.text.secondary }]}>
              Última vez: {new Date(item.lastPerformed).toLocaleDateString('es-ES')}
            </Text>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Mis Rutinas
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
              {workouts.length} rutinas disponibles
              {offlineState.pendingSyncCount > 0 && (
                <Text style={{ color: colors.accent }}>
                  {' '}• {offlineState.pendingSyncCount} pendientes de sincronizar
                </Text>
              )}
            </Text>
          </View>
          <OfflineIndicator />
        </View>

        <View style={styles.headerButtons}>
          <Button
            title="Nueva Rutina"
            onPress={() => navigation.navigate('CreateWorkout')}
            variant="primary"
            style={styles.newWorkoutButton}
          />
          {offlineState.pendingSyncCount > 0 && offlineState.isConnected && (
            <Button
              title={`Sincronizar (${offlineState.pendingSyncCount})`}
              onPress={async () => {
                try {
                  await syncManually();
                  await loadWorkouts();
                } catch (error) {
                  Alert.alert('Error', 'No se pudo sincronizar los datos offline');
                }
              }}
              variant="secondary"
              style={styles.syncButton}
            />
          )}
        </View>
      </View>
      
      {loading ? (
        <View style={styles.list}>
          <SkeletonGroup loading={true}>
            {Array.from({ length: 4 }).map((_, index) => (
              <WorkoutCardSkeleton key={index} />
            ))}
          </SkeletonGroup>
        </View>
      ) : (
        <FlatList
          data={workouts}
          renderItem={renderWorkout}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  workoutCard: {
    marginBottom: 16,
    padding: 16,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  workoutDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  lastPerformed: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  newWorkoutButton: {
    marginTop: 16,
  },
  workoutTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  offlineBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  offlineText: {
    fontSize: 10,
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  syncButton: {
    flex: 1,
  },
});