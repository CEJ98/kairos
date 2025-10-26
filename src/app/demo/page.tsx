import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dumbbell,
  TrendingUp,
  Calendar,
  Award,
  ArrowRight,
  Activity,
  Target,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { DemoScreen } from '@/components/demo/demo-screen';

export default function DemoPage() {
  return (
    <AppLayout
      title="Dashboard"
      description="Bienvenido a Kairos Fitness"
    >
+     {/* DemoScreen (dummy) */}
+     <DemoScreen />
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Entrenamientos
              </CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">32</div>
              <p className="text-xs text-muted-foreground">
                +4 esta semana
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Adherencia
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">92%</div>
              <p className="text-xs text-muted-foreground">
                +5% vs mes anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Racha Actual
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12 días</div>
              <p className="text-xs text-muted-foreground">
                ¡Sigue así!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Progreso
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+8.5kg</div>
              <p className="text-xs text-muted-foreground">
                En peso total levantado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                <CardTitle>Próximo Entrenamiento</CardTitle>
              </div>
              <CardDescription>Hoy, 18:00</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold">Empuje Superior A</h4>
                <p className="text-sm text-muted-foreground">
                  Press Banca, Press Militar, Fondos
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/workout">
                  Comenzar Entrenamiento
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>Progreso Reciente</CardTitle>
              </div>
              <CardDescription>Últimos 7 días</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Peso corporal</span>
                  <span className="font-semibold">75.2 kg</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Grasa corporal</span>
                  <span className="font-semibold">14.8%</span>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/progress">
                  Ver Detalles
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle>Esta Semana</CardTitle>
              </div>
              <CardDescription>Plan de entrenamiento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="w-12">Lun</Badge>
                  <span className="text-sm">Piernas</span>
                  <Badge className="ml-auto">✓</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="w-12">Mié</Badge>
                  <span className="text-sm">Empuje</span>
                  <Badge className="ml-auto">✓</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="w-12">Vie</Badge>
                  <span className="text-sm">Tracción</span>
                  <Badge variant="outline" className="ml-auto">Hoy</Badge>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/calendar">
                  Ver Calendario
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>Tus últimos entrenamientos</CardDescription>
              </div>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { day: 'Miércoles', title: 'Empuje Superior', sets: 16, rpe: 8.5 },
                { day: 'Lunes', title: 'Piernas', sets: 20, rpe: 9.0 },
                { day: 'Viernes pasado', title: 'Tracción Superior', sets: 18, rpe: 8.0 }
              ].map((workout, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">{workout.title}</p>
                    <p className="text-sm text-muted-foreground">{workout.day}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{workout.sets} series</p>
                    <p className="text-xs text-muted-foreground">RPE {workout.rpe}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <CardTitle>Consejo del Día</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              El descanso es tan importante como el entrenamiento. Asegúrate de dormir
              7-9 horas para optimizar la recuperación y el crecimiento muscular.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}