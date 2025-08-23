import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Gift, Ticket, Home } from 'lucide-react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                RifaSystem
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
              >
                <Home className="h-4 w-4" />
                Inicio
              </Link>
              <Link 
                href="/mis-tickets"
                className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
              >
                <Ticket className="h-4 w-4" />
                Mis Tickets
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Gift className="h-6 w-6" />
              <span className="text-xl font-bold">RifaSystem</span>
            </div>
            <p className="text-gray-400 mb-4">
              Sistema de rifas seguro y transparente
            </p>
            <div className="flex justify-center gap-6 text-sm text-gray-400">
              <Link href="#" className="hover:text-white transition-colors">
                Términos y Condiciones
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Política de Privacidad
              </Link>
              <Link href="/auth/login" className="hover:text-white transition-colors">
                Panel de Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}