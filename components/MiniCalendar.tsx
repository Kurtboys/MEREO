"use client";

import { useState, useMemo } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isSameMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MiniCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  datesWithMissions?: string[]; // Array of YYYY-MM-DD strings
  className?: string;
}

export function MiniCalendar({
  selectedDate,
  onSelectDate,
  datesWithMissions = [],
  className,
}: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));

  // Get days in current month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = monthStart.getDay();

    return { daysInMonth, startDayOfWeek, monthStart };
  }, [currentMonth]);

  // Check if a date has missions
  const dateHasMissions = (date: Date): boolean => {
    const dateKey = format(date, "yyyy-MM-dd");
    return datesWithMissions.includes(dateKey);
  };

  const navigatePrevMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const navigateNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleSelectToday = () => {
    const today = new Date();
    setCurrentMonth(startOfMonth(today));
    onSelectDate(today);
  };

  return (
    <div className={cn("", className)}>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={navigatePrevMonth}
          className="p-1.5 hover:bg-surface-hover rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <h3 className="text-base font-semibold text-text-primary">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <button
          onClick={navigateNextMonth}
          className="p-1.5 hover:bg-surface-hover rounded-lg transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div
            key={day}
            className="text-center text-xs text-text-disabled py-1.5 font-medium"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for offset */}
        {Array.from({ length: calendarDays.startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {calendarDays.daysInMonth.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const hasMissions = dateHasMissions(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={cn(
                "aspect-square flex flex-col items-center justify-center text-sm transition-all duration-200 relative",
                isSelected
                  ? "bg-accent text-white font-semibold rounded-full shadow-md shadow-accent/30"
                  : isTodayDate
                    ? "ring-2 ring-accent ring-inset text-accent font-medium hover:bg-surface-hover rounded-lg"
                    : isCurrentMonth
                      ? "hover:bg-surface-hover text-text-primary rounded-lg"
                      : "text-text-disabled hover:bg-surface rounded-lg"
              )}
            >
              {format(day, "d")}
              {/* Mission indicator dot */}
              {hasMissions && !isSelected && (
                <span
                  className={cn(
                    "absolute bottom-1 w-1.5 h-1.5 rounded-full",
                    isTodayDate ? "bg-accent" : "bg-text-secondary"
                  )}
                />
              )}
              {hasMissions && isSelected && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-void/50" />
              )}
            </button>
          );
        })}
      </div>

      {/* Today Quick Link */}
      <button
        onClick={handleSelectToday}
        className="w-full mt-4 px-4 py-2 text-sm text-accent hover:text-accent-hover hover:bg-surface-hover rounded-lg transition-colors text-center font-medium"
      >
        Jump to Today
      </button>
    </div>
  );
}
