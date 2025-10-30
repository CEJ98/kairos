'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Loader2, Weight, Ruler, Camera } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import type { BodyWeightInput, BodyMeasurementsInput } from '@/types/metrics';

// Schemas
const weightSchema = z.object({
  weight: z.number().min(30, 'Peso mínimo: 30kg').max(300, 'Peso máximo: 300kg'),
  bodyFat: z.number().min(3).max(60).optional().or(z.literal(undefined)),
  muscleMass: z.number().min(10).max(200).optional().or(z.literal(undefined)),
  date: z.string().optional(),
});

const measurementsSchema = z.object({
  chest: z.number().min(50).max(200).optional().or(z.literal(undefined)),
  waist: z.number().min(40).max(200).optional().or(z.literal(undefined)),
  hips: z.number().min(50).max(200).optional().or(z.literal(undefined)),
  leftArm: z.number().min(15).max(80).optional().or(z.literal(undefined)),
  rightArm: z.number().min(15).max(80).optional().or(z.literal(undefined)),
  leftThigh: z.number().min(30).max(120).optional().or(z.literal(undefined)),
  rightThigh: z.number().min(30).max(120).optional().or(z.literal(undefined)),
  shoulders: z.number().min(70).max(200).optional().or(z.literal(undefined)),
  date: z.string().optional(),
});

interface MetricsFormsProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'weight' | 'measurements' | 'photo';
  saveBodyWeightAction: (data: BodyWeightInput) => Promise<{ success: boolean; error?: string }>;
  saveBodyMeasurementsAction: (
    data: BodyMeasurementsInput
  ) => Promise<{ success: boolean; error?: string }>;
  saveProgressPhotoAction: (dataUrl: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
}

