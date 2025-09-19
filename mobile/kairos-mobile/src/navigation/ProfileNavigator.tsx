import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from './types';
import ProfileOverviewScreen from '../screens/Profile/ProfileOverview.tsx';
import EditProfileScreen from '../screens/Profile/EditProfile.tsx';
import SettingsScreen from '../screens/Profile/Settings.tsx';
import SubscriptionScreen from '../screens/Profile/Subscription.tsx';
import ThemeSettingsScreen from '../screens/Settings/ThemeSettingsScreen.tsx';
import HealthSettingsScreen from '../screens/Settings/HealthSettingsScreen.tsx';
import OfflineSettingsScreen from '../screens/Settings/OfflineSettings.tsx';
import HelpScreen from '../screens/Profile/Help.tsx';
import useTheme from '../hooks/useTheme';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileNavigator() {
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
        name="ProfileOverview" 
        component={ProfileOverviewScreen} 
        options={{ 
          title: 'Mi Perfil',
        }} 
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{ 
          title: 'Editar Perfil',
        }} 
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ 
          title: 'Configuración',
        }} 
      />
      <Stack.Screen 
        name="ThemeSettings" 
        component={ThemeSettingsScreen} 
        options={{ 
          title: 'Tema',
        }} 
      />
      <Stack.Screen 
        name="HealthSettings" 
        component={HealthSettingsScreen} 
        options={{ 
          title: 'Salud',
        }} 
      />
      <Stack.Screen 
        name="OfflineSettings" 
        component={OfflineSettingsScreen} 
        options={{ 
          title: 'Modo Offline',
        }} 
      />
      <Stack.Screen 
        name="Subscription" 
        component={SubscriptionScreen} 
        options={{ 
          title: 'Mi Suscripción',
        }} 
      />
      <Stack.Screen 
        name="Help" 
        component={HelpScreen} 
        options={{ 
          title: 'Ayuda',
        }} 
      />
    </Stack.Navigator>
  );
}