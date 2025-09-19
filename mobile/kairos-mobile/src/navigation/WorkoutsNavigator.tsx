import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WorkoutsStackParamList } from './types';
import WorkoutsListScreen from '../screens/Workouts/WorkoutsList';
import WorkoutDetailScreen from '../screens/Workouts/WorkoutDetail';
import WorkoutExecutionScreen from '../screens/Workouts/WorkoutExecution';
import WorkoutBuilderScreen from '../screens/Workouts/WorkoutBuilder';
import EditWorkoutScreen from '../screens/Workouts/EditWorkout';
import useTheme from '../hooks/useTheme';

const Stack = createNativeStackNavigator<WorkoutsStackParamList>();

export default function WorkoutsNavigator() {
  const { colors } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text.primary,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen 
        name="WorkoutsList" 
        component={WorkoutsListScreen} 
        options={{ 
          title: 'Mis Rutinas',
        }} 
      />
      <Stack.Screen 
        name="WorkoutDetail" 
        component={WorkoutDetailScreen} 
        options={{ 
          title: 'Detalles de Rutina',
        }} 
      />
      <Stack.Screen 
        name="WorkoutExecution" 
        component={WorkoutExecutionScreen} 
        options={{ 
          title: 'Ejecutar Rutina',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="CreateWorkout" 
        component={WorkoutBuilderScreen} 
        options={{ 
          title: 'Constructor de Rutinas',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="EditWorkout" 
        component={EditWorkoutScreen} 
        options={{ 
          title: 'Editar Rutina',
        }} 
      />
    </Stack.Navigator>
  );
}