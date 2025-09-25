// En app/rifa/[slug]/page.tsx

import { getRaffleDataBySlug, getSystemSettings } from '@/features/rifas/actions';
import RaffleDetailClient from '@/features/rifas/raffle-detail-client';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { TopBuyersLeaderboard } from '@/components/TopBuyersLeaderBoard';

// Nota: No es necesario modificar `generateMetadata` ya que no usa el tipo de cambio.

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const result = await getRaffleDataBySlug(params.slug);

  if (!result.success || !result.data) {
    return {
      title: 'Rifa no encontrada',
    };
  }

  const { raffle } = result.data;
  const siteUrl = 'https://www.llevateloconjorvi.com';

  return {
    title: raffle.name,
    description: `Participa en la rifa de ${raffle.name} y gana. ¡Compra tu ticket por solo ${raffle.price} ${raffle.currency}! La suerte te espera con Jorvi.`,

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
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: raffle.name,
      description: `Participa para ganar un(a) ${raffle.name} con Llevatelo con Jorvi.`,
      images: [raffle.images[0]?.url || `${siteUrl}/og-image.png`],
    },
  };
}

// --- MODIFICADO: Añadir searchParams a la función ---
export default async function RafflePage({ params, searchParams }: { params: { slug: string }, searchParams: { ref?: string } }) {
  
  // --- ¡NUEVO! Capturar el código de referido de la URL ---
  const referralCode = searchParams?.ref;

  const [raffleResult, settingsResult] = await Promise.all([ // Carga ambos datos en paralelo
    getRaffleDataBySlug(params.slug),
    getSystemSettings()
  ]);

  if (!raffleResult.success || !raffleResult.data) {
    notFound();
  }

  const { raffle, paymentMethods, ticketsTakenCount, exchangeRate: raffleExchangeRate } = raffleResult.data;

  // 1. Obtén la tasa de cambio global del resultado de `getSystemSettings`
  const globalExchangeRate = settingsResult.success ? parseFloat(settingsResult.data.exchangeRate) : null;

  // 2. Define la tasa de cambio final: usa la de la rifa si existe, de lo contrario, usa la global.
  const finalExchangeRate = raffleExchangeRate !== null ? parseFloat(raffleExchangeRate) : globalExchangeRate;

  const raffleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: raffle.name,
    description: raffle.description || `Participa para ganar un(a) ${raffle.name}`,
    image: raffle.images.map((img: { url: string }) => img.url),
    startDate: raffle.createdAt.toISOString(),
    endDate: raffle.limitDate.toISOString(),
    offers: {
      '@type': 'Offer',
      price: raffle.price,
      priceCurrency: raffle.currency,
      url: `https://www.llevateloconjorvi.com/rifa/${raffle.slug}`,
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
                exchangeRate={finalExchangeRate}
                referralCode={referralCode}
               
                leaderboardComponent={<TopBuyersLeaderboard />}
            />
    </>
  );
}