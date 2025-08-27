"use client";

import { useEffect, useState } from 'react';
// Se importan ambas acciones
import { buyTicketsAction, reserveTicketsAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Se importa el componente Badge para mostrar los números
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingCart, X, Ticket, CreditCard, AlertCircle } from 'lucide-react';
// CAMBIO: Se elimina la importación de getBCVRate
import { formatSaleCurrency } from '@/lib/exchangeRates';
// NUEVA importación del componente para mostrar detalles de pago
import { PaymentDetailsDisplay } from './PaymentDetailsDisplay';

// Se actualiza la interfaz para los métodos de pago
interface PaymentMethod {
  id: string;
  title: string;
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
    // Se añade la moneda a la rifa
    currency: 'USD' | 'VES';
    status: string;
  };
  // Se recibe la lista de métodos de pago actualizada
  paymentMethods: PaymentMethod[];
  // NUEVO: La tasa de cambio ahora se recibe como una prop
  bcvRate: number;
}

const initialState = { success: false, message: '' };

// CAMBIO: El componente ahora recibe bcvRate en sus props
export function BuyTicketsForm({ raffle, paymentMethods, bcvRate }: BuyTicketsFormProps) {
  const [state, setState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);
  const [ticketCount, setTicketCount] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // ESTADOS CLAVE PARA EL FLUJO DE PAGO EN PASOS
  const [reservedTickets, setReservedTickets] = useState<string[]>([]);
  const [isReserving, setIsReserving] = useState(false);
  const [reservationError, setReservationError] = useState('');

  // ELIMINADO: Ya no se necesitan estados para la tasa de cambio
  // const [bcvRate, setBcvRate] = useState<number>(0);
  // const [bcvRateError, setBcvRateError] = useState<string | null>(null);
  // const [isLoadingRate, setIsLoadingRate] = useState(false);

  // --- LÓGICA DE MONEDA (AHORA USA LA PROP bcvRate) ---
  const isRaffleInUsd = raffle.currency === 'USD';
  const ticketPrice = parseFloat(raffle.price);
  const numberOfTickets = reservedTickets.length > 0 ? reservedTickets.length : ticketCount;

  // Calcula el total en la moneda original de la rifa
  const totalAmountInOriginalCurrency = numberOfTickets * ticketPrice;

  // Calcula los totales en ambas monedas para mostrarlos siempre
  const totalAmountUsd = isRaffleInUsd
    ? totalAmountInOriginalCurrency
    : (bcvRate > 0 ? totalAmountInOriginalCurrency / bcvRate : 0);

  const totalAmountVes = isRaffleInUsd
    ? (bcvRate > 0 ? totalAmountInOriginalCurrency * bcvRate : 0)
    : totalAmountInOriginalCurrency;
    
  // Función para formatear el monto en VES
  const formattedTotalVes = formatSaleCurrency(totalAmountVes, "BS", 1); // Tasa es 1 porque ya está en Bs.

  useEffect(() => {
    if (state.success) {
      // Limpiar todo el formulario tras una compra exitosa
      setTicketCount(2);
      setPaymentMethod('');
      setPaymentScreenshot(null);
      setPreview(null);
      setReservedTickets([]);
    }
  }, [state.success]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setPaymentScreenshot(file);
      setPreview(URL.createObjectURL(file));
    } else {
      setPaymentScreenshot(null);
      setPreview(null);
    }
  };

  // ELIMINADO: El useEffect que cargaba la tasa BCV ya no es necesario
  
  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value);
  };

  // PASO 1: Acción para apartar los tickets
  const handleReserveTickets = async () => {
    setIsReserving(true);
    setReservationError('');

    const formData = new FormData();
    formData.append('raffleId', raffle.id);
    formData.append('ticketCount', ticketCount.toString());

    const result = await reserveTicketsAction(formData);

    if (result.success && result.data?.reservedTickets) {
      setReservedTickets(result.data.reservedTickets);
    } else {
      setReservationError(result.message || 'No se pudieron apartar los tickets. Intenta de nuevo.');
    }
    setIsReserving(false);
  };

  // PASO 2: Acción para enviar el formulario de compra
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (reservedTickets.length === 0) return;

    setIsPending(true);
    const formData = new FormData(event.currentTarget);

    if (paymentScreenshot) {
      formData.append('paymentScreenshot', paymentScreenshot);
    }
    formData.append('reservedTickets', reservedTickets.join(','));

    const result = await buyTicketsAction(formData);
    setState(result);
    setIsPending(false);
  };

  if (raffle.status !== 'active') {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertDescription>
              Esta rifa no está activa actualmente.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // VISTA INICIAL: Selección de cantidad de tickets
  if (reservedTickets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            ¿Cuántos tickets quieres?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {reservationError && (
            <Alert variant="destructive">
              <AlertDescription>{reservationError}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-3">
            {[2, 5, 10, 50, 100].map((quantity) => (
              <Button
                key={quantity}
                variant={ticketCount === quantity ? "default" : "outline"}
                onClick={() => setTicketCount(quantity)}
                disabled={isReserving}
                className="h-16 flex flex-col"
              >
                <span className="text-lg font-bold">{quantity}</span>
                <span className="text-xs opacity-75">tickets</span>
              </Button>
            ))}

            <div className="relative">
              <Button
                variant={![2, 5, 10, 50, 100].includes(ticketCount) ? "default" : "outline"}
                onClick={() => document.getElementById('customTicketCount')?.focus()}
                disabled={isReserving}
                className="w-full h-16 flex flex-col items-center justify-center"
              >
                <span id="custom-label" className="text-lg font-bold">
                  {![2, 5, 10, 50, 100].includes(ticketCount) ? ticketCount : 'Otro'}
                </span>
                <span className="text-xs opacity-75">cantidad</span>
                <Input
                  id="customTicketCount"
                  type="number"
                  min="1"
                  value={ticketCount}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setTicketCount(value);
                  }}
                  className="absolute inset-0 w-full h-full bg-transparent text-transparent border-none focus:ring-0"
                />
              </Button>
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-lg border">
            <div className="text-center space-y-1">
              <div className="text-sm text-gray-600">
                {ticketCount} ticket{ticketCount !== 1 ? 's' : ''} x {isRaffleInUsd ? `$${ticketPrice.toFixed(2)}` : `${formatSaleCurrency(ticketPrice, "BS", 1)}`} c/u
              </div>
              
              <div className="text-3xl font-bold text-blue-600">
                Total: {isRaffleInUsd ? `$${totalAmountUsd.toFixed(2)}` : formattedTotalVes}
              </div>
            </div>
          </div>

          <Button onClick={handleReserveTickets} disabled={isReserving} className="w-full" size="lg">
            {isReserving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apartar mis números
          </Button>
        </CardContent>
      </Card>
    );
  }

  // VISTA 2: Formulario de pago después de apartar los tickets
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Completa tu Compra
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <h4 className="font-semibold text-green-800">¡Números reservados exitosamente!</h4>
          <p className="text-sm text-green-700 mt-1">Tienes 10 minutos para completar el pago.</p>
          <p className="text-xs text-green-600 mt-2">Tus números se revelarán una vez confirmemos el pago.</p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <input type="hidden" name="raffleId" value={raffle.id} />

          {state.message && (
            <Alert variant={state.success ? "default" : "destructive"}>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <div className="bg-slate-50 p-4 rounded-lg border">
            <h3 className="font-semibold mb-3 text-center">Resumen de compra</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Cantidad:</span>
                <span className="font-medium">{reservedTickets.length} tickets</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Total a pagar:</span>
                <div className="text-right">
                  {isRaffleInUsd ? (
                    <>
                      <span className="text-blue-600">${totalAmountUsd.toFixed(2)}</span>
                      {bcvRate > 0 && <div className="text-sm font-semibold text-green-700">~ {formattedTotalVes}</div>}
                    </>
                  ) : (
                    <>
                      <span className="text-green-700">{formattedTotalVes}</span>
                      {bcvRate > 0 && <div className="text-sm font-semibold text-blue-600">~ ${totalAmountUsd.toFixed(2)}</div>}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Selección de Método de Pago */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">1. Realiza la transferencia</Label>
            <p className="text-sm text-gray-600">Selecciona una cuenta para ver los datos y realizar el pago.</p>
            <div className="grid gap-3">
              {paymentMethods.map(method => (
                <div key={method.id}>
                  <input
                    type="radio"
                    id={`payment-${method.id}`}
                    name="paymentMethod"
                    value={method.title}
                    checked={paymentMethod === method.title}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                    disabled={isPending}
                    className="sr-only peer"
                  />
                  <label
                    htmlFor={`payment-${method.id}`}
                    className="block p-4 rounded-lg border-2 cursor-pointer transition-all peer-checked:border-blue-500 peer-checked:bg-blue-50"
                  >
                    <div className="font-medium">{method.title}</div>
                  </label>
                  {paymentMethod === method.title && (
                    <PaymentDetailsDisplay
                      method={method}
                      amountInVes={formattedTotalVes}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Datos del Comprador y Pago */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">2. Completa tus datos</Label>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre completo</Label>
                <Input id="name" name="name" required disabled={isPending} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required disabled={isPending} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" name="phone" required disabled={isPending} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="paymentReference">Referencia de pago</Label>
                <Input id="paymentReference" name="paymentReference" required disabled={isPending} className="mt-1" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold" htmlFor="paymentScreenshot">3. Sube el comprobante de pago</Label>
            <Input
              id="paymentScreenshot"
              name="paymentScreenshot"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
              disabled={isPending}
            />
            {preview && (
              <div className="relative mt-2 w-32 h-32">
                <img src={preview} alt="Vista previa" className="rounded-lg border object-cover w-full h-full" />
                <button
                  type="button"
                  onClick={() => { setPreview(null); setPaymentScreenshot(null); }}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !paymentMethod || !paymentScreenshot}
            size="lg"
          >
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
            ) : (
              `Confirmar Compra por ${isRaffleInUsd ? `$${totalAmountUsd.toFixed(2)}` : formattedTotalVes}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}