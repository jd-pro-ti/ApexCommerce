import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { WishlistProvider } from '@/context/WishlistContext'; // Importa el WishlistProvider
import AppWrapper from '@/components/common/AppWrapper'; // Importa el envoltorio

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-[#f8f9fa] antialiased">
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
            <AppWrapper>
              {children}
            </AppWrapper>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}