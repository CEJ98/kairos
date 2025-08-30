'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Grid3X3, 
  Bookmark, 
  Bell, 
  Settings,
  Dumbbell,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

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
      className="flex flex-col items-center gap-1 py-3 px-2 min-w-[60px] touch-target transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 rounded-lg"
      aria-label={`${label}${badge ? ` (${badge} notificaciones)` : ''}`}
    >
      <div className={`nav-icon relative transition-all duration-300 ${isActive ? 'active scale-110' : 'hover:scale-105'}`}>
        <div className={`p-2 rounded-xl transition-all duration-300 ${
          isActive 
            ? 'bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-primary/30' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}>
          {icon}
        </div>
        {badge && badge > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse shadow-lg"
          >
            {badge > 99 ? '99+' : badge}
          </Badge>
        )}
      </div>
      <span className={`text-xs font-medium transition-all duration-300 text-center leading-tight ${
        isActive ? 'text-primary font-semibold' : 'text-gray-500'
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
  const pathname = usePathname()

  // Navegación para clientes
  const clientNavigation: NavigationItem[] = [
    { 
      href: '/dashboard', 
      icon: <Home size={22} />, 
      label: 'Inicio' 
    },
    { 
      href: '/dashboard/workouts', 
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
      href: '/dashboard/trainer/workouts', 
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
    if (href === '/dashboard' || href === '/dashboard/trainer') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/50 shadow-2xl z-50 lg:hidden safe-area-inset-bottom"
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="flex justify-around items-center py-1 px-2 max-w-md mx-auto">
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
      {/* Safe area padding for devices with home indicator */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  )
}
