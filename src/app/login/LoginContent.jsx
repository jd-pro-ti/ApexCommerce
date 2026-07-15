'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Verificar si hay error en la URL (de middleware)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'account_suspended') {
      setError('🚫 Tu cuenta ha sido suspendida. Por favor, contacta al administrador para más información.');
    } else if (errorParam === 'profile_not_found') {
      setError('❌ Error al cargar tu perfil. Contacta al administrador.');
    } else if (errorParam === 'auth_error') {
      setError('❌ Error de autenticación. Intenta nuevamente.');
    } else if (errorParam === 'no_code') {
      setError('❌ No se recibió código de autenticación. Intenta nuevamente.');
    } else if (errorParam) {
      setError(`❌ Error: ${errorParam.replace(/_/g, ' ')}`);
    }
  }, [searchParams]);

  // Si ya está autenticado, redirigir
  useEffect(() => {
    if (!authLoading && user) {
      const role = user.role || 'cliente';
      let dashboardRoute = '/dashboard/cliente';
      
      if (role === 'admin') {
        dashboardRoute = '/dashboard/admin';
      } else if (role === 'vendedor') {
        dashboardRoute = '/dashboard/vendedor';
      }
      
      router.push(dashboardRoute);
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        const userRole = result.user?.role || 'cliente';
        let dashboardRoute = '/dashboard/cliente';
        
        if (userRole === 'admin') {
          dashboardRoute = '/dashboard/admin';
        } else if (userRole === 'vendedor') {
          dashboardRoute = '/dashboard/vendedor';
        }
        
        router.push(dashboardRoute);
      } else {
        // Manejar errores específicos de login
        if (result.error?.toLowerCase().includes('suspend') || result.error?.toLowerCase().includes('suspended')) {
          setError('🚫 Tu cuenta ha sido suspendida. Por favor, contacta al administrador.');
        } else if (result.error?.toLowerCase().includes('invalid') || result.error?.toLowerCase().includes('credentials')) {
          setError('❌ Credenciales inválidas. Verifica tu email y contraseña.');
        } else if (result.error?.toLowerCase().includes('not found')) {
          setError('❌ Usuario no encontrado. Verifica tu email o regístrate.');
        } else {
          setError(result.error || '❌ Error al iniciar sesión. Intenta nuevamente.');
        }
      }
    } catch (err) {
      setError('❌ Ocurrió un error al iniciar sesión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await loginWithGoogle();
      console.log('📦 Resultado del login:', result);
      
      if (!result.success) {
        console.error('❌ Error en login con Google:', result.error);
        if (result.error?.toLowerCase().includes('suspend') || result.error?.toLowerCase().includes('suspended')) {
          setError('🚫 Tu cuenta ha sido suspendida. Por favor, contacta al administrador.');
        } else {
          setError(result.error || '❌ Error al iniciar sesión con Google');
        }
        setLoading(false);
      }
      // La redirección es manejada por el callback
    } catch (error) {
      console.error('❌ Error en Google login:', error);
      setError('❌ Error al iniciar sesión con Google. Intenta nuevamente.');
      setLoading(false);
    }
  };

  // Mostrar loading mientras verifica autenticación
  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <Card className="max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Bienvenido de vuelta</h2>
          <p className="text-gray-600 mt-2">Inicia sesión en tu cuenta APEX Commerce</p>
        </div>

        {error && (
          <div className={`mb-4 p-4 rounded-lg border ${
            error.includes('suspendida') 
              ? 'bg-red-50 border-red-300 text-red-700' 
              : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            <div className="flex items-start gap-2">
              <span className="text-lg">
                {error.includes('suspendida') ? '🚫' : '⚠️'}
              </span>
              <div>
                <p className="font-medium">
                  {error.includes('suspendida') ? 'Cuenta suspendida' : 'Error'}
                </p>
                <p className="text-sm mt-1">{error}</p>
                {error.includes('suspendida') && (
                  <button 
                    onClick={() => window.location.href = 'mailto:soporte@apexcommerce.com'}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    📧 Contactar soporte
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="ejemplo@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Contraseña"
            type="password"
            placeholder="Ingresa tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="ml-2 text-gray-700">Recordarme</span>
            </label>
            <Link href="/recuperar-password" className="text-blue-600 hover:text-blue-700">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={loading}
          >
            Iniciar Sesión
          </Button>
        </form>

        {/* Separador */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">O continúa con</span>
          </div>
        </div>

        {/* Redes Sociales */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.598 1.237 6.39l4.029 3.375z"/>
              <path fill="#34A853" d="M16.218 18.5A7.077 7.077 0 0 1 12 21.09c-3.282 0-6.073-1.282-8.174-3.364l-3.98 3.98C3.198 21.402 7.27 24 12 24c3.055 0 5.782-1.145 7.91-3l-3.692-2.5z"/>
              <path fill="#4A90E2" d="M21.5 12.5c0-.709-.064-1.4-.182-2.09H12v4.09h5.964c-.282 1.5-1.036 2.727-2.1 3.546l3.31 2.3C20.218 19.7 21.5 16.2 21.5 12.5z"/>
              <path fill="#FBBC05" d="M5.266 14.235A7.077 7.077 0 0 1 4.909 12c0-.773.136-1.5.357-2.235L1.237 6.39C.436 8.018 0 9.91 0 12c0 2.09.436 3.982 1.237 5.61l4.029-3.375z"/>
            </svg>
            Google
          </Button>
          <Button
            variant="outline"
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="font-medium text-blue-600 hover:text-blue-700">
            Regístrate aquí
          </Link>
        </p>
      </Card>
    </div>
  );
}