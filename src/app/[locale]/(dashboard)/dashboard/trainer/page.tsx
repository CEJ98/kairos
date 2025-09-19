'use client'

import { useState, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { LoadingSpinner } from '@/components/ui/lazy-loader'
import { lazy } from 'react'
import { useTranslations } from 'next-intl'

// Lazy components con imports estáticos
const TrainerAnalytics = lazy(() => import('@/components/analytics/advanced-analytics'))
const ClientsList = lazy(() => import('@/components/trainer/clients-list'))
const RevenueChart = lazy(() => import('@/components/trainer/revenue-chart'))
import { 
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Plus,
  MessageSquare,
  Target,
  Clock,
  Star,
  MoreVertical,
  Send,
  Eye,
  UserPlus,
  Trophy,
  Activity
} from 'lucide-react'
import Link from 'next/link'

// Los componentes lazy ya están definidos arriba

export default function TrainerDashboard() {
	const t = useTranslations('trainer')
	const tCommon = useTranslations('common')
	const tStatus = useTranslations('status')
	const tSubscription = useTranslations('subscription')
	const tActions = useTranslations('actions')
	const [selectedTimeframe, setSelectedTimeframe] = useState('week')

  // Mock data - en producción vendría de APIs
  const stats = {
    totalClients: 42,
    activeClients: 38,
    newClientsThisMonth: 8,
    monthlyRevenue: 2450.00,
    avgSessionRating: 4.8,
    completedWorkouts: 156,
    upcomingAppointments: 12
  }

  const recentClients = [
    {
      id: '1',
      name: 'María García',
      email: 'maria@email.com',
      avatar: 'MG',
      joinDate: '2024-01-15',
      subscription: 'Pro',
      lastWorkout: '2024-01-20',
      streak: 5,
      progress: 85,
      nextSession: 'Hoy, 6:00 PM'
    },
    {
      id: '2', 
      name: 'Carlos López',
      email: 'carlos@email.com',
      avatar: 'CL',
      joinDate: '2024-01-10',
      subscription: 'Basic',
      lastWorkout: '2024-01-19',
      streak: 3,
      progress: 72,
      nextSession: 'Mañana, 8:00 AM'
    },
    {
      id: '3',
      name: 'Ana Rodríguez',
      email: 'ana@email.com',
      avatar: 'AR',
      joinDate: '2024-01-08',
      subscription: 'Pro',
      lastWorkout: '2024-01-20',
      streak: 12,
      progress: 95,
      nextSession: 'Miércoles, 5:00 PM'
    }
  ]

  const recentActivity = [
    {
      id: '1',
      type: 'workout_completed',
      client: 'María García',
      action: 'completó Full Body Strength',
      time: 'hace 2 horas',
      rating: 5
    },
    {
      id: '2',
      type: 'new_client',
      client: 'Pedro Martínez',
      action: 'se unió como cliente',
      time: 'hace 4 horas',
      subscription: 'Pro'
    },
    {
      id: '3',
      type: 'message',
      client: 'Carlos López',
      action: 'envió un mensaje',
      time: 'hace 6 horas',
      preview: '¿Podemos cambiar la sesión de mañana?'
    },
    {
      id: '4',
      type: 'milestone',
      client: 'Ana Rodríguez',
      action: 'alcanzó 10 días de racha',
      time: 'hace 1 día'
    }
  ]

  const upcomingSessions = [
    {
      id: '1',
      client: 'María García',
      type: 'Personal Training',
      time: 'Hoy, 6:00 PM',
      duration: 60,
      location: 'Gimnasio Central'
    },
    {
      id: '2',
      client: 'Carlos López',
      type: 'Assessment',
      time: 'Mañana, 8:00 AM',
      duration: 45,
      location: 'Online'
    },
    {
      id: '3',
      client: 'Ana Rodríguez',
      type: 'Follow-up',
      time: 'Miércoles, 5:00 PM',
      duration: 30,
      location: 'Gimnasio Central'
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'workout_completed': return <Trophy className="h-4 w-4 text-green-600" />
      case 'new_client': return <UserPlus className="h-4 w-4 text-blue-600" />
      case 'message': return <MessageSquare className="h-4 w-4 text-purple-600" />
      case 'milestone': return <Target className="h-4 w-4 text-orange-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboard')}</h1>
        <p className="text-gray-600 mt-2">
          {t('dashboardDescription')}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('totalClients')}</p>
							<p className="text-3xl font-bold text-gray-900">{stats.totalClients}</p>
							<p className="text-sm text-green-600">+{stats.newClientsThisMonth} {t('thisMonth')}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('monthlyRevenue')}</p>
							<p className="text-3xl font-bold text-gray-900">${stats.monthlyRevenue.toLocaleString()}</p>
							<p className="text-sm text-green-600">+12% {t('vsPreviousMonth')}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('averageRating')}</p>
                <p className="text-3xl font-bold text-gray-900">{stats.avgSessionRating}</p>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="h-3 w-3 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('workouts')}</p>
							<p className="text-3xl font-bold text-gray-900">{stats.completedWorkouts}</p>
							<p className="text-sm text-purple-600">{t('thisMonth')}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('quickActions')}</CardTitle>
          <CardDescription>
            {t('quickActionsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/trainer/clients/new">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <UserPlus className="h-6 w-6" />
                <span className="text-sm">{tCommon('new')} {t('client')}</span>
              </Button>
            </Link>

            <Link href="/dashboard/trainer/workouts/new">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Plus className="h-6 w-6" />
                <span className="text-sm">{tCommon('new')} {t('routine')}</span>
              </Button>
            </Link>

            <Link href="/dashboard/trainer/calendar">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Calendar className="h-6 w-6" />
                <span className="text-sm">{tActions('schedule')} {t('session')}</span>
              </Button>
            </Link>

            <Link href="/dashboard/trainer/billing">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <DollarSign className="h-6 w-6" />
                <span className="text-sm">{tCommon('view')} {t('billing')}</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Clients */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                {t('recentClients')}
              </CardTitle>
              <Link href="/dashboard/trainer/clients">
                <Button variant="ghost" size="sm">
                  {tCommon('view')} {tCommon('all')}
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentClients.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {client.avatar}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{client.name}</h4>
                    <p className="text-sm text-gray-600">{client.nextSession}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={client.subscription === 'Pro' ? 'default' : 'secondary'} className="text-xs">
                        {client.subscription}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Racha: {client.streak} días
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-sm font-medium">{client.progress}%</div>
                    <Progress value={client.progress} className="w-16 h-2" />
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                {t('upcomingSessions')}
              </CardTitle>
              <Link href="/dashboard/trainer/calendar">
                <Button variant="ghost" size="sm">
                  {tCommon('view')} {t('calendar')}
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{session.client}</h4>
                    <Badge variant="outline" className="text-xs">
                      {session.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{session.time}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {session.duration} min
                    </span>
                    <span>{session.location}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.client}</span>{' '}
                    <span className="text-gray-600">{activity.action}</span>
                  </p>
                  {activity.preview && (
                    <p className="text-sm text-gray-500 mt-1">&quot;{activity.preview}&quot;</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
                <div className="flex items-center gap-2">
                  {activity.rating && (
                    <div className="flex items-center gap-1">
                      {[...Array(activity.rating)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  )}
                  {activity.subscription && (
                    <Badge variant="outline" className="text-xs">
                      {activity.subscription}
                    </Badge>
                  )}
                  {activity.type === 'message' && (
                    <Button size="sm" variant="outline">
                      <Send className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Resumen de Rendimiento
            </CardTitle>
            <div className="flex gap-2">
              {['week', 'month', 'year'].map((timeframe) => (
                <Button
                  key={timeframe}
                  variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeframe(timeframe)}
                >
                  {timeframe === 'week' ? 'Semana' : timeframe === 'month' ? 'Mes' : 'Año'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">96%</div>
              <div className="text-sm text-gray-600">Tasa de retención</div>
              <div className="text-xs text-blue-600 mt-1">+2% vs período anterior</div>
            </div>
            
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">4.8</div>
              <div className="text-sm text-gray-600">Rating promedio</div>
              <div className="text-xs text-green-600 mt-1">Excelente</div>
            </div>
            
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">24</div>
              <div className="text-sm text-gray-600">Nuevas referencias</div>
              <div className="text-xs text-purple-600 mt-1">Este mes</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}