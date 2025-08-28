import { db } from '@/lib/db';
// Importa las tablas y los operadores de Drizzle ORM
import { raffles, tickets, paymentMethods } from '@/lib/db/schema';
import { eq, and, or, gt, desc, isNotNull } from 'drizzle-orm';
// Importa el componente visual que se encargará de renderizar la UI
import HomePage from '@/components/home/HomePage';

// Forzamos el renderizado dinámico. Esto asegura que cada vez que un usuario
// visita la página, los datos de las rifas (como los tickets vendidos)
// están completamente actualizados. Es ideal para una página de rifas.
export const dynamic = 'force-dynamic';

export default async function HomePageServer() {
  
  // 1. Consulta para obtener las rifas activas.
  // Esta consulta es la más importante para la página principal.
  const activeRaffles = await db.query.raffles.findMany({
    where: eq(raffles.status, 'active'),
    orderBy: desc(raffles.createdAt),
    with: {
      // Obtenemos TODAS las imágenes asociadas para el carrusel en cada tarjeta.
      // --- ESTE ES EL CAMBIO CLAVE ---
      // Se eliminó `limit: 1` para que el carrusel funcione.
      images: true, 
      
      // Contamos los tickets que están 'vendidos' o 'reservados' (y cuya reserva no ha expirado).
      // Esto nos da el número real de tickets ocupados para la barra de progreso.
      tickets: {
        where: or(
          eq(tickets.status, 'sold'),
          and(
            eq(tickets.status, 'reserved'),
            gt(tickets.reservedUntil, new Date())
          )
        ),
        // Solo necesitamos el 'id' para contar, es más eficiente que traer todos los datos del ticket.
        columns: {
          id: true,
        }
      }
    },
  });

  // 2. Consulta para obtener las últimas rifas finalizadas.
  // Esto alimenta la sección del "Salón de la Fama" o "Ganadores Recientes".
  const finishedRaffles = await db.query.raffles.findMany({
    where: and(
      eq(raffles.status, 'finished'),
      isNotNull(raffles.winnerTicketId) // Aseguramos que solo traiga rifas con un ganador asignado.
    ),
    orderBy: desc(raffles.updatedAt), // Ordenamos por fecha de finalización para mostrar las más recientes primero.
    limit: 3, // Limitamos a 3 para no saturar la página de inicio.
    with: {
      images: { limit: 1 }, // Aquí sí es correcto limitar a 1, solo necesitamos una imagen representativa.
      // Obtenemos la información del ticket ganador y los datos de la persona que lo compró.
      winnerTicket: {
        with: {
          purchase: true,
        },
      },
    },
  });

  // 3. Consulta para obtener los métodos de pago activos.
  // Estos se mostrarán en las tarjetas de las rifas.
  const activePaymentMethods = await db.query.paymentMethods.findMany({
    where: eq(paymentMethods.isActive, true),
    columns: {
      id: true,
      title: true,
      iconUrl: true,
    }
  });

  // Finalmente, renderizamos el componente visual (`HomePage`) y le pasamos todos los datos
  // que obtuvimos de la base de datos como props.
  return (
    <HomePage 
      // Las directivas @ts-ignore indican que confiamos en que los tipos de datos de Drizzle
      // coinciden con los que espera el componente HomePage. En un proyecto grande,
      // sería ideal crear tipos explícitos para mayor seguridad.
      // @ts-ignore
      activeRaffles={activeRaffles} 
      // @ts-ignore
      finishedRaffles={finishedRaffles}
      paymentMethods={activePaymentMethods}
    />
  );
}