import {getRequestConfig} from 'next-intl/server';
import {locales, defaultLocale} from '../i18n';
 
export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  const validLocale: string = locales.includes(locale as any) ? (locale ?? defaultLocale) : defaultLocale;
 
  return {
    locale: validLocale,
    messages: (await import(`../../messages/${validLocale}.json`)).default
  };
});