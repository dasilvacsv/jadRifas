'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
// ✅ AÑADIDO: Importar el ícono Gift
import { Gift, Ticket, LayoutGrid, Menu, X, ShieldCheck, Instagram, Facebook, MessageCircle, Trophy } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { TermsModal } from '@/components/TermsModal';
import { WaitlistNavLink } from '@/components/ui/waitlist-nav-link';
import { motion, AnimatePresence } from 'framer-motion';

// ... (El resto de tus componentes como GlobalStyles, NavLink, FloatingWhatsAppButton, etc., permanecen sin cambios)

const phoneNumber = "584249408197";
const message = "¡Hola! Necesito ayuda con mi compra en Jorvilaniña.";
const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

const GlobalStyles = () => (
    <style jsx global>{`
        @keyframes header-line-animation { from { width: 0%; } to { width: 100%; } }
        .header-line::after { content: ''; position: absolute; bottom: -1px; left: 0; height: 1px; background: linear-gradient(90deg, transparent, #fbbf24, transparent); animation: header-line-animation 2s ease-in-out; }
        @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
        @keyframes pulse-glow { 0%, 100% { transform: scale(1); box-shadow: 0 0 10px rgba(251, 191, 36, 0.3); } 50% { transform: scale(1.03); box-shadow: 0 0 20px rgba(251, 191, 36, 0.6); } }
        .animate-pulse-glow { animation: pulse-glow 2.5s infinite ease-in-out; }
    `}</style>
);

const NavLink = ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) => {
    const pathname = usePathname();
    const isActive = href === '/' ? pathname === href : pathname.startsWith(href);
    return (
        <Link href={href} onClick={onClick} className={cn("px-2.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2", isActive ? 'bg-amber-400/10 text-amber-300 ring-1 ring-inset ring-amber-400/20' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white')}>
            {children}
        </Link>
    );
};

const FloatingWhatsAppButton = () => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      title="Contáctanos por WhatsApp"
      className="group fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] shadow-lg shadow-black/40 transition-all duration-300 ease-in-out hover:drop-shadow-[0_0_15px_rgba(37,211,102,0.7)]"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 150, damping: 20, delay: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{ width: isHovered ? 'auto' : 64, paddingLeft: isHovered ? '1.5rem' : '0rem', paddingRight: isHovered ? '2rem' : '0rem' }}
    >
      <span className="absolute inset-0 h-full w-full animate-ping rounded-full bg-[#25D366] opacity-30 group-hover:animate-none"></span>
      <span className="relative flex items-center justify-center">
        <img src="/whatsapp.png" alt="Contactar por WhatsApp" width="32" height="32" />
        <AnimatePresence>
          {isHovered && (
            <motion.span className="ml-3 origin-left whitespace-nowrap text-base font-bold text-white" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2, ease: "easeOut" }}>
              ¿Necesitas ayuda?
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.a>
  );
};

const WhatsAppPopup = ({ isVisible, onClose }: { isVisible: boolean; onClose: () => void; }) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed bottom-24 right-4 left-4 sm:left-auto sm:right-6 z-50 w-auto max-w-sm rounded-lg bg-zinc-900 border border-zinc-700 p-5 shadow-2xl shadow-black/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20, transition: { duration: 0.3 } }}
                    transition={{ type: "spring", stiffness: 150, damping: 20 }}
                >
                    <button onClick={onClose} className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors" aria-label="Cerrar"><X size={18} /></button>
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 text-amber-400 mt-1"><MessageCircle size={24} /></div>
                        <div className="flex-1">
                            <p className="font-bold text-white text-base leading-tight">¿Problemas con tu compra?</p>
                            <p className="text-zinc-400 text-sm mt-1 mb-4">Habla con un asesor para resolver tus dudas al instante.</p>
                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-sm transition-all transform hover:scale-105">
                                <img src="/whatsapp.png" alt="WhatsApp" width="20" height="20" className="mr-2" />
                                Chatear Ahora
                            </a>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default function PublicLayout({ children }: { children: React.ReactNode; }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isPopupVisible, setIsPopupVisible] = useState(false);
    const pathname = usePathname();

    useEffect(() => { setIsMenuOpen(false); }, [pathname]);
    
    useEffect(() => {
        document.body.style.overflow = isMenuOpen ? 'hidden' : 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [isMenuOpen]);

    useEffect(() => {
        const timer = setTimeout(() => { setIsPopupVisible(true); }, 60000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans">
            <GlobalStyles />
            <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative header-line">
                    <div className="flex justify-between items-center h-20 md:h-16">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative h-10 w-10 md:h-9 md:w-9 flex items-center justify-center rounded-full bg-white/90 p-1 shadow-lg group-hover:scale-105 transition-transform duration-300 ease-in-out">
                                <img src="/jorvi.png" alt="Jorvilaniña Logo" className="absolute inset-0 w-full h-full object-contain rounded-full" />
                            </div>
                            <span className="text-xl sm:text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400 group-hover:from-white group-hover:to-zinc-300 transition-colors duration-300">Jorvilaniña</span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-1 bg-zinc-900/50 border border-zinc-800/50 rounded-full px-2 py-1 shadow-inner shadow-black/20">
                            <NavLink href="/"><LayoutGrid className="h-4 w-4" /> Inicio</NavLink>
                            {/* ELIMINADO: <NavLink href="/#resultados"><Ticket className="h-4 w-4" /> Resultados</NavLink> */}
                            <NavLink href="/mis-tickets"><Ticket className="h-4 w-4" /> Mis Tickets</NavLink>
                            <NavLink href="/top-compradores"><Trophy className="h-4 w-4" /> Top Compradores</NavLink>
                            {/* ✅ AÑADIDO: Enlace a "Referidos" en la navegación principal */}
                            <NavLink href="/referidos"><Gift className="h-4 w-4" /> Referidos</NavLink>
                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 text-zinc-400 hover:bg-zinc-800/60 hover:text-white">
                                <img src="/whatsapp.png" alt="Ayuda por WhatsApp" width="16" height="16" />
                                Ayuda
                            </a>
                        </nav>
                        
                        <div className="hidden lg:flex items-center gap-4">
                            <img src="/conalot.png" alt="Conalot Logo" width="65" className="object-contain" />
                            <img src="/tachira.png" alt="Lotería del Táchira Logo" width="65" className="object-contain" />
                            <img src="/super-gana.png" alt="Super Gana Logo" width="65" className="object-contain" />
                        </div>
                        
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Link href="/mis-tickets">
                                <Button className="h-9 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-full shadow-md hover:shadow-lg hover:shadow-amber-600/30 transition-all duration-300 transform hover:-translate-y-px px-3 sm:px-4">
                                    <Ticket className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Mis Tickets</span>
                                </Button>
                            </Link>

                            <a 
                                href={whatsappUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="md:hidden"
                                aria-label="Contactar por WhatsApp"
                            >
                                <Button variant="ghost" size="icon" className="text-white hover:bg-zinc-800/50 rounded-lg p-0 flex items-center justify-center">
                                    <img src="/whatsapp.png" alt="WhatsApp" width="24" height="24" className="h-6 w-6" />
                                </Button>
                            </a>

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

            {isMenuOpen && (
                <div className="md:hidden fixed inset-0 top-20 z-40 bg-zinc-950/95 backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-300">
                    <div className="flex flex-col items-center justify-center h-full gap-y-6 px-8">
                        <NavLink href="/" onClick={() => setIsMenuOpen(false)}><LayoutGrid className="h-5 w-5" /> <span className="text-lg">Inicio</span></NavLink>
                        {/* ELIMINADO: <NavLink href="/#resultados" onClick={() => setIsMenuOpen(false)}><Ticket className="h-5 w-5" /> <span className="text-lg">Resultados</span></NavLink> */}
                        <NavLink href="/mis-tickets" onClick={() => setIsMenuOpen(false)}><Ticket className="h-5 w-5" /> <span className="text-lg">Mis Tickets</span></NavLink>
                        <NavLink href="/top-compradores" onClick={() => setIsMenuOpen(false)}><Trophy className="h-5 w-5" /> <span className="text-lg">Top Compradores</span></NavLink>
                        {/* ✅ AÑADIDO: Enlace a "Referidos" en el menú móvil */}
                        <NavLink href="/referidos" onClick={() => setIsMenuOpen(false)}><Gift className="h-5 w-5" /> <span className="text-lg">Referidos</span></NavLink>
                        
                        <div className="w-full max-w-xs pt-8 flex flex-col gap-4">
                            <Link href="/mis-tickets" className="w-full">
                                <Button size="lg" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-full py-6 text-base">
                                    <Ticket className="h-5 w-5 mr-2" /> Consultar Tickets
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <main>{children}</main>

            <footer className="bg-black border-t border-zinc-800/50 overflow-hidden">
                 <div className="relative max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                      <div className="absolute inset-0 z-0 opacity-15 mix-blend-lighten">
                          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500 rounded-full filter blur-3xl animate-blob"></div>
                          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-orange-600 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
                      </div>
                      <div className="absolute inset-0 z-0 bg-grid-white/[0.03]"></div>
                      <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">
                          <div className="space-y-4 md:col-span-2 flex flex-col items-center md:items-start">
                              <div className="flex items-center gap-4">
                                  <div className="relative h-12 w-12 flex items-center justify-center rounded-full bg-white/90 p-1">
                                      <img src="/jorvi.png" alt="Jorvilaniña Logo" className="absolute inset-0 w-full h-full object-contain rounded-full" />
                                  </div>
                                  <span className="text-xl font-bold text-white">Jorvilaniña</span>
                              </div>
                              <p className="text-zinc-400 text-sm max-w-xs">La plataforma más segura y emocionante para participar en rifas y ganar premios increíbles. ¡Tu suerte te espera!</p>
                              <div className="pt-6 w-full">
                                  <h3 className="text-sm font-semibold text-zinc-300 tracking-wider uppercase">Nos Respaldan</h3>
                                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                                      <img src="/conalot.png" alt="Conalot Logo" width="90" height="30" className="object-contain" />
                                      <img src="/tachira.png" alt="Lotería del Táchira Logo" width="90" height="30" className="object-contain" />
                                      <img src="/super-gana.png" alt="Super Gana Logo" width="90" height="30" className="object-contain" />
                                  </div>
                              </div>
                          </div>
                          <div>
                              <h3 className="text-sm font-semibold text-zinc-300 tracking-wider uppercase">Navegación</h3>
                              <ul className="mt-4 space-y-3">
                                  <li><Link href="/" className="text-base text-zinc-400 hover:text-amber-400 transition-colors">Inicio</Link></li>
                                  <li><Link href="/mis-tickets" className="text-base text-zinc-400 hover:text-amber-400 transition-colors">Mis Tickets</Link></li>
                                  {/* ELIMINADO: <li><Link href="/#resultados" className="text-base text-zinc-400 hover:text-amber-400 transition-colors">Ganadores</Link></li> */}
                                  <li><Link href="/top-compradores" className="text-base text-zinc-400 hover:text-amber-400 transition-colors">Top Compradores</Link></li>
                                  {/* ✅ AÑADIDO: Enlace a "Referidos" en el footer */}
                                  <li><Link href="/referidos" className="text-base text-zinc-400 hover:text-amber-400 transition-colors">Programa de Referidos</Link></li>
                              </ul>
                          </div>
                          <div>
                              <h3 className="text-sm font-semibold text-zinc-300 tracking-wider uppercase">Síguenos</h3>
                              <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
                                  <a href="https://www.instagram.com/llevateloconjorvi/" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors"><Instagram className="h-5 w-5"/></a>
                                  <a href="https://www.facebook.com/profile.php?id=61580658556320" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors"><Facebook className="h-5 w-5"/></a>
                                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors">
                                      <img src="/whatsapp.png" alt="Contacto por WhatsApp" width="20" height="20"/>
                                  </a>
                              </div>
                          </div>
                      </div>
                      <div className="relative z-10 mt-16 pt-8 border-t border-zinc-800/50 text-center text-sm text-zinc-500 space-y-2 md:space-y-0 md:flex md:items-center md:justify-center md:gap-4">
                          <p>&copy; {new Date().getFullYear()} Jorvilaniña. Todos los derechos reservados.</p>
                          <span className="hidden md:inline">|</span>
                          <TermsModal>
                              <button className="underline hover:text-amber-400 transition-colors">Términos y Condiciones</button>
                          </TermsModal>
                      </div>
                 </div>
            </footer>

            <WhatsAppPopup isVisible={isPopupVisible} onClose={() => setIsPopupVisible(false)} />
            <FloatingWhatsAppButton />
        </div>
    );
}