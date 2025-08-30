'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { 
	Users, Search, Filter, MoreVertical, MessageSquare, 
	Calendar, Trophy, TrendingUp, Clock, Star
} from 'lucide-react'
import Link from 'next/link'

interface Client {
	id: string
	name: string
	email: string
	avatar?: string
	joinDate: string
	subscription: 'Basic' | 'Pro' | 'Premium'
	lastWorkout: string
	streak: number
	progress: number
	status: 'active' | 'inactive' | 'paused'
	nextSession?: string
	rating: number
}

interface ClientsListProps {
	clients?: Client[]
	showSearch?: boolean
	maxItems?: number
}

const defaultClients: Client[] = [
	{
		id: '1',
		name: 'María García',
		email: 'maria@email.com',
		joinDate: '2024-01-15',
		subscription: 'Pro',
		lastWorkout: '2024-01-20',
		streak: 5,
		progress: 78,
		status: 'active',
		nextSession: '2024-01-22 10:00',
		rating: 4.8
	},
	{
		id: '2',
		name: 'Carlos López',
		email: 'carlos@email.com',
		joinDate: '2024-01-10',
		subscription: 'Premium',
		lastWorkout: '2024-01-19',
		streak: 12,
		progress: 92,
		status: 'active',
		nextSession: '2024-01-21 15:30',
		rating: 5.0
	},
	{
		id: '3',
		name: 'Ana Martínez',
		email: 'ana@email.com',
		joinDate: '2024-01-08',
		subscription: 'Basic',
		lastWorkout: '2024-01-18',
		streak: 3,
		progress: 45,
		status: 'active',
		rating: 4.5
	},
	{
		id: '4',
		name: 'Pedro Rodríguez',
		email: 'pedro@email.com',
		joinDate: '2024-01-05',
		subscription: 'Pro',
		lastWorkout: '2024-01-15',
		streak: 0,
		progress: 23,
		status: 'inactive',
		rating: 4.2
	}
]

export default function ClientsList({ 
	clients = defaultClients, 
	showSearch = true, 
	maxItems 
}: ClientsListProps) {
	const [searchTerm, setSearchTerm] = useState('')
	const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

	const filteredClients = clients
		.filter(client => {
			const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				client.email.toLowerCase().includes(searchTerm.toLowerCase())
			const matchesFilter = filterStatus === 'all' || client.status === filterStatus
			return matchesSearch && matchesFilter
		})
		.slice(0, maxItems)

	const getSubscriptionColor = (subscription: Client['subscription']) => {
		switch (subscription) {
			case 'Basic':
				return 'bg-gray-100 text-gray-700'
			case 'Pro':
				return 'bg-blue-100 text-blue-700'
			case 'Premium':
				return 'bg-purple-100 text-purple-700'
			default:
				return 'bg-gray-100 text-gray-700'
		}
	}

	const getStatusColor = (status: Client['status']) => {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-700'
			case 'inactive':
				return 'bg-red-100 text-red-700'
			case 'paused':
				return 'bg-yellow-100 text-yellow-700'
			default:
				return 'bg-gray-100 text-gray-700'
		}
	}

	const getInitials = (name: string) => {
		return name.split(' ').map(n => n[0]).join('').toUpperCase()
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<Users className="h-5 w-5 text-primary" />
						Clientes ({filteredClients.length})
					</CardTitle>
					{!maxItems && (
						<Button variant="outline" size="sm" asChild>
							<Link href="/dashboard/trainer/clients">
								Ver todos
							</Link>
						</Button>
					)}
				</div>
				
				{showSearch && (
					<div className="flex gap-2 mt-4">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Buscar clientes..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setFilterStatus(filterStatus === 'all' ? 'active' : filterStatus === 'active' ? 'inactive' : 'all')}
						>
							<Filter className="h-4 w-4 mr-1" />
							{filterStatus === 'all' ? 'Todos' : filterStatus === 'active' ? 'Activos' : 'Inactivos'}
						</Button>
					</div>
				)}
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{filteredClients.map((client) => (
						<div key={client.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
							<Avatar className="h-12 w-12">
								<AvatarImage src={client.avatar} alt={client.name} />
								<AvatarFallback>{getInitials(client.name)}</AvatarFallback>
							</Avatar>
							
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-1">
									<h3 className="font-semibold text-sm">{client.name}</h3>
									<Badge className={`text-xs ${getSubscriptionColor(client.subscription)}`}>
										{client.subscription}
									</Badge>
									<Badge className={`text-xs ${getStatusColor(client.status)}`}>
										{client.status === 'active' ? 'Activo' : client.status === 'inactive' ? 'Inactivo' : 'Pausado'}
									</Badge>
								</div>
								<p className="text-xs text-muted-foreground mb-2">{client.email}</p>
								
								<div className="flex items-center gap-4 text-xs text-muted-foreground">
									<div className="flex items-center gap-1">
										<Trophy className="h-3 w-3" />
										{client.streak} días
									</div>
									<div className="flex items-center gap-1">
										<Star className="h-3 w-3" />
										{client.rating}
									</div>
									{client.nextSession && (
										<div className="flex items-center gap-1">
											<Calendar className="h-3 w-3" />
											Próxima: {new Date(client.nextSession).toLocaleDateString()}
										</div>
									)}
								</div>
								
								<div className="mt-2">
									<div className="flex items-center justify-between text-xs mb-1">
										<span className="text-muted-foreground">Progreso</span>
										<span className="font-medium">{client.progress}%</span>
									</div>
									<Progress value={client.progress} className="h-1" />
								</div>
							</div>
							
							<div className="flex flex-col gap-2">
								<Button variant="outline" size="sm" asChild>
									<Link href={`/dashboard/trainer/clients/${client.id}`}>
										Ver perfil
									</Link>
								</Button>
								<Button variant="ghost" size="sm">
									<MessageSquare className="h-4 w-4" />
								</Button>
							</div>
						</div>
					))}
					
					{filteredClients.length === 0 && (
						<div className="text-center py-8 text-muted-foreground">
							<Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
							<p>No se encontraron clientes</p>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	)
}