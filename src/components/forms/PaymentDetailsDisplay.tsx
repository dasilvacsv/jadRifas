"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Wallet, UserCircle, Landmark, Fingerprint, Phone, CreditCard, DollarSign, Globe, AtSign, Banknote, Mail, Info } from 'lucide-react';

interface PaymentDetailsProps {
  method: {
    title: string;
    bankName?: string | null;
    rif?: string | null;
    phoneNumber?: string | null;
    accountHolderName?: string | null;
    accountNumber?: string | null;
    email?: string | null;
    walletAddress?: string | null;
    network?: string | null;
  };
}

// Componente para una fila de datos con el estilo "Stardust"
function CopyableDetail({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
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
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleCopy} 
        className="text-zinc-400 hover:text-white hover:bg-white/10 flex-shrink-0 ml-2 rounded-full h-9 w-9"
        aria-label={`Copiar ${label}`}
      >
        {copied ? <Check className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
      </Button>
    </div>
  );
}

export function PaymentDetailsDisplay({ method }: PaymentDetailsProps) {
  const [allCopied, setAllCopied] = useState(false);

  // Determina el tipo de pago para el botón de "Copiar Todo" y el orden de los datos
  const isPagoMovil = method.phoneNumber && method.rif && method.bankName;
  const isBinance = method.title.toLowerCase().includes('binance');
  const isZinli = method.phoneNumber && method.email;

  const handleCopyAll = () => {
    let textToCopy = '';
    
    if (isPagoMovil) {
      textToCopy = `
Banco: ${method.bankName}
RIF/CI: ${method.rif}
Teléfono: ${method.phoneNumber}
`.trim();
    } else if (isZinli) {
      textToCopy = `
Teléfono: ${method.phoneNumber}
Correo Electrónico: ${method.email}
`.trim();
    } else if (isBinance) {
      textToCopy = `
Dirección de Wallet: ${method.walletAddress}
Red: ${method.network}
`.trim();
    } else {
      // Caso genérico para transferencia bancaria
      let detailsToCopy = [];
      if (method.accountHolderName) detailsToCopy.push(`Titular: ${method.accountHolderName}`);
      if (method.bankName) detailsToCopy.push(`Banco: ${method.bankName}`);
      if (method.accountNumber) detailsToCopy.push(`Nro. de Cuenta: ${method.accountNumber}`);
      if (method.rif) detailsToCopy.push(`RIF / Cédula: ${method.rif}`);
      textToCopy = detailsToCopy.join('\n').trim();
    }

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2000);
    }
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
        {/* Muestra los datos en un orden lógico, priorizando la información clave */}
        {method.accountHolderName && (
          <CopyableDetail 
            label="Titular" 
            value={method.accountHolderName} 
            icon={<UserCircle size={22}/>} 
          />
        )}
        {method.bankName && (
          <CopyableDetail 
            label="Banco" 
            value={method.bankName} 
            icon={<Landmark size={22}/>} 
          />
        )}
        {method.accountNumber && (
          <CopyableDetail 
            label="Nro. de Cuenta" 
            value={method.accountNumber} 
            icon={<CreditCard size={22}/>} 
          />
        )}
        {method.rif && (
          <CopyableDetail 
            label="RIF / Cédula" 
            value={method.rif} 
            icon={<Fingerprint size={22}/>} 
          />
        )}
        {method.phoneNumber && (
          <CopyableDetail 
            label="Teléfono" 
            value={method.phoneNumber} 
            icon={<Phone size={22}/>} 
          />
        )}
        {method.email && (
          <CopyableDetail 
            label="Correo Electrónico" 
            value={method.email} 
            icon={<AtSign size={22}/>} 
          />
        )}
        {method.walletAddress && (
          <CopyableDetail 
            label="Dirección de Wallet" 
            value={method.walletAddress} 
            icon={<DollarSign size={22}/>} 
          />
        )}
        {method.network && (
          <CopyableDetail 
            label="Red" 
            value={method.network} 
            icon={<Globe size={22}/>} 
          />
        )}

        {isBinance && (
          <div className="flex items-start gap-4 p-4 mt-4 bg-yellow-900/30 border border-yellow-800 rounded-md">
            <Info className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-0.5"/>
            <p className="text-sm text-yellow-200">
              <span className="font-bold">Importante:</span> Solo se aceptan pagos enviados en USDT. Cualquier otro tipo de criptomoneda no será procesado.
            </p>
          </div>
        )}
      </div>

      {(isPagoMovil || isBinance || isZinli) && (
        <div className="mt-4">
          <Button 
            onClick={handleCopyAll} 
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-base py-5"
          >
            {allCopied ? <Check className="mr-2 h-5 w-5" /> : <Copy className="mr-2 h-5 w-5" />}
            {allCopied ? '¡Datos Copiados!' : `Copiar todo para ${method.title}`}
          </Button>
        </div>
      )}
    </div>
  );
}