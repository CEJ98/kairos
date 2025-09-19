import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import HomeScreen from '../screens/Home';
import WorkoutsNavigator from './WorkoutsNavigator';
import ProgressNavigator from './ProgressNavigator';
import ProfileNavigator from './ProfileNavigator';
import HealthScreen from '../screens/Health/HealthScreen';
import useTheme from '../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  const { colors, isDark } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Workouts') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Progress') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Health') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text.primary,
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: 'Inicio',
          headerTitle: 'Kairos Fitness',
        }} 
      />
      <Tab.Screen 
        name="Workouts" 
        component={WorkoutsNavigator} 
        options={{ 
          title: 'Rutinas',
          headerShown: false,
        }} 
      />
      <Tab.Screen 
        name="Progress" 
        component={ProgressNavigator} 
        options={{ 
          title: 'Progreso',
          headerShown: false,
        }} 
      />
      <Tab.Screen 
        name="Health" 
        component={HealthScreen} 
        options={{ 
          title: 'Salud',
          headerTitle: 'Datos de Salud',
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileNavigator} 
        options={{ 
          title: 'Perfil',
          headerShown: false,
        }} 
      />
    </Tab.Navigator>
  );
}