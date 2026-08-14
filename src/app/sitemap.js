export default function sitemap() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://apex-commerce.com';
  const lastModified = new Date();

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/catalogo`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/convertirse-vendedor`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/terminos`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${siteUrl}/privacidad`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];
}
