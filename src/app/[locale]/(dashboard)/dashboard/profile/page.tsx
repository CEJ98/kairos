'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
	User, 
	Mail, 
	Phone, 
	MapPin, 
	Calendar, 
	Ruler, 
	Weight, 
	Target, 
	Activity, 
	Save, 
	Loader2,
	Edit,
	Camera,
	Shield
} from 'lucide-react'
import { logger } from '@/lib/logger'

interface UserProfile {
	id: string
	name: string
	email: string
	avatar?: string
	role: string
	createdAt: string
	clientProfile?: {
		age?: number
		weight?: number
		height?: number
		gender?: string
		fitnessGoal?: string
		activityLevel?: string
		trainer?: {
			user: {
				id: string
				name: string
				email: string
			}
		}
	}
	trainerProfile?: {
		bio?: string
		experience?: number
		specialties?: string
		hourlyRate?: number
		maxClients?: number
	}
	subscriptions?: {
		plan: string
		status: string
		createdAt: string
	}[]
}

export default function ProfilePage() {
	const { data: session } = useSession()
	const [profile, setProfile] = useState<UserProfile | null>(null)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [editMode, setEditMode] = useState(false)
	const [formData, setFormData] = useState({
		name: '',
		age: '',
		weight: '',
		height: '',
		gender: '',
		fitnessGoal: '',
		activityLevel: '',
		bio: '',
		experience: '',
		specialties: '',
		hourlyRate: ''
	})

	useEffect(() => {
		fetchProfile()
	}, [])

	const fetchProfile = async () => {
		try {
			const response = await fetch('/api/users/profile')
			if (!response.ok) throw new Error('Error al cargar perfil')
			
			const data = await response.json()
			setProfile(data)
			
			// Inicializar formulario con datos existentes
			setFormData({
				name: data.name || '',
				age: data.clientProfile?.age?.toString() || '',
				weight: data.clientProfile?.weight?.toString() || '',
				height: data.clientProfile?.height?.toString() || '',
				gender: data.clientProfile?.gender || '',
				fitnessGoal: data.clientProfile?.fitnessGoal || '',
				activityLevel: data.clientProfile?.activityLevel || '',
				bio: data.trainerProfile?.bio || '',
				experience: data.trainerProfile?.experience?.toString() || '',
				specialties: data.trainerProfile?.specialties || '',
				hourlyRate: data.trainerProfile?.hourlyRate?.toString() || ''
			})
		} catch (error) {
			logger.error('Error fetching profile:', error)
			toast.error('Error al cargar el perfil')
		} finally {
			setLoading(false)
		}
	}

	const handleSave = async () => {
		setSaving(true)
		try {
			const payload: any = {
				name: formData.name
			}

			// Agregar datos específicos según el rol
			if (profile?.role === 'CLIENT') {
				payload.age = formData.age ? parseInt(formData.age) : undefined
				payload.weight = formData.weight ? parseFloat(formData.weight) : undefined
				payload.height = formData.height ? parseFloat(formData.height) : undefined
				payload.gender = formData.gender
				payload.fitnessGoal = formData.fitnessGoal
				payload.activityLevel = formData.activityLevel
			} else if (profile?.role === 'TRAINER') {
				payload.bio = formData.bio
				payload.experience = formData.experience ? parseInt(formData.experience) : undefined
				payload.specialties = formData.specialties
				payload.hourlyRate = formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined
			}

			const response = await fetch('/api/users/profile', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			})

			if (!response.ok) throw new Error('Error al actualizar perfil')

			toast.success('Perfil actualizado exitosamente')
			setEditMode(false)
			await fetchProfile()
		} catch (error) {
			logger.error('Error updating profile:', error)
			toast.error('Error al actualizar el perfil')
		} finally {
			setSaving(false)
		}
	}

	const getUserInitials = (name?: string) => {
		if (!name) return 'U'
		return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
	}

	const getRoleBadge = (role: string) => {
		const roleConfig = {
			CLIENT: { label: 'Cliente', color: 'bg-blue-100 text-blue-800' },
			TRAINER: { label: 'Entrenador', color: 'bg-green-100 text-green-800' },
			ADMIN: { label: 'Administrador', color: 'bg-purple-100 text-purple-800' }
		}
		return roleConfig[role as keyof typeof roleConfig] || { label: role, color: 'bg-gray-100 text-gray-800' }
	}

	if (loading) {
		return (
			<div className="min-h-screen-mobile md:min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center mobile-spacing">
				<div className="flex items-center mobile-gap">
					<Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin text-blue-600" />
					<span className="responsive-body text-gray-600 dark:text-gray-400">Cargando perfil...</span>
				</div>
			</div>
		)
	}

	if (!profile) {
		return (
			<div className="min-h-screen-mobile md:min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center mobile-spacing">
				<div className="text-center mobile-spacing">
					<p className="responsive-body text-red-600 mb-4">Error al cargar el perfil</p>
					<Button onClick={fetchProfile} variant="outline" className="mobile-button">
						Reintentar
					</Button>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen-mobile md:min-h-screen bg-gray-50 dark:bg-gray-950 mobile-spacing">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mobile-gap mb-6">
				<div className="min-w-0">
					<h1 className="responsive-heading font-bold text-gray-900 dark:text-gray-100">Mi Perfil</h1>
					<p className="responsive-body text-gray-600 dark:text-gray-400 mt-1">Gestiona tu información personal y preferencias</p>
				</div>
				<div className="flex mobile-gap-x">
					{editMode ? (
						<>
							<Button 
								variant="outline" 
								onClick={() => setEditMode(false)}
								disabled={saving}
								className="mobile-button-sm responsive-body"
							>
								Cancelar
							</Button>
							<Button 
								onClick={handleSave}
								disabled={saving}
								className="mobile-button responsive-body"
							>
								{saving ? (
									<Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
								) : (
									<Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
								)}
								<span className="responsive-body">Guardar Cambios</span>
							</Button>
						</>
					) : (
						<Button onClick={() => setEditMode(true)} className="mobile-button responsive-body">
							<Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
							<span className="responsive-body">Editar Perfil</span>
						</Button>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 mobile-gap">
				{/* Información Básica */}
				<div className="lg:col-span-1">
					<Card className="mobile-card">
						<CardHeader className="text-center mobile-spacing-x">
							<div className="relative mx-auto">
								<Avatar className="w-20 h-20 sm:w-24 sm:h-24 mx-auto">
									<AvatarImage src={profile.avatar || "/fitness-user-avatar.png"} alt={profile.name} />
									<AvatarFallback className="responsive-subheading">{getUserInitials(profile.name)}</AvatarFallback>
								</Avatar>
								<Button 
									size="sm" 
									variant="outline" 
									className="absolute -bottom-2 -right-2 rounded-full w-7 h-7 sm:w-8 sm:h-8 p-0 touch-target"
								>
									<Camera className="w-3 h-3 sm:w-4 sm:h-4" />
								</Button>
							</div>
							<CardTitle className="responsive-title mt-4">{profile.name}</CardTitle>
							<CardDescription className="flex items-center justify-center mobile-gap responsive-caption">
								<Mail className="w-3 h-3 sm:w-4 sm:h-4" />
								{profile.email}
							</CardDescription>
						</CardHeader>
						<CardContent className="mobile-spacing">
							<div className="flex items-center justify-center">
								<Badge className={getRoleBadge(profile.role).color}>
									<Shield className="w-3 h-3 mr-1" />
									<span className="responsive-caption">{getRoleBadge(profile.role).label}</span>
								</Badge>
							</div>
							<Separator className="my-4" />
							<div className="responsive-caption text-gray-600 dark:text-gray-400 text-center">
								<div className="flex items-center justify-center mobile-gap mb-1">
									<Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
									Miembro desde
								</div>
								{new Date(profile.createdAt).toLocaleDateString('es-ES', {
									year: 'numeric',
									month: 'long',
									day: 'numeric'
								})}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Información Detallada */}
				<div className="lg:col-span-2 mobile-gap-y">
					{/* Información Personal */}
					<Card className="mobile-card">
						<CardHeader className="mobile-spacing-x">
							<CardTitle className="responsive-subheading">Información Personal</CardTitle>
							<CardDescription className="responsive-caption">
								Actualiza tu información básica
							</CardDescription>
						</CardHeader>
						<CardContent className="mobile-spacing">
							<div className="grid grid-cols-1 md:grid-cols-2 mobile-gap">
								<div>
									<Label htmlFor="name" className="responsive-body">Nombre completo</Label>
									<Input
										id="name"
										value={editMode ? formData.name : profile.name}
										onChange={(e) => setFormData({...formData, name: e.target.value})}
										disabled={!editMode}
										className="mobile-input responsive-body"
									/>
								</div>
								<div>
									<Label htmlFor="email" className="responsive-body">Email</Label>
									<Input
										id="email"
										value={profile.email}
										disabled
										className="bg-gray-50 dark:bg-gray-800 mobile-input responsive-body"
									/>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Información específica del rol */}
					{profile.role === 'CLIENT' && (
						<Card className="mobile-card">
							<CardHeader className="mobile-spacing-x">
								<CardTitle className="responsive-subheading">Información Física</CardTitle>
								<CardDescription className="responsive-caption">
									Datos para personalizar tu entrenamiento
								</CardDescription>
							</CardHeader>
							<CardContent className="mobile-spacing">
								<div className="grid grid-cols-1 md:grid-cols-3 mobile-gap">
									<div>
										<Label htmlFor="age" className="responsive-body">Edad</Label>
										<Input
											id="age"
											type="number"
											value={editMode ? formData.age : profile.clientProfile?.age || ''}
											onChange={(e) => setFormData({...formData, age: e.target.value})}
											disabled={!editMode}
											placeholder="Años"
											className="mobile-input responsive-body"
										/>
									</div>
									<div>
										<Label htmlFor="weight" className="responsive-body">Peso (kg)</Label>
										<Input
											id="weight"
											type="number"
											step="0.1"
											value={editMode ? formData.weight : profile.clientProfile?.weight || ''}
											onChange={(e) => setFormData({...formData, weight: e.target.value})}
											disabled={!editMode}
											placeholder="Kg"
											className="mobile-input responsive-body"
										/>
									</div>
									<div>
										<Label htmlFor="height" className="responsive-body">Altura (cm)</Label>
										<Input
											id="height"
											type="number"
											value={editMode ? formData.height : profile.clientProfile?.height || ''}
											onChange={(e) => setFormData({...formData, height: e.target.value})}
											disabled={!editMode}
											placeholder="Cm"
											className="mobile-input responsive-body"
										/>
									</div>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-3 mobile-gap">
									<div>
										<Label htmlFor="gender" className="responsive-body">Género</Label>
										<Select 
											value={editMode ? formData.gender : profile.clientProfile?.gender || ''}
											onValueChange={(value) => setFormData({...formData, gender: value})}
											disabled={!editMode}
										>
											<SelectTrigger className="mobile-input responsive-body">
												<SelectValue placeholder="Seleccionar" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="MALE" className="responsive-body">Masculino</SelectItem>
												<SelectItem value="FEMALE" className="responsive-body">Femenino</SelectItem>
												<SelectItem value="OTHER" className="responsive-body">Otro</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div>
										<Label htmlFor="fitnessGoal" className="responsive-body">Objetivo</Label>
										<Select 
											value={editMode ? formData.fitnessGoal : profile.clientProfile?.fitnessGoal || ''}
											onValueChange={(value) => setFormData({...formData, fitnessGoal: value})}
											disabled={!editMode}
										>
											<SelectTrigger className="mobile-input responsive-body">
												<SelectValue placeholder="Seleccionar" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="WEIGHT_LOSS" className="responsive-body">Pérdida de peso</SelectItem>
												<SelectItem value="MUSCLE_GAIN" className="responsive-body">Ganancia muscular</SelectItem>
												<SelectItem value="STRENGTH" className="responsive-body">Fuerza</SelectItem>
												<SelectItem value="ENDURANCE" className="responsive-body">Resistencia</SelectItem>
												<SelectItem value="GENERAL_FITNESS" className="responsive-body">Fitness general</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div>
										<Label htmlFor="activityLevel" className="responsive-body">Nivel de actividad</Label>
										<Select 
											value={editMode ? formData.activityLevel : profile.clientProfile?.activityLevel || ''}
											onValueChange={(value) => setFormData({...formData, activityLevel: value})}
											disabled={!editMode}
										>
											<SelectTrigger className="mobile-input responsive-body">
												<SelectValue placeholder="Seleccionar" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="SEDENTARY" className="responsive-body">Sedentario</SelectItem>
												<SelectItem value="LIGHT" className="responsive-body">Ligero</SelectItem>
												<SelectItem value="MODERATE" className="responsive-body">Moderado</SelectItem>
												<SelectItem value="ACTIVE" className="responsive-body">Activo</SelectItem>
												<SelectItem value="VERY_ACTIVE" className="responsive-body">Muy activo</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{profile.role === 'TRAINER' && (
						<Card className="mobile-card">
							<CardHeader className="mobile-spacing-x">
								<CardTitle className="responsive-subheading">Información Profesional</CardTitle>
								<CardDescription className="responsive-caption">
									Datos para tu perfil de entrenador
								</CardDescription>
							</CardHeader>
							<CardContent className="mobile-spacing">
								<div>
									<Label htmlFor="bio" className="responsive-body">Biografía</Label>
									<Textarea
										id="bio"
										value={editMode ? formData.bio : profile.trainerProfile?.bio || ''}
										onChange={(e) => setFormData({...formData, bio: e.target.value})}
										disabled={!editMode}
										placeholder="Cuéntanos sobre tu experiencia y enfoque..."
										rows={4}
										className="mobile-input responsive-body"
									/>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 mobile-gap">
									<div>
										<Label htmlFor="experience" className="responsive-body">Años de experiencia</Label>
										<Input
											id="experience"
											type="number"
											value={editMode ? formData.experience : profile.trainerProfile?.experience || ''}
											onChange={(e) => setFormData({...formData, experience: e.target.value})}
											disabled={!editMode}
											placeholder="Años"
											className="mobile-input responsive-body"
										/>
									</div>
									<div>
										<Label htmlFor="hourlyRate" className="responsive-body">Tarifa por hora (USD)</Label>
										<Input
											id="hourlyRate"
											type="number"
											step="0.01"
											value={editMode ? formData.hourlyRate : profile.trainerProfile?.hourlyRate || ''}
											onChange={(e) => setFormData({...formData, hourlyRate: e.target.value})}
											disabled={!editMode}
											placeholder="0.00"
											className="mobile-input responsive-body"
										/>
									</div>
								</div>
								<div>
									<Label htmlFor="specialties" className="responsive-body">Especialidades</Label>
									<Input
										id="specialties"
										value={editMode ? formData.specialties : profile.trainerProfile?.specialties || ''}
										onChange={(e) => setFormData({...formData, specialties: e.target.value})}
										disabled={!editMode}
										placeholder="Ej: Fuerza, Pérdida de peso, Rehabilitación"
										className="mobile-input responsive-body"
									/>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Suscripción Activa */}
					{profile.subscriptions && profile.subscriptions.length > 0 && (
						<Card className="mobile-card">
							<CardHeader className="mobile-spacing-x">
								<CardTitle className="responsive-subheading">Suscripción Activa</CardTitle>
								<CardDescription className="responsive-caption">
									Información de tu plan actual
								</CardDescription>
							</CardHeader>
							<CardContent className="mobile-spacing">
								<div className="flex items-center justify-between mobile-gap">
									<div>
										<h3 className="responsive-body font-semibold">{profile.subscriptions[0].plan}</h3>
										<p className="responsive-caption text-gray-600 dark:text-gray-400">
											Activo desde {new Date(profile.subscriptions[0].createdAt).toLocaleDateString('es-ES')}
										</p>
									</div>
									<Badge className="bg-green-100 text-green-800 responsive-caption">
										{profile.subscriptions[0].status}
									</Badge>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	)
}