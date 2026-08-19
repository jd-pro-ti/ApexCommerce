'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import { Package, Gift, Tag, UserPlus, MailCheck, CheckCircle2, Circle, Eye, EyeOff } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import { validateEmail, validatePassword } from '@/utils/validation';

export default function RegistroPage() {
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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordChecks = [
    ['Mayúscula', /[A-Z]/.test(formData.password)],
    ['Minúscula', /[a-z]/.test(formData.password)],
    ['Número', /\d/.test(formData.password)],
    ['Símbolo', /[^A-Za-z\d]/.test(formData.password)],
    ['8 caracteres', formData.password.length >= 8],
  ];

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('El nombre completo es requerido');
      return false;
    }
    if (!formData.email.trim()) {
      setError('El correo electrónico es requerido');
      return false;
    }
    if (!validateEmail(formData.email)) {
      setError('El formato del correo electrónico es inválido');
      return false;
    }
    if (!formData.password) {
      setError('La contraseña es requerida');
      return false;
    }
    if (!validatePassword(formData.password)) {
      setError('La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    if (!acceptedTerms) {
      setError('Debes aceptar los términos y condiciones para continuar');
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
    if (!acceptedTerms) {
      setError('Debes aceptar los términos y condiciones para continuar');
      setLoading(false);
      return;
    }
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

  // 🏁 VISTA DE ÉXITO
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-[#f1f3f6]">
        <div className="bg-white rounded-3xl shadow-xl border border-[#efedef] max-w-md w-full p-8 md:p-10 text-center">
          <div className="flex justify-center mb-6 text-emerald-500">
            <MailCheck className="w-16 h-16" strokeWidth={1.5} />
          </div>
          <h2
            className="text-2xl font-bold text-[#010f20] mb-2"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            ¡Registro exitoso!
          </h2>
          <p
            className="text-xs text-[#44474c] mb-6"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Tu cuenta ha sido creada correctamente. Revisa tu correo y confirma tu cuenta para poder continuar.
          </p>
          <p className="text-xs text-[#44474c] mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Te enviamos un correo a <strong>{formData.email}</strong> para validar tu cuenta. Haz clic en el enlace de confirmación para continuar.
          </p>
          <div
            className="text-xs font-bold uppercase tracking-widest text-[#010f20]/40"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Esperando confirmación...
          </div>
        </div>
      </div>
    );
  }

  // 📝 FORMULARIO CON DISEÑO DE DOS COLUMNAS
  return (
    <div className="min-h-screen bg-[#f1f3f6] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* Contenedor Principal Estilo Tarjeta Horizontal */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-[#efedef] relative">
        
        {/* COLUMNA IZQUIERDA: Formulario de Registro (7 columnas) */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white z-10">
          
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#010f20] flex items-center justify-center shadow-md">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-sm tracking-widest text-[#010f20] uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>APEX Commerce</span>
          </div>

          <div className="mb-4">
            <h1 className="text-2xl font-extrabold text-[#010f20] tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Crear Cuenta
            </h1>
            <p className="text-xs text-[#44474c] mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Únete como cliente y descubre nuestro catálogo exclusivo.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {error}
            </div>
          )}

          <div className="mb-4 w-full" aria-label="Registro con Google">
            <button 
              type="button" 
              onClick={handleGoogleRegister} 
              disabled={loading} 
              className="w-full h-12 border border-[#efedef] hover:border-[#010f20] bg-white text-[#010f20] text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24"><path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.598 1.237 6.39l4.029 3.375z" /><path fill="#34A853" d="M16.218 18.5A7.077 7.077 0 0 1 12 21.09c-3.282 0-6.073-1.282-8.174-3.364l-3.98 3.98C3.198 21.402 7.27 24 12 24c3.055 0 5.782-1.145 7.91-3l-3.692-2.5z" /><path fill="#4A90E2" d="M21.5 12.5c0-.709-.064-1.4-.182-2.09H12v4.09h5.964c-.282 1.5-1.036 2.727-2.1 3.546l3.31 2.3C20.218 19.7 21.5 16.2 21.5 12.5z" /><path fill="#FBBC05" d="M5.266 14.235A7.077 7.077 0 0 1 4.909 12c0-.773.136-1.5.357-2.235L1.237 6.39C.436 8.018 0 9.91 0 12c0 2.09.436 3.982 1.237 5.61l4.029-3.375z" /></svg>
              Google
            </button>
          </div>

          <div className="relative flex py-1 items-center mb-3">
            <div className="flex-grow border-t border-[#efedef]"></div>
            <span className="flex-shrink mx-4 text-[10px] text-[#44474c]/60 uppercase tracking-widest" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>o regístrate con correo</span>
            <div className="flex-grow border-t border-[#efedef]"></div>
          </div>

          {/* Formulario Principal */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-[#010f20] mb-1 uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Nombre Completo</label>
              <input 
                type="text" 
                placeholder="Juan Pérez" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                required 
                className="w-full px-4 py-2.5 rounded-xl border border-[#efedef] text-sm focus:outline-none focus:border-[#010f20] transition-colors bg-[#fdfdfd] text-[#010f20]" 
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} 
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#010f20] mb-1 uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Correo Electrónico</label>
              <input 
                type="email" 
                placeholder="nombre@ejemplo.com" 
                value={formData.email} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                required 
                className="w-full px-4 py-2.5 rounded-xl border border-[#efedef] text-sm focus:outline-none focus:border-[#010f20] transition-colors bg-[#fdfdfd] text-[#010f20]" 
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#010f20] mb-1 uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Contraseña</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    value={formData.password} 
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                    required 
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-[#efedef] text-sm focus:outline-none focus:border-[#010f20] transition-colors bg-[#fdfdfd] text-[#010f20] [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" 
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", WebkitTextSecurity: showPassword ? 'none' : undefined }} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#44474c] hover:text-[#010f20] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#010f20] mb-1 uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Confirmar</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repite contraseña" 
                    value={formData.confirmPassword} 
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} 
                    required 
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-[#efedef] text-sm focus:outline-none focus:border-[#010f20] transition-colors bg-[#fdfdfd] text-[#010f20] [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" 
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#44474c] hover:text-[#010f20] cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Requisitos de Contraseña */}
            <div className="bg-[#f9fafc] p-2.5 rounded-xl border border-[#efedef]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#010f20]/60 mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Requisitos de seguridad:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {passwordChecks.map(([label, valid]) => (
                  <span 
                    key={label} 
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                      valid 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-white text-[#44474c] border border-[#efedef]'
                    }`}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {valid ? <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" /> : <Circle className="h-3 w-3 text-[#44474c]/40 shrink-0" />}
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs text-[#44474c] pt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => { setAcceptedTerms(e.target.checked); if (error) setError(''); }} className="mt-0.5 h-4 w-4 rounded border-[#efedef] text-[#010f20] focus:ring-[#010f20]" />
              <span>Acepto los <Link href="/terminos" target="_blank" className="font-bold text-[#010f20] underline">Términos y condiciones</Link> y el <Link href="/privacidad" target="_blank" className="font-bold text-[#010f20] underline">Aviso de Privacidad</Link>.</span>
            </label>

            <div className="pt-1">
              <Button 
                type="submit" 
                className="w-full h-12 bg-[#010f20] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#010f20]/90 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50" 
                loading={loading} 
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Registrarse
              </Button>
            </div>
          </form>

          <div className="text-center mt-4">
            <p className="text-xs text-[#44474c]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="font-bold text-[#010f20] hover:underline">
                Inicia sesión aquí
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
              Únete a APEX
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
              <h3 className="text-white font-bold text-sm tracking-wide" style={{ fontFamily: "'Montserrat', sans-serif" }}>Empieza a comprar hoy</h3>
              <p className="text-white/60 text-xs mt-1 max-w-[220px] mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Crea tu cuenta gratis y accede a ofertas exclusivas en todo nuestro catálogo.
              </p>
            </div>

          </div>

          <div className="relative z-10 text-center">
            <p className="text-white/40 text-[10px] tracking-wider uppercase">Plataforma Segura</p>
          </div>

        </div>

      </div>
    </div>
  );
}