"use client";

import { useState, useMemo, ChangeEvent } from 'react';
import { buyTicketsAction, reserveTicketsAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, X, Ticket, CheckCircle, UploadCloud, User, AtSign, Phone, FileText, Minus, Plus, Check } from 'lucide-react';
import { PaymentDetailsDisplay } from './PaymentDetailsDisplay';
import Image from 'next/image';

// --- INTERFACES (Sin cambios) ---
interface PaymentMethod {
  id: string;
  title: string;
  iconUrl?: string | null;
  bankName?: string | null;
  rif?: string | null;
  phoneNumber?: string | null;
  accountHolderName?: string | null;
  accountNumber?: string | null;
}

interface BuyTicketsFormProps {
  raffle: {
    id: string;
    name: string;
    price: string;
    currency: 'USD' | 'VES';
    status: string;
  };
  paymentMethods: PaymentMethod[];
}

// --- CONSTANTES Y ESTADO INICIAL (Modificado) ---
const initialState = { success: false, message: '' };

const formatCurrency = (amount: number, currency: 'USD' | 'VES', locale: string = 'es-VE') => {
  return new Intl.NumberFormat(locale, { 
    style: 'currency', 
    currency: currency,
    minimumFractionDigits: 2 
  }).format(amount);
};

const TICKET_AMOUNTS = [2, 5, 10, 15, 20, 25];

