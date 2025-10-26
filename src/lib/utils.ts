import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, locale = 'es-MX', currency = 'MXN') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

export function formatISODate(value: string | Date, locale = 'es-MX') {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));
}
