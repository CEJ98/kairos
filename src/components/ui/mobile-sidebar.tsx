'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Dumbbell, 
  LayoutDashboard, 
  Zap, 
  TrendingUp, 
  User, 
  Settings, 
  LogOut,
  X,
  Users,
  DollarSign,
  Calendar,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  userRole?: 'CLIENT' | 'TRAINER' | 'ADMIN'
}

interface NavigationItem {
  href: string
  icon: React.ReactNode
  label: string
  badge?: number
  description?: string
}

export default function MobileSidebar({ isOpen, onClose, userRole = 'CLIENT' }: MobileSidebarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const isTrainer = userRole === 'TRAINER'
  const isAdmin = userRole === 'ADMIN'

  // Navegación para clientes
  const clientNavigation: NavigationItem[] = [
    { 
      href: '/dashboard', 
      icon: <LayoutDashboard size={20} />, 
      label: 'Dashboard',
      description: 'Vista general de tu progreso'
    },
    { 
      href: '/dashboard/workouts', 
      icon: <Dumbbell size={20} />, 
      label: 'Rutinas',
      description: 'Tus entrenamientos personalizados'
    },
    { 
      href: '/dashboard/exercises', 
      icon: <Zap size={20} />, 
      label: 'Ejercicios',
      description: 'Biblioteca de ejercicios'
    },
    { 
      href: '/dashboard/progress', 
      icon: <TrendingUp size={20} />, 
      label: 'Progreso',
      description: 'Seguimiento de resultados'
    },
    { 
      href: '/dashboard/profile', 
      icon: <User size={20} />, 
      label: 'Perfil',
      description: 'Información personal'
    },
    { 
      href: '/dashboard/billing', 
      icon: <DollarSign size={20} />, 
      label: 'Suscripción',
      description: 'Gestiona tu plan'
    },
  ]

  // Navegación para entrenadores
  const trainerNavigation: NavigationItem[] = [
    { 
      href: '/dashboard/trainer', 
      icon: <LayoutDashboard size={20} />, 
      label: 'Dashboard',
      description: 'Panel de control'
    },
    { 
      href: '/dashboard/trainer/clients', 
      icon: <Users size={20} />, 
      label: 'Clientes',
      badge: 3,
      description: 'Gestiona tus clientes'
    },
    { 
      href: '/dashboard/trainer/workouts', 
      icon: <Dumbbell size={20} />, 
      label: 'Rutinas',
      description: 'Crea y edita rutinas'
    },
    { 
      href: '/dashboard/trainer/calendar', 
      icon: <Calendar size={20} />, 
      label: 'Calendario',
      description: 'Agenda de sesiones'
    },
    { 
      href: '/dashboard/trainer/analytics', 
      icon: <TrendingUp size={20} />, 
      label: 'Analytics',
      description: 'Estadísticas detalladas'
    },
    { 
      href: '/dashboard/trainer/settings', 
      icon: <Settings size={20} />, 
      label: 'Configuración',
      description: 'Ajustes de cuenta'
    },
  ]

  const navigation = isTrainer ? trainerNavigation : clientNavigation

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/dashboard/trainer') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && isOpen) {
      onClose()
    }
  }

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const handleNavClick = () => {
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-blue-600 rounded-xl">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Kairos</h1>
              {isTrainer && (
                <Badge variant="secondary" className="text-xs mt-1">PRO</Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </Button>
        </div>

        {/* User info */}
        <div className="p-6 bg-gradient-to-r from-primary/5 to-blue-50 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={session?.user?.image || ''} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white font-semibold">
                {session?.user?.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {session?.user?.name || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session?.user?.email}
              </p>
              <Badge 
                variant={isTrainer ? 'default' : 'secondary'} 
                className="text-xs mt-1"
              >
                {isTrainer ? 'Entrenador' : 'Cliente'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4" role="navigation">
          <div className="px-4 space-y-1">
            {navigation.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                    active
                      ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/25'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <div className={`flex-shrink-0 transition-transform duration-200 ${
                    active ? 'scale-110' : 'group-hover:scale-105'
                  }`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <Badge 
                          variant={active ? 'secondary' : 'destructive'}
                          className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className={`text-xs mt-0.5 truncate ${
                        active ? 'text-white/80' : 'text-gray-500'
                      }`}>
                        {item.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight 
                    size={16} 
                    className={`flex-shrink-0 transition-transform duration-200 ${
                      active ? 'text-white/80' : 'text-gray-400 group-hover:text-gray-600'
                    } group-hover:translate-x-1`} 
                  />
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full justify-start gap-3 px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </Button>
        </div>

        {/* Swipe indicator */}
        <div className="absolute top-1/2 -right-3 transform -translate-y-1/2">
          <div className="w-6 h-12 bg-white/80 backdrop-blur-sm rounded-r-lg shadow-lg flex items-center justify-center">
            <div className="w-1 h-6 bg-gray-300 rounded-full" />
          </div>
        </div>
      </div>
    </>
  )
}