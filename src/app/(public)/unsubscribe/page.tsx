// app/unsubscribe/page.tsx

import { CheckCircle, MailX, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Metadata } from 'next';

// Nota: Resend normalmente redirige con parámetros de correo y audiencia.
// Esta página sirve como una confirmación de que el proceso se completó.

export const metadata: Metadata = {
  title: 'Desuscripción Exitosa',
  description: 'Has sido desuscrito de nuestros correos masivos. Ya no recibirás más notificaciones de promociones.',
  robots: {
    index: false, 
    follow: false,
  },
};

export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = searchParams.email || 'tu cuenta de correo';

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-50">
        
        <MailX className="h-16 w-16 text-red-500 mx-auto drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
        
        <h1 className="text-3xl font-extrabold text-white">
          Desuscripción Confirmada
        </h1>
        
        <p className="text-zinc-400 text-lg">
          Lamentamos verte partir. Has sido desuscrito exitosamente de nuestros correos de **Broadcasts** y **Promociones** en la dirección:
        </p>
        
        <p className="font-mono text-amber-400 text-xl break-words p-3 bg-black/30 rounded-lg">
          {email}
        </p>

        <p className="text-sm text-zinc-500">
          *Aún podrías recibir correos transaccionales (confirmaciones de compra, notificaciones de ganador, etc.).
        </p>

        <Link href="/" passHref>
          <Button className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500">
            <Home className="h-5 w-5 mr-2" /> Volver al Inicio
          </Button>
        </Link>
      </div>
    </div>
  );
}