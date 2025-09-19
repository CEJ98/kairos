'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Search,
  Filter,
  UserPlus,
  MoreVertical,
  MessageSquare,
  Calendar,
  TrendingUp,
  Target,
  Trophy,
  Clock,
  Mail,
  Phone,
  MapPin,
  Edit,
  Eye,
  Send
} from 'lucide-react'
import Link from 'next/link'
import { useChat } from '@/hooks/use-chat'
import { toast } from 'sonner'

export default function TrainerClientsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const { startConversation } = useChat()

  // Función para iniciar chat con un cliente
  const handleStartChat = async (clientId: string, clientName: string) => {
    try {
      await startConversation(clientId)
      toast.success(`Chat iniciado con ${clientName}`)
    } catch (error) {
      toast.error('Error al iniciar el chat')
    }
  }

  // Mock clients data
  const clients = [
    {
      id: '1',
      name: 'María García',
      email: 'maria@email.com',
      phone: '+1 305 123 4567',
      avatar: 'MG',
      age: 28,
      joinDate: '2024-01-15',
      subscription: 'Pro',
      status: 'active',
      lastWorkout: '2024-01-20',
      totalWorkouts: 24,
      streak: 5,
      progress: 85,
      goals: ['Pérdida de peso', 'Tono muscular'],
      nextSession: 'Hoy, 6:00 PM',
      location: 'Miami, FL',
      monthlyRevenue: 199,
      satisfaction: 5,
      notes: 'Muy motivada, prefiere entrenamientos matutinos'
    },
    {
      id: '2',
      name: 'Carlos López',
      email: 'carlos@email.com',
      phone: '+1 305 987 6543',
      avatar: 'CL',
      age: 35,
      joinDate: '2024-01-10',
      subscription: 'Basic',
      status: 'active',
      lastWorkout: '2024-01-19',
      totalWorkouts: 18,
      streak: 3,
      progress: 72,
      goals: ['Ganancia muscular', 'Fuerza'],
      nextSession: 'Mañana, 8:00 AM',
      location: 'Miami, FL',
      monthlyRevenue: 99,
      satisfaction: 4,
      notes: 'Buen progreso en compound lifts'
    },
    {
      id: '3',
      name: 'Ana Rodríguez',
      email: 'ana@email.com',
      phone: '+1 305 555 0123',
      avatar: 'AR',
      age: 42,
      joinDate: '2024-01-08',
      subscription: 'Pro',
      status: 'active',
      lastWorkout: '2024-01-20',
      totalWorkouts: 36,
      streak: 12,
      progress: 95,
      goals: ['Resistencia', 'Salud general'],
      nextSession: 'Miércoles, 5:00 PM',
      location: 'Miami Beach, FL',
      monthlyRevenue: 199,
      satisfaction: 5,
      notes: 'Cliente ejemplar, siempre puntual'
    },
    {
      id: '4',
      name: 'David Chen',
      email: 'david@email.com',
      phone: '+1 305 444 5678',
      avatar: 'DC',
      age: 29,
      joinDate: '2024-01-05',
      subscription: 'Enterprise',
      status: 'inactive',
      lastWorkout: '2024-01-12',
      totalWorkouts: 8,
      streak: 0,
      progress: 45,
      goals: ['Pérdida de peso'],
      nextSession: null,
      location: 'Coral Gables, FL',
      monthlyRevenue: 299,
      satisfaction: 3,
      notes: 'Necesita más motivación, horarios flexibles'
    }
  ]

  const filters = [
    { value: 'all', label: 'Todos', count: clients.length },
    { value: 'active', label: 'Activos', count: clients.filter(c => c.status === 'active').length },
    { value: 'inactive', label: 'Inactivos', count: clients.filter(c => c.status === 'inactive').length },
    { value: 'pro', label: 'Pro', count: clients.filter(c => c.subscription === 'Pro').length },
    { value: 'new', label: 'Nuevos', count: clients.filter(c => {
      const joinDate = new Date(c.joinDate)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return joinDate > thirtyDaysAgo
    }).length }
  ]

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesFilter = true
    switch (selectedFilter) {
      case 'active':
        matchesFilter = client.status === 'active'
        break
      case 'inactive':
        matchesFilter = client.status === 'inactive'
        break
      case 'pro':
        matchesFilter = client.subscription === 'Pro'
        break
      case 'new':
        const joinDate = new Date(client.joinDate)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        matchesFilter = joinDate > thirtyDaysAgo
        break
    }

    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'inactive': return 'destructive'
      default: return 'secondary'
    }
  }

  const getSubscriptionColor = (subscription: string) => {
    switch (subscription) {
      case 'Pro': return 'default'
      case 'Enterprise': return 'warning'
      case 'Basic': return 'secondary'
      default: return 'outline'
    }
  }

  const totalRevenue = filteredClients.reduce((acc, client) => acc + client.monthlyRevenue, 0)
  const avgSatisfaction = filteredClients.reduce((acc, client) => acc + client.satisfaction, 0) / filteredClients.length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
          <p className="text-gray-600 mt-1">
            Administra tu cartera de {clients.length} clientes
          </p>
        </div>
        <Link href="/dashboard/trainer/clients/new">
          <Button variant="gradient" size="lg">
            <UserPlus className="h-5 w-5 mr-2" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{filteredClients.length}</div>
            <p className="text-sm text-gray-600">Clientes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">${totalRevenue}</div>
            <p className="text-sm text-gray-600">Ingresos mensuales</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600">{avgSatisfaction.toFixed(1)}</div>
            <p className="text-sm text-gray-600">Satisfacción promedio</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">
              {Math.round(filteredClients.reduce((acc, c) => acc + c.progress, 0) / filteredClients.length)}%
            </div>
            <p className="text-sm text-gray-600">Progreso promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar clientes por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto">
              {filters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={selectedFilter === filter.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter(filter.value)}
                  className="whitespace-nowrap"
                >
                  {filter.label} ({filter.count})
                </Button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                Lista
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {client.avatar}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {client.age} años • {client.location}
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Badge variant={getStatusColor(client.status)} className="text-xs">
                    {client.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Badge>
                  <Badge variant={getSubscriptionColor(client.subscription)} className="text-xs">
                    {client.subscription}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progreso general</span>
                    <span>{client.progress}%</span>
                  </div>
                  <Progress value={client.progress} className="h-2" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span>{client.totalWorkouts} entrenamientos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-orange-500" />
                    <span>{client.streak} días racha</span>
                  </div>
                </div>

                {/* Goals */}
                <div>
                  <p className="text-sm font-medium mb-1">Objetivos:</p>
                  <div className="flex flex-wrap gap-1">
                    {client.goals.map((goal, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Next Session */}
                {client.nextSession && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Próxima sesión:</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">{client.nextSession}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/dashboard/trainer/clients/${client.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleStartChat(client.id, client.name)}
                    title={`Chatear con ${client.name}`}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>

                {/* Revenue */}
                <div className="pt-2 border-t text-center">
                  <span className="text-sm text-gray-600">Ingresos mensual: </span>
                  <span className="font-semibold text-green-600">${client.monthlyRevenue}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredClients.map((client) => (
                <div key={client.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {client.avatar}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg">{client.name}</h3>
                          <Badge variant={getStatusColor(client.status)} className="text-xs">
                            {client.status === 'active' ? 'Activo' : 'Inactivo'}
                          </Badge>
                          <Badge variant={getSubscriptionColor(client.subscription)} className="text-xs">
                            {client.subscription}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {client.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {client.location}
                          </span>
                          {client.nextSession && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {client.nextSession}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-6 mt-2 text-sm">
                          <span>{client.totalWorkouts} entrenamientos</span>
                          <span>Racha: {client.streak} días</span>
                          <span>Progreso: {client.progress}%</span>
                          <span className="text-green-600 font-semibold">${client.monthlyRevenue}/mes</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/trainer/clients/${client.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Perfil
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStartChat(client.id, client.name)}
                        title={`Chatear con ${client.name}`}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredClients.length === 0 && (
        <Card>
          <CardContent className="text-center py-16">
            <UserPlus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No se encontraron clientes
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedFilter !== 'all' 
                ? 'Intenta ajustar tus filtros de búsqueda'
                : 'Comienza agregando tu primer cliente'
              }
            </p>
            <Link href="/dashboard/trainer/clients/new">
              <Button variant="gradient">
                <UserPlus className="h-5 w-5 mr-2" />
                Agregar Primer Cliente
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}