// En la página para buscar tickets, por ejemplo app/mis-tickets/page.tsx

import { FindMyTicketsForm } from '@/components/forms/FindMyTicketsForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next'; // 👈 1. Importa Metadata

// 👇 2. Añade el objeto de metadatos
export const metadata: Metadata = {
  title: 'Busca Tus Tickets', // El layout añadirá "| Llevatelo con Jorvi"
  description: 'Encuentra fácilmente los tickets de rifa que has comprado. Ingresa tu información para ver tus números de la suerte.',
  // Le decimos a Google que no indexe esta página en los resultados de búsqueda.
  robots: {
    index: false, 
    follow: true,
  },
};

export default function MyTicketsPage() {
  return (
    <div>
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