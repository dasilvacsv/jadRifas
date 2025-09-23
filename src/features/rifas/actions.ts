// features/rifas/actions.ts
'use server';

import { db } from '@/lib/db';
import { raffles, tickets, paymentMethods, raffleExchangeRates, systemSettings } from '@/lib/db/schema';
import { eq, and, or, gt, count } from 'drizzle-orm';
import { getBCVRates } from '@/lib/exchangeRates';

interface SystemSettingsResponse {
  success: boolean;
  data: {
    exchangeRate: string;
    // Otros ajustes si los agregas
  } | null;
  error?: string;
}

export async function getRaffleDataBySlug(slug: string) {
  try {
    const raffle = await db.query.raffles.findFirst({
      where: eq(raffles.slug, slug),
      with: {
        images: true,
        winnerTicket: {
          with: {
            purchase: true,
          }
        },
        exchangeRate: true, // 👈 Se incluye la relación para obtener la tasa específica
      },
    });

    if (!raffle) {
      return { success: false, message: 'Rifa no encontrada' };
    }

    const activePaymentMethods = await db.query.paymentMethods.findMany({
      where: eq(paymentMethods.isActive, true),
    });

    const [ticketsTakenResult] = await db
      .select({ count: count() })
      .from(tickets)
      .where(
        and(
          eq(tickets.raffleId, raffle.id),
          or(
            eq(tickets.status, 'sold'),
            and(
              eq(tickets.status, 'reserved'),
              gt(tickets.reservedUntil, new Date())
            )
          )
        )
      );

    const ticketsTakenCount = ticketsTakenResult?.count || 0;

    // AHORA: La función devuelve la tasa específica si existe, si no, devuelve null.
    // La lógica para la tasa global se mueve al componente de página.
    const exchangeRate = raffle.exchangeRate ? parseFloat(raffle.exchangeRate.usdToVesRate) : null;

    return {
      success: true,
      data: {
        raffle,
        paymentMethods: activePaymentMethods,
        ticketsTakenCount,
        exchangeRate, // 👈 Ahora puede ser un número o null
      },
    };
  } catch (error) {
    console.error('Error obteniendo datos de la rifa:', error);
    return { success: false, message: 'Error interno del servidor' };
  }
}
// Mantener la función original por compatibilidad (por si acaso)
export async function getRaffleData(id: string) {
  try {
    // Primero intentar buscar por ID
    const raffle = await db.query.raffles.findFirst({
      where: eq(raffles.id, id),
      with: {
        images: true,
        winnerTicket: {
          with: {
            purchase: true,
          }
        }
      },
    });

    if (!raffle) {
      return { success: false, message: 'Rifa no encontrada' };
    }

    // Obtener métodos de pago activos
    const activePaymentMethods = await db.query.paymentMethods.findMany({
      where: eq(paymentMethods.isActive, true),
    });

    // Contar tickets vendidos o reservados activos
    const [ticketsTakenResult] = await db
      .select({ count: count() })
      .from(tickets)
      .where(
        and(
          eq(tickets.raffleId, raffle.id),
          or(
            eq(tickets.status, 'sold'),
            and(
              eq(tickets.status, 'reserved'),
              gt(tickets.reservedUntil, new Date())
            )
          )
        )
      );

    const ticketsTakenCount = ticketsTakenResult?.count || 0;

    // Obtener tasa de cambio específica de la rifa
    let exchangeRate: number | null = null;
    try {
      const raffleExchangeRate = await db.query.raffleExchangeRates.findFirst({
        where: eq(raffleExchangeRates.raffleId, raffle.id),
      });

      if (raffleExchangeRate) {
        exchangeRate = parseFloat(raffleExchangeRate.usdToVesRate);
      } else {
        // Si no hay tasa específica, obtener del BCV
        const rates = await getBCVRates();
        exchangeRate = rates.usd.rate;
      }
    } catch (error) {
      console.error('Error obteniendo tasa de cambio:', error);
      // Mantener exchangeRate como null si hay error
    }

    return {
      success: true,
      data: {
        raffle,
        paymentMethods: activePaymentMethods,
        ticketsTakenCount,
        exchangeRate,
      },
    };
  } catch (error) {
    console.error('Error obteniendo datos de la rifa:', error);
    return { success: false, message: 'Error interno del servidor' };
  }
}

export async function getSystemSettings(): Promise<SystemSettingsResponse> {
  try {
    const settings = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'default_exchange_rate'), // Asume que la clave es 'default_exchange_rate'
    });

    if (!settings) {
      return { success: false, data: null, error: 'No se encontró la tasa de cambio global' };
    }

    return {
      success: true,
      data: {
        exchangeRate: settings.value,
      },
    };
  } catch (error) {
    console.error('Error al obtener la configuración del sistema:', error);
    return { success: false, data: null, error: 'Error interno del servidor' };
  }
}