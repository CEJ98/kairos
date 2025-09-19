import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import useTheme from '../hooks/useTheme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  animationDuration?: number;
  shimmerColors?: [string, string, string];
}

interface SkeletonItemProps extends SkeletonLoaderProps {
  variant?: 'text' | 'title' | 'avatar' | 'image' | 'button' | 'card';
}

interface SkeletonGroupProps {
  children: React.ReactNode;
  style?: ViewStyle;
  loading?: boolean;
}

// Componente base de skeleton
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  animationDuration = 1500,
  shimmerColors,
}) => {
  const { colors, isDark } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const defaultShimmerColors: [string, string, string] = shimmerColors || [
    isDark ? '#2a2a2a' : '#f0f0f0',
    isDark ? '#3a3a3a' : '#e0e0e0',
    isDark ? '#2a2a2a' : '#f0f0f0',
  ];

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: animationDuration,
          useNativeDriver: false,
        }),
      ])
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerAnim, animationDuration]);

  const backgroundColor = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: defaultShimmerColors,
  });

  return (
    <Animated.View
      style={[
        {
          width: typeof width === 'string' ? width : width,
          height: typeof height === 'string' ? height : height,
          borderRadius,
          backgroundColor,
        },
        style,
      ] as any}
    />
  );
};

// Componente de skeleton con variantes predefinidas
export const SkeletonItem: React.FC<SkeletonItemProps> = ({
  variant = 'text',
  ...props
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'title':
        return { width: '70%', height: 24, borderRadius: 6 };
      case 'text':
        return { width: '100%', height: 16, borderRadius: 4 };
      case 'avatar':
        return { width: 40, height: 40, borderRadius: 20 };
      case 'image':
        return { width: '100%', height: 200, borderRadius: 8 };
      case 'button':
        return { width: 120, height: 40, borderRadius: 20 };
      case 'card':
        return { width: '100%', height: 120, borderRadius: 12 };
      default:
        return {};
    }
  };

  return <SkeletonLoader {...getVariantStyle()} {...props} />;
};

// Componente contenedor para grupos de skeletons
export const SkeletonGroup: React.FC<SkeletonGroupProps> = ({
  children,
  style,
  loading = true,
}) => {
  if (!loading) {
    return <>{children}</>;
  }

  return <View style={style}>{children}</View>;
};

// Skeletons predefinidos para casos comunes
export const WorkoutCardSkeleton: React.FC = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.workoutCard, { backgroundColor: colors.card }]}>
      <View style={styles.workoutCardHeader}>
        <SkeletonItem variant="title" width="60%" />
        <SkeletonItem variant="text" width={60} height={12} />
      </View>
      <View style={styles.workoutCardContent}>
        <SkeletonItem variant="text" width="80%" />
        <SkeletonItem variant="text" width="90%" />
        <SkeletonItem variant="text" width="70%" />
      </View>
      <View style={styles.workoutCardFooter}>
        <SkeletonItem variant="button" width={80} height={32} />
        <SkeletonItem variant="text" width={100} height={12} />
      </View>
    </View>
  );
};

export const ExerciseListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  const { colors } = useTheme();
  
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.exerciseItem, { backgroundColor: colors.card }]}>
          <SkeletonItem variant="avatar" />
          <View style={styles.exerciseContent}>
            <SkeletonItem variant="title" width="70%" />
            <SkeletonItem variant="text" width="50%" />
            <SkeletonItem variant="text" width="60%" />
          </View>
          <SkeletonItem variant="text" width={40} height={12} />
        </View>
      ))}
    </View>
  );
};

export const ProfileSkeleton: React.FC = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.profile, { backgroundColor: colors.card }]}>
      <View style={styles.profileHeader}>
        <SkeletonItem variant="avatar" width={80} height={80} />
        <View style={styles.profileInfo}>
          <SkeletonItem variant="title" width="60%" />
          <SkeletonItem variant="text" width="40%" />
          <SkeletonItem variant="text" width="80%" />
        </View>
      </View>
      <View style={styles.profileStats}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.statItem}>
            <SkeletonItem variant="title" width={40} height={24} />
            <SkeletonItem variant="text" width={60} height={14} />
          </View>
        ))}
      </View>
    </View>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <View style={styles.dashboard}>
      {/* Header */}
      <View style={styles.dashboardHeader}>
        <SkeletonItem variant="title" width="50%" />
        <SkeletonItem variant="avatar" width={32} height={32} />
      </View>
      
      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index} style={styles.statCard}>
            <SkeletonItem variant="text" width="60%" height={14} />
            <SkeletonItem variant="title" width="40%" height={28} />
          </View>
        ))}
      </View>
      
      {/* Recent Activity */}
      <View style={styles.recentActivity}>
        <SkeletonItem variant="title" width="40%" />
        <ExerciseListSkeleton count={3} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  workoutCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  workoutCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutCardContent: {
    gap: 8,
    marginBottom: 16,
  },
  workoutCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  exerciseContent: {
    flex: 1,
    marginLeft: 12,
    gap: 4,
  },
  profile: {
    padding: 16,
    borderRadius: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
    gap: 6,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  dashboard: {
    padding: 16,
    gap: 20,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  recentActivity: {
    gap: 12,
  },
});

export default SkeletonLoader;