export function MetricsForms({
  isOpen,
  onClose,
  initialTab = 'weight',
  saveBodyWeightAction,
  saveBodyMeasurementsAction,
  saveProgressPhotoAction,
}: MetricsFormsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Weight form
  const {
    register: registerWeight,
    handleSubmit: handleSubmitWeight,
    formState: { errors: weightErrors },
    reset: resetWeight,
  } = useForm<BodyWeightInput>({
    resolver: zodResolver(weightSchema),
  });

  // Measurements form
  const {
    register: registerMeasurements,
    handleSubmit: handleSubmitMeasurements,
    formState: { errors: measurementsErrors },
    reset: resetMeasurements,
  } = useForm<BodyMeasurementsInput>({
    resolver: zodResolver(measurementsSchema),
  });

  // Photo upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoNotes, setPhotoNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handleWeightSubmit = async (data: BodyWeightInput) => {
    setIsSubmitting(true);
    const result = await saveBodyWeightAction(data);

    if (result.success) {
      toast.success('Peso registrado exitosamente');
      resetWeight();
      router.refresh();
      onClose();
    } else {
      toast.error(result.error || 'Error al guardar el peso');
    }
    setIsSubmitting(false);
  };

  const handleMeasurementsSubmit = async (data: BodyMeasurementsInput) => {
    setIsSubmitting(true);
    const result = await saveBodyMeasurementsAction(data);

    if (result.success) {
      toast.success('Medidas registradas exitosamente');
      resetMeasurements();
      router.refresh();
      onClose();
    } else {
      toast.error(result.error || 'Error al guardar las medidas');
    }
    setIsSubmitting(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen debe ser menor a 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Solo se permiten imágenes');
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile) {
      toast.error('Selecciona una imagen');
      return;
    }

    setIsSubmitting(true);

    try {
      // For this demo, we'll use a data URL
      // In production, you'd upload to Supabase Storage or similar
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;

        const result = await saveProgressPhotoAction(dataUrl, photoNotes || undefined);

        if (result.success) {
          toast.success('Foto guardada exitosamente');
          setSelectedFile(null);
          setPhotoPreview(null);
          setPhotoNotes('');
          router.refresh();
          onClose();
        } else {
          toast.error(result.error || 'Error al guardar la foto');
        }
        setIsSubmitting(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      toast.error('Error al procesar la imagen');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-poppins text-2xl">Registrar Métricas</DialogTitle>
          <DialogDescription>Añade tus mediciones corporales y fotos de progreso</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weight">
              <Weight className="h-4 w-4 mr-2" />
              Peso
            </TabsTrigger>
            <TabsTrigger value="measurements">
              <Ruler className="h-4 w-4 mr-2" />
              Medidas
            </TabsTrigger>
            <TabsTrigger value="photo">
              <Camera className="h-4 w-4 mr-2" />
              Foto
            </TabsTrigger>
          </TabsList>

          {/* Weight Tab */}
          <TabsContent value="weight">
            <form onSubmit={handleSubmitWeight(handleWeightSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="weight">
                    Peso (kg) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="75.5"
                    {...registerWeight('weight', { valueAsNumber: true })}
                  />
                  {weightErrors.weight && (
                    <p className="text-sm text-red-600">{weightErrors.weight.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bodyFat">Grasa Corporal (%)</Label>
                  <Input
                    id="bodyFat"
                    type="number"
                    step="0.1"
                    placeholder="15.2"
                    {...registerWeight('bodyFat', { valueAsNumber: true })}
                  />
                  {weightErrors.bodyFat && (
                    <p className="text-sm text-red-600">{weightErrors.bodyFat.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="muscleMass">Masa Muscular (kg)</Label>
                  <Input
                    id="muscleMass"
                    type="number"
                    step="0.1"
                    placeholder="60.5"
                    {...registerWeight('muscleMass', { valueAsNumber: true })}
                  />
                  {weightErrors.muscleMass && (
                    <p className="text-sm text-red-600">{weightErrors.muscleMass.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weightDate">Fecha</Label>
                  <Input
                    id="weightDate"
                    type="date"
                    {...registerWeight('date')}
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Peso'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* Measurements Tab */}
          <TabsContent value="measurements">
            <form onSubmit={handleSubmitMeasurements(handleMeasurementsSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="chest">Pecho (cm)</Label>
                  <Input
                    id="chest"
                    type="number"
                    step="0.1"
                    placeholder="100"
                    {...registerMeasurements('chest', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="waist">Cintura (cm)</Label>
                  <Input
                    id="waist"
                    type="number"
                    step="0.1"
                    placeholder="80"
                    {...registerMeasurements('waist', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hips">Cadera (cm)</Label>
                  <Input
                    id="hips"
                    type="number"
                    step="0.1"
                    placeholder="95"
                    {...registerMeasurements('hips', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shoulders">Hombros (cm)</Label>
                  <Input
                    id="shoulders"
                    type="number"
                    step="0.1"
                    placeholder="110"
                    {...registerMeasurements('shoulders', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leftArm">Brazo Izquierdo (cm)</Label>
                  <Input
                    id="leftArm"
                    type="number"
                    step="0.1"
                    placeholder="35"
                    {...registerMeasurements('leftArm', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rightArm">Brazo Derecho (cm)</Label>
                  <Input
                    id="rightArm"
                    type="number"
                    step="0.1"
                    placeholder="35"
                    {...registerMeasurements('rightArm', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leftThigh">Muslo Izquierdo (cm)</Label>
                  <Input
                    id="leftThigh"
                    type="number"
                    step="0.1"
                    placeholder="60"
                    {...registerMeasurements('leftThigh', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rightThigh">Muslo Derecho (cm)</Label>
                  <Input
                    id="rightThigh"
                    type="number"
                    step="0.1"
                    placeholder="60"
                    {...registerMeasurements('rightThigh', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="measurementsDate">Fecha</Label>
                  <Input
                    id="measurementsDate"
                    type="date"
                    {...registerMeasurements('date')}
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Medidas'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* Photo Tab */}
          <TabsContent value="photo">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="photoUpload">Selecciona una imagen</Label>
                <Input
                  id="photoUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500">Máximo 5MB. Formatos: JPG, PNG, WebP</p>
              </div>

              {photoPreview && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative aspect-[3/4] max-w-md mx-auto rounded-lg overflow-hidden border-2 border-gray-200"
                >
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="photoNotes">Notas (opcional)</Label>
                <Textarea
                  id="photoNotes"
                  placeholder="Ej: Después de 3 meses de entrenamiento"
                  value={photoNotes}
                  onChange={(e) => setPhotoNotes(e.target.value)}
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handlePhotoUpload}
                  disabled={!selectedFile || isSubmitting}
                  className="bg-gradient-to-r from-green-500 to-teal-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" />
                      Subir Foto
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
