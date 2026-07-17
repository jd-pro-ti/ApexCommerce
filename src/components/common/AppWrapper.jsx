'use client';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';

export default function AppWrapper({ children }) {
  const pathname = usePathname();
  
  // Define las rutas donde NO quieres que aparezca el Navbar y Footer
  const noLayoutRoutes = ['/login', '/registro'];
  
  // Verificamos si la ruta actual está en la lista de exclusión
  const isExcluded = noLayoutRoutes.includes(pathname);

  return (
    <>
      {!isExcluded && <Navbar />}
      <main className="min-h-screen">
        {children}
      </main>
      {!isExcluded && <Footer />}
    </>
  );
}