import { db } from '@/lib/db';
import { raffles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { BuyTicketsForm } from '@/components/forms/BuyTicketsForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Gift, Calendar, DollarSign, Ticket, Users, TicketSlash } from 'lucide-react';
import Link from 'next/link';
import { ImageCarousel } from '@/components/rifas/image-carousel';

export default async function RafflePage({ params }: { params: { id: string } }) {
  // Obtenemos la rifa con sus imágenes y tickets para las estadísticas
  const raffle = await db.query.raffles.findFirst({
    where: eq(raffles.id, params.id),
    with: {
      images: true,
      tickets: {
        columns: { id: true }
      },
    },
  });

  if (!raffle || raffle.status === 'draft') {
    // No mostrar rifas que no existen o están en borrador
    notFound();
  }

  const ticketsSoldCount = raffle.tickets.length;
  const progress = Math.min((ticketsSoldCount / raffle.minimumTickets) * 100, 100);
  const ticketsRemaining = raffle.minimumTickets - ticketsSoldCount;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Activa</Badge>;
      case 'finished':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Finalizada</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a todas las rifas
        </Link>

        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Columna Izquierda: Detalles de la Rifa */}
          <div className="lg:col-span-3 space-y-8">
            <ImageCarousel images={raffle.images} />

            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="px-0">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-3xl md:text-4xl font-bold text-gray-900">{raffle.name}</CardTitle>
                  {getStatusBadge(raffle.status)}
                </div>
              </CardHeader>
              
              <CardContent className="px-0 space-y-6">
                {raffle.description && (
                  <div className="text-gray-600 leading-relaxed prose">
                    <p>{raffle.description}</p>
                  </div>
                )}

                {/* Barra de Progreso */}
                <div className="pt-4">
                  <div className="flex justify-between items-center mb-2 text-sm">
                    <span className="text-gray-600">
                      <span className="font-bold text-gray-800">{ticketsSoldCount.toLocaleString()}</span> de {raffle.minimumTickets.toLocaleString()} vendidos
                    </span>
                    <span className="font-semibold text-blue-600">{progress.toFixed(0)}% completado</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>
                
                {/* Estadísticas Clave */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t pt-6">
                  <div className="p-4 bg-white rounded-lg border">
                    <DollarSign className="h-6 w-6 text-blue-500 mb-2" />
                    <p className="text-xs text-gray-500">Precio</p>
                    <p className="text-xl font-bold text-gray-900">${raffle.price}</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border">
                    <Ticket className="h-6 w-6 text-green-500 mb-2" />
                    <p className="text-xs text-gray-500">Tickets Vendidos</p>
                    <p className="text-xl font-bold text-gray-900">{ticketsSoldCount.toLocaleString()}</p>
                  </div>
                   <div className="p-4 bg-white rounded-lg border">
                    <TicketSlash className="h-6 w-6 text-yellow-500 mb-2" />
                    <p className="text-xs text-gray-500">Quedan</p>
                    <p className="text-xl font-bold text-gray-900">{ticketsRemaining >= 0 ? ticketsRemaining.toLocaleString() : 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna Derecha: Formulario de Compra */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-8">
              <BuyTicketsForm raffle={raffle} />

              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="text-lg">¿Cómo funciona?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center font-bold">1</div>
                    <p>Completa el formulario con tus datos y la cantidad de tickets que deseas.</p>
                  </div>
                   <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center font-bold">2</div>
                    <p>Realiza el pago usando tu método preferido y anota la referencia.</p>
                  </div>
                   <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center font-bold">3</div>
                    <p>Una vez verifiquemos tu pago, tus números de la suerte serán enviados a tu email.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}