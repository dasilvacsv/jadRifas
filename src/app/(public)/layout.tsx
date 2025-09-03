'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Gift, Ticket, LayoutGrid, Menu, X, ShieldCheck, Instagram, Facebook, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { AdminAuthDialog } from '@/components/admin/AdminAuthDialog';
import { cn } from '@/lib/utils';
import { TermsModal } from '@/components/TermsModal'; 
import { WaitlistNavLink } from '@/components/ui/waitlist-nav-link';// <-- Importación añadida

// ✅ Estilos globales para las animaciones
const GlobalStyles = () => (
    <style jsx global>{`
        @keyframes header-line-animation {
            from { width: 0%; }
            to { width: 100%; }
        }
        .header-line::after {
            content: '';
            position: absolute;
            bottom: -1px; /* Posicionado justo en el borde */
            left: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, #fbbf24, transparent);
            animation: header-line-animation 2s ease-in-out;
        }
        @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
        }

         @keyframes pulse-glow {
            0%, 100% {
                transform: scale(1);
                box-shadow: 0 0 10px rgba(251, 191, 36, 0.3);
            }
            50% {
                transform: scale(1.03);
                box-shadow: 0 0 20px rgba(251, 191, 36, 0.6);
            }
        }
        .animate-pulse-glow {
            animation: pulse-glow 2.5s infinite ease-in-out;
        }
    `}</style>
);

