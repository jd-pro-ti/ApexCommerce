'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'account_suspended') {
      setError('Tu cuenta ha sido suspendida. Por favor, contacta al administrador.');
    } else if (errorParam === 'profile_not_found') {
      setError('Error al cargar tu perfil. Contacta al administrador.');
    } else if (errorParam === 'auth_error') {
      setError('Error de autenticación. Intenta nuevamente.');
    } else if (errorParam) {
      setError(`Error: ${errorParam.replace(/_/g, ' ')}`);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && user) {
      const role = user.role || 'cliente';
      let dashboardRoute = '/dashboard/cliente';
      if (role === 'admin') dashboardRoute = '/dashboard/admin';
      if (role === 'vendedor') dashboardRoute = '/dashboard/vendedor';
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
        if (userRole === 'admin') dashboardRoute = '/dashboard/admin';
        if (userRole === 'vendedor') dashboardRoute = '/dashboard/vendedor';
        router.push(dashboardRoute);
      } else {
        if (result.error?.toLowerCase().includes('suspend')) {
          setError('Tu cuenta ha sido suspendida. Por favor, contacta al administrador.');
        } else if (result.error?.toLowerCase().includes('invalid') || result.error?.toLowerCase().includes('credentials')) {
          setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
        } else {
          setError(result.error || 'Error al iniciar sesión. Intenta nuevamente.');
        }
      }
    } catch (err) {
      setError('Ocurrió un error inesperado. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        setError(result.error || 'Error al iniciar sesión con Google.');
        setLoading(false);
      }
    } catch (error) {
      setError('Error al conectar con Google. Intenta nuevamente.');
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen py-12 flex items-center justify-center bg-[#f8f9fa]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#010f20]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-12 px-4 flex flex-col items-center justify-center">

      {/* Branding Superior */}
{/*       <div className="text-center mb-10">
        <h1
          className="text-3xl font-bold text-[#010f20] tracking-tight mb-2"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Apex Commerce
        </h1>
        <p
          className="text-xs uppercase tracking-widest text-[#44474c]/60 font-semibold"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          El destino para los esenciales premium
        </p>
      </div> */}

      {/* Tarjeta de Inicio de Sesión */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#efedef] max-w-md w-full p-8 md:p-10 relative overflow-hidden">

        {/* Cabecera Interna */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2
              className="text-2xl font-bold text-[#010f20]"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Bienvenido de vuelta
            </h2>
            <p
              className="text-xs text-[#44474c]/70 mt-1"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Ingresa tus datos para continuar
            </p>
          </div>
          <div className="text-[#010f20] p-1 bg-[#f8f9fa] rounded-lg">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
        </div>

        {/* Alertas de Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border bg-red-50/50 border-red-100 text-red-800 text-sm">
            <p className="font-bold text-xs uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Ocurrió un inconveniente</p>
            <p className="text-xs text-red-700/95 mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{error}</p>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Correo Electrónico
            </label>
            <Input
              type="email"
              placeholder="nombre@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-transparent border-b border-gray-200 rounded-none px-0 py-2 focus:border-slate-900 focus:ring-0 placeholder-gray-300 transition-colors text-sm text-slate-900"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label
                className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Contraseña
              </label>
              <Link
                href="/recuperar-password"
                className="text-[11px] text-gray-400 hover:text-slate-900 transition-colors"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-transparent border-b border-gray-200 rounded-none px-0 py-2 focus:border-slate-900 focus:ring-0 placeholder-gray-300 transition-colors text-sm text-slate-900"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
          </div>

          <div className="pt-2">
            {/* Agregamos "!" para forzar el color de fondo y texto sobre el componente UI */}
            <Button
              type="submit"
              className="w-full !bg-[#0b1523] hover:!bg-slate-800 !text-white text-xs font-bold py-3.5 rounded-md transition-colors tracking-wide uppercase"
              size="lg"
              loading={loading}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Iniciar Sesión
            </Button>
          </div>
        </form>

        {/* Separador */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-semibold tracking-wider uppercase">
            <span className="px-3 bg-white text-gray-400" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>O continúa con</span>
          </div>
        </div>

        {/* Redes Sociales */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="border border-gray-100 hover:border-gray-200 bg-white text-slate-700 text-xs font-medium py-2.5 rounded-md flex items-center justify-center gap-2 transition-all shadow-sm"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.598 1.237 6.39l4.029 3.375z" />
              <path fill="#34A853" d="M16.218 18.5A7.077 7.077 0 0 1 12 21.09c-3.282 0-6.073-1.282-8.174-3.364l-3.98 3.98C3.198 21.402 7.27 24 12 24c3.055 0 5.782-1.145 7.91-3l-3.692-2.5z" />
              <path fill="#4A90E2" d="M21.5 12.5c0-.709-.064-1.4-.182-2.09H12v4.09h5.964c-.282 1.5-1.036 2.727-2.1 3.546l3.31 2.3C20.218 19.7 21.5 16.2 21.5 12.5z" />
              <path fill="#FBBC05" d="M5.266 14.235A7.077 7.077 0 0 1 4.909 12c0-.773.136-1.5.357-2.235L1.237 6.39C.436 8.018 0 9.91 0 12c0 2.09.436 3.982 1.237 5.61l4.029-3.375z" />
            </svg>
            Google
          </Button>

          <Button
            variant="outline"
            disabled={loading}
            className="border border-gray-100 hover:border-gray-200 bg-white text-slate-700 text-xs font-medium py-2.5 rounded-md flex items-center justify-center gap-2 transition-all shadow-sm"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <svg className="w-4 h-4 shrink-0" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </Button>
        </div>
      </div>

      {/* Enlace de Registro */}
      <p className="mt-8 text-center text-xs text-[#44474c]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        ¿Eres nuevo en Apex Commerce?{' '}
        <Link
          href="/registro"
          className="font-semibold text-[#010f20] hover:text-[#dd9448] hover:underline transition-colors ml-1"
        >
          Crea una cuenta aquí
        </Link>
      </p>
    </div>
  );
}