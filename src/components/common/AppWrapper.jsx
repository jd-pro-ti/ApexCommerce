'use client';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import ChatBot from '@/components/chatbot/ChatBot';
import { Toaster } from 'react-hot-toast';

export default function AppWrapper({ children }) {
  const pathname = usePathname();
  
  const noLayoutRoutes = ['/login', '/registro'];
  const isExcluded = noLayoutRoutes.includes(pathname);

  return (
    <>
      {/* Única instancia global del Toaster para toda la aplicación */}
      <Toaster position="bottom-center" reverseOrder={false} />

      {!isExcluded && <Navbar />}
      
      <main className="min-h-screen">
        {children}
      </main>

      {!isExcluded && <ChatBot />}
      {!isExcluded && <Footer />}
    </>
  );
}