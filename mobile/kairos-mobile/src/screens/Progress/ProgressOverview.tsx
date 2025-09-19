import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useTheme from '../../hooks/useTheme';
import Card from '../../components/Card';
import Button from '../../components/Button';

const { width } = Dimensions.get('window');

interface ProgressData {
  workoutsCompleted: number;
  totalWorkouts: number;
  weeklyGoal: number;
  currentStreak: number;
  totalWeight: number;
  avgDuration: number;
}

const mockProgressData: ProgressData = {
  workoutsCompleted: 12,
  totalWorkouts: 20,
  weeklyGoal: 4,
  currentStreak: 5,
  totalWeight: 2450,
  avgDuration: 38,
};

const weeklyData = [
  { day: 'L', completed: true },
  { day: 'M', completed: true },
  { day: 'X', completed: false },
  { day: 'J', completed: true },
  { day: 'V', completed: true },
  { day: 'S', completed: false },
  { day: 'D', completed: false },
];

export default function ProgressOverviewScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  const progressPercentage = (mockProgressData.workoutsCompleted / mockProgressData.totalWorkouts) * 100;

  const renderStatCard = (title: string, value: string | number, subtitle?: string, onPress?: () => void) => {
    return (
      <TouchableOpacity
        style={styles.statCard}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress}
      >
        <Card style={styles.statCardContent}>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {value}
          </Text>
          <Text style={[styles.statTitle, { color: colors.text.secondary }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.statSubtitle, { color: colors.text.muted }]}>
              {subtitle}
            </Text>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const renderWeeklyProgress = () => {
    return (
      <Card style={styles.weeklyCard}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Progreso Semanal
        </Text>
        
        <View style={styles.weeklyDays}>
          {weeklyData.map((day, index) => (
            <View key={index} style={styles.dayContainer}>
              <View
                style={[
                  styles.dayCircle,
                  {
                    backgroundColor: day.completed ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    {
                      color: day.completed ? colors.text.inverse : colors.text.secondary,
                    },
                  ]}
                >
                  {day.day}
                </Text>
              </View>
            </View>
          ))}
        </View>
        
        <Text style={[styles.weeklySubtext, { color: colors.text.secondary }]}>
          {weeklyData.filter(d => d.completed).length} de {weeklyData.length} entrenamientos completados
        </Text>
      </Card>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Mi Progreso
        </Text>
        
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                {
                  backgroundColor: selectedPeriod === period ? colors.primary : 'transparent',
                },
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  {
                    color: selectedPeriod === period ? colors.text.inverse : colors.text.secondary,
                  },
                ]}
              >
                {period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : 'Año'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Progress Overview */}
      <Card style={styles.progressCard}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Resumen General
        </Text>
        
        <View style={styles.progressBar}>
          <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: colors.primary,
                  width: `${progressPercentage}%`,
                },
              ]}
            />
          </View>
        </View>
        
        <Text style={[styles.progressText, { color: colors.text.secondary }]}>
          {mockProgressData.workoutsCompleted} de {mockProgressData.totalWorkouts} entrenamientos completados ({Math.round(progressPercentage)}%)
        </Text>
      </Card>

      {/* Weekly Progress */}
      {renderWeeklyProgress()}

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {renderStatCard(
          'Racha Actual',
          mockProgressData.currentStreak,
          'días consecutivos',
          () => console.log('Navigate to streak details')
        )}
        
        {renderStatCard(
          'Peso Total',
          `${mockProgressData.totalWeight}kg`,
          'levantado este mes',
          () => console.log('Navigate to weight details')
        )}
        
        {renderStatCard(
          'Duración Promedio',
          `${mockProgressData.avgDuration}min`,
          'por entrenamiento',
          () => console.log('Navigate to duration details')
        )}
        
        {renderStatCard(
          'Meta Semanal',
          `${weeklyData.filter(d => d.completed).length}/${mockProgressData.weeklyGoal}`,
          'entrenamientos',
          () => console.log('Navigate to goals details')
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          title="Ver Estadísticas Detalladas"
          onPress={() => console.log('Navigate to detailed stats')}
          variant="outline"
          fullWidth
          style={styles.actionButton}
        />
        
        <Button
          title="Agregar Progreso"
          onPress={() => console.log('Navigate to add progress')}
          variant="primary"
          fullWidth
          style={styles.actionButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  progressBar: {
    marginBottom: 8,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
  },
  weeklyCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
  },
  weeklyDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  weeklySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statCard: {
    width: (width - 60) / 2,
    marginBottom: 16,
    marginRight: 16,
  },
  statCardContent: {
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionButton: {
    marginBottom: 12,
  },
});