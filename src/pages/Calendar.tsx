import { useState } from 'react';
import { CalendarCard, DayState } from '@/components/CalendarCard';

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Placeholder day-state resolver; will be wired to Supabase period/log data in Part 2.
  const getDayState = (_date: Date): DayState => 'none';

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-text">Calendar</h1>
      <CalendarCard selectedDate={selectedDate} onSelectDate={setSelectedDate} getDayState={getDayState} />

      <div className="flex flex-wrap gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-danger" /> Period
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/20" /> Predicted
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-primary/20" /> Ovulation
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent/30" /> Fertile window
        </span>
      </div>
    </div>
  );
}
