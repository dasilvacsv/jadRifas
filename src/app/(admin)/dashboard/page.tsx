import { db } from '@/lib/db';
import { purchases } from '@/lib/db/schema';
import { eq, count, desc, sql } from 'drizzle-orm'; // ¡Importante: añadir sql!
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, ShoppingCart, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { PurchaseDetailsModal } from '@/components/rifas/purchase-details-modal';

export default async function DashboardPage() {
  // --- CONSULTAS OPTIMIZADAS ---
  const [
    statsResult,
    pendingPurchasesList,
  ] = await Promise.all([
    // 1. Una sola consulta para todas las estadísticas
    db.select({
      totalPurchases: count(),
      pendingPurchases: sql<number>`count(CASE WHEN ${purchases.status} = 'pending' THEN 1 END)`,
      confirmedPurchases: sql<number>`count(CASE WHEN ${purchases.status} = 'confirmed' THEN 1 END)`,
      totalRevenue: sql<number>`sum(CASE WHEN ${purchases.status} = 'confirmed' THEN ${purchases.amount}::decimal ELSE 0 END)`,
    }).from(purchases),
    
    // 2. Consulta para la lista de compras pendientes
    db.query.purchases.findMany({
      where: eq(purchases.status, 'pending'),
      with: {
        raffle: {
          columns: { name: true },
        },
      },
      orderBy: desc(purchases.createdAt),
      limit: 10,
    })
  ]);

  // Extraemos los datos de la consulta de estadísticas
  const stats = statsResult[0];
  const revenue = parseFloat(stats.totalRevenue?.toString() || '0');

  const statsCards = [
    { title: "Total Compras", value: stats.totalPurchases, icon: ShoppingCart },
    { title: "Pendientes de Revisión", value: stats.pendingPurchases, icon: Clock, color: "text-yellow-600" },
    { title: "Compras Confirmadas", value: stats.confirmedPurchases, icon: CheckCircle, color: "text-green-600" },
    { title: "Ingresos Totales", value: `$${revenue.toFixed(2)}`, icon: DollarSign, color: "text-blue-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Bienvenido al panel de control de tus rifas.</p>
      </div>

      {/* --- Tarjetas de Estadísticas --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="shadow-sm hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color || ''}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color || ''}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* --- Compras Pendientes de Revisión --- */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Compras Pendientes de Revisión
          </CardTitle>
          <CardDescription>
            Estas son las últimas compras que necesitan tu atención para ser aprobadas o rechazadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingPurchasesList.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-4" />
              <h3 className="font-semibold text-lg">¡Todo al día!</h3>
              <p>No hay compras pendientes de revisión.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comprador</TableHead>
                    <TableHead>Rifa</TableHead>
                    <TableHead className="text-center">Tickets</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPurchasesList.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell>
                        <div className="font-medium">{purchase.buyerName}</div>
                        <div className="text-sm text-muted-foreground">{purchase.buyerEmail}</div>
                      </TableCell>
                      <TableCell>{purchase.raffle.name}</TableCell>
                      <TableCell className="text-center">{purchase.ticketCount}</TableCell>
                      <TableCell className="text-right font-semibold">${purchase.amount}</TableCell>
                      <TableCell className="text-right">
                        <PurchaseDetailsModal purchase={purchase} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}