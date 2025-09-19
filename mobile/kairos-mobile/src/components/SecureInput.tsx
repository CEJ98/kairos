/**
 * Secure Input Component for Mobile App
 * Componente de entrada seguro con validación robusta y indicadores visuales
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';
import { getPasswordStrength, sanitizeInput } from '../lib/validation';

interface SecureInputProps extends Omit<TextInputProps, 'onChangeText'> {
  label: string;
  error?: string;
  onChangeText: (text: string) => void;
  containerStyle?: any;
  showPasswordStrength?: boolean;
  sanitize?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  required?: boolean;
  helperText?: string;
}

export default function SecureInput({
  label,
  error,
  onChangeText,
  containerStyle,
  showPasswordStrength = false,
  sanitize = true,
  leftIcon,
  rightIcon,
  onRightIconPress,
  required = false,
  helperText,
  secureTextEntry,
  value,
  ...props
}: SecureInputProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    label: string;
    color: string;
    suggestions: string[];
  } | null>(null);

  const animatedValue = new Animated.Value(value ? 1 : 0);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  useEffect(() => {
    if (showPasswordStrength && value) {
      const strength = getPasswordStrength(value);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(null);
    }
  }, [value, showPasswordStrength]);

  const handleChangeText = (text: string) => {
    const processedText = sanitize ? sanitizeInput(text) : text;
    onChangeText(processedText);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const labelStyle = {
    position: 'absolute' as const,
    left: leftIcon ? 45 : 16,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 8],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: error
      ? colors.error
      : isFocused
      ? colors.primary
      : colors.text.secondary,
  };

  const inputContainerStyle = [
    styles.inputContainer,
    {
      borderColor: error
        ? colors.error
        : isFocused
        ? colors.primary
        : colors.border,
      backgroundColor: colors.card,
    },
  ];

  const inputStyle = [
    styles.input,
    {
      color: colors.text.primary,
      paddingLeft: leftIcon ? 45 : 16,
      paddingRight: (secureTextEntry || rightIcon) ? 45 : 16,
    },
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={inputContainerStyle}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Ionicons
              name={leftIcon}
              size={20}
              color={isFocused ? colors.primary : colors.text.secondary}
            />
          </View>
        )}
        
        <Animated.Text style={labelStyle}>
          {label}{required && <Text style={{ color: colors.error }}> *</Text>}
        </Animated.Text>
        
        <TextInput
          {...props}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={inputStyle}
          secureTextEntry={secureTextEntry && !showPassword}
          placeholderTextColor={colors.text.secondary}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={togglePasswordVisibility}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Password Strength Indicator */}
      {showPasswordStrength && passwordStrength && value && (
        <View style={styles.passwordStrengthContainer}>
          <View style={styles.strengthBarContainer}>
            <View
              style={[
                styles.strengthBar,
                {
                  width: `${(passwordStrength.score / 8) * 100}%`,
                  backgroundColor: passwordStrength.color,
                },
              ]}
            />
          </View>
          <Text
            style={[
              styles.strengthLabel,
              { color: passwordStrength.color },
            ]}
          >
            {passwordStrength.label}
          </Text>
          {passwordStrength.suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {passwordStrength.suggestions.slice(0, 2).map((suggestion, index) => (
                <Text
                  key={index}
                  style={[styles.suggestion, { color: colors.text.secondary }]}
                >
                  • {suggestion}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
      
      {/* Helper Text */}
      {helperText && !error && (
        <Text style={[styles.helperText, { color: colors.text.secondary }]}>
          {helperText}
        </Text>
      )}
      
      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle"
            size={16}
            color={colors.error}
            style={styles.errorIcon}
          />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 56,
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    paddingTop: 20,
    paddingBottom: 8,
    minHeight: 56,
  },
  leftIconContainer: {
    position: 'absolute',
    left: 16,
    top: 18,
    zIndex: 1,
  },
  rightIconContainer: {
    position: 'absolute',
    right: 16,
    top: 18,
    zIndex: 1,
  },
  passwordStrengthContainer: {
    marginTop: 8,
  },
  strengthBarContainer: {
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  suggestionsContainer: {
    marginTop: 4,
  },
  suggestion: {
    fontSize: 11,
    marginTop: 2,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  errorIcon: {
    marginRight: 4,
  },
  errorText: {
    fontSize: 12,
    flex: 1,
  },
});