// app/(admin)/usuarios/create-user-dialog.tsx
"use client"

import { useState, useEffect } from "react"
import { useFormState } from "react-dom"
import { registerAction } from "@/lib/actions"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RoleCombobox } from "./role-combobox" // Crearemos este componente

function SubmitButton() {
    // Necesitamos importar useFormStatus de 'react-dom'
    const { pending } = require("react-dom").useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Creando usuario..." : "Crear Usuario"}
        </Button>
    )
}

export function CreateUserDialog() {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState("user");
  const [state, formAction] = useFormState(registerAction, { success: false, message: "" });

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success("¡Éxito!", { description: state.message });
        setOpen(false); // Cierra el modal al tener éxito
      } else {
        toast.error("Error", { description: state.message });
      }
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Crear Usuario</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear nuevo usuario</DialogTitle>
          <DialogDescription>
            Completa los datos para añadir un nuevo administrador o usuario al sistema.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-4 py-4">
            {/* ... campos del formulario ... */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nombre</Label>
              <Input id="name" name="name" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" name="email" type="email" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">Contraseña</Label>
              <Input id="password" name="password" type="password" className="col-span-3" required />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="role" className="text-right">Rol</Label>
               <input type="hidden" name="role" value={role} />
               <RoleCombobox value={role} setValue={setRole} />
            </div>
          </div>
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}