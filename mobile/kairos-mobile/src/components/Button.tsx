import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import useTheme from '../hooks/useTheme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}: ButtonProps) {
  const { colors, isDark } = useTheme();
  
  const getBackgroundColor = () => {
    if (disabled) return isDark ? '#374151' : '#E5E7EB';
    
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'destructive':
        return colors.error;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return colors.primary;
    }
  };
  
  const getTextColor = () => {
    if (disabled) return colors.placeholder;
    
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'destructive':
        return colors.text.inverse;
      case 'outline':
        return colors.primary;
      case 'ghost':
        return colors.text.primary;
      default:
        return colors.text.inverse;
    }
  };
  
  const getBorderColor = () => {
    if (disabled) return isDark ? '#374151' : '#E5E7EB';
    if (variant === 'outline') {
      return colors.primary;
    }
    return 'transparent';
  };
  
  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 6, paddingHorizontal: 12 };
      case 'md':
        return { paddingVertical: 10, paddingHorizontal: 16 };
      case 'lg':
        return { paddingVertical: 14, paddingHorizontal: 20 };
      default:
        return { paddingVertical: 10, paddingHorizontal: 16 };
    }
  };
  
  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 14;
      case 'md':
        return 16;
      case 'lg':
        return 18;
      default:
        return 16;
    }
  };
  
  const buttonStyles = {
    ...styles.button,
    ...getPadding(),
    backgroundColor: getBackgroundColor(),
    borderColor: getBorderColor(),
    borderWidth: variant === 'outline' ? 1 : 0,
    width: fullWidth ? '100%' : undefined,
    opacity: disabled ? 0.7 : 1,
    ...style,
  };
  
  const textStyles = {
    ...styles.text,
    color: getTextColor(),
    fontSize: getFontSize(),
    ...textStyle,
  };
  
  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {leftIcon && <Text style={styles.iconLeft}>{leftIcon}</Text>}
          <Text style={textStyles}>{title}</Text>
          {rightIcon && <Text style={styles.iconRight}>{rightIcon}</Text>}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});