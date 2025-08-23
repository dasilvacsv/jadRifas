"use client";

import { useState } from 'react';
import { updateRaffleAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Edit, UploadCloud, X, Ban } from 'lucide-react';
import Image from 'next/image';

// Se espera recibir una rifa con sus imágenes
type RaffleWithImages = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  minimumTickets: number;
  images: { id: string; url: string }[];
};

// Se añade la prop 'onCancel' para volver al modo vista
export function EditRaffleForm({ raffle, onCancel }: { raffle: RaffleWithImages; onCancel: () => void; }) {
  const [state, setState] = useState({ success: false, message: '' });
  const [isPending, setIsPending] = useState(false);

  // Estados para manejar las imágenes
  const [existingImages, setExistingImages] = useState(raffle.images);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Handler para cuando el usuario selecciona nuevos archivos
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setNewFiles(prev => [...prev, ...files]);
      setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    }
  };

  // Handler para remover una nueva imagen de la vista previa
  const removeNewImage = (indexToRemove: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== indexToRemove));
    setPreviews(prev => {
      URL.revokeObjectURL(previews[indexToRemove]); // Libera memoria
      return prev.filter((_, i) => i !== indexToRemove);
    });
  };

  // Handler para marcar una imagen existente para ser borrada
  const removeExistingImage = (imageId: string) => {
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
    setImagesToDelete(prev => [...prev, imageId]);
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    newFiles.forEach(file => formData.append('images', file));
    if (imagesToDelete.length > 0) {
      formData.set('imagesToDelete', imagesToDelete.join(','));
    }
    
    const result = await updateRaffleAction(formData);
    
    // Si la acción es exitosa, llama a onCancel para volver a la vista de detalles.
    // La revalidación del path en la Server Action mostrará los datos actualizados.
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
                <Label htmlFor="minimumTickets">Tickets mínimos</Label>
                <Input id="minimumTickets" name="minimumTickets" type="number" min="1" required disabled={isPending} defaultValue={raffle.minimumTickets} className="mt-1" />
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