'use client';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import SideBar from '@/components/common/SideBar';
import Footer from '@/components/common/Footer';
import ChatBot from '@/components/chatbot/ChatBot';
import { useAuth } from '@/context/AuthContext';

export default function AppWrapper({ children }) {
  const pathname = usePathname();
  const { role } = useAuth();

  const noLayoutRoutes = ['/login', '/registro'];
  const isExcluded = noLayoutRoutes.includes(pathname);
  const isClientUser = role === 'cliente' || !role;
  const isAdminOrSeller = role === 'admin' || role === 'vendedor';

  return (
    <>
      {!isExcluded && isClientUser && <Navbar />}
      
      <div className={`min-h-screen ${!isExcluded && isAdminOrSeller ? 'md:flex' : ''}`}>
        {!isExcluded && isAdminOrSeller && <SideBar />}

        <main className="flex-1 min-h-screen">
          {children}
        </main>
      </div>

      {!isExcluded && (isClientUser || role === 'vendedor') && <ChatBot />}
      {!isExcluded && isClientUser && <Footer />}
    </>
  );
}
