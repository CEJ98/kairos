'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Clock, Dumbbell, CheckCircle2, AlertCircle, GripVertical } from 'lucide-react';
import type { WorkoutCardData } from '@/types/calendar';
import { cn } from '@/lib/utils';

interface WorkoutCardProps {
  workout: WorkoutCardData;
  onComplete?: (workoutId: string) => void;
  isDragging?: boolean;
}

const statusConfig = {
  completed: {
    borderColor: 'border-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    icon: CheckCircle2,
    iconColor: 'text-green-600',
  },
  today: {
    borderColor: 'border-cyan-500',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-700',
    icon: AlertCircle,
    iconColor: 'text-cyan-600',
  },
  pending: {
    borderColor: 'border-gray-300',
    bgColor: 'bg-white',
    textColor: 'text-gray-700',
    icon: Clock,
    iconColor: 'text-gray-500',
  },
  overdue: {
    borderColor: 'border-red-400',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    icon: AlertCircle,
    iconColor: 'text-red-600',
  },
};

export function WorkoutCard({ workout, onComplete, isDragging = false }: WorkoutCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: workout.id,
    disabled: workout.status === 'completed',
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const config = statusConfig[workout.status];
  const StatusIcon = config.icon;

  const isActuallyDragging = isDragging || isSortableDragging;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={workout.status !== 'completed' ? { scale: 1.02 } : {}}
      className={cn(
        'relative rounded-lg border-2 p-3 shadow-sm transition-all',
        config.borderColor,
        config.bgColor,
        isActuallyDragging && 'opacity-50 shadow-lg',
        workout.status !== 'completed' && 'cursor-grab active:cursor-grabbing'
      )}
    >
      {/* Drag Handle */}
      {workout.status !== 'completed' && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      )}

      {/* Status Icon */}
      <div className="mb-2 flex items-start justify-between">
        <StatusIcon className={cn('h-5 w-5', config.iconColor)} />
      </div>

      {/* Title */}
      <h4 className={cn('font-semibold text-sm mb-2 pr-6', config.textColor)}>
        {workout.title}
      </h4>

      {/* Muscle Groups */}
      {workout.muscleGroups.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {workout.muscleGroups.slice(0, 3).map((group, idx) => (
            <span
              key={idx}
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                workout.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : workout.status === 'today'
                  ? 'bg-cyan-100 text-cyan-800'
                  : 'bg-gray-100 text-gray-700'
              )}
            >
              {group}
            </span>
          ))}
          {workout.muscleGroups.length > 3 && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              +{workout.muscleGroups.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {workout.duration} min
          </span>
          <span className="flex items-center gap-1">
            <Dumbbell className="h-3 w-3" />
            {workout.exerciseCount} ej.
          </span>
        </div>

        {/* Complete Button */}
        {workout.status !== 'completed' && onComplete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onComplete(workout.id);
            }}
            className="rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 transition-colors"
          >
            Completar
          </button>
        )}
      </div>
    </motion.div>
  );
}
