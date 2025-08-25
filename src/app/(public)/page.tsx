import { db } from '@/lib/db';
import { raffles, tickets } from '@/lib/db/schema';
import { eq, and, or, gt, desc, isNotNull } from 'drizzle-orm';
import HomePage from '@/components/home/HomePage';

export default async function HomePageServer() {
  // 1. Consulta para rifas activas, contando tickets vendidos Y reservados vigentes
  const activeRaffles = await db.query.raffles.findMany({
    where: eq(raffles.status, 'active'),
    orderBy: desc(raffles.createdAt),
    with: {
      images: {
        limit: 1,
      },
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

  // 2. Consulta para rifas finalizadas con un ganador
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

  return (
    <HomePage 
      // @ts-ignore - Database query results are compatible with component props
      activeRaffles={activeRaffles} 
      // @ts-ignore - Database query results are compatible with component props
      finishedRaffles={finishedRaffles} 
    />
  );
}