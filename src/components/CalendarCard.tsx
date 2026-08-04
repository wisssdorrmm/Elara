import { useState } from 'react';
import { addMonths, subMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

export type DayState = 'none' | 'period' | 'predicted' | 'ovulation' | 'fertile';

interface CalendarCardProps {
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  getDayState?: (date: Date) => DayState;
}

const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const dayStateStyles: Record<DayState, string> = {
  none: '',
  period: 'bg-danger/80 text-white',
  predicted: 'bg-danger/15 text-danger',
  ovulation: 'bg-primary/15 text-primary',
  fertile: 'bg-accent/20 text-primary',
};

export function CalendarCard({ selectedDate, onSelectDate, getDayState }: CalendarCardProps) {
  const [monthCursor, setMonthCursor] = useState(selectedDate ?? new Date());

  const start = startOfMonth(monthCursor);
  const end = endOfMonth(monthCursor);
  const days = eachDayOfInterval({ start, end });
  const leadingBlanks = getDay(start);

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setMonthCursor((m) => subMonths(m, 1))}
          aria-label="Previous month"
          className="rounded-full p-1.5 hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5 text-text-muted" />
        </button>
        <p className="font-semibold text-text">{format(monthCursor, 'MMMM yyyy')}</p>
        <button
          onClick={() => setMonthCursor((m) => addMonths(m, 1))}
          aria-label="Next month"
          className="rounded-full p-1.5 hover:bg-gray-100"
        >
          <ChevronRight className="h-5 w-5 text-text-muted" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center">
        {weekdays.map((day) => (
          <span key={day} className="text-xs font-medium text-text-muted">
            {day}
          </span>
        ))}

        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <span key={`blank-${i}`} />
        ))}

        {days.map((day) => {
          const state = getDayState?.(day) ?? 'none';
          const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate?.(day)}
              className={cn(
                'mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors',
                dayStateStyles[state],
                isSelected && 'ring-2 ring-primary ring-offset-1'
              )}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
