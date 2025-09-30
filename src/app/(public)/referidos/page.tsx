// app/public/referidos/page.tsx
import { Suspense } from 'react';
import { getReferralSession, getActiveRafflesForReferrals } from '@/lib/actions-referrals';
import ReferralLoginForm from '@/components/referrals/ReferralLoginForm';
import ReferralDashboard from '@/components/referrals/ReferralDashboard';
import Link from 'next/link';

export const metadata = {
  title: 'Panel de Referidos - Jorvilaniña',
  description: 'Accede a tu panel de referido para ver tus comisiones y ventas generadas.',
};

export default async function ReferidosPage() {
  const session = await getReferralSession();
  
  // Obtenemos las rifas activas en el servidor solo si hay sesión
  const activeRaffles = session ? await getActiveRafflesForReferrals() : [];

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {session ? (
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          }>
            <ReferralDashboard referral={session.referral} activeRaffles={activeRaffles} />
          </Suspense>
        ) : (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-amber-300 to-orange-500">
                Portal de Referidos
              </h2>
              <p className="mt-3 text-lg text-zinc-400">
                Ingresa con tus credenciales para acceder a tu panel de comisiones y generar tus enlaces de venta.
              </p>
            </div>
            <ReferralLoginForm />
          </div>
        )}
      </main>
    </div>
  );
}