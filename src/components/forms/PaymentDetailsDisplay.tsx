"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

interface PaymentDetailsProps {
  bankName?: string | null;
  rif?: string | null;
  phoneNumber?: string | null;
  accountHolderName?: string | null;
  accountNumber?: string | null;
  amountInVes: string;
}

// Componente para una fila de datos con botón de copiar
function CopyableDetail({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex justify-between items-center py-3 border-b">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
      <Button variant="ghost" size="icon" onClick={handleCopy}>
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

export function PaymentDetailsDisplay({ method, amountInVes }: { method: any; amountInVes: string }) {
  const [allCopied, setAllCopied] = useState(false);

  // Determina si es un pago móvil para mostrar los datos correctos
  const isPagoMovil = method.phoneNumber && method.rif && method.bankName;

  const handleCopyAll = () => {
    if (!isPagoMovil) return;
    const textToCopy = `
Banco: ${method.bankName}
RIF/CI: ${method.rif}
Teléfono: ${method.phoneNumber}
Monto: ${amountInVes.replace('Bs. ', '').trim()}
`.trim();
    navigator.clipboard.writeText(textToCopy);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  return (
    <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-4 rounded-md border">
      <h4 className="font-bold mb-2">Datos para realizar el pago:</h4>
      {method.bankName && <CopyableDetail label="Banco" value={method.bankName} />}
      {method.rif && <CopyableDetail label="RIF / Cédula" value={method.rif} />}
      {method.phoneNumber && <CopyableDetail label="Teléfono" value={method.phoneNumber} />}
      {method.accountNumber && <CopyableDetail label="Nro. de Cuenta" value={method.accountNumber} />}
      {amountInVes && <CopyableDetail label="Monto a Pagar" value={amountInVes} />}

      {isPagoMovil && (
        <Button onClick={handleCopyAll} className="w-full mt-4">
          {allCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          {allCopied ? '¡Copiado!' : 'Copiar datos para Pago Móvil'}
        </Button>
      )}
    </div>
  );
}