import { Suspense } from 'react';
import CatalogoContent from './CatalogoContent';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export const metadata = {
  title: 'Catálogo de productos',
  description: 'Explora productos premium de tecnología, hogar y estilo de vida en Apex Commerce.',
  alternates: {
    canonical: '/catalogo',
  },
};

export default function CatalogoPage() {
  return (
    <main className="min-h-screen bg-[#fdfdfd]">
      <Suspense 
        fallback={
          /* Se agrega pt-28 aquí también para que el spinner de Suspense no sea tapado por la Navbar durante la carga inicial */
          <div className="min-h-screen pt-28 lg:pt-32 flex flex-col items-center justify-center bg-[#fdfdfd] gap-4">
            <LoadingSpinner size="lg" />
            <p 
              className="text-xs font-bold uppercase tracking-widest text-[#010f20]/40 animate-pulse"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Cargando Colección...
            </p>
          </div>
        }
      >
        <CatalogoContent />
      </Suspense>
    </main>
  );
}
