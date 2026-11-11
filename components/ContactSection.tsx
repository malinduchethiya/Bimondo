'use client';

import React, { useState } from 'react';
import { useSiteCms } from '@/hooks/useSiteCms';

export default function ContactSection() {
  const { cms, submitCustomerEnquiryToFirebase } = useSiteCms();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    arrival: '',
    guests: '2 travellers',
    duration: '7–10 days',
    style: 'Balanced island discovery',
    message: '',
  });
  const [submittedNotice, setSubmittedNotice] = useState<string>('');

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { id, value } = e.target;
    const key = id === 'tripStyle' ? 'style' : id;
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await submitCustomerEnquiryToFirebase(formData);
      setSubmittedNotice(
        'Enquiry saved to our Battaramulla office desk & opened in WhatsApp.'
      );
    } catch {
      // continue to WhatsApp fallback
    }

    const text = `Hello Bimondo Travels! I'd like to enquire about a private Sri Lanka journey.\n\nName: ${
      formData.name
    }\nEmail: ${formData.email}\nArrival: ${
      formData.arrival || 'Flexible'
    }\nTravellers: ${formData.guests}\nDuration: ${
      formData.duration
    }\nInterests: ${formData.style}\nNotes: ${formData.message || 'None yet'}`;

    const waNumber = cms.general.whatsappNumber || '94762232054';
    window.open(
      `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener'
    );
  };

  return (
    <section className="contact" id="contact">
      <div className="wrap contact-grid">
        <div>
          <div className="eyebrow">07 / CONTACT &amp; COMPANY DETAILS</div>
          <h2>
            Plan your
            <br />
            Sri Lanka
            <br />
            <em>journey.</em>
          </h2>
          <p>
            Share your travel dates or ideas. Our team in Thalangama South,
            Battaramulla will design a custom day-by-day route around your
            interests, pace, and budget.
          </p>
          <div
            style={{
              fontSize: '0.92rem',
              lineHeight: 1.75,
              color: '#f4fbff',
              marginTop: '16px',
            }}
          >
            <div style={{ color: '#f4fbff' }}>
              <strong style={{ color: '#ffffff' }}>Office Address:</strong> No.
              596/1, Thalangama South, Battaramulla, Sri Lanka
            </div>
            <div style={{ color: '#f4fbff' }}>
              <strong style={{ color: '#ffffff' }}>Phone / WhatsApp:</strong>{' '}
              <a
                href="https://wa.me/94762232054"
                rel="noopener noreferrer"
                target="_blank"
                style={{
                  color: '#a5eff4',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                  fontWeight: 600,
                }}
              >
                +94 76 223 2054 ↗
              </a>
            </div>
            <div style={{ color: '#f4fbff' }}>
              <strong style={{ color: '#ffffff' }}>Email:</strong>{' '}
              <a
                href="mailto:tours@bimondo.com"
                style={{
                  color: '#a5eff4',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                  fontWeight: 600,
                }}
              >
                tours@bimondo.com
              </a>
            </div>
            <div style={{ color: '#f4fbff' }}>
              <strong style={{ color: '#ffffff' }}>Website:</strong>{' '}
              www.bimondotours.com
            </div>
            <div style={{ color: '#f4fbff' }}>
              <strong style={{ color: '#ffffff' }}>Instagram:</strong>{' '}
              <a
                href="https://www.instagram.com/bimondo.tours/"
                rel="noopener noreferrer"
                target="_blank"
                style={{
                  color: '#a5eff4',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                  fontWeight: 600,
                }}
              >
                @Bimondo.tours
              </a>{' '}
              · <strong style={{ color: '#ffffff' }}>Facebook:</strong> Bimondo
              tours
            </div>
          </div>
        </div>

        <form id="enquiry" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Your name *</label>
            <input
              id="name"
              placeholder="Full name"
              required
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label htmlFor="email">Email address *</label>
            <input
              id="email"
              placeholder="you@example.com"
              required
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label htmlFor="arrival">Arrival date</label>
            <input
              id="arrival"
              type="date"
              value={formData.arrival}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label htmlFor="guests">Travellers</label>
            <select
              id="guests"
              value={formData.guests}
              onChange={handleChange}
            >
              <option>1 traveller (Solo)</option>
              <option>2 travellers (Couple / Friends)</option>
              <option>3–4 travellers (Family / Small Group)</option>
              <option>5–8 travellers (Private Group)</option>
              <option>9+ travellers</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="duration">Trip length</label>
            <select
              id="duration"
              value={formData.duration}
              onChange={handleChange}
            >
              <option>Half-day / Full-day Colombo experience</option>
              <option>5–6 days</option>
              <option>7–8 days</option>
              <option>9–10 days</option>
              <option>12–14 days</option>
              <option>15+ days</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="tripStyle">Primary interest</label>
            <select
              id="tripStyle"
              value={formData.style}
              onChange={handleChange}
            >
              <option>Balanced island discovery</option>
              <option>Culture &amp; Heritage Tours</option>
              <option>Hiking &amp; Wildlife</option>
              <option>Adventure Tours (Surf, Rafting, Diving, Kite)</option>
              <option>Sea &amp; Sand Escapes</option>
              <option>Luxury &amp; Honeymoon</option>
              <option>Family Journey</option>
            </select>
          </div>

          <div className="field wide">
            <label htmlFor="message">Tell us about your plans</label>
            <textarea
              id="message"
              placeholder="Preferred tours or destinations, accommodation style (4-star, boutique, or 5-star luxury), pace, or questions..."
              rows={3}
              value={formData.message}
              onChange={handleChange}
            />
          </div>

          <button className="pill dark" type="submit">
            SEND ENQUIRY VIA WHATSAPP ↗
          </button>

          {submittedNotice && (
            <small
              className="field wide"
              style={{ color: 'var(--green)', fontWeight: 700 }}
            >
              ✓ {submittedNotice}
            </small>
          )}

          <small className="field wide" style={{ color: 'var(--muted)' }}>
            Opens WhatsApp (+94 76 223 2054) with your details and logs your
            enquiry for our Battaramulla team.
          </small>
        </form>
      </div>
    </section>
  );
}
