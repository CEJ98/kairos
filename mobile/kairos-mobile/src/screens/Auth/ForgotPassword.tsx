import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useTheme from '../../hooks/useTheme';
import SecureInput from '../../components/SecureInput';
import Button from '../../components/Button';
import { forgotPasswordSchema, ForgotPasswordFormData } from '../../lib/validation';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });
  
  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      // Aquí iría la lógica de recuperación de contraseña real
      console.log('Forgot password data:', data);
      
      // Simular un retraso de envío
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mostrar mensaje de éxito
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error de recuperación de contraseña:', error);
      Alert.alert(
        'Error',
        'No pudimos procesar tu solicitud. Por favor, intenta nuevamente.',
        [{ text: 'OK' }]
      );
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            ← Volver
          </Text>
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Recuperar Contraseña
        </Text>
        
        {!isSubmitted ? (
          <>
            <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
              Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña
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
                    helperText="Te enviaremos un enlace para restablecer tu contraseña"
                  />
                )}
              />
              
              <Button
                title="Enviar Instrucciones"
                onPress={handleSubmit(onSubmit)}
                variant="primary"
                size="lg"
                loading={isLoading}
                fullWidth
                style={styles.submitButton}
              />
            </View>
          </>
        ) : (
          <View style={styles.successContainer}>
            <Text style={[styles.successTitle, { color: colors.text.primary }]}>
              ¡Correo Enviado!
            </Text>
            
            <Text style={[styles.successText, { color: colors.text.secondary }]}>
              Hemos enviado instrucciones para restablecer tu contraseña al correo electrónico proporcionado.
            </Text>
            
            <Text style={[styles.successNote, { color: colors.text.secondary }]}>
              Si no recibes el correo en unos minutos, revisa tu carpeta de spam o correo no deseado.
            </Text>
            
            <Button
              title="Volver al Inicio de Sesión"
              onPress={() => navigation.navigate('Login' as never)}
              variant="primary"
              size="lg"
              fullWidth
              style={styles.backToLoginButton}
            />
            
            <TouchableOpacity 
              onPress={() => setIsSubmitted(false)}
              style={styles.resendContainer}
            >
              <Text style={[styles.resendText, { color: colors.primary }]}>
                Reenviar correo
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  backButton: {
    alignSelf: 'flex-start',
    marginTop: 20,
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  submitButton: {
    marginBottom: 24,
  },
  successContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  successNote: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    fontStyle: 'italic',
  },
  backToLoginButton: {
    marginBottom: 16,
  },
  resendContainer: {
    marginTop: 16,
  },
  resendText: {
    fontSize: 16,
    fontWeight: '500',
  },
});