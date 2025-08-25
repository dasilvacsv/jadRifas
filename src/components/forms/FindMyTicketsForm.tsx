"use client";

import { useState } from 'react';
import { findMyTicketsAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Ticket, CheckCircle, Crown, ExternalLink, Calendar } from 'lucide-react';
import Image from 'next/image';

const initialState: { success: boolean; message: string; data?: any[] | null } = {
  success: false,
  message: '',
  data: null
};

// --- SUBCOMPONENTE CORREGIDO ---
const WinnerInfo = ({ purchase }: { purchase: any }) => {
  // Primero, comprobamos si hay un ticket ganador en la rifa
  if (!purchase.raffle.winnerTicket) {
    return null;
  }

  const didIWin = purchase.tickets.some((t: any) => t.id === purchase.raffle.winnerTicket.id);

  return (
    <div className={`mt-4 p-4 rounded-lg border ${didIWin ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
      <div className="flex items-center gap-3 mb-3">
        <Crown className={`h-6 w-6 ${didIWin ? 'text-green-600' : 'text-blue-600'}`} />
        <div>
          <h4 className="font-semibold">{didIWin ? '¡Felicidades, ganaste esta rifa!' : 'Resultado del Sorteo'}</h4>
          <p className="text-xs text-gray-600">
            Número ganador: 
            <span className="font-bold text-lg"> {purchase.raffle.winnerLotteryNumber}</span>
          </p>
        </div>
      </div>
      
      {/* CORRECCIÓN PRINCIPAL AQUÍ */}
      {/* Si no gané, muestro el nombre del ganador, pero de forma segura */}
      {!didIWin && (
        <p className="text-sm text-gray-800">
          El ganador fue: 
          <span className="font-semibold">
            {/* Se usa '?.' para acceder de forma segura y se añade un texto por defecto */}
            {purchase.raffle.winnerTicket?.purchase?.buyerName ?? " (Ticket no vendido)"}
          </span>
        </p>
      )}
      {/* FIN DE LA CORRECCIÓN */}

      {purchase.raffle.winnerProofUrl && (
        <a href={purchase.raffle.winnerProofUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="mt-2 w-full sm:w-auto">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Prueba del Sorteo
          </Button>
        </a>
      )}
    </div>
  );
};


export function FindMyTicketsForm() {
  const [state, setState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    const formData = new FormData(event.currentTarget);
    const result = await findMyTicketsAction(formData);
    setState(result);
    setIsPending(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-green-100 text-green-800 border-green-300">Confirmado</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendiente</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800 border-red-300">Rechazado</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Search className="h-6 w-6" />
            Consultar Mis Compras
          </CardTitle>
          <CardDescription>Ingresa tu correo para ver el historial de todas tus compras y tickets asignados.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit}>
            <div className="flex flex-col sm:flex-row gap-2">
              <Label htmlFor="email" className="sr-only">Email</Label>
              <Input id="email" name="email" type="email" required disabled={isPending} className="flex-1" placeholder="tu@email.com" />
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Buscar
              </Button>
            </div>
          </form>
          {state.message && !state.success && <Alert variant="destructive" className="mt-4"><AlertDescription>{state.message}</AlertDescription></Alert>}
        </CardContent>
      </Card>

      {/* --- SECCIÓN DE RESULTADOS --- */}
      {state.success && state.data && (
        <div>
          {/* --- VISTA DE TABLA PARA ESCRITORIOS --- */}
          <div className="hidden md:block">
            <Card className="shadow-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Rifa</TableHead>
                    <TableHead>Detalles</TableHead>
                    <TableHead>Estado Compra</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-center">Tickets</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.data.map((purchase: any) => (
                    <TableRow key={purchase.id}>
                      <TableCell>
                        <div className="relative w-24 h-16 rounded-md overflow-hidden border">
                          <Image src={purchase.raffle.images?.[0]?.url || '/placeholder.png'} alt={purchase.raffle.name} fill className="object-cover" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{purchase.raffle.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> 
                          Sorteo: {new Date(purchase.raffle.limitDate).toLocaleDateString('es-VE')}
                        </div>
                        <WinnerInfo purchase={purchase} />
                      </TableCell>
                      <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                      <TableCell className="text-right font-medium">${purchase.amount}</TableCell>
                      <TableCell className="text-center">
                        {purchase.status === 'confirmed' && purchase.tickets.length > 0 ? (
                          <Accordion type="single" collapsible>
                            <AccordionItem value="tickets" className="border-none">
                              <AccordionTrigger className="text-blue-600 hover:no-underline p-2">Ver {purchase.tickets.length} tickets</AccordionTrigger>
                              <AccordionContent className="p-4 bg-slate-50 rounded-md">
                                <div className="flex flex-wrap gap-2">
                                  {purchase.tickets.map((t: any) => <Badge key={t.ticketNumber} variant="outline" className="font-mono bg-white">{t.ticketNumber}</Badge>)}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        ) : (
                          <span className="text-xs text-muted-foreground">{purchase.status === 'pending' ? 'En espera' : 'N/A'}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* --- VISTA DE TARJETAS PARA MÓVILES --- */}
          <div className="grid grid-cols-1 gap-6 md:hidden">
            {state.data.map((purchase: any) => (
              <Card key={purchase.id} className="overflow-hidden shadow-md">
                <div className="relative aspect-video">
                  <Image src={purchase.raffle.images?.[0]?.url || '/placeholder.png'} alt={purchase.raffle.name} fill className="object-cover" />
                  <div className="absolute top-2 right-2">{getStatusBadge(purchase.status)}</div>
                </div>
                <CardHeader>
                  <CardTitle>{purchase.raffle.name}</CardTitle>
                  <CardDescription>
                    Sorteo: {new Date(purchase.raffle.limitDate).toLocaleDateString('es-VE')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center text-sm border-t pt-4">
                    <span className="font-bold">Monto: ${purchase.amount}</span>
                    <span className="font-bold">Tickets: {purchase.ticketCount}</span>
                  </div>
                  
                  <WinnerInfo purchase={purchase} />

                  {purchase.status === 'confirmed' && purchase.tickets.length > 0 && (
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger className="text-green-700"><CheckCircle className="h-5 w-5 mr-2" /> Ver mis {purchase.tickets.length} tickets</AccordionTrigger>
                        <AccordionContent className="p-4 bg-slate-50 rounded-b-md">
                          <div className="flex flex-wrap gap-2">
                            {purchase.tickets.map((t: any) => <Badge key={t.ticketNumber} variant="outline" className="text-lg font-mono bg-white">{t.ticketNumber}</Badge>)}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}