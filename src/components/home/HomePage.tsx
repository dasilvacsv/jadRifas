'use client'

// --- DEPENDENCIAS ---
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Ticket, Gift, Clock, Sparkles, ChevronLeft, ChevronRight, X, CheckCircle, Trophy, CalendarOff, Star, MessageSquare } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import React, { useState, useEffect, memo } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { FloatingWhatsAppButton } from '@/components/whatsapp/FloatingWhatsAppButton';
// Se eliminó la importación de TermsModal, ya que el contenido está integrado.


// --- INTERFACES DE DATOS ---
export interface RaffleImage { id: string; url: string; raffleId: string; }
export interface Purchase { id: string; buyerName: string | null; buyerEmail: string; buyerPhone: string | null; amount: string; status: "pending" | "confirmed" | "rejected"; paymentReference: string | null; paymentScreenshotUrl: string | null; paymentMethod: string | null; ticketCount: number; createdAt: Date; raffleId: string; }
export interface WinnerTicket { id:string; ticketNumber: string; raffleId: string; purchaseId: string | null; status: "available" | "reserved" | "sold"; reservedUntil: Date | null; purchase: Purchase | null; }
export interface ActiveRaffle { id: string; slug: string; name: string; description: string | null; price: string; currency: 'USD' | 'VES'; minimumTickets: number; status: "active" | "finished" | "cancelled" | "draft" | "postponed"; createdAt: Date; updatedAt: Date; limitDate: Date; winnerTicketId: string | null; winnerLotteryNumber: string | null; images: RaffleImage[]; tickets: Array<{ id: string }>; }
export interface FinishedRaffle { id: string; slug: string; name: string; description: string | null; price: string; currency: 'USD' | 'VES'; minimumTickets: number; status: "active" | "finished" | "cancelled" | "draft" | "postponed"; createdAt: Date; updatedAt: Date; limitDate: Date; winnerTicketId: string | null; winnerLotteryNumber: string | null; winnerProofUrl: string | null; images: RaffleImage[]; winnerTicket: WinnerTicket | null; }
export interface PaymentMethod { id: string; title: string; iconUrl: string | null; }
interface HomePageProps { activeRaffles: ActiveRaffle[]; finishedRaffles: FinishedRaffle[]; paymentMethods: PaymentMethod[]; }

