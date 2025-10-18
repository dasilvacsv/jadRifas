// src/components/forms/BuyTicketsForm.tsx
"use client";

// --- Imports para el Formulario ---
import { useState, useMemo, ChangeEvent, useEffect, useRef, memo, useCallback } from 'react';
import * as tracking from '@/lib/tracking';
import { buyTicketsAction, reserveTicketsAction } from '@/lib/actions';
import { getRaffleAvailabilityInfo } from '@/features/rifas/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { PaymentDetailsDisplay } from './PaymentDetailsDisplay';
import { CountryCodeSelector } from '@/components/ui/CountryCodeSelector';
import { getBCVRates } from '@/lib/exchangeRates';
import Image from 'next/image';
import { Loader2, X, CheckCircle, UploadCloud, User, AtSign, Phone, FileText, Minus, Plus, Check, Ticket, AlertTriangle, RefreshCw } from 'lucide-react';

// --- INICIO: LÓGICA DEL FORMULARIO ---
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

interface BuyTicketsFormProps {
    raffle: {
        id: string;
        name: string;
        price: string;
        currency: 'USD' | 'VES';
        status: string;
        minimumTickets: number;
    };
    paymentMethods: PaymentMethod[];
    exchangeRate: number | null;
    campaignCode?: string;
    referralUserCode?: string;
    availabilityInfo?: {
        available: number;
        sold: number;
        reserved: number;
        taken: number;
        total: number;
        percentage: number;
    };
}

// Constantes y Estado Inicial
const initialState = { success: false, message: '' };
const TICKET_AMOUNTS = [1, 5, 10, 25, 50, 100];
// ✅ SOLUCIÓN LOCALSTORAGE: Clave para guardar los datos en localStorage
const BUYER_DATA_KEY = 'raffleBuyerData';


