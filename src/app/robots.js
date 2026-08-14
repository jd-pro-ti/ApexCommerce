export default function robots() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://apex-commerce.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/login',
          '/registro',
          '/recuperar',
          '/perfil',
          '/carrito',
          '/favorito',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
