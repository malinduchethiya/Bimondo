'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import PageBanner from '@/components/PageBanner';
import {
  BookingProviderId,
  VerifiedBookingConfirmation,
} from '@/lib/booking-types';

export default function BookingConfirmationPage() {
  const [provider, setProvider] = useState<BookingProviderId>('bokun');
  const [referenceInput, setReferenceInput] = useState<string>('');
  const [verification, setVerification] =
    useState<VerifiedBookingConfirmation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const verifyBooking = useCallback(
    async (prov: BookingProviderId, refCode: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          provider: prov,
          ref: refCode.trim(),
        });
        const res = await fetch(`/api/booking/verify?${params.toString()}`, {
          cache: 'no-store',
        });
        const data: VerifiedBookingConfirmation = await res.json();
        setVerification(data);
      } catch {
        setVerification({
          verified: false,
          status: 'failed',
          provider: prov,
          bookingReference: refCode || null,
          verificationMessage:
            'Unable to reach verification service. Please check your official provider confirmation email.',
        });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    let active = true;
    const sp = new URLSearchParams(window.location.search);
    const urlProvider = (sp.get('provider') || 'bokun') as BookingProviderId;
    const urlRef =
      sp.get('ref') ||
      sp.get('bookingReference') ||
      sp.get('confirmationCode') ||
      '';
    const params = new URLSearchParams({
      provider: urlProvider,
      ref: urlRef.trim(),
    });
    fetch(`/api/booking/verify?${params.toString()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data: VerifiedBookingConfirmation) => {
        if (!active) return;
        setProvider(urlProvider);
        if (urlRef) setReferenceInput(urlRef);
        setVerification(data);
      })
      .catch(() => {
        if (!active) return;
        setProvider(urlProvider);
        if (urlRef) setReferenceInput(urlRef);
        setVerification({
          verified: false,
          status: 'failed',
          provider: urlProvider,
          bookingReference: urlRef || null,
          verificationMessage:
            'Unable to reach verification service. Please check your official provider confirmation email.',
        });
      });
    return () => {
      active = false;
    };
  }, []);

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verifyBooking(provider, referenceInput);
  };

  return (
    <main>
      <PageBanner
        eyebrow="BIMONDO TRAVELS  /  BOOKING VERIFICATION"
        title="Booking Status & Provider Confirmation"
      />

      <section className="section wrap">
        <div className="booking-confirmation-shell">
          {/* Verification Lookup Form */}
          <form
            className="booking-verify-form"
            onSubmit={handleManualVerify}
          >
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              VERIFY PROVIDER RESERVATION
            </div>
            <h2 className="serif" style={{ fontSize: '30px', margin: '8px 0 14px' }}>
              Check Verified Booking Status
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.7, margin: '0 0 18px' }}>
              Returning from an external checkout page does not automatically
              confirm a reservation. Enter your official booking reference from{' '}
              <strong>NightsBridge</strong>, <strong>Bókun</strong>, or{' '}
              <strong>Viator</strong> to verify its status.
            </p>

            <div className="booking-verify-inputs">
              <div className="booking-bar-field">
                <label htmlFor="verify-provider">PROVIDER</label>
                <select
                  id="verify-provider"
                  value={provider}
                  onChange={(e) =>
                    setProvider(e.target.value as BookingProviderId)
                  }
                >
                  <option value="bokun">Bókun (Tours &amp; Activities)</option>
                  <option value="nightsbridge">
                    NightsBridge (Accommodation)
                  </option>
                  <option value="viator">Viator (Experiences)</option>
                </select>
              </div>

              <div className="booking-bar-field">
                <label htmlFor="verify-ref">BOOKING REFERENCE CODE</label>
                <input
                  id="verify-ref"
                  type="text"
                  placeholder="e.g. BK-948271 or NB-10294"
                  value={referenceInput}
                  onChange={(e) => setReferenceInput(e.target.value)}
                />
              </div>

              <div className="booking-bar-action">
                <button
                  type="submit"
                  className="pill dark"
                  disabled={loading}
                  style={{ width: '100%', minHeight: '46px' }}
                >
                  {loading ? 'VERIFYING…' : 'VERIFY STATUS'}
                </button>
              </div>
            </div>
          </form>

          {/* Verification Result Display */}
          {verification && (
            <div
              className={`booking-verification-result ${
                verification.verified ? 'is-verified' : 'is-unverified'
              }`}
            >
              {verification.verified ? (
                <>
                  <div className="verified-price-badge">
                    ✓ VERIFIED CONFIRMED BOOKING ({verification.provider.toUpperCase()})
                  </div>
                  <h3 className="serif" style={{ fontSize: '28px', margin: '10px 0' }}>
                    Reservation Confirmed: {verification.bookingReference}
                  </h3>
                  <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
                    {verification.verificationMessage}
                  </p>

                  <div className="booking-review-grid" style={{ marginTop: '18px' }}>
                    <div className="review-kv">
                      <small>BOOKING REFERENCE</small>
                      <strong>{verification.bookingReference}</strong>
                    </div>
                    <div className="review-kv">
                      <small>GUEST DETAILS</small>
                      <strong>
                        {verification.customerName || 'Supplied on voucher'}
                        {verification.customerEmail
                          ? ` (${verification.customerEmail})`
                          : ''}
                      </strong>
                    </div>
                    <div className="review-kv">
                      <small>EXPERIENCE / ACCOMMODATION</small>
                      <strong>
                        {verification.itemName || 'Bimondo Journey'}
                      </strong>
                    </div>
                    <div className="review-kv">
                      <small>TRAVEL DATES</small>
                      <strong>
                        {verification.dates?.checkInOrStart || 'See voucher'}
                        {verification.dates?.checkOutOrEnd
                          ? ` → ${verification.dates.checkOutOrEnd}`
                          : ''}
                        {verification.dates?.departureTime
                          ? ` at ${verification.dates.departureTime}`
                          : ''}
                      </strong>
                    </div>
                    <div className="review-kv">
                      <small>TOTAL PAID / QUOTED</small>
                      <strong>
                        {verification.totalPrice
                          ? `${verification.totalPrice.currency} ${verification.totalPrice.amount.toLocaleString('en-US')}`
                          : 'Refer to provider receipt'}
                      </strong>
                    </div>
                    <div className="review-kv">
                      <small>PAYMENT STATUS</small>
                      <strong>{verification.paymentStatus || 'Confirmed'}</strong>
                    </div>
                    <div className="review-kv" style={{ gridColumn: '1 / -1' }}>
                      <small>CANCELLATION POLICY</small>
                      <strong>
                        {verification.cancellationPolicy ||
                          'Refer to your official provider voucher.'}
                      </strong>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <span
                    className="eyebrow"
                    style={{ color: 'var(--terracotta)' }}
                  >
                    UNVERIFIED CHECKOUT RETURN · {verification.provider.toUpperCase()}
                  </span>
                  <h3 className="serif" style={{ fontSize: '26px', margin: '8px 0 12px' }}>
                    Awaiting Official Provider Confirmation
                  </h3>
                  <p style={{ color: 'var(--ink)', fontSize: '14.5px', lineHeight: 1.72, margin: '0 0 16px' }}>
                    {verification.verificationMessage}
                  </p>
                  {verification.bookingReference && (
                    <p style={{ fontSize: '13.5px', color: 'var(--muted)', margin: '0 0 16px' }}>
                      Submitted Reference:{' '}
                      <strong>{verification.bookingReference}</strong>
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Link href="/packages" prefetch={false} className="pill dark">
                      RETURN TO PACKAGES
                    </Link>
                    <Link href="/stays" prefetch={false} className="pill">
                      RETURN TO BOUTIQUE STAYS
                    </Link>
                    <Link href="/contact" prefetch={false} className="pill">
                      CONTACT COLOMBO CONCIERGE
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
