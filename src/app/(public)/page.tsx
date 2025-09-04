import { db } from '@/lib/db';
// Importa las tablas y los operadores de Drizzle ORM
import { raffles, tickets, paymentMethods } from '@/lib/db/schema';
import { eq, and, or, gt, desc, isNotNull } from 'drizzle-orm';
// Importa el componente visual que se encargará de renderizar la UI
import HomePage from '@/components/home/HomePage';

export const dynamic = 'force-dynamic';


export default async function HomePageServer() {
  
  // 1. Consulta para obtener las rifas activas (sin cambios).
  const activeRaffles = await db.query.raffles.findMany({
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
      }
    },
  });

  // 2. Consulta para obtener las últimas rifas finalizadas (sin cambios).
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

  // 3. Consulta para obtener los métodos de pago activos (sin cambios).
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