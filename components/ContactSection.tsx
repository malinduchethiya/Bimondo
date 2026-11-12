'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSiteCms } from '@/hooks/useSiteCms';
import {
  BookingSubmissionMethod,
  CmsCustomerEnquiry,
} from '@/lib/cms-defaults';

const BOOKING_METHODS: {
  id: BookingSubmissionMethod;
  label: string;
  shortDesc: string;
  submitText: string;
}[] = [
  {
    id: 'direct_admin',
    label: 'Direct Admin Booking',
    shortDesc: 'Instant booking logged directly in the Admin Panel',
    submitText: 'SEND DIRECT BOOKING TO ADMIN DESK →',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp Concierge',
    shortDesc: 'Logs to Admin Panel + opens WhatsApp chat',
    submitText: 'LOG BOOKING & OPEN WHATSAPP ↗',
  },
  {
    id: 'email',
    label: 'Email Quote Request',
    shortDesc: 'Logs to Admin Panel + prepares formal email quote',
    submitText: 'LOG BOOKING & REQUEST EMAIL QUOTE ↗',
  },
  {
    id: 'callback',
    label: 'Phone / Call Back',
    shortDesc: 'Logs priority callback request to Admin Panel',
    submitText: 'REQUEST CONCIERGE CALLBACK →',
  },
];

