// components/referrals/ReferralDashboard.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DollarSign, Users, LogOut, User, Mail, Hash, Calendar, Loader2, ChevronLeft, ChevronRight, ShoppingCart, TrendingUp
} from 'lucide-react';
import { getReferralCommissions, referralLogoutAction } from '@/lib/actions-referrals';
import { ReferralShareLinkGenerator } from './ReferralShareLinkGenerator';

// Interfaces
interface Referral {
  id: string;
  name: string;
  email: string;
  code: string;
}

interface CommissionData {
  commissionsData: Array<{
    email: string;
    buyerName: string | null;
    totalPurchases: number;
    commissionEarned: number;
    firstPurchaseDate: Date;
  }>;
  summary: {
    totalCommissions: number;
    totalSales: number;
    totalRevenue: number;
    uniqueCustomers: number;
    commissionPerSale: number;
  };
}

type ActiveRaffle = {
  id: string;
  name: string;
  slug: string | null;
  imageUrl: string | null;
};

interface ReferralDashboardProps {
  referral: Referral;
  activeRaffles: ActiveRaffle[];
}

export default function ReferralDashboard({ referral, activeRaffles }: ReferralDashboardProps) {
  const [commissions, setCommissions] = useState<CommissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const loadCommissions = async () => {
      try {
        setLoading(true);
        const data = await getReferralCommissions();
        setCommissions(data);
      } catch (err) {
        setError('Error al cargar tus comisiones. Intenta recargar la página.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadCommissions();
  }, []);

  const handleLogout = async () => {
    await referralLogoutAction();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
        <p className="ml-4 text-lg text-zinc-400">Cargando tus datos...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;
  }

  if (!commissions) {
    return <Alert><AlertDescription>No se pudieron cargar los datos de comisiones.</AlertDescription></Alert>;
  }
  
  const stats = [
    {
      title: "Comisiones Totales",
      value: `$${commissions.summary.totalCommissions.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-400",
    },
    {
      title: "Ventas Confirmadas",
      value: commissions.summary.totalSales.toString(),
      icon: ShoppingCart,
      color: "text-amber-400",
    },
    {
      title: "Clientes Únicos",
      value: commissions.summary.uniqueCustomers.toString(),
      icon: Users,
      color: "text-blue-400",
    },
    {
        title: "Ingresos Generados",
        value: `$${commissions.summary.totalRevenue.toFixed(2)}`,
        icon: TrendingUp,
        color: "text-indigo-400",
    },
  ];

  // Lógica de paginación
  const commissionsData = commissions?.commissionsData || [];
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = commissionsData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(commissionsData.length / itemsPerPage);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-white">Tu Panel de Referido</h2>
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
            <div className="flex items-center gap-2"><User className="h-4 w-4" /> {referral.name}</div>
            <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {referral.email}</div>
            <div className="flex items-center gap-2 font-mono"><Hash className="h-4 w-4" /> {referral.code}</div>
          </div>
        </div>
        <form action={handleLogout}>
            <Button variant="outline" size="sm" className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300 hover:text-white">
                <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
            </Button>
        </form>
      </div>

      <Alert className="bg-zinc-900 border-amber-500/30">
        <DollarSign className="h-4 w-4 text-amber-400" />
        <AlertDescription className="text-zinc-300">
          <strong>Tu comisión:</strong> Ganas <strong>${commissions.summary.commissionPerSale.toFixed(2)} USD</strong> por cada venta confirmada realizada con tu código de referido, sin importar la cantidad de tickets.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-zinc-400">{stat.title}</p>
                        <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ReferralShareLinkGenerator referralCode={referral.code} raffles={activeRaffles} />

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Tus Clientes Referidos</CardTitle>
        </CardHeader>
        <CardContent>
          {commissionsData.length === 0 ? (
            <div className="text-center py-10 text-zinc-400">
              <p className="text-lg">Aún no tienes ventas confirmadas.</p>
              <p className="text-sm mt-2">
                ¡Comparte tu enlace de referido para empezar a ganar comisiones!
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-700">
                      <TableHead className="text-zinc-300">Cliente</TableHead>
                      <TableHead className="text-zinc-300 text-center">Ventas</TableHead>
                      <TableHead className="text-zinc-300 text-right">Comisión Ganada</TableHead>
                      <TableHead className="text-zinc-300 text-right">Primera Compra</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((c) => (
                      <TableRow key={c.email} className="border-zinc-800">
                        <TableCell>
                          <div className="font-medium text-white">{c.buyerName || 'N/A'}</div>
                          <div className="text-sm text-zinc-400">{c.email}</div>
                        </TableCell>
                        <TableCell className="text-center font-medium text-white">{c.totalPurchases}</TableCell>
                        <TableCell className="text-right font-semibold text-green-400">+${c.commissionEarned.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-zinc-400 text-sm">
                          <div className="flex items-center justify-end gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(c.firstPurchaseDate).toLocaleDateString('es-VE')}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                  <div className="flex items-center justify-end space-x-4 pt-4 mt-4 border-t border-zinc-800">
                  <span className="text-sm text-zinc-400">
                    Página {currentPage} de {totalPages}
                  </span>
                  <div className='space-x-2'>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}