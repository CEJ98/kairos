import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';
import Switch from './Switch';

interface ThemeToggleProps {
  showLabel?: boolean;
}

export default function ThemeToggle({ showLabel = true }: ThemeToggleProps) {
  const { mode, isDark, setMode, colors } = useTheme();
  
  const toggleTheme = () => {
    setMode(isDark ? 'light' : 'dark');
  };
  
  const toggleSystemTheme = () => {
    setMode(mode === 'system' ? (isDark ? 'light' : 'dark') : 'system');
  };
  
  return (
    <View style={styles.container}>
      {showLabel && (
        <Text style={[styles.label, { color: colors.text.primary }]}>
          {isDark ? 'Modo Oscuro' : 'Modo Claro'}
        </Text>
      )}
      
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.systemButton, { borderColor: colors.border }]}
          onPress={toggleSystemTheme}
          activeOpacity={0.7}
        >
          <Ionicons
            name="phone-portrait-outline"
            size={16}
            color={mode === 'system' ? colors.primary : colors.text.secondary}
          />
          <Text
            style={[{
              color: mode === 'system' ? colors.primary : colors.text.secondary,
              marginLeft: 4,
            }]}
          >
            Sistema
          </Text>
        </TouchableOpacity>
        
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          style={styles.switch}
        />
        
        <View style={styles.icons}>
          <Ionicons
            name="sunny-outline"
            size={20}
            color={!isDark ? colors.primary : colors.text.secondary}
            style={styles.icon}
          />
          <Ionicons
            name="moon-outline"
            size={20}
            color={isDark ? colors.primary : colors.text.secondary}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 12,
  },
  switch: {
    marginHorizontal: 8,
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  icon: {
    marginRight: 8,
  },
});