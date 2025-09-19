import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useTheme from '../../hooks/useTheme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ThemeToggle from '../../components/ThemeToggle';
import { ProfileSkeleton } from '../../components/SkeletonLoader';

interface UserStats {
  totalWorkouts: number;
  totalDuration: number;
  currentStreak: number;
  joinDate: string;
}

const mockUserData = {
  name: 'Juan Pérez',
  email: 'juan.perez@email.com',
  avatar: null,
  stats: {
    totalWorkouts: 127,
    totalDuration: 4850, // minutes
    currentStreak: 12,
    joinDate: '2023-06-15',
  } as UserStats,
  subscription: {
    plan: 'Premium',
    expiresAt: '2024-12-31',
  },
};

const menuItems = [
  {
    id: 'edit-profile',
    title: 'Editar Perfil',
    subtitle: 'Actualiza tu información personal',
    icon: '👤',
    screen: 'EditProfile',
  },
  {
    id: 'theme-settings',
    title: 'Configuración de Tema',
    subtitle: 'Personaliza la apariencia de la app',
    icon: '🎨',
    screen: 'ThemeSettings',
  },
  {
    id: 'health-settings',
    title: 'Configuración de Salud',
    subtitle: 'Conecta con Apple Health o Google Fit',
    icon: '❤️',
    screen: 'HealthSettings',
  },
  {
    id: 'settings',
    title: 'Configuración',
    subtitle: 'Notificaciones, privacidad y más',
    icon: '⚙️',
    screen: 'Settings',
  },
  {
    id: 'subscription',
    title: 'Suscripción',
    subtitle: 'Gestiona tu plan Premium',
    icon: '💎',
    screen: 'Subscription',
  },
  {
    id: 'help',
    title: 'Ayuda y Soporte',
    subtitle: 'Preguntas frecuentes y contacto',
    icon: '❓',
    screen: 'Help',
  },
];

export default function ProfileOverviewScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);

  // Simular carga de datos del perfil
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500); // 1.5 segundos de loading

    return () => clearTimeout(timer);
  }, []);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
    });
  };

  const renderStatCard = (title: string, value: string | number, subtitle?: string) => {
    return (
      <View style={styles.statCard}>
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
      </View>
    );
  };

  const renderMenuItem = (item: typeof menuItems[0]) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.menuItem}
        onPress={() => console.log(`Navigate to ${item.screen}`)}
        activeOpacity={0.7}
      >
        <View style={styles.menuItemContent}>
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuItemIcon}>{item.icon}</Text>
            <View style={styles.menuItemText}>
              <Text style={[styles.menuItemTitle, { color: colors.text.primary }]}>
                {item.title}
              </Text>
              <Text style={[styles.menuItemSubtitle, { color: colors.text.secondary }]}>
                {item.subtitle}
              </Text>
            </View>
          </View>
          <Text style={[styles.menuItemArrow, { color: colors.text.muted }]}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ProfileSkeleton />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            {mockUserData.avatar ? (
              <Image source={{ uri: mockUserData.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {mockUserData.name.split(' ').map(n => n[0]).join('')}
              </Text>
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text.primary }]}>
              {mockUserData.name}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.text.secondary }]}>
              {mockUserData.email}
            </Text>
            
            <View style={[styles.subscriptionBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.subscriptionText, { color: colors.primary }]}>
                {mockUserData.subscription.plan}
              </Text>
            </View>
          </View>
        </View>
        
        <Text style={[styles.joinDate, { color: colors.text.muted }]}>
          Miembro desde {formatJoinDate(mockUserData.stats.joinDate)}
        </Text>
      </Card>

      {/* Stats */}
      <Card style={styles.statsCard}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Estadísticas
        </Text>
        
        <View style={styles.statsGrid}>
          {renderStatCard(
            'Entrenamientos',
            mockUserData.stats.totalWorkouts,
            'completados'
          )}
          
          {renderStatCard(
            'Tiempo Total',
            formatDuration(mockUserData.stats.totalDuration),
            'entrenando'
          )}
          
          {renderStatCard(
            'Racha Actual',
            mockUserData.stats.currentStreak,
            'días consecutivos'
          )}
        </View>
      </Card>

      {/* Theme Toggle */}
      <Card style={styles.themeCard}>
        <View style={styles.themeHeader}>
          <View>
            <Text style={[styles.themeTitle, { color: colors.text.primary }]}>
              Tema de la Aplicación
            </Text>
            <Text style={[styles.themeSubtitle, { color: colors.text.secondary }]}>
              Personaliza la apariencia
            </Text>
          </View>
          <ThemeToggle />
        </View>
      </Card>

      {/* Menu Items */}
      <Card style={styles.menuCard}>
        {menuItems.map((item, index) => (
          <View key={item.id}>
            {renderMenuItem(item)}
            {index < menuItems.length - 1 && (
              <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            )}
          </View>
        ))}
      </Card>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <Button
          title="Cerrar Sesión"
          onPress={() => console.log('Logout')}
          variant="destructive"
          fullWidth
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    margin: 20,
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  subscriptionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subscriptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  joinDate: {
    fontSize: 12,
    textAlign: 'center',
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
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
  themeCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
  },
  themeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  menuCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
  },
  menuItemArrow: {
    fontSize: 20,
    fontWeight: '300',
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 20,
  },
  logoutContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});