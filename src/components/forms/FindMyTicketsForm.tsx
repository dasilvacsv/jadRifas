'use client'; 

import { useState } from 'react';
import { findMyTicketsAction } from '@/lib/actions';

// --- COMPONENTES UI ---
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

// --- ICONOS ---
import { Loader2, Search, Ticket, Trophy, Calendar, AlertCircle, ChevronLeft, ChevronRight, Gift, User } from 'lucide-react';
import Image from 'next/image';

// ... (Estado inicial y utilidades sin cambios)
const initialState: { success: boolean; message: string; data?: any[] | null } = {
  success: false, message: '', data: null
};

const formatCurrency = (amount: string, currency: 'USD' | 'VES') => {
    const value = parseFloat(amount);
    if (isNaN(value)) return currency === 'USD' ? '$0.00' : 'Bs. 0,00';
    return currency === 'USD' 
        ? `$${value.toFixed(2)}` 
        : `Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
};

const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-VE', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
};

// ... (RaffleImagesCarousel y PurchaseWinnerInfo sin cambios)
const RaffleImagesCarousel = ({ images, raffleName }: { images: any[], raffleName: string }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const handleNext = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setCurrentIndex((prev) => (prev + 1) % images.length); };
    const handlePrev = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setCurrentIndex((prev) => (prev - 1 + images.length) % images.length); };
    if (!images || images.length === 0) return <div className="aspect-video w-full bg-black/20 flex items-center justify-center rounded-t-xl"><Gift className="h-12 w-12 text-white/10"/></div>;

    return (
        <div className="relative group/carousel aspect-video w-full overflow-hidden rounded-t-xl">
            <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                {images.map(image => (
                    <div key={image.id} className="relative w-full flex-shrink-0 aspect-video">
                        <Image src={image.url} alt={raffleName} fill className="object-cover transition-transform duration-500 group-hover/carousel:scale-110"/>
                    </div>
                ))}
            </div>
            {images.length > 1 && (<>
                <Button variant="ghost" size="icon" className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur-sm transition-all duration-300 z-10 opacity-0 group-hover/carousel:opacity-100" onClick={handlePrev}><ChevronLeft className="h-6 w-6" /></Button>
                <Button variant="ghost" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur-sm transition-all duration-300 z-10 opacity-0 group-hover/carousel:opacity-100" onClick={handleNext}><ChevronRight className="h-6 w-6" /></Button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
                    {images.map((_, i) => (
                        <button key={i} onClick={(e) => {e.preventDefault(); e.stopPropagation(); setCurrentIndex(i);}} className={`h-1.5 w-6 rounded-full transition-all duration-300 ${currentIndex === i ? 'bg-white w-8' : 'bg-white/40'}`}></button>
                    ))}
                </div>
            </>)}
        </div>
    );
};

const PurchaseWinnerInfo = ({ purchase }: { purchase: any }) => {
  if (!purchase.raffle.winnerTicket) return null;
  const didIWin = purchase.tickets.some((t: any) => t.id === purchase.raffle.winnerTicket.id);

  if (didIWin) {
    return (
      <div className="relative mt-4 p-px rounded-xl overflow-hidden animated-border-winner">
        <div className="relative p-4 rounded-[11px] bg-zinc-900/80 backdrop-blur-sm text-center space-y-3">
          <Trophy className="h-12 w-12 mx-auto text-amber-400 drop-shadow-[0_2px_6px_rgba(251,191,36,0.6)]" />
          <h4 className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-br from-amber-200 to-yellow-400">
            ¡Felicidades, eres el ganador!
          </h4>
          <div className="bg-black/30 border border-amber-500/20 rounded-lg py-2">
            <span className="text-xs text-zinc-400 block">Tu Ticket Ganador</span>
            <p className="text-3xl font-mono tracking-wider text-amber-300 font-bold">{purchase.raffle.winnerTicket.ticketNumber}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 rounded-xl border border-white/10 bg-black/20">
      <h4 className="font-semibold text-white text-center mb-3">Resultado del Sorteo</h4>
      <div className="text-center bg-zinc-950/70 border border-zinc-700 rounded-lg p-3">
        <span className="text-xs text-zinc-500 block">Número Ganador</span>
        <p className="text-3xl font-mono tracking-wider text-amber-400 font-bold">{purchase.raffle.winnerLotteryNumber}</p>
      </div>
      <p className="text-sm text-zinc-400 border-t border-white/10 pt-3 mt-3 text-center">
        Ganador: <span className="font-semibold ml-1 text-white">{purchase.raffle.winnerTicket?.purchase?.buyerName ?? "(No vendido)"}</span>
      </p>
    </div>
  );
};

// ▼▼▼ COMPONENTE MODIFICADO ▼▼▼
const PurchaseResultCard = ({ purchase }: { purchase: any }) => {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed': return <Badge className="bg-green-950/70 text-green-300 border border-green-400/30 shadow-md">Confirmado</Badge>;
            case 'pending': return <Badge className="bg-amber-950/70 text-amber-300 border border-amber-400/30 shadow-md">Pendiente</Badge>;
            case 'rejected': return <Badge className="bg-red-950/70 text-red-400 border border-red-400/30 shadow-md">Rechazado</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="group relative rounded-2xl p-px animated-border h-full">
            <Card className="relative bg-zinc-900/80 backdrop-blur-md border-none rounded-[15px] overflow-hidden h-full flex flex-col shadow-2xl shadow-black/40 z-10">
                <CardHeader className="p-0 relative">
                    <RaffleImagesCarousel images={purchase.raffle.images} raffleName={purchase.raffle.name} />
                    <div className="absolute top-3 right-3">{getStatusBadge(purchase.status)}</div>
                </CardHeader>
                <CardContent className="p-4 flex-grow flex flex-col">
                    <CardTitle className="text-white text-xl group-hover:text-amber-300 transition-colors">{purchase.raffle.name}</CardTitle>
                    <CardDescription className="!mt-1 flex items-center gap-1.5 text-zinc-400">
                        <Calendar className="h-3.5 w-3.5" /> Sorteo: {formatDate(purchase.raffle.limitDate)}
                    </CardDescription>

                    <p className="!mt-2 flex items-center gap-2 text-sm text-zinc-300">
                        <User className="h-4 w-4 text-zinc-400" />
                        <span className="font-medium">{purchase.buyerName}</span>
                    </p>

                    <div className="flex justify-between items-start text-sm border-t border-white/10 pt-4 mt-4 space-x-4">
                        <div className='flex flex-col'>
                            <span className="text-xs text-zinc-400">Tickets en esta compra</span>
                            <span className="font-bold text-white text-lg">{purchase.ticketCount}</span>
                        </div>
                        {/* ✅ NUEVO BLOQUE PARA MOSTRAR EL TOTAL DEL COMPRADOR */}
                        <div className='flex flex-col text-right'>
                            <span className="text-xs text-zinc-400">Total de tickets del comprador</span>
                            <span className="font-bold text-amber-400 text-lg">{purchase.totalTicketsFromBuyer}</span>
                        </div>
                    </div>
                    
                    <PurchaseWinnerInfo purchase={purchase} />
                </CardContent>
            </Card>
        </div>
    )
}

// --- COMPONENTE PRINCIPAL ---
export function FindMyTicketsForm() {
  const [state, setState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setIsPending(true);
    const formData = new FormData(event.currentTarget);
    const result = await findMyTicketsAction(formData);
    setState(result); setIsPending(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans overflow-hidden relative isolate">
        <div className="absolute inset-0 -z-10 h-full w-full bg-zinc-950 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-gradient-to-br from-amber-600/30 to-orange-600/10 rounded-full blur-3xl blob-anim -z-10"></div>
        <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] bg-gradient-to-br from-purple-600/20 to-indigo-600/10 rounded-full blur-3xl blob-anim animation-delay-4000 -z-10"></div>

        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-12">
            <section className="text-center">
                <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tighter text-white !leading-tight">
                    Consulta el Estado
                    <span className="block bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500 mt-2">de tu Suerte</span>
                </h1>
                <p className="max-w-2xl mx-auto mt-6 text-lg text-zinc-300">
                    Ingresa el número de tu ticket (4 dígitos) para ver la compra a la que pertenece y su estado actual.
                </p>
            </section>

            <div className="group relative max-w-2xl mx-auto p-px rounded-2xl animated-border">
                <Card className="relative bg-zinc-900/80 backdrop-blur-md border-none rounded-[15px] z-10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-2xl text-white">
                            <Ticket className="h-7 w-7 text-amber-400" /> Buscar Mi Ticket
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-3">
                            <Label htmlFor="ticketNumber" className="sr-only">Número de Ticket</Label>
                            <Input 
                                id="ticketNumber" 
                                name="ticketNumber" 
                                type="text" 
                                required 
                                disabled={isPending}
                                maxLength={4}
                                className="flex-1 bg-black/30 border-white/10 text-white placeholder:text-zinc-500 h-12 text-base rounded-lg"
                                placeholder="Ej: 1234" 
                            />
                            <Button type="submit" disabled={isPending} size="lg" className="h-12 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-lg shadow-lg shadow-black/40 transition-all duration-300 ease-out hover:scale-105 hover:drop-shadow-[0_0_15px_theme(colors.amber.500)]">
                                {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                                Buscar
                            </Button>
                        </form>
                        {state.message && !state.success && (
                            <Alert variant="destructive" className="mt-4 bg-red-950/50 border-red-400/30 text-red-300">
                                <AlertCircle className="h-4 w-4 !text-red-300" />
                                <AlertDescription>{state.message}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>

            {state.success && state.data && (
                <div className="fade-in-anim">
                    {state.data.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {state.data.map((purchase: any) => (
                                <PurchaseResultCard key={purchase.id} purchase={purchase} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 px-6 bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-2xl max-w-lg mx-auto">
                            <Ticket className="h-16 w-16 text-amber-500 mx-auto mb-6 drop-shadow-[0_2px_8px_rgba(217,119,6,0.5)]" />
                            <h2 className="text-2xl font-bold mb-2 text-white">Ticket no encontrado</h2>
                            <p className="text-zinc-400">No hemos encontrado ninguna compra asociada a ese número de ticket. Por favor, verifica que esté bien escrito o que el ticket ya haya sido vendido.</p>
                        </div>
                    )}
                </div>
            )}
        </main>
    </div>
  );
}