'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Users,
  Trophy,
  MessageSquare,
  Heart,
  Share2,
  Plus,
  Search,
  Filter,
  Crown,
  Flame,
  Target,
  Calendar,
  Award,
  TrendingUp,
  UserPlus,
  Settings,
  MoreVertical
} from 'lucide-react'
import Link from 'next/link'

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState('feed')
  const [searchTerm, setSearchTerm] = useState('')

  // Mock data - en producción vendría de APIs
  const communityData = {
    userStats: {
      points: 2450,
      level: 12,
      rank: 'Gold',
      followers: 89,
      following: 156,
      streakDays: 7
    },
    feedPosts: [
      {
        id: '1',
        user: {
          name: 'Ana García',
          avatar: 'AG',
          level: 15,
          verified: true
        },
        type: 'workout_completion',
        content: '¡Acabo de completar mi rutina de HIIT! 45 minutos de puro fuego 🔥',
        workout: {
          name: 'HIIT Cardio Blast',
          duration: 45,
          calories: 380
        },
        timestamp: '2 horas',
        likes: 23,
        comments: 8,
        isLiked: false,
        achievements: ['Racha de 10 días', 'Nuevo PR en Burpees']
      },
      {
        id: '2',
        user: {
          name: 'Carlos López',
          avatar: 'CL',
          level: 8,
          verified: false
        },
        type: 'achievement',
        content: '¡Por fin logré hacer 20 push-ups seguidas! El progreso es lento pero constante 💪',
        achievement: {
          title: 'Push-up Master',
          description: '20 push-ups consecutivas',
          icon: '💪'
        },
        timestamp: '4 horas',
        likes: 45,
        comments: 12,
        isLiked: true
      },
      {
        id: '3',
        user: {
          name: 'María Rodríguez',
          avatar: 'MR',
          level: 22,
          verified: true
        },
        type: 'challenge_completion',
        content: '¡Desafío de 30 días completado! Gracias a todos por el apoyo 🏆',
        challenge: {
          name: '30 Day Fitness Challenge',
          progress: 100,
          participants: 245
        },
        timestamp: '6 horas',
        likes: 67,
        comments: 18,
        isLiked: true
      }
    ],
    leaderboard: [
      {
        rank: 1,
        user: {
          name: 'Elena Martínez',
          avatar: 'EM',
          level: 28
        },
        points: 8950,
        streak: 45,
        workouts: 156
      },
      {
        rank: 2,
        user: {
          name: 'Diego Santos',
          avatar: 'DS',
          level: 24
        },
        points: 7820,
        streak: 32,
        workouts: 142
      },
      {
        rank: 3,
        user: {
          name: 'Sofia Chen',
          avatar: 'SC',
          level: 26
        },
        points: 7650,
        streak: 28,
        workouts: 138
      },
      {
        rank: 4,
        user: {
          name: 'Tu',
          avatar: 'TU',
          level: 12,
          isCurrentUser: true
        },
        points: 2450,
        streak: 7,
        workouts: 42
      }
    ],
    challenges: [
      {
        id: '1',
        title: 'Enero Fit Challenge',
        description: 'Entrena 20 días en enero',
        progress: 65,
        participants: 1250,
        timeLeft: '15 días',
        reward: '500 puntos + Badge',
        difficulty: 'Intermedio'
      },
      {
        id: '2',
        title: 'Cardio Master',
        description: '10 horas de cardio este mes',
        progress: 40,
        participants: 890,
        timeLeft: '20 días',
        reward: '300 puntos',
        difficulty: 'Principiante'
      },
      {
        id: '3',
        title: 'Strength Beast',
        description: 'Levanta 1000kg acumulados',
        progress: 78,
        participants: 456,
        timeLeft: '12 días',
        reward: '800 puntos + Título',
        difficulty: 'Avanzado'
      }
    ],
    achievements: [
      {
        id: '1',
        title: 'Early Bird',
        description: 'Entrena antes de las 7 AM',
        icon: '🌅',
        rarity: 'rare',
        progress: 80,
        unlocked: false
      },
      {
        id: '2',
        title: 'Streak Master',
        description: '30 días consecutivos',
        icon: '🔥',
        rarity: 'epic',
        progress: 23,
        unlocked: false
      },
      {
        id: '3',
        title: 'Push-up Pro',
        description: '100 push-ups en una sesión',
        icon: '💪',
        rarity: 'common',
        progress: 100,
        unlocked: true
      }
    ]
  }

  const tabs = [
    { id: 'feed', label: 'Feed', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'leaderboard', label: 'Ranking', icon: <Trophy className="h-4 w-4" /> },
    { id: 'challenges', label: 'Desafíos', icon: <Target className="h-4 w-4" /> },
    { id: 'achievements', label: 'Logros', icon: <Award className="h-4 w-4" /> }
  ]

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-600'
      case 2: return 'text-gray-500'
      case 3: return 'text-amber-600'
      default: return 'text-gray-700'
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈' 
      case 3: return '🥉'
      default: return `#${rank}`
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400'
      case 'rare': return 'border-blue-400'
      case 'epic': return 'border-purple-400'
      case 'legendary': return 'border-yellow-400'
      default: return 'border-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comunidad</h1>
          <p className="text-gray-600 mt-1">
            Conecta, compite y motívate con otros atletas
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Invitar Amigos
          </Button>
          <Button variant="gradient">
            <Plus className="h-4 w-4 mr-2" />
            Compartir Logro
          </Button>
        </div>
      </div>

      {/* User Stats */}
      <Card className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{communityData.userStats.points.toLocaleString()}</div>
              <div className="text-sm opacity-90">Puntos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">#{communityData.userStats.level}</div>
              <div className="text-sm opacity-90">Nivel</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{communityData.userStats.followers}</div>
              <div className="text-sm opacity-90">Seguidores</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold flex items-center justify-center gap-1">
                🔥 {communityData.userStats.streakDays}
              </div>
              <div className="text-sm opacity-90">Racha días</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600 dark:text-green-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'feed' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                    TU
                  </div>
                  <div className="flex-1">
                    <Input 
                      placeholder="Comparte tu progreso fitness..."
                      className="mb-3"
                    />
                    <div className="flex justify-between">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Trophy className="h-4 w-4 mr-1" />
                          Logro
                        </Button>
                        <Button variant="outline" size="sm">
                          <Target className="h-4 w-4 mr-1" />
                          Entrenamiento
                        </Button>
                      </div>
                      <Button size="sm" variant="gradient">
                        Publicar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feed Posts */}
            {communityData.feedPosts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-6">
                  {/* Post Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {post.user.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{post.user.name}</span>
                        {post.user.verified && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                        <Badge variant="outline" className="text-xs">
                          Nivel {post.user.level}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{post.timestamp}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Post Content */}
                  <p className="mb-4">{post.content}</p>

                  {/* Workout Info */}
                  {post.workout && (
                    <div className="p-4 bg-green-50 rounded-lg mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-green-800">{post.workout.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-green-600">
                            <span>{post.workout.duration} min</span>
                            <span>{post.workout.calories} cal</span>
                          </div>
                        </div>
                        <div className="text-2xl">💪</div>
                      </div>
                    </div>
                  )}

                  {/* Achievement */}
                  {post.achievement && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{post.achievement.icon}</div>
                        <div>
                          <h4 className="font-semibold text-yellow-800">{post.achievement.title}</h4>
                          <p className="text-sm text-yellow-600">{post.achievement.description}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Challenge */}
                  {post.challenge && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg mb-4">
                      <h4 className="font-semibold text-purple-800 mb-2">{post.challenge.name}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-purple-600">
                          {post.challenge.participants} participantes
                        </span>
                        <Badge variant="outline" className="text-purple-700">
                          Completado
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Achievements badges */}
                  {post.achievements && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.achievements.map((achievement, index) => (
                        <Badge key={index} variant="success" className="text-xs">
                          🏆 {achievement}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`flex items-center gap-2 ${
                          post.isLiked ? 'text-red-600' : 'text-gray-600'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                        {post.likes}
                      </Button>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        {post.comments}
                      </Button>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <Share2 className="h-4 w-4" />
                        Compartir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tu Progreso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Esta semana</span>
                  <span className="font-semibold">4/5 entrenamientos</span>
                </div>
                <div className="flex justify-between">
                  <span>Puntos ganados</span>
                  <span className="font-semibold text-green-600">+180</span>
                </div>
                <div className="flex justify-between">
                  <span>Posición ranking</span>
                  <span className="font-semibold">#247 ⬆️ 23</span>
                </div>
              </CardContent>
            </Card>

            {/* Trending Challenges */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Desafíos Populares</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {communityData.challenges.slice(0, 3).map((challenge) => (
                  <div key={challenge.id} className="p-3 border rounded-lg">
                    <h4 className="font-semibold text-sm mb-1">{challenge.title}</h4>
                    <p className="text-xs text-gray-600 mb-2">{challenge.participants} participantes</p>
                    <Button size="sm" variant="outline" className="w-full">
                      Unirse
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Ranking Global</CardTitle>
                <CardDescription>
                  Los usuarios más activos de esta semana
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {communityData.leaderboard.map((user) => (
                    <div
                      key={user.rank}
                      className={`flex items-center gap-4 p-4 rounded-lg ${
                        (user as any).isCurrentUser ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className={`text-lg font-bold ${getRankColor(user.rank)}`}>
                        {getRankIcon(user.rank)}
                      </div>
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {user.user.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{user.user.name}</span>
                          <Badge variant="outline" className="text-xs">
                            Nivel {user.user.level}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {user.points.toLocaleString()} puntos • {user.workouts} entrenamientos
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold flex items-center gap-1">
                          🔥 {user.streak}
                        </div>
                        <div className="text-xs text-gray-500">días</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tu Posición</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-2">#247</div>
                  <div className="text-sm text-gray-600 mb-4">de 12,450 usuarios</div>
                  <Badge variant="success" className="text-xs">
                    ⬆️ Subiste 23 posiciones
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'challenges' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {communityData.challenges.map((challenge) => (
              <Card key={challenge.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{challenge.title}</CardTitle>
                      <CardDescription>{challenge.description}</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {challenge.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progreso</span>
                        <span>{challenge.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${challenge.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{challenge.participants.toLocaleString()} participantes</span>
                      <span>{challenge.timeLeft} restantes</span>
                    </div>
                    
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-sm font-semibold text-yellow-800">Recompensa</div>
                      <div className="text-sm text-yellow-600">{challenge.reward}</div>
                    </div>
                    
                    <Button className="w-full" variant="gradient">
                      {challenge.progress > 0 ? 'Continuar' : 'Unirse al Desafío'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {communityData.achievements.map((achievement) => (
              <Card 
                key={achievement.id} 
                className={`border-2 ${getRarityColor(achievement.rarity)} ${
                  achievement.unlocked ? 'bg-gradient-to-br from-yellow-50 to-orange-50' : 'opacity-75'
                }`}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">
                    {achievement.unlocked ? achievement.icon : '🔒'}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{achievement.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                  
                  {!achievement.unlocked && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progreso</span>
                        <span>{achievement.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${achievement.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <Badge 
                    variant={achievement.unlocked ? 'default' : 'outline'} 
                    className="mt-4"
                  >
                    {achievement.unlocked ? 'Desbloqueado' : 'En progreso'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}