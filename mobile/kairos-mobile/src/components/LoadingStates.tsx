import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Animated,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';
import { AnimatedButton } from './AnimatedButton';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  type?: 'default' | 'success' | 'error' | 'warning';
  showProgress?: boolean;
  progress?: number;
  onCancel?: () => void;
  cancelable?: boolean;
  style?: ViewStyle;
}

interface InlineLoadingProps {
  loading: boolean;
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'spinner' | 'dots' | 'pulse';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

interface ButtonLoadingProps {
  loading: boolean;
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
}

interface ProgressBarProps {
  progress: number;
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  showPercentage?: boolean;
  animated?: boolean;
  style?: ViewStyle;
}

// Overlay de carga modal
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Cargando...',
  type = 'default',
  showProgress = false,
  progress = 0,
  onCancel,
  cancelable = false,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  const getTypeColor = () => {
    switch (type) {
      case 'success':
        return colors?.success || '#10B981';
      case 'error':
        return colors?.error || '#EF4444';
      case 'warning':
        return colors?.warning || '#F59E0B';
      default:
        return colors?.primary || '#3B82F6';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
            opacity: fadeAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.loadingContainer,
            {
              backgroundColor: colors?.card || '#F9FAFB',
              transform: [{ scale: scaleAnim }],
            },
            style,
          ]}
        >
          <View style={styles.loadingContent}>
            {getTypeIcon() ? (
              <Ionicons
                name={getTypeIcon() as any}
                size={40}
                color={getTypeColor()}
                style={styles.typeIcon}
              />
            ) : (
              <ActivityIndicator
                size="large"
                color={getTypeColor()}
                style={styles.spinner}
              />
            )}
            
            <Text
              style={[
                styles.loadingMessage,
                { color: colors?.text?.primary || '#111827' }
              ]}
            >
              {message}
            </Text>
            
            {showProgress && (
              <ProgressBar
                progress={progress}
                progressColor={getTypeColor()}
                style={styles.progressBar}
              />
            )}
            
            {cancelable && onCancel && (
              <AnimatedButton
                title="Cancelar"
                onPress={onCancel}
                variant="outline"
                size="sm"
                style={styles.cancelButton}
              />
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// Componente de carga inline
export const InlineLoading: React.FC<InlineLoadingProps> = ({
  loading,
  message = 'Cargando...',
  size = 'medium',
  variant = 'spinner',
  style,
  textStyle,
}) => {
  const { colors } = useTheme();
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loading) {
      const animation = Animated.loop(
        Animated.timing(animValue, {
          toValue: 1,
          duration: variant === 'pulse' ? 1000 : 1500,
          useNativeDriver: true,
        })
      );
      animation.start();
      return () => animation.stop();
    }
  }, [loading, variant, animValue]);

  const getSizeValue = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 32;
      default:
        return 24;
    }
  };

  const renderVariant = () => {
    const sizeValue = getSizeValue();
    
    switch (variant) {
      case 'dots':
        return (
          <View style={styles.dotsContainer}>
            {[0, 1, 2].map((index) => {
              const dotAnim = animValue.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.4, 1, 0.4],
                extrapolate: 'clamp',
              });
              
              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      width: sizeValue / 2,
                      height: sizeValue / 2,
                      backgroundColor: colors?.primary || '#3B82F6',
                      opacity: dotAnim,
                      transform: [
                        {
                          scale: dotAnim,
                        },
                      ],
                    },
                  ]}
                />
              );
            })}
          </View>
        );
      
      case 'pulse':
        const pulseScale = animValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1.2, 1],
        });
        
        return (
          <Animated.View
            style={[
              styles.pulseContainer,
              {
                width: sizeValue,
                height: sizeValue,
                backgroundColor: colors?.primary || '#3B82F6',
                transform: [{ scale: pulseScale }],
              },
            ]}
          />
        );
      
      default:
        return (
          <ActivityIndicator
            size={size === 'small' ? 'small' : 'large'}
            color={colors?.primary || '#3B82F6'}
          />
        );
    }
  };

  if (!loading) return null;

  return (
    <View style={[styles.inlineContainer, style]}>
      {renderVariant()}
      {message && (
        <Text
          style={[
            styles.inlineMessage,
            { color: colors?.text?.secondary || '#4B5563' },
            textStyle,
          ]}
        >
          {message}
        </Text>
      )}
    </View>
  );
};

// Botón con estado de carga
export const ButtonLoading: React.FC<ButtonLoadingProps> = ({
  loading,
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
}) => {
  const { colors } = useTheme();

  const getButtonStyle = () => {
    const baseStyle = {
      height: size === 'small' ? 36 : size === 'large' ? 52 : 44,
      paddingHorizontal: size === 'small' ? 16 : size === 'large' ? 24 : 20,
      borderRadius: size === 'small' ? 18 : size === 'large' ? 26 : 22,
    };

    switch (variant) {
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colors?.secondary || '#3B82F6',
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors?.primary || '#3B82F6',
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: colors?.primary || '#3B82F6',
        };
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') {
      return colors?.primary || '#3B82F6';
    }
    return colors?.text?.primary || '#111827';
  };

  const buttonStyle = [
    styles.buttonBase,
    getButtonStyle(),
    (disabled || loading) && styles.disabledButton,
    style,
  ].filter(Boolean);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={buttonStyle}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size={size === 'small' ? 'small' : 'large'}
          color={getTextColor()}
        />
      ) : (
        <Text
          style={{
            color: getTextColor(),
            fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Barra de progreso
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  backgroundColor,
  progressColor,
  showPercentage = false,
  animated = true,
  style,
}) => {
  const { colors } = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(progress);
    }
  }, [progress, animated, progressAnim]);

  const progressWidth = animated
    ? progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
      })
    : `${Math.max(0, Math.min(100, progress * 100))}%`;

  return (
    <View style={[styles.progressContainer, style]}>
      <View
        style={[
          styles.progressBackground,
          {
            height,
            backgroundColor: backgroundColor || colors?.border || '#E5E7EB',
          },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              height,
              width: progressWidth as any,
              backgroundColor: progressColor || colors?.primary || '#3B82F6',
            },
          ] as any}
        />
      </View>
      {showPercentage && (
        <Text
          style={[
            styles.progressText,
            { color: colors?.text?.secondary || '#4B5563' }
          ]}
        >
          {Math.round(progress * 100)}%
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    borderRadius: 16,
    padding: 24,
    minWidth: 200,
    maxWidth: screenWidth * 0.8,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loadingContent: {
    alignItems: 'center',
  },
  typeIcon: {
    marginBottom: 16,
  },
  spinner: {
    marginBottom: 16,
  },
  loadingMessage: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressBar: {
    marginBottom: 16,
  },
  cancelButton: {
    marginTop: 8,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  inlineMessage: {
    fontSize: 14,
    marginLeft: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    borderRadius: 50,
  },
  pulseContainer: {
    borderRadius: 50,
  },
  buttonBase: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  disabledButton: {
    opacity: 0.6,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBackground: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});

export default {
  LoadingOverlay,
  InlineLoading,
  ButtonLoading,
  ProgressBar,
};