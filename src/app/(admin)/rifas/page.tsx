import { db } from '@/lib/db';
import { raffles } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import Link from 'next/link';
import { Plus, Eye, ImageIcon, Ticket, DollarSign } from 'lucide-react';
import Image from 'next/image';
import { StatusActions } from '@/components/rifas/status-actions';

export default async function RafflesPage() {
  const allRaffles = await db.query.raffles.findMany({
    orderBy: desc(raffles.createdAt),
    with: {
      images: {
        limit: 1,
      },
      tickets: {
        columns: { id: true },
      },
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Activa</Badge>;
      case 'finished':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Finalizada</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Cancelada</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Borrador</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Rifas</h1>
          <p className="text-gray-600">Administra, activa y visualiza todas tus rifas.</p>
        </div>
        
        <Link href="/rifas/nuevo">
          <Button className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Nueva Rifa
          </Button>
        </Link>
      </div>

      {allRaffles.length > 0 ? (
        <Card>
          {/* --- VISTA DE TABLA PARA ESCRITORIOS --- */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Imagen</TableHead>
                  <TableHead>Nombre de la Rifa</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Tickets Vendidos</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="w-[250px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRaffles.map((raffle) => (
                  <TableRow key={raffle.id}>
                    <TableCell>
                      <div className="relative w-16 h-10 rounded-md overflow-hidden border">
                        {raffle.images.length > 0 ? (
                          <Image src={raffle.images[0].url} alt={raffle.name} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-100">
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{raffle.name}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">{raffle.description}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(raffle.status)}</TableCell>
                    <TableCell>
                      <span className="font-medium">{raffle.tickets.length}</span>
                      <span className="text-muted-foreground"> / {raffle.minimumTickets.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="text-right font-bold">${raffle.price}</TableCell>
                    <TableCell className="flex gap-2 justify-end">
                      <Link href={`/rifas/${raffle.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" /> Gestionar
                        </Button>
                      </Link>
                      <StatusActions raffle={raffle} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* --- VISTA DE TARJETAS PARA MÓVILES --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4 p-4">
            {allRaffles.map((raffle) => (
              <Card key={raffle.id} className="flex flex-col">
                <CardHeader>
                  <div className="relative aspect-video w-full mb-4 rounded-lg overflow-hidden border">
                    {raffle.images.length > 0 ? (
                      <Image src={raffle.images[0].url} alt={raffle.name} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-gray-100">
                        <ImageIcon className="h-12 w-12 text-gray-400" />
                        <p className="text-sm text-gray-500 mt-2">Sin imagen</p>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">{getStatusBadge(raffle.status)}</div>
                  </div>
                  <CardTitle className="text-lg">{raffle.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow">
                  <div className="flex justify-between items-center text-sm border-t pt-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span>Precio: <span className="font-bold text-gray-900">${raffle.price}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Ticket className="h-4 w-4" />
                      <span>Vendidos: <span className="font-bold text-gray-900">{raffle.tickets.length}</span></span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Link href={`/rifas/${raffle.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-1" /> Gestionar
                    </Button>
                  </Link>
                  <StatusActions raffle={raffle} />
                </CardFooter>
              </Card>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="flex items-center justify-center text-center py-16">
          <CardContent>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay rifas creadas</h3>
            <p className="text-gray-500 mb-6">Comienza creando tu primera rifa.</p>
            <Link href="/rifas/nuevo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Rifa
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}