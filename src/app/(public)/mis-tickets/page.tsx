import { FindMyTicketsForm } from '@/components/forms/FindMyTicketsForm';
import { ArrowLeft, Ticket } from 'lucide-react';
import Link from 'next/link';

export default function MyTicketsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Encabezado de la Página */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Ticket className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Mis Tickets
              </h1>
              <p className="text-sm text-gray-500">
                Encuentra todas tus compras y números de la suerte aquí.
              </p>
            </div>
          </div>
          <Link href="/">
            <div className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </div>
          </Link>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800">
              Consulta el Estado de tu Compra
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Ingresa el correo electrónico que utilizaste al comprar para ver tus tickets. 
              Recuerda que si tu compra está pendiente, los números aparecerán una vez sea aprobada.
            </p>
          </div>

          {/* El formulario ahora se renderiza en el área de contenido principal */}
          <FindMyTicketsForm />
        </div>
      </main>
    </div>
  );
}