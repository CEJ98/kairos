import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import useTheme from '../hooks/useTheme';
import { theme as appTheme } from '../theme/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  bordered?: boolean;
  elevated?: boolean;
}

export default function Card({
  children,
  style,
  padded = true,
  bordered = true,
  elevated = true,
}: CardProps) {
  const { colors, isDark } = useTheme();
  
  const cardStyles = {
    ...styles.card,
    backgroundColor: colors.card,
    borderColor: bordered ? colors.border : 'transparent',
    padding: padded ? 16 : 0,
    ...(elevated ? (isDark ? appTheme.shadows.md : appTheme.shadows.sm) : {}),
    ...style,
  };
  
  return (
    <View style={cardStyles}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
});