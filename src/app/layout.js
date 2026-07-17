import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import AppWrapper from '@/components/common/AppWrapper'; // Importa el envoltorio

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-[#f8f9fa] antialiased">
        <AuthProvider>
          <CartProvider>
            {/* El AppWrapper se encarga de mostrar u ocultar la UI según la ruta */}
            <AppWrapper>
              {children}
            </AppWrapper>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}