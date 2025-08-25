"use client";

import { useEffect, useState } from 'react';
// Se importan ambas acciones
import { buyTicketsAction, reserveTicketsAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Se importa el componente Badge para mostrar los números
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingCart, X, Info, Ticket, CreditCard } from 'lucide-react';

// Se añade el tipo para los métodos de pago
interface PaymentMethod {
  id: string;
  title: string;
  details: string;
}

interface BuyTicketsFormProps {
  raffle: {
    id: string;
    name: string;
    price: string;
    status: string;
  };
  // Se recibe la lista de métodos de pago como prop
  paymentMethods: PaymentMethod[];
}

const initialState = { success: false, message: '' };

export function BuyTicketsForm({ raffle, paymentMethods }: BuyTicketsFormProps) {
  const [state, setState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);
  const [ticketCount, setTicketCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // NUEVOS ESTADOS para manejar el apartado de tickets
  const [reservedTickets, setReservedTickets] = useState<string[]>([]);
  const [isReserving, setIsReserving] = useState(false);
  const [reservationError, setReservationError] = useState('');
  
  // NUEVO: Estado para mostrar los detalles del método de pago seleccionado
  const [selectedMethodDetails, setSelectedMethodDetails] = useState('');

  // El total se calcula basado en los tickets apartados si existen, si no, en la cantidad seleccionada.
  const totalAmount = (reservedTickets.length > 0 ? reservedTickets.length : ticketCount) * parseFloat(raffle.price);

  useEffect(() => {
    if (state.success) {
      setTicketCount(1);
      setPaymentMethod('');
      setPaymentScreenshot(null);
      setPreview(null);
      // Al completar la compra, también se resetean los tickets apartados.
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
  
  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value);
    const selected = paymentMethods.find(pm => pm.title === value);
    setSelectedMethodDetails(selected ? selected.details : '');
  };

  // NUEVA FUNCIÓN para apartar los tickets
  const handleReserveTickets = async () => {
    setIsReserving(true);
    setReservationError('');
    
    const formData = new FormData();
    formData.append('raffleId', raffle.id);
    formData.append('ticketCount', ticketCount.toString());

    // Se asume que reserveTicketsAction devuelve un objeto con { success: boolean, message: string, data?: { reservedTickets: string[] } }
    const result = await reserveTicketsAction(formData);

    if (result.success && result.data?.reservedTickets) {
      setReservedTickets(result.data.reservedTickets);
    } else {
      setReservationError(result.message);
    }
    setIsReserving(false);
  };
  
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // No se envía el formulario si no hay tickets apartados
    if (reservedTickets.length === 0) return;

    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    
    if (paymentScreenshot) {
      formData.append('paymentScreenshot', paymentScreenshot);
    }
    // Se agregan los tickets apartados al FormData para enviarlos a la acción
    formData.append('reservedTickets', reservedTickets.join(','));
    
    const result = await buyTicketsAction(formData);

    setState(result);
    setIsPending(false);

    // El reseteo del formulario se maneja en el useEffect
  };

  if (raffle.status !== 'active') {
    return (
      <Card className="max-w-2xl mx-auto">
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

  // --- RENDERIZADO CONDICIONAL ---

  // 1. Si no hay tickets apartados, muestra la selección de cantidad y el botón para apartar.
  if (reservedTickets.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
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
          
          {/* Predefined quantity buttons */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
              
              {/* Custom quantity button */}
              <div className="relative">
                <Button
                  variant={![2, 5, 10, 50, 100].includes(ticketCount) ? "default" : "outline"}
                  onClick={() => {
                    const customInput = document.getElementById('customTicketCount') as HTMLInputElement;
                    customInput?.focus();
                  }}
                  disabled={isReserving}
                  className="w-full h-16 flex flex-col"
                >
                  <span className="text-lg font-bold">Otro</span>
                  <span className="text-xs opacity-75">cantidad</span>
                </Button>
                {![2, 5, 10, 50, 100].includes(ticketCount) && (
                  <Input
                    id="customTicketCount"
                    type="number"
                    min="1"
                    max="1000"
                    value={ticketCount}
                    onChange={(e) => setTicketCount(parseInt(e.target.value) || 1)}
                    disabled={isReserving}
                    className="absolute top-1 left-1 right-1 h-8 text-center text-sm"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Total amount display */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <div className="text-center space-y-2">
              <div className="text-sm text-gray-600">
                {ticketCount} ticket{ticketCount !== 1 ? 's' : ''} × ${raffle.price} c/u
              </div>
              <div className="text-2xl font-bold text-blue-600">
                Total: ${totalAmount.toFixed(2)}
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

  // 2. Si ya hay tickets apartados, muestra el formulario de compra completo.
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Completa tu Compra
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Confirmation of reservation without showing numbers */}
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-center">
            <h4 className="font-semibold text-green-800 mb-2">¡Números reservados exitosamente!</h4>
            <div className="flex items-center justify-center gap-4 text-sm text-green-700">
              <span className="flex items-center gap-1">
                <Ticket className="h-4 w-4" />
                {reservedTickets.length} tickets apartados
              </span>
              <span>⏰ 10 minutos para completar</span>
            </div>
            <p className="text-xs text-green-600 mt-2">Tus números se revelarán una vez confirmemos el pago</p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <input type="hidden" name="raffleId" value={raffle.id} />
          
          {state.message && (
            <Alert variant={state.success ? "default" : "destructive"} className={state.success ? "bg-green-100 border-green-300 text-green-800" : ""}>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          {/* Purchase Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-lg mb-3 text-center">Resumen de compra</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Precio por ticket:</span>
                <span className="font-medium">${raffle.price}</span>
              </div>
              <div className="flex justify-between">
                <span>Cantidad:</span>
                <span className="font-medium">{reservedTickets.length}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-blue-600">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              ¿A dónde quieres transferir?
            </Label>
            <p className="text-sm text-gray-600">Selecciona una cuenta:</p>
            
            <div className="grid gap-3">
              {paymentMethods.map(method => (
                <div key={method.id} className="relative">
                  <input
                    type="radio"
                    id={`payment-${method.id}`}
                    name="paymentMethod"
                    value={method.title}
                    checked={paymentMethod === method.title}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                    disabled={isPending}
                    className="sr-only"
                  />
                  <label
                    htmlFor={`payment-${method.id}`}
                    className={`
                      block p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${paymentMethod === method.title 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {/* Placeholder for payment method logo */}
                      <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center border">
                        <span className="text-xs text-gray-500">Logo</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{method.title}</div>
                        <div className="text-sm text-gray-600 mt-1">{method.details}</div>
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* User Information */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Datos del comprador</Label>
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
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Detalles del pago</Label>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentReference">Referencia de pago</Label>
                <Input 
                  id="paymentReference" 
                  name="paymentReference" 
                  placeholder="Número de referencia del pago" 
                  required 
                  disabled={isPending} 
                  className="mt-1" 
                />
              </div>
              <div>
                <Label htmlFor="paymentScreenshot">Captura del pago</Label>
                <Input
                  id="paymentScreenshot"
                  name="paymentScreenshot"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                  disabled={isPending}
                  className="mt-1"
                />
              </div>
            </div>
            {preview && (
              <div className="relative mt-3 max-w-xs">
                <img src={preview} alt="Vista previa de la captura de pago" className="rounded-lg border object-cover h-32 w-auto" />
                <button 
                  type="button" 
                  onClick={() => { setPreview(null); setPaymentScreenshot(null); }} 
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 leading-none hover:bg-red-700"
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
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Compra - ${totalAmount.toFixed(2)}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}