import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProgressStackParamList } from './types';
import ProgressOverviewScreen from '../screens/Progress/ProgressOverview';
import ProgressDetailScreen from '../screens/Progress/ProgressDetail';
import AddProgressScreen from '../screens/Progress/AddProgress';
import useTheme from '../hooks/useTheme';

const Stack = createNativeStackNavigator<ProgressStackParamList>();

export default function ProgressNavigator() {
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
        name="ProgressOverview" 
        component={ProgressOverviewScreen} 
        options={{ 
          title: 'Mi Progreso',
        }} 
      />
      <Stack.Screen 
        name="ProgressDetail" 
        component={ProgressDetailScreen} 
        options={{ 
          title: 'Detalles de Progreso',
        }} 
      />
      <Stack.Screen 
        name="AddProgress" 
        component={AddProgressScreen} 
        options={{ 
          title: 'Registrar Progreso',
        }} 
      />
    </Stack.Navigator>
  );
}