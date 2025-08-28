// src/components/forms/BuyTicketsForm.tsx (Diseño "Stardust")

"use client";

import { useState, useMemo } from 'react';
import { buyTicketsAction, reserveTicketsAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, ArrowLeft, X, Ticket, CheckCircle, UploadCloud, User, AtSign, Phone, FileText, Check } from 'lucide-react';
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

// --- CONSTANTES Y ESTADO INICIAL (Lógica sin cambios) ---
const initialState = { success: false, message: '' };
const formatSaleCurrency = (amount: number, currency: 'USD' | 'VES') => {
    return new Intl.NumberFormat('es-VE', { 
        style: 'currency', 
        currency: currency,
        minimumFractionDigits: 2 
    }).format(amount);
};


export function BuyTicketsForm({ raffle, paymentMethods }: BuyTicketsFormProps) {
  const [apiState, setApiState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState<number | string>(101);

  const selectedPaymentMethod = useMemo(() => 
    paymentMethods.find(method => method.id === paymentMethodId)
  , [paymentMethodId, paymentMethods]);

  const currencyData = useMemo(() => {
    const price = parseFloat(raffle.price);
    const numTickets = reservedTickets.length > 0 ? reservedTickets.length : ticketCount;
    const total = numTickets * price;
    return {
      pricePerTicket: formatSaleCurrency(price, raffle.currency),
      totalPrimary: formatSaleCurrency(total, raffle.currency),
    };
  }, [ticketCount, reservedTickets, raffle.price, raffle.currency]);

  // --- MANEJADORES DE EVENTOS (Lógica sin cambios) ---
  const resetForm = () => {
    setCurrentStep(1); setApiState(initialState); setTicketCount(2); setReservedTickets([]);
    setPaymentMethodId(''); setBuyerName(''); setBuyerEmail(''); setBuyerPhone('');
    setPaymentReference(''); setPaymentScreenshot(null); setPreview(null); setReservationError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPaymentScreenshot(file);
    if (file) { setPreview(URL.createObjectURL(file)); } 
    else { setPreview(null); }
  };

  const handleReserveTickets = async () => {
    setIsPending(true); setReservationError('');
    const formData = new FormData();
    formData.append('raffleId', raffle.id); formData.append('ticketCount', ticketCount.toString());
    const result = await reserveTicketsAction(formData);
    if (result.success && result.data?.reservedTickets) {
      setReservedTickets(result.data.reservedTickets); setCurrentStep(2);
    } else { setReservationError(result.message || 'No se pudieron apartar los tickets. Intenta con otra cantidad.'); }
    setIsPending(false);
  };
  
  const handleConfirmCustomAmount = () => {
    const newCount = parseInt(String(customAmount), 10);
    if (!isNaN(newCount) && newCount >= 1) { setTicketCount(newCount); }
    setIsDialogOpen(false);
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setIsPending(true);
    const formData = new FormData();
    formData.append('raffleId', raffle.id); formData.append('reservedTickets', reservedTickets.join(','));
    formData.append('paymentMethod', selectedPaymentMethod?.title || ''); formData.append('name', buyerName);
    formData.append('email', buyerEmail); formData.append('phone', buyerPhone);
    formData.append('paymentReference', paymentReference);
    if (paymentScreenshot) { formData.append('paymentScreenshot', paymentScreenshot); }
    const result = await buyTicketsAction(formData);
    setApiState(result); setCurrentStep(5);
    setIsPending(false);
  };

  // --- RENDERIZADO DE PASOS ---
  let stepContent;

  switch (currentStep) {
    case 1:
      const TICKET_AMOUNTS = [2, 5, 10, 20, 50];
      const isCustomAmountSelected = !TICKET_AMOUNTS.includes(ticketCount);
      stepContent = (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-xl font-bold text-center text-white">Elige la cantidad de tickets</h3>
          {reservationError && <Alert variant="destructive" className="bg-red-950/50 border-red-400/30 text-red-300"><AlertDescription>{reservationError}</AlertDescription></Alert>}
          <div className="grid grid-cols-3 gap-3">
            {TICKET_AMOUNTS.map((q) => (
                <div key={q} className="relative">
                    <input type="radio" id={`quantity-${q}`} name="ticketQuantity" value={q} checked={ticketCount === q} onChange={() => setTicketCount(q)} className="sr-only peer" disabled={isPending}/>
                    <label htmlFor={`quantity-${q}`} className="flex flex-col items-center justify-center p-2 h-20 rounded-lg border border-white/10 bg-black/20 cursor-pointer transition-all duration-200 hover:bg-white/5 peer-checked:border-amber-400/50 peer-checked:bg-amber-950/30 peer-checked:ring-2 peer-checked:ring-amber-400/50">
                        <span className="text-2xl font-bold text-white">{q}</span>
                        <span className="text-xs text-zinc-400 uppercase">tickets</span>
                    </label>
                </div>
            ))}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button disabled={isPending} className={`relative flex flex-col items-center justify-center p-2 h-20 rounded-lg border border-white/10 bg-black/20 cursor-pointer transition-all duration-200 hover:bg-white/5 ${isCustomAmountSelected ? 'border-amber-400/50 bg-amber-950/30 ring-2 ring-amber-400/50' : ''}`}>
                    <span className="text-2xl font-bold text-white">{isCustomAmountSelected ? ticketCount : 'Otro'}</span>
                    <span className="text-xs text-zinc-400 uppercase">cantidad</span>
                </button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900/80 backdrop-blur-md border-white/10 text-white rounded-xl">
                <DialogHeader><DialogTitle>Cantidad Personalizada</DialogTitle><DialogDescription className="text-zinc-400">Introduce el número de tickets que deseas comprar.</DialogDescription></DialogHeader>
                <Input type="number" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} className="my-4 text-3xl text-center h-16 bg-black/30 border-white/10"/>
                <DialogFooter><Button onClick={handleConfirmCustomAmount} className="w-full bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold py-3">Confirmar</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="bg-black/20 p-4 rounded-lg border border-white/10 text-center">
            <p className="text-zinc-400 text-sm">{ticketCount} ticket{ticketCount !== 1 ? 's' : ''} x {currencyData.pricePerTicket}</p>
            <p className="text-3xl font-bold text-amber-400">{currencyData.totalPrimary}</p>
          </div>
          <Button onClick={handleReserveTickets} disabled={isPending} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-lg py-6 text-base shadow-lg shadow-black/40 transition-all duration-300 ease-out hover:scale-105 hover:drop-shadow-[0_0_15px_theme(colors.amber.500)]">
            {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Ticket className="mr-2 h-5 w-5" />}
            Apartar mis números
          </Button>
        </div>
      );
      break;

    case 2:
      stepContent = (
        <div className="space-y-6 animate-fade-in">
          <div className="p-3 bg-green-950/50 border border-green-400/30 rounded-lg text-center">
            <h4 className="font-semibold text-green-300 flex items-center justify-center gap-2"><CheckCircle className="h-5 w-5"/>¡Tickets reservados con éxito!</h4>
          </div>
          <div className="bg-black/20 p-4 rounded-lg border border-white/10 text-center">
            <p className="text-zinc-400 text-sm">Total a pagar por {reservedTickets.length} tickets:</p>
            <p className="text-3xl font-bold text-amber-400">{currencyData.totalPrimary}</p>
          </div>
          <h3 className="text-xl font-bold text-center text-white pt-2">Selecciona tu método de pago</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {paymentMethods.map(method => (
              <div key={method.id} className="relative">
                <input type="radio" id={`payment-${method.id}`} name="paymentMethod" value={method.id} checked={paymentMethodId === method.id} onChange={(e) => setPaymentMethodId(e.target.value)} className="sr-only peer" />
                <label htmlFor={`payment-${method.id}`} className="flex flex-col items-center justify-center p-4 h-28 rounded-lg border border-white/10 bg-black/20 cursor-pointer transition-all duration-200 transform hover:bg-white/5 peer-checked:border-amber-400/50 peer-checked:bg-amber-950/30 peer-checked:ring-2 peer-checked:ring-amber-400/50">
                  <div className="absolute top-2 right-2 w-5 h-5 bg-zinc-700 rounded-full flex items-center justify-center transition-all duration-200 peer-checked:bg-amber-500"><Check className="h-3 w-3 text-zinc-900 transition-opacity opacity-0 peer-checked:opacity-100" /></div>
                  {method.iconUrl && <Image src={method.iconUrl} alt={method.title} width={40} height={40} className="object-contain h-10"/>}
                  <span className="text-xs font-semibold text-white text-center mt-2">{method.title}</span>
                </label>
              </div>
            ))}
          </div>
          {selectedPaymentMethod && <PaymentDetailsDisplay method={selectedPaymentMethod} />}
          <Button onClick={() => setCurrentStep(3)} disabled={!paymentMethodId} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-lg py-6 text-base">Siguiente</Button>
          <Button variant="outline" onClick={resetForm} className="w-full bg-transparent border-white/10 text-zinc-300 hover:bg-white/5 hover:border-white/20 hover:text-white"><ArrowLeft className="mr-2 h-4 w-4" /> Elegir otra cantidad</Button>
        </div>
      );
      break;
    
    case 3:
      stepContent = (
        <form onSubmit={(e) => { e.preventDefault(); setCurrentStep(4); }} className="space-y-6 animate-fade-in">
          <h3 className="text-xl font-bold text-center text-white">Completa tus datos de contacto</h3>
          <div className="space-y-4">
            <div className="relative"><Label htmlFor="name" className="text-zinc-400">Nombre completo</Label><Input id="name" value={buyerName} onChange={e => setBuyerName(e.target.value)} required className="h-12 pl-10 bg-black/30 border-white/10 text-white text-base rounded-lg"/><User className="absolute left-3 top-9 h-5 w-5 text-zinc-500"/></div>
            <div className="relative"><Label htmlFor="email" className="text-zinc-400">Email</Label><Input id="email" type="email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} required className="h-12 pl-10 bg-black/30 border-white/10 text-white text-base rounded-lg"/><AtSign className="absolute left-3 top-9 h-5 w-5 text-zinc-500"/></div>
            <div className="relative"><Label htmlFor="phone" className="text-zinc-400">Teléfono (WhatsApp)</Label><Input id="phone" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} required className="h-12 pl-10 bg-black/30 border-white/10 text-white text-base rounded-lg"/><Phone className="absolute left-3 top-9 h-5 w-5 text-zinc-500"/></div>
            <div className="relative"><Label htmlFor="paymentReference" className="text-zinc-400">Nro. de Referencia del pago</Label><Input id="paymentReference" value={paymentReference} onChange={e => setPaymentReference(e.target.value)} required className="h-12 pl-10 bg-black/30 border-white/10 text-white text-base rounded-lg"/><FileText className="absolute left-3 top-9 h-5 w-5 text-zinc-500"/></div>
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-lg py-6 text-base">Siguiente</Button>
          <Button variant="outline" onClick={() => setCurrentStep(2)} className="w-full bg-transparent border-white/10 text-zinc-300 hover:bg-white/5"><ArrowLeft className="mr-2 h-4 w-4" /> Atrás</Button>
        </form>
      );
      break;

    case 4:
      stepContent = (
        <form onSubmit={handleFormSubmit} className="space-y-6 animate-fade-in">
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
          <Button type="submit" disabled={isPending || !paymentScreenshot} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-lg py-6 text-base">
            {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Confirmar Compra'}
          </Button>
          <Button variant="outline" onClick={() => setCurrentStep(3)} className="w-full bg-transparent border-white/10 text-zinc-300 hover:bg-white/5"><ArrowLeft className="mr-2 h-4 w-4" /> Atrás</Button>
        </form>
      );
      break;

    case 5:
      stepContent = (
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
      );
      break;
  }

  return (
    <CardContent className="p-0">
      <div className="p-5">
        {stepContent}
      </div>
    </CardContent>
  );
}