export function BuyTicketsForm({ raffle, paymentMethods }: BuyTicketsFormProps) {
  const [apiState, setApiState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);
  const [ticketCount, setTicketCount] = useState<number>(2);
  const [reservedTickets, setReservedTickets] = useState<string[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [reservationError, setReservationError] = useState('');
  
  const selectedPaymentMethod = useMemo(() => 
    paymentMethods.find(method => method.id === paymentMethodId)
  , [paymentMethodId, paymentMethods]);

  const currencyData = useMemo(() => {
    const price = parseFloat(raffle.price); 
    const numTickets = reservedTickets.length > 0 ? reservedTickets.length : ticketCount;
    const total = numTickets * price;

    return {
      pricePerTicket: formatCurrency(price, raffle.currency),
      totalPrimary: formatCurrency(total, raffle.currency),
    };
  }, [ticketCount, reservedTickets, raffle.price, raffle.currency]);

  // --- MANEJADORES DE EVENTOS ---
  const resetForm = () => {
    setApiState(initialState); setTicketCount(2); setReservedTickets([]);
    setPaymentMethodId(''); setBuyerName(''); setBuyerEmail(''); setBuyerPhone('');
    setPaymentReference(''); setPaymentScreenshot(null); setPreview(null); setReservationError('');
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPaymentScreenshot(file);
    if (file) { setPreview(URL.createObjectURL(file)); } 
    else { setPreview(null); }
  };
  
  const handleTicketCountChange = (value: number) => {
    const newCount = Math.max(1, value); 
    setTicketCount(newCount);
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); 
    setIsPending(true);
    setReservationError('');
    setApiState(initialState);

    // Paso 1: Reservar tickets
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
    setReservedTickets(ticketsToBuy); 

    // Paso 2: Realizar la compra
    const buyFormData = new FormData();
    buyFormData.append('raffleId', raffle.id);
    buyFormData.append('reservedTickets', ticketsToBuy.join(','));
    buyFormData.append('paymentMethod', selectedPaymentMethod?.title || '');
    buyFormData.append('name', buyerName);
    buyFormData.append('email', buyerEmail);
    buyFormData.append('phone', buyerPhone);
    buyFormData.append('paymentReference', paymentReference);
    if (paymentScreenshot) {
      buyFormData.append('paymentScreenshot', paymentScreenshot);
    }
    
    const buyResult = await buyTicketsAction(buyFormData);
    setApiState(buyResult);
    setIsPending(false);
  };

  // --- RENDERIZADO DEL FORMULARIO COMPLETO ---
  if (apiState.success || apiState.message) {
    return (
      <CardContent className="p-0">
        <div className="p-5">
          <div className="text-center space-y-6 py-6 animate-fade-in">
            {apiState.success ? (
              <div className="p-4 rounded-lg bg-green-950/50 border border-green-400/30">
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <AlertDescription className="text-xl font-bold text-green-300">{apiState.message}</AlertDescription>
                <p className="text-base text-green-400/80 mt-2">¡Mucha suerte! Revisa tu correo electrónico para ver tus tickets asignados.</p>
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
  
  return (
    <CardContent className="p-0">
      <form onSubmit={handleFormSubmit} className="p-5 space-y-8 animate-fade-in">
        
        {/* --- Sección 1: Cantidad de Tickets --- */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-center text-white">Cantidad de Tickets</h3>
          {reservationError && <Alert variant="destructive" className="bg-red-950/50 border-red-400/30 text-red-300"><AlertDescription>{reservationError}</AlertDescription></Alert>}
          <div className="grid grid-cols-2 gap-3">
            {TICKET_AMOUNTS.map((q) => (
                <div key={q} className="relative">
                    <input type="radio" id={`quantity-${q}`} name="ticketQuantity" value={q} checked={ticketCount === q} onChange={() => setTicketCount(q)} className="sr-only peer" disabled={isPending}/>
                    <label htmlFor={`quantity-${q}`} className="flex flex-col items-center justify-center p-2 h-20 rounded-lg border border-white/10 bg-black/20 cursor-pointer transition-all duration-200 hover:bg-white/5 peer-checked:border-amber-400/50 peer-checked:bg-amber-950/30 peer-checked:ring-2 peer-checked:ring-amber-400/50">
                        <span className="text-2xl font-bold text-white">{q}</span>
                        <span className="text-xs text-zinc-400 uppercase">tickets</span>
                    </label>
                </div>
            ))}
          </div>

          {/* --- Sumador y Restador --- */}
        <div className="bg-black/20 p-4 rounded-lg border border-white/10 text-center">
  <div className="flex items-center justify-center space-x-3 mb-4">
    <Button type="button" onClick={() => handleTicketCountChange(ticketCount - 1)} disabled={isPending || ticketCount <= 1} variant="outline" size="icon" className="h-10 w-10 text-zinc-300 border-white/10 bg-transparent hover:bg-white/5"><Minus className="h-5 w-5"/></Button>
    {/* ¡Aquí está la corrección para el tamaño de la fuente del número! */}
    <Input
      type="number"
      value={ticketCount}
      onChange={(e) => handleTicketCountChange(parseInt(e.target.value) || 0)}
      min="1"
      className="w-28 text-center !text-7xl h-28 bg-black/30 border-white/10 text-white rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
    <Button type="button" onClick={() => handleTicketCountChange(ticketCount + 1)} disabled={isPending} variant="outline" size="icon" className="h-10 w-10 text-zinc-300 border-white/10 bg-transparent hover:bg-white/5"><Plus className="h-5 w-5"/></Button>
  </div>
  <p className="text-zinc-400 text-sm">{ticketCount} ticket{ticketCount !== 1 ? 's' : ''} x {currencyData.pricePerTicket}</p>
  <p className="text-3xl font-bold text-amber-400">{currencyData.totalPrimary}</p>
</div>
        </div>

        <hr className="border-t border-zinc-700" />
        
        {/* --- Sección 2: Método de Pago --- */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-center text-white">Selecciona tu método de pago</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {paymentMethods.map(method => (
              <div key={method.id} className="relative">
                <input type="radio" id={`payment-${method.id}`} name="paymentMethod" value={method.id} checked={paymentMethodId === method.id} onChange={(e) => setPaymentMethodId(e.target.value)} className="sr-only peer" />
                <Label htmlFor={`payment-${method.id}`} className="flex flex-col items-center justify-center p-4 h-28 rounded-lg border border-white/10 bg-black/20 cursor-pointer transition-all duration-200 transform hover:bg-white/5 peer-checked:border-amber-400/50 peer-checked:bg-amber-950/30 peer-checked:ring-2 peer-checked:ring-amber-400/50">
                  <div className="absolute top-2 right-2 w-5 h-5 bg-zinc-700 rounded-full flex items-center justify-center transition-all duration-200 peer-checked:bg-amber-500"><Check className="h-3 w-3 text-zinc-900 transition-opacity opacity-0 peer-checked:opacity-100" /></div>
                  {method.iconUrl && <Image src={method.iconUrl} alt={method.title} width={40} height={40} className="object-contain h-10"/>}
                  <span className="text-xs font-semibold text-white text-center mt-2">{method.title}</span>
                </Label>
              </div>
            ))}
          </div>
          {selectedPaymentMethod && <PaymentDetailsDisplay method={selectedPaymentMethod} />}
        </div>
        
        <hr className="border-t border-zinc-700" />

        {/* --- Sección 3: Datos de Contacto y Referencia --- */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-center text-white">Completa tus datos de compra</h3>
          <div className="space-y-4">
            <div className="relative"><Label htmlFor="name" className="text-zinc-400">Nombre y apellido*</Label><Input id="name" value={buyerName} onChange={e => setBuyerName(e.target.value)} required className="h-12 pl-10 bg-black/30 border-white/10 text-white text-base rounded-lg"/><User className="absolute left-3 top-9 h-5 w-5 text-zinc-500"/></div>
            <div className="relative"><Label htmlFor="email" className="text-zinc-400">Email</Label><Input id="email" type="email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} required className="h-12 pl-10 bg-black/30 border-white/10 text-white text-base rounded-lg"/><AtSign className="absolute left-3 top-9 h-5 w-5 text-zinc-500"/></div>
            <div className="relative"><Label htmlFor="phone" className="text-zinc-400">Teléfono (WhatsApp)</Label><Input id="phone" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} required className="h-12 pl-10 bg-black/30 border-white/10 text-white text-base rounded-lg"/><Phone className="absolute left-3 top-9 h-5 w-5 text-zinc-500"/></div>
            <div className="relative"><Label htmlFor="paymentReference" className="text-zinc-400">Nro. de Referencia del pago</Label><Input id="paymentReference" value={paymentReference} onChange={e => setPaymentReference(e.target.value)} required className="h-12 pl-10 bg-black/30 border-white/10 text-white text-base rounded-lg"/><FileText className="absolute left-3 top-9 h-5 w-5 text-zinc-500"/></div>
          </div>
        </div>

        <hr className="border-t border-zinc-700" />

        {/* --- Sección 4: Subir Comprobante --- */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-center text-white">Sube el comprobante de pago</h3>
          <label htmlFor="paymentScreenshot" className="relative flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-zinc-600 border-dashed rounded-lg cursor-pointer bg-black/20 hover:bg-black/40 p-4 transition-colors">
            <div className="text-center text-zinc-400">
              <UploadCloud className="w-10 h-10 mb-3 text-amber-500 mx-auto" />
              <p className="text-base font-semibold"><span className="text-amber-400">Click para subir</span> o arrastra el archivo</p>
              <p className="text-xs mt-1">PNG, JPG, GIF (MAX. 5MB)</p>
            </div>
            <Input id="paymentScreenshot" type="file" className="hidden" accept="image/*" onChange={handleFileChange} required />
          </label>
          {preview && (
            <div className="relative mt-2 w-28 h-28 mx-auto">
              <Image src={preview} alt="Vista previa" layout="fill" className="rounded-lg border-2 border-zinc-500 object-cover" />
              <button type="button" onClick={() => { setPreview(null); setPaymentScreenshot(null); }} className="absolute -top-2 -right-2 bg-zinc-800 text-white rounded-full p-1 border-2 border-zinc-500"><X className="h-4 w-4" /></button>
            </div>
          )}
        </div>

        <hr className="border-t border-zinc-700" />
        
        {/* --- Botón de Submit Final --- */}
        <Button type="submit" disabled={isPending || !paymentScreenshot || !paymentMethodId} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-lg py-6 text-base shadow-lg shadow-black/40 transition-all duration-300 ease-out hover:scale-105 hover:drop-shadow-[0_0_15px_theme(colors.amber.500)]">
          {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Ticket className="mr-2 h-5 w-5" />}
          Confirmar Compra
        </Button>
      </form>
    </CardContent>
  );
}