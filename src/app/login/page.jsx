import { Suspense } from 'react';
import LoginContent from './LoginContent';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export const metadata = {
  title: 'Iniciar Sesión - APEX Commerce',
  description: 'Inicia sesión en tu cuenta APEX Commerce',
};

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}