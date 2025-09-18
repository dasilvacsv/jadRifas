'use server'

import { db } from '@/lib/db';
import { eq, and, or, gt } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { raffles, tickets, paymentMethods, raffleExchangeRates } from '@/lib/db/schema';
import { getSystemSettings } from '@/lib/actions-sellers';

export async function getRaffleData(raffleId: string) {
  try {
    // 1. Obtiene los datos principales de la rifa
    const raffle = await db.query.raffles.findFirst({
      where: eq(raffles.id, raffleId),
      with: {
        images: true,
        // Cuenta los tickets vendidos y los reservados que no han expirado
        tickets: {
          where: or(
            eq(tickets.status, 'sold'),
            and(
              eq(tickets.status, 'reserved'),
              gt(tickets.reservedUntil, new Date())
            )
          ),
          columns: { id: true }
        },
        winnerTicket: {
          with: {
            purchase: true
          }
        }
      },
    });

    // 2. Si la rifa no existe o está en borrador, muestra error 404
    if (!raffle || raffle.status === 'draft') {
      notFound();
    }

    // 3. Lógica para obtener la tasa de cambio correcta
    let exchangeRate: number | null = null;

    // Primero, busca una tasa específica para esta rifa
    const specificRate = await db.query.raffleExchangeRates.findFirst({
        where: eq(raffleExchangeRates.raffleId, raffleId),
    });

    if (specificRate) {
        // Si existe, la usa
        exchangeRate = parseFloat(specificRate.usdToVesRate);
    } else {
        // Si no, busca la tasa por defecto en las configuraciones globales
        const systemSettings = await getSystemSettings();
        if (systemSettings.default_exchange_rate) {
            exchangeRate = parseFloat(systemSettings.default_exchange_rate);
        }
    }
    // Si ninguna de las dos existe, `exchangeRate` se quedará como `null`

    // 4. Obtiene los métodos de pago activos
    const activePaymentMethods = await db.query.paymentMethods.findMany({
      where: eq(paymentMethods.isActive, true),
    });

    // 5. Devuelve toda la información necesaria para la página
    return {
      success: true,
      data: {
        raffle,
        paymentMethods: activePaymentMethods,
        ticketsTakenCount: raffle.tickets.length,
        exchangeRate, // <-- La tasa correcta ya va incluida aquí
      }
    };
  } catch (error) {
    console.error('Error fetching raffle data:', error);
    return {
      success: false,
      error: 'Error al cargar la rifa'
    };
  }
}