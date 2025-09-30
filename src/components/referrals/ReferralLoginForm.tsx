// components/referrals/ReferralLoginForm.tsx
"use client";

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { referralLoginAction } from '@/lib/actions-referrals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Hash } from 'lucide-react';

export default function ReferralLoginForm() {
  const [state, formAction] = useFormState(referralLoginAction, { success: false, message: '' });
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true);
    // @ts-ignore
    const result = await formAction(formData);
    setIsPending(false);
    
    // Si es exitoso, la página se recargará automáticamente por el `redirect` en la action
    if (result?.success) {
      window.location.reload();
    }
  };

  return (
    <Card className="bg-zinc-900/80 backdrop-blur-md border-zinc-800 shadow-2xl shadow-black/30">
      <CardHeader>
        <CardTitle className="text-center text-white text-2xl">Iniciar Sesión</CardTitle>
        <CardDescription className="text-center text-zinc-400">Usa tu email y código de 4 dígitos.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          {state.message && !state.success && (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">Correo Electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                id="email"
                name="email"
                type="email"
                required
                disabled={isPending}
                className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder-zinc-500 focus:ring-amber-500"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code" className="text-zinc-300">Código de Referido</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                id="code"
                name="code"
                type="text" // Usamos text para permitir ceros a la izquierda
                maxLength={4}
                minLength={4}
                required
                pattern="\d{4}"
                title="El código debe ser de 4 dígitos."
                disabled={isPending}
                className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder-zinc-500 font-mono tracking-widest"
                placeholder="1234"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold py-3 text-base"
            disabled={isPending}
          >
            {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Acceder al Panel'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-500">
            ¿No tienes acceso? Contacta al administrador para obtener tus credenciales.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}