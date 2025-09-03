// app/(public)/unete/page.tsx
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { addToWaitlistAction } from '@/lib/actions'; // Asegúrate que la ruta sea correcta
import { Mail, MessageCircle, User, Sparkles, PartyPopper, AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

// Componente para el botón con estado de carga
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-xl py-6 text-base shadow-lg hover:shadow-amber-600/30 transition-all duration-300 transform hover:-translate-y-px">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Registrando...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-5 w-5" />
          ¡Notifíquenme!
        </>
      )}
    </Button>
  );
}

export default function WaitlistPage() {
  const initialState = { success: false, message: '' };
  const [state, formAction] = useFormState(addToWaitlistAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Si el registro es exitoso, limpia el formulario
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <div className="min-h-[calc(100vh-20rem)] flex items-center justify-center p-4 bg-grid-white/[0.03] relative overflow-hidden">
      {/* Efectos de fondo */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-amber-500/20 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-orange-600/20 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
      
      <div className="relative z-10 w-full max-w-md">
        {state.success ? (
          <Card className="bg-zinc-900/80 backdrop-blur-md border border-green-500/30 shadow-2xl shadow-black/40 text-center animate-in fade-in-0 zoom-in-95">
            <CardHeader>
              <div className="mx-auto bg-green-500/10 rounded-full p-3 w-fit border border-green-500/20">
                <PartyPopper className="h-12 w-12 text-green-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-white pt-4">¡Todo Listo!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300">{state.message}</p>
            </CardContent>
          </Card>
        ) : (
          <form ref={formRef} action={formAction}>
            <Card className="bg-zinc-900/80 backdrop-blur-md border border-white/10 shadow-2xl shadow-black/40">
              <CardHeader className="text-center">
                <div className="mx-auto bg-amber-500/10 rounded-full p-3 w-fit border border-amber-500/20">
                    <Sparkles className="h-10 w-10 text-amber-400"/>
                </div>
                <CardTitle className="text-3xl font-extrabold text-white pt-4">
                  ¡Sé el Primero en Enterarte!
                </CardTitle>
                <CardDescription className="text-zinc-400 pt-2">
                  Únete a nuestra lista de espera y te avisaremos por WhatsApp y correo cuando lancemos una nueva rifa.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-zinc-400 flex items-center"><User className="h-4 w-4 mr-2"/>Nombre Completo</Label>
                  <Input id="name" name="name" type="text" placeholder="Tu Nombre y Apellido" required className="bg-zinc-950/50 border-zinc-700 focus:ring-amber-500 focus:border-amber-500 h-12"/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-400 flex items-center"><Mail className="h-4 w-4 mr-2"/>Correo Electrónico</Label>
                  <Input id="email" name="email" type="email" placeholder="tu@correo.com" required className="bg-zinc-950/50 border-zinc-700 focus:ring-amber-500 focus:border-amber-500 h-12"/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-zinc-400 flex items-center"><MessageCircle className="h-4 w-4 mr-2"/>Número de WhatsApp</Label>
                  <Input id="whatsapp" name="whatsapp" type="tel" placeholder="+584121234567" required className="bg-zinc-950/50 border-zinc-700 focus:ring-amber-500 focus:border-amber-500 h-12"/>
                  <p className="text-xs text-zinc-500">Incluye el código de tu país (ej: +58 para Venezuela).</p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <SubmitButton />
                {!state.success && state.message && (
                  <div className="text-sm text-red-400 flex items-center gap-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <AlertTriangle className="h-4 w-4"/>
                    <span>{state.message}</span>
                  </div>
                )}
              </CardFooter>
            </Card>
          </form>
        )}
      </div>
    </div>
  );
}