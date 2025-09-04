import { MetadataRoute } from 'next';
import { db } from '@/lib/db'; 

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = 'https://www.llevateloconjorvi.com';

  // Obtener todas las rifas activas para añadirlas al sitemap
  const raffles = await db.query.raffles.findMany({
    where: (raffles, { eq }) => eq(raffles.status, 'active'),
    columns: {
      id: true,
      updatedAt: true,
    },
  });

  const raffleEntries: MetadataRoute.Sitemap = raffles.map(({ id, updatedAt }) => ({
    url: `${siteUrl}/rifa/${id}`,
    lastModified: updatedAt,
    changeFrequency: 'daily', // Las rifas cambian diariamente (tickets vendidos)
    priority: 0.9, // Muy importante
  }));

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1, // Página principal es la más importante
    },
    ...raffleEntries,
  ];
}