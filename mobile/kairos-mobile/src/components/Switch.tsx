import React from 'react';
import { View, TouchableOpacity, Animated, StyleSheet, ViewStyle } from 'react-native';
import useTheme from '../hooks/useTheme';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
  activeColor?: string;
  inactiveColor?: string;
  thumbColor?: string;
}

export default function Switch({
  value,
  onValueChange,
  disabled = false,
  style,
  activeColor,
  inactiveColor,
  thumbColor,
}: SwitchProps) {
  const { colors, isDark } = useTheme();
  const [thumbPosition] = React.useState(new Animated.Value(value ? 1 : 0));
  
  React.useEffect(() => {
    Animated.timing(thumbPosition, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, thumbPosition]);
  
  const activeColorFinal = activeColor || colors.primary;
  const inactiveColorFinal = inactiveColor || colors.disabled;
  const thumbColorFinal = thumbColor || colors.text.inverse;
  
  const backgroundColorInterpolation = thumbPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveColorFinal, activeColorFinal],
  });
  
  const thumbPositionInterpolation = thumbPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 24],
  });
  
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => !disabled && onValueChange(!value)}
      style={[styles.container, style]}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.track,
          {
            backgroundColor: backgroundColorInterpolation,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: thumbColorFinal,
              transform: [{ translateX: thumbPositionInterpolation }],
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    width: 52,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2.5,
    elevation: 2,
  },
});