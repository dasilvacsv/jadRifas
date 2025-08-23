"use client";

import { useEffect, useState } from 'react';
import { buyTicketsAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShoppingCart, Image as ImageIcon, X } from 'lucide-react';

interface BuyTicketsFormProps {
  raffle: {
    id: string;
    name: string;
    price: string;
    status: string;
  };
}

const initialState = { success: false, message: '' };

export function BuyTicketsForm({ raffle }: BuyTicketsFormProps) {
  const [state, setState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);
  const [ticketCount, setTicketCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('');
  
  // NUEVOS ESTADOS para la captura de pago
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const totalAmount = ticketCount * parseFloat(raffle.price);

  useEffect(() => {
    if (state.success) {
      setTicketCount(1);
      setPaymentMethod('');
      setPaymentScreenshot(null); // Resetea la imagen
      setPreview(null);
    }
  }, [state.success]);
  
  // NUEVO: Handler para el input de archivo
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

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    // Agregamos la captura de pantalla al FormData si existe
    if (paymentScreenshot) {
      formData.append('paymentScreenshot', paymentScreenshot);
    }
    
    const result = await buyTicketsAction(formData);

    setState(result);
    setIsPending(false);

    if (result.success) {
      event.currentTarget.reset();
      setTicketCount(1);
      setPaymentMethod('');
    }
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

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Comprar Tickets
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <input type="hidden" name="raffleId" value={raffle.id} />
          
          {state.message && (
            <Alert variant={state.success ? "default" : "destructive"} className={state.success ? "bg-green-100 border-green-300 text-green-800" : ""}>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-6">
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

            <div className="space-y-4">
              <div>
                <Label htmlFor="ticketCount">Cantidad de tickets</Label>
                <Input
                  id="ticketCount"
                  name="ticketCount"
                  type="number"
                  min="1"
                  max="100"
                  value={ticketCount}
                  onChange={(e) => setTicketCount(parseInt(e.target.value) || 1)}
                  disabled={isPending}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="paymentMethod">Método de pago</Label>
                <Select name="paymentMethod" value={paymentMethod} onValueChange={setPaymentMethod} disabled={isPending} required>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecciona un método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pago_movil">Pago Móvil</SelectItem>
                    <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                    <SelectItem value="binance">Binance Pay</SelectItem>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* NUEVO: Campo para la captura de pago */}
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
                    <button type="button" onClick={() => setPreview(null)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 leading-none"><X className="h-3 w-3" /></button>
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
                <span className="font-medium">{ticketCount}</span>
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