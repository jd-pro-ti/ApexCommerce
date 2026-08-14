'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import Button from '@/components/ui/Button';

export default function UpdatePasswordPage() {
  const { verifyRecoveryCode, updatePassword, isAuthenticated, loading: authLoading } = useAuth();
  const [recoveryStep, setRecoveryStep] = useState(1);
  const [email, setEmail] = useState(() => (
    typeof window === 'undefined'
      ? ''
      : new URLSearchParams(window.location.search).get('email') || ''
  ));
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const step = authLoading ? null : isAuthenticated ? 2 : recoveryStep;

  const verifyCode = async (event) => {
    event.preventDefault();
    setError('');
    if (!email.trim() || !token.trim()) return setError('Completa tu correo y el código.');
    setLoading(true);
    const result = await verifyRecoveryCode(email, token);
    setLoading(false);
    if (!result.success) return setError('El código no es válido o ya expiró.');
    setRecoveryStep(2);
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setError('');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    if (password !== confirmation) return setError('Las contraseñas no coinciden.');
    setLoading(true);
    const result = await updatePassword(password);
    setLoading(false);
    if (!result.success) return setError(result.error);

    // Obtener el rol de la sesión de recuperación y hacer una navegación
    // completa para que se vuelvan a cargar cookies, proxy y componentes.
    const sessionResult = await authService.getSession();
    const role = sessionResult.user?.role || 'cliente';
    const destination = role === 'admin'
      ? '/dashboard/admin'
      : role === 'vendedor'
        ? '/dashboard/vendedor'
        : '/';

    window.location.replace(destination);
  };

  if (step === null) return <main className="min-h-screen flex items-center justify-center bg-[#f1f3f6]"><div className="text-xs font-bold uppercase tracking-widest text-[#010f20]/50">Cargando...</div></main>;

  return (
    <main className="min-h-screen bg-[#f1f3f6] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#efedef] p-7 sm:p-10">
        <div className="flex items-center gap-2 mb-8"><div className="w-9 h-9 rounded-xl bg-[#010f20] flex items-center justify-center shadow-md"><ShoppingBag className="w-4 h-4 text-white" /></div><span className="font-extrabold text-sm tracking-widest text-[#010f20] uppercase">Apex Commerce</span></div>
        <div className="w-12 h-12 rounded-2xl bg-[#e0a96d]/20 text-[#010f20] flex items-center justify-center mb-5"><KeyRound className="w-6 h-6" /></div>
        <h1 className="text-2xl font-extrabold text-[#010f20] tracking-tight">{step === 1 ? 'Introduce tu código' : isAuthenticated ? 'Cambia tu contraseña' : 'Crea una contraseña nueva'}</h1>
        <p className="text-sm text-[#44474c] mt-2 mb-7">{step === 1 ? 'Revisa tu correo e introduce el código de recuperación.' : 'Usa una contraseña segura que no hayas utilizado antes.'}</p>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center">{error}</div>}

        {step === 1 ? <form onSubmit={verifyCode} className="space-y-4">
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Correo electrónico" required className="w-full px-4 py-3 rounded-xl border border-[#efedef] text-sm focus:outline-none focus:border-[#010f20] bg-[#fdfdfd] text-[#010f20]" />
          <input inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={token} onChange={(event) => setToken(event.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="Código de verificación" required className="w-full px-4 py-3 rounded-xl border border-[#efedef] text-sm tracking-[0.35em] text-center focus:outline-none focus:border-[#010f20] bg-[#fdfdfd] text-[#010f20]" />
          <Button type="submit" loading={loading} className="w-full py-3 bg-[#010f20] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-md">Verificar código</Button>
        </form> : <form onSubmit={savePassword} className="space-y-4">
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nueva contraseña" required className="w-full px-4 py-3 rounded-xl border border-[#efedef] text-sm focus:outline-none focus:border-[#010f20] bg-[#fdfdfd] text-[#010f20]" />
          <input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Repite la contraseña" required className="w-full px-4 py-3 rounded-xl border border-[#efedef] text-sm focus:outline-none focus:border-[#010f20] bg-[#fdfdfd] text-[#010f20]" />
          <Button type="submit" loading={loading} className="w-full py-3 bg-[#010f20] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-md">Guardar contraseña</Button>
        </form>}
        <Link href="/login" className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#44474c] hover:text-[#010f20]"><ArrowLeft className="w-3.5 h-3.5" />Volver al inicio de sesión</Link>
      </div>
    </main>
  );
}
