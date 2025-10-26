import type { LucideIcon } from 'lucide-react';
import { Calendar, Dumbbell, Gauge, Library, LineChart, Sparkles, Shield, Play } from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const mainNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Gauge },
  { href: '/auth', label: 'Autenticación', icon: Shield },
  { href: '/demo', label: 'Demo', icon: Play },
  { href: '/workout', label: 'Entrenar', icon: Dumbbell },
  { href: '/progress', label: 'Progreso', icon: LineChart },
  { href: '/calendar', label: 'Calendario', icon: Calendar },
  { href: '/exercises', label: 'Biblioteca', icon: Library },
  { href: '/insights', label: 'Insights', icon: Sparkles }
];