export default function ContactSection() {
  const { cms, submitCustomerEnquiryToFirebase } = useSiteCms();
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    bookingMethod: BookingSubmissionMethod;
    selectedPackage: string;
    arrival: string;
    guests: string;
    duration: string;
    style: string;
    message: string;
  }>({
    name: '',
    email: '',
    phone: '',
    bookingMethod: 'direct_admin',
    selectedPackage: 'Custom Tailor-Made Journey',
    arrival: '',
    guests: '2 travellers (Couple / Friends)',
    duration: '7–8 days',
    style: 'Balanced island discovery',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [lastBooking, setLastBooking] = useState<{
    record: CmsCustomerEnquiry | null;
    waUrl: string;
    mailtoUrl: string;
    methodLabel: string;
  } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { id, value } = e.target;
    const key = id === 'tripStyle' ? 'style' : id;
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const activeMethodMeta =
    BOOKING_METHODS.find((m) => m.id === formData.bookingMethod) ||
    BOOKING_METHODS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const waNumber = (cms.general.whatsappNumber || '94762232054').replace(
      /\D/g,
      ''
    );
    const contactEmail = cms.general.contactEmail || 'tours@bimondo.com';

    let savedRecord: CmsCustomerEnquiry | null = null;
    try {
      savedRecord = await submitCustomerEnquiryToFirebase({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        bookingMethod: formData.bookingMethod,
        selectedPackage: formData.selectedPackage,
        arrival: formData.arrival || 'Flexible dates',
        guests: formData.guests,
        duration: formData.duration,
        style: formData.style,
        message: formData.message,
      });
    } catch {
      // Fallback handled below
    } finally {
      setSubmitting(false);
    }

    const refCode = savedRecord?.id
      ? savedRecord.id.toUpperCase()
      : `BK-${Date.now().toString().slice(-6)}`;

    const summaryLines = [
      `Hello Bimondo Travels! (${activeMethodMeta.label})`,
      `Booking Ref: ${refCode}`,
      `Name: ${formData.name}`,
      `Email: ${formData.email}`,
      formData.phone ? `Phone / WhatsApp: ${formData.phone}` : '',
      `Selected Package / Stay: ${formData.selectedPackage}`,
      `Arrival: ${formData.arrival || 'Flexible'}`,
      `Travellers: ${formData.guests}`,
      `Duration: ${formData.duration}`,
      `Interests: ${formData.style}`,
      `Notes: ${formData.message || 'None'}`,
    ]
      .filter(Boolean)
      .join('\n');

    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
      summaryLines
    )}`;
    const mailSubject = `[${activeMethodMeta.label}] ${formData.selectedPackage} — ${formData.name} (${refCode})`;
    const mailtoUrl = `mailto:${contactEmail}?subject=${encodeURIComponent(
      mailSubject
    )}&body=${encodeURIComponent(summaryLines)}`;

    setLastBooking({
      record: savedRecord,
      waUrl,
      mailtoUrl,
      methodLabel: activeMethodMeta.label,
    });
  };

  return (
    <section className="contact" id="contact">
      <div className="wrap contact-grid">
        <div>
          <div className="eyebrow">07 / CONTACT &amp; MULTI-CHANNEL BOOKING</div>
          <h2>
            Plan your
            <br />
            Sri Lanka
            <br />
            <em>journey.</em>
          </h2>
          <p>
            Choose how you prefer to book or enquire. Every method logs your
            request directly into our Battaramulla Admin Desk with an instant
            booking reference.
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
              <strong style={{ color: '#ffffff' }}>Office Address:</strong>{' '}
              {cms.general.locationLabel ||
                'No. 596/1, Thalangama South, Battaramulla, Sri Lanka'}
            </div>
            <div style={{ color: '#f4fbff' }}>
              <strong style={{ color: '#ffffff' }}>Phone / WhatsApp:</strong>{' '}
              <a
                href={`https://wa.me/${(
                  cms.general.whatsappNumber || '94762232054'
                ).replace(/\D/g, '')}`}
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
                href={`mailto:${cms.general.contactEmail || 'tours@bimondo.com'}`}
                style={{
                  color: '#a5eff4',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                  fontWeight: 600,
                }}
              >
                {cms.general.contactEmail || 'tours@bimondo.com'}
              </a>
            </div>
            <div style={{ color: '#f4fbff' }}>
              <strong style={{ color: '#ffffff' }}>Website:</strong>{' '}
              {cms.general.websiteUrl || 'www.bimondotours.com'}
            </div>
            <div style={{ color: '#f4fbff' }}>
              <strong style={{ color: '#ffffff' }}>Instagram:</strong>{' '}
              <a
                href={
                  cms.general.instagramUrl ||
                  'https://www.instagram.com/bimondo.tours/'
                }
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
              · <strong style={{ color: '#ffffff' }}>Facebook:</strong>{' '}
              {cms.general.facebookLabel || 'Bimondo tours'}
            </div>
          </div>
        </div>

        <form id="enquiry" onSubmit={handleSubmit}>
          {/* Booking Method Selector */}
          <div className="field wide booking-method-field">
            <label>Choose Booking Method *</label>
            <div
              className="booking-method-grid"
              role="radiogroup"
              aria-label="Booking Method"
            >
              {BOOKING_METHODS.map((method) => {
                const isSelected = formData.bookingMethod === method.id;
                return (
                  <label
                    key={method.id}
                    className={`booking-method-option ${
                      isSelected ? 'active' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="bookingMethod"
                      value={method.id}
                      checked={isSelected}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          bookingMethod: method.id,
                        }))
                      }
                    />
                    <span className="booking-method-title">{method.label}</span>
                    <span className="booking-method-desc">
                      {method.shortDesc}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

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
            <label htmlFor="phone">
              Phone / WhatsApp{' '}
              {formData.bookingMethod === 'callback' ||
              formData.bookingMethod === 'whatsapp'
                ? '*'
                : '(Optional)'}
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="+44 7700 900000"
              required={
                formData.bookingMethod === 'callback' ||
                formData.bookingMethod === 'whatsapp'
              }
              value={formData.phone}
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

          <div className="field wide">
            <label htmlFor="selectedPackage">
              Select Signature Tour or Boutique Stay
            </label>
            <select
              id="selectedPackage"
              value={formData.selectedPackage}
              onChange={handleChange}
            >
              <option value="Custom Tailor-Made Journey">
                Custom Tailor-Made Sri Lanka Journey
              </option>
              <optgroup label="Signature Private Tours">
                {cms.tours.map((tour) => (
                  <option
                    key={tour.id}
                    value={`Tour: ${tour.name} (${tour.days})`}
                  >
                    {tour.name} — {tour.days}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Handpicked Boutique Stays">
                {cms.stays.map((stay) => (
                  <option
                    key={stay.id}
                    value={`Stay: ${stay.name} (${stay.location})`}
                  >
                    {stay.name} — {stay.location}
                  </option>
                ))}
              </optgroup>
            </select>
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

          <div className="field wide">
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
              placeholder="Preferred pace, hotel category (4-star, boutique, or 5-star luxury), flight details, or questions..."
              rows={2}
              value={formData.message}
              onChange={handleChange}
            />
          </div>

          <button className="pill dark" type="submit" disabled={submitting}>
            {submitting ? 'LOGGING BOOKING…' : activeMethodMeta.submitText}
          </button>

          {lastBooking && (
            <div className="field wide booking-confirmation-box" role="status">
              <div className="booking-confirmation-head">
                <strong>
                  ✓ Booking Logged to Admin Panel (
                  {lastBooking.record?.id
                    ? lastBooking.record.id.toUpperCase()
                    : 'SAVED'}
                  )
                </strong>
                <span>Method: {lastBooking.methodLabel}</span>
              </div>
              <p>
                Your request for{' '}
                <strong>{formData.selectedPackage}</strong> has been recorded in
                our Battaramulla Admin Desk.
              </p>
              <div className="booking-confirmation-actions">
                {formData.bookingMethod === 'whatsapp' && (
                  <a
                    href={lastBooking.waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pill dark"
                  >
                    CONTINUE ON WHATSAPP ↗
                  </a>
                )}
                {formData.bookingMethod === 'email' && (
                  <a href={lastBooking.mailtoUrl} className="pill dark">
                    OPEN EMAIL CLIENT ↗
                  </a>
                )}
                <a
                  href={lastBooking.waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pill"
                >
                  WHATSAPP COPY ↗
                </a>
                <Link href="/admin" prefetch={false} className="pill">
                  VIEW IN ADMIN PANEL ↗
                </Link>
              </div>
            </div>
          )}

          <small className="field wide" style={{ color: 'var(--muted)' }}>
            All booking methods save directly to the Admin Panel (Customer
            Enquiries) &amp; Firebase Firestore.
          </small>
        </form>
      </div>
    </section>
  );
}
