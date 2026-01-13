"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Calendar, Clock } from "lucide-react";
import { format, isYesterday, isToday as isDateToday, parseISO } from "date-fns";
import { cn, parseDateString, getTodayDateString } from "@/lib/utils";

interface ArchiveDropdownProps {
  whiteboardDates: string[];
  currentDate: string;
  onSelectDate: (date: string) => void;
}

export function ArchiveDropdown({
  whiteboardDates,
  currentDate,
  onSelectDate,
}: ArchiveDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const today = getTodayDateString();

  // Sort dates descending (most recent first), limit to 30
  const sortedDates = useMemo(() => {
    return [...whiteboardDates]
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 30);
  }, [whiteboardDates]);

  // Format date for display in dropdown
  const formatDropdownDate = (dateString: string): string => {
    const date = parseDateString(dateString);

    if (dateString === today) {
      return "Today";
    }

    // Check if yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (format(date, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd")) {
      return "Yesterday";
    }

    // Format as "Mon, Jan 12"
    return format(date, "EEE, MMM d");
  };

  // Format current date for button display
  const formatButtonDate = (dateString: string): string => {
    if (dateString === today) {
      return "Today";
    }
    const date = parseDateString(dateString);
    return format(date, "MMMM d, yyyy");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as HTMLElement)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Handle date selection
  const handleSelect = (date: string) => {
    onSelectDate(date);
    setIsOpen(false);
  };

  const hasArchive = sortedDates.length > 0;
  const hasPastWhiteboards = sortedDates.some(d => d !== today);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
          isOpen
            ? "bg-surface-hover text-text-primary"
            : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
        )}
      >
        <Calendar className="w-4 h-4" />
        <span>{formatButtonDate(currentDate)}</span>
        <ChevronDown
          className={cn(
            "w-3 h-3 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border-subtle rounded-lg shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-border-subtle">
              <p className="text-xs font-medium text-text-disabled uppercase tracking-wide">
                Whiteboard Archive
              </p>
            </div>

            {/* Date List */}
            <div className="max-h-72 overflow-y-auto">
              {!hasArchive ? (
                <div className="px-4 py-6 text-center">
                  <Clock className="w-8 h-8 text-text-disabled mx-auto mb-2" />
                  <p className="text-sm text-text-secondary">No whiteboards saved yet</p>
                  <p className="text-xs text-text-disabled mt-1">
                    Complete a session to save
                  </p>
                </div>
              ) : !hasPastWhiteboards ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-text-secondary">No previous whiteboards</p>
                  <p className="text-xs text-text-disabled mt-1">
                    Only today's whiteboard exists
                  </p>
                </div>
              ) : (
                <div className="py-1">
                  {sortedDates.map((date) => {
                    const isSelected = date === currentDate;
                    const isCurrentDay = date === today;

                    return (
                      <button
                        key={date}
                        onClick={() => handleSelect(date)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          isSelected
                            ? "bg-accent/10 text-accent"
                            : "text-text-primary hover:bg-surface-hover"
                        )}
                      >
                        {/* Date indicator */}
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            isCurrentDay
                              ? "bg-accent"
                              : isSelected
                              ? "bg-accent/60"
                              : "bg-text-disabled"
                          )}
                        />

                        {/* Date text */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {formatDropdownDate(date)}
                          </p>
                          {!isCurrentDay && (
                            <p className="text-xs text-text-disabled">
                              {format(parseDateString(date), "MMMM d, yyyy")}
                            </p>
                          )}
                        </div>

                        {/* Current day badge */}
                        {isCurrentDay && (
                          <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">
                            Live
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