// Función de utilidad para formatear moneda
const formatCurrency = (amount: number, currency: 'USD' | 'VES', locale: string = 'es-VE') => {
    const formattedNumber = new Intl.NumberFormat(locale, {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
    return currency === 'USD' ? `$${formattedNumber}` : `${formattedNumber} Bs`;
};

// Estilos CSS para el efecto de borde brillante
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
            @keyframes pulse-bright { 
                0%, 100% { box-shadow: 0 0 15px 0px rgba(23, 224, 122, 0.4); } 
                50% { box-shadow: 0 0 25px 5px rgba(23, 224, 122, 0.7); } 
            }
            .pulse-bright-anim { 
                animation: pulse-bright 2.5s infinite ease-in-out; 
            }
        `}</style>
    );
});

// Componente para mostrar un método de pago
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
                    : 'border-white/10 bg-white/[.07] hover:bg-white/10 text-zinc-400 hover:text-white'
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
            {method.iconUrl && <img src={method.iconUrl} alt={method.title} width={40} height={40} className="object-contain h-10" />}
            <span className="text-xs font-semibold text-white text-center mt-2">{method.title}</span>
        </label>
    );
});

// Componente Principal del Formulario
export function BuyTicketsForm({
    raffle,
    paymentMethods,
    exchangeRate: initialExchangeRate,
    campaignCode,
    referralUserCode,
    availabilityInfo
}: BuyTicketsFormProps) {
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
    const [paymentMethodError, setPaymentMethodError] = useState('');
    
    const [currentAvailability, setCurrentAvailability] = useState(availabilityInfo);
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
    const [availabilityError, setAvailabilityError] = useState('');

    const isFirstRender = useRef(true);

    // Referencias a elementos
    const verificationTimers = useRef<{ modalTimer: NodeJS.Timeout | null, progressTimer: NodeJS.Timer | null }>({
        modalTimer: null,
        progressTimer: null
    });
    const paymentMethodsSectionRef = useRef<HTMLDivElement>(null);

    // ✅ SOLUCIÓN LOCALSTORAGE: Cargar datos del comprador al iniciar el componente.
    useEffect(() => {
        try {
            const savedDataString = localStorage.getItem(BUYER_DATA_KEY);
            if (savedDataString) {
                const savedData = JSON.parse(savedDataString);
                if (savedData.name) setBuyerName(savedData.name);
                if (savedData.email) setBuyerEmail(savedData.email);
                if (savedData.countryCode) setCountryCode(savedData.countryCode);
                if (savedData.phone) setBuyerPhone(savedData.phone);
            }
        } catch (error) {
            console.error("Error al cargar los datos del comprador desde localStorage:", error);
        }
    }, []); // El array vacío asegura que este efecto se ejecute solo una vez.

    // Función para verificar disponibilidad en tiempo real
    const checkAvailability = useCallback(async () => {
        if (!raffle.id) return;
        
        setIsCheckingAvailability(true);
        setAvailabilityError('');
        
        try {
            const result = await getRaffleAvailabilityInfo(raffle.id);
            if (result.success) {
                setCurrentAvailability(result.data);
                
                if (ticketCount > result.data.available) {
                    const newCount = Math.max(1, Math.min(ticketCount, result.data.available));
                    setTicketCount(newCount);
                    if (result.data.available === 0) {
                        setReservationError('Ya no hay tickets disponibles.');
                    } else if (newCount < ticketCount) {
                        setReservationError(`Solo hay ${result.data.available} tickets disponibles. Se ajustó tu selección.`);
                    }
                }
            } else {
                setAvailabilityError('Error al verificar disponibilidad');
            }
        } catch (error) {
            console.error('Error checking availability:', error);
            setAvailabilityError('Error de conexión');
        } finally {
            setIsCheckingAvailability(false);
        }
    }, [raffle.id, ticketCount]);

    // Efecto para verificar disponibilidad periódicamente
    useEffect(() => {
        checkAvailability();
        const interval = setInterval(checkAvailability, 30000);
        return () => clearInterval(interval);
    }, [checkAvailability]);

    // Efecto para tracking
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const codeForTracking = referralUserCode || campaignCode;

        tracking.trackLead({ content_name: codeForTracking });
        tracking.trackSimpleAnalyticsEvent('select_tickets');

    }, [ticketCount, campaignCode, referralUserCode]);

    // Datos calculados y memos
    const selectedPaymentMethod = useMemo(() =>
        paymentMethods.find(method => method.id === paymentMethodId)
        , [paymentMethodId, paymentMethods]);

    const totalAmount = useMemo(() => ticketCount * parseFloat(raffle.price), [ticketCount, raffle.price]);
    
    const availableTickets = useMemo(() => {
        return currentAvailability ? Math.max(0, currentAvailability.available) : 0;
    }, [currentAvailability]);

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
        setApiState(initialState); 
        setTicketCount(2); 
        setReservedTickets([]);
        setPaymentMethodId(''); 
        setPaymentReference('');
        setPaymentScreenshot(null); setPreview(null); setReservationError('');
        setPaymentMethodError('');
        setAvailabilityError('');
        checkAvailability();
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

    const handleTicketCountChange = (value: number) => {
        const newValue = Math.max(1, Math.min(value, availableTickets));
        setTicketCount(newValue);
        
        if (reservationError) {
            setReservationError('');
        }
        
        if (newValue !== value) {
            checkAvailability();
        }
    };

    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setPaymentMethodError('');
        setReservationError('');

        if (!paymentMethodId) {
            setPaymentMethodError('Por favor, selecciona un método de pago para continuar.');
            paymentMethodsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setIsCheckingAvailability(true);
        await checkAvailability();
        setIsCheckingAvailability(false);
        
        const latestAvailable = currentAvailability?.available || 0;
        
        if (ticketCount > latestAvailable) {
            setReservationError(`Solo hay ${latestAvailable} tickets disponibles. Por favor, reduce la cantidad.`);
            return;
        }

        if (availableTickets === 0) {
            setReservationError('No hay tickets disponibles en este momento.');
            return;
        }

        tracking.trackPurchase({
            value: totalAmount,
            currency: raffle.currency,
            num_items: ticketCount,
            content_name: referralUserCode || campaignCode,
        });
        tracking.trackSimpleAnalyticsEvent('confirm_purchase');

        setIsPending(true);
        setReservationError('');
        setApiState(initialState);

        try {
            const reserveFormData = new FormData();
            reserveFormData.append('raffleId', raffle.id);
            reserveFormData.append('ticketCount', ticketCount.toString());
            const reserveResult = await reserveTicketsAction(reserveFormData);

            if (!reserveResult.success || !reserveResult.data?.reservedTickets) {
                setReservationError(reserveResult.message || 'No se pudieron apartar los tickets. Intenta con otra cantidad.');
                setIsPending(false);
                return;
            }

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
            if (campaignCode) buyFormData.append('campaignCode', campaignCode);
            if (referralUserCode) buyFormData.append('referralUserCode', referralUserCode);

            const buyResult = await buyTicketsAction(buyFormData);
            setApiState(buyResult);

            // ✅ SOLUCIÓN LOCALSTORAGE: Guardar los datos del comprador si la compra es exitosa.
            if (buyResult.success) {
                try {
                    const dataToSave = {
                        name: buyerName,
                        email: buyerEmail,
                        countryCode: countryCode,
                        phone: buyerPhone,
                    };
                    localStorage.setItem(BUYER_DATA_KEY, JSON.stringify(dataToSave));
                } catch (error) {
                    console.error("Error al guardar los datos del comprador en localStorage:", error);
                }
            }

        } catch (error) {
            setApiState({ success: false, message: 'Ocurrió un error inesperado.' });
        } finally {
            setIsPending(false);
        }
    };

    return (
        <Card className="bg-transparent border-none shadow-none">
            {apiState.success || (apiState.message && apiState.message.trim() !== '') ? (
                <CardContent className="p-0">
                    <div className="p-5">
                        <div className="text-center space-y-6 py-6 animate-fade-in">
                            {apiState.success ? (
                                <div className="p-4 rounded-lg bg-green-950/50 border border-green-400/30">
                                    <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                                    <AlertDescription className="text-xl font-bold text-green-300">¡Solicitud recibida!</AlertDescription>
                                    <p className="text-base text-green-400/80 mt-2">Tus tickets están pendientes por confirmar. Te avisaremos por correo y WhatsApp cuando validemos el pago. ¡Mucha suerte!</p>
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
            ) : (
                <CardContent className="p-0">
                    <GlobalStyles />
                    <Dialog open={isVerifyingPayment}>
                        <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
                            <DialogHeader>
                                <DialogTitle className="text-center text-2xl font-bold text-amber-400">Verificando tu Pago</DialogTitle>
                                <DialogDescription className="text-center text-zinc-400 pt-2">
                                    Estamos confirmando tu pago. <strong>No cierres ni recargues esta página.</strong>
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Progress value={verificationProgress} className="w-full [&>div]:bg-amber-500" />
                                <p className="text-center text-sm text-zinc-500 mt-3">
                                    {verificationProgress < 90 ? 'Esperando...' : 'Casi listo...'}
                                </p>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <form onSubmit={handleFormSubmit} className="p-5 space-y-8 animate-fade-in">

                        {/* Sección 1: Cantidad de Tickets */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-center text-white">1. Elige la cantidad de tickets</h3>
                            
                            {/* ✅ CAMBIO UI: Bloque de información de disponibilidad simplificado */}
                            <div className={`border rounded-lg p-3 text-center transition-colors ${
                                availableTickets === 0 
                                    ? 'bg-red-950/30 border-red-400/30' 
                                    : availableTickets < 100 
                                        ? 'bg-amber-950/30 border-amber-400/30' 
                                        : 'bg-zinc-900/50 border-white/10'
                            }`}>
                                {/* Mensajes de estado */}
                                {availableTickets < 100 && availableTickets > 0 && (
                                    <p className="text-amber-300 text-sm font-medium flex items-center justify-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        ¡Quedan pocos! Apúrate
                                    </p>
                                )}
                                {availableTickets === 0 && (
                                    <p className="text-red-300 text-sm font-medium flex items-center justify-center gap-2">
                                        <X className="h-4 w-4" />
                                        ¡Agotados!
                                    </p>
                                )}
                                    {availableTickets > 100 && (
                                    <p className="text-zinc-300 text-sm font-medium flex items-center justify-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-400" />
                                        Tickets disponibles para la venta
                                    </p>
                                )}
                            </div>
                            
                            {reservationError && <Alert variant="destructive" className="bg-red-950/50 border-red-400/30 text-red-300"><AlertDescription>{reservationError}</AlertDescription></Alert>}
                            
                            <div className="grid grid-cols-3 gap-3">
                                {TICKET_AMOUNTS.map((q) => {
                                    const isDisabled = isPending || q > availableTickets;
                                    return (
                                        <div key={q} className="relative">
                                            <input 
                                                type="radio" 
                                                id={`quantity-${q}`} 
                                                name="ticketQuantity" 
                                                value={q} 
                                                checked={ticketCount === q} 
                                                onChange={() => setTicketCount(q)} 
                                                className="sr-only peer" 
                                                disabled={isDisabled} 
                                            />
                                            <label 
                                                htmlFor={`quantity-${q}`} 
                                                className={`flex flex-col items-center justify-center p-2 h-20 rounded-lg border transition-all ${
                                                    isDisabled 
                                                        ? 'border-white/5 bg-white/[.02] cursor-not-allowed opacity-50' 
                                                        : 'border-white/10 bg-white/[.07] cursor-pointer hover:bg-white/10 peer-checked:border-amber-400/50 peer-checked:bg-amber-950/30 peer-checked:ring-2 peer-checked:ring-amber-400/50'
                                                }`}
                                            >
                                                <span className={`text-2xl font-bold ${isDisabled ? 'text-zinc-600' : 'text-white'}`}>{q}</span>
                                                <span className={`text-xs uppercase ${isDisabled ? 'text-zinc-700' : 'text-zinc-400'}`}>tickets</span>
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <div className="bg-white/[.07] p-4 rounded-lg border border-white/10 text-center">
                                <div className="flex items-center justify-center space-x-3 mb-4">
                                    <Button type="button" onClick={() => handleTicketCountChange(ticketCount - 1)} disabled={isPending || ticketCount <= 1} variant="outline" size="icon" className="h-10 w-10 text-zinc-300 border-white/10 bg-transparent hover:bg-white/5"><Minus className="h-5 w-5" /></Button>
                                    <Input 
                                        type="number" 
                                        value={ticketCount} 
                                        onChange={(e) => handleTicketCountChange(parseInt(e.target.value) || 1)} 
                                        min="1" 
                                        max={availableTickets}
                                        className="w-28 text-center !text-7xl h-28 bg-black/30 border-white/10 text-white rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                    />
                                    <Button type="button" onClick={() => handleTicketCountChange(ticketCount + 1)} disabled={isPending || ticketCount >= availableTickets} variant="outline" size="icon" className="h-10 w-10 text-zinc-300 border-white/10 bg-transparent hover:bg-white/5"><Plus className="h-5 w-5" /></Button>
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
                        <hr className="border-t border-zinc-700/50" />

                        {/* Sección 2: Método de Pago */}
                        <div ref={paymentMethodsSectionRef} className="space-y-6">
                            <h3 className="text-xl font-bold text-center text-white">2. Selecciona tu método de pago</h3>
                            {paymentMethodError && (
                                <Alert variant="destructive" className="bg-red-950/50 border-red-400/30 text-red-300 animate-in fade-in-50">
                                    <AlertDescription>{paymentMethodError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {paymentMethods.map(method => (
                                    <PaymentMethodItem
                                        key={method.id}
                                        method={method}
                                        isSelected={paymentMethodId === method.id}
                                        onSelect={() => {
                                            setPaymentMethodId(method.id);
                                            setPaymentMethodError('');
                                        }}
                                    />
                                ))}
                            </div>
                            {selectedPaymentMethod && <PaymentDetailsDisplay method={selectedPaymentMethod} amount={totalAmount} currency={raffle.currency} exchangeRate={exchangeRate} />}
                        </div>
                        <hr className="border-t border-zinc-700/50" />

                        {/* Sección 3: Datos de Contacto */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-center text-white">3. Completa tus datos</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-zinc-400">Nombre y apellido*</Label>
                                    <div className="relative flex items-center">
                                        <User className="absolute left-3 h-5 w-5 text-zinc-500" />
                                        <Input id="name" value={buyerName} onChange={e => setBuyerName(e.target.value)} required className="h-12 pl-10 bg-white/[.07] border-white/10 text-white rounded-lg" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-zinc-400">Email*</Label>
                                    <div className="relative flex items-center">
                                        <AtSign className="absolute left-3 h-5 w-5 text-zinc-500" />
                                        <Input id="email" type="email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} required className="h-12 pl-10 bg-white/[.07] border-white/10 text-white rounded-lg" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-zinc-400">Teléfono (WhatsApp)*</Label>
                                    <div className="flex items-center">
                                        <CountryCodeSelector value={countryCode} onChange={setCountryCode} disabled={isPending} />
                                        <Input id="phone" type="tel" placeholder="412 1234567" value={buyerPhone} onChange={handlePhoneChange} required className="h-12 bg-white/[.07] border-white/10 text-white rounded-l-none focus-visible:ring-offset-0 focus-visible:ring-1" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="paymentReference" className="text-zinc-400">Nro. de Referencia del pago*</Label>
                                    <div className="relative flex items-center">
                                        <FileText className="absolute left-3 h-5 w-5 text-zinc-500" />
                                        <Input id="paymentReference" value={paymentReference} onChange={e => setPaymentReference(e.target.value)} required className="h-12 pl-10 bg-white/[.07] border-white/10 text-white rounded-lg" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <hr className="border-t border-zinc-700/50" />

                        {/* Sección 4: Subir Comprobante (OPCIONAL) */}
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

                            <label htmlFor="paymentScreenshot" className="relative flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-zinc-600 border-dashed rounded-lg cursor-pointer bg-white/[.07] hover:bg-white/10 p-4">
                                <div className="text-center text-zinc-400"><UploadCloud className="w-10 h-10 mb-3 text-amber-500 mx-auto" /><p className="font-semibold"><span className="text-amber-400">Click para subir</span> o arrastra</p><p className="text-xs mt-1">PNG, JPG, GIF (MAX. 5MB) - Opcional</p></div>
                                <Input id="paymentScreenshot" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                            {preview && (<div className="relative mt-2 w-28 h-28 mx-auto"><Image src={preview} alt="Vista previa" layout="fill" className="rounded-lg border-2 border-zinc-500 object-cover" /><button type="button" onClick={() => { setPreview(null); setPaymentScreenshot(null); }} className="absolute -top-2 -right-2 bg-zinc-800 text-white rounded-full p-1 border-2 border-zinc-500"><X className="h-4 w-4" /></button></div>)}
                        </div>

                        {/* Botón de Envío Final */}
                        <Button
                            type="submit"
                            disabled={isPending || availableTickets === 0 || isCheckingAvailability}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-lg py-6 text-base shadow-lg shadow-black/40 transition-all duration-300 ease-out hover:scale-105 hover:drop-shadow-[0_0_15px_theme(colors.amber.500)] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:drop-shadow-none"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Procesando...
                                </>
                            ) : isCheckingAvailability ? (
                                <>
                                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                                    Verificando...
                                </>
                            ) : availableTickets === 0 ? (
                                <>
                                    <X className="mr-2 h-5 w-5" />
                                    Sin Tickets Disponibles
                                </>
                            ) : (
                                <>
                                    <Ticket className="mr-2 h-5 w-5" />
                                    Confirmar Compra
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            )}
        </Card>
    );
}