"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
    <div className="bg-zinc-900/80 backdrop-blur-md border-white/10 text-white rounded-xl p-4 sm:p-6 mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 border-b border-white/10 pb-4">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Wallet className="h-6 w-6 text-amber-400"/>
          Datos para {method.title}
        </h2>
        <p className="text-zinc-400 text-sm sm:text-base">
          Copia la información necesaria para realizar tu pago.
        </p>
      </div>
      
      <div className="bg-black/20 p-2 sm:p-4 rounded-lg border border-white/10 max-h-[50vh] overflow-y-auto">
        {method.accountHolderName && <CopyableDetail label="Titular" value={method.accountHolderName} icon={<UserCircle size={22}/>} />}
        {method.bankName && <CopyableDetail label="Banco" value={method.bankName} icon={<Landmark size={22}/>} />}
        {method.rif && <CopyableDetail label="RIF / Cédula" value={method.rif} icon={<Fingerprint size={22}/>} />}
        {method.phoneNumber && <CopyableDetail label="Teléfono" value={method.phoneNumber} icon={<Phone size={22}/>} />}
        {method.accountNumber && <CopyableDetail label="Nro. de Cuenta" value={method.accountNumber} icon={<CreditCard size={22}/>} />}
      </div>

      {isPagoMovil && (
        <div className="mt-4">
          <Button onClick={handleCopyAll} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-base py-5">
            {allCopied ? <Check className="mr-2 h-5 w-5" /> : <Copy className="mr-2 h-5 w-5" />}
            {allCopied ? '¡Datos Copiados!' : 'Copiar todo para Pago Móvil'}
          </Button>
        </div>
      )}
    </div>
  );
}