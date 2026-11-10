'use client';

import React from 'react';
import {
  BookingItemType,
  BookingProviderId,
  SupportedCurrency,
  VerifiedPricingQuote,
} from '@/lib/booking-types';

interface PricingBreakdownProps {
  itemType: BookingItemType;
  provider: BookingProviderId;
  currency: SupportedCurrency;
  supportedCurrencies: SupportedCurrency[];
  onCurrencyChange: (currency: SupportedCurrency) => void;
  adults: number;
  onAdultsChange: (count: number) => void;
  childrenCount: number;
  onChildrenChange: (count: number) => void;
  rooms: number;
  onRoomsChange: (count: number) => void;
  isPrivateOption: boolean;
  onPrivateOptionChange: (val: boolean) => void;
  availabilitySource:
    | 'live_provider_api'
    | 'widget_only'
    | 'unconfigured'
    | 'error';
  quote: VerifiedPricingQuote | null;
}

const PROVIDER_LABELS: Record<BookingProviderId, string> = {
  nightsbridge: 'NightsBridge',
  bokun: 'Bókun',
  viator: 'Viator',
};

export default function PricingBreakdown({
  itemType,
  provider,
  currency,
  supportedCurrencies,
  onCurrencyChange,
  adults,
  onAdultsChange,
  childrenCount,
  onChildrenChange,
  rooms,
  onRoomsChange,
  isPrivateOption,
  onPrivateOptionChange,
  availabilitySource,
  quote,
}: PricingBreakdownProps) {
  return (
    <div className="booking-pricing-card">
      <div className="booking-pricing-top">
        <div>
          <span className="eyebrow" style={{ color: 'var(--terracotta)' }}>
            GUESTS &amp; CURRENCY
          </span>
          <h4 className="serif booking-cal-title">
            {itemType === 'accommodation'
              ? 'Room & Guest Selection'
              : 'Participants & Pricing'}
          </h4>
        </div>

        {/* Currency Selector (USD, EUR, GBP, LKR) */}
        <div className="booking-currency-select-wrap">
          <label htmlFor="booking-currency-select">CURRENCY</label>
          <select
            id="booking-currency-select"
            value={currency}
            onChange={(e) =>
              onCurrencyChange(e.target.value as SupportedCurrency)
            }
          >
            {supportedCurrencies.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Guest / Participant Counters */}
      <div className="booking-counters-grid">
        <div className="booking-counter-row">
          <div>
            <strong>Adults</strong>
            <small>Age 12+</small>
          </div>
          <div className="counter-controls">
            <button
              type="button"
              onClick={() => onAdultsChange(Math.max(1, adults - 1))}
              aria-label="Decrease adults"
            >
              −
            </button>
            <span>{adults}</span>
            <button
              type="button"
              onClick={() => onAdultsChange(Math.min(16, adults + 1))}
              aria-label="Increase adults"
            >
              +
            </button>
          </div>
        </div>

        <div className="booking-counter-row">
          <div>
            <strong>Children</strong>
            <small>Ages 2–11</small>
          </div>
          <div className="counter-controls">
            <button
              type="button"
              onClick={() => onChildrenChange(Math.max(0, childrenCount - 1))}
              aria-label="Decrease children"
            >
              −
            </button>
            <span>{childrenCount}</span>
            <button
              type="button"
              onClick={() => onChildrenChange(Math.min(10, childrenCount + 1))}
              aria-label="Increase children"
            >
              +
            </button>
          </div>
        </div>

        {itemType === 'accommodation' ? (
          <div className="booking-counter-row">
            <div>
              <strong>Rooms</strong>
              <small>Suites / Villas</small>
            </div>
            <div className="counter-controls">
              <button
                type="button"
                onClick={() => onRoomsChange(Math.max(1, rooms - 1))}
                aria-label="Decrease rooms"
              >
                −
              </button>
              <span>{rooms}</span>
              <button
                type="button"
                onClick={() => onRoomsChange(Math.min(8, rooms + 1))}
                aria-label="Increase rooms"
              >
                +
              </button>
            </div>
          </div>
        ) : (
          <div className="booking-counter-row">
            <div>
              <strong>Private Chauffeur Charter</strong>
              <small>Exclusive vehicle &amp; licensed guide</small>
            </div>
            <label className="booking-private-toggle">
              <input
                type="checkbox"
                checked={isPrivateOption}
                onChange={(e) => onPrivateOptionChange(e.target.checked)}
              />
              <span>{isPrivateOption ? 'Private' : 'Standard'}</span>
            </label>
          </div>
        )}
      </div>

      {/* Verified Provider Pricing Breakdown */}
      <div className="booking-verified-price-box">
        {availabilitySource === 'live_provider_api' && quote ? (
          <>
            <div className="verified-price-badge">
              ✓ VERIFIED {PROVIDER_LABELS[provider].toUpperCase()} RATE
            </div>
            <div className="verified-line-items">
              {quote.lineItems.map((item, idx) => (
                <div key={idx} className="verified-line-row">
                  <span>{item.label}</span>
                  <strong>
                    {item.currency} {item.amount.toLocaleString()}
                  </strong>
                </div>
              ))}
              <div className="verified-line-row muted">
                <span>Taxes &amp; service fees</span>
                <span>
                  {quote.taxesAndFees > 0
                    ? `${quote.currency} ${quote.taxesAndFees.toLocaleString()}`
                    : 'Included / Calculated at checkout'}
                </span>
              </div>
              <div className="verified-line-total">
                <span>Verified Total</span>
                <strong>
                  {quote.currency} {quote.total.toLocaleString()}
                </strong>
              </div>
            </div>
          </>
        ) : (
          <div className="verified-provider-notice">
            <strong>
              Live {PROVIDER_LABELS[provider]} Rates &amp; Taxes ({currency})
            </strong>
            <p>
              Exact seasonal rates, adult/child pricing, and applicable local
              taxes are calculated directly by{' '}
              <strong>{PROVIDER_LABELS[provider]}</strong> when you open the
              official booking checkout. No unverified sample prices are shown.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
