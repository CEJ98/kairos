import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

export interface WeeklyCalendarEvent {
  id: string;
  title: string;
  scheduledAt: string | Date;
}

interface WeeklyCalendarProps {
  events: WeeklyCalendarEvent[];
  referenceDate?: Date;
}

export function WeeklyCalendar({ events, referenceDate = new Date() }: WeeklyCalendarProps) {
  const start = startOfWeek(referenceDate);
  const days = Array.from({ length: 7 }).map((_, index) => addDays(start, index));

  return (
    <div className="rounded-3xl bg-surface p-6 shadow-soft">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">Semana en curso</h2>
        <span className="text-sm text-neutral-500">
          {format(start, "d 'de' MMM", { locale: es })} -
          {format(addDays(start, 6), " d 'de' MMM", { locale: es })}
        </span>
      </header>
      <div className="grid grid-cols-7 gap-3 text-sm">
        {days.map((day) => {
          const dayEvents = events.filter((event) =>
            isSameDay(new Date(event.scheduledAt), day)
          );
          return (
            <div key={day.toISOString()} className="rounded-2xl bg-white/60 p-3 shadow-inner">
              <span className="block text-xs font-semibold uppercase text-neutral-500">
                {format(day, 'EEE', { locale: es })}
              </span>
              <span className="block text-lg font-display font-semibold text-foreground">
                {format(day, 'd', { locale: es })}
              </span>
              <ul className="mt-3 flex flex-col gap-2">
                {dayEvents.length ? (
                  dayEvents.map((event) => (
                    <li
                      key={event.id}
                      className="rounded-full bg-accent-teal/15 px-3 py-1 text-xs font-medium text-foreground"
                    >
                      {event.title}
                    </li>
                  ))
                ) : (
                  <li className="rounded-full border border-dashed border-neutral-200 px-3 py-1 text-xs text-neutral-400">
                    Libre
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
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
