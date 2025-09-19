import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useTheme from '../../hooks/useTheme';
import SecureInput from '../../components/SecureInput';
import Button from '../../components/Button';
import { registerSchema, RegisterFormData } from '../../lib/validation';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  
  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  
  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      // Aquí iría la lógica de registro real
      console.log('Register data:', data);
      
      // Simular un retraso de registro
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navegar a la pantalla principal después del registro exitoso
      navigation.navigate('Main' as never);
    } catch (error) {
      console.error('Error de registro:', error);
      // Aquí se manejaría el error de registro
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
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Crear Cuenta
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Completa tus datos para comenzar tu viaje fitness
        </Text>
        
        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <SecureInput
                label="Nombre Completo"
                placeholder="Tu nombre"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                containerStyle={styles.inputContainer}
                leftIcon="person"
                required
                helperText="Solo letras, espacios y acentos permitidos"
                autoCapitalize="words"
              />
            )}
          />
          
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
                helperText="Usaremos este correo para enviarte notificaciones"
              />
            )}
          />
          
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <SecureInput
                label="Contraseña"
                placeholder="Tu contraseña segura"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                containerStyle={styles.inputContainer}
                leftIcon="lock-closed"
                required
                showPasswordStrength
                helperText="Mínimo 8 caracteres con mayúsculas, minúsculas, números y símbolos"
              />
            )}
          />
          
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <SecureInput
                label="Confirmar Contraseña"
                placeholder="Repite tu contraseña"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                containerStyle={styles.inputContainer}
                leftIcon="lock-closed"
                required
                helperText="Debe coincidir exactamente con la contraseña anterior"
              />
            )}
          />
          
          <Text style={[styles.termsText, { color: colors.text.secondary }]}>
            Al registrarte, aceptas nuestros{' '}
            <Text style={[styles.termsLink, { color: colors.primary }]}>
              Términos y Condiciones
            </Text>
            {' '}y{' '}
            <Text style={[styles.termsLink, { color: colors.primary }]}>
              Política de Privacidad
            </Text>
          </Text>
          
          <Button
            title="Crear Cuenta"
            onPress={handleSubmit(onSubmit)}
            variant="primary"
            size="lg"
            loading={isLoading}
            fullWidth
            style={styles.registerButton}
          />
          
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.text.secondary }]}>O</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>
          
          <Button
            title="Continuar con Google"
            onPress={() => console.log('Google register')}
            variant="outline"
            size="lg"
            fullWidth
            style={styles.socialButton}
            // leftIcon={<GoogleIcon />}
          />
          
          <Button
            title="Continuar con Apple"
            onPress={() => console.log('Apple register')}
            variant="outline"
            size="lg"
            fullWidth
            style={styles.socialButton}
            // leftIcon={<AppleIcon />}
          />
        </View>
        
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.text.secondary }]}>
            ¿Ya tienes una cuenta?
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>
              Iniciar Sesión
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  termsText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  termsLink: {
    fontWeight: '500',
  },
  registerButton: {
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