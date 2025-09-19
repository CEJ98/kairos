'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Dumbbell,
  TrendingUp,
  Users,
  Calendar,
  Settings,
  Brain,
  Zap,
  User,
  BarChart3,
  DollarSign
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface BottomNavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive?: boolean
  badge?: number
}

function BottomNavItem({ href, icon, label, isActive, badge }: BottomNavItemProps) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 py-3 px-2 min-w-[60px] touch-target transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded-2xl group overflow-hidden"
      aria-label={`${label}${badge ? ` (${badge} notificaciones)` : ''}`}
    >
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent animate-pulse rounded-2xl" />
      )}
      <div className={`nav-icon relative transition-all duration-300 z-10 ${
        isActive ? 'active scale-110 -rotate-3' : 'group-hover:scale-110 group-hover:rotate-2'
      }`}>
        <div className={`p-2 rounded-xl transition-all duration-300 ${
          isActive 
            ? 'bg-gradient-to-t from-primary via-blue-500 to-purple-600 text-white shadow-2xl shadow-primary/30 dark:shadow-primary/10' 
            : 'bg-gradient-to-t from-gray-100 to-blue-50/50 text-gray-600 group-hover:from-gray-200 group-hover:to-blue-100/70 group-hover:shadow-lg dark:from-gray-800 dark:to-gray-700 dark:text-gray-300 dark:group-hover:from-gray-700 dark:group-hover:to-gray-600'
        }`}>
          <div className={`transition-all duration-300 ${
            isActive ? 'scale-110' : 'group-hover:scale-105'
          }`}>
            {icon}
          </div>
        </div>
        {badge && badge > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 text-xs font-bold animate-bounce shadow-lg z-20"
          >
            {badge > 99 ? '99+' : badge}
          </Badge>
        )}
      </div>
      <span className={`text-xs font-semibold transition-all duration-300 text-center leading-tight relative z-10 ${
        isActive ? 'text-primary font-bold dark:text-primary' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
      }`}>
        {label}
      </span>
    </Link>
  )
}

interface BottomNavigationProps {
  userRole?: 'CLIENT' | 'TRAINER' | 'ADMIN'
}

interface NavigationItem {
  href: string
  icon: React.ReactNode
  label: string
  badge?: number
}

export default function BottomNavigation({ userRole = 'CLIENT' }: BottomNavigationProps) {
  const pathname = usePathname() || ''

  // Navegación para clientes
  const clientNavigation: NavigationItem[] = [
    { 
      href: '/dashboard', 
      icon: <Home size={22} />, 
      label: 'Inicio' 
    },
    { 
      href: '/workouts', 
      icon: <Dumbbell size={22} />, 
      label: 'Rutinas' 
    },
    { 
      href: '/dashboard/progress', 
      icon: <TrendingUp size={22} />, 
      label: 'Progreso' 
    },
    { 
      href: '/dashboard/calendar', 
      icon: <Calendar size={22} />, 
      label: 'Agenda' 
    },
    { 
      href: '/dashboard/profile', 
      icon: <Users size={22} />, 
      label: 'Perfil' 
    }
  ]

  // Navegación para entrenadores
  const trainerNavigation: NavigationItem[] = [
    { 
      href: '/dashboard/trainer', 
      icon: <Home size={22} />, 
      label: 'Inicio' 
    },
    { 
      href: '/dashboard/trainer/clients', 
      icon: <Users size={22} />, 
      label: 'Clientes',
      badge: 3
    },
    { 
      href: '/workouts', 
      icon: <Dumbbell size={22} />, 
      label: 'Rutinas' 
    },
    { 
      href: '/dashboard/trainer/calendar', 
      icon: <Calendar size={22} />, 
      label: 'Agenda' 
    },
    { 
      href: '/dashboard/trainer/analytics', 
      icon: <TrendingUp size={22} />, 
      label: 'Stats' 
    }
  ]

  const navigation = userRole === 'TRAINER' ? trainerNavigation : clientNavigation

  const isActive = (href: string) => {
    if (!pathname) return false
    if (href === '/dashboard' || href === '/dashboard/trainer') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50 shadow-2xl z-50 lg:hidden safe-area-inset-bottom"
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="bg-gradient-to-r from-white/50 via-blue-50/30 to-white/50 dark:from-gray-900/50 dark:via-gray-800/30 dark:to-gray-900/50">
        <div className="flex justify-around items-center py-2 px-3 max-w-md mx-auto">
        {navigation.map((item) => (
          <BottomNavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={isActive(item.href)}
            badge={item.badge || undefined}
          />
        ))}
        </div>
      </div>
      {/* Safe area padding for devices with home indicator */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  )
}
