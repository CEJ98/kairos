/**
 * Enhanced Form Validation for Mobile App
 * Sistema de validación robusto para formularios móviles con Zod
 */

import { z } from 'zod';

// Mensajes de validación en español
const messages = {
  required: (field: string) => `${field} es requerido`,
  email: 'Formato de correo electrónico inválido',
  min: (field: string, min: number) => `${field} debe tener al menos ${min} caracteres`,
  max: (field: string, max: number) => `${field} no puede exceder ${max} caracteres`,
  minValue: (field: string, min: number) => `${field} debe ser mayor a ${min}`,
  maxValue: (field: string, max: number) => `${field} no puede ser mayor a ${max}`,
  positive: (field: string) => `${field} debe ser un número positivo`,
  url: 'URL inválida',
  phone: 'Número de teléfono inválido',
  password: {
    weak: 'Contraseña muy débil',
    minLength: 'La contraseña debe tener al menos 8 caracteres',
    requiresUppercase: 'Debe contener al menos una mayúscula',
    requiresLowercase: 'Debe contener al menos una minúscula',
    requiresNumber: 'Debe contener al menos un número',
    requiresSpecial: 'Debe contener al menos un carácter especial (!@#$%^&*)',
    noSpaces: 'La contraseña no puede contener espacios',
    noCommonPatterns: 'Evita patrones comunes como 123456 o qwerty'
  }
};

// Validaciones personalizadas
const customValidation = {
  // Validación de contraseña segura
  password: (value: string) => {
    if (!value) return false;
    
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
    const hasNoSpaces = !/\s/.test(value);
    
    // Patrones comunes a evitar
    const commonPatterns = [
      '123456', '654321', 'qwerty', 'asdfgh', 'password', 
      'admin', 'user', '111111', '000000', 'abc123'
    ];
    const hasNoCommonPatterns = !commonPatterns.some(pattern => 
      value.toLowerCase().includes(pattern)
    );
    
    return hasUpperCase && hasLowerCase && hasNumber && hasSpecial && 
           hasNoSpaces && hasNoCommonPatterns && value.length >= 8;
  },
  
  // Validación de nombre (solo letras, espacios y acentos)
  name: (value: string) => {
    if (!value) return false;
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value.trim());
  },
  
  // Validación de teléfono
  phone: (value: string) => {
    if (!value) return true; // Opcional
    // Acepta formatos: +1234567890, (123) 456-7890, 123-456-7890, 123.456.7890
    return /^[+]?[\d\s\-\(\)\.]{10,20}$/.test(value);
  },
  
  // Validación de URL
  url: (value: string) => {
    if (!value) return true; // Opcional
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }
};

// =================== ESQUEMAS BASE ===================

// Email con validación mejorada
export const emailSchema = z
  .string()
  .min(1, messages.required('El correo electrónico'))
  .email(messages.email)
  .max(254, messages.max('El correo electrónico', 254))
  .toLowerCase()
  .trim()
  .refine((email) => {
    // Validaciones adicionales de seguridad
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    
    const [localPart, domain] = parts;
    
    // Validar parte local (antes del @)
    if (localPart.length > 64) return false;
    if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
    if (localPart.includes('..')) return false;
    
    // Validar dominio
    if (domain.length > 253) return false;
    if (domain.startsWith('-') || domain.endsWith('-')) return false;
    
    return true;
  }, {
    message: 'Formato de correo electrónico inválido'
  });

// Contraseña con validación robusta
export const passwordSchema = z
  .string()
  .min(1, messages.required('La contraseña'))
  .min(8, messages.password.minLength)
  .max(128, messages.max('La contraseña', 128))
  .refine((password) => /[A-Z]/.test(password), {
    message: messages.password.requiresUppercase
  })
  .refine((password) => /[a-z]/.test(password), {
    message: messages.password.requiresLowercase
  })
  .refine((password) => /\d/.test(password), {
    message: messages.password.requiresNumber
  })
  .refine((password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), {
    message: messages.password.requiresSpecial
  })
  .refine((password) => !/\s/.test(password), {
    message: messages.password.noSpaces
  })
  .refine((password) => {
    const commonPatterns = [
      '123456', '654321', 'qwerty', 'asdfgh', 'password', 
      'admin', 'user', '111111', '000000', 'abc123'
    ];
    return !commonPatterns.some(pattern => 
      password.toLowerCase().includes(pattern)
    );
  }, {
    message: messages.password.noCommonPatterns
  });

// Nombre con validación mejorada
export const nameSchema = z
  .string()
  .min(1, messages.required('El nombre'))
  .min(2, messages.min('El nombre', 2))
  .max(50, messages.max('El nombre', 50))
  .trim()
  .refine((name) => customValidation.name(name), {
    message: 'El nombre solo puede contener letras, espacios y acentos'
  })
  .refine((name) => {
    // No permitir nombres que sean solo espacios
    return name.trim().length > 0;
  }, {
    message: 'El nombre no puede estar vacío'
  })
  .refine((name) => {
    // No permitir múltiples espacios consecutivos
    return !/\s{2,}/.test(name);
  }, {
    message: 'El nombre no puede tener espacios múltiples consecutivos'
  });

// Teléfono opcional con validación
export const phoneSchema = z
  .string()
  .optional()
  .refine((phone) => {
    if (!phone || phone.trim() === '') return true;
    return customValidation.phone(phone);
  }, {
    message: messages.phone
  });

// =================== ESQUEMAS DE FORMULARIOS ===================

// Esquema de login mejorado
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, messages.required('La contraseña'))
});

// Esquema de registro mejorado
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, messages.required('La confirmación de contraseña'))
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

