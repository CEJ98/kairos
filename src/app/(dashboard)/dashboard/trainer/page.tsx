'use client'

import React, { useState, Suspense, lazy } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTrainerMetrics, formatters } from '@/hooks/use-trainer-metrics'
import { useTrainerAnalytics } from '@/hooks/use-trainer-analytics'

// Lazy load components for better performance
// Removed lazy import for trainer-analytics as we're using the hook directly
const ClientsList = lazy(() => import('@/components/trainer/clients-list'))
const RevenueChart = lazy(() => import('@/components/trainer/revenue-chart'))
import { 
  Users, 
  DollarSign, 
  Star, 
  Activity, 
  Calendar, 
  Plus, 
  UserPlus, 
  ClipboardList, 
  CreditCard,
  TrendingUp,
  Clock,
  Target,
  Award,
  RefreshCw,
  Loader2,
  MessageSquare,
  MoreVertical,
  Send,
  Eye,
  Trophy
} from 'lucide-react'
import Link from 'next/link'

export default function TrainerDashboardPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('week')
  const { data, loading, error, refresh } = useTrainerMetrics(10)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando métricas del trainer...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refresh} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { metrics, clients, recentActivity } = data

  // Datos reales obtenidos del hook useTrainerMetrics



  // Las próximas sesiones se obtienen de metrics?.upcomingAppointments

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel del Trainer</h1>
          <p className="text-muted-foreground">Gestiona tus clientes y monitorea su progreso</p>
        </div>
        <Button onClick={refresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clientes Totales</p>
                <p className="text-3xl font-bold text-gray-900">{metrics?.totalClients || 0}</p>
                <p className="text-sm text-green-600">+{metrics?.newClientsThisMonth || 0} este mes</p>
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
                <p className="text-sm text-gray-600">Ingresos del Mes</p>
                <p className="text-3xl font-bold text-gray-900">{formatters.currency(metrics?.monthlyRevenue || 0)}</p>
                <p className="text-sm text-green-600">{metrics?.activeClients || 0} clientes activos</p>
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
                <p className="text-sm text-gray-600">Rating Promedio</p>
                <p className="text-3xl font-bold text-gray-900">{formatters.rating(metrics?.avgSessionRating || 0)}</p>
                <p className="text-sm text-yellow-600">Adherencia: {formatters.percentage(metrics?.adherenceRate || 0)}</p>
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
                <p className="text-sm text-gray-600">Entrenamientos Completados</p>
                <p className="text-3xl font-bold text-gray-900">{metrics?.completedWorkouts || 0}</p>
                <p className="text-sm text-purple-600">{metrics?.upcomingAppointments || 0} próximas citas</p>
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
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Accesos directos a las funciones más utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/trainer/clients/new">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <UserPlus className="h-6 w-6" />
                <span className="text-sm">Nuevo Cliente</span>
              </Button>
            </Link>

            <Link href="/dashboard/trainer/workouts/new">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Plus className="h-6 w-6" />
                <span className="text-sm">Nueva Rutina</span>
              </Button>
            </Link>

            <Link href="/dashboard/trainer/calendar">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Calendar className="h-6 w-6" />
                <span className="text-sm">Programar Sesión</span>
              </Button>
            </Link>

            <Link href="/dashboard/trainer/billing">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <DollarSign className="h-6 w-6" />
                <span className="text-sm">Ver Facturación</span>
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
                Clientes Activos
                <Badge variant="secondary">{clients?.length || 0}</Badge>
              </CardTitle>
              <Link href="/dashboard/trainer/clients">
                <Button variant="ghost" size="sm">
                  Ver todos
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {clients?.length ? clients.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={client.avatar} alt={client.name} />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {client.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-gray-900">{client.name}</h4>
                    <p className="text-sm text-gray-600">
                      {client.lastWorkout ? formatters.timeAgo(client.lastWorkout) : 'Sin entrenamientos'}
                    </p>
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
                    <div className="text-sm font-medium">{formatters.percentage(client.adherenceRate)}</div>
                        <Progress value={client.adherenceRate} className="w-16 h-2" />
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hay clientes activos</p>
                <Button className="mt-4" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Agregar Cliente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                Próximas Sesiones
                <Badge variant="secondary">{metrics?.upcomingAppointments || 0}</Badge>
              </CardTitle>
              <Link href="/dashboard/trainer/calendar">
                <Button variant="ghost" size="sm">
                  Ver calendario
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics?.upcomingAppointments ? (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">Sesiones programadas</h4>
                  </div>
                  <p className="text-sm text-gray-600">{metrics.upcomingAppointments} citas pendientes</p>
                </div>
                <div className="flex gap-2">
                  <Link href="/dashboard/trainer/calendar">
                    <Button size="sm" variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      Ver Calendario
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hay sesiones programadas</p>
                <Link href="/dashboard/trainer/calendar">
                  <Button className="mt-4" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Programar Sesión
                  </Button>
                </Link>
              </div>
            )}
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
            {recentActivity?.length ? recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                   <div className={`p-2 rounded-full ${
                     activity.type === 'workout_completed' ? 'bg-green-100' :
                     activity.type === 'new_client' ? 'bg-purple-100' :
                     activity.type === 'message' ? 'bg-blue-100' :
                     'bg-gray-100'
                   }`}>
                     {activity.type === 'workout_completed' && <Activity className="h-4 w-4 text-green-600" />}
                     {activity.type === 'new_client' && <UserPlus className="h-4 w-4 text-purple-600" />}
                     {activity.type === 'message' && <MessageSquare className="h-4 w-4 text-blue-600" />}
                     {activity.type === 'milestone' && <Trophy className="h-4 w-4 text-yellow-600" />}
                     {activity.type === 'missed_session' && <Clock className="h-4 w-4 text-red-600" />}
                   </div>
                 </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.clientName}</span>{' '}
                    <span className="text-gray-600">{activity.description}</span>
                  </p>
                  {activity.metadata?.workoutName && (
                    <p className="text-sm text-gray-500 mt-1">&quot;{activity.metadata.workoutName}&quot;</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{activity.timestamp ? formatters.timeAgo(activity.timestamp) : activity.time}</p>
                </div>
                <div className="flex items-center gap-2">
                  {activity.metadata?.rating && (
                    <div className="flex items-center gap-1">
                      {[...Array(activity.metadata.rating)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  )}
                  {activity.metadata?.subscription && (
                    <Badge variant="outline" className="text-xs">
                      {activity.metadata.subscription}
                    </Badge>
                  )}
                  {activity.type === 'message' && (
                    <Button size="sm" variant="outline">
                      <Send className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hay actividad reciente</p>
              </div>
            )}
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