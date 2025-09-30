// app/rifa/[slug]/page.tsx

import { getRaffleDataBySlug, getSystemSettings } from '@/features/rifas/actions';
import RaffleDetailClient from '@/features/rifas/raffle-detail-client';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { TopBuyersLeaderboard } from '@/components/TopBuyersLeaderBoard';

// La función para generar metadatos no necesita cambios
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

// Componente de la página principal
export default async function RafflePage({ params, searchParams }: { 
    params: { slug: string }, 
    searchParams: { ref?: string, r?: string } 
}) {
  
  // 1. Captura ambos códigos de referido desde la URL
  const campaignCode = searchParams?.ref;     // Para ?ref=META_SEP
  const referralUserCode = searchParams?.r;   // Para ?r=1234

  // 2. Pasa los códigos a la función `getRaffleDataBySlug` para que busque el nombre del referente
  const [raffleResult, settingsResult] = await Promise.all([
    getRaffleDataBySlug(params.slug, campaignCode, referralUserCode),
    getSystemSettings()
  ]);

  if (!raffleResult.success || !raffleResult.data) {
    notFound();
  }

  // 3. Extrae toda la información, incluyendo el nuevo `referrerName`
  const { raffle, paymentMethods, ticketsTakenCount, exchangeRate: raffleExchangeRate, referrerName } = raffleResult.data;

  // Lógica para determinar la tasa de cambio final
  const globalExchangeRate = settingsResult.success ? parseFloat(settingsResult.data.exchangeRate) : null;
  const finalExchangeRate = raffleExchangeRate !== null ? raffleExchangeRate : globalExchangeRate;

  // Schema para datos estructurados (SEO)
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
          // 4. Pasa todos los datos del referido al componente cliente para que los muestre y los use en el formulario
          campaignCode={campaignCode}
          referralUserCode={referralUserCode}
          referrerName={referrerName}
          leaderboardComponent={<TopBuyersLeaderboard />}
      />
    </>
  );
}