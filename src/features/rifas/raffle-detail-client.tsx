'use client'

import { BuyTicketsForm } from '@/components/forms/BuyTicketsForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Calendar, DollarSign, Ticket, Crown, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { ImageCarousel } from '@/components/rifas/image-carousel';
import Image from 'next/image';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentMethod {
  id: string;
  title: string;
  details: string;
  isActive: boolean;
}

interface RaffleImage {
  id: string;
  url: string;
}

interface Purchase {
  id: string;
  buyerName: string;
  buyerEmail: string;
}

interface WinnerTicket {
  id: string;
  ticketNumber: string;
  purchase: Purchase;
}

interface Raffle {
  id: string;
  name: string;
  description: string | null;
  price: string;
  minimumTickets: number;
  status: string;
  limitDate: Date;
  winnerLotteryNumber: string | null;
  winnerProofUrl: string | null;
  winnerTicketId: string | null;
  images: RaffleImage[];
  winnerTicket: WinnerTicket | null;
}

interface RaffleDetailClientProps {
  raffle: Raffle;
  paymentMethods: PaymentMethod[];
  ticketsTakenCount: number;
}

// Winner Display Component
function WinnerDisplayCard({ raffle }: { raffle: Raffle }) {
  if (!raffle.winnerTicket) return null;

  return (
    <Card className="bg-green-50 border-green-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl text-green-800">
          <Crown className="h-7 w-7" />
          ¡Ya tenemos un ganador!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-gray-600">El número ganador de la lotería fue:</p>
          <p className="text-5xl font-bold text-green-700 tracking-widest my-2">{raffle.winnerLotteryNumber}</p>
        </div>
        <div className="p-4 bg-white rounded-lg border text-center">
          <p className="font-semibold text-xl">{raffle.winnerTicket.purchase.buyerName}</p>
          <p className="text-gray-500">{raffle.winnerTicket.purchase.buyerEmail}</p>
          <p className="mt-1">
            Con el ticket: <Badge className="text-lg">{raffle.winnerTicket.ticketNumber}</Badge>
          </p>
        </div>
        {raffle.winnerProofUrl && (
          <div>
            <h4 className="font-semibold text-center mb-2 text-gray-700">Prueba del Sorteo</h4>
            <a href={raffle.winnerProofUrl} target="_blank" rel="noopener noreferrer" className="block relative aspect-video w-full rounded-lg overflow-hidden border-2 hover:border-green-400 transition">
              <Image src={raffle.winnerProofUrl} alt="Prueba del sorteo" fill className="object-contain" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Status Badge Component
function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800 border-green-300">Activa</Badge>;
    case 'finished':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Finalizada</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-100 text-red-800 border-red-300">Cancelada</Badge>;
    case 'postponed':
      return <Badge className="bg-orange-100 text-orange-800 border-orange-300">Pospuesta</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function RaffleDetailClient({ raffle, paymentMethods, ticketsTakenCount }: RaffleDetailClientProps) {
  const progress = Math.min((ticketsTakenCount / raffle.minimumTickets) * 100, 100);

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
          {/* Left Column: Raffle Details */}
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

                {/* Progress Bar */}
                <div className="pt-4">
                  <div className="flex justify-between items-center mb-2 text-sm">
                    <span className="text-gray-600">
                      <span className="font-bold text-gray-800">{ticketsTakenCount.toLocaleString()}</span> de {raffle.minimumTickets.toLocaleString()} ocupados
                    </span>
                    <span className="font-semibold text-blue-600">{progress.toFixed(0)}% completado</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>
                
                {/* Key Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t pt-6">
                  <div className="p-4 bg-white rounded-lg border">
                    <DollarSign className="h-6 w-6 text-blue-500 mb-2" />
                    <p className="text-xs text-gray-500">Precio</p>
                    <p className="text-xl font-bold text-gray-900">${raffle.price}</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border">
                    <Ticket className="h-6 w-6 text-green-500 mb-2" />
                    <p className="text-xs text-gray-500">Tickets Ocupados</p>
                    <p className="text-xl font-bold text-gray-900">{ticketsTakenCount.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border">
                    <Calendar className="h-6 w-6 text-purple-500 mb-2" />
                    <p className="text-xs text-gray-500">Fecha del Sorteo</p>
                    <p className="text-lg font-bold text-gray-900">{new Date(raffle.limitDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Purchase Form or Winner */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-8">
              {/* Conditional Logic: Show winner or purchase form */}
              {raffle.status === 'finished' && raffle.winnerTicketId ? (
                <WinnerDisplayCard raffle={raffle} />
              ) : raffle.status === 'active' ? (
                <BuyTicketsForm raffle={raffle} paymentMethods={paymentMethods} />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <Alert variant={raffle.status === 'finished' ? "default" : "destructive"}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {
                          raffle.status === 'finished' ? "Esta rifa ha finalizado. ¡El ganador será anunciado pronto!" :
                          raffle.status === 'cancelled' ? "Esta rifa ha sido cancelada." :
                          raffle.status === 'postponed' ? `El sorteo ha sido pospuesto. Nueva fecha: ${new Date(raffle.limitDate).toLocaleDateString()}` :
                          "Esta rifa no está disponible para la compra."
                        }
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}

              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="text-lg">¿Cómo funciona?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center font-bold">1</div>
                    <p>Elige la cantidad de tickets que quieres (2, 5, 10, 50, 100 o cantidad personalizada).</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center font-bold">2</div>
                    <p>Apartamos tus números por 10 minutos mientras completas tu información.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center font-bold">3</div>
                    <p>Selecciona tu método de pago preferido y realiza la transferencia.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center font-bold">4</div>
                    <p>Completa el formulario con tus datos, referencia de pago y captura de pantalla.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center font-bold">5</div>
                    <p>Una vez verifiquemos tu pago, recibirás tus números de la suerte por email.</p>
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
