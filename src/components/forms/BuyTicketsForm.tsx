// src/components/BuyTicketsForm.tsx
"use client";

// Importaciones de React y librerías externas
import { useState, useMemo, ChangeEvent, useEffect, useRef, memo } from 'react';

// 👇 1. Actualiza la importación al nuevo nombre del archivo
import * as tracking from '@/lib/tracking'; 

// Importaciones de componentes de UI y acciones del servidor
import { buyTicketsAction, reserveTicketsAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { PaymentDetailsDisplay } from './PaymentDetailsDisplay';
import { CountryCodeSelector } from '@/components/ui/CountryCodeSelector';

// Importaciones de utilidades e íconos
import { getBCVRates } from '@/lib/exchangeRates';
import Image from 'next/image';
import { Loader2, X, Ticket, CheckCircle, UploadCloud, User, AtSign, Phone, FileText, Minus, Plus, Banknote, Check } from 'lucide-react';

// Definición de Interfaces
interface PaymentMethod {
    id: string;
    title: string;
    triggersApiVerification?: boolean;
    iconUrl?: string | null;
    bankName?: string | null;
    rif?: string | null;
    phoneNumber?: string | null;
    accountHolderName?: string | null;
    accountNumber?: string | null;
    email?: string | null;
    walletAddress?: string | null;
    network?: string | null;
    binancePayId?: string | null;
}

// --- MODIFICADO: Añadir referralCode a las props ---
interface BuyTicketsFormProps {
    raffle: {
        id: string;
        name: string;
        price: string;
        currency: 'USD' | 'VES';
        status: string;
    };
    paymentMethods: PaymentMethod[];
    exchangeRate: number | null;
    referralCode?: string; // <-- ¡NUEVO!
}

// Constantes y Estado Inicial
const initialState = { success: false, message: '' };
const TICKET_AMOUNTS = [1, 5, 10, 25, 50, 100];

// Función de utilidad para formatear moneda
const formatCurrency = (amount: number, currency: 'USD' | 'VES', locale: string = 'es-VE') => {
    const formattedNumber = new Intl.NumberFormat(locale, {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
    return currency === 'USD' ? `$${formattedNumber}` : `${formattedNumber} Bs`;
};

// --- Nuevos estilos CSS para el efecto de borde brillante ---
const GlobalStyles = memo(function GlobalStyles() {
    return (
        <style jsx global>{`
            @keyframes pulse-green {
                0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
                100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
            }
            .pulse-green-anim {
                animation: pulse-green 1.5s infinite cubic-bezier(0.66, 0, 0, 1);
            }
        `}</style>
    );
});


// ✅ Nuevo componente para mostrar un método de pago
const PaymentMethodItem = memo(function PaymentMethodItem({ 
    method, 
    isSelected,
    onSelect
}: { 
    method: PaymentMethod; 
    isSelected: boolean; 
    onSelect: () => void;
}) {
    return (
        <label 
            htmlFor={`payment-${method.id}`}
            onClick={onSelect}
            className={`
                relative flex flex-col items-center justify-center p-4 h-28 rounded-lg border 
                cursor-pointer transition-all duration-300 transform 
                ${isSelected 
                    ? 'border-green-500/50 bg-green-900/10 text-white shadow-lg pulse-green-anim'
                    : 'border-white/10 bg-black/20 hover:bg-white/5 text-zinc-400 hover:text-white'
                }
            `}
        >
            <input 
                type="radio" 
                id={`payment-${method.id}`} 
                name="paymentMethod" 
                value={method.id} 
                checked={isSelected}
                readOnly
                className="sr-only" 
            />
            <div className="absolute top-2 right-2 w-5 h-5 bg-black/50 border border-white/20 rounded-full flex items-center justify-center">
                {isSelected && (
                    <Check className="h-4 w-4 text-green-400 animate-in zoom-in-50" />
                )}
            </div>
            {/* ✅ Se cambia `Image` por `img` para el icono del método de pago */}
            {method.iconUrl && <img src={method.iconUrl} alt={method.title} width={40} height={40} className="object-contain h-10"/>}
            <span className="text-xs font-semibold text-white text-center mt-2">{method.title}</span>
        </label>
    );
});

// Componente Principal del Formulario
// --- MODIFICADO: Recibir referralCode en el componente ---
export function BuyTicketsForm({ raffle, paymentMethods, exchangeRate: initialExchangeRate, referralCode }: BuyTicketsFormProps) {
    // Estados del componente
    const [apiState, setApiState] = useState(initialState);
    const [isPending, setIsPending] = useState(false);
    const [ticketCount, setTicketCount] = useState<number>(2);
    const [reservedTickets, setReservedTickets] = useState<string[]>([]);
    const [paymentMethodId, setPaymentMethodId] = useState('');
    const [buyerName, setBuyerName] = useState('');
    const [buyerEmail, setBuyerEmail] = useState('');
    const [countryCode, setCountryCode] = useState('+58');
    const [buyerPhone, setBuyerPhone] = useState('');
    const [paymentReference, setPaymentReference] = useState('');
    const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [reservationError, setReservationError] = useState('');
    const [exchangeRate, setExchangeRate] = useState<number | null>(initialExchangeRate);
    const [isLoadingRates, setIsLoadingRates] = useState(!initialExchangeRate);
    const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
    const [verificationProgress, setVerificationProgress] = useState(0);

    // --- IMPLEMENTACIÓN DE EVENTOS DE SEGUIMIENTO ---
    const isFirstRender = useRef(true); 

    useEffect(() => { 
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        // Evento para Meta Pixel
        tracking.trackLead();

        // 👇 2. Añade el evento para Simple Analytics
        tracking.trackSimpleAnalyticsEvent('select_tickets');

    }, [ticketCount]);

    // --- FIN DE IMPLEMENTACIÓN DE EVENTOS ---

    // Referencias a elementos
    const verificationTimers = useRef<{ modalTimer: NodeJS.Timeout | null, progressTimer: NodeJS.Timer | null }>({
        modalTimer: null,
        progressTimer: null
    });

    // Datos calculados y memos
    const selectedPaymentMethod = useMemo(() =>
        paymentMethods.find(method => method.id === paymentMethodId)
    , [paymentMethodId, paymentMethods]);

    const totalAmount = useMemo(() => ticketCount * parseFloat(raffle.price), [ticketCount, raffle.price]);

    const currencyData = useMemo(() => {
        const price = parseFloat(raffle.price);
        const numTickets = reservedTickets.length > 0 ? reservedTickets.length : ticketCount;
        const total = numTickets * price;
        let totalSecondary = '';
        let secondaryCurrencySymbol = '';

        if (exchangeRate !== null) {
            const convertedTotal = raffle.currency === 'USD' ? total * exchangeRate : total / exchangeRate;
            const convertedCurrency = raffle.currency === 'USD' ? 'VES' : 'USD';
            totalSecondary = new Intl.NumberFormat('es-VE', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(convertedTotal);
            secondaryCurrencySymbol = convertedCurrency === 'USD' ? '$' : 'Bs';
        }

        return {
            pricePerTicket: formatCurrency(price, raffle.currency),
            totalPrimary: formatCurrency(total, raffle.currency),
            totalSecondary,
            secondaryCurrencySymbol,
        };
    }, [ticketCount, reservedTickets, raffle.price, raffle.currency, exchangeRate]);

    // Efecto para obtener la tasa de cambio al cargar
    useEffect(() => {
        if (initialExchangeRate) {
            setExchangeRate(initialExchangeRate);
            setIsLoadingRates(false);
            return;
        }
        
        const fetchRates = async () => {
            setIsLoadingRates(true);
            try {
                const rates = await getBCVRates();
                if (raffle.currency === 'USD') {
                    setExchangeRate(rates.usd.rate);
                } else if (raffle.currency === 'VES') {
                    setExchangeRate(1 / rates.usd.rate);
                }
            } catch (error) {
                console.error("Error al obtener las tasas de cambio:", error);
                setExchangeRate(null);
            } finally {
                setIsLoadingRates(false);
            }
        };

        fetchRates();

    }, [initialExchangeRate, raffle.currency]);

    // Manejadores de eventos
    const resetForm = () => {
        setApiState(initialState); setTicketCount(2); setReservedTickets([]);
        setPaymentMethodId(''); setBuyerName(''); setBuyerEmail('');
        setCountryCode('+58'); setBuyerPhone(''); setPaymentReference('');
        setPaymentScreenshot(null); setPreview(null); setReservationError('');
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setPaymentScreenshot(file);
        setPreview(file ? URL.createObjectURL(file) : null);
    };

    const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (countryCode === '+58' && value.startsWith('0')) value = value.substring(1);
        setBuyerPhone(value);
    };

    const handleTicketCountChange = (value: number) => setTicketCount(Math.max(1, value));

    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Evento para Meta Pixel
        tracking.trackPurchase({
            value: totalAmount,
            currency: raffle.currency,
            num_items: ticketCount,
        });

        // 👇 3. Añade el evento para Simple Analytics
        tracking.trackSimpleAnalyticsEvent('confirm_purchase');

        setIsPending(true);
        setReservationError('');
        setApiState(initialState);

        try {
            // 1. Reservar tickets
            const reserveFormData = new FormData();
            reserveFormData.append('raffleId', raffle.id);
            reserveFormData.append('ticketCount', ticketCount.toString());
            const reserveResult = await reserveTicketsAction(reserveFormData);

            if (!reserveResult.success || !reserveResult.data?.reservedTickets) {
                setReservationError(reserveResult.message || 'No se pudieron apartar los tickets. Intenta con otra cantidad.');
                setIsPending(false);
                return;
            }

            // 2. Construir y enviar datos de compra
            const ticketsToBuy = reserveResult.data.reservedTickets;
            const buyFormData = new FormData();
            buyFormData.append('raffleId', raffle.id);
            buyFormData.append('reservedTickets', ticketsToBuy.join(','));
            buyFormData.append('paymentMethod', selectedPaymentMethod?.title || '');
            buyFormData.append('name', buyerName);
            buyFormData.append('email', buyerEmail);
            buyFormData.append('phone', `${countryCode.replace('+', '')}${buyerPhone}`);
            buyFormData.append('paymentReference', paymentReference);
            if (paymentScreenshot) buyFormData.append('paymentScreenshot', paymentScreenshot);

            // --- ¡NUEVO! Añadir el código de referido al FormData si existe ---
            if (referralCode) {
                buyFormData.append('referralCode', referralCode);
            }

            const buyResult = await buyTicketsAction(buyFormData);
            setApiState(buyResult);

        } catch (error) {
            setApiState({ success: false, message: 'Ocurrió un error inesperado.' });
        } finally {
            setIsPending(false);
        }
    };

    // Renderizado condicional para la pantalla de éxito/error
    if (apiState.success || (apiState.message && apiState.message.trim() !== '')) {
        return (
            <CardContent className="p-0">
                <div className="p-5">
                    <div className="text-center space-y-6 py-6 animate-fade-in">
                        {apiState.success ? (
                            <div className="p-4 rounded-lg bg-green-950/50 border border-green-400/30">
                                <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                                <AlertDescription className="text-xl font-bold text-green-300">¡Solicitud recibida!</AlertDescription>
                                <p className="text-base text-green-400/80 mt-2">
                                    Tus tickets están pendientes por confirmar. Te avisaremos por correo y WhatsApp cuando validemos el pago. ¡Mucha suerte!
                                </p>
                            </div>
                        ) : (
                            <div className="p-4 rounded-lg bg-red-950/50 border border-red-400/30">
                                <X className="h-16 w-16 text-red-400 mx-auto mb-4" />
                                <AlertDescription className="text-xl font-bold text-red-300">{apiState.message}</AlertDescription>
                                <p className="text-base text-red-400/80 mt-2">Por favor, verifica los datos e inténtalo de nuevo.</p>
                            </div>
                        )}
                        <Button onClick={resetForm} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-lg py-6 text-base">
                            {apiState.success ? 'Comprar más tickets' : 'Intentar de nuevo'}
                        </Button>
                    </div>
                </div>
            </CardContent>
        );
    }

    // Renderizado del formulario principal
    return (
        <CardContent className="p-0">
            <GlobalStyles />
            <Dialog open={isVerifyingPayment}>
                <DialogContent className="bg-zinc-900 border-zinc-700 text-white" hideCloseButton>
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl font-bold text-amber-400">Verificando tu Pago</DialogTitle>
                        <DialogDescription className="text-center text-zinc-400 pt-2">
                            Estamos confirmando tu pago. Esto puede tardar hasta un minuto.<br/>
                            <strong>Por favor, no cierres ni recargues esta página.</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Progress value={verificationProgress} className="w-full [&>div]:bg-amber-500" />
                        <p className="text-center text-sm text-zinc-500 mt-3">
                            {verificationProgress < 90 ? 'Esperando respuesta...' : 'Casi listo...'}
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
            
            <form onSubmit={handleFormSubmit} className="p-5 space-y-8 animate-fade-in">
                
                {/* Sección 1: Cantidad de Tickets */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-center text-white">1. Elige la cantidad de tickets</h3>
                    {reservationError && <Alert variant="destructive" className="bg-red-950/50 border-red-400/30 text-red-300"><AlertDescription>{reservationError}</AlertDescription></Alert>}
                    <div className="grid grid-cols-3 gap-3">
                        {TICKET_AMOUNTS.map((q) => (
                            <div key={q} className="relative">
                                <input type="radio" id={`quantity-${q}`} name="ticketQuantity" value={q} checked={ticketCount === q} onChange={() => setTicketCount(q)} className="sr-only peer" disabled={isPending}/>
                                <label htmlFor={`quantity-${q}`} className="flex flex-col items-center justify-center p-2 h-20 rounded-lg border border-white/10 bg-black/20 cursor-pointer transition-all hover:bg-white/5 peer-checked:border-amber-400/50 peer-checked:bg-amber-950/30 peer-checked:ring-2 peer-checked:ring-amber-400/50">
                                    <span className="text-2xl font-bold text-white">{q}</span>
                                    <span className="text-xs text-zinc-400 uppercase">tickets</span>
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="bg-black/20 p-4 rounded-lg border border-white/10 text-center">
                        <div className="flex items-center justify-center space-x-3 mb-4">
                            <Button type="button" onClick={() => handleTicketCountChange(ticketCount - 1)} disabled={isPending || ticketCount <= 1} variant="outline" size="icon" className="h-10 w-10 text-zinc-300 border-white/10 bg-transparent hover:bg-white/5"><Minus className="h-5 w-5"/></Button>
                            <Input type="number" value={ticketCount} onChange={(e) => handleTicketCountChange(parseInt(e.target.value) || 1)} min="1" className="w-28 text-center !text-7xl h-28 bg-black/30 border-white/10 text-white rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                            <Button type="button" onClick={() => handleTicketCountChange(ticketCount + 1)} disabled={isPending} variant="outline" size="icon" className="h-10 w-10 text-zinc-300 border-white/10 bg-transparent hover:bg-white/5"><Plus className="h-5 w-5"/></Button>
                        </div>
                        <p className="text-zinc-400 text-sm">{ticketCount} ticket{ticketCount !== 1 ? 's' : ''} x {currencyData.pricePerTicket}</p>
                        <p className="text-4xl font-extrabold text-amber-400 leading-tight mb-2">{currencyData.totalPrimary}</p>
                        {isLoadingRates ? <p className="text-zinc-500 text-sm h-9 flex items-center justify-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando tasa...</p> : (currencyData.totalSecondary && (
                            <p className="text-xl font-semibold text-zinc-300 mt-2 p-2 bg-white/5 rounded-md border border-white/10 flex items-center justify-center h-9">
                                <span className="text-zinc-400 text-base mr-2">≈</span> 
                                <span className="text-green-400">{currencyData.secondaryCurrencySymbol} {currencyData.totalSecondary}</span>
                            </p>
                        ))}
                    </div>
                </div>
                <hr className="border-t border-zinc-700" />
                
                {/* Sección 2: Método de Pago */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-center text-white">2. Selecciona tu método de pago</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {paymentMethods.map(method => (
                            <PaymentMethodItem
                                key={method.id}
                                method={method}
                                isSelected={paymentMethodId === method.id}
                                onSelect={() => setPaymentMethodId(method.id)}
                            />
                        ))}
                    </div>
                    {selectedPaymentMethod && <PaymentDetailsDisplay method={selectedPaymentMethod} amount={totalAmount} currency={raffle.currency} exchangeRate={exchangeRate} />}
                </div>
                <hr className="border-t border-zinc-700" />

                {/* Sección 3: Datos de Contacto */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-center text-white">3. Completa tus datos</h3>
                    <div className="space-y-4">
                        <div className="relative"><Label htmlFor="name" className="text-zinc-400">Nombre y apellido*</Label><Input id="name" value={buyerName} onChange={e => setBuyerName(e.target.value)} required className="h-12 pl-10 bg-black/30 border-white/10 text-white rounded-lg"/><User className="absolute left-3 top-9 h-5 w-5 text-zinc-500"/></div>
                        <div className="relative"><Label htmlFor="email" className="text-zinc-400">Email*</Label><Input id="email" type="email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} required className="h-12 pl-10 bg-black/30 border-white/10 text-white rounded-lg"/><AtSign className="absolute left-3 top-9 h-5 w-5 text-zinc-500"/></div>
                        <div><Label htmlFor="phone" className="text-zinc-400">Teléfono (WhatsApp)*</Label><div className="flex items-center mt-1"><CountryCodeSelector value={countryCode} onChange={setCountryCode} disabled={isPending} /><Input id="phone" type="tel" placeholder="412 1234567" value={buyerPhone} onChange={handlePhoneChange} required className="h-12 bg-black/30 border-white/10 text-white rounded-l-none focus-visible:ring-offset-0 focus-visible:ring-1" /></div></div>
                        <div className="relative"><Label htmlFor="paymentReference" className="text-zinc-400">Nro. de Referencia del pago*</Label><Input id="paymentReference" value={paymentReference} onChange={e => setPaymentReference(e.target.value)} required className="h-12 pl-10 bg-black/30 border-white/10 text-white rounded-lg"/><FileText className="absolute left-3 top-9 h-5 w-5 text-zinc-500"/></div>
                    </div>
                </div>
                <hr className="border-t border-zinc-700" />

                {/* Sección 4: Subir Comprobante (AHORA OPCIONAL) */}
                <div className="space-y-6">
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-white mb-2">4. Sube el comprobante de pago</h3>
                        <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-3 mb-4">
                            <p className="text-amber-300 text-sm font-medium">¿No pudiste subir tu foto?</p>
                            <p className="text-amber-200/80 text-xs mt-1">
                                Es opcional. Solo envía el número de referencia para confirmar el pago.
                            </p>
                        </div>
                    </div>
                    
                    <label htmlFor="paymentScreenshot" className="relative flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-zinc-600 border-dashed rounded-lg cursor-pointer bg-black/20 hover:bg-black/40 p-4">
                        <div className="text-center text-zinc-400"><UploadCloud className="w-10 h-10 mb-3 text-amber-500 mx-auto" /><p className="font-semibold"><span className="text-amber-400">Click para subir</span> o arrastra</p><p className="text-xs mt-1">PNG, JPG, GIF (MAX. 5MB) - Opcional</p></div>
                        <Input id="paymentScreenshot" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                    {preview && (<div className="relative mt-2 w-28 h-28 mx-auto"><Image src={preview} alt="Vista previa" layout="fill" className="rounded-lg border-2 border-zinc-500 object-cover" /><button type="button" onClick={() => { setPreview(null); setPaymentScreenshot(null); }} className="absolute -top-2 -right-2 bg-zinc-800 text-white rounded-full p-1 border-2 border-zinc-500"><X className="h-4 w-4" /></button></div>)}
                </div>
                
                {/* Botón de Envío Final */}
                <Button 
                    type="submit" 
                    disabled={isPending || !paymentMethodId} 
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-lg py-6 text-base shadow-lg shadow-black/40 transition-all duration-300 ease-out hover:scale-105 hover:drop-shadow-[0_0_15px_theme(colors.amber.500)] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:drop-shadow-none"
                >
                    {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Ticket className="mr-2 h-5 w-5" />}
                    Confirmar Compra
                </Button>
            </form>
        </CardContent>
    );
}