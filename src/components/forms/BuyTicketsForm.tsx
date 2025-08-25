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
import { Loader2, ShoppingCart, X, Info } from 'lucide-react';

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
          <CardTitle>Aparta tus Tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {reservationError && (
            <Alert variant="destructive">
              <AlertDescription>{reservationError}</AlertDescription>
            </Alert>
          )}
          <div>
            <Label htmlFor="ticketCount">¿Cuántos tickets quieres?</Label>
            <Input
              id="ticketCount"
              name="ticketCount"
              type="number"
              min="1"
              max="100"
              value={ticketCount}
              onChange={(e) => setTicketCount(parseInt(e.target.value) || 1)}
              disabled={isReserving}
              className="mt-1"
            />
          </div>
          <div className="text-center font-bold text-xl">
            Total a Pagar: ${totalAmount.toFixed(2)}
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
        {/* Muestra los tickets apartados */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-center mb-2">Números Apartados para ti:</h4>
          <div className="flex flex-wrap gap-2 justify-center">
            {reservedTickets.map(num => (
              <Badge key={num} variant="default" className="text-lg">{num}</Badge>
            ))}
          </div>
          <p className="text-xs text-center text-gray-500 mt-2">Tienes 10 minutos para completar la compra.</p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <input type="hidden" name="raffleId" value={raffle.id} />
          
          {state.message && (
            <Alert variant={state.success ? "default" : "destructive"} className={state.success ? "bg-green-100 border-green-300 text-green-800" : ""}>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Columna de datos personales */}
            <div className="space-y-4">
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

            {/* Columna de datos de pago */}
            <div className="space-y-4">
                <div>
                  <Label htmlFor="paymentMethod">Método de pago</Label>
                  <Select name="paymentMethod" value={paymentMethod} onValueChange={handlePaymentMethodChange} disabled={isPending} required>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecciona un método" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Se renderizan los métodos de pago dinámicamente */}
                      {paymentMethods.map(method => (
                        <SelectItem key={method.id} value={method.title}>{method.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* NUEVO: Muestra los detalles del método de pago seleccionado */}
                {selectedMethodDetails && (
                  <Alert variant="default" className="bg-yellow-50 border-yellow-200">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="whitespace-pre-wrap text-sm text-yellow-800">
                      {selectedMethodDetails}
                    </AlertDescription>
                  </Alert>
                )}
              
              <div>
                <Label htmlFor="paymentReference">Referencia de pago</Label>
                <Input id="paymentReference" name="paymentReference" placeholder="Número de referencia" required disabled={isPending} className="mt-1" />
              </div>

              <div>
                <Label htmlFor="paymentScreenshot">Captura de pantalla del pago</Label>
                <Input
                  id="paymentScreenshot"
                  name="paymentScreenshot"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isPending}
                  className="mt-1"
                />
                {preview && (
                  <div className="relative mt-2">
                    <img src={preview} alt="Vista previa de la captura de pago" className="rounded-lg border object-cover h-24 w-auto" />
                    <button type="button" onClick={() => { setPreview(null); setPaymentScreenshot(null); }} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 leading-none"><X className="h-3 w-3" /></button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-lg mb-2">Resumen de compra</h3>
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

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isPending || !paymentMethod || !paymentScreenshot}
            size="lg"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Comprar Tickets
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}