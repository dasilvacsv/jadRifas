'use client'

// --- DEPENDENCIAS ---
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Ticket, Gift, Clock, Sparkles, ChevronLeft, ChevronRight, X, CheckCircle, Trophy, CalendarOff, Star } from 'lucide-react';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
// ✅ --- INICIO DE CAMBIOS: Importar el nuevo componente ---
import { FloatingWhatsAppButton } from '@/components/whatsapp/FloatingWhatsAppButton'; // Asegúrate de que la ruta sea correcta
// ✅ --- FIN DE CAMBIOS ---


// --- INTERFACES DE DATOS ---
export interface RaffleImage {
    id: string;
    url: string;
    raffleId: string;
}
export interface Purchase {
    id: string;
    buyerName: string | null;
    buyerEmail: string;
    buyerPhone: string | null;
    amount: string;
    status: "pending" | "confirmed" | "rejected";
    paymentReference: string | null;
    paymentScreenshotUrl: string | null;
    paymentMethod: string | null;
    ticketCount: number;
    createdAt: Date;
    raffleId: string;
}
export interface WinnerTicket {
    id:string;
    ticketNumber: string;
    raffleId: string;
    purchaseId: string | null;
    status: "available" | "reserved" | "sold";
    reservedUntil: Date | null;
    purchase: Purchase | null;
}
export interface ActiveRaffle {
    id: string;
    name: string;
    description: string | null;
    price: string;
    currency: 'USD' | 'VES';
    minimumTickets: number;
    status: "active" | "finished" | "cancelled" | "draft" | "postponed";
    createdAt: Date;
    updatedAt: Date;
    limitDate: Date;
    winnerTicketId: string | null;
    winnerLotteryNumber: string | null;
    images: RaffleImage[];
    tickets: Array<{ id: string }>;
}
export interface FinishedRaffle {
    id: string;
    name: string;
    description: string | null;
    price: string;
    currency: 'USD' | 'VES';
    minimumTickets: number;
    status: "active" | "finished" | "cancelled" | "draft" | "postponed";
    createdAt: Date;
    updatedAt: Date;
    limitDate: Date;
    winnerTicketId: string | null;
    winnerLotteryNumber: string | null;
    winnerProofUrl: string | null;
    images: RaffleImage[];
    winnerTicket: WinnerTicket | null;
}
export interface PaymentMethod {
    id: string;
    title: string;
    iconUrl: string | null;
}
interface HomePageProps {
    activeRaffles: ActiveRaffle[];
    finishedRaffles: FinishedRaffle[];
    paymentMethods: PaymentMethod[];
}

// --- UTILITIES ---
const formatCurrency = (amount: string, currency: 'USD' | 'VES') => {
    const value = parseFloat(amount);
    if (isNaN(value)) return currency === 'USD' ? '$0.00' : 'Bs. 0,00';
    return currency === 'USD'
        ? `$${value.toFixed(2)}`
        : `Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
};

const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-VE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// --- ESTILOS GLOBALES PARA ANIMACIONES Y DETALLES ---
const GlobalStyles = () => (
    <style jsx global>{`
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes blob {
      0% { transform: translate(0px, 0px) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    @keyframes border-spin {
        from { transform: translate(-50%, -50%) rotate(0deg); }
        to { transform: translate(-50%, -50%) rotate(360deg); }
    }
    .fade-in-anim { animation: fade-in 0.3s ease-out forwards; }
    .scale-in-anim { animation: scale-in 0.3s ease-out forwards; }
    .blob-anim { animation: blob 7s infinite; }
    .animation-delay-4000 { animation-delay: 4s; }

    /* Borde animado para ActiveRaffleCard (púrpura/rosa) */
    .animated-border::before {
        content: ''; position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%); width: 150%; height: 150%;
        background: conic-gradient(from 0deg, transparent 70%, #8b5cf6, #ec4899, transparent 100%);
        animation: border-spin 5s linear infinite; z-index: -1;
    }
    /* Borde animado para WinnerCard (ámbar/amarillo) */
    .animated-border-winner::before {
        content: ''; position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%); width: 150%; height: 150%;
        background: conic-gradient(from 0deg, transparent 70%, #f59e0b, #fbbf24, transparent 100%);
        animation: border-spin 5s linear infinite; z-index: -1;
    }
    /* Borde animado para JorviHeroCard (dorado/ámbar) */
    .animated-border-jorvi::before {
        content: ''; position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%); width: 150%; height: 150%;
        background: conic-gradient(from 0deg, transparent 70%, #FBBF24, #F59E0B, transparent 100%); 
        animation: border-spin 5s linear infinite; z-index: -1;
    }

    .text-gold-gradient {
        background: linear-gradient(120deg, #FDE047 10%, #F59E0B 50%, #D97706 90%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-fill-color: transparent;
    }
    .golden-bevel {
        box-shadow: 
            inset 0 2px 2px rgba(255, 255, 255, 0.25), 
            inset 0 -2px 2px rgba(0, 0, 0, 0.25),
            0 5px 15px rgba(0, 0, 0, 0.5);
    }
    /* --- ✨ SISTEMA DE PARTÍCULAS MEJORADO PARA JORVI CARD ✨ --- */
    .sparkle-particles {
        position: absolute; top: 0; left: 0;
        width: 100%; height: 100%; overflow: hidden; pointer-events: none;
    }
    .sparkle {
        position: absolute; background-color: #FBBF24;
        border-radius: 50%; animation: sparkle-anim 5s linear infinite;
        opacity: 0; box-shadow: 0 0 5px #FBBF24, 0 0 10px #FBBF24;
    }
    @keyframes sparkle-anim {
        0% { transform: translateY(0) scale(0); opacity: 0.8; }
        80% { opacity: 1; }
        100% { transform: translateY(-150px) scale(0.8); opacity: 0; }
    }
    .sparkle:nth-child(1) { top: 20%; left: 15%; animation-delay: 0s; width: 2px; height: 2px; }
    .sparkle:nth-child(2) { top: 50%; left: 30%; animation-delay: 0.5s; width: 3px; height: 3px; }
    .sparkle:nth-child(3) { top: 80%; left: 10%; animation-delay: 1.2s; width: 1px; height: 1px; }
    .sparkle:nth-child(4) { top: 30%; left: 50%; animation-delay: 2.1s; width: 2px; height: 2px; }
    .sparkle:nth-child(5) { top: 60%; left: 85%; animation-delay: 1.8s; width: 3px; height: 3px; }
    .sparkle:nth-child(6) { top: 90%; left: 95%; animation-delay: 2.5s; width: 1px; height: 1px; }
    .sparkle:nth-child(7) { top: 10%; left: 70%; animation-delay: 3s; width: 2px; height: 2px; }
    .sparkle:nth-child(8) { top: 40%; left: 5%; animation-delay: 3.5s; width: 1px; height: 1px; }
    .sparkle:nth-child(9) { top: 75%; left: 60%; animation-delay: 0.8s; width: 3px; height: 3px; }
    .sparkle:nth-child(10) { top: 55%; left: 40%; animation-delay: 4s; width: 2px; height: 2px; }

    /* Estilo para las tarjetas de pago con hover */
    .payment-icon-wrapper {
        position: relative;
        overflow: hidden;
    }
    .payment-icon-wrapper::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        padding: 1px; /* grosor del borde */
        background: linear-gradient(45deg, #FDE047, #BF953F, #FDE047);
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
    }
    .payment-icon-wrapper:hover::before {
        opacity: 1;
    }

    .floating-ticket-container {
        position: absolute;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: visible;
    }
    .floating-ticket {
        position: absolute;
        filter: drop-shadow(0 5px 10px rgba(0,0,0,0.5));
    }
    /* ✅ NUEVO: Estilo para el fondo del universo */
    .universe-background {
        background-image: url('/space-background.jpg'); /* Asegúrate de tener esta imagen en tu carpeta public */
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
    }
    `}</style>
);

// --- COMPONENTES AUXILIARES ---

const CountdownTimer = ({ targetDate }: { targetDate: Date }) => {
    const [hasMounted, setHasMounted] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => { setHasMounted(true); }, []);

    useEffect(() => {
        if (hasMounted) {
            const calculateTime = () => {
                const difference = +new Date(targetDate) - +new Date();
                if (difference > 0) {
                    setTimeLeft({
                        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                        minutes: Math.floor((difference / 1000 / 60) % 60),
                        seconds: Math.floor((difference / 1000) % 60),
                    });
                } else {
                    setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                }
            };
            
            // Run once immediately
            calculateTime();
            
            // Then set up interval
            const timer = setInterval(calculateTime, 1000);
            return () => clearInterval(timer);
        }
    }, [hasMounted, targetDate]);

    const timeUnits = hasMounted ? timeLeft : { days: 0, hours: 0, minutes: 0, seconds: 0 };

    return (
        <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
            <Clock className="h-5 w-5 text-amber-400 flex-shrink-0" />
            <div className="flex items-end gap-3 min-h-[28px] w-full justify-between">
                     <>
                        {timeUnits.days > 0 && (
                            <div className="flex items-end leading-none">
                                <span className="text-2xl font-bold text-white">{String(timeUnits.days).padStart(2, '0')}</span>
                                <span className="text-zinc-500 ml-1 mb-0.5">d</span>
                            </div>
                        )}
                        <span className="text-2xl font-bold text-white">{String(timeUnits.hours).padStart(2, '0')}</span><span className="text-zinc-500 -mx-2">:</span>
                        <span className="text-2xl font-bold text-white">{String(timeUnits.minutes).padStart(2, '0')}</span><span className="text-zinc-500 -mx-2">:</span>
                        <span className="text-2xl font-bold text-amber-400">{String(timeUnits.seconds).padStart(2, '0')}</span>
                    </>
            </div>
        </div>
    );
};

const RaffleImagesCarousel = ({ images, raffleName }: { images: RaffleImage[], raffleName: string }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const handleNext = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setCurrentIndex((prev) => (prev + 1) % images.length); };
    const handlePrev = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setCurrentIndex((prev) => (prev - 1 + images.length) % images.length); };

    if (!images || images.length === 0) {
        return <div className="aspect-video w-full bg-black/20 flex items-center justify-center rounded-t-xl"><Gift className="h-16 w-16 text-white/10"/></div>;
    }

    return (
        <div className="relative group/carousel aspect-video w-full overflow-hidden rounded-t-xl">
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
            <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                {images.map(image => (
                    <div key={image.id} className="relative w-full flex-shrink-0 aspect-video">
                        <Image src={image.url} alt={raffleName} fill className="object-cover transition-transform duration-500 group-hover:scale-110"/>
                    </div>
                ))}
            </div>
            {images.length > 1 && (<>
                <Button variant="ghost" size="icon" className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur-sm transition-all duration-300 z-20 opacity-0 group-hover/carousel:opacity-100" onClick={handlePrev}><ChevronLeft className="h-6 w-6" /></Button>
                <Button variant="ghost" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur-sm transition-all duration-300 z-20 opacity-0 group-hover/carousel:opacity-100" onClick={handleNext}><ChevronRight className="h-6 w-6" /></Button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                    {images.map((_, i) => (
                        <button key={i} onClick={(e) => {e.preventDefault(); e.stopPropagation(); setCurrentIndex(i);}} className={`h-1.5 w-6 rounded-full transition-all duration-300 ${currentIndex === i ? 'bg-white w-8' : 'bg-white/40'}`}></button>
                    ))}
                </div>
            </>)}
        </div>
    );
};

const ActiveRaffleCard = ({ raffle, isFeatured = false }: { raffle: ActiveRaffle, isFeatured?: boolean }) => {
    const ticketsSold = raffle.tickets.length;
    const progress = Math.min((ticketsSold / raffle.minimumTickets) * 100, 100);

    // ✅ NUEVO: Estado para saber si el contador de la rifa ha terminado.
    const [isTimerFinished, setIsTimerFinished] = useState(false);

    useEffect(() => {
        const checkTime = () => {
            const difference = +new Date(raffle.limitDate) - +new Date();
            setIsTimerFinished(difference <= 0);
        };
        checkTime(); // Verificar al montar
        const intervalId = setInterval(checkTime, 1000); // Verificar cada segundo
        return () => clearInterval(intervalId); // Limpiar al desmontar
    }, [raffle.limitDate]);

    return (
        <div className={`group relative rounded-2xl p-px overflow-hidden animated-border ${isFeatured ? 'sm:col-span-full' : ''}`}>
            <Link href={`/rifa/${raffle.id}`} className="block h-full">
                <Card className="relative bg-zinc-900/80 backdrop-blur-md border-none rounded-[15px] overflow-hidden h-full flex flex-col shadow-2xl shadow-black/40 transition-all duration-300">
                    <CardHeader className="p-0 relative">
                        {/* ✅ NUEVO: Badge que aparece cuando el timer termina */}
                        {isTimerFinished && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] z-30 pointer-events-none">
                                <div className="bg-sky-500/95 text-white text-sm font-bold px-4 py-2.5 rounded-xl backdrop-blur-sm border border-sky-300/60 shadow-lg flex items-center justify-center animate-pulse">
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    ¡El sorteo está por comenzar!
                                </div>
                            </div>
                        )}
                        <RaffleImagesCarousel images={raffle.images} raffleName={raffle.name} />
                        {isFeatured && (
                               <Badge className="absolute top-4 left-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-1.5 px-4 border border-purple-300/50 shadow-lg shadow-black/30 animate-pulse">
                                   <Star className="h-4 w-4 mr-2" /> RIFA ESTRELLA
                               </Badge>
                        )}
                        <Badge variant="secondary" className="absolute top-4 right-4 bg-black/50 text-amber-300 font-semibold py-1 px-3 border border-amber-300/20 backdrop-blur-sm">
                            <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-400" /> ¡EN VIVO!
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-5 flex-grow flex flex-col">
                        <h3 className={`font-bold text-white line-clamp-2 group-hover:text-amber-300 transition-colors duration-300 leading-tight mb-3 ${isFeatured ? 'text-3xl' : 'text-xl'}`}>
                            {raffle.name}
                        </h3>
                        {raffle.description && (
                            <p className="text-zinc-400 text-sm line-clamp-2 mb-4">{raffle.description}</p>
                        )}
                        <div className="mt-auto space-y-5 pt-4">
                            <div>
                                {/* ✅ MODIFICADO: Ahora solo muestra el porcentaje a la derecha */}
                                <div className="flex justify-end items-center text-xs mb-1.5">
                                    <span className="font-bold text-white">{progress.toFixed(0)}% Vendido</span>
                                </div>
                                <Progress value={progress} className="h-2 bg-white/10 rounded-full border border-white/10 overflow-hidden [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-500" />
                            </div>
                            <CountdownTimer targetDate={raffle.limitDate} />
                        </div>
                    </CardContent>
                    <CardFooter className="p-5 pt-4 flex flex-wrap gap-4 justify-between items-center bg-black/20 border-t border-white/10">
                        <div className='flex flex-col'>
                            <p className="text-xs text-zinc-400">Precio por ticket</p>
                            <p className="text-3xl font-extrabold text-white leading-none">{formatCurrency(raffle.price, raffle.currency)}</p>
                        </div>
                        <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-xl px-8 py-6 text-base shadow-lg shadow-black/40 transition-all duration-300 ease-out group-hover:scale-105 group-hover:drop-shadow-[0_0_15px_theme(colors.amber.500)]">
                                 <Ticket className="h-5 w-5 mr-2.5"/>
                                 Participar Ahora
                        </Button>
                    </CardFooter>
                </Card>
            </Link>
        </div>
    );
};

const PaymentIcon = ({ method, index }: { method: PaymentMethod, index: number }) => (
    <motion.div
        title={method.title}
        className="relative h-10 w-10 rounded-xl bg-white/5 p-1 flex items-center justify-center ring-1 ring-white/10 backdrop-blur-sm golden-bevel payment-icon-wrapper cursor-pointer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 + index * 0.1, ease: "easeOut" }}
        whileHover={{ scale: 1.15, boxShadow: '0 0 20px rgba(251, 191, 36, 0.7)' }}
        whileTap={{ scale: 0.95 }}
    >
        <Image
            src={method.iconUrl || ''}
            alt={method.title}
            width={28}
            height={28}
            className="object-contain"
        />
    </motion.div>
);

const DecorativeSeparator = () => (
    <motion.div
        className="relative w-3/4 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent my-4"
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: '75%' }}
        transition={{ duration: 0.8, delay: 0.8, ease: "easeInOut" }}
    >
        <motion.span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-amber-400"
            animate={{
                boxShadow: ['0 0 5px rgba(251, 191, 36, 0.5)', '0 0 20px rgba(251, 191, 36, 0.8)', '0 0 5px rgba(251, 191, 36, 0.5)'],
                scale: [1, 1.2, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
    </motion.div>
);

const JorviHeroCard = ({ paymentMethods }: { paymentMethods: PaymentMethod[] }) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const cardX = useSpring(0, { stiffness: 400, damping: 40 });
    const cardY = useSpring(0, { stiffness: 400, damping: 40 });
    
    const rotateX = useTransform(cardY, [-0.5, 0.5], ['10deg', '-10deg']);
    const rotateY = useTransform(cardX, [-0.5, 0.5], ['-10deg', '10deg']);
    
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX_val = e.clientX - rect.left;
        const mouseY_val = e.clientY - rect.top;
        const xPct = (mouseX_val / rect.width) - 0.5;
        const yPct = (mouseY_val / rect.height) - 0.5;
        cardX.set(xPct);
        cardY.set(yPct);
        mouseX.set(mouseX_val);
        mouseY.set(mouseY_val);
    };
    
    const handleMouseLeave = () => {
        cardX.set(0);
        cardY.set(0);
    };

    const ticketPositions = [
        { x: "-10%", y: "15%", rotate: -20, delay: 0.6, size: 80 },
        { x: "80%", y: "5%", rotate: 15, delay: 0.8, size: 90 },
        { x: "20%", y: "85%", rotate: -5, delay: 1.0, size: 70 },
        { x: "90%", y: "70%", rotate: 25, delay: 1.2, size: 100 },
        { x: "40%", y: "-10%", rotate: 5, delay: 1.4, size: 75 },
        { x: "-20%", y: "60%", rotate: 22, delay: 1.6, size: 85 },
    ];

    return (
        <div className="relative" style={{ perspective: '1000px' }}>
            <div className="absolute inset-0 floating-ticket-container">
                {ticketPositions.map((pos, i) => (
                    <motion.div
                        key={i}
                        className="floating-ticket"
                        initial={{ opacity: 0, scale: 0, x: pos.x, y: pos.y, rotate: pos.rotate - 30 }}
                        animate={{ opacity: 1, scale: 1, x: pos.x, y: pos.y, rotate: pos.rotate }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 1.5 + pos.delay }}
                        whileHover={{ scale: 1.1, rotate: pos.rotate + (i % 2 === 0 ? 5 : -5) }}
                        style={{ left: pos.x, top: pos.y, transform: `translate(-${pos.size / 2}px, -${pos.size / 2}px) rotate(${pos.rotate}deg)` }}
                    >
                        <Image src="/tickets.png" alt="Tickets de Rifa" width={pos.size} height={pos.size * 0.6} priority/>
                    </motion.div>
                ))}
            </div>

            <motion.div
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ rotateX, rotateY }}
                className="group relative rounded-[2.5rem] p-px overflow-hidden animated-border-jorvi w-full max-w-2xl mx-auto z-20" // AUMENTADO el max-w-xl a max-w-2xl
            >
                <motion.div
                    className="pointer-events-none absolute -inset-px rounded-[2.5rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: `radial-gradient(400px at ${mouseX}px ${mouseY}px, rgba(251, 191, 36, 0.15), transparent 80%)` }}
                />

                <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl shadow-black/70 transition-shadow duration-500 group-hover:shadow-[0_0_25px_theme(colors.amber.500/40%)]">
                    <div className="relative w-full h-[550px] flex justify-center items-end bg-gradient-to-b from-black/50 to-transparent"> {/* AUMENTADO el h-[400px] a h-[550px] */}
                        <div className="sparkle-particles">
                            {[...Array(10)].map((_, i) => <div key={i} className="sparkle" />)}
                        </div>
                        
                        <motion.div
                            className="absolute w-[600px] h-[750px] p-0.5 rounded-2xl golden-bevel universe-background shadow-xl shadow-amber-950/70 z-10 -bottom-24" // AUMENTADO el tamaño y ajustado el bottom
                            initial={{ y: 50, scale: 0.9, opacity: 0 }}
                            animate={{ y: 0, scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 120, damping: 15, delay: 0.2 }}
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="relative w-full h-full rounded-xl overflow-hidden bg-black/70 border border-amber-500/20 ring-1 ring-inset ring-black/40">
                                <div style={{ transform: 'translateY(8%)', width: '100%', height: '100%' }}>
                                    <Image
                                        src="/jorvi2.png" 
                                        alt="Jorvi, dueña de la página" 
                                        layout="fill" 
                                        quality={100} 
                                        className="object-cover drop-shadow-xl" 
                                        priority
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <div className="relative flex flex-col items-center justify-between gap-4 px-8 pt-28 pb-10 bg-zinc-900/80 rounded-b-[2.4rem] shadow-inner shadow-black/40 text-center">
                        <motion.h3
                            className="text-5xl font-extrabold text-gold-gradient leading-tight drop-shadow-lg"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
                        >
                            Tu suerte
                        </motion.h3>
                            <motion.h3
                            className="text-5xl font-extrabold text-gold-gradient leading-tight drop-shadow-lg"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
                        >
                            con Jorvi
                        </motion.h3>

                        <motion.p
                            className="text-zinc-400 text-base max-w-sm"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
                        >
                            Participa en rifas exclusivas y sé el próximo afortunado. ¡La suerte te espera!
                        </motion.p>
                        
                        <DecorativeSeparator />

                        <div className="flex flex-col items-center gap-4">
                            <motion.p
                                className="text-sm text-zinc-500 font-semibold uppercase tracking-wider"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 1 }}
                            >
                                Aceptamos tus métodos de pago favoritos:
                            </motion.p>
                            <div className="flex items-center gap-5 flex-wrap justify-center">
                                {paymentMethods.slice(0, 4).map((method, i) => (
                                    <PaymentIcon key={method.id} method={method} index={i} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const WinnerCard = ({ raffle, onShowProof }: { raffle: FinishedRaffle, onShowProof: (url: string) => void }) => (
    <div className="group relative rounded-2xl p-px overflow-hidden animated-border-winner">
        <div className="relative bg-zinc-900/80 backdrop-blur-md rounded-[15px] overflow-hidden flex flex-col h-full border-t border-white/5 shadow-2xl shadow-black/40">
            <div className="relative aspect-video">
                <Image src={raffle.images[0]?.url || '/placeholder.png'} alt={raffle.name} fill className="object-cover brightness-50 group-hover:brightness-75 transition-all duration-300"/>
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="font-bold text-lg text-white line-clamp-1">{raffle.name}</h3>
                    <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                        <CalendarOff className="h-3.5 w-3.5" />
                        Finalizó el {formatDate(raffle.limitDate)}
                    </p>
                </div>
            </div>
            <div className="p-5 text-center flex-grow flex flex-col justify-between">
                <div>
                    <Trophy className="h-14 w-14 mx-auto text-amber-400 drop-shadow-[0_2px_4px_rgba(251,191,36,0.6)]" />
                    <p className="text-sm text-amber-400/80 mt-3 font-semibold">¡Felicidades al ganador!</p>
                    <p className="text-2xl font-extrabold mt-1 leading-tight drop-shadow-md bg-clip-text text-transparent bg-gradient-to-br from-amber-200 to-yellow-400">
                        {raffle.winnerTicket?.purchase?.buyerName ?? "Anónimo"}
                    </p>
                </div>
                <div className="mt-6 bg-black/30 border border-amber-500/20 rounded-xl p-3">
                    <span className="text-xs text-zinc-400 block mb-1">Ticket Ganador</span>
                    <p className="text-4xl font-mono tracking-wider text-amber-300 font-bold">{raffle.winnerTicket?.ticketNumber ?? "N/A"}</p>
                </div>
                {raffle.winnerProofUrl && (
                   <Button className="mt-5 w-full bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg border border-white/10" onClick={() => onShowProof(raffle.winnerProofUrl!)}>
                       <CheckCircle className="h-4 w-4 mr-2" /> Ver Prueba del Sorteo
                   </Button>
                )}
            </div>
        </div>
    </div>
);


const ProofOfWinModal = ({ imageUrl, onClose }: { imageUrl: string | null, onClose: () => void }) => {
    if (!imageUrl) return null;
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in-anim" onClick={onClose}>
            <div className="relative max-w-4xl max-h-[95vh] scale-in-anim" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="absolute -top-4 -right-4 h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 z-10 border border-white/10" onClick={onClose}>
                    <X className="h-6 w-6" />
                </Button>
                <Image src={imageUrl} alt="Prueba del ganador" width={1600} height={1000} className="object-contain rounded-xl shadow-2xl shadow-black/70 border border-zinc-700 max-h-[90vh] w-auto" />
            </div>
        </div>
    );
};


// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
export default function HomePage({ activeRaffles, finishedRaffles, paymentMethods }: HomePageProps) {
    const [proofModalOpen, setProofModalOpen] = useState(false);
    const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);

    const handleShowProof = (url: string) => { setProofImageUrl(url); setProofModalOpen(true); };
    const handleCloseProof = () => { setProofModalOpen(false); setProofImageUrl(null); };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') { handleCloseProof(); } };
        window.addEventListener('keydown', handleKeyDown);
        return () => { window.removeEventListener('keydown', handleKeyDown); };
    }, []);

    const isSingleFeatured = activeRaffles.length === 1;

    return (
        <>
            <GlobalStyles />
            <div className="min-h-screen bg-zinc-950 text-white font-sans overflow-hidden relative isolate">
                <div className="absolute inset-0 -z-10 h-full w-full bg-zinc-950 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
                <div className="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-gradient-to-br from-amber-600/40 to-orange-600/20 rounded-full blur-3xl blob-anim -z-10"></div>
                <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] bg-gradient-to-br from-purple-600/30 to-indigo-600/20 rounded-full blur-3xl blob-anim animation-delay-4000 -z-10"></div>

                <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                    <section className="mb-20 sm:mb-28">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div className="flex flex-col items-center lg:items-end justify-center pt-20 sm:pt-24 lg:order-first">
                                <JorviHeroCard paymentMethods={paymentMethods} />
                            </div>

                            <div className="flex flex-col items-center lg:items-start pt-12 lg:order-last">
                                <div className="text-center lg:text-left mb-8 w-full">
                                    <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tighter">Rifas Activas</h2>
                                    <p className="mt-4 text-lg text-zinc-400 max-w-xl mx-auto lg:mx-0">¡No esperes más! Participa en nuestras rifas actuales y gana premios asombrosos. Cada ticket te acerca a la victoria.</p>
                                </div>
                                {activeRaffles.length === 0 ? (
                                    <div className="text-center py-20 px-6 bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-2xl w-full">
                                        <Clock className="h-16 w-16 text-amber-500 mx-auto mb-6 drop-shadow-[0_2px_8px_rgba(217,119,6,0.5)]" />
                                        <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-br from-white to-zinc-400">Próximamente Nuevas Rifas</h2>
                                        <p className="text-zinc-400 max-w-md mx-auto">Estamos preparando premios increíbles. ¡Vuelve pronto para no perderte la oportunidad de ser el próximo ganador!</p>
                                    </div>
                                ) : (
                                    <div className={`grid grid-cols-1 ${isSingleFeatured ? '' : 'sm:grid-cols-2'} gap-6 items-start w-full`}>
                                        {activeRaffles.map((raffle) => (
                                            <ActiveRaffleCard
                                                key={raffle.id}
                                                raffle={raffle}
                                                isFeatured={isSingleFeatured}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {finishedRaffles.length > 0 && (
                        <section id="resultados">
                            <div className="text-center mb-12">
                                <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tighter">Ganadores Recientes</h2>
                                <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">¡Felicidades a todos los afortunados! Aquí puedes ver los resultados de nuestras últimas rifas.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                                {finishedRaffles.map(raffle => (<WinnerCard key={raffle.id} raffle={raffle} onShowProof={handleShowProof} />))}
                            </div>
                        </section>
                    )}
                </main>
            </div>
            {proofModalOpen && <ProofOfWinModal imageUrl={proofImageUrl} onClose={handleCloseProof} />}

            {/* ✅ --- INICIO DE CAMBIOS: Añadir el botón flotante aquí --- */}
            <FloatingWhatsAppButton />
            {/* ✅ --- FIN DE CAMBIOS --- */}
        </>
    );
}