import { db } from '@/lib/db';
import { raffles, tickets, paymentMethods, systemSettings, raffleExchangeRates } from '@/lib/db/schema';
import { eq, and, or, gt, desc, isNotNull } from 'drizzle-orm';
import HomePage from '@/components/home/HomePage';

export const dynamic = 'force-dynamic';

export default async function HomePageServer() {
  // 1. Obtener la tasa de cambio por defecto del sistema
  const defaultExchangeRateSetting = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, 'default_exchange_rate'),
    columns: {
      value: true,
    },
  });

  // 2. Parsear el valor o usar 1.0 como fallback si no se encuentra
  const defaultExchangeRate = parseFloat(defaultExchangeRateSetting?.value || '1.0');

  // 3. Consulta para obtener las rifas activas, incluyendo la tasa de cambio personalizada
  const activeRafflesRaw = await db.query.raffles.findMany({
    where: eq(raffles.status, 'active'),
    orderBy: desc(raffles.createdAt),
    with: {
      images: true,
      tickets: {
        where: or(
          eq(tickets.status, 'sold'),
          and(
            eq(tickets.status, 'reserved'),
            gt(tickets.reservedUntil, new Date())
          )
        ),
        columns: {
          id: true,
        }
      },
      exchangeRate: {
        columns: {
          usdToVesRate: true,
        },
      },
    },
  });

  // 4. Adjuntar la tasa de cambio (personalizada o por defecto) a cada rifa
  const activeRaffles = activeRafflesRaw.map(raffle => {
    const rate = raffle.exchangeRate?.usdToVesRate 
      ? parseFloat(raffle.exchangeRate.usdToVesRate) 
      : defaultExchangeRate;

    return {
      ...raffle,
      // Asegúrate de convertir el decimal a string
      price: raffle.price.toString(),
      // Agrega la tasa de cambio como una propiedad de la rifa
      usdToVesRate: rate,
    };
  });

  // Consulta para obtener las últimas rifas finalizadas (sin cambios).
  const finishedRaffles = await db.query.raffles.findMany({
    where: and(
      eq(raffles.status, 'finished'),
      isNotNull(raffles.winnerTicketId)
    ),
    orderBy: desc(raffles.updatedAt),
    limit: 3,
    with: {
      images: { limit: 1 },
      winnerTicket: {
        with: {
          purchase: true,
        },
      },
    },
  });

  // Consulta para obtener los métodos de pago activos (sin cambios).
  const activePaymentMethods = await db.query.paymentMethods.findMany({
    where: eq(paymentMethods.isActive, true),
    columns: {
      id: true,
      title: true,
      iconUrl: true,
    }
  });

  // Datos Estructurados para el Sitio Web
  const webSiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Llevatelo con Jorvi',
    url: 'https://www.llevateloconjorvi.com', 
  };

  // Renderizamos el componente visual y el script JSON-LD
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
      />
      <HomePage 
        // @ts-ignore
        activeRaffles={activeRaffles} 
        // @ts-ignore
        finishedRaffles={finishedRaffles}
        paymentMethods={activePaymentMethods}
      />
    </>
  );
}