'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ShoppingBag, Package, Gift, Tag, Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim() || !formData.password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);

      if (result && result.success) {
        router.push('/dashboard/cliente');
      } else {
        setError(result?.error || 'Credenciales inválidas o error al iniciar sesión.');
      }
    } catch (err) {
      console.error('Error en inicio de sesión:', err);
      setError('Error de conexión con el servidor. Inténtalo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await loginWithGoogle();
      if (result && !result.success) {
        setError(result.error || 'Error al iniciar sesión con Google.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error Google Login:', err);
      setError('Error al conectar con Google. Intenta nuevamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* Contenedor Principal Estilo Tarjeta Horizontal */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-[#efedef] relative">
        
        {/* COLUMNA IZQUIERDA: Formulario de Inicio de Sesión (7 columnas) */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white z-10">
          
          {/* Logo y Nombre del Sistema */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#010f20] flex items-center justify-center shadow-md">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-sm tracking-widest text-[#010f20] uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Apex Commerce
            </span>
          </div>

          {/* Bienvenida */}
          <div className="mb-4">
            <h1 className="text-2xl font-extrabold text-[#010f20] tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Bienvenido de nuevo
            </h1>
            <p className="text-xs text-[#44474c] mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Ingresa tus datos o accede con tus redes sociales.
            </p>
          </div>

          {/* Alerta de Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {error}
            </div>
          )}

          {/* Botones de Inicio de Sesión Social */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="border border-[#efedef] hover:border-[#010f20] bg-white text-[#010f20] text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.598 1.237 6.39l4.029 3.375z" />
                <path fill="#34A853" d="M16.218 18.5A7.077 7.077 0 0 1 12 21.09c-3.282 0-6.073-1.282-8.174-3.364l-3.98 3.98C3.198 21.402 7.27 24 12 24c3.055 0 5.782-1.145 7.91-3l-3.692-2.5z" />
                <path fill="#4A90E2" d="M21.5 12.5c0-.709-.064-1.4-.182-2.09H12v4.09h5.964c-.282 1.5-1.036 2.727-2.1 3.546l3.31 2.3C20.218 19.7 21.5 16.2 21.5 12.5z" />
                <path fill="#FBBC05" d="M5.266 14.235A7.077 7.077 0 0 1 4.909 12c0-.773.136-1.5.357-2.235L1.237 6.39C.436 8.018 0 9.91 0 12c0 2.09.436 3.982 1.237 5.61l4.029-3.375z" />
              </svg>
              Google
            </button>

            <button 
              type="button"
              disabled={loading}
              className="border border-[#efedef] hover:border-[#010f20] bg-white text-[#010f20] text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <svg className="w-4 h-4 shrink-0" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
          </div>

          <div className="relative flex py-1 items-center mb-3">
            <div className="flex-grow border-t border-[#efedef]"></div>
            <span className="flex-shrink mx-4 text-[10px] text-[#44474c]/60 uppercase tracking-widest" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              o con tu correo
            </span>
            <div className="flex-grow border-t border-[#efedef]"></div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-3">
            
            {/* Campo Correo */}
            <div>
              <label className="block text-[11px] font-bold text-[#010f20] mb-1 uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Correo Electrónico
              </label>
              <Input 
                type="email" 
                name="email"
                placeholder="nombre@ejemplo.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#efedef] text-sm focus:outline-none focus:border-[#010f20] transition-colors bg-[#fdfdfd] text-[#010f20]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
            </div>

            {/* Campo Contraseña */}
            <div>
              <label className="block text-[11px] font-bold text-[#010f20] mb-1 uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Contraseña
              </label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-[#efedef] text-sm focus:outline-none focus:border-[#010f20] transition-colors bg-[#fdfdfd] text-[#010f20]"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#44474c] hover:text-[#010f20] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Recordarme y ¿Olvidaste tu contraseña? */}
            <div className="flex items-center justify-between text-xs py-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <label className="flex items-center gap-2 cursor-pointer text-[#44474c]">
                <input 
                  type="checkbox" 
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="rounded border-[#efedef] text-[#010f20] focus:ring-[#010f20] w-4 h-4"
                />
                <span>Recordarme</span>
              </label>

              <Link href="/recuperar" className="text-[#010f20] font-semibold hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Botón de Acción Principal (Iniciar Sesión) */}
            <div className="pt-1">
              <Button 
                type="submit"
                loading={loading}
                className="w-full py-3 bg-[#010f20] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#010f20]/90 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Iniciar Sesión
              </Button>
            </div>

          </form>

          {/* Enlace de Registro en texto pequeño */}
          <div className="text-center mt-4">
            <p className="text-xs text-[#44474c]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              ¿No tienes una cuenta?{' '}
              <Link href="/registro" className="font-bold text-[#010f20] hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>

        </div>

        {/* COLUMNA DERECHA: Panel curvo con Ilustración Creativa de Productos (5 columnas) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#010f20] to-[#12243d] p-8 sm:p-12 relative overflow-hidden flex flex-col justify-between lg:rounded-l-[80px]">
          
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#dd9448]/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 -left-12 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>

          <div className="relative z-10 text-right">
            <span className="inline-block px-3 py-1 bg-white/10 text-white rounded-full text-[10px] uppercase tracking-widest font-semibold backdrop-blur-sm">
              Catálogo Exclusivo
            </span>
          </div>

          <div className="relative z-10 my-auto py-8 flex flex-col items-center justify-center">
            
            <div className="relative w-48 h-48 bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-500">
              
              <div className="absolute -top-4 -left-4 w-14 h-14 bg-[#dd9448] rounded-2xl shadow-lg flex items-center justify-center text-white transform -rotate-12 animate-bounce">
                <Gift className="w-7 h-7" />
              </div>

              <div className="absolute -bottom-4 -right-4 w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center text-[#010f20] transform rotate-12">
                <Tag className="w-7 h-7" />
              </div>

              <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner border border-white/30">
                <Package className="w-14 h-14 text-white" />
              </div>

            </div>

            <div className="text-center mt-6">
              <h3 className="text-white font-bold text-sm tracking-wide" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Miles de productos listos para ti
              </h3>
              <p className="text-white/60 text-xs mt-1 max-w-[220px] mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Encuentra tecnología, moda, accesorios y mucho más al mejor precio.
              </p>
            </div>

          </div>

          <div className="relative z-10 text-center">
            <p className="text-white/40 text-[10px] tracking-wider uppercase">Experiencia de Compra Inteligente</p>
          </div>

        </div>

      </div>
    </div>
  );
}