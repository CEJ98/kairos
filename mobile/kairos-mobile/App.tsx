import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import AppNavigator from './src/navigation';
import { useThemeStore } from './src/hooks/useTheme';
import PushNotificationManager from './src/components/PushNotificationManager';

export default function App() {
  const colorScheme = useColorScheme();
  const { isDark, setMode } = useThemeStore();
  
  // Inicializar el tema basado en el esquema de colores del sistema
  React.useEffect(() => {
    setMode('system');
  }, []);
  
  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <PushNotificationManager>
        <AppNavigator />
      </PushNotificationManager>
    </SafeAreaProvider>
  );
}
