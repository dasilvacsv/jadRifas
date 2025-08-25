"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// MODIFICADO: Se añade el nuevo campo
interface PaymentMethod {
  id?: string;
  title?: string;
  details?: string;
  isActive?: boolean;
  triggersApiVerification?: boolean; // <-- NUEVO CAMPO
}

interface PaymentMethodDialogProps {
  action: (prevState: any, formData: FormData) => Promise<{ success: boolean; message: string }>;
  method?: PaymentMethod;
  triggerButton: React.ReactNode;
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isEditing ? "Guardar Cambios" : "Crear Método"}
    </Button>
  );
}

export function PaymentMethodDialog({ action, method, triggerButton }: PaymentMethodDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(action, { success: false, message: "" });
  const formRef = useRef<HTMLFormElement>(null);
  const isEditing = !!method;

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Método de Pago" : "Nuevo Método de Pago"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifica los detalles de este método de pago." : "Añade un nuevo método para que los clientes puedan pagar."}
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          {state.message && !state.success && (
              <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{state.message}</AlertDescription>
              </Alert>
          )}
          {method?.id && <input type="hidden" name="id" value={method.id} />}
          <div>
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" defaultValue={method?.title} required />
          </div>
          <div>
            <Label htmlFor="details">Detalles (N° de cuenta, C.I, etc.)</Label>
            <Textarea id="details" name="details" defaultValue={method?.details} required rows={5} placeholder="Banco: Banesco&#10;C.I: V-12345678&#10;Teléfono: 0412-1234567"/>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="isActive" name="isActive" defaultChecked={method?.isActive ?? true} />
            <Label htmlFor="isActive">¿Está activo para los clientes?</Label>
          </div>

          {/* --- NUEVO SWITCH --- */}
          <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Switch 
              id="triggersApiVerification" 
              name="triggersApiVerification" 
              defaultChecked={method?.triggersApiVerification ?? false} 
            />
            <Label htmlFor="triggersApiVerification">¿Activar verificación automática (Pabilo)?</Label>
          </div>
          {/* --- FIN DEL NUEVO SWITCH --- */}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <SubmitButton isEditing={isEditing} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}