// Esquema de recuperación de contraseña
export const forgotPasswordSchema = z.object({
  email: emailSchema
});

// Esquema de restablecimiento de contraseña
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token de restablecimiento requerido'),
  password: passwordSchema,
  confirmPassword: z.string().min(1, messages.required('La confirmación de contraseña'))
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

// Esquema de perfil de usuario
export const userProfileSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  bio: z.string()
    .max(500, messages.max('La biografía', 500))
    .optional(),
  dateOfBirth: z.date().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional()
});

// Esquema de configuraciones
export const settingsSchema = z.object({
  notifications: z.object({
    push: z.boolean().default(true),
    email: z.boolean().default(true),
    workoutReminders: z.boolean().default(true),
    progressUpdates: z.boolean().default(true)
  }),
  privacy: z.object({
    profileVisibility: z.enum(['public', 'friends', 'private']).default('friends'),
    shareProgress: z.boolean().default(false),
    shareWorkouts: z.boolean().default(false)
  }),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    language: z.enum(['es', 'en']).default('es'),
    units: z.enum(['metric', 'imperial']).default('metric')
  })
});

// Esquema de ejercicio
export const exerciseSchema = z.object({
  name: z.string()
    .min(1, messages.required('El nombre del ejercicio'))
    .min(2, messages.min('El nombre del ejercicio', 2))
    .max(100, messages.max('El nombre del ejercicio', 100))
    .trim(),
  description: z.string()
    .max(1000, messages.max('La descripción', 1000))
    .optional(),
  category: z.enum([
    'strength', 'cardio', 'flexibility', 'balance', 'sports', 'other'
  ]),
  muscleGroups: z.array(z.string()).min(1, 'Selecciona al menos un grupo muscular'),
  equipment: z.array(z.string()).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  instructions: z.array(z.string()).min(1, 'Agrega al menos una instrucción')
});

// Esquema de rutina de ejercicio
export const workoutSchema = z.object({
  name: z.string()
    .min(1, messages.required('El nombre de la rutina'))
    .min(2, messages.min('El nombre de la rutina', 2))
    .max(100, messages.max('El nombre de la rutina', 100))
    .trim(),
  description: z.string()
    .max(500, messages.max('La descripción', 500))
    .optional(),
  category: z.enum([
    'strength', 'cardio', 'flexibility', 'hiit', 'yoga', 'pilates', 'custom'
  ]),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  duration: z.number()
    .min(5, messages.minValue('La duración', 5))
    .max(300, messages.maxValue('La duración', 300)),
  exercises: z.array(z.object({
    exerciseId: z.string(),
    sets: z.number().min(1, 'Mínimo 1 serie'),
    reps: z.number().min(1, 'Mínimo 1 repetición').optional(),
    duration: z.number().min(1, 'Mínimo 1 segundo').optional(),
    weight: z.number().min(0, 'El peso no puede ser negativo').optional(),
    restTime: z.number().min(0, 'El tiempo de descanso no puede ser negativo').optional()
  })).min(1, 'Agrega al menos un ejercicio')
});

// =================== UTILIDADES ===================

// Función para obtener la fortaleza de la contraseña
export const getPasswordStrength = (password: string): {
  score: number;
  label: string;
  color: string;
  suggestions: string[];
} => {
  if (!password) {
    return {
      score: 0,
      label: 'Sin contraseña',
      color: '#ef4444',
      suggestions: ['Ingresa una contraseña']
    };
  }

  let score = 0;
  const suggestions: string[] = [];

  // Longitud
  if (password.length >= 8) score += 1;
  else suggestions.push('Usa al menos 8 caracteres');

  if (password.length >= 12) score += 1;

  // Mayúsculas
  if (/[A-Z]/.test(password)) score += 1;
  else suggestions.push('Agrega al menos una mayúscula');

  // Minúsculas
  if (/[a-z]/.test(password)) score += 1;
  else suggestions.push('Agrega al menos una minúscula');

  // Números
  if (/\d/.test(password)) score += 1;
  else suggestions.push('Agrega al menos un número');

  // Caracteres especiales
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  else suggestions.push('Agrega al menos un carácter especial');

  // Patrones comunes
  const commonPatterns = ['123456', 'qwerty', 'password', 'admin'];
  const hasCommonPattern = commonPatterns.some(pattern => 
    password.toLowerCase().includes(pattern)
  );
  if (!hasCommonPattern) score += 1;
  else suggestions.push('Evita patrones comunes');

  // Espacios
  if (!/\s/.test(password)) score += 1;
  else suggestions.push('No uses espacios');

  // Determinar etiqueta y color
  let label: string;
  let color: string;

  if (score <= 2) {
    label = 'Muy débil';
    color = '#ef4444';
  } else if (score <= 4) {
    label = 'Débil';
    color = '#f97316';
  } else if (score <= 6) {
    label = 'Regular';
    color = '#eab308';
  } else if (score <= 7) {
    label = 'Fuerte';
    color = '#22c55e';
  } else {
    label = 'Muy fuerte';
    color = '#16a34a';
  }

  return { score, label, color, suggestions };
};

// Función para sanitizar entrada de texto
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>"'&]/g, '') // Remover caracteres potencialmente peligrosos
    .replace(/\s+/g, ' '); // Normalizar espacios
};

// =================== EXPORTACIONES DE TIPOS ===================

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UserProfileFormData = z.infer<typeof userProfileSchema>;
export type SettingsFormData = z.infer<typeof settingsSchema>;
export type ExerciseFormData = z.infer<typeof exerciseSchema>;
export type WorkoutFormData = z.infer<typeof workoutSchema>;

// Exportar utilidades
export const validationUtils = {
  messages,
  customValidation,
  getPasswordStrength,
  sanitizeInput
};