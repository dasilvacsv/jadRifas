"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2, AlertCircle, Info } from "lucide-react";

// Componentes de shadcn/ui
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Interfaz del Método de Pago
interface PaymentMethod {
  id?: string;
  title?: string;
  isActive?: boolean;
  triggersApiVerification?: boolean;
  accountHolderName?: string | null;
  rif?: string | null;
  phoneNumber?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
}

// VALORES INICIALES PARA UN MÉTODO NUEVO
const initialState: Omit<PaymentMethod, "id"> = {
  title: "",
  isActive: true,
  triggersApiVerification: false,
  accountHolderName: "",
  rif: "",
  phoneNumber: "",
  bankName: "",
  accountNumber: "",
};

interface PaymentMethodDialogProps {
  action: (
    prevState: any,
    formData: FormData
  ) => Promise<{ success: boolean; message: string }>;
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

// --- COMPONENTE FINAL CON ESTADO CONTROLADO Y FORMULARIO ÚNICO ---
export function PaymentMethodDialog({
  action,
  method,
  triggerButton,
}: PaymentMethodDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(action, {
    success: false,
    message: "",
  });
  const formRef = useRef<HTMLFormElement>(null);
  const isEditing = !!method;

  const [formData, setFormData] =
    useState<Omit<PaymentMethod, "id">>(initialState);

  // Sincroniza el estado del formulario si estamos editando un método existente
  useEffect(() => {
    if (isEditing && method) {
      setFormData({
        title: method.title ?? "",
        isActive: method.isActive ?? true,
        triggersApiVerification: method.triggersApiVerification ?? false,
        accountHolderName: method.accountHolderName ?? "",
        rif: method.rif ?? "",
        phoneNumber: method.phoneNumber ?? "",
        bankName: method.bankName ?? "",
        accountNumber: method.accountNumber ?? "",
      });
    } else {
      setFormData(initialState);
    }
  }, [method, isEditing, open]);

  // Se cierra el modal si la acción del servidor fue exitosa
  useEffect(() => {
    if (state.success) {
      setOpen(false);
    }
  }, [state]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: keyof PaymentMethod, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Método de Pago" : "Nuevo Método de Pago"}
          </DialogTitle>
          <DialogDescription>
            Completa la información del método. Los campos con (*) son
            obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-6 pt-2">
          {state.message && !state.success && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          {method?.id && <input type="hidden" name="id" value={method.id} />}
          <input
            type="hidden"
            name="isActive"
            value={String(formData.isActive)}
          />
          <input
            type="hidden"
            name="triggersApiVerification"
            value={String(formData.triggersApiVerification)}
          />

          {/* SECCIÓN GENERAL */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Título del Método <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="Ej: Pago Móvil Banesco"
                required
                value={formData.title}
                onChange={handleChange}
              />
            </div>
          </div>

          <Separator />

          {/* SECCIÓN DETALLES DE LA CUENTA */}
          <div className="space-y-4">
             <h3 className="text-sm font-medium text-foreground">Detalles de la Cuenta (Opcional)</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="accountHolderName">Nombre del Titular</Label>
                 <Input id="accountHolderName" name="accountHolderName" value={formData.accountHolderName ?? ''} onChange={handleChange} />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="rif">Cédula / RIF</Label>
                 <Input id="rif" name="rif" placeholder="V-12345678" value={formData.rif ?? ''} onChange={handleChange} />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="bankName">Nombre del Banco</Label>
                 <Input id="bankName" name="bankName" placeholder="Banesco" value={formData.bankName ?? ''} onChange={handleChange} />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="phoneNumber">Teléfono (Pago Móvil)</Label>
                 <Input id="phoneNumber" name="phoneNumber" placeholder="0412-1234567" value={formData.phoneNumber ?? ''} onChange={handleChange} />
               </div>
             </div>
             <div className="space-y-2">
               <Label htmlFor="accountNumber">Número de Cuenta (Transferencia)</Label>
               <Input id="accountNumber" name="accountNumber" placeholder="0134..." value={formData.accountNumber ?? ''} onChange={handleChange} />
             </div>
          </div>
          
          <Separator />

          {/* SECCIÓN DE CONFIGURACIÓN */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Configuración</h3>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="isActive-switch">Activo para clientes</Label>
                <p className="text-xs text-muted-foreground">
                  Si está activo, los clientes podrán seleccionarlo.
                </p>
              </div>
              <Switch
                id="isActive-switch"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  handleSwitchChange("isActive", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label
                  htmlFor="triggersApiVerification-switch"
                  className="flex items-center"
                >
                  Verificación Automática
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-2 h-4 w-4 text-muted-foreground cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Activa la API para verificar pagos automáticamente.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Intenta confirmar los pagos reportados con este método.
                </p>
              </div>
              <Switch
                id="triggersApiVerification-switch"
                checked={formData.triggersApiVerification}
                onCheckedChange={(checked) =>
                  handleSwitchChange("triggersApiVerification", checked)
                }
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <SubmitButton isEditing={isEditing} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}