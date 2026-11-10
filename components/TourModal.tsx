'use client';

import React, { useEffect, useState } from 'react';
import { Tour } from '@/lib/tours';
import BookingPanel from '@/components/booking/BookingPanel';

interface TourModalProps {
  tour: Tour | null;
  initialTab?: 'itinerary' | 'booking';
  onClose: () => void;
}

export default function TourModal({
  tour,
  initialTab = 'booking',
  onClose,
}: TourModalProps) {
  const contextKey = `${tour?.id || 'none'}-${initialTab}`;
  const [tabState, setTabState] = useState<{
    key: string;
    tab: 'itinerary' | 'booking';
  }>({
    key: contextKey,
    tab: initialTab,
  });

  const activeTab =
    tabState.key === contextKey ? tabState.tab : initialTab;

  const setActiveTab = (nextTab: 'itinerary' | 'booking') => {
    setTabState({ key: contextKey, tab: nextTab });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (tour) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [tour, onClose]);

  if (!tour) return null;

  const whatsAppUrl = `https://wa.me/94762232054?text=${encodeURIComponent(
    `Hello Bimondo, I'd like to enquire about the ${tour.name} (${tour.days} days).`
  )}`;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalTitle"
    >
      <div className="modal-card booking-modal-wide">
        <button
          type="button"
          aria-label="Close"
          className="modal-close-btn"
          onClick={onClose}
        >
          ×
        </button>

        <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
          BIMONDO SIGNATURE JOURNEY · {tour.days} DAYS
        </div>

        <h2 id="modalTitle">{tour.name}</h2>

        <div
          className="filter"
          style={{ marginTop: '12px', marginBottom: '20px' }}
        >
          <button
            type="button"
            className={activeTab === 'booking' ? 'active' : ''}
            onClick={() => setActiveTab('booking')}
          >
            Availability &amp; Online Booking
          </button>
          <button
            type="button"
            className={activeTab === 'itinerary' ? 'active' : ''}
            onClick={() => setActiveTab('itinerary')}
          >
            Route &amp; Highlights
          </button>
        </div>

        {activeTab === 'itinerary' ? (
          <div>
            <p style={{ fontWeight: 700, color: 'var(--ink)' }}>
              {tour.days} days · {tour.route}
            </p>

            <p>{tour.description}</p>

            <p>
              <strong>Highlights:</strong> {tour.highlights}
            </p>

            <div className="modal-cta">
              <button
                type="button"
                className="pill dark"
                onClick={() => setActiveTab('booking')}
              >
                CHECK AVAILABILITY &amp; BOOK ↗
              </button>
              <a
                className="pill"
                href={whatsAppUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                WHATSAPP CONCIERGE ↗
              </a>
              <button type="button" className="pill" onClick={onClose}>
                CLOSE
              </button>
            </div>
          </div>
        ) : (
          <BookingPanel
            itemId={tour.id}
            itemName={`${tour.name} (${tour.days} Days)`}
            itemType="tour"
          />
        )}
      </div>
    </div>
  );
}
