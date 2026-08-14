import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { WishlistProvider } from '@/context/WishlistContext'; // Importa el WishlistProvider
import { OrderProvider } from '@/context/OrderContext';
import AppWrapper from '@/components/common/AppWrapper'; // Importa el envoltorio

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://apex-comerce.com';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Apex Commerce | Compra productos premium en línea',
    template: '%s | Apex Commerce',
  },
  description: 'Descubre productos premium de tecnología, hogar y estilo de vida en Apex Commerce.',
  applicationName: 'Apex Commerce',
  keywords: ['tienda en línea', 'productos premium', 'tecnología', 'hogar', 'Apex Commerce'],
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: '/',
    siteName: 'Apex Commerce',
    title: 'Apex Commerce | Compra productos premium en línea',
    description: 'Descubre productos premium de tecnología, hogar y estilo de vida.',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Apex Commerce' }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-[#f8f9fa] antialiased">
        <AuthProvider>
          <CartProvider>
            <OrderProvider>
              <WishlistProvider>
                {/* El AppWrapper se encarga de mostrar u ocultar la UI según la ruta */}
                <AppWrapper>
                  {children}
                </AppWrapper>
              </WishlistProvider>
            </OrderProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
