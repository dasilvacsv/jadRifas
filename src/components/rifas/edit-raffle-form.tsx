"use client";

import { useState, useEffect } from 'react'; // Se importa useEffect
import { updateRaffleAction } from '@/lib/actions';
import { format } from "date-fns";
import { es } from 'date-fns/locale'; // Importación para el formato de fecha en español

// Componentes de UI y utilidades
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// Iconos
import { Loader2, Edit, UploadCloud, X, Ban, Calendar as CalendarIcon } from 'lucide-react';
import Image from 'next/image';

type RaffleWithImages = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  minimumTickets: number;
  limitDate: Date;
  images: { id: string; url: string }[];
};

export function EditRaffleForm({ raffle, onCancel }: { raffle: RaffleWithImages; onCancel: () => void; }) {
  const [state, setState] = useState({ success: false, message: '' });
  const [isPending, setIsPending] = useState(false);

  // Estados para manejar las imágenes
  const uniqueImages = Array.from(new Map(raffle.images.map(image => [image.id, image])).values());
const [existingImages, setExistingImages] = useState(uniqueImages);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Estado para la fecha límite
  const [limitDate, setLimitDate] = useState<Date | undefined>(new Date(raffle.limitDate));
  
  // --- NUEVO useEffect para limpiar previews al desmontar el componente ---
  useEffect(() => {
    // Esta función de limpieza se ejecuta cuando el componente se desmonta.
    // Revoca todas las URLs de objetos creadas para evitar fugas de memoria.
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, []); // El array vacío asegura que esto solo se ejecute al montar y desmontar.

  // --- FUNCIÓN CORREGIDA para evitar duplicados ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Primero, revocar las URLs de las previews anteriores para liberar memoria
    previews.forEach(url => URL.revokeObjectURL(url));

    if (event.target.files) {
      const files = Array.from(event.target.files);
      setNewFiles(files); // Reemplaza la selección anterior con la nueva
      setPreviews(files.map(f => URL.createObjectURL(f))); // Crea nuevas previews solo para la selección actual
    } else {
      // Si se cancela la selección de archivos, se limpian los estados
      setNewFiles([]);
      setPreviews([]);
    }
  };

  const removeNewImage = (indexToRemove: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== indexToRemove));
    setPreviews(prev => {
      URL.revokeObjectURL(previews[indexToRemove]); // Libera memoria
      return prev.filter((_, i) => i !== indexToRemove);
    });
  };

  const removeExistingImage = (imageId: string) => {
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
    setImagesToDelete(prev => [...prev, imageId]);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'hour' | 'minute') => {
    if (!limitDate) return;

    const value = parseInt(e.target.value, 10);
    const newDate = new Date(limitDate);

    if (type === 'hour' && !isNaN(value) && value >= 0 && value <= 23) {
      newDate.setHours(value);
    } else if (type === 'minute' && !isNaN(value) && value >= 0 && value <= 59) {
      newDate.setMinutes(value);
    }
    
    setLimitDate(newDate);
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    
    if (limitDate) {
      formData.set('limitDate', limitDate.toISOString());
    }

    newFiles.forEach(file => formData.append('images', file));
    if (imagesToDelete.length > 0) {
      formData.set('imagesToDelete', imagesToDelete.join(','));
    }
    
    const result = await updateRaffleAction(formData);
    
    if (result.success) {
      onCancel(); 
    } else {
      setState(result);
      setIsPending(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto border-blue-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5 text-blue-600" /> 
          Editando Rifa: {raffle.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <input type="hidden" name="raffleId" value={raffle.id} />
          
          {state.message && (
            <Alert variant={state.success ? "default" : "destructive"}>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          {/* Campos de texto */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre de la rifa</Label>
              <Input id="name" name="name" required disabled={isPending} defaultValue={raffle.name} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" name="description" disabled={isPending} defaultValue={raffle.description || ''} className="mt-1" rows={4} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Precio por ticket ($)</Label>
                <Input id="price" name="price" type="number" step="0.01" min="0.01" required disabled={isPending} defaultValue={raffle.price} className="mt-1" />
              </div>
              <div>
                {/* --- LÍNEAS CORREGIDAS --- */}
                <Label htmlFor="minimumTickets">Tickets mínimos (Máx. 9999)</Label>
                <Input id="minimumTickets" name="minimumTickets" type="number" min="1" max="9999" required disabled={isPending} defaultValue={raffle.minimumTickets} className="mt-1" />
                {/* --- FIN DE LA CORRECCIÓN --- */}
              </div>
            </div>
              
            {/* Selector de Fecha y Hora */}
            <div>
              <Label>Fecha y Hora Límite del Sorteo</Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full sm:w-[240px] justify-start text-left font-normal",
                        !limitDate && "text-muted-foreground"
                      )}
                      disabled={isPending}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {limitDate ? format(limitDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={limitDate}
                      onSelect={setLimitDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    min="0" max="23"
                    className="w-20"
                    placeholder="HH"
                    defaultValue={limitDate ? limitDate.getHours().toString().padStart(2, '0') : ''}
                    onChange={(e) => handleTimeChange(e, 'hour')}
                    disabled={isPending || !limitDate}
                  />
                  <span>:</span>
                  <Input 
                    type="number" 
                    min="0" max="59"
                    className="w-20"
                    placeholder="MM"
                    defaultValue={limitDate ? limitDate.getMinutes().toString().padStart(2, '0') : ''}
                    onChange={(e) => handleTimeChange(e, 'minute')}
                    disabled={isPending || !limitDate}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Gestión de imágenes */}
          <div className="space-y-4">
            <div>
              <Label>Imágenes Actuales</Label>
              {existingImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 p-4 border rounded-md">
                  {existingImages.map((image) => (
                    <div key={image.id} className="relative group">
                      <Image src={image.url} alt="Imagen existente" width={150} height={150} className="rounded-md object-cover aspect-square"/>
                      <button type="button" onClick={() => removeExistingImage(image.id)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-500 mt-2">No hay imágenes existentes.</p>}
            </div>

            <div>
              <Label htmlFor="file-upload">Añadir Nuevas Imágenes</Label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <Label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                      <span>Sube tus archivos</span>
                      <Input id="file-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handleFileChange} disabled={isPending}/>
                    </Label>
                    <p className="pl-1">o arrástralos aquí</p>
                  </div>
                </div>
              </div>
            </div>

            {previews.length > 0 && (
              <div>
                <Label>Nuevas Imágenes (Vista Previa)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 p-4 border rounded-md">
                  {previews.map((src, index) => (
                    <div key={src} className="relative group">
                      <Image src={src} alt={`Preview ${index}`} width={150} height={150} className="rounded-md object-cover aspect-square" />
                      <button type="button" onClick={() => removeNewImage(index)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 border-t pt-6">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
              <Ban className="mr-2 h-4 w-4" /> 
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}