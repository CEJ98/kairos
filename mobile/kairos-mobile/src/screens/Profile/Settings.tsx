import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import useTheme from '../../hooks/useTheme';
import Card from '../../components/Card';
import NotificationSettings from '../../components/NotificationSettings';
import { WidgetSettings } from '../../components/WidgetSettings';
import type { ProfileStackParamList } from '../../navigation/types';

type SettingsNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<SettingsNavigationProp>();
  
  // Estados para las opciones de configuración
  const [emailNotifications, setEmailNotifications] = React.useState(true);
  const [offlineMode, setOfflineMode] = React.useState(false);
  const [healthIntegration, setHealthIntegration] = React.useState(false);
  
  const renderSettingItem = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    description: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
  ) => (
    <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text.primary }]}>
          {title}
        </Text>
        <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
          {description}
        </Text>
      </View>
      
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.text.inverse}
      />
    </View>
  );
  
  const renderLinkItem = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    onPress: () => void,
  ) => (
    <TouchableOpacity
      style={[styles.linkItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      
      <Text style={[styles.linkTitle, { color: colors.text.primary }]}>
        {title}
      </Text>
      
      <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
    </TouchableOpacity>
  );
  
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Card style={{ ...styles.settingsCard, shadowColor: colors.shadow }}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Apariencia
        </Text>
        
        {renderLinkItem(
          'color-palette-outline',
          'Configuración de Tema',
          () => navigation.navigate('ThemeSettings'),
        )}
      </Card>
      
      {/* Componente completo de configuración de notificaciones */}
      <NotificationSettings />
      
      <Card style={styles.settingsCard}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Otras Notificaciones
        </Text>
        
        {renderSettingItem(
          'mail-outline',
          'Notificaciones por Email',
          'Recibe resúmenes semanales y actualizaciones',
          emailNotifications,
          setEmailNotifications,
        )}
      </Card>
      
      {/* Widget de pantalla de inicio */}
       <Card style={styles.settingsCard}>
         <WidgetSettings theme={isDark ? 'dark' : 'light'} />
       </Card>
      
      <Card style={styles.settingsCard}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Funciones Móviles
        </Text>
        
        {renderLinkItem(
          'cloud-offline-outline',
          'Configuración Offline',
          () => navigation.navigate('OfflineSettings'),
        )}
        
        {renderLinkItem(
          'fitness-outline',
          'Configuración de Salud',
          () => navigation.navigate('HealthSettings'),
        )}
      </Card>
      
      <Card style={styles.settingsCard}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Cuenta
        </Text>
        
        {renderLinkItem(
          'person-outline',
          'Editar Perfil',
          () => {},
        )}
        
        {renderLinkItem(
          'key-outline',
          'Cambiar Contraseña',
          () => {},
        )}
        
        {renderLinkItem(
          'card-outline',
          'Gestionar Suscripción',
          () => {},
        )}
      </Card>
      
      <Card style={styles.settingsCard}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Soporte
        </Text>
        
        {renderLinkItem(
          'help-circle-outline',
          'Centro de Ayuda',
          () => {},
        )}
        
        {renderLinkItem(
          'chatbubble-outline',
          'Contactar Soporte',
          () => {},
        )}
        
        {renderLinkItem(
          'document-text-outline',
          'Términos y Condiciones',
          () => {},
        )}
      </Card>
      
      <TouchableOpacity
        style={[styles.logoutButton, { borderColor: colors.error }]}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={[styles.logoutText, { color: colors.error }]}>
          Cerrar Sesión
        </Text>
      </TouchableOpacity>
      
      <Text style={[styles.versionText, { color: colors.text.muted }]}>
        Versión 1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  themeCard: {
    marginBottom: 16,
  },
  settingsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  linkTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 14,
  },
});