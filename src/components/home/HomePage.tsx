'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Ticket, Gift, Clock, Award, Calendar, Crown } from 'lucide-react';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export interface RaffleImage {
  id: string;
  url: string;
  raffleId: string;
}

export interface Purchase {
  id: string;
  buyerName: string | null;
  buyerEmail: string;
  buyerPhone: string | null;
  amount: string;
  status: "pending" | "confirmed" | "rejected";
  paymentReference: string | null;
  paymentScreenshotUrl: string | null;
  paymentMethod: string | null;
  ticketCount: number;
  createdAt: Date;
  raffleId: string;
}

export interface WinnerTicket {
  id: string;
  ticketNumber: string;
  raffleId: string;
  purchaseId: string | null;
  status: "available" | "reserved" | "sold";
  reservedUntil: Date | null;
  purchase: Purchase | null;
}

export interface ActiveRaffle {
  id: string;
  name: string;
  description: string | null;
  price: string;
  minimumTickets: number;
  status: "active" | "finished" | "cancelled" | "draft" | "postponed";
  createdAt: Date;
  updatedAt: Date;
  limitDate: Date;
  winnerTicketId: string | null;
  winnerLotteryNumber: string | null;
  winnerProofUrl: string | null;
  images: RaffleImage[];
  tickets: Array<{ id: string }>;
}

export interface FinishedRaffle {
  id: string;
  name: string;
  description: string | null;
  price: string;
  minimumTickets: number;
  status: "active" | "finished" | "cancelled" | "draft" | "postponed";
  createdAt: Date;
  updatedAt: Date;
  limitDate: Date;
  winnerTicketId: string | null;
  winnerLotteryNumber: string | null;
  winnerProofUrl: string | null;
  images: RaffleImage[];
  winnerTicket: WinnerTicket | null;
}

interface HomePageProps {
  activeRaffles: ActiveRaffle[];
  finishedRaffles: FinishedRaffle[];
}

