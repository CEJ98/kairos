'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Camera, X, Trash2, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ProgressPhotoData } from '@/types/metrics';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface PhotoComparisonProps {
  photos: ProgressPhotoData[];
  onUploadClick: () => void;
  onDeletePhoto: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function PhotoComparison({ photos, onUploadClick, onDeletePhoto }: PhotoComparisonProps) {
  const router = useRouter();
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhotoData | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePhotos, setComparePhotos] = useState<[ProgressPhotoData | null, ProgressPhotoData | null]>([
    null,
    null,
  ]);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta foto?')) {
      return;
    }

    setIsDeleting(true);
    const result = await onDeletePhoto(photoId);

    if (result.success) {
      toast.success('Foto eliminada exitosamente');
      setSelectedPhoto(null);
      router.refresh();
    } else {
      toast.error(result.error || 'Error al eliminar la foto');
    }
    setIsDeleting(false);
  };

  const handleCompareSelect = (photo: ProgressPhotoData, slot: 0 | 1) => {
    const newComparePhotos: [ProgressPhotoData | null, ProgressPhotoData | null] = [...comparePhotos];
    newComparePhotos[slot] = photo;
    setComparePhotos(newComparePhotos);
  };

  if (photos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-poppins">Fotos de Progreso</CardTitle>
          <CardDescription>No hay fotos registradas</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Camera className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 mb-4 text-center">
            Documenta tu progreso con fotos y compara tu transformación
          </p>
          <Button onClick={onUploadClick} className="bg-gradient-to-r from-blue-500 to-indigo-600">
            <Camera className="h-4 w-4 mr-2" />
            Subir Primera Foto
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-poppins">Fotos de Progreso</CardTitle>
              <CardDescription>{photos.length} fotos registradas</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCompareMode(!compareMode)}
                className={compareMode ? 'bg-purple-50 border-purple-300' : ''}
              >
                {compareMode ? 'Cancelar' : 'Comparar'}
              </Button>
              <Button onClick={onUploadClick} size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-600">
                <Camera className="h-4 w-4 mr-2" />
                Subir Foto
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {compareMode ? (
            // Compare Mode
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Compare Slot 1 */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Foto 1 (Antes)</p>
                  {comparePhotos[0] ? (
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-purple-300">
                      <img
                        src={comparePhotos[0].url}
                        alt="Comparación 1"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleCompareSelect(null as any, 0)}
                        className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className="text-xs text-white">
                          {format(comparePhotos[0].createdAt, "d 'de' MMMM yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                      <p className="text-sm text-gray-500">Selecciona una foto</p>
                    </div>
                  )}
                </div>

                {/* Compare Slot 2 */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Foto 2 (Después)</p>
                  {comparePhotos[1] ? (
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-green-300">
                      <img
                        src={comparePhotos[1].url}
                        alt="Comparación 2"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleCompareSelect(null as any, 1)}
                        className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className="text-xs text-white">
                          {format(comparePhotos[1].createdAt, "d 'de' MMMM yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                      <p className="text-sm text-gray-500">Selecciona una foto</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Photo selector grid */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Selecciona fotos para comparar:</p>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {photos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => {
                        if (!comparePhotos[0]) {
                          handleCompareSelect(photo, 0);
                        } else if (!comparePhotos[1]) {
                          handleCompareSelect(photo, 1);
                        } else {
                          handleCompareSelect(photo, 0);
                        }
                      }}
                      className={`aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                        comparePhotos[0]?.id === photo.id
                          ? 'border-purple-400 ring-2 ring-purple-300'
                          : comparePhotos[1]?.id === photo.id
                          ? 'border-green-400 ring-2 ring-green-300'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <img src={photo.url} alt="Progreso" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Gallery Mode
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <motion.button
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setSelectedPhoto(photo)}
                  className="relative aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 hover:border-purple-300 transition-all shadow-sm hover:shadow-md"
                >
                  <img src={photo.url} alt="Progreso" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-xs text-white">
                      {format(photo.createdAt, 'd MMM', { locale: es })}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Screen Photo Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-poppins">Foto de Progreso</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="space-y-4">
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={selectedPhoto.url}
                  alt="Progreso"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {format(selectedPhoto.createdAt, "d 'de' MMMM yyyy", { locale: es })}
                  </p>
                  {selectedPhoto.notes && (
                    <p className="text-sm text-gray-700 mt-1">{selectedPhoto.notes}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeletePhoto(selectedPhoto.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
