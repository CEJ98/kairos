import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useTheme from '../../hooks/useTheme';
import SecureInput from '../../components/SecureInput';
import Button from '../../components/Button';
import { loginSchema, LoginFormData } from '../../lib/validation';

export default function LoginScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  
  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Aquí iría la lógica de autenticación real
      console.log('Login data:', data);
      
      // Simular un retraso de autenticación
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navegar a la pantalla principal después del login exitoso
      navigation.navigate('Main' as never);
    } catch (error) {
      console.error('Error de login:', error);
      // Aquí se manejaría el error de autenticación
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Text style={[styles.logo, { color: colors.primary }]}>KAIROS</Text>
          <Text style={[styles.logoSubtitle, { color: colors.text.secondary }]}>FITNESS</Text>
        </View>
        
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Iniciar Sesión
        </Text>
        
        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <SecureInput
                label="Correo Electrónico"
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                containerStyle={styles.inputContainer}
                leftIcon="mail"
                required
              />
            )}
          />
          
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <SecureInput
                label="Contraseña"
                placeholder="Tu contraseña"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                containerStyle={styles.inputContainer}
                leftIcon="lock-closed"
                required
              />
            )}
          />
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('ForgotPassword' as never)}
            style={styles.forgotPasswordContainer}
          >
            <Text style={[styles.forgotPassword, { color: colors.primary }]}>
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>
          
          <Button
            title="Iniciar Sesión"
            onPress={handleSubmit(onSubmit)}
            variant="primary"
            size="lg"
            loading={isLoading}
            fullWidth
            style={styles.loginButton}
          />
          
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.text.secondary }]}>O</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>
          
          <Button
            title="Continuar con Google"
            onPress={() => console.log('Google login')}
            variant="outline"
            size="lg"
            fullWidth
            style={styles.socialButton}
            // leftIcon={<GoogleIcon />}
          />
          
          <Button
            title="Continuar con Apple"
            onPress={() => console.log('Apple login')}
            variant="outline"
            size="lg"
            fullWidth
            style={styles.socialButton}
            // leftIcon={<AppleIcon />}
          />
        </View>
        
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.text.secondary }]}>
            ¿No tienes una cuenta?
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register' as never)}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>
              Regístrate
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  logoSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: -5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: 24,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
  },
  socialButton: {
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
});