// src/components/forms/PaymentDetailsDisplay.tsx (Diseño "Stardust")

"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Copy, Check, Wallet, UserCircle, Landmark, Fingerprint, Phone, CreditCard } from 'lucide-react';

interface PaymentDetailsProps {
  method: {
    title: string;
    bankName?: string | null;
    rif?: string | null;
    phoneNumber?: string | null;
    accountHolderName?: string | null;
    accountNumber?: string | null;
  };
}

// Componente para una fila de datos con el nuevo estilo "Stardust"
function CopyableDetail({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if(!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-b-0">
      <div className="flex items-center gap-4">
        <div className="text-amber-400 flex-shrink-0">{icon}</div>
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="font-semibold text-white text-base tracking-wider break-all">{value}</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={handleCopy} className="text-zinc-400 hover:text-white hover:bg-white/10 flex-shrink-0 ml-2 rounded-full h-9 w-9">
        {copied ? <Check className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
      </Button>
    </div>
  );
}

export function PaymentDetailsDisplay({ method }: PaymentDetailsProps) {
  const [allCopied, setAllCopied] = useState(false);

  // Determina si los datos corresponden a un Pago Móvil para mostrar el botón de "Copiar Todo"
  const isPagoMovil = method.phoneNumber && method.rif && method.bankName;

  const handleCopyAll = () => {
    if (!isPagoMovil) return;
    const textToCopy = `
Banco: ${method.bankName}
RIF/CI: ${method.rif}
Teléfono: ${method.phoneNumber}
`.trim();
    navigator.clipboard.writeText(textToCopy);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mt-4 border-amber-400/50 bg-amber-950/20 text-amber-300 hover:bg-amber-950/40 hover:text-amber-200 font-bold transition-all duration-300 rounded-lg">
          <Wallet className="mr-2 h-4 w-4" />
          Ver Datos para Pagar
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900/80 backdrop-blur-md border-white/10 text-white rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
              <Wallet className="h-6 w-6 text-amber-400"/>
              Datos para {method.title}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Copia la información necesaria para realizar tu pago.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-2 bg-black/20 p-2 sm:p-4 rounded-lg border border-white/10 max-h-[50vh] overflow-y-auto">
          {method.accountHolderName && <CopyableDetail label="Titular" value={method.accountHolderName} icon={<UserCircle size={22}/>} />}
          {method.bankName && <CopyableDetail label="Banco" value={method.bankName} icon={<Landmark size={22}/>} />}
          {method.rif && <CopyableDetail label="RIF / Cédula" value={method.rif} icon={<Fingerprint size={22}/>} />}
          {method.phoneNumber && <CopyableDetail label="Teléfono" value={method.phoneNumber} icon={<Phone size={22}/>} />}
          {method.accountNumber && <CopyableDetail label="Nro. de Cuenta" value={method.accountNumber} icon={<CreditCard size={22}/>} />}
        </div>

        {isPagoMovil && (
          <DialogFooter className="mt-2">
            <Button onClick={handleCopyAll} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-base py-5">
              {allCopied ? <Check className="mr-2 h-5 w-5" /> : <Copy className="mr-2 h-5 w-5" />}
              {allCopied ? '¡Datos Copiados!' : 'Copiar todo para Pago Móvil'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}