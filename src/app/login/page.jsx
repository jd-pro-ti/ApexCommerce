import { Suspense } from 'react';
import LoginContent from './LoginContent';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export const metadata = {
  title: 'Iniciar Sesión - APEX Commerce',
  description: 'Inicia sesión en tu cuenta APEX Commerce para acceder a tus esenciales premium.',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      <Suspense 
        fallback={
          <div className="min-h-screen py-12 flex flex-col items-center justify-center bg-[#f8f9fa] gap-4">
            <LoadingSpinner size="lg" />
            <p 
              className="text-xs font-bold uppercase tracking-widest text-[#010f20]/40 animate-pulse"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Cargando autenticación...
            </p>
          </div>
        }
      >
        <LoginContent />
      </Suspense>
    </main>
  );
}