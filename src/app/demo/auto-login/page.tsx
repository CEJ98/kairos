'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DemoAutoLoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'logging-in' | 'redirecting' | 'error'>('logging-in');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performAutoLogin = async () => {
      try {
        setStatus('logging-in');

        // Iniciar sesión con credenciales demo
        const result = await signIn('credentials', {
          email: 'demo@kairos.fit',
          password: 'DemoPass123!',
          redirect: false,
        });

        if (result?.error) {
          setStatus('error');
          setError(result.error);
          console.error('Error de auto-login:', result.error);
          return;
        }

        if (result?.ok) {
          setStatus('redirecting');

          // Redirigir al dashboard demo después de un breve delay
          setTimeout(() => {
            router.push('/demo');
          }, 500);
        }
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error('Error en auto-login:', err);
      }
    };

    performAutoLogin();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">K</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Kairos Fitness</h1>
          <p className="text-gray-600">Demo Account</p>
        </div>

        {status === 'logging-in' && (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <div>
              <p className="text-lg font-semibold text-gray-900">Iniciando sesión...</p>
              <p className="text-sm text-gray-500 mt-1">Preparando tu cuenta demo</p>
            </div>
          </div>
        )}

        {status === 'redirecting' && (
          <div className="space-y-4">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-green-600">¡Listo!</p>
              <p className="text-sm text-gray-500 mt-1">Redirigiendo al dashboard...</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-red-600">Error al iniciar sesión</p>
              <p className="text-sm text-gray-500 mt-1">{error || 'Por favor, intenta nuevamente'}</p>
            </div>
            <button
              onClick={() => router.push('/auth')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ir a Login
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            <strong>Credenciales Demo:</strong><br />
            demo@kairos.fit / DemoPass123!
          </p>
        </div>
      </div>
    </div>
  );
}
