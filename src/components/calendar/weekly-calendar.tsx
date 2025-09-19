"use client"

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type WorkoutEvent = {
  id: string
  workoutId?: string
  title: string
  date: string // ISO date (YYYY-MM-DD)
}

function startOfWeek(d: Date) {
  const date = new Date(d)
  const day = date.getDay() // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day // start Monday
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function fmtISODate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function WeeklyCalendar({
  events,
  onMove,
  highlightWorkoutId,
}: {
  events: WorkoutEvent[]
  onMove: (id: string, newISODate: string) => void | Promise<void>
  highlightWorkoutId?: string
}) {
  const [anchor, setAnchor] = useState<Date>(startOfWeek(new Date()))
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(anchor)
      d.setDate(anchor.getDate() + i)
      return d
    })
  }, [anchor])

  const byDay = useMemo(() => {
    const map: Record<string, WorkoutEvent[]> = {}
    for (const d of days) map[fmtISODate(d)] = []
    for (const ev of events) {
      if (!map[ev.date]) map[ev.date] = []
      map[ev.date].push(ev)
    }
    return map
  }, [events, days])

  function onPrevWeek() {
    const d = new Date(anchor)
    d.setDate(d.getDate() - 7)
    setAnchor(startOfWeek(d))
  }
  function onNextWeek() {
    const d = new Date(anchor)
    d.setDate(d.getDate() + 7)
    setAnchor(startOfWeek(d))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Planificación semanal</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onPrevWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onNextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {days.map((d) => {
            const key = fmtISODate(d)
            return (
              <div
                key={key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData('text/plain')
                  if (id) onMove(id, key)
                }}
                className="min-h-[140px] rounded border p-2 bg-white"
              >
                <div className="text-xs text-gray-600 mb-2">
                  {d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' })}
                </div>
                <div className="flex flex-col gap-2">
                  {(byDay[key] || []).map((ev) => (
                    <div
                      key={ev.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', ev.id)}
                      className={`text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-1 rounded cursor-move ${
                        highlightWorkoutId && ev.workoutId === highlightWorkoutId ? 'ring-2 ring-emerald-500' : ''
                      }`}
                      title={ev.title}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
