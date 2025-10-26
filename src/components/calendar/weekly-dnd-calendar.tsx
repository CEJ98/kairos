"use client";

import { useMemo, useState, useTransition } from "react";
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { rescheduleWorkout } from "@/app/actions/workout";

export type CalendarSession = {
  id: string;
  title: string;
  scheduledAt: Date | string;
  completedAt?: Date | string | null;
};

interface WeeklyDndCalendarProps {
  sessions: CalendarSession[];
  referenceDate?: Date | string;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Subcomponent: Draggable session card
function DraggableSession({ s, isToday }: { s: CalendarSession; isToday: boolean }) {
  const completed = Boolean(s.completedAt);
  const draggableId = `w:${s.id}`;
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: draggableId, disabled: completed });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <motion.li
      key={draggableId}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "rounded-xl border px-3 py-2 text-xs",
        completed ? "bg-neutral-100 text-neutral-500 cursor-not-allowed" : "bg-white cursor-grab hover:shadow",
        isToday && !completed ? "border-accent-teal/40" : "border-neutral-200"
      )}
    >
      <div className="flex items-center justify-between">
        <p className="font-medium text-foreground">{s.title}</p>
        {completed ? (
          <span className="ml-2 rounded-full bg-neutral-200 px-2 py-0.5 text-[10px]">Completado</span>
        ) : isToday ? (
          <span className="ml-2 rounded-full bg-accent-teal/15 px-2 py-0.5 text-[10px] text-accent-teal">Hoy</span>
        ) : (
          <span className="ml-2 rounded-full bg-surface px-2 py-0.5 text-[10px] text-neutral-500">Pendiente</span>
        )}
      </div>
      <p className="mt-1 text-[11px] text-neutral-500">
        {new Date(s.scheduledAt as any).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
      </p>
    </motion.li>
  );
}

// Subcomponent: Droppable day column
function DroppableDay({ day, items, isToday }: { day: Date; items: CalendarSession[]; isToday: boolean }) {
  const key = toISODate(day);
  const { setNodeRef, isOver } = useDroppable({ id: key });

  return (
    <div
      key={key}
      id={key}
      ref={setNodeRef}
      className={cn(
        "rounded-2xl bg-white/60 p-3 shadow-inner min-h-[180px]",
        isToday && "ring-2 ring-accent-teal/60",
        isOver && "ring-2 ring-accent-teal"
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-neutral-500">
          {day.toLocaleDateString("es-ES", { weekday: "short" })}
        </span>
        <span className="text-lg font-display font-semibold text-foreground">{day.getDate()}</span>
      </div>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {items.length ? (
            items.map((s) => <DraggableSession key={`w:${s.id}`} s={s} isToday={isToday} />)
          ) : (
            <li className="rounded-xl border border-dashed border-neutral-200 px-3 py-2 text-xs text-neutral-400">Libre</li>
          )}
        </AnimatePresence>
      </ul>
    </div>
  );
}

export function WeeklyDndCalendar({ sessions, referenceDate = new Date() }: WeeklyDndCalendarProps) {
  const refDate = new Date(referenceDate);
  const start = startOfWeek(refDate);
  const days = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(start, i)), [start]);

  const normalized = useMemo(
    () =>
      sessions.map((s) => ({
        ...s,
        scheduledAt: new Date(s.scheduledAt),
        completedAt: s.completedAt ? new Date(s.completedAt as any) : null
      })),
    [sessions]
  );

  const [local, setLocal] = useState(normalized);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalendarSession[]>();
    for (const d of days) map.set(toISODate(d), []);
    for (const s of local) {
      const key = toISODate(new Date(s.scheduledAt as any));
      if (map.has(key)) {
        (map.get(key) as CalendarSession[]).push(s);
      }
    }
    return map;
  }, [days, local]);

  const today = new Date();

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const sessionId = active.id as string; // expects id like "w:<id>" or raw id
    const workoutId = sessionId.startsWith("w:") ? sessionId.slice(2) : sessionId;
    const targetDayKey = over.id as string; // YYYY-MM-DD
    const targetDay = new Date(targetDayKey);

    // Preserve original hour/minute
    const origin = local.find((s) => s.id === workoutId);
    if (!origin) return;
    const original = new Date(origin.scheduledAt as any);
    const newDate = new Date(targetDay);
    newDate.setHours(original.getHours(), original.getMinutes(), 0, 0);

    // Optimistic UI update
    setLocal((prev) => prev.map((s) => (s.id === workoutId ? { ...s, scheduledAt: newDate } : s)));

    startTransition(async () => {
      try {
        await rescheduleWorkout(workoutId, newDate.toISOString());
      } catch (err) {
        // rollback on error
        setLocal((prev) => prev.map((s) => (s.id === workoutId ? { ...s, scheduledAt: original } : s)));
        // optional: toast
        // console.error(err);
      }
    });
  };

  return (
    <Card className="rounded-3xl bg-white/90 shadow-soft">
      <CardHeader>
        <CardTitle>Calendario semanal</CardTitle>
        <CardDescription>Arrastra sesiones entre días. {isPending ? "Guardando cambios…" : ""}</CardDescription>
      </CardHeader>
      <CardContent>
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {days.map((day) => {
              const key = toISODate(day);
              const inDay = itemsByDay.get(key) || [];
              const isToday = sameDay(day, today);
              return <DroppableDay key={key} day={day} items={inDay} isToday={isToday} />;
            })}
          </div>
          <DragOverlay />
        </DndContext>
        <div className="mt-4 flex items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => setLocal(normalized)}>
            Reset semana
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}