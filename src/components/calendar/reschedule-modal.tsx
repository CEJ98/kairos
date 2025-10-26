'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, X, AlertCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  workoutTitle: string;
  fromDate: Date;
  toDate: Date;
}

export function RescheduleModal({
  isOpen,
  onClose,
  onConfirm,
  workoutTitle,
  fromDate,
  toDate,
}: RescheduleModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error confirming reschedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 font-poppins text-xl">
              <Calendar className="h-5 w-5 text-blue-600" />
              Reprogramar Entrenamiento
            </DialogTitle>
          </div>
          <DialogDescription>
            Confirma el cambio de fecha para este entrenamiento.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Workout Title */}
          <div className="mb-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-3">
            <p className="text-sm font-medium text-gray-600 mb-1">Entrenamiento</p>
            <p className="font-semibold text-gray-900">{workoutTitle}</p>
          </div>

          {/* Date Change */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Fecha actual</p>
                <p className="text-sm font-semibold text-gray-700">
                  {format(fromDate, "EEEE, d 'de' MMMM", { locale: es })}
                </p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-full bg-blue-100 p-2"
              >
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </motion.div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Nueva fecha</p>
                <p className="text-sm font-semibold text-blue-600">
                  {format(toDate, "EEEE, d 'de' MMMM", { locale: es })}
                </p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 border border-amber-200"
          >
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              Este cambio se guardará permanentemente. Podrás volver a reprogramarlo si es
              necesario.
            </p>
          </motion.div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Confirmar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
