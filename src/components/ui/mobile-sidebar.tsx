'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/theme-toggle'
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
  ChevronRight,
  Brain
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
  const pathname = usePathname() || ''
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

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
      href: '/workouts', 
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
      href: '/workouts', 
      icon: <Dumbbell size={20} />, 
      label: 'Rutinas',
      description: 'Crea y edita rutinas'
    },
    { 
      href: '/dashboard/trainer/ai-workouts', 
      icon: <Brain size={20} />, 
      label: 'AI Workouts',
      description: 'Entrenamientos con IA'
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

  // Navegación para administradores
  const adminNavigation: NavigationItem[] = [
    { 
      href: '/admin', 
      icon: <Settings size={20} />, 
      label: 'Administración',
      description: 'Panel de administración'
    },
    { 
      href: '/admin/backup', 
      icon: <Settings size={20} />, 
      label: 'Respaldos',
      description: 'Gestión de copias de seguridad'
    },
    { 
      href: '/admin/stripe-webhooks', 
      icon: <Settings size={20} />, 
      label: 'Stripe Webhooks',
      description: 'Configuración de webhooks de Stripe'
    },
    { 
      href: '/dashboard', 
      icon: <LayoutDashboard size={20} />, 
      label: 'Dashboard',
      description: 'Vista general'
    },
    { 
      href: '/workouts', 
      icon: <Dumbbell size={20} />, 
      label: 'Rutinas',
      description: 'Entrenamientos'
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
      description: 'Seguimiento'
    },
    { 
      href: '/dashboard/profile', 
      icon: <User size={20} />, 
      label: 'Perfil',
      description: 'Información personal'
    },
  ]

  const navigation = isAdmin ? adminNavigation : (isTrainer ? trainerNavigation : clientNavigation)

  const isActive = (href: string) => {
    if (!pathname) return false
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
      previouslyFocused.current = document.activeElement as HTMLElement
      // Focus close button for accessibility
      requestAnimationFrame(() => closeBtnRef.current?.focus())
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
      if (previouslyFocused.current) {
        previouslyFocused.current.focus()
      }
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
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-out lg:hidden ${
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
        <div className="flex items-center justify-between p-6 border-b border-gray-100/50 dark:border-gray-800/50 bg-gradient-to-r from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-primary via-blue-500 to-purple-600 rounded-2xl shadow-lg animate-pulse">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">Kairos</h1>
              {isTrainer && (
                <Badge variant="default" className="text-xs mt-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold shadow-md">PRO</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95"
              aria-label="Cerrar menú"
              ref={closeBtnRef}
            >
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* User info */}
        <div className="p-6 bg-gradient-to-br from-primary/5 via-blue-50/50 to-purple-50/30 dark:from-primary/10 dark:via-blue-950/30 dark:to-purple-950/20 border-b border-gray-100/50 dark:border-gray-800/50">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-14 w-14 ring-4 ring-primary/20 shadow-xl">
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback className="bg-gradient-to-br from-primary via-blue-500 to-purple-600 text-white font-bold text-lg">
                  {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                {session?.user?.name || 'Usuario'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate mb-2">
                {session?.user?.email}
              </p>
              <Badge 
                variant={isTrainer ? 'default' : 'secondary'} 
                className={`text-xs font-semibold shadow-md ${
                  isTrainer 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                }`}
              >
                {isTrainer ? '👨‍💼 Entrenador' : '🏃‍♂️ Cliente'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 dark:bg-gray-900" role="navigation">
          <div className="px-4 space-y-1">
            {navigation.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={`group flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden ${
                    active
                      ? 'bg-gradient-to-r from-primary via-blue-500 to-purple-600 text-white shadow-2xl shadow-primary/30 dark:shadow-primary/20'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/50 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gradient-to-r dark:hover:from-gray-800 dark:hover:to-gray-700 dark:hover:text-white hover:shadow-lg'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {active && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-pulse" />
                  )}
                  <div className={`flex-shrink-0 transition-all duration-300 relative z-10 ${
                    active ? 'scale-110 rotate-3' : 'group-hover:scale-110 group-hover:rotate-2'
                  }`}>
                    <div className={`p-2 rounded-xl transition-all duration-300 ${
                      active 
                        ? 'bg-white/20 shadow-lg' 
                        : 'bg-gray-100/50 group-hover:bg-white/80 dark:bg-gray-700/50 dark:group-hover:bg-gray-600'
                    }`}>
                      {item.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-semibold">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <Badge 
                          variant={active ? 'secondary' : 'destructive'}
                          className="ml-2 h-6 w-6 flex items-center justify-center p-0 text-xs font-bold shadow-lg animate-bounce"
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className={`text-xs mt-1 truncate transition-all duration-300 ${
                        active ? 'text-white/90' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                      }`}>
                        {item.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight 
                    size={18} 
                    className={`flex-shrink-0 transition-all duration-300 relative z-10 ${
                      active ? 'text-white/90 translate-x-1' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'
                    } group-hover:translate-x-2 group-hover:scale-110`} 
                  />
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100/50 dark:border-gray-800/50 bg-gradient-to-r from-gray-50/50 to-white dark:from-gray-800/50 dark:to-gray-900">
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full justify-start gap-4 px-4 py-4 text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 dark:text-red-400 dark:hover:text-white dark:hover:bg-gradient-to-r dark:hover:from-red-600 dark:hover:to-red-700 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-xl group"
          >
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl group-hover:bg-white/20 transition-all duration-300">
              <LogOut size={20} />
            </div>
            <span className="font-semibold">Cerrar Sesión</span>
          </Button>
        </div>

        {/* Swipe indicator */}
        <div className="absolute top-1/2 -right-3 transform -translate-y-1/2">
          <div className="w-6 h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-r-lg shadow-lg flex items-center justify-center">
            <div className="w-1 h-6 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>
        </div>
      </div>
    </>
  )
}
