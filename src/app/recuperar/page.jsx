'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Mail, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import { validateEmail } from '@/utils/validation';

export default function RecoverPasswordPage() {
  const router = useRouter();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!validateEmail(email)) {
      setError('Escribe tu correo electrónico.');
      return;
    }

    setLoading(true);
    const result = await requestPasswordReset(email);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push(`/actualizar-password?email=${encodeURIComponent(email.trim())}`);
  };

  return (
    <main className="min-h-screen bg-[#f1f3f6] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#efedef] p-7 sm:p-10">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#010f20] flex items-center justify-center shadow-md">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-sm tracking-widest text-[#010f20] uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Apex Commerce
          </span>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#e0a96d]/20 text-[#010f20] flex items-center justify-center mb-5">
          <Mail className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#010f20] tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          Recupera tu contraseña
        </h1>
        <p className="text-sm text-[#44474c] mt-2 mb-7" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Escribe tu correo y te enviaremos un código para crear una contraseña nueva.
        </p>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center">{error}</div>}
        {message && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex gap-2"><CheckCircle className="w-4 h-4 shrink-0" />{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-[#010f20] mb-1 uppercase tracking-wider">Correo electrónico</label>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@ejemplo.com" required className="w-full px-4 py-3 rounded-xl border border-[#efedef] text-sm focus:outline-none focus:border-[#010f20] bg-[#fdfdfd] text-[#010f20]" />
          </div>
          <Button type="submit" loading={loading} className="w-full py-3 bg-[#010f20] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#010f20]/90 shadow-md">
            Enviar código
          </Button>
        </form>

        <Link href="/login" className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#44474c] hover:text-[#010f20]"><ArrowLeft className="w-3.5 h-3.5" />Volver al inicio de sesión</Link>
      </div>
    </main>
  );
}
