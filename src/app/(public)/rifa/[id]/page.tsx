// En app/rifa/[id]/page.tsx

import { getRaffleData } from '@/features/rifas/actions';
import RaffleDetailClient from '@/features/rifas/raffle-detail-client';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next'; // 👈 1. Importa Metadata

// 👇 2. Añade la función generateMetadata
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const result = await getRaffleData(params.id);

  if (!result.success || !result.data) {
    // Si la rifa no se encuentra, retornamos metadatos básicos o dejamos que notFound() lo maneje
    return {
      title: 'Rifa no encontrada',
    };
  }

  const { raffle } = result.data;
  const siteUrl = 'https://www.llevateloconjorvi.com';

  return {
    title: raffle.name, // Título dinámico basado en el nombre de la rifa
    description: `Participa en la rifa de ${raffle.name} y gana. ¡Compra tu ticket por solo ${raffle.price} ${raffle.currency}! La suerte te espera con Jorvi.`,
    
    // Metadatos para redes sociales con la imagen de la rifa
    openGraph: {
      title: raffle.name,
      description: `¡Tu oportunidad de ganar un(a) ${raffle.name} está aquí!`,
      images: [
        {
          url: raffle.images[0]?.url || `${siteUrl}/jorvi.png`, 
          width: 1200,
          height: 630,
          alt: `Imagen de la rifa: ${raffle.name}`,
        },
      ],
      type: 'article', // O 'product'
    },
    twitter: {
      card: 'summary_large_image',
      title: raffle.name,
      description: `Participa para ganar un(a) ${raffle.name} con Llevatelo con Jorvi.`,
      images: [raffle.images[0]?.url || `${siteUrl}/og-image.png`],
    },
  };
}


export default async function RafflePage({ params }: { params: { id: string } }) {
  const result = await getRaffleData(params.id);
  
  if (!result.success || !result.data) {
    notFound();
  }

  const { raffle, paymentMethods, ticketsTakenCount } = result.data;

  
  const raffleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event', // Una rifa es un tipo de evento
    name: raffle.name,
    description: raffle.description || `Participa para ganar un(a) ${raffle.name}`,
    image: raffle.images.map((img: { url: string }) => img.url),
    startDate: raffle.createdAt.toISOString(),
    endDate: raffle.limitDate.toISOString(), // La fecha del sorteo
    offers: {
      '@type': 'Offer',
      price: raffle.price,
      priceCurrency: raffle.currency,
      url: `https://www.llevateloconjorvi.com/rifa/${raffle.id}`, 
      validFrom: raffle.createdAt.toISOString(),
    },
    organizer: {
      '@type': 'Organization',
      name: 'Llevatelo con Jorvi',
      url: 'https://www.llevateloconjorvi.com', 
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(raffleJsonLd) }}
      />
      <RaffleDetailClient 
        raffle={raffle}
        paymentMethods={paymentMethods}
        ticketsTakenCount={ticketsTakenCount}
      />
    </>
  );
}