export default function HomePage({ activeRaffles, finishedRaffles }: HomePageProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-24 px-4 text-center">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-repeat opacity-40"></div>
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Award className="h-4 w-4" />
            Tu oportunidad de ganar
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
            Participa en Rifas Exclusivas y Gana <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Premios Increíbles</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Elige tu rifa, compra tus tickets de forma segura y prepárate para ser el próximo ganador. ¡Mucha suerte!
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="#rifas-activas">
              <Button size="lg" className="px-8 py-3 text-base">
                <Gift className="mr-2 h-5 w-5" />
                Ver Rifas Disponibles
              </Button>
            </Link>
            <Link href="/mis-tickets">
              <Button variant="outline" size="lg" className="px-8 py-3 text-base">
                <Ticket className="mr-2 h-5 w-5" />
                Consultar Mis Tickets
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Active Raffles Section */}
      <section id="rifas-activas" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Rifas Activas
            </h2>
            <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
              Estos son los premios que podrías llevarte a casa. ¡No dejes pasar la oportunidad!
            </p>
          </div>

          {activeRaffles.length === 0 ? (
            <Card className="max-w-2xl mx-auto shadow-none border-dashed border-2">
              <CardContent className="pt-12 pb-12 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No hay rifas activas en este momento
                </h3>
                <p className="text-gray-500">
                  Vuelve pronto, estamos preparando nuevos y emocionantes premios para ti.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeRaffles.map((raffle) => {
                const ticketsTakenCount = raffle.tickets.length;
                const progress = Math.min((ticketsTakenCount / raffle.minimumTickets) * 100, 100);

                return (
                  <Card key={raffle.id} className="group overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col border-0">
                    <CardHeader className="p-0">
                      <div className="relative aspect-video w-full">
                        <Image
                          src={raffle.images[0]?.url || '/placeholder.png'}
                          alt={raffle.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div className="absolute bottom-4 left-4">
                            <h3 className="text-2xl font-bold text-white shadow-md">{raffle.name}</h3>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-6 flex-grow flex flex-col">
                      <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">
                        {raffle.description}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <Calendar className="h-4 w-4" />
                        <span>Sorteo: {new Date(raffle.limitDate).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2 text-sm">
                          <span className="text-gray-600">
                            <span className="font-bold text-gray-800">{ticketsTakenCount.toLocaleString()}</span> / {raffle.minimumTickets.toLocaleString()} ocupados
                          </span>
                          <span className="font-semibold text-blue-600">{progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </CardContent>

                    <CardFooter className="p-6 bg-slate-50/50">
                        <div className="w-full flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-500">Precio</p>
                            <p className="text-2xl font-bold text-blue-600">${raffle.price}</p>
                          </div>
                          <Link href={`/rifa/${raffle.id}`}>
                            <Button size="lg">
                              Participar
                              <Ticket className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Recent Results Section */}
      {finishedRaffles.length > 0 && (
        <section id="resultados" className="py-20 px-4 bg-white border-t">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Resultados Recientes</h2>
              <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">¡Felicidades a nuestros últimos ganadores!</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {finishedRaffles.map((raffle) => (
                <Card key={raffle.id} className="bg-green-50 border-green-200 rounded-xl shadow-lg flex flex-col">
                  <CardHeader className="p-0">
                    <div className="relative aspect-video w-full">
                      <Image src={raffle.images[0]?.url || '/placeholder.png'} alt={`Premio ganado: ${raffle.name}`} fill className="object-cover rounded-t-xl" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-4 left-4">
                            <Badge variant="secondary" className="bg-green-600 text-white border-green-700">RIFA FINALIZADA</Badge>
                        </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 text-center flex-grow flex flex-col justify-start">
                    <p className="text-sm text-gray-600">El número ganador para <span className="font-semibold">{raffle.name}</span> fue:</p>
                    <p className="text-5xl font-bold text-green-700 tracking-widest my-2">{raffle.winnerLotteryNumber}</p>
                    
                    <div className="p-4 bg-white rounded-lg border mt-4">
                      <Crown className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                      <p className="font-semibold text-xl text-gray-800">{raffle.winnerTicket?.purchase?.buyerName ?? "Ticket no vendido"}</p>
                      <div className="mt-1">
                        Con el ticket: <Badge className="text-md bg-green-100 text-green-800">{raffle.winnerTicket?.ticketNumber}</Badge>
                      </div>
                    </div>

                    {/* Show winner proof image if exists */}
                    {raffle.winnerProofUrl && (
                        <div className="relative aspect-video w-full mt-4 rounded-lg overflow-hidden border">
                            <Image 
                                src={raffle.winnerProofUrl}
                                alt={`Prueba del sorteo para ${raffle.name}`}
                                fill
                                className="object-contain"
                            />
                        </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-white border-t">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
            ¿Cómo Funciona?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-4">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border-4 border-blue-200">
                <span className="text-blue-600 font-bold text-2xl">1</span>
              </div>
              <h3 className="font-semibold text-xl mb-2">Elige tu Rifa</h3>
              <p className="text-gray-600">
                Selecciona el premio que más te guste y decide cuántos tickets quieres para aumentar tus probabilidades.
              </p>
            </div>

            <div className="text-center p-4">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border-4 border-green-200">
                <span className="text-green-600 font-bold text-2xl">2</span>
              </div>
              <h3 className="font-semibold text-xl mb-2">Realiza el Pago</h3>
              <p className="text-gray-600">
                Completa tu información y realiza el pago de forma segura con tu método de preferencia.
              </p>
            </div>

            <div className="text-center p-4">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border-4 border-indigo-200">
                <span className="text-indigo-600 font-bold text-2xl">3</span>
              </div>
              <h3 className="font-semibold text-xl mb-2">¡Listo para Ganar!</h3>
              <p className="text-gray-600">
                Una vez verificado tu pago, recibirás tus números de la suerte por email. ¡Mucha suerte!
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
