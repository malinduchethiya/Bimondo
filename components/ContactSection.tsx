'use client';

import React, { useState } from 'react';
import { useSiteCms } from '@/hooks/useSiteCms';

export default function ContactSection() {
  const { cms } = useSiteCms();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    arrival: '',
    guests: '2 travellers',
    duration: '7–10 days',
    style: 'A little of everything',
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
      await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_enquiry',
          enquiry: formData,
        }),
      });
      setSubmittedNotice(
        'Enquiry saved to our Colombo concierge desk & opened in WhatsApp.'
      );
    } catch {
      // continue to WhatsApp fallback
    }

    const text = `Hello Bimondo Travels! I'd like to plan a Sri Lanka journey.\n\nName: ${
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
          <div className="eyebrow">07 / SAY AYUBOWAN</div>
          <h2>
            Let&apos;s make
            <br />
            something
            <br />
            <em>unforgettable.</em>
          </h2>
          <p>
            Tell us a little about your trip. We&apos;ll help shape a Sri Lankan
            journey that feels like yours.
          </p>
          <p>
            <strong>WhatsApp</strong>
            <br />
            <a
              href="https://wa.me/94762232054"
              rel="noopener noreferrer"
              target="_blank"
            >
              +94 76 223 2054 ↗
            </a>
            <br />
            <strong>Email</strong>
            <br />
            <a href="mailto:tours@bimondo.com">tours@bimondo.com</a>
          </p>
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
              <option>1 traveller</option>
              <option>2 travellers</option>
              <option>3–4 travellers</option>
              <option>5–8 travellers</option>
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
              <option>Not sure yet</option>
              <option>4–6 days</option>
              <option>7–10 days</option>
              <option>11–16 days</option>
              <option>17+ days</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="tripStyle">What excites you?</label>
            <select
              id="tripStyle"
              value={formData.style}
              onChange={handleChange}
            >
              <option>A little of everything</option>
              <option>Culture &amp; heritage</option>
              <option>Wildlife &amp; nature</option>
              <option>Beaches &amp; relaxation</option>
              <option>Adventure</option>
              <option>Family journey</option>
            </select>
          </div>

          <div className="field wide">
            <label htmlFor="message">Tell us about your dream trip</label>
            <textarea
              id="message"
              placeholder="Places, interests, hotel preferences, budget or special requests..."
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
            Opens WhatsApp with your details and logs your request in our
            concierge inbox.
          </small>
        </form>
      </div>
    </section>
  );
}