const whatsappUrl = `https://wa.me/584142939088?text=${encodeURIComponent("¡Hola! Tengo una duda sobre una de las rifas.")}`;

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
    .animated-border::before {
        content: ''; position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%); width: 150%; height: 150%;
        background: conic-gradient(from 0deg, transparent 70%, #8b5cf6, #ec4899, transparent 100%);
        animation: border-spin 5s linear infinite; z-index: -1;
    }
    .animated-border-winner::before {
        content: ''; position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%); width: 150%; height: 150%;
        background: conic-gradient(from 0deg, transparent 70%, #f59e0b, #fbbf24, transparent 100%);
        animation: border-spin 5s linear infinite; z-index: -1;
    }
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
    .payment-icon-wrapper {
        position: relative;
        overflow: hidden;
    }
    .payment-icon-wrapper::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        padding: 1px;
        background: linear-gradient(45deg, #FDE047, #BF953F, #FDE047);
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
    }
    .payment-icon-wrapper:hover::before { opacity: 1; }
    .floating-ticket-container {
        position: absolute; width: 100%; height: 100%;
        pointer-events: none; overflow: visible;
    }
    .floating-ticket {
        position: absolute; filter: drop-shadow(0 5px 10px rgba(0,0,0,0.5));
    }
    .universe-background {
        background-image: url('/space-background.jpg');
        background-size: cover; background-position: center; background-repeat: no-repeat;
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
            calculateTime();
            const timer = setInterval(calculateTime, 1000);
            return () => clearInterval(timer);
        }
    }, [hasMounted, targetDate]);

    const timeUnits = hasMounted ? timeLeft : { days: 0, hours: 0, minutes: 0, seconds: 0 };

    return (
        <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono sm:gap-3">
            <Clock className="h-4 w-4 text-amber-400 flex-shrink-0 sm:h-5 sm:w-5" />
            <div className="flex items-end gap-2 min-h-[28px] w-full justify-between sm:gap-3">
                <>
                    {timeUnits.days > 0 && (
                        <div className="flex items-end leading-none">
                            <span className="text-xl font-bold text-white sm:text-2xl">{String(timeUnits.days).padStart(2, '0')}</span>
                            <span className="text-zinc-500 ml-1 mb-0.5 text-xs sm:text-sm">d</span>
                        </div>
                    )}
                    <span className="text-xl font-bold text-white sm:text-2xl">{String(timeUnits.hours).padStart(2, '0')}</span><span className="text-zinc-500 -mx-1.5 sm:-mx-2">:</span>
                    <span className="text-xl font-bold text-white sm:text-2xl">{String(timeUnits.minutes).padStart(2, '0')}</span><span className="text-zinc-500 -mx-1.5 sm:-mx-2">:</span>
                    <span className="text-xl font-bold text-amber-400 sm:text-2xl">{String(timeUnits.seconds).padStart(2, '0')}</span>
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
        return <div className="aspect-video w-full bg-black/20 flex items-center justify-center rounded-t-xl"><Gift className="h-12 w-12 text-white/10 sm:h-16 sm:w-16"/></div>;
    }

    return (
        <div className="relative group/carousel w-full overflow-hidden rounded-t-xl">
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
            <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                {images.map(image => (
                    <div key={image.id} className="relative w-full flex-shrink-0">
                        <img src={image.url} alt={raffleName} className="w-full h-auto transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                    </div>
                ))}
            </div>
            {images.length > 1 && (<>
                <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur-sm transition-all duration-300 z-20 opacity-0 group-hover/carousel:opacity-100 sm:h-9 sm:w-9 sm:left-3" onClick={handlePrev}><ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" /></Button>
                <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur-sm transition-all duration-300 z-20 opacity-0 group-hover/carousel:opacity-100 sm:h-9 sm:w-9 sm:right-3" onClick={handleNext}><ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" /></Button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 sm:bottom-3">
                    {images.map((_, i) => (
                        <button key={i} onClick={(e) => {e.preventDefault(); e.stopPropagation(); setCurrentIndex(i);}} className={`h-1.5 w-5 rounded-full transition-all duration-300 sm:w-6 ${currentIndex === i ? 'bg-white w-7 sm:w-8' : 'bg-white/40'}`}></button>
                    ))}
                </div>
            </>)}
        </div>
    );
};

