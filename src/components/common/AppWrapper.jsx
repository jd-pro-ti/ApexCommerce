'use client';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import ChatBot from '@/components/chatbot/ChatBot';
import { Toaster } from 'react-hot-toast'; // 👈 Asegúrate de incluir el Toaster aquí también

export default function AppWrapper({ children }) {
  const pathname = usePathname();
  
  // Define las rutas donde NO quieres que aparezca el Navbar, Footer y ChatBot
  const noLayoutRoutes = ['/login', '/registro', '/perfil'];
  
  // Verificamos si la ruta actual está en la lista de exclusión
  const isExcluded = noLayoutRoutes.includes(pathname);

  return (
    <>
      {/* Gestor global de alertas para que funcionen desde el chatbot en cualquier página */}
      <Toaster position="bottom-right" reverseOrder={false} />

      {!isExcluded && <Navbar />}
      
      <main className="min-h-screen">
        {children}
      </main>

      {/* El ChatBot se ocultará automáticamente en /login y /registro gracias a isExcluded */}
      {!isExcluded && <ChatBot />}

      {!isExcluded && <Footer />}
    </>
  );
}