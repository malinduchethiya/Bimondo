'use client';

import React, { useEffect } from 'react';
import { Tour } from '@/lib/tours';

interface TourModalProps {
  tour: Tour | null;
  onClose: () => void;
}

export default function TourModal({ tour, onClose }: TourModalProps) {
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
      <div className="modal-card">
        <button
          type="button"
          aria-label="Close"
          className="modal-close-btn"
          onClick={onClose}
        >
          ×
        </button>

        <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
          BIMONDO SIGNATURE JOURNEY
        </div>

        <h2 id="modalTitle">{tour.name}</h2>

        <p style={{ fontWeight: 700 }}>
          {tour.days} days · {tour.route}
        </p>

        <p>{tour.description}</p>

        <p>
          <strong>Highlights:</strong> {tour.highlights}
        </p>

        <p style={{ fontSize: '12px', marginTop: '16px', color: 'var(--muted)' }}>
          This is a sample itinerary. Final arrangements, price and availability are confirmed by the Bimondo team.
        </p>

        <div className="modal-cta">
          <a
            className="pill dark"
            href={whatsAppUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            ENQUIRE ABOUT THIS TOUR ↗
          </a>
          <button type="button" className="pill" onClick={onClose}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
