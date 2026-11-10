'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import BookingCalendar from '@/components/booking/BookingCalendar';
import PricingBreakdown from '@/components/booking/PricingBreakdown';
import ProviderWidgetEmbed from '@/components/booking/ProviderWidgetEmbed';
import { useBookingSettings } from '@/hooks/useBookingSettings';
import {
  BookingItemType,
  BookingProviderId,
  LiveAvailabilityResponse,
  SupportedCurrency,
} from '@/lib/booking-types';

interface BookingPanelProps {
  itemId: string;
  itemName: string;
  itemType: BookingItemType;
  defaultProvider?: BookingProviderId;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialAdults?: number;
  initialChildren?: number;
  initialRooms?: number;
  compact?: boolean;
  onClose?: () => void;
}

const PROVIDER_BADGE: Record<BookingProviderId, string> = {
  nightsbridge: 'NightsBridge Accommodation Engine',
  bokun: 'Bókun Tours & Activities',
  viator: 'Viator Experiences',
};

export default function BookingPanel({
  itemId,
  itemName,
  itemType,
  defaultProvider,
  initialCheckIn = '',
  initialCheckOut = '',
  initialAdults = 2,
  initialChildren = 0,
  initialRooms = 1,
  compact = false,
  onClose,
}: BookingPanelProps) {
  const { settings } = useBookingSettings();

  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, '0')}`;

  const [currentMonth, setCurrentMonth] = useState<string>(defaultMonth);
  const [checkIn, setCheckIn] = useState<string>(initialCheckIn);
  const [checkOut, setCheckOut] = useState<string>(initialCheckOut);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [adults, setAdults] = useState<number>(initialAdults);
  const [childrenCount, setChildrenCount] = useState<number>(initialChildren);
  const [rooms, setRooms] = useState<number>(initialRooms);
  const [isPrivateOption, setIsPrivateOption] = useState<boolean>(true);
  const [currency, setCurrency] = useState<SupportedCurrency>('USD');
  const [step, setStep] = useState<'configure' | 'review' | 'checkout'>(
    'configure'
  );
  const [submittingCheckout, setSubmittingCheckout] = useState<boolean>(false);

  const [availability, setAvailability] =
    useState<LiveAvailabilityResponse | null>(null);
  const [loadingAvail, setLoadingAvail] = useState<boolean>(false);
  const [availError, setAvailError] = useState<string | null>(null);

  const assignment = settings?.assignments?.[itemId];
  const activeProvider: BookingProviderId =
    assignment?.provider ||
    defaultProvider ||
    (itemType === 'accommodation' ? 'nightsbridge' : 'bokun');

  const buttonLabel =
    assignment?.buttonLabel ||
    (activeProvider === 'nightsbridge'
      ? settings?.nightsbridge.buttonLabel || 'BOOK VIA NIGHTSBRIDGE'
      : activeProvider === 'bokun'
      ? settings?.bokun.buttonLabel || 'BOOK VIA BÓKUN'
      : settings?.viator.buttonLabel || 'BOOK ON VIATOR');

  const fetchAvailability = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        itemId,
        provider: activeProvider,
        month: currentMonth,
        checkIn,
        checkOut,
        adults: String(adults),
        children: String(childrenCount),
        rooms: String(rooms),
        currency,
      });
      const res = await fetch(`/api/booking/availability?${params.toString()}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error('Unable to query provider availability.');
      }
      const data: LiveAvailabilityResponse = await res.json();
      setAvailability(data);
      setAvailError(null);
    } catch (err) {
      setAvailError(
        err instanceof Error
          ? err.message
          : 'Failed to retrieve provider availability.'
      );
    } finally {
      setLoadingAvail(false);
    }
  }, [
    itemId,
    activeProvider,
    currentMonth,
    checkIn,
    checkOut,
    adults,
    childrenCount,
    rooms,
    currency,
  ]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({
      itemId,
      provider: activeProvider,
      month: currentMonth,
      checkIn,
      checkOut,
      adults: String(adults),
      children: String(childrenCount),
      rooms: String(rooms),
      currency,
    });
    fetch(`/api/booking/availability?${params.toString()}`, {
      cache: 'no-store',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unable to query provider availability.');
        return res.json();
      })
      .then((data: LiveAvailabilityResponse) => {
        if (!active) return;
        setAvailability(data);
        setAvailError(null);
        setLoadingAvail(false);
      })
      .catch((err) => {
        if (!active) return;
        setAvailError(
          err instanceof Error
            ? err.message
            : 'Failed to retrieve provider availability.'
        );
        setLoadingAvail(false);
      });
    return () => {
      active = false;
    };
  }, [
    itemId,
    activeProvider,
    currentMonth,
    checkIn,
    checkOut,
    adults,
    childrenCount,
    rooms,
    currency,
  ]);

  const handleProceedToReview = () => {
    setStep('review');
  };

  const handleProceedToProviderCheckout = () => {
    if (submittingCheckout) return;
    setSubmittingCheckout(true);
    setStep('checkout');
    setTimeout(() => {
      setSubmittingCheckout(false);
    }, 600);
  };

  const externalId =
    availability?.externalId ||
    assignment?.externalId ||
    (activeProvider === 'nightsbridge'
      ? settings?.nightsbridge.bbid || ''
      : activeProvider === 'bokun'
      ? settings?.bokun.defaultExperienceId || ''
      : '');

  return (
    <div className={`booking-panel-container ${compact ? 'is-compact' : ''}`}>
      {/* Header Bar */}
      <div className="booking-panel-header">
        <div>
          <span className="eyebrow" style={{ color: 'var(--terracotta)' }}>
            OFFICIAL PROVIDER BOOKING · {PROVIDER_BADGE[activeProvider].toUpperCase()}
          </span>
          <h3 className="serif booking-panel-heading">{itemName}</h3>
        </div>
        {onClose && (
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close booking panel"
            style={{ position: 'static' }}
          >
            ×
          </button>
        )}
      </div>

      {/* Stepper Indicator */}
      <div className="booking-step-tabs" role="tablist">
        <button
          type="button"
          className={`booking-step-tab ${step === 'configure' ? 'active' : ''}`}
          onClick={() => setStep('configure')}
        >
          1. Dates &amp; Guests
        </button>
        <button
          type="button"
          className={`booking-step-tab ${step === 'review' ? 'active' : ''}`}
          onClick={() => setStep('review')}
        >
          2. Review Details
        </button>
        <button
          type="button"
          className={`booking-step-tab ${step === 'checkout' ? 'active' : ''}`}
          onClick={() => setStep('checkout')}
        >
          3. Official Checkout
        </button>
      </div>

      {availError && (
        <div className="booking-error-banner" role="alert">
          <span>{availError}</span>
          <button type="button" onClick={fetchAvailability}>
            Retry
          </button>
        </div>
      )}

      {/* STEP 1: Dates & Guests Selection */}
      {step === 'configure' && (
        <div className="booking-step-body">
          <div className="booking-two-col">
            <BookingCalendar
              mode={itemType === 'accommodation' ? 'range' : 'single'}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              selectedDate={checkIn}
              checkOutDate={checkOut}
              onSelectDate={(d) => setCheckIn(d)}
              onSelectRange={(start, end) => {
                setCheckIn(start);
                setCheckOut(end);
              }}
              selectedTime={selectedTime}
              onSelectTime={setSelectedTime}
              availabilitySource={availability?.source || 'unconfigured'}
              days={availability?.days || {}}
              currency={currency}
              loading={loadingAvail}
            />

            <PricingBreakdown
              itemType={itemType}
              provider={activeProvider}
              currency={currency}
              supportedCurrencies={
                settings?.supportedCurrencies || ['USD', 'EUR', 'GBP', 'LKR']
              }
              onCurrencyChange={setCurrency}
              adults={adults}
              onAdultsChange={setAdults}
              childrenCount={childrenCount}
              onChildrenChange={setChildrenCount}
              rooms={rooms}
              onRoomsChange={setRooms}
              isPrivateOption={isPrivateOption}
              onPrivateOptionChange={setIsPrivateOption}
              availabilitySource={availability?.source || 'unconfigured'}
              quote={availability?.quote || null}
            />
          </div>

          <div className="booking-panel-actions">
            <div className="booking-provider-status-note">
              <span>Provider:</span>{' '}
              <strong>{PROVIDER_BADGE[activeProvider]}</strong>
              {availability?.source === 'unconfigured' && (
                <span className="badge-unconfigured">
                  Configuration Needed
                </span>
              )}
              {availability?.source === 'widget_only' && (
                <span className="badge-ready">Official Widget Ready</span>
              )}
              {availability?.source === 'live_provider_api' && (
                <span className="badge-live">Live API Connected</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="pill"
                onClick={handleProceedToReview}
              >
                REVIEW BOOKING DETAILS →
              </button>
              <button
                type="button"
                className="pill dark"
                disabled={submittingCheckout}
                onClick={handleProceedToProviderCheckout}
              >
                {buttonLabel} ↗
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Review Booking Details before Provider Checkout */}
      {step === 'review' && (
        <div className="booking-step-body">
          <div className="booking-review-card">
            <span className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              PRE-CHECKOUT SUMMARY
            </span>
            <h4 className="serif" style={{ fontSize: '24px', margin: '6px 0 14px' }}>
              Review Your Selection Before Proceeding to{' '}
              {PROVIDER_BADGE[activeProvider]}
            </h4>

            <div className="booking-review-grid">
              <div className="review-kv">
                <small>SELECTED EXPERIENCE / STAY</small>
                <strong>{itemName}</strong>
              </div>
              <div className="review-kv">
                <small>BOOKING PROVIDER</small>
                <strong>{PROVIDER_BADGE[activeProvider]}</strong>
              </div>
              <div className="review-kv">
                <small>
                  {itemType === 'accommodation'
                    ? 'CHECK-IN / CHECK-OUT'
                    : 'PREFERRED DEPARTURE DATE'}
                </small>
                <strong>
                  {itemType === 'accommodation'
                    ? `${checkIn || 'Select in widget'} → ${
                        checkOut || 'Select in widget'
                      }`
                    : `${checkIn || 'Select in provider calendar'}${
                        selectedTime ? ` at ${selectedTime}` : ''
                      }`}
                </strong>
              </div>
              <div className="review-kv">
                <small>GUESTS &amp; FORMAT</small>
                <strong>
                  {adults} Adult{adults > 1 ? 's' : ''}
                  {childrenCount > 0
                    ? `, ${childrenCount} Child${childrenCount > 1 ? 'ren' : ''}`
                    : ''}
                  {itemType === 'accommodation'
                    ? ` · ${rooms} Room${rooms > 1 ? 's' : ''}`
                    : isPrivateOption
                    ? ' · Private Chauffeur Journey'
                    : ' · Standard Departure'}
                </strong>
              </div>
              <div className="review-kv">
                <small>SELECTED CURRENCY</small>
                <strong>{currency}</strong>
              </div>
              <div className="review-kv">
                <small>VERIFIED TOTAL</small>
                <strong>
                  {availability?.source === 'live_provider_api' &&
                  availability.quote
                    ? `${availability.quote.currency} ${availability.quote.total.toLocaleString()}`
                    : `Verified inside ${PROVIDER_BADGE[activeProvider]}`}
                </strong>
              </div>
            </div>

            <p className="booking-security-note">
              <strong>Security &amp; Confirmation Notice:</strong> Bimondo Travels
              never collects or stores payment card details on this website. All
              payments and instant booking confirmations are processed directly
              by <strong>{PROVIDER_BADGE[activeProvider]}</strong>.
            </p>

            <div className="booking-panel-actions" style={{ marginTop: '18px' }}>
              <button
                type="button"
                className="pill"
                onClick={() => setStep('configure')}
              >
                ← ADJUST DATES OR GUESTS
              </button>
              <button
                type="button"
                className="pill dark"
                disabled={submittingCheckout}
                onClick={handleProceedToProviderCheckout}
              >
                PROCEED TO {activeProvider.toUpperCase()} CHECKOUT ↗
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Official Provider Widget / Checkout */}
      {step === 'checkout' && (
        <div className="booking-step-body">
          <ProviderWidgetEmbed
            provider={activeProvider}
            itemName={itemName}
            externalId={externalId}
            bokunChannelUuid={settings?.bokun.bookingChannelUuid || ''}
            bokunScriptUrl={settings?.bokun.widgetScriptUrl}
            checkoutUrl={availability?.checkoutUrl || null}
            customEmbedCode={assignment?.embedCode}
            checkIn={checkIn}
            checkOut={checkOut}
            adults={adults}
            childrenCount={childrenCount}
            rooms={rooms}
            currency={currency}
          />

          <div className="booking-panel-actions" style={{ marginTop: '16px' }}>
            <button
              type="button"
              className="pill"
              onClick={() => setStep('configure')}
            >
              ← BACK TO CALENDAR
            </button>
            <Link
              href={`/booking/confirmation?provider=${activeProvider}`}
              prefetch={false}
              className="pill"
            >
              HAVE A BOOKING REFERENCE? VERIFY STATUS →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
