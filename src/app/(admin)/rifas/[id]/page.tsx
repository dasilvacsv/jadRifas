import { db } from '@/lib/db';
import { raffles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { RaffleDetailView } from '@/components/rifas/raffle-detail-view'; // Asegúrate que esta ruta sea correcta

export const revalidate = 0;

export default async function RaffleDetailPage({ params }: { params: { id: string } }) {
  // Obtenemos todos los datos necesarios en el servidor
  const raffle = await db.query.raffles.findFirst({
    where: eq(raffles.id, params.id),
    with: {
      images: true,
      // Ordenamos las compras para que las más recientes aparezcan primero
      purchases: {
        orderBy: (purchases, { desc }) => [desc(purchases.createdAt)],
      },
      // Para las estadísticas, solo necesitamos saber cuántos tickets hay, 
      // no todos sus datos, así que solo pedimos el ID por eficiencia.
      tickets: {
        columns: {
          id: true,
        }
      },
      // ---- INICIO DE LA CORRECCIÓN ----
      // Aquí le pedimos a la base de datos que también nos traiga la información
      // del ticket que ganó la rifa.
      winnerTicket: {
        with: {
          // Y para ese ticket ganador, también necesitamos los datos de la compra
          // asociada para poder mostrar el nombre del comprador.
          purchase: true,
        },
      },
      // ---- FIN DE LA CORRECCIÓN ----
    },
  });

  if (!raffle) {
    notFound();
  }

  // Pasamos los datos completos (incluyendo el ganador) al componente cliente
  return <RaffleDetailView initialRaffle={raffle} />;
}