'use client';

import React, { useMemo } from 'react';
import {
  AvailabilitySlot,
  CalendarDayAvailability,
  SupportedCurrency,
} from '@/lib/booking-types';

interface BookingCalendarProps {
  mode: 'single' | 'range';
  currentMonth: string; // YYYY-MM
  onMonthChange: (nextMonth: string) => void;
  selectedDate: string; // YYYY-MM-DD (or check-in for range)
  checkOutDate?: string; // YYYY-MM-DD for range
  onSelectDate: (dateStr: string) => void;
  onSelectRange?: (checkIn: string, checkOut: string) => void;
  selectedTime?: string;
  onSelectTime?: (time: string) => void;
  availabilitySource:
    | 'live_provider_api'
    | 'widget_only'
    | 'unconfigured'
    | 'error';
  days: Record<string, CalendarDayAvailability>;
  currency: SupportedCurrency;
  loading?: boolean;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toYmd(year: number, month1Based: number, day: number): string {
  return `${year}-${String(month1Based).padStart(2, '0')}-${String(
    day
  ).padStart(2, '0')}`;
}

export default function BookingCalendar({
  mode,
  currentMonth,
  onMonthChange,
  selectedDate,
  checkOutDate = '',
  onSelectDate,
  onSelectRange,
  selectedTime = '',
  onSelectTime,
  availabilitySource,
  days,
  currency,
  loading = false,
}: BookingCalendarProps) {
  const todayStr = useMemo(() => {
    const now = new Date();
    return toYmd(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }, []);

  const { year, month, monthLabel, cells } = useMemo(() => {
    const parts = currentMonth.split('-');
    const y = Number(parts[0]) || new Date().getFullYear();
    const m = Number(parts[1]) || new Date().getMonth() + 1;

    const firstDay = new Date(y, m - 1, 1);
    const totalDays = new Date(y, m, 0).getDate();
    // Convert Sunday=0..Saturday=6 into Monday=0..Sunday=6
    const startOffset = (firstDay.getDay() + 6) % 7;

    const label = firstDay.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    const list: Array<{ day: number | null; dateStr: string }> = [];
    for (let i = 0; i < startOffset; i++) {
      list.push({ day: null, dateStr: `empty-${i}` });
    }
    for (let d = 1; d <= totalDays; d++) {
      list.push({ day: d, dateStr: toYmd(y, m, d) });
    }

    return { year: y, month: m, monthLabel: label, cells: list };
  }, [currentMonth]);

  const handlePrevMonth = () => {
    const prev = new Date(year, month - 2, 1);
    onMonthChange(
      `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
    );
  };

  const handleNextMonth = () => {
    const next = new Date(year, month, 1);
    onMonthChange(
      `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
    );
  };

  const handleDayClick = (dateStr: string) => {
    if (dateStr < todayStr) return;

    // If live provider API returned availability, enforce available dates only
    if (availabilitySource === 'live_provider_api') {
      const dayInfo = days[dateStr];
      if (!dayInfo || !dayInfo.available) return;
    }

    if (mode === 'range' && onSelectRange) {
      if (!selectedDate || (selectedDate && checkOutDate)) {
        onSelectRange(dateStr, '');
      } else if (dateStr > selectedDate) {
        onSelectRange(selectedDate, dateStr);
      } else {
        onSelectRange(dateStr, '');
      }
    } else {
      onSelectDate(dateStr);
    }
  };

  const activeDayData: CalendarDayAvailability | undefined = selectedDate
    ? days[selectedDate]
    : undefined;
  const departureSlots: AvailabilitySlot[] =
    activeDayData?.departureTimes || [];

  return (
    <div className="booking-calendar-card">
      <div className="booking-cal-header">
        <div>
          <span className="eyebrow" style={{ color: 'var(--terracotta)' }}>
            {mode === 'range'
              ? 'SELECT CHECK-IN & CHECK-OUT'
              : 'SELECT PREFERRED DEPARTURE DATE'}
          </span>
          <h4 className="serif booking-cal-title">{monthLabel}</h4>
        </div>
        <div className="booking-cal-nav">
          <button
            type="button"
            className="review-arrow-btn"
            onClick={handlePrevMonth}
            aria-label="Previous month"
          >
            ←
          </button>
          <button
            type="button"
            className="review-arrow-btn"
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            →
          </button>
        </div>
      </div>

      {/* Honest Provider Availability Status Notice */}
      <div className="booking-cal-status-strip">
        {loading ? (
          <span>Checking live provider availability…</span>
        ) : availabilitySource === 'live_provider_api' ? (
          <span className="status-live">
            ● Live availability &amp; starting rates synced from provider
          </span>
        ) : availabilitySource === 'widget_only' ? (
          <span className="status-widget">
            Select your preferred travel dates below to pass directly to the
            official provider booking engine, where live slot availability is
            verified.
          </span>
        ) : (
          <span className="status-unconfigured">
            Live availability requires provider configuration. You can pre-select
            dates below or configure provider IDs in Admin Settings.
          </span>
        )}
      </div>

      <div className="booking-cal-weekdays">
        {WEEKDAYS.map((w) => (
          <div key={w} className="booking-cal-weekday">
            {w}
          </div>
        ))}
      </div>

      <div className="booking-cal-grid">
        {cells.map((cell) => {
          if (cell.day === null) {
            return (
              <div
                key={cell.dateStr}
                className="booking-cal-cell is-empty"
                aria-hidden="true"
              />
            );
          }

          const isPast = cell.dateStr < todayStr;
          const liveDay = days[cell.dateStr];
          const isUnavailableByProvider =
            availabilitySource === 'live_provider_api' &&
            (!liveDay || !liveDay.available);
          const isDisabled = isPast || isUnavailableByProvider;

          const isStart = selectedDate === cell.dateStr;
          const isEnd = mode === 'range' && checkOutDate === cell.dateStr;
          const isInRange =
            mode === 'range' &&
            Boolean(selectedDate && checkOutDate) &&
            cell.dateStr > selectedDate &&
            cell.dateStr < checkOutDate;
          const isLiveAvailable =
            availabilitySource === 'live_provider_api' &&
            Boolean(liveDay?.available);

          return (
            <button
              key={cell.dateStr}
              type="button"
              disabled={isDisabled}
              onClick={() => handleDayClick(cell.dateStr)}
              className={[
                'booking-cal-cell',
                isDisabled ? 'is-disabled' : 'is-selectable',
                isLiveAvailable ? 'is-live-available' : '',
                isStart || isEnd ? 'is-selected' : '',
                isInRange ? 'is-in-range' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-label={cell.dateStr}
            >
              <span className="cal-day-num">{cell.day}</span>
              {isLiveAvailable && liveDay?.startingPrice !== undefined && (
                <span className="cal-day-price">
                  {currency} {Math.round(liveDay.startingPrice)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Summary */}
      <div className="booking-cal-selection-bar">
        {mode === 'range' ? (
          <div className="cal-range-summary">
            <div>
              <small>CHECK-IN</small>
              <strong>{selectedDate || 'Select date'}</strong>
            </div>
            <span>→</span>
            <div>
              <small>CHECK-OUT</small>
              <strong>{checkOutDate || 'Select date'}</strong>
            </div>
          </div>
        ) : (
          <div className="cal-range-summary">
            <div>
              <small>SELECTED DEPARTURE</small>
              <strong>{selectedDate || 'Select a date on calendar'}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Departure Times if supplied by Live Provider API */}
      {departureSlots.length > 0 && onSelectTime && (
        <div className="booking-departure-times">
          <span className="eyebrow" style={{ color: 'var(--terracotta)' }}>
            AVAILABLE DEPARTURE TIMES ({selectedDate})
          </span>
          <div className="departure-slots-row">
            {departureSlots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                className={`departure-slot-pill ${
                  selectedTime === slot.time ? 'active' : ''
                }`}
                onClick={() => onSelectTime(slot.time)}
              >
                <span>{slot.time}</span>
                {slot.availableCount !== undefined && (
                  <small>{slot.availableCount} left</small>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
