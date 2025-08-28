'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Ticket, Gift, Clock, Sparkles, ChevronLeft, ChevronRight, X, CheckCircle, Trophy, CalendarOff, CreditCard, Star } from 'lucide-react';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

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

// --- ESTILOS GLOBALES PARA ANIMACIONES ---
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
    /* ✅ NUEVA ANIMACIÓN PARA LOS DESTELLOS */
    @keyframes sparkle-pulse {
        0%, 100% {
            opacity: 1;
            transform: scale(1);
        }
        50% {
            opacity: 0.5;
            transform: scale(1.2);
        }
    }

    .fade-in-anim { animation: fade-in 0.3s ease-out forwards; }
    .scale-in-anim { animation: scale-in 0.3s ease-out forwards; }
    .blob-anim { animation: blob 7s infinite; }
    .animation-delay-4000 { animation-delay: 4s; }

    .animated-border::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 150%;
        height: 150%;
        background: conic-gradient(from 0deg, transparent 70%, #8b5cf6, #ec4899, transparent 100%);
        animation: border-spin 5s linear infinite;
        z-index: -1;
    }
    .animated-border-winner::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 150%;
        height: 150%;
        background: conic-gradient(from 0deg, transparent 70%, #f59e0b, #fbbf24, transparent 100%);
        animation: border-spin 5s linear infinite;
        z-index: -1;
    }
    /* ✅ NUEVA CLASE PARA LOS DESTELLOS */
    .sparkle-effect::after {
        content: '';
        position: absolute;
        inset: -2px;
        background: radial-gradient(circle at center, rgba(255, 255, 255, 0.4) 0%, transparent 60%);
        opacity: 0;
        animation: sparkle-pulse 2s infinite ease-out;
        z-index: -1;
    }
    `}</style>
);


// --- COMPONENTES AUXILIARES ---

const PaymentMethodsBar = ({ methods, maxVisible = 5 }: { methods: PaymentMethod[], maxVisible?: number }) => {
    if (!methods || methods.length === 0) return null;
    const visibleMethods = methods.slice(0, maxVisible);
    const hiddenCount = methods.length - maxVisible;

    return (
        <div className="flex items-center gap-2.5 mt-8">
            <p className="text-sm text-zinc-400 mr-1 shrink-0">Aceptamos:</p>
            {visibleMethods.map(method => (
                <div key={method.id} className="h-8 w-8 rounded-lg bg-white/5 p-1 flex items-center justify-center ring-1 ring-white/10" title={method.title}>
                    {method.iconUrl ? (
                        <Image src={method.iconUrl} alt={method.title} width={28} height={28} className="object-contain rounded-sm" />
                    ) : (
                        <CreditCard className="h-5 w-5 text-zinc-400" />
                    )}
                </div>
            ))}
            {hiddenCount > 0 && (
                <div className="flex items-center justify-center h-8 w-8 text-xs font-bold bg-white/5 text-zinc-300 rounded-lg ring-1 ring-white/10">
                    +{hiddenCount}
                </div>
            )}
        </div>
    );
};

const CountdownTimer = ({ targetDate }: { targetDate: Date }) => {
    const [hasMounted, setHasMounted] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

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
                    setIsFinished(true);
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
        <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
            <Clock className="h-5 w-5 text-amber-400 flex-shrink-0" />
            <div className="flex items-end gap-3 min-h-[28px] w-full justify-between">
                {isFinished ? (
                    <div className="flex items-center w-full justify-center text-base font-bold text-amber-400 animate-pulse">
                        ¡El sorteo está por iniciar!
                    </div>
                ) : (
                    <>
                        {timeUnits.days > 0 && (
                            <div className="flex items-end leading-none">
                                <span className="text-2xl font-bold text-white">{String(timeUnits.days).padStart(2, '0')}</span>
                                <span className="text-zinc-500 ml-1 mb-0.5">d</span>
                            </div>
                        )}
                        <span className="text-2xl font-bold text-white">{String(timeUnits.hours).padStart(2, '0')}</span>
                        <span className="text-zinc-500 -mx-2">:</span>
                        <span className="text-2xl font-bold text-white">{String(timeUnits.minutes).padStart(2, '0')}</span>
                        <span className="text-zinc-500 -mx-2">:</span>
                        <span className="text-2xl font-bold text-amber-400">{String(timeUnits.seconds).padStart(2, '0')}</span>
                    </>
                )}
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

    return (
        <div className={`group relative rounded-2xl p-px overflow-hidden animated-border ${isFeatured ? 'sm:col-span-2' : ''}`}>
            <Link href={`/rifa/${raffle.id}`} className="block h-full">
                <Card className="relative bg-zinc-900/80 backdrop-blur-md border-none rounded-[15px] overflow-hidden h-full flex flex-col shadow-2xl shadow-black/40 transition-all duration-300">
                    <CardHeader className="p-0 relative">
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
                                <div className="flex justify-end items-center text-xs mb-1.5">
                                    <span className="font-bold text-white">{progress.toFixed(0)}%</span>
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


// --- COMPONENTE PRINCIPAL ---
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
                    {/* Sección de inicio con Jorvi2 y la nueva card a la izquierda, rifas activas a la derecha */}
                    <section className="mb-20 sm:mb-28">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                            {/* Columna Izquierda: Imagen de Jorvi2 y la nueva Card */}
                            <div className="relative flex flex-col items-center lg:items-end pb-36">
                                {/* ✅ CAMBIO: Imagen con menos ancho (`width={500}`) y con el efecto de destellos (`sparkle-effect`) */}
                                <Image
                                    src="/Jorvi3.png"
                                    alt="Dueña de la página"
                                    width={500}
                                    height={500}
                                    className="relative z-0 object-contain max-w-full h-auto mb-8 sparkle-effect"
                                />

                                
                            </div>

                            {/* Columna Derecha: Rifas Activas */}
                            <div className="flex flex-col items-center lg:items-start">
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
        </>
    );
}