import { FindMyTicketsForm } from '@/components/forms/FindMyTicketsForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MyTicketsPage() {
  return (
    <div>
      {/* El componente FindMyTicketsForm ahora controla todo el estilo de la página, 
        incluyendo el fondo oscuro y los efectos animados.
        Simplemente lo renderizamos aquí.
      */}

      {/* Botón para volver al inicio, estilizado para el nuevo tema */}
      <Link href="/" passHref>
        <Button
          variant="ghost"
          className="absolute top-6 left-6 z-20 h-11 w-11 rounded-full bg-slate-900/50 text-slate-300 hover:bg-slate-800/80 hover:text-white backdrop-blur-sm transition-all"
          aria-label="Volver al inicio"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </Link>

      <FindMyTicketsForm />
    </div>
  );
}