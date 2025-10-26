'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarEvent } from '@/types/workout';
import { DUMMY_CALENDAR_EVENTS } from '@/lib/dummy-data';

export function WorkoutCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>(DUMMY_CALENDAR_EVENTS);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  const rescheduleEvent = (eventId: string, newDate: Date) => {
    setEvents(prev =>
      prev.map(event =>
        event.id === eventId ? { ...event, date: newDate } : event
      )
    );
    setEditingEvent(null);
  };

  const toggleEventComplete = (eventId: string) => {
    setEvents(prev =>
      prev.map(event =>
        event.id === eventId ? { ...event, completed: !event.completed } : event
      )
    );
  };

  const deleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
  };

  const addNewEvent = (date: Date) => {
    const newEvent: CalendarEvent = {
      id: `e${Date.now()}`,
      title: 'Nuevo Entrenamiento',
      date,
      completed: false,
      workoutId: `w${Date.now()}`
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const goToPreviousWeek = () => {
    setCurrentDate(prev => subDays(prev, 7));
  };

  const goToNextWeek = () => {
    setCurrentDate(prev => addDays(prev, 7));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CalendarIcon className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Calendario de Entrenamientos</CardTitle>
                <CardDescription>
                  {format(weekStart, 'd MMM', { locale: es })} -{' '}
                  {format(weekEnd, 'd MMM yyyy', { locale: es })}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoy
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Week View */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map((day, idx) => {
          const dayEvents = getEventsForDate(day);
          const isCurrentDay = isToday(day);

          return (
            <Card
              key={idx}
              className={`${isCurrentDay ? 'ring-2 ring-primary' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase">
                      {format(day, 'EEE', { locale: es })}
                    </div>
                    <div className={`text-2xl font-bold ${
                      isCurrentDay ? 'text-primary' : ''
                    }`}>
                      {format(day, 'd')}
                    </div>
                  </div>
                  {isCurrentDay && (
                    <Badge variant="default" className="text-xs">Hoy</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {dayEvents.length === 0 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => addNewEvent(day)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    <span className="text-xs">Agregar</span>
                  </Button>
                ) : (
                  dayEvents.map(event => (
                    <div
                      key={event.id}
                      className={`p-2 rounded-lg border ${
                        event.completed
                          ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                          : 'bg-card border-border'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => toggleEventComplete(event.id)}
                          className="flex-shrink-0 mt-0.5"
                        >
                          {event.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">
                            {event.title}
                          </div>
                        </div>
                      </div>

                      {editingEvent === event.id && (
                        <div className="mt-2 pt-2 border-t space-y-1">
                          <div className="text-xs font-medium mb-1">Mover a:</div>
                          <div className="grid grid-cols-2 gap-1">
                            {weekDays.map((newDay, newIdx) => (
                              <Button
                                key={newIdx}
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => rescheduleEvent(event.id, newDay)}
                                disabled={isSameDay(newDay, day)}
                              >
                                {format(newDay, 'EEE d', { locale: es })}
                              </Button>
                            ))}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs h-7"
                            onClick={() => setEditingEvent(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}

                      {editingEvent !== event.id && (
                        <div className="flex gap-1 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 flex-1"
                            onClick={() => setEditingEvent(event.id)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-destructive hover:text-destructive"
                            onClick={() => deleteEvent(event.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Weekly Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <div className="text-sm text-muted-foreground">Total Entrenamientos</div>
              <div className="text-2xl font-bold">
                {events.filter(e =>
                  weekDays.some(day => isSameDay(new Date(e.date), day))
                ).length}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Completados</div>
              <div className="text-2xl font-bold text-green-600">
                {events.filter(e =>
                  e.completed && weekDays.some(day => isSameDay(new Date(e.date), day))
                ).length}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Pendientes</div>
              <div className="text-2xl font-bold text-orange-600">
                {events.filter(e =>
                  !e.completed && weekDays.some(day => isSameDay(new Date(e.date), day))
                ).length}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Adherencia</div>
              <div className="text-2xl font-bold">
                {(() => {
                  const weekEvents = events.filter(e =>
                    weekDays.some(day => isSameDay(new Date(e.date), day))
                  );
                  const completed = weekEvents.filter(e => e.completed).length;
                  const total = weekEvents.length;
                  return total > 0 ? Math.round((completed / total) * 100) : 0;
                })()}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
