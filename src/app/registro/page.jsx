'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function RegistroPage() {
  const router = useRouter();
  const { register, loginWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('El nombre completo es requerido');
      return false;
    }
    if (!formData.email.trim()) {
      setError('El correo electrónico es requerido');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('El formato del correo electrónico es inválido');
      return false;
    }
    if (!formData.password) {
      setError('La contraseña es requerida');
      return false;
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe contener al menos 6 caracteres');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await register(
        formData.email,
        formData.password,
        {
          name: formData.name,
          role: 'cliente'
        }
      );

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/cliente');
        }, 2000);
      } else {
        setError(result.error || 'Ocurrió un error al registrar el usuario.');
      }
    } catch (error) {
      console.error('Error en registro:', error);
      setError('Error al registrar usuario. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        setError(result.error || 'Error al registrar con Google.');
        setLoading(false);
      }
    } catch (error) {
      setError('Error al conectar con Google. Intenta nuevamente.');
      setLoading(false);
    }
  };

  // 🏁 VISTA DE ÉXITO (Icono SVG limpio)
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-[#f8f9fa]">
        <div className="bg-white rounded-2xl shadow-sm border border-[#efedef] max-w-md w-full p-8 md:p-10 text-center">
          <div className="flex justify-center mb-6 text-emerald-500">
             <svg className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2
            className="text-2xl font-bold text-[#010f20] mb-2"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            ¡Registro exitoso!
          </h2>
          <p
            className="text-xs text-[#44474c]/80 mb-6"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Tu cuenta ha sido creada correctamente. En unos momentos serás redirigido a tu panel.
          </p>
          <div
            className="animate-pulse text-xs font-bold uppercase tracking-widest text-[#010f20]/40"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Redirigiendo...
          </div>
        </div>
      </div>
    );
  }

  // 📝 FORMULARIO
  return (
    <div className="min-h-screen bg-[#f8f9fa] py-12 px-4 flex flex-col items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-[#efedef] max-w-md w-full p-8 md:p-10 relative overflow-hidden">

        <div className="flex justify-between items-start mb-8">
          <div>
            <h2
              className="text-2xl font-bold text-[#010f20]"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Crear Cuenta
            </h2>
            <p
              className="text-xs text-[#44474c]/70 mt-1"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Únete a APEX Commerce como cliente
            </p>
          </div>
          <div className="text-[#010f20] p-1 bg-[#f8f9fa] rounded-lg">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border bg-red-50/50 border-red-100 text-red-800 text-sm">
            <p className="font-bold text-xs uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Ocurrió un inconveniente</p>
            <p className="text-xs text-red-700/95 mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Nombre Completo</label>
            <Input type="text" placeholder="Juan Pérez" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full bg-transparent border-b border-gray-200 rounded-none px-0 py-2 focus:border-slate-900 focus:ring-0 placeholder-gray-300 transition-colors text-sm text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Correo Electrónico</label>
            <Input type="email" placeholder="nombre@ejemplo.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="w-full bg-transparent border-b border-gray-200 rounded-none px-0 py-2 focus:border-slate-900 focus:ring-0 placeholder-gray-300 transition-colors text-sm text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Contraseña</label>
              <Input type="password" placeholder="Mínimo 6 carac." value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required className="w-full bg-transparent border-b border-gray-200 rounded-none px-0 py-2 focus:border-slate-900 focus:ring-0 placeholder-gray-300 transition-colors text-sm text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Confirmar Contraseña</label>
              <Input type="password" placeholder="Repite contraseña" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required className="w-full bg-transparent border-b border-gray-200 rounded-none px-0 py-2 focus:border-slate-900 focus:ring-0 placeholder-gray-300 transition-colors text-sm text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
            <p className="text-[11px] text-slate-500 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Te registrarás automáticamente como <strong>Cliente</strong>. Esto te permitirá explorar el catálogo premium, realizar compras y gestionar tus pedidos de manera segura.
            </p>
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full !bg-[#0b1523] hover:!bg-slate-800 !text-white text-xs font-bold py-3.5 rounded-md transition-colors tracking-wide uppercase" loading={loading} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Registrarse como Cliente
            </Button>
          </div>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-semibold tracking-wider uppercase">
            <span className="px-3 bg-white text-gray-400" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>O regístrate con</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={handleGoogleRegister} disabled={loading} className="border border-gray-100 hover:border-gray-200 bg-white text-slate-700 text-xs font-medium py-2.5 rounded-md flex items-center justify-center gap-2 transition-all shadow-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
             <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24"><path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.598 1.237 6.39l4.029 3.375z" /><path fill="#34A853" d="M16.218 18.5A7.077 7.077 0 0 1 12 21.09c-3.282 0-6.073-1.282-8.174-3.364l-3.98 3.98C3.198 21.402 7.27 24 12 24c3.055 0 5.782-1.145 7.91-3l-3.692-2.5z" /><path fill="#4A90E2" d="M21.5 12.5c0-.709-.064-1.4-.182-2.09H12v4.09h5.964c-.282 1.5-1.036 2.727-2.1 3.546l3.31 2.3C20.218 19.7 21.5 16.2 21.5 12.5z" /><path fill="#FBBC05" d="M5.266 14.235A7.077 7.077 0 0 1 4.909 12c0-.773.136-1.5.357-2.235L1.237 6.39C.436 8.018 0 9.91 0 12c0 2.09.436 3.982 1.237 5.61l4.029-3.375z" /></svg>
            Google
          </Button>
          <Button variant="outline" disabled={loading} className="border border-gray-100 hover:border-gray-200 bg-white text-slate-700 text-xs font-medium py-2.5 rounded-md flex items-center justify-center gap-2 transition-all shadow-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <svg className="w-4 h-4 shrink-0" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
            Facebook
          </Button>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-[#44474c]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        ¿Ya tienes una cuenta?{' '}
        <Link href="/login" className="font-semibold text-[#010f20] hover:text-[#dd9448] hover:underline transition-colors ml-1">
          Inicia sesión aquí
        </Link>
      </p>
    </div>
  );
}