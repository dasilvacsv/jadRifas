// @/app/admin/rifas/page.tsx

import { db } from '@/lib/db';
import { raffles, tickets } from '@/lib/db/schema';
// MODIFICADO: Se añaden 'or', 'and', 'gt' para la nueva consulta
import { desc, eq, or, and, gt } from 'drizzle-orm';
import Link from 'next/link';
import Image from 'next/image';

// --- ICONOS ---
// MODIFICADO: Se actualiza la lista de íconos según el nuevo diseño
import { Plus, Eye, ImageIcon, Ticket, DollarSign, Calendar, Crown, AlertTriangle } from 'lucide-react';

// --- COMPONENTES DE SHADCN/UI ---
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// NUEVO: Se importa Alert para las notificaciones del día del sorteo
import { Alert, AlertDescription } from '@/components/ui/alert';

// --- COMPONENTES PERSONALIZADOS ---
// Se mantiene tu componente de métodos de pago
import { PaymentMethodsManager } from '@/components/admin/PaymentMethodsManager';


// --- FUNCIONES HELPERS ---

// Función de estado, sin cambios, movida fuera del componente para mejor práctica.
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100">Activa</Badge>;
    case 'finished':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100">Finalizada</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-100 text-red-800 border-red-300 hover:bg-red-100">Cancelada</Badge>;
    case 'draft':
      return <Badge className="bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-100">Borrador</Badge>;
    case 'postponed':
      return <Badge className="bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-100">Pospuesta</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};


export default async function RafflesPage() {
  const allRaffles = await db.query.raffles.findMany({
    orderBy: desc(raffles.createdAt),
    with: {
      images: {
        limit: 1,
      },
      // MODIFICADO: Se cuentan los tickets 'sold' y los 'reserved' que no han expirado.
      tickets: {
        where: or(
          eq(tickets.status, 'sold'),
          and(
            eq(tickets.status, 'reserved'),
            gt(tickets.reservedUntil, new Date())
          )
        ),
        columns: { id: true },
      },
      winnerTicket: {
        with: {
          purchase: {
            columns: {
              buyerName: true,
            }
          }
        }
      }
    },
  });

  return (
    <div className="space-y-8">
      {/* --- CABECERA --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Rifas</h1>
          <p className="text-gray-600 mt-1">Crea, visualiza y administra todas tus rifas desde un solo lugar.</p>
        </div>
        <Link href="/rifas/nuevo">
           {/* MODIFICADO: Texto del botón simplificado */}
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Rifa
          </Button>
        </Link>
      </div>

      {allRaffles.length > 0 ? (
        <Card>
          {/* --- VISTA DE TABLA REESTRUCTURADA (DESKTOP) --- */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rifa</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Sorteo</TableHead>
                  <TableHead>Tickets Ocupados</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRaffles.map((raffle) => {
                  // NUEVO: Lógica para detectar si es el día del sorteo
                  const isDrawDay = new Date(raffle.limitDate) <= new Date() && raffle.status === 'active';
                  return (
                    <TableRow key={raffle.id} className={isDrawDay ? 'bg-yellow-50' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-4">
                           <div className="relative w-20 h-12 rounded-md overflow-hidden border bg-gray-50 flex-shrink-0">
                             {raffle.images.length > 0 ? (
                               <Image src={raffle.images[0].url} alt={raffle.name} fill className="object-cover" />
                             ) : (
                               <div className="flex h-full w-full items-center justify-center">
                                 <ImageIcon className="h-6 w-6 text-gray-400" />
                               </div>
                             )}
                           </div>
                           <div>
                             <div className="font-medium text-gray-900">{raffle.name}</div>
                             {raffle.winnerTicket?.purchase ? (
                               <div className="flex items-center gap-1.5 text-xs text-green-700 mt-1 font-semibold">
                                 <Crown className="h-4 w-4" />
                                 <span>Ganador: {raffle.winnerTicket.purchase.buyerName}</span>
                               </div>
                             ) : isDrawDay ? (
                               <Alert variant="default" className="mt-2 p-2 border-yellow-300 bg-yellow-100 text-yellow-800">
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription className="text-xs font-medium">¡Es día del sorteo!</AlertDescription>
                                  </div>
                               </Alert>
                             ) : null}
                           </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(raffle.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                           <Calendar className="h-4 w-4" />
                           {new Date(raffle.limitDate).toLocaleDateString('es-VE', {
                              year: 'numeric', month: 'short', day: 'numeric'
                           })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{raffle.tickets.length.toLocaleString()}</span>
                        <span className="text-muted-foreground"> / {raffle.minimumTickets.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {/* MODIFICADO: Se reemplaza el Dropdown por un botón simple */}
                        <Link href={`/rifas/${raffle.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1.5" /> Gestionar
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* --- VISTA DE TARJETAS REESTRUCTURADA (MOBILE) --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4 p-4">
            {allRaffles.map((raffle) => {
              // NUEVO: Lógica para detectar si es el día del sorteo
              const isDrawDay = new Date(raffle.limitDate) <= new Date() && raffle.status === 'active';
              return (
                <Card key={raffle.id} className={`flex flex-col justify-between overflow-hidden ${isDrawDay ? 'border-yellow-400 border-2' : ''}`}>
                  <div>
                    <CardHeader className="p-0">
                      <div className="relative aspect-video w-full">
                        {raffle.images.length > 0 ? (
                          <Image src={raffle.images[0].url} alt={raffle.name} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center bg-gray-100">
                            <ImageIcon className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">{getStatusBadge(raffle.status)}</div>
                      </div>
                      <div className="p-4 pb-2">
                        <CardTitle className="text-lg">{raffle.name}</CardTitle>
                        {raffle.winnerTicket?.purchase && (
                           <div className="flex items-center gap-1.5 text-xs text-green-700 mt-2 font-semibold bg-green-50 px-2 py-1 rounded-md border border-green-200">
                             <Crown className="h-4 w-4 flex-shrink-0" />
                             <span>
                               Ganador: {raffle.winnerTicket.purchase.buyerName}
                             </span>
                           </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 px-4 pb-4">
                       {isDrawDay && !raffle.winnerTicket?.purchase && (
                         <Alert variant="default" className="p-2 border-yellow-300 bg-yellow-100 text-yellow-800">
                           <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-xs">¡Hoy es el sorteo! Finaliza la rifa para registrar al ganador.</AlertDescription>
                           </div>
                         </Alert>
                       )}
                      <div className="text-sm border-t pt-4 space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-2 text-gray-600"><Calendar className="h-4 w-4" />Fecha Sorteo:</span>
                          <span className="font-medium text-gray-900">{new Date(raffle.limitDate).toLocaleDateString('es-VE')}</span>
                        </div>
                         <div className="flex justify-between items-center">
                          <span className="flex items-center gap-2 text-gray-600"><Ticket className="h-4 w-4" />Ocupados:</span>
                          <span className="font-bold text-gray-900">{raffle.tickets.length.toLocaleString()} / {raffle.minimumTickets.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-2 text-gray-600"><DollarSign className="h-4 w-4" />Precio:</span>
                          <span className="font-bold text-lg text-gray-900">${raffle.price.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                  <CardFooter className="bg-gray-50 p-2 border-t">
                     {/* MODIFICADO: Botón simplificado */}
                    <Link href={`/rifas/${raffle.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Eye className="h-4 w-4 mr-2" /> Gestionar
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </Card>
      ) : (
        // --- ESTADO VACÍO (SIN CAMBIOS) ---
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center text-center p-16">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <Ticket className="h-10 w-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Aún no tienes rifas</h3>
            <p className="text-gray-500 mb-6 max-w-sm">¡No te preocupes! Crear tu primera rifa es muy fácil. Haz clic en el botón para empezar.</p>
            <Link href="/rifas/nuevo">
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Crear Mi Primera Rifa
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* --- MÉTODOS DE PAGO (SIN CAMBIOS) --- */}
      <div>
        <PaymentMethodsManager />
      </div>
    </div>
  );
}