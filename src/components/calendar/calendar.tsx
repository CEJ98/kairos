"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Session = { id: string; title: string };
type Week = Record<string, Session[]>; // keys: Mon..Sun

const initialWeek: Week = {
  Lun: [{ id: "s1", title: "Piernas" }],
  Mar: [],
  Mié: [{ id: "s2", title: "Empuje" }],
  Jue: [],
  Vie: [{ id: "s3", title: "Tracción" }],
  Sáb: [],
  Dom: []
};

export function Calendar() {
  const [week, setWeek] = React.useState<Week>(initialWeek);
  const [dragging, setDragging] = React.useState<Session | null>(null);

  const onDragStart = (session: Session) => setDragging(session);
  const onDrop = (day: keyof Week) => {
    if (!dragging) return;
    // remove from previous day
    const prevDay = (Object.keys(week) as (keyof Week)[]).find((d) =>
      week[d].some((s) => s.id === dragging.id)
    );
    if (!prevDay) return;
    setWeek((prev) => {
      const removed = prev[prevDay].filter((s) => s.id !== dragging.id);
      const added = [...prev[day], dragging];
      return { ...prev, [prevDay]: removed, [day]: added };
    });
    setDragging(null);
  };

  const resetWeek = () => setWeek(initialWeek);

  const DayColumn = ({ day }: { day: keyof Week }) => (
    <div
      className="rounded-xl border bg-surface p-3 min-h-[140px]"
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDrop(day)}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-foreground">{day}</p>
        <span className="text-xs text-neutral-500">{week[day].length} sesiones</span>
      </div>
      <div className="space-y-2">
        {week[day].map((s) => (
          <div
            key={s.id}
            draggable
            onDragStart={() => onDragStart(s)}
            className="cursor-grab rounded-lg border bg-white px-3 py-2 text-sm hover:shadow"
          >
            {s.title}
          </div>
        ))}
        {week[day].length === 0 && (
          <div className="text-xs text-neutral-400">Arrastra aquí para programar</div>
        )}
      </div>
    </div>
  );

  return (
    <Card className="rounded-3xl bg-white/90 shadow-soft">
      <CardHeader>
        <CardTitle>Calendario semanal</CardTitle>
        <CardDescription>Mueve sesiones entre días (dummy)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {(["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"] as (keyof Week)[]).map((day) => (
            <DayColumn key={day} day={day} />
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button variant="outline" onClick={resetWeek}>Reset</Button>
        </div>
      </CardContent>
    </Card>
  );
}