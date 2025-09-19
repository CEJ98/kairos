'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { 
  Dumbbell, 
  LayoutDashboard, 
  Zap, 
  TrendingUp, 
  User, 
  Settings, 
  LogOut,
  Menu,
  X,
  Users,
  DollarSign,
  Calendar,
  Bell,
  Search,
  Brain
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import BottomNavigation from '@/components/ui/bottom-navigation'
import MobileSidebar from '@/components/ui/mobile-sidebar'
import { useResponsive } from '@/hooks/useResponsive'
import NotificationSystem from '@/components/notifications/notification-system'
import { LanguageSelector } from '@/components/ui/language-selector'

interface SidebarItemProps {
  href: string
  icon: React.ReactNode
  label: string
  badge?: string | number
  isActive?: boolean
}

function SidebarItem({ href, icon, label, badge, isActive }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02] ${
        isActive
          ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/25'
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <div className={`transition-transform duration-200 ${
        isActive ? 'scale-110' : 'group-hover:scale-105'
      }`}>
        {icon}
      </div>
      <span className="flex-1">{label}</span>
      {badge && (
        <Badge 
          variant={isActive ? 'secondary' : 'destructive'}
          className="h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {badge}
        </Badge>
      )}
    </Link>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isMobile, isTablet } = useResponsive()
  const t = useTranslations('navigation')

  // Redirect si no está autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/es/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  const isTrainer = session?.user?.role === 'TRAINER'
  const isAdmin = session?.user?.role === 'ADMIN'

  // Navegación para clientes
  const clientNavigation = [
    { href: '/dashboard', icon: <LayoutDashboard size={20} />, label: t('dashboard') },
    { href: '/dashboard/workouts', icon: <Dumbbell size={20} />, label: t('workouts') },
    { href: '/dashboard/exercises', icon: <Zap size={20} />, label: t('exercises') },
    { href: '/dashboard/progress', icon: <TrendingUp size={20} />, label: t('progress') },
    { href: '/dashboard/profile', icon: <User size={20} />, label: t('profile') },
    { href: '/dashboard/billing', icon: <DollarSign size={20} />, label: t('billing') },
  ]

  // Navegación para entrenadores
  const trainerNavigation = [
    { href: '/dashboard/trainer', icon: <LayoutDashboard size={20} />, label: t('dashboard') },
    { href: '/dashboard/trainer/clients', icon: <Users size={20} />, label: t('clients'), badge: '12' },
    { href: '/dashboard/trainer/workouts', icon: <Dumbbell size={20} />, label: t('workouts') },
    { href: '/dashboard/trainer/ai-workouts', icon: <Brain size={20} />, label: t('aiWorkouts') },
    { href: '/dashboard/trainer/exercises', icon: <Zap size={20} />, label: t('exercises') },
    { href: '/dashboard/trainer/calendar', icon: <Calendar size={20} />, label: t('calendar') },
    { href: '/dashboard/trainer/billing', icon: <DollarSign size={20} />, label: t('billing') },
    { href: '/dashboard/trainer/profile', icon: <User size={20} />, label: t('profile') },
  ]

  const navigation = isTrainer ? trainerNavigation : clientNavigation

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/20">
      {/* Mobile Sidebar */}
      <MobileSidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={isTrainer ? 'TRAINER' : 'CLIENT'}
      />

      {/* Desktop Sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-72 lg:flex lg:flex-col`}>
        <div className="bg-white shadow-xl border-r border-gray-200/50 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
            <div className="p-2 bg-gradient-to-br from-primary to-blue-600 rounded-xl">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">Kairos</span>
              {isTrainer && (
                <Badge variant="secondary" className="text-xs ml-2">PRO</Badge>
              )}
            </div>
          </div>

          {/* User info */}
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-blue-50">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white font-semibold">
                  {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {session?.user?.name}
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
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <SidebarItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                badge={(item as any).badge}
                isActive={false} // TODO: Implementar lógica de ruta activa
              />
            ))}

            {/* Separator */}
            <div className="py-4">
              <div className="border-t border-gray-200" />
            </div>

            {/* Notifications */}
            <div className="px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Notificaciones</span>
              </div>
              <NotificationSystem className="w-full" />
            </div>
            
            <div className="py-2">
              <div className="border-t border-gray-200" />
            </div>
            
            {/* Language Selector */}
            <div className="px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Idioma</span>
              </div>
              <LanguageSelector />
            </div>
            
            <div className="py-2">
              <div className="border-t border-gray-200" />
            </div>
            
            {/* Settings & Logout */}
            <SidebarItem
              href="/dashboard/settings"
              icon={<Settings size={20} />}
              label="Configuración"
            />
            
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              <span>Cerrar Sesión</span>
            </button>
          </nav>
        </div>

        {/* Upgrade CTA for free users */}
        {!isTrainer && (
          <div className="p-4 border-t">
            <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white">
              <h4 className="text-sm font-semibold mb-1">Upgrade a Pro</h4>
              <p className="text-xs opacity-90 mb-3">
                Desbloquea rutinas ilimitadas y análisis avanzado
              </p>
              <Button 
                size="sm" 
                className="w-full bg-white text-green-600 hover:bg-gray-100"
                onClick={() => router.push('/dashboard/billing')}
              >
                Ver Planes
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Mobile header */}
        <header className="lg:hidden bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors touch-target"
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-primary to-blue-600 rounded-lg">
                <Dumbbell className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">Kairos</span>
              {isTrainer && (
                <Badge variant="secondary" className="text-xs">PRO</Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <NotificationSystem className="" />
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white text-xs font-semibold">
                  {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-screen pb-20 lg:pb-8">
          <div className="mobile-padding py-4 lg:py-6">
            {children}
          </div>
        </main>
        
        {/* Bottom Navigation - Only visible on mobile */}
        <div className="lg:hidden">
          <BottomNavigation userRole={isTrainer ? 'TRAINER' : 'CLIENT'} />
        </div>
      </div>
    </div>
  )
}