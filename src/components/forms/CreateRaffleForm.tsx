"use client";

import { useEffect, useState } from 'react';
import { createRaffleAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, UploadCloud, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const initialState = { success: false, message: '' };

export function CreateRaffleForm() {
  const [state, setState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  
  // NUEVO: Estados para manejar los archivos y sus vistas previas
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (state.success) {
      router.push('/rifas');
    }
  }, [state.success, router]);

  // NUEVO: Handler para cuando el usuario selecciona archivos
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles(prev => [...prev, ...newFiles]);

      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  // NUEVO: Handler para remover una imagen de la vista previa
  const removeImage = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setPreviews(prev => {
      const newPreviews = prev.filter((_, index) => index !== indexToRemove);
      // Revocar el Object URL para liberar memoria
      URL.revokeObjectURL(previews[indexToRemove]);
      return newPreviews;
    });
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    // NUEVO: Agregamos los archivos al formData
    files.forEach((file) => {
      formData.append('images', file);
    });
    
    const result = await createRaffleAction(formData);

    setState(result);
    setIsPending(false);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Crear Nueva Rifa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {state.message && (
            <Alert variant={state.success ? "default" : "destructive"}>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre de la rifa</Label>
              <Input id="name" name="name" required disabled={isPending} className="mt-1" placeholder="Ej: iPhone 15 Pro Max" />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" name="description" disabled={isPending} className="mt-1" placeholder="Describe el premio y las condiciones..." rows={4} />
            </div>

            {/* NUEVO: Campo para subir imágenes */}
            <div>
              <Label>Imágenes de la Rifa</Label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <Label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                      <span>Sube tus archivos</span>
                      <Input id="file-upload" name="images" type="file" className="sr-only" multiple accept="image/*" onChange={handleFileChange} disabled={isPending}/>
                    </Label>
                    <p className="pl-1">o arrástralos aquí</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 5MB</p>
                </div>
              </div>
            </div>

            {/* NUEVO: Vista previa de imágenes */}
            {previews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {previews.map((src, index) => (
                  <div key={index} className="relative">
                    <Image src={src} alt={`Preview ${index}`} width={150} height={150} className="rounded-md object-cover aspect-square" />
                    <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 leading-none">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Precio por ticket ($)</Label>
                <Input id="price" name="price" type="number" step="0.01" min="0.01" required disabled={isPending} className="mt-1" placeholder="5.00" />
              </div>
              <div>
                <Label htmlFor="minimumTickets">Tickets mínimos</Label>
                <Input id="minimumTickets" name="minimumTickets" type="number" min="1" required disabled={isPending} className="mt-1" placeholder="10000" defaultValue="10000" />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Rifa
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}