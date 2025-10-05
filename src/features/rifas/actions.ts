// features/rifas/actions.ts
'use server';

import { db } from '@/lib/db';
import { raffles, tickets, paymentMethods, raffleExchangeRates, systemSettings, referralLinks, referrals } from '@/lib/db/schema';
import { eq, and, or, gt, count, sql } from 'drizzle-orm';
import { getBCVRates } from '@/lib/exchangeRates';

interface SystemSettingsResponse {
  success: boolean;
  data: {
    exchangeRate: string;
    // Otros ajustes si los agregas
  } | null;
  error?: string;
}

// ✅ NUEVA FUNCIÓN: Obtener información de disponibilidad en tiempo real
export async function getRaffleAvailabilityInfo(raffleId: string) {
  try {
    // Limpiar reservas expiradas primero
    await db.update(tickets)
      .set({ 
        status: 'available', 
        reservedUntil: null, 
        purchaseId: null 
      })
      .where(
        and(
          eq(tickets.raffleId, raffleId),
          eq(tickets.status, 'reserved'),
          gt(new Date(), tickets.reservedUntil)
        )
      );

    // Contar tickets por estado
    const [availableResult] = await db
      .select({ count: sql`count(*)` })
      .from(tickets)
      .where(
        and(
          eq(tickets.raffleId, raffleId),
          eq(tickets.status, 'available')
        )
      );

    const [soldResult] = await db
      .select({ count: sql`count(*)` })
      .from(tickets)
      .where(
        and(
          eq(tickets.raffleId, raffleId),
          eq(tickets.status, 'sold')
        )
      );

    const [reservedResult] = await db
      .select({ count: sql`count(*)` })
      .from(tickets)
      .where(
        and(
          eq(tickets.raffleId, raffleId),
          eq(tickets.status, 'reserved'),
          gt(tickets.reservedUntil, new Date())
        )
      );

    const available = Number(availableResult.count);
    const sold = Number(soldResult.count);
    const reserved = Number(reservedResult.count);
    const total = 10000; // Total de tickets generados
    const taken = sold + reserved;

    console.log(`Disponibilidad actualizada - Rifa: ${raffleId}, Disponibles: ${available}, Vendidos: ${sold}, Reservados: ${reserved}`);

    return {
      success: true,
      data: {
        available,
        sold,
        reserved,
        taken,
        total,
        percentage: Math.min((taken / total) * 100, 100)
      }
    };
  } catch (error) {
    console.error('Error obteniendo disponibilidad:', error);
    return {
      success: false,
      data: {
        available: 0,
        sold: 0,
        reserved: 0,
        taken: 0,
        total: 10000,
        percentage: 0
      }
    };
  }
}

export async function getRaffleDataBySlug(slug: string, refCode?: string, rCode?: string) {
  try {
    // ✅ 3. Busca los datos del referente en paralelo con la rifa
    const [raffle, referrer] = await Promise.all([
      db.query.raffles.findFirst({
        where: eq(raffles.slug, slug),
        with: {
          images: true,
          winnerTicket: { with: { purchase: true } },
          exchangeRate: true,
        },
      }),
      // Esta consulta busca el nombre del referente, dando prioridad a 'r' (cuentas)
      rCode 
        ? db.query.referrals.findFirst({ where: eq(referrals.code, rCode), columns: { name: true } })
        : refCode
        ? db.query.referralLinks.findFirst({ where: eq(referralLinks.code, refCode), columns: { name: true } })
        : Promise.resolve(null)
    ]);

    if (!raffle) {
      return { success: false, message: 'Rifa no encontrada' };
    }

    const activePaymentMethods = await db.query.paymentMethods.findMany({
      where: eq(paymentMethods.isActive, true),
    });

    // ✅ MEJORA: Usar la nueva función para obtener datos más precisos
    const availabilityInfo = await getRaffleAvailabilityInfo(raffle.id);
    const ticketsTakenCount = availabilityInfo.success ? availabilityInfo.data.taken : 0;

    const exchangeRate = raffle.exchangeRate ? parseFloat(raffle.exchangeRate.usdToVesRate) : null;

    return {
      success: true,
      data: {
        raffle,
        paymentMethods: activePaymentMethods,
        ticketsTakenCount,
        exchangeRate,
        // ✅ 4. Devuelve el nombre del referente si se encontró
        referrerName: referrer?.name || null,
        // ✅ NUEVO: Información detallada de disponibilidad
        availabilityInfo: availabilityInfo.data,
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

    // ✅ MEJORA: Usar la nueva función para contar tickets más precisamente
    const availabilityInfo = await getRaffleAvailabilityInfo(raffle.id);
    const ticketsTakenCount = availabilityInfo.success ? availabilityInfo.data.taken : 0;

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
        // ✅ NUEVO: Información detallada de disponibilidad
        availabilityInfo: availabilityInfo.data,
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