const ActiveRaffleCard = ({ raffle, isFeatured = false }: { raffle: ActiveRaffle, isFeatured?: boolean }) => {
    const ticketsSold = raffle.tickets.length;
    const progress = Math.min((ticketsSold / raffle.minimumTickets) * 100, 100);
    const [isTimerFinished, setIsTimerFinished] = useState(false);

    useEffect(() => {
        const checkTime = () => {
            const difference = +new Date(raffle.limitDate) - +new Date();
            setIsTimerFinished(difference <= 0);
        };
        checkTime();
        const intervalId = setInterval(checkTime, 1000);
        return () => clearInterval(intervalId);
    }, [raffle.limitDate]);

    return (
        <div className={`group relative rounded-2xl p-px overflow-hidden animated-border ${isFeatured ? 'sm:col-span-full' : ''}`}>
            <Link href={`/rifa/${raffle.slug}`} className="block h-full">
                <Card className="relative bg-zinc-900/80 backdrop-blur-md border-none rounded-[15px] overflow-hidden h-full flex flex-col shadow-2xl shadow-black/40 transition-all duration-300">
                    <CardHeader className="p-0 relative">
                        {isTimerFinished && (
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[90%] z-30 pointer-events-none sm:top-4">
                                <div className="bg-sky-500/95 text-white text-xs font-bold px-3 py-2 rounded-lg backdrop-blur-sm border border-sky-300/60 shadow-lg flex items-center justify-center animate-pulse sm:text-sm sm:px-4 sm:py-2.5 sm:rounded-xl">
                                    <Sparkles className="h-3 w-3 mr-2 sm:h-4 sm:w-4" />
                                    ¡El sorteo está por comenzar!
                                </div>
                            </div>
                        )}
                        <RaffleImagesCarousel images={raffle.images} raffleName={raffle.name} />
                        {isFeatured && (
                           <Badge className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-1 px-3 border border-purple-300/50 shadow-lg shadow-black/30 animate-pulse text-xs sm:top-4 sm:left-4 sm:py-1.5 sm:px-4">
                               <Star className="h-3 w-3 mr-1.5 sm:h-4 sm:w-4 sm:mr-2" /> RIFA ESTRELLA
                           </Badge>
                        )}
                        <Badge variant="secondary" className="absolute top-3 right-3 bg-black/50 text-amber-300 font-semibold py-1 px-2.5 border border-amber-300/20 backdrop-blur-sm text-xs sm:top-4 sm:right-4 sm:px-3">
                            <Sparkles className="h-3 w-3 mr-1 text-amber-400 sm:h-3.5 sm:w-3.5 sm:mr-1.5" /> ¡EN VIVO!
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-4 flex-grow flex flex-col sm:p-5">
                        <h3 className={`font-bold text-white line-clamp-2 group-hover:text-amber-300 transition-colors duration-300 leading-tight mb-2 sm:mb-3 ${isFeatured ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'}`}>
                            {raffle.name}
                        </h3>
                        {raffle.description && (
                            <p className="text-zinc-400 text-xs line-clamp-2 mb-3 sm:text-sm sm:mb-4">{raffle.description}</p>
                        )}
                        <div className="mt-auto space-y-4 pt-3 sm:space-y-5 sm:pt-4">
                            <div>
                                <div className="flex justify-end items-center text-xs mb-1.5">
                                    <span className="font-bold text-white">{progress.toFixed(0)}% Vendido</span>
                                </div>
                                <Progress value={progress} className="h-2 bg-white/10 rounded-full border border-white/10 overflow-hidden [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-500" />
                            </div>
                            <CountdownTimer targetDate={raffle.limitDate} />
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-3 flex flex-wrap gap-3 justify-between items-center bg-black/20 border-t border-white/10 sm:p-5 sm:pt-4 sm:gap-4">
                        <div className='flex flex-col'>
                            <p className="text-xs text-zinc-400">Precio</p>
                            <p className="text-2xl font-extrabold text-white leading-none sm:text-3xl">{formatCurrency(raffle.price, raffle.currency)}</p>
                        </div>
                        <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-lg px-6 py-4 text-sm shadow-lg shadow-black/40 transition-all duration-300 ease-out group-hover:scale-105 group-hover:drop-shadow-[0_0_15px_theme(colors.amber.500)] sm:rounded-xl sm:px-8 sm:py-6 sm:text-base">
                           <Ticket className="h-4 w-4 mr-2 sm:h-5 sm:w-5 sm:mr-2.5"/>
                           Participar
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
        className="relative h-9 w-9 rounded-lg bg-white/5 p-1 flex items-center justify-center ring-1 ring-white/10 backdrop-blur-sm golden-bevel payment-icon-wrapper cursor-pointer sm:h-10 sm:w-10 sm:rounded-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 + index * 0.1, ease: "easeOut" }}
        whileHover={{ scale: 1.15, boxShadow: '0 0 20px rgba(251, 191, 36, 0.7)' }}
        whileTap={{ scale: 0.95 }}
    >
        <img src={method.iconUrl || ''} alt={method.title} width={24} height={24} className="object-contain sm:w-[28px] sm:h-[28px]" />
    </motion.div>
);

const DecorativeSeparator = () => (
    <motion.div
        className="relative w-3/4 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent my-3 sm:my-4"
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
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => { setIsMobile(window.innerWidth < 640); };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (isMobile) return;
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
        if (isMobile) return;
        cardX.set(0);
        cardY.set(0);
    };

    const ticketPositions = [
        { x: "-10%", y: "15%", rotate: -20, delay: 0.6, size: isMobile ? 50 : 80 },
        { x: "80%", y: "5%", rotate: 15, delay: 0.8, size: isMobile ? 58 : 90 },
        { x: "20%", y: "85%", rotate: -5, delay: 1.0, size: isMobile ? 42 : 70 },
        { x: "90%", y: "70%", rotate: 25, delay: 1.2, size: isMobile ? 65 : 100 },
        { x: "40%", y: "-10%", rotate: 5, delay: 1.4, size: isMobile ? 46 : 75 },
        { x: "-20%", y: "60%", rotate: 22, delay: 1.6, size: isMobile ? 54 : 85 },
    ];

    return (
        <div className="relative" style={{ perspective: '1000px' }}>
            <div className="absolute inset-0 floating-ticket-container">
                {ticketPositions.map((pos, i) => (
                    <motion.div key={i} className="floating-ticket"
                        initial={{ opacity: 0, scale: 0, x: pos.x, y: pos.y, rotate: pos.rotate - 30 }}
                        animate={{ opacity: 1, scale: 1, x: pos.x, y: pos.y, rotate: pos.rotate }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 1.5 + pos.delay }}
                        whileHover={{ scale: 1.1, rotate: pos.rotate + (i % 2 === 0 ? 5 : -5) }}
                        style={{ left: pos.x, top: pos.y, transform: `translate(-${pos.size / 2}px, -${pos.size / 2}px) rotate(${pos.rotate}deg)` }} >
                        <img src="/tickets.png" alt="Tickets de Rifa" width={pos.size} height={pos.size * 0.6} />
                    </motion.div>
                ))}
            </div>
            <motion.div onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={{ rotateX, rotateY }}
                className="group relative rounded-[1.875rem] sm:rounded-[2.5rem] p-px overflow-hidden animated-border-jorvi w-full max-w-lg sm:max-w-2xl mx-auto z-20" >
                <motion.div className="pointer-events-none absolute -inset-px rounded-[1.875rem] sm:rounded-[2.5rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: `radial-gradient(${isMobile ? '300px' : '400px'} at ${mouseX}px ${mouseY}px, rgba(251, 191, 36, 0.15), transparent 80%)` }} />
                <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-[1.875rem] sm:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl shadow-black/70 transition-shadow duration-500 group-hover:shadow-[0_0_25px_theme(colors.amber.500/40%)]">
                    <div className="relative w-full h-[280px] sm:h-[550px] flex justify-center items-end bg-gradient-to-b from-black/50 to-transparent">
                        <div className="sparkle-particles">
                            {[...Array(10)].map((_, i) => <div key={i} className="sparkle" />)}
                        </div>
                        <motion.div className="absolute w-[450px] sm:w-[600px] h-[562.5px] sm:h-[750px] p-0.5 rounded-2xl golden-bevel universe-background shadow-xl shadow-amber-950/70 z-10 -bottom-12 sm:-bottom-24"
                            initial={{ y: 50, scale: 0.9, opacity: 0 }}
                            animate={{ y: 0, scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 120, damping: 15, delay: 0.2 }}
                            whileHover={{ scale: 1.05 }} >
                            <div className="relative w-full h-full rounded-xl overflow-hidden bg-black/70 border border-amber-500/20 ring-1 ring-inset ring-black/40">
                               <div style={{ transform: isMobile ? 'translateY(30%)' : 'translateY(8%) translateX(6.8%)', width: '100%', height: '100%' }}>
                                    <img src="/jorvi5.png" alt="Jorvi, dueña de la página" className="w-full h-full object-cover drop-shadow-xl" />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                    <div className="relative flex flex-col items-center justify-between gap-2 sm:gap-4 px-4 sm:px-8 pt-12 sm:pt-28 pb-6 sm:pb-10 bg-zinc-900/80 rounded-b-[1.8rem] sm:rounded-b-[2.4rem] shadow-inner shadow-black/40 text-center">
                        <motion.h3 className="text-3xl sm:text-5xl font-extrabold text-gold-gradient leading-tight drop-shadow-lg"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }} >
                            Tu suerte con Jorvi
                        </motion.h3>
                        <motion.p className="text-zinc-400 text-xs sm:text-base max-w-[18rem] sm:max-w-sm"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }} >
                            Participa en rifas exclusivas y sé el próximo afortunado. ¡La suerte te espera!
                        </motion.p>
                        <DecorativeSeparator />
                        <div className="flex flex-col items-center gap-3 sm:gap-4">
                            <motion.p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 1 }} >
                                Aceptamos:
                            </motion.p>
                            <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
                                {paymentMethods.slice(0, 4).map((method, i) => ( <PaymentIcon key={method.id} method={method} index={i} /> ))}
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
                <img src={raffle.images[0]?.url || '/placeholder.png'} alt={raffle.name} className="w-full h-full object-cover brightness-50 group-hover:brightness-75 transition-all duration-300" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent"></div>
                <div className="absolute bottom-2 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4">
                    <h3 className="font-bold text-base sm:text-lg text-white line-clamp-1">{raffle.name}</h3>
                    <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                        <CalendarOff className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        Finalizó el {formatDate(raffle.limitDate)}
                    </p>
                </div>
            </div>
            <div className="p-4 text-center flex-grow flex flex-col justify-between sm:p-5">
                <div>
                    <Trophy className="h-10 w-10 mx-auto text-amber-400 drop-shadow-[0_2px_4px_rgba(251,191,36,0.6)] sm:h-14 sm:w-14" />
                    <p className="text-xs text-amber-400/80 mt-2 font-semibold sm:text-sm sm:mt-3">¡Felicidades al ganador!</p>
                    <p className="text-xl font-extrabold mt-1 leading-tight drop-shadow-md bg-clip-text text-transparent bg-gradient-to-br from-amber-200 to-yellow-400 sm:text-2xl">
                        {raffle.winnerTicket?.purchase?.buyerName ?? "Anónimo"}
                    </p>
                </div>
                <div className="mt-4 bg-black/30 border border-amber-500/20 rounded-xl p-2 sm:p-3 sm:mt-6">
                    <span className="text-xs text-zinc-400 block mb-0.5 sm:mb-1">Ticket Ganador</span>
                    <p className="text-3xl font-mono tracking-wider text-amber-300 font-bold sm:text-4xl">{raffle.winnerTicket?.ticketNumber ?? "N/A"}</p>
                </div>
                {raffle.winnerProofUrl && (
                    <Button size="sm" className="mt-4 w-full bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg border border-white/10 text-xs sm:text-base sm:mt-5" onClick={() => onShowProof(raffle.winnerProofUrl!)}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1.5 sm:h-4 sm:w-4 sm:mr-2" /> Ver Prueba
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
                <Button variant="ghost" size="icon" className="absolute -top-3 -right-3 h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/20 z-10 border border-white/10 sm:-top-4 sm:-right-4 sm:h-10 sm:w-10" onClick={onClose}>
                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
                <img src={imageUrl} alt="Prueba del ganador" className="object-contain rounded-xl shadow-2xl shadow-black/70 border border-zinc-700 max-h-[90vh] w-auto" />
            </div>
        </div>
    );
};






// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
export default function HomePage({ activeRaffles, finishedRaffles, paymentMethods }: HomePageProps) {
    
    const [proofModalOpen, setProofModalOpen] = useState(false);
    const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);
    const [helpModalOpen, setHelpModalOpen] = useState(false);
    
    

    const handleShowProof = (url: string) => { setProofImageUrl(url); setProofModalOpen(true); };
    const handleCloseProof = () => { setProofModalOpen(false); setProofImageUrl(null); };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') { handleCloseProof(); } };
        window.addEventListener('keydown', handleKeyDown);
        return () => { window.removeEventListener('keydown', handleKeyDown); };
    }, []);
    
   
    
    
    useEffect(() => {
        if (activeRaffles.length > 0) {
            const timer = setTimeout(() => {
                setHelpModalOpen(true);
            }, 7000); // Se mostrará después de 7 segundos
            return () => clearTimeout(timer);
        }
    }, [activeRaffles]);

    const isSingleFeatured = activeRaffles.length === 1;
    const latestRaffle = activeRaffles.length > 0 ? activeRaffles[0] : null;

    return (
        <>
            <GlobalStyles />
            <div className="min-h-screen bg-zinc-950 text-white font-sans overflow-hidden relative isolate">
                <div className="absolute inset-0 -z-10 h-full w-full bg-zinc-950 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
                <div className="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-gradient-to-br from-amber-600/40 to-orange-600/20 rounded-full blur-3xl blob-anim -z-10"></div>
                <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] bg-gradient-to-br from-purple-600/30 to-indigo-600/20 rounded-full blur-3xl blob-anim animation-delay-4000 -z-10"></div>
                <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-24">
                    <section className="mb-10 sm:mb-28">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 items-center">
                            <div className="flex flex-col items-center lg:items-end justify-center pt-20 sm:pt-0 lg:order-first">
                                <JorviHeroCard paymentMethods={paymentMethods} />
                            </div>
                            <div className="flex flex-col items-center lg:items-start pt-8 sm:pt-12 lg:order-last">
                                <div className="text-center lg:text-left mb-6 sm:mb-8 w-full">
                                    <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tighter">Rifas Activas</h2>
                                    <p className="mt-3 text-base sm:text-lg text-zinc-400 max-w-xl mx-auto lg:mx-0">¡No esperes más! Participa en nuestras rifas actuales y gana premios asombrosos. Cada ticket te acerca a la victoria.</p>
                                </div>
                                {activeRaffles.length === 0 ? (
                                    <div className="text-center py-16 sm:py-20 px-6 bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-2xl w-full">
                                        <Clock className="h-12 w-12 text-amber-500 mx-auto mb-6 drop-shadow-[0_2px_8px_rgba(217,119,6,0.5)] sm:h-16 sm:w-16" />
                                        <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-br from-white to-zinc-400 sm:text-4xl">Próximamente Nuevas Rifas</h2>
                                        <p className="text-sm text-zinc-400 max-w-md mx-auto sm:text-base">Estamos preparando premios increíbles. ¡Vuelve pronto para no perderte la oportunidad!</p>
                                    </div>
                                ) : (
                                    <div className={`grid grid-cols-1 ${isSingleFeatured ? '' : 'sm:grid-cols-2'} gap-6 items-start w-full`}>
                                        {activeRaffles.map((raffle) => ( <ActiveRaffleCard key={raffle.id} raffle={raffle} isFeatured={isSingleFeatured} /> ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                    {finishedRaffles.length > 0 && (
                        <section id="resultados">
                            <div className="text-center mb-8 sm:mb-12">
                                <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tighter">Ganadores Recientes</h2>
                                <p className="mt-3 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto">¡Felicidades a todos los afortunados! Aquí puedes ver los resultados de nuestras últimas rifas.</p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-8">
                                {finishedRaffles.map(raffle => (<WinnerCard key={raffle.id} raffle={raffle} onShowProof={handleShowProof} />))}
                            </div>
                        </section>
                    )}
                </main>
            </div>
            {proofModalOpen && <ProofOfWinModal imageUrl={proofImageUrl} onClose={handleCloseProof} />}
            
            
           
            
            <FloatingWhatsAppButton />
        </>
    );
}