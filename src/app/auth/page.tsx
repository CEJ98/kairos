'use client';

import { useState } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Branding */}
      <div className="lg:w-1/2 bg-gradient-to-br from-primary to-primary/80 p-8 lg:p-12 flex flex-col justify-center text-primary-foreground">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Dumbbell className="h-12 w-12" />
            <h1 className="font-poppins text-4xl font-bold">Kairos Fitness</h1>
          </div>
          <p className="text-lg opacity-90">
            Entrena inteligentemente. Progresa constantemente. Alcanza tus metas.
          </p>
          <div className="space-y-4 pt-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <span className="text-sm font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold">Planes Periodizados</h3>
                <p className="text-sm opacity-80">
                  Programas de entrenamiento basados en ciencia deportiva
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <span className="text-sm font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold">Seguimiento de Progreso</h3>
                <p className="text-sm opacity-80">
                  Monitorea tu evolución con métricas detalladas
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <span className="text-sm font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold">Analíticas Accionables</h3>
                <p className="text-sm opacity-80">
                  Toma decisiones informadas sobre tu entrenamiento
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Forms */}
      <div className="lg:w-1/2 p-8 lg:p-12 flex items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-6">
          {isLogin ? <LoginForm /> : <RegisterForm />}

          <div className="mt-2">
            <Button asChild size="lg" className="w-full">
              <Link href="/demo/auto-login">Probar Cuenta Demo</Link>
            </Button>
          </div>

          <div className="text-center text-sm">
            {isLogin ? (
              <p>
                ¿No tienes cuenta?{' '}
                <Button
                  variant="ghost"
                  className="p-0 h-auto font-semibold"
                  onClick={() => setIsLogin(false)}
                >
                  Regístrate aquí
                </Button>
              </p>
            ) : (
              <p>
                ¿Ya tienes cuenta?{' '}
                <Button
                  variant="ghost"
                  className="p-0 h-auto font-semibold"
                  onClick={() => setIsLogin(true)}
                >
                  Inicia sesión
                </Button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
