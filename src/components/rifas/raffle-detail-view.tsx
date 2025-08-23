"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Users, DollarSign, Ticket, TicketSlash, ImageIcon, Edit, Receipt, Crown, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ImageCarousel } from './image-carousel';
import { StatusActions } from './status-actions';
import { EditRaffleForm } from './edit-raffle-form';
import { PurchaseDetailsModal } from './purchase-details-modal';
import { Button } from '@/components/ui/button';
import { drawWinnerAction } from '@/lib/actions';
import { useFormState, useFormStatus } from 'react-dom';

// Agrega el tipo para el ticket ganador
type Ticket = {
  id: string;
  ticketNumber: string;
  purchase: { buyerName: string | null; buyerEmail: string; };
};

// Modifica el tipo de la rifa para incluir el ganador
type RaffleWithRelations = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  minimumTickets: number;
  status: "active" | "finished" | "cancelled" | "draft";
  createdAt: Date;
  updatedAt: Date;
  winnerTicketId: string | null;
  winnerTicket?: Ticket | null;
  images: { id: string; url: string; }[];
  purchases: { status: string; amount: string; id: string; buyerName: string | null; buyerEmail: string; buyerPhone: string | null; ticketCount: number; paymentMethod: string | null; paymentReference: string | null; paymentScreenshotUrl: string | null; }[];
  tickets: unknown[];
};

// Componente para el botón de sorteo
function DrawWinnerButton({ raffleId }: { raffleId: string }) {
  const [state, formAction] = useFormState(drawWinnerAction, { success: false, message: "" });
  const [isDrawing, setIsDrawing] = useState(false);
  const [winner, setWinner] = useState<null | { winnerTicketNumber: string, winnerName: string | null, winnerEmail: string }>(null);

  const handleDraw = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsDrawing(true);
    const formData = new FormData(event.currentTarget);
    
    // Simula una espera para el efecto visual de "sorteando"
    setTimeout(async () => {
        const result = await drawWinnerAction(state, formData);
        if (result.success) {
          setWinner(result.data);
        } else {
            // Si hay un error, permite volver a intentarlo
            setIsDrawing(false);
            alert(result.message); // Muestra el error al usuario
        }
    }, 2000); // 2 segundos de "sorteo"
  };

  if (winner) {
    return (
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-center gap-3">
          <Crown className="h-8 w-8 text-green-600" />
          <div>
            <p className="text-sm font-semibold text-green-800">¡Ganador Sorteado!</p>
            <p className="text-lg font-bold">{winner.winnerName} - Ticket: {winner.winnerTicketNumber}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={handleDraw}>
      <input type="hidden" name="raffleId" value={raffleId} />
      <Button
        type="submit"
        variant="default"
        className="w-full flex items-center gap-2"
        disabled={isDrawing}
      >
        {isDrawing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sorteando...
          </>
        ) : (
          <>
            <Crown className="h-4 w-4" /> Sortear Ganador
          </>
        )}
      </Button>
    </form>
  );
}

export function RaffleDetailView({ initialRaffle }: { initialRaffle: RaffleWithRelations }) {
  const [isEditing, setIsEditing] = useState(false);
  const raffle = initialRaffle;

  if (isEditing) {
    return <EditRaffleForm raffle={raffle} onCancel={() => setIsEditing(false)} />;
  }

  const ticketsSoldCount = raffle.tickets.length;
  const confirmedRevenue = raffle.purchases.filter(p => p.status === 'confirmed').reduce((sum, purchase) => sum + parseFloat(purchase.amount), 0);
  const ticketsRemaining = raffle.minimumTickets - ticketsSoldCount;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-green-100 text-green-800">Confirmado</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800">Rechazado</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRaffleStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800 border-green-300">Activa</Badge>;
      case 'finished': return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Finalizada</Badge>;
      case 'cancelled': return <Badge className="bg-red-100 text-red-800 border-red-300">Cancelada</Badge>;
      case 'draft': return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Borrador</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const stats = [
    { title: "Total Compras", value: raffle.purchases.length, icon: Users },
    { title: "Tickets Vendidos", value: ticketsSoldCount.toLocaleString(), icon: Ticket },
    { title: "Tickets Restantes", value: ticketsRemaining >= 0 ? ticketsRemaining.toLocaleString() : 0, icon: TicketSlash },
    { title: "Ingresos Confirmados", value: `$${confirmedRevenue.toFixed(2)}`, icon: DollarSign, color: "text-blue-600" },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <Link href="/rifas" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Volver a todas las rifas
        </Link>

        {/* --- Encabezado de la Rifa --- */}
        <div className="mt-8 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-900">{raffle.name}</h1>
              {getRaffleStatusBadge(raffle.status)}
            </div>
            <p className="text-gray-600">Detalles y gestión de la rifa.</p>
          </div>
          <div className="flex items-center gap-2">
            {raffle.status === 'draft' && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-1" /> Editar
              </Button>
            )}
            <StatusActions raffle={raffle} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- Columna Principal: Imágenes y Compras --- */}
          <div className="lg:col-span-2 space-y-8">
            <ImageCarousel images={raffle.images} />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" /> Historial de Compras
                </CardTitle>
                <CardDescription>Todas las compras realizadas para esta rifa.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Comprador</TableHead>
                        <TableHead>Tickets</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {raffle.purchases.length > 0 ? (
                        raffle.purchases.map((purchase) => (
                          <TableRow key={purchase.id}>
                            <TableCell>
                              <div className="font-medium">{purchase.buyerName}</div>
                              <div className="text-sm text-muted-foreground">{purchase.buyerEmail}</div>
                            </TableCell>
                            <TableCell>{purchase.ticketCount}</TableCell>
                            <TableCell>${purchase.amount}</TableCell>
                            <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                            <TableCell className="text-right">
                              <PurchaseDetailsModal purchase={purchase} />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                            Aún no hay compras para esta rifa.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* --- Columna Fija: Estadísticas e Información --- */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-8 self-start">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {stats.map((stat) => (
                  <div key={stat.title} className="p-4 bg-gray-50 rounded-lg border">
                    <stat.icon className="h-5 w-5 text-gray-500 mb-2" />
                    <p className="text-xs text-gray-600">{stat.title}</p>
                    <p className={`text-xl font-bold ${stat.color || 'text-gray-900'}`}>{stat.value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* NUEVO: Ruleta y Ganador */}
            {raffle.status === 'finished' && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    {raffle.winnerTicketId ? 'Ganador' : 'Sorteo'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {raffle.winnerTicketId && raffle.winnerTicket ? (
                    <div>
                      <div className="flex items-center gap-3">
                        <Crown className="h-8 w-8 text-yellow-500" />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">¡Ganador Sorteado!</p>
                          <p className="text-lg font-bold">
                            {raffle.winnerTicket.purchase.buyerName} - Ticket: {raffle.winnerTicket.ticketNumber}
                          </p>
                          <p className="text-gray-500 text-sm">
                            {raffle.winnerTicket.purchase.buyerEmail}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-600">
                        La rifa ha finalizado, es momento de sortear al ganador.
                      </p>
                      <DrawWinnerButton raffleId={raffle.id} />
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-gray-800">Precio por Ticket</p>
                  <p className="text-blue-600 font-bold text-lg">${raffle.price}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Tickets Mínimos</p>
                  <p>{raffle.minimumTickets.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Descripción</p>
                  <p className="text-gray-600">{raffle.description || 'Sin descripción.'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}