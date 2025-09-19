// Utilidades de i18n para uso en cliente/servidor sin depender de next-intl/server

// Idiomas soportados
export const locales = ['es', 'en'] as const
export type Locale = (typeof locales)[number]

// Idioma por defecto
export const defaultLocale: Locale = 'es'

// Configuración de next-intl
// Helper opcional para cargar mensajes si se necesita en otros puntos
export async function loadMessages(locale?: string) {
  const validLocale = (locale as Locale) || defaultLocale
  try {
    const messages = (await import(`../messages/${validLocale}.json`)).default
    return { locale: validLocale, messages }
  } catch (error) {
    console.error(`Error loading messages for locale ${validLocale}:`, error)
    return { locale: validLocale, messages: {} }
  }
}