// Componente NavLink con estilos refinados
const NavLink = ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) => {
    const pathname = usePathname();
    const isActive = href === '/' ? pathname === href : pathname.startsWith(href);

    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2",
                isActive
                    ? 'bg-amber-400/10 text-amber-300 ring-1 ring-inset ring-amber-400/20' // Estado activo más vistoso
                    : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
            )}
        >
            {children}
        </Link>
    );
};

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);
    
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isMenuOpen]);

    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans">
            <GlobalStyles />
            {/* ✅ MEJORA: Header con línea inferior animada */}
            <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative header-line">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo con transición mejorada */}
                        <Link href="/" className="flex items-center gap-4 group">
                            <div className="relative h-12 w-12 flex items-center justify-center rounded-full bg-white/90 p-1 shadow-lg group-hover:scale-105 transition-transform duration-300 ease-in-out">
                                <Image 
                                    src="/jorvi.png" 
                                    alt="Jorvilaniña Logo" 
                                    fill 
                                    className="object-contain rounded-full"
                                    sizes="48px"
                                />
                            </div>
                            <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400 group-hover:from-white group-hover:to-zinc-300 transition-colors duration-300">
                                Jorvilaniña
                            </span>
                        </Link>

                        {/* Navegación principal para desktop */}
                        <nav className="hidden md:flex items-center gap-2 bg-zinc-900/50 border border-zinc-800/50 rounded-full px-2 py-1.5 shadow-inner shadow-black/20">
                            <NavLink href="/"><LayoutGrid className="h-4 w-4" /> Inicio</NavLink>
                            <NavLink href="/#resultados"><Ticket className="h-4 w-4" /> Resultados</NavLink>
                             <WaitlistNavLink href="/unete">
        <Sparkles className="h-4 w-4" /> ¡Únete!
    </WaitlistNavLink>
                        </nav>
                        
                        {/* Logos de Loterías con tamaño ajustado */}
                        <div className="hidden lg:flex items-center gap-6">
                            <Image src="/conalot.png" alt="Conalot Logo" width={70} height={25} className="object-contain" />
                            <Image src="/tachira.png" alt="Lotería del Táchira Logo" width={70} height={25} className="object-contain" />
                            <Image src="/super-gana.png" alt="Super Gana Logo" width={70} height={25} className="object-contain" />
                        </div>
                        
                        {/* Botones de acción adaptativos */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Link href="/mis-tickets">
                                 <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-full shadow-md hover:shadow-lg hover:shadow-amber-600/30 transition-all duration-300 transform hover:-translate-y-px px-3 sm:px-5">
                                     <Ticket className="h-5 w-5 sm:mr-2" />
                                     <span className="hidden sm:inline">Mis Tickets</span>
                                 </Button>
                            </Link>

                            <AdminAuthDialog>
                                 <Button variant="outline" className="bg-transparent text-zinc-300 border-zinc-700/80 hover:bg-zinc-800 hover:text-amber-400 hover:border-amber-900/50 rounded-full transition-colors duration-300 px-3 sm:px-4">
                                     <ShieldCheck className="h-5 w-5 sm:mr-2" />
                                     <span className="hidden sm:inline">Admin</span>
                                 </Button>
                            </AdminAuthDialog>
                            
                            {/* Botón del menú móvil */}
                            <div className="md:hidden">
                                <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white hover:bg-zinc-800/50 rounded-lg">
                                    <span className="sr-only">Abrir menú</span>
                                    {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ✅ MEJORA: Menú móvil con animación más suave */}
            {isMenuOpen && (
                <div 
                    className="md:hidden fixed inset-0 top-20 z-40 bg-zinc-950/95 backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-300"
                >
                    <div className="flex flex-col items-center justify-center h-full gap-y-6 px-8">
                        <NavLink href="/" onClick={() => setIsMenuOpen(false)}><LayoutGrid className="h-5 w-5" /> <span className="text-lg">Inicio</span></NavLink>
                        <NavLink href="/#resultados" onClick={() => setIsMenuOpen(false)}><Ticket className="h-5 w-5" /> <span className="text-lg">Resultados</span></NavLink>
                         <WaitlistNavLink href="/unete">
        <Sparkles className="h-4 w-4" /> ¡Únete!
    </WaitlistNavLink>
                        
                        <div className="w-full max-w-xs pt-8 flex flex-col gap-4">
                             <Link href="/mis-tickets" className="w-full">
                                 <Button size="lg" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-full py-6 text-base">
                                     <Ticket className="h-5 w-5 mr-2" />
                                     Consultar Tickets
                                 </Button>
                             </Link>

                            <AdminAuthDialog>
                                <Button size="lg" variant="outline" className="w-full bg-transparent text-zinc-300 border-zinc-700 hover:bg-zinc-800 hover:text-amber-400 rounded-full py-6 text-base transition-colors duration-300">
                                    <ShieldCheck className="h-5 w-5 mr-2" />
                                    Panel de Admin
                                </Button>
                            </AdminAuthDialog>
                        </div>
                    </div>
                </div>
            )}

            <main>{children}</main>

            {/* ✅ MEJORA: Footer con sección de redes sociales y efectos visuales refinados */}
            <footer className="bg-black border-t border-zinc-800/50 overflow-hidden">
                 <div className="relative max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                        {/* Efecto Aurora refinado */}
                        <div className="absolute inset-0 z-0 opacity-15 mix-blend-lighten">
                            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500 rounded-full filter blur-3xl animate-blob"></div>
                            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-orange-600 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
                        </div>

                        <div className="absolute inset-0 z-0 bg-grid-white/[0.03]"></div>
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-12">
                            <div className="space-y-4 md:col-span-2">
                                <div className="flex items-center gap-4">
                                    <div className="relative h-12 w-12 flex items-center justify-center rounded-full bg-white/90 p-1">
                                        <Image 
                                             src="/jorvi.png" 
                                             alt="Jorvilaniña Logo" 
                                             fill 
                                             className="object-contain rounded-full"
                                             sizes="48px"
                                        />
                                    </div>
                                    <span className="text-xl font-bold text-white">Jorvilaniña</span>
                                </div>
                                <p className="text-zinc-400 text-sm max-w-xs">
                                     La plataforma más segura y emocionante para participar en rifas y ganar premios increíbles. ¡Tu suerte te espera!
                                </p>

                                {/* Logos de respaldo en el footer */}
                                <div className="pt-6">
                                    <h3 className="text-sm font-semibold text-zinc-300 tracking-wider uppercase">Nos Respaldan</h3>
                                    <div className="flex items-center gap-6 mt-4">
                                        <Image src="/conalot.png" alt="Conalot Logo" width={120} height={40} className="object-contain" />
                                        <Image src="/tachira.png" alt="Lotería del Táchira Logo" width={120} height={40} className="object-contain" />
                                        <Image src="/super-gana.png" alt="Super Gana Logo" width={120} height={40} className="object-contain" />
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-300 tracking-wider uppercase">Navegación</h3>
                                <ul className="mt-4 space-y-3">
                                    <li><Link href="/" className="text-base text-zinc-400 hover:text-amber-400 transition-colors">Inicio</Link></li>
                                    <li><Link href="/mis-tickets" className="text-base text-zinc-400 hover:text-amber-400 transition-colors">Mis Tickets</Link></li>
                                    <li><Link href="/#resultados" className="text-base text-zinc-400 hover:text-amber-400 transition-colors">Ganadores</Link></li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-zinc-300 tracking-wider uppercase">Síguenos</h3>
                                <div className="flex items-center gap-4 mt-4">
                                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors"><Instagram className="h-6 w-6"/></a>
                                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors"><Facebook className="h-6 w-6"/></a>
                                </div>
                            </div>
                        </div>
                        
                        {/* ▼▼▼ SECCIÓN MODIFICADA CON EL MODAL ▼▼▼ */}
                        <div className="relative z-10 mt-16 pt-8 border-t border-zinc-800/50 text-center text-sm text-zinc-500 space-y-2 md:space-y-0 md:flex md:items-center md:justify-center md:gap-4">
                            <p>&copy; {new Date().getFullYear()} Jorvilaniña. Todos los derechos reservados.</p>
                            <span className="hidden md:inline">|</span>
                            {/* AQUÍ ESTÁ EL MODAL */}
                            <TermsModal>
                                <button className="underline hover:text-amber-400 transition-colors">
                                    Términos y Condiciones
                                </button>
                            </TermsModal>
                        </div>
                         {/* ▲▲▲ FIN SECCIÓN MODIFICADA ▲▲▲ */}
                 </div>
            </footer>
        </div>
    );
}