"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Users, DollarSign, Ticket, Crown, Loader2, Edit, Receipt, Calendar as CalendarIcon, AlertCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ImageCarousel } from './image-carousel';
import { StatusActions } from './status-actions';
import { EditRaffleForm } from './edit-raffle-form';
import { PurchaseDetailsModal } from './purchase-details-modal';
import { Button } from '@/components/ui/button';
import { drawWinnerAction, postponeRaffleAction } from '@/lib/actions';
import { useFormState } from 'react-dom';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils'; // Asegúrate de que la ruta a tu archivo utils sea correcta
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


// --- Tipos (Sin cambios) ---
type WinnerTicket = {
  id: string;
  ticketNumber: string;
  purchase: {
    buyerName: string | null;
    buyerEmail: string;
  } | null;
};
type RaffleWithRelations = {
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
  winnerTicket?: WinnerTicket | null;
  images: { id: string; url: string; }[];
  purchases: any[];
  tickets: any[];
};


// --- Formulario de Ganador (Sin cambios) ---
function DrawWinnerForm({ raffleId }: { raffleId: string }) {
  const [state, formAction] = useFormState(drawWinnerAction, { success: false, message: "" });
  const [isPending, setIsPending] = useState(false);
  const [showPostpone, setShowPostpone] = useState(false);

  useEffect(() => {
    if (state.message && !state.success && state.message.includes("no fue vendido o no existe")) {
      setShowPostpone(true);
    }
  }, [state]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    const formData = new FormData(event.currentTarget);
    await formAction(formData);
    setIsPending(false);
  };

  return (
    <Card className="shadow-lg border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-600">
          <Crown className="h-5 w-5" /> 
          {showPostpone ? 'Posponer Rifa' : 'Registrar Ganador'}
        </CardTitle>
        <CardDescription>
          {showPostpone 
            ? 'El número ganador no fue vendido. Debes elegir una nueva fecha y hora para el sorteo.' 
            : 'Ingresa el número ganador de la lotería y la imagen de prueba.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showPostpone ? (
          <PostponeRaffleForm raffleId={raffleId} />
        ) : (
          <>
            {state.message && !state.success && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="raffleId" value={raffleId} />
              <div>
                <Label htmlFor="lotteryNumber">Número Ganador (4 dígitos)</Label>
                <Input id="lotteryNumber" name="lotteryNumber" required maxLength={4} pattern="\d{4}" placeholder="Ej: 2444" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="winnerProof">Prueba del Sorteo (Imagen)</Label>
                <Input id="winnerProof" name="winnerProof" type="file" required accept="image/*" className="mt-1" />
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Ganador
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}


// --- Formulario para Posponer (CON SELECTOR DE FECHA Y HORA) ---
function PostponeRaffleForm({ raffleId }: { raffleId: string }) {
  const [state, formAction] = useFormState(postponeRaffleAction, { success: false, message: "" });
  const [date, setDate] = useState<Date | undefined>();
  
  // --- NUEVO: Estados para la hora y minutos ---
  const [hour, setHour] = useState('19'); // Default: 7 PM
  const [minute, setMinute] = useState('00'); // Default: 00
  const [combinedDateTime, setCombinedDateTime] = useState<Date | null>(null);

  // --- NUEVO: useEffect para combinar fecha y hora ---
  useEffect(() => {
    if (date) {
      const newDateTime = new Date(date);
      // Validar y parsear hora y minutos para evitar errores
      const validHour = Math.max(0, Math.min(23, parseInt(hour, 10) || 0));
      const validMinute = Math.max(0, Math.min(59, parseInt(minute, 10) || 0));
      newDateTime.setHours(validHour, validMinute, 0, 0);
      setCombinedDateTime(newDateTime);
    }
  }, [date, hour, minute]);

  return (
    <div className="pt-4">
      {state.message && (
        <Alert variant={state.success ? "default" : "destructive"} className="mb-4">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="raffleId" value={raffleId} />
        {/* El input oculto ahora usa la fecha y hora combinada */}
        <input type="hidden" name="newLimitDate" value={combinedDateTime?.toISOString() || ''} />
        
        {/* Selector de Fecha */}
        <div>
          <Label className='mb-2 block'>Nueva Fecha</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                disabled={(day) => day < new Date(new Date().setDate(new Date().getDate() - 1))}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* --- NUEVO: Selectores de Hora y Minutos --- */}
        <div className="grid grid-cols-2 gap-2">
            <div>
                <Label htmlFor="hour">Hora (24h)</Label>
                <Input 
                    id="hour" 
                    type="number" 
                    value={hour}
                    onChange={(e) => setHour(e.target.value)}
                    min="0"
                    max="23"
                />
            </div>
            <div>
                <Label htmlFor="minute">Minutos</Label>
                <Input 
                    id="minute" 
                    type="number" 
                    value={minute}
                    onChange={(e) => setMinute(e.target.value)}
                    min="0"
                    max="59"
                />
            </div>
        </div>

        <Button type="submit" variant="outline" className="w-full" disabled={!combinedDateTime}>
          Confirmar Posposición
        </Button>
      </form>
    </div>
  );
}


// --- Componente Principal (Sin cambios en su estructura) ---
export function RaffleDetailView({ initialRaffle }: { initialRaffle: RaffleWithRelations }) {
  const [isEditing, setIsEditing] = useState(false);
  const raffle = initialRaffle;

  const isDrawDay = new Date(raffle.limitDate) <= new Date() && raffle.status === 'active';
  const ticketsSoldCount = raffle.tickets.length;
  const confirmedRevenue = raffle.purchases.filter(p => p.status === 'confirmed').reduce((sum, purchase) => sum + parseFloat(purchase.amount), 0);

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
      case 'postponed': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pospuesta</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const stats = [
    { title: "Total Compras", value: raffle.purchases.length, icon: Users },
    { title: "Tickets Vendidos", value: ticketsSoldCount.toLocaleString(), icon: Ticket },
    { title: "Ingresos Confirmados", value: `$${confirmedRevenue.toFixed(2)}`, icon: DollarSign, color: "text-blue-600" },
    { title: "Fecha del Sorteo", value: new Date(raffle.limitDate).toLocaleString('es-VE'), icon: CalendarIcon },
  ];

  if (isEditing) {
    return <EditRaffleForm raffle={raffle} onCancel={() => setIsEditing(false)} />;
  }

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

        {isDrawDay && (
          <Alert variant="default" className="mb-8 bg-yellow-100 border-yellow-300 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="font-bold">¡Es Día del Sorteo!</AlertTitle>
            <AlertDescription>
              La fecha límite para esta rifa ha llegado. El siguiente paso es <strong>finalizar la rifa</strong> para detener la venta de tickets y poder registrar al ganador.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- Columna Principal: Imágenes y Compras --- */}
          <div className="lg:col-span-2 space-y-8">
            <ImageCarousel images={raffle.images} />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" /> Historial de Compras
                </CardTitle>
                <CardDescription>
                  Total de tickets vendidos: {ticketsSoldCount}
                </CardDescription>
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
                    <div className="space-y-4">
                      <div>
                        <Label>Número Sorteado</Label>
                        <p className="text-2xl font-bold">{raffle.winnerLotteryNumber}</p>
                      </div>
                      <div>
                        <Label>Ganador</Label>
                        <p className="font-semibold text-lg">
                          {raffle.winnerTicket?.purchase?.buyerName ?? "Sin nombre (Ticket no vendido)"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {raffle.winnerTicket?.purchase?.buyerEmail}
                        </p>
                      </div>
                      {raffle.winnerProofUrl && (
                        <div>
                          <Label>Prueba del Sorteo</Label>
                          <a href={raffle.winnerProofUrl} target="_blank" rel="noopener noreferrer">
                            <Image src={raffle.winnerProofUrl} alt="Prueba del sorteo" width={400} height={200} className="rounded-md object-cover mt-1 border" />
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <DrawWinnerForm raffleId={raffle.id} />
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