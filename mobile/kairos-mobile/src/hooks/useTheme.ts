import { useColorScheme } from 'react-native';
import { create } from 'zustand';
import { colors as importedColors } from '../theme/colors';

// Ensure colors is properly defined for web compatibility
const colors = importedColors || {
  primary: '#10B981',
  secondary: '#3B82F6',
  accent: '#8B5CF6',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  background: { light: '#FFFFFF', dark: '#0F0F0F' },
  card: { light: '#F9FAFB', dark: '#1A1A1A' },
  surface: { light: '#FFFFFF', dark: '#262626' },
  text: {
    primary: { light: '#111827', dark: '#FFFFFF' },
    secondary: { light: '#4B5563', dark: '#A1A1AA' },
    muted: { light: '#6B7280', dark: '#71717A' },
    inverse: { light: '#FFFFFF', dark: '#000000' }
  },
  border: { light: '#E5E7EB', dark: '#404040' },
  workout: { easy: '#22C55E', medium: '#F59E0B', hard: '#EF4444' },
  chart: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'],
  overlay: { light: 'rgba(0, 0, 0, 0.5)', dark: 'rgba(0, 0, 0, 0.8)' },
  shadow: { light: '#000000', dark: '#000000' },
  disabled: { light: '#E5E7EB', dark: '#374151' },
  placeholder: { light: '#9CA3AF', dark: '#6B7280' }
};

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
      inverse: string;
    };
    background: string;
    card: string;
    border: string;
    surface: string;
    chart: string[];
    overlay: string;
    shadow: string;
    disabled: string;
    placeholder: string;
    workout: {
      easy: string;
      medium: string;
      hard: string;
    };
  };
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',
  isDark: false,
  colors: {
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    text: {
      primary: colors.text.primary.light,
      secondary: colors.text.secondary.light,
      muted: colors.text.muted.light,
      inverse: colors.text.inverse.light,
    },
    background: colors.background.light,
    card: colors.card.light,
    border: colors.border.light,
    surface: colors.surface.light,
    chart: colors.chart,
    overlay: colors.overlay.light,
    shadow: colors.shadow.light,
    disabled: colors.disabled.light,
    placeholder: colors.placeholder.light,
    workout: {
      easy: colors.workout.easy,
      medium: colors.workout.medium,
      hard: colors.workout.hard,
    },
  },
  setMode: (mode) => {
    // No podemos usar hooks aquí, así que asumimos que el sistema es light por defecto
    // El hook useTheme se encargará de actualizar correctamente basado en el sistema
    const isDark = mode === 'dark';
    
    set({
      mode,
      isDark,
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
        success: colors.success,
        error: colors.error,
        warning: colors.warning,
        info: colors.info,
        text: {
          primary: isDark ? colors.text.primary.dark : colors.text.primary.light,
          secondary: isDark ? colors.text.secondary.dark : colors.text.secondary.light,
          muted: isDark ? colors.text.muted.dark : colors.text.muted.light,
          inverse: isDark ? colors.text.inverse.dark : colors.text.inverse.light,
        },
        background: isDark ? colors.background.dark : colors.background.light,
        card: isDark ? colors.card.dark : colors.card.light,
        border: isDark ? colors.border.dark : colors.border.light,
        surface: isDark ? colors.surface.dark : colors.surface.light,
        chart: colors.chart,
        overlay: isDark ? colors.overlay.dark : colors.overlay.light,
      shadow: isDark ? colors.shadow.dark : colors.shadow.light,
      disabled: isDark ? colors.disabled.dark : colors.disabled.light,
      placeholder: isDark ? colors.placeholder.dark : colors.placeholder.light,
      workout: {
        easy: colors.workout.easy,
        medium: colors.workout.medium,
        hard: colors.workout.hard,
      },
      },
    });
  },
}));

export const useTheme = () => {
  const store = useThemeStore();
  const systemColorScheme = useColorScheme();
  
  // Función personalizada para setMode que maneja correctamente el modo 'system'
  const setMode = (mode: ThemeMode) => {
    const isDark = mode === 'system' ? systemColorScheme === 'dark' : mode === 'dark';
    
    useThemeStore.setState({
      mode,
      isDark,
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
        success: colors.success,
        error: colors.error,
        warning: colors.warning,
        info: colors.info,
        text: {
          primary: isDark ? colors.text.primary.dark : colors.text.primary.light,
          secondary: isDark ? colors.text.secondary.dark : colors.text.secondary.light,
          muted: isDark ? colors.text.muted.dark : colors.text.muted.light,
          inverse: isDark ? colors.text.inverse.dark : colors.text.inverse.light,
        },
        background: isDark ? colors.background.dark : colors.background.light,
        card: isDark ? colors.card.dark : colors.card.light,
        border: isDark ? colors.border.dark : colors.border.light,
        surface: isDark ? colors.surface.dark : colors.surface.light,
        chart: colors.chart,
        overlay: isDark ? colors.overlay.dark : colors.overlay.light,
        shadow: isDark ? colors.shadow.dark : colors.shadow.light,
        disabled: isDark ? colors.disabled.dark : colors.disabled.light,
        placeholder: isDark ? colors.placeholder.dark : colors.placeholder.light,
        workout: {
          easy: colors.workout.easy,
          medium: colors.workout.medium,
          hard: colors.workout.hard,
        },
      },
    });
  };
  
  // Calcular el estado actual sin causar re-renders
  const currentIsDark = store.mode === 'system' ? systemColorScheme === 'dark' : store.isDark;
  
  return {
    mode: store.mode,
    isDark: currentIsDark,
    colors: {
      primary: colors.primary,
      secondary: colors.secondary,
      accent: colors.accent,
      success: colors.success,
      error: colors.error,
      warning: colors.warning,
      info: colors.info,
      text: {
        primary: currentIsDark ? colors.text.primary.dark : colors.text.primary.light,
        secondary: currentIsDark ? colors.text.secondary.dark : colors.text.secondary.light,
        muted: currentIsDark ? colors.text.muted.dark : colors.text.muted.light,
        inverse: currentIsDark ? colors.text.inverse.dark : colors.text.inverse.light,
      },
      background: currentIsDark ? colors.background.dark : colors.background.light,
      card: currentIsDark ? colors.card.dark : colors.card.light,
      border: currentIsDark ? colors.border.dark : colors.border.light,
      surface: currentIsDark ? colors.surface.dark : colors.surface.light,
      chart: colors.chart,
      overlay: currentIsDark ? colors.overlay.dark : colors.overlay.light,
      shadow: currentIsDark ? colors.shadow.dark : colors.shadow.light,
      disabled: currentIsDark ? colors.disabled.dark : colors.disabled.light,
      placeholder: currentIsDark ? colors.placeholder.dark : colors.placeholder.light,
      workout: {
        easy: colors.workout.easy,
        medium: colors.workout.medium,
        hard: colors.workout.hard,
      },
    },
    setMode,
  };
};

export default useTheme;