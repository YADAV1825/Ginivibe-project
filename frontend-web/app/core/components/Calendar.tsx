'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Calendar.module.css';

interface CalendarProps {
  value?: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  ariaLabel?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Monday-first offset for the 1st of the viewed month (0..6). */
function leadBlanks(year: number, month: number): number {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

export function Calendar({ value, onChange, minDate, maxDate, ariaLabel }: CalendarProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [viewYear, setViewYear] = useState(() => (value ?? today).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (value ?? today).getMonth());

  const minDay = minDate ? startOfDay(minDate) : undefined;
  const maxDay = maxDate ? startOfDay(maxDate) : undefined;

  const yearOptions = useMemo(() => {
    const from = minDay ? minDay.getFullYear() : today.getFullYear() - 100;
    const to = maxDay ? maxDay.getFullYear() : today.getFullYear() + 10;
    const years: number[] = [];
    for (let year = from; year <= to; year += 1) years.push(year);
    return years;
  }, [minDay, maxDay, today]);

  const stepMonth = (delta: -1 | 1) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const blanks = leadBlanks(viewYear, viewMonth);
  const cells: Array<Date | null> = [
    ...Array<null>(blanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, day) => new Date(viewYear, viewMonth, day + 1)),
  ];

  return (
    <div className={styles.calendar} role="group" aria-label={ariaLabel ?? 'Choose a date'}>
      <div className={styles.caption}>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => stepMonth(-1)}
          aria-label="Previous month"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <div className={styles.dropdowns}>
          <select
            className={styles.dropdown}
            value={viewMonth}
            onChange={(event) => setViewMonth(Number(event.target.value))}
            aria-label="Month"
          >
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={index}>{name}</option>
            ))}
          </select>
          <select
            className={styles.dropdown}
            value={viewYear}
            onChange={(event) => setViewYear(Number(event.target.value))}
            aria-label="Year"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => stepMonth(1)}
          aria-label="Next month"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.weekRow} aria-hidden="true">
        {WEEKDAYS.map((day) => (
          <span key={day} className={styles.weekCell}>{day}</span>
        ))}
      </div>

      <div className={styles.grid}>
        {cells.map((date, index) => {
          if (!date) return <span key={`blank-${index}`} className={styles.outside} />;
          const disabled =
            (minDay !== undefined && date < minDay) ||
            (maxDay !== undefined && date > maxDay);
          const isSelected = value ? sameDay(date, value) : false;
          const isToday = sameDay(date, today);
          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onChange(date)}
              aria-label={date.toDateString()}
              aria-pressed={isSelected}
              className={[
                styles.day,
                isSelected ? styles.daySelected : '',
                isToday && !isSelected ? styles.dayToday : '',
              ].filter(Boolean).join(' ')}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
