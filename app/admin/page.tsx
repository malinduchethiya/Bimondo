'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signInWithPopup, signOut } from 'firebase/auth';
import PageBanner from '@/components/PageBanner';
import ProviderWidgetEmbed from '@/components/booking/ProviderWidgetEmbed';
import AdminImageUploadField, {
  R2UploadedItemMeta,
} from '@/components/admin/AdminImageUploadField';
import R2BucketManagerTab from '@/components/admin/R2BucketManagerTab';
import { useSiteCms } from '@/hooks/useSiteCms';
import { useBookingSettings } from '@/hooks/useBookingSettings';
import { auth, googleProvider } from '@/lib/firebase';
import {
  CmsCustomerEnquiry,
  CmsDestination,
  CmsFaqItem,
  CmsGalleryPhoto,
  CmsReviewItem,
  SiteCmsData,
} from '@/lib/cms-defaults';
import { Tour } from '@/lib/tours';
import {
  AccommodationItem,
  BookingOpenMode,
  BookingProviderId,
  ItemBookingAssignment,
  PublicBookingSettings,
} from '@/lib/booking-types';

type AdminTabId =
  | 'overview'
  | 'enquiries'
  | 'tours'
  | 'stays'
  | 'destinations'
  | 'gallery'
  | 'r2_storage'
  | 'reviews_faqs'
  | 'booking'
  | 'settings';

function formatDeterministicTime(iso: string): string {
  if (!iso) return 'Just now';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm} UTC`;
}

function formatDeterministicDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export default function AdminDashboardPage() {
  const {
    cms,
    firebaseUser,
    refresh: refreshCms,
    saveCmsToFirebase,
    registerR2MediaInFirebase,
    removeR2MediaFromFirebase,
  } = useSiteCms();
  const {
    settings: bookingSettings,
    refresh: refreshBooking,
  } = useBookingSettings();

  const [activeTab, setActiveTab] = useState<AdminTabId>('overview');
  const [cmsDraft, setCmsDraft] = useState<SiteCmsData | null>(null);
  const [bookingDraft, setBookingDraft] =
    useState<PublicBookingSettings | null>(null);

  const workingCms = cmsDraft ?? cms;
  const workingBooking = bookingDraft ?? bookingSettings;

  // Server-only API credentials for Booking Providers
  const [nightsbridgeClientKey, setNightsbridgeClientKey] =
    useState<string>('');
  const [bokunAccessKey, setBokunAccessKey] = useState<string>('');
  const [bokunSecretKey, setBokunSecretKey] = useState<string>('');
  const [viatorApiKey, setViatorApiKey] = useState<string>('');

  const [saving, setSaving] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [previewItemId, setPreviewItemId] = useState<string>(
    'ceylon-grand-circuit'
  );
  const [enquiryFilter, setEnquiryFilter] = useState<string>('all');

  const handleFirebaseSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setStatusBanner(
        'Signed in to Firebase Admin. All R2 CDN links & CMS changes sync directly with Firestore.'
      );
    } catch (err) {
      setStatusBanner(
        err instanceof Error ? err.message : 'Firebase sign-in cancelled.'
      );
    }
  };

  const handleFirebaseSignOut = async () => {
    await signOut(auth);
    setStatusBanner('Signed out of Firebase Admin session.');
  };

  const saveCmsChanges = async (nextData?: SiteCmsData, customMsg?: string) => {
    const payload = nextData ?? workingCms;
    setSaving(true);
    setStatusBanner(null);
    try {
      const saved = await saveCmsToFirebase(payload);
      setCmsDraft(saved);
      setStatusBanner(
        customMsg ||
          'Changes saved! R2 CDN links & metadata synced to Firebase Firestore.'
      );
      await refreshCms();
    } catch (err) {
      setStatusBanner(
        err instanceof Error ? err.message : 'Error saving changes.'
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteR2ObjectByUrlIfPossible = async (imageUrl?: string) => {
    if (!imageUrl || imageUrl.includes('images.unsplash.com')) return;
    try {
      const res = await fetch(
        `/api/admin/r2?url=${encodeURIComponent(imageUrl)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (res.ok && data.mediaDocId) {
        await removeR2MediaFromFirebase(data.mediaDocId);
      }
    } catch {
      // Ignore if URL is an external non-R2 URL
    }
  };

  const handleR2ObjectRenamed = async (
    oldCdnUrl: string,
    newCdnUrl: string,
    item: R2UploadedItemMeta
  ) => {
    await registerR2MediaInFirebase(item);
    const next: SiteCmsData = {
      ...workingCms,
      tours: workingCms.tours.map((t) =>
        t.image === oldCdnUrl ? { ...t, image: newCdnUrl } : t
      ),
      stays: workingCms.stays.map((s) =>
        s.image === oldCdnUrl ? { ...s, image: newCdnUrl } : s
      ),
      destinations: workingCms.destinations.map((d) =>
        d.image === oldCdnUrl ? { ...d, image: newCdnUrl } : d
      ),
      gallery: workingCms.gallery.map((g) =>
        g.image === oldCdnUrl ? { ...g, image: newCdnUrl } : g
      ),
    };
    setCmsDraft(next);
    await saveCmsChanges(
      next,
      'R2 object renamed and all matching Firebase CDN links updated.'
    );
  };

  const handleResetDefaults = async () => {
    setSaving(true);
    setStatusBanner(null);
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_defaults' }),
      });
      const data = await res.json();
      if (res.ok && data.cms) {
        setCmsDraft(data.cms);
        setStatusBanner('Restored default site content.');
        window.dispatchEvent(new CustomEvent('bimondo:cms-updated'));
        await refreshCms();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBookingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workingBooking) return;
    setSaving(true);
    setStatusBanner(null);

    try {
      const credentialsPayload: Record<string, string> = {};
      if (nightsbridgeClientKey.trim()) {
        credentialsPayload.nightsbridgeClientKey = nightsbridgeClientKey.trim();
      }
      if (bokunAccessKey.trim()) {
        credentialsPayload.bokunAccessKey = bokunAccessKey.trim();
      }
      if (bokunSecretKey.trim()) {
        credentialsPayload.bokunSecretKey = bokunSecretKey.trim();
      }
      if (viatorApiKey.trim()) {
        credentialsPayload.viatorApiKey = viatorApiKey.trim();
      }

      const res = await fetch('/api/booking/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: workingBooking,
          credentials:
            Object.keys(credentialsPayload).length > 0
              ? credentialsPayload
              : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save booking settings.');
      }

      setBookingDraft(data.settings);
      setNightsbridgeClientKey('');
      setBokunAccessKey('');
      setBokunSecretKey('');
      setViatorApiKey('');
      setStatusBanner(
        'Booking provider settings, credentials, and item mappings saved.'
      );
      window.dispatchEvent(new CustomEvent('bimondo:booking-settings-updated'));
      await refreshBooking();
    } catch (err) {
      setStatusBanner(
        err instanceof Error ? err.message : 'Error saving booking settings.'
      );
    } finally {
      setSaving(false);
    }
  };

  const updateBookingAssignment = (
    itemId: string,
    patch: Partial<ItemBookingAssignment>
  ) => {
    if (!workingBooking) return;
    const current = workingBooking.assignments[itemId];
    if (!current) return;
    setBookingDraft({
      ...workingBooking,
      assignments: {
        ...workingBooking.assignments,
        [itemId]: {
          ...current,
          ...patch,
        },
      },
    });
  };

  // --- CRUD Helpers for Tours ---
  const addTour = () => {
    const newTour: Tour = {
      id: `tour-${Date.now()}`,
      name: 'New Bespoke Sri Lanka Journey',
      days: 7,
      category: 'heritage',
      categoryLabel: 'Culture & Heritage',
      route: 'Colombo · Sigiriya · Kandy · Galle',
      highlights: 'Private chauffeur-guide, boutique stays, tailored pace',
      image:
        'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1000&q=85',
      description:
        'A completely private, custom-crafted route through Sri Lanka’s iconic cultural and scenic landscapes.',
      theme: {
        primary: '#1c583e',
        accent: '#2db879',
        bgGradient:
          'linear-gradient(145deg, rgba(225, 248, 236, 0.92) 0%, rgba(205, 242, 226, 0.7) 50%, rgba(230, 249, 241, 0.85) 100%)',
        glowColor: 'rgba(45, 184, 121, 0.28)',
        cardBorder: 'rgba(45, 184, 121, 0.35)',
        tagBg: '#d8f6e7',
        tagColor: '#144d34',
        mistEffect: true,
      },
    };
    setCmsDraft({
      ...workingCms,
      tours: [newTour, ...workingCms.tours],
    });
  };

  const updateTour = (id: string, patch: Partial<Tour>) => {
    setCmsDraft({
      ...workingCms,
      tours: workingCms.tours.map((t) =>
        t.id === id ? { ...t, ...patch } : t
      ),
    });
  };

  const deleteTour = async (id: string) => {
    const target = workingCms.tours.find((t) => t.id === id);
    if (target?.image) {
      await deleteR2ObjectByUrlIfPossible(target.image);
    }
    const next = {
      ...workingCms,
      tours: workingCms.tours.filter((t) => t.id !== id),
    };
    setCmsDraft(next);
    await saveCmsChanges(next, 'Tour package & associated R2 image removed.');
  };

  // --- CRUD Helpers for Boutique Stays ---
  const addStay = () => {
    const newStay: AccommodationItem = {
      id: `stay-${Date.now()}`,
      name: 'New Boutique Heritage Villa',
      location: 'Galle Fort · Southern Coast',
      region: 'coast',
      regionLabel: 'Southern Coast',
      tagline: 'Intimate architectural sanctuary by the Indian Ocean',
      description:
        'Handpicked boutique residence featuring private verandahs, tropical courtyard pools, and warm Sri Lankan hospitality.',
      highlights: [
        'Private suites & plunge pools',
        'Farm-to-table Sri Lankan dining',
        'Official NightsBridge availability',
      ],
      maxGuestsPerRoom: 3,
      image:
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=85',
    };
    setCmsDraft({
      ...workingCms,
      stays: [newStay, ...workingCms.stays],
    });
  };

  const updateStay = (id: string, patch: Partial<AccommodationItem>) => {
    setCmsDraft({
      ...workingCms,
      stays: workingCms.stays.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      ),
    });
  };

  const deleteStay = async (id: string) => {
    const target = workingCms.stays.find((s) => s.id === id);
    if (target?.image) {
      await deleteR2ObjectByUrlIfPossible(target.image);
    }
    const next = {
      ...workingCms,
      stays: workingCms.stays.filter((s) => s.id !== id),
    };
    setCmsDraft(next);
    await saveCmsChanges(next, 'Boutique stay & associated R2 image removed.');
  };

  // --- CRUD Helpers for Destinations ---
  const addDestination = () => {
    const newDest: CmsDestination = {
      id: `dest-${Date.now()}`,
      name: 'New Sri Lanka Region',
      region: 'culture',
      regionLabel: 'Culture & Heritage',
      season: 'Year-round',
      tagline: 'Sacred heritage & untamed island beauty',
      description:
        'Explore uncrowded trails, ancient temples, and authentic village life with your dedicated private guide.',
      highlights: [
        'Private guided exploration',
        'Scenic viewpoints',
        'Authentic local encounters',
      ],
      image:
        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1000&q=85',
    };
    setCmsDraft({
      ...workingCms,
      destinations: [newDest, ...workingCms.destinations],
    });
  };

  const updateDestination = (id: string, patch: Partial<CmsDestination>) => {
    setCmsDraft({
      ...workingCms,
      destinations: workingCms.destinations.map((d) =>
        d.id === id ? { ...d, ...patch } : d
      ),
    });
  };

  const deleteDestination = async (id: string) => {
    const target = workingCms.destinations.find((d) => d.id === id);
    if (target?.image) {
      await deleteR2ObjectByUrlIfPossible(target.image);
    }
    const next = {
      ...workingCms,
      destinations: workingCms.destinations.filter((d) => d.id !== id),
    };
    setCmsDraft(next);
    await saveCmsChanges(next, 'Destination & associated R2 image removed.');
  };

  // --- CRUD Helpers for Gallery ---
  const addGalleryPhoto = () => {
    const newPhoto: CmsGalleryPhoto = {
      id: `photo-${Date.now()}`,
      title: 'Golden Hour in Ceylon',
      location: 'Central Highlands',
      category: 'highlands',
      categoryLabel: 'Highlands & Tea',
      image:
        'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1200&q=85',
      description:
        'Misty mountain valleys and emerald tea terraces captured on a private Bimondo journey.',
    };
    setCmsDraft({
      ...workingCms,
      gallery: [newPhoto, ...workingCms.gallery],
    });
  };

  const updateGalleryPhoto = (id: string, patch: Partial<CmsGalleryPhoto>) => {
    setCmsDraft({
      ...workingCms,
      gallery: workingCms.gallery.map((g) =>
        g.id === id ? { ...g, ...patch } : g
      ),
    });
  };

  const deleteGalleryPhoto = async (id: string) => {
    const target = workingCms.gallery.find((g) => g.id === id);
    if (target?.image) {
      await deleteR2ObjectByUrlIfPossible(target.image);
    }
    const next = {
      ...workingCms,
      gallery: workingCms.gallery.filter((g) => g.id !== id),
    };
    setCmsDraft(next);
    await saveCmsChanges(next, 'Gallery photo & associated R2 image removed.');
  };

  // --- CRUD Helpers for Guest Reviews & FAQs ---
  const addReview = () => {
    const newRev: CmsReviewItem = {
      id: `rev-${Date.now()}`,
      name: 'Guest Name',
      location: 'London, UK',
      rating: 5,
      tour: '14-Day Ceylon Grand Circuit',
      date: 'Visited April 2026',
      quote:
        '“An unforgettable private journey through Sri Lanka with warm local care from start to finish.”',
    };
    setCmsDraft({
      ...workingCms,
      reviews: [newRev, ...workingCms.reviews],
    });
  };

  const updateReview = (id: string, patch: Partial<CmsReviewItem>) => {
    setCmsDraft({
      ...workingCms,
      reviews: workingCms.reviews.map((r) =>
        r.id === id ? { ...r, ...patch } : r
      ),
    });
  };

  const deleteReview = (id: string) => {
    const next = {
      ...workingCms,
      reviews: workingCms.reviews.filter((r) => r.id !== id),
    };
    setCmsDraft(next);
    saveCmsChanges(next, 'Guest review removed.');
  };

  const addFaq = () => {
    const newFaq: CmsFaqItem = {
      id: `faq-${Date.now()}`,
      category: 'private',
      q: 'New Frequently Asked Question?',
      a: 'Detailed, transparent answer from the Bimondo Travels Colombo concierge team.',
    };
    setCmsDraft({
      ...workingCms,
      faqs: [newFaq, ...workingCms.faqs],
    });
  };

  const updateFaq = (id: string, patch: Partial<CmsFaqItem>) => {
    setCmsDraft({
      ...workingCms,
      faqs: workingCms.faqs.map((f) =>
        f.id === id ? { ...f, ...patch } : f
      ),
    });
  };

  const deleteFaq = (id: string) => {
    const next = {
      ...workingCms,
      faqs: workingCms.faqs.filter((f) => f.id !== id),
    };
    setCmsDraft(next);
    saveCmsChanges(next, 'FAQ item removed.');
  };

  // --- CRUD Helpers for Enquiries ---
  const updateEnquiry = (
    id: string,
    patch: Partial<CmsCustomerEnquiry>,
    autoSave = false
  ) => {
    const next = {
      ...workingCms,
      enquiries: workingCms.enquiries.map((e) =>
        e.id === id ? { ...e, ...patch } : e
      ),
    };
    setCmsDraft(next);
    if (autoSave) {
      saveCmsChanges(next, 'Enquiry updated.');
    }
  };

  const deleteEnquiry = (id: string) => {
    const next = {
      ...workingCms,
      enquiries: workingCms.enquiries.filter((e) => e.id !== id),
    };
    setCmsDraft(next);
    saveCmsChanges(next, 'Enquiry deleted.');
  };

  const newEnquiriesCount = workingCms.enquiries.filter(
    (e) => e.status === 'new'
  ).length;

  const navItems: { id: AdminTabId; label: string; badge?: number | string }[] =
    [
      { id: 'overview', label: 'Overview & KPIs' },
      {
        id: 'enquiries',
        label: 'Customer Enquiries',
        badge: newEnquiriesCount > 0 ? `${newEnquiriesCount} NEW` : workingCms.enquiries.length,
      },
      {
        id: 'tours',
        label: 'Tours & Packages',
        badge: workingCms.tours.length,
      },
      {
        id: 'stays',
        label: 'Boutique Stays',
        badge: workingCms.stays.length,
      },
      {
        id: 'destinations',
        label: 'Destinations',
        badge: workingCms.destinations.length,
      },
      {
        id: 'gallery',
        label: 'Photo Gallery',
        badge: workingCms.gallery.length,
      },
      {
        id: 'r2_storage',
        label: 'Cloudflare R2 Bucket',
        badge: 'CDN ONLY',
      },
      {
        id: 'reviews_faqs',
        label: 'Reviews & FAQs',
        badge: workingCms.reviews.length + workingCms.faqs.length,
      },
      {
        id: 'booking',
        label: 'Booking Engines',
        badge: '3 Providers',
      },
      { id: 'settings', label: 'Site & Contact Info' },
    ];

  const filteredEnquiries =
    enquiryFilter === 'all'
      ? workingCms.enquiries
      : workingCms.enquiries.filter((e) => e.status === enquiryFilter);

  return (
    <main className="admin-control-center">
      <PageBanner
        eyebrow="BIMONDO TRAVELS  /  FULL SITE ADMIN PANEL (/ADMIN)"
        title="Website Content, Enquiries & Booking Control Center"
      />

      <section className="section wrap" style={{ paddingTop: '48px' }}>
        {statusBanner && (
          <div
            className="admin-save-banner"
            role="status"
            style={{
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <strong>✓ {statusBanner}</strong>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              style={{
                background: 'transparent',
                border: 0,
                fontWeight: 700,
                cursor: 'pointer',
                color: '#14532d',
              }}
            >
              Dismiss ×
            </button>
          </div>
        )}

        <div className="admin-workspace-layout">
          {/* LEFT SIDEBAR NAVIGATION */}
          <aside className="admin-sidebar" aria-label="Admin Navigation">
            <div className="admin-sidebar-header">
              <span className="eyebrow" style={{ color: 'var(--terracotta)' }}>
                ADMINISTRATION
              </span>
              <h2 className="serif">Bimondo CMS</h2>
            </div>

            <nav className="admin-nav-list">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`admin-nav-btn ${
                    activeTab === item.id ? 'active' : ''
                  }`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <small className="admin-nav-badge">{item.badge}</small>
                  )}
                </button>
              ))}
            </nav>

            <div className="admin-sidebar-footer">
              <div
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  background: 'rgba(21,91,114,0.06)',
                  marginBottom: '10px',
                  fontSize: '11px',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                  FIREBASE + R2 CDN SYNC
                </div>
                {firebaseUser ? (
                  <div>
                    <span style={{ color: '#14532d', display: 'block' }}>
                      ● {firebaseUser.email}
                    </span>
                    <button
                      type="button"
                      onClick={handleFirebaseSignOut}
                      style={{
                        marginTop: '4px',
                        background: 'transparent',
                        border: 0,
                        padding: 0,
                        fontSize: '10.5px',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        color: 'var(--muted)',
                      }}
                    >
                      Sign out of Firebase
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="pill"
                    onClick={handleFirebaseSignIn}
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      fontSize: '10px',
                      minHeight: '30px',
                      marginTop: '4px',
                    }}
                  >
                    SIGN IN WITH GOOGLE (ADMIN)
                  </button>
                )}
              </div>

              <p style={{ fontSize: '11.5px', color: 'var(--muted)', margin: '0 0 10px' }}>
                Last synced: {formatDeterministicTime(workingCms.updatedAt)}
              </p>
              <div style={{ display: 'grid', gap: '8px' }}>
                <Link
                  href="/"
                  prefetch={false}
                  className="pill"
                  style={{ justifyContent: 'center', fontSize: '10.5px' }}
                >
                  VIEW LIVE WEBSITE ↗
                </Link>
                <Link
                  href="/booking"
                  prefetch={false}
                  className="pill dark"
                  style={{ justifyContent: 'center', fontSize: '10.5px' }}
                >
                  OPEN BOOKING PAGE ↗
                </Link>
              </div>
            </div>
          </aside>

          {/* MAIN WORKSPACE CONTENT */}
          <div className="admin-main-panel">
            {/* TAB 1: OVERVIEW & KPI DASHBOARD */}
            {activeTab === 'overview' && (
              <div className="admin-tab-section">
                <div className="section-head" style={{ marginBottom: '24px' }}>
                  <div>
                    <span
                      className="eyebrow"
                      style={{ color: 'var(--terracotta)' }}
                    >
                      01 / SYSTEM OVERVIEW
                    </span>
                    <h2
                      className="serif"
                      style={{ fontSize: 'clamp(28px, 4vw, 40px)', margin: '6px 0 0' }}
                    >
                      Welcome to the Bimondo Admin Panel
                    </h2>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="pill dark"
                      disabled={saving}
                      onClick={() => saveCmsChanges()}
                    >
                      {saving ? 'SAVING…' : 'PUBLISH ALL CHANGES'}
                    </button>
                  </div>
                </div>

                {/* KPI Metrics Grid */}
                <div className="admin-kpi-grid">
                  <button
                    type="button"
                    className="admin-kpi-card"
                    onClick={() => setActiveTab('enquiries')}
                  >
                    <small>CUSTOMER ENQUIRIES</small>
                    <strong className="serif">{workingCms.enquiries.length}</strong>
                    <span>
                      {newEnquiriesCount} unread new request
                      {newEnquiriesCount === 1 ? '' : 's'} →
                    </span>
                  </button>

                  <button
                    type="button"
                    className="admin-kpi-card"
                    onClick={() => setActiveTab('tours')}
                  >
                    <small>SIGNATURE TOURS</small>
                    <strong className="serif">{workingCms.tours.length}</strong>
                    <span>Manage itineraries &amp; routes →</span>
                  </button>

                  <button
                    type="button"
                    className="admin-kpi-card"
                    onClick={() => setActiveTab('stays')}
                  >
                    <small>BOUTIQUE STAYS</small>
                    <strong className="serif">{workingCms.stays.length}</strong>
                    <span>Manage NightsBridge villas →</span>
                  </button>

                  <button
                    type="button"
                    className="admin-kpi-card"
                    onClick={() => setActiveTab('destinations')}
                  >
                    <small>DESTINATIONS</small>
                    <strong className="serif">{workingCms.destinations.length}</strong>
                    <span>Manage regional guides →</span>
                  </button>

                  <button
                    type="button"
                    className="admin-kpi-card"
                    onClick={() => setActiveTab('gallery')}
                  >
                    <small>GALLERY PHOTOS</small>
                    <strong className="serif">{workingCms.gallery.length}</strong>
                    <span>Curate visual stories →</span>
                  </button>

                  <button
                    type="button"
                    className="admin-kpi-card"
                    onClick={() => setActiveTab('reviews_faqs')}
                  >
                    <small>REVIEWS &amp; FAQS</small>
                    <strong className="serif">
                      {workingCms.reviews.length + workingCms.faqs.length}
                    </strong>
                    <span>
                      {workingCms.reviews.length} reviews · {workingCms.faqs.length} FAQs →
                    </span>
                  </button>

                  <button
                    type="button"
                    className="admin-kpi-card"
                    onClick={() => setActiveTab('booking')}
                  >
                    <small>BOOKING INTEGRATIONS</small>
                    <strong className="serif">3 Engines</strong>
                    <span>NightsBridge · Bókun · Viator →</span>
                  </button>

                  <button
                    type="button"
                    className="admin-kpi-card"
                    onClick={() => setActiveTab('r2_storage')}
                  >
                    <small>CLOUDFLARE R2 BUCKET</small>
                    <strong className="serif" style={{ fontSize: '22px' }}>
                      R2 → Firebase CDN
                    </strong>
                    <span>Manage R2 images &amp; CDN links →</span>
                  </button>

                  <button
                    type="button"
                    className="admin-kpi-card"
                    onClick={() => setActiveTab('settings')}
                  >
                    <small>CONCIERGE WHATSAPP</small>
                    <strong className="serif" style={{ fontSize: '22px' }}>
                      +{workingCms.general.whatsappNumber}
                    </strong>
                    <span>Edit contact &amp; brand info →</span>
                  </button>
                </div>

                {/* Recent Customer Enquiries Preview */}
                <div className="admin-assignments-card" style={{ marginTop: '24px' }}>
                  <div className="section-head" style={{ marginBottom: '16px' }}>
                    <div>
                      <span
                        className="eyebrow"
                        style={{ color: 'var(--terracotta)' }}
                      >
                        RECENT TRIP ENQUIRIES
                      </span>
                      <h3 className="serif" style={{ fontSize: '24px', margin: '4px 0 0' }}>
                        Latest Traveller Requests
                      </h3>
                    </div>
                    <button
                      type="button"
                      className="pill"
                      onClick={() => setActiveTab('enquiries')}
                    >
                      OPEN FULL INBOX ({workingCms.enquiries.length}) ↗
                    </button>
                  </div>

                  <div className="admin-assignments-table-wrap">
                    <table className="admin-assignments-table">
                      <thead>
                        <tr>
                          <th>Traveller</th>
                          <th>Arrival &amp; Party</th>
                          <th>Trip Style</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workingCms.enquiries.slice(0, 4).map((enq) => (
                          <tr key={enq.id}>
                            <td>
                              <strong>{enq.name}</strong>
                              <small style={{ display: 'block', color: 'var(--muted)' }}>
                                {enq.email}
                              </small>
                            </td>
                            <td>
                              <span>{enq.arrival}</span>
                              <small style={{ display: 'block', color: 'var(--muted)' }}>
                                {enq.guests} · {enq.duration}
                              </small>
                            </td>
                            <td>{enq.style}</td>
                            <td>
                              <span
                                className={
                                  enq.status === 'new'
                                    ? 'badge-unconfigured'
                                    : enq.status === 'replied'
                                    ? 'badge-live'
                                    : 'badge-ready'
                                }
                              >
                                {enq.status.toUpperCase().replace('_', ' ')}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="pill"
                                style={{
                                  padding: '6px 12px',
                                  minHeight: '30px',
                                  fontSize: '10px',
                                }}
                                onClick={() => setActiveTab('enquiries')}
                              >
                                Manage
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Booking Engine Health Summary */}
                {workingBooking && (
                  <div className="admin-assignments-card" style={{ marginTop: '24px' }}>
                    <div className="section-head" style={{ marginBottom: '16px' }}>
                      <div>
                        <span
                          className="eyebrow"
                          style={{ color: 'var(--terracotta)' }}
                        >
                          LIVE BOOKING SYSTEM STATUS
                        </span>
                        <h3 className="serif" style={{ fontSize: '24px', margin: '4px 0 0' }}>
                          Connected Booking Providers
                        </h3>
                      </div>
                      <button
                        type="button"
                        className="pill dark"
                        onClick={() => setActiveTab('booking')}
                      >
                        CONFIGURE PROVIDERS ↗
                      </button>
                    </div>

                    <div className="admin-providers-grid">
                      <div className="review-kv">
                        <small>NIGHTSBRIDGE (ACCOMMODATIONS)</small>
                        <strong>
                          {workingBooking.nightsbridge.enabled
                            ? 'Enabled'
                            : 'Disabled'}{' '}
                          ·{' '}
                          {workingBooking.nightsbridge.bbid
                            ? `BBID: ${workingBooking.nightsbridge.bbid}`
                            : 'Safe Unconfigured State'}
                        </strong>
                      </div>
                      <div className="review-kv">
                        <small>BÓKUN (TOURS &amp; DEPARTURES)</small>
                        <strong>
                          {workingBooking.bokun.enabled ? 'Enabled' : 'Disabled'}{' '}
                          ·{' '}
                          {workingBooking.bokun.bookingChannelUuid
                            ? 'Channel Connected'
                            : 'Safe Unconfigured State'}
                        </strong>
                      </div>
                      <div className="review-kv">
                        <small>VIATOR (EXPERIENCES)</small>
                        <strong>
                          {workingBooking.viator.enabled ? 'Enabled' : 'Disabled'}{' '}
                          ·{' '}
                          {workingBooking.viator.defaultBookingUrl
                            ? 'Listing Linked'
                            : 'Safe Unconfigured State'}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CUSTOMER ENQUIRIES INBOX */}
            {activeTab === 'enquiries' && (
              <div className="admin-assignments-card">
                <div className="section-head" style={{ marginBottom: '20px' }}>
                  <div>
                    <span
                      className="eyebrow"
                      style={{ color: 'var(--terracotta)' }}
                    >
                      02 / CUSTOMER ENQUIRIES INBOX
                    </span>
                    <h3 className="serif" style={{ fontSize: '28px', margin: '4px 0 0' }}>
                      Manage Trip Requests &amp; Concierge Notes
                    </h3>
                  </div>
                  <div className="filter">
                    {(['all', 'new', 'in_progress', 'replied', 'archived'] as const).map(
                      (st) => (
                        <button
                          key={st}
                          type="button"
                          className={enquiryFilter === st ? 'active' : ''}
                          onClick={() => setEnquiryFilter(st)}
                        >
                          {st.toUpperCase().replace('_', ' ')}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {filteredEnquiries.length === 0 ? (
                  <p style={{ color: 'var(--muted)' }}>
                    No enquiries matching this filter.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {filteredEnquiries.map((enq) => (
                      <div key={enq.id} className="admin-enquiry-row">
                        <div className="admin-item-editor-top">
                          <div>
                            <strong style={{ fontSize: '17px' }}>{enq.name}</strong>
                            <div
                              style={{
                                fontSize: '12.5px',
                                color: 'var(--muted)',
                                marginTop: '2px',
                              }}
                            >
                              <a
                                href={`mailto:${enq.email}`}
                                style={{ color: 'var(--green)', fontWeight: 600 }}
                              >
                                {enq.email}
                              </a>{' '}
                              · Submitted{' '}
                              {formatDeterministicDate(enq.createdAt)} ·
                              Arrival: <strong>{enq.arrival}</strong> · {enq.guests}{' '}
                              · {enq.duration} · {enq.style}
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              gap: '8px',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                            }}
                          >
                            <select
                              value={enq.status}
                              onChange={(e) =>
                                updateEnquiry(
                                  enq.id,
                                  {
                                    status: e.target
                                      .value as CmsCustomerEnquiry['status'],
                                  },
                                  true
                                )
                              }
                              style={{
                                padding: '7px 10px',
                                borderRadius: '8px',
                                border: '1px solid rgba(21,91,114,0.25)',
                                fontSize: '12px',
                                fontWeight: 700,
                              }}
                            >
                              <option value="new">STATUS: NEW</option>
                              <option value="in_progress">
                                STATUS: IN PROGRESS
                              </option>
                              <option value="replied">STATUS: REPLIED</option>
                              <option value="archived">STATUS: ARCHIVED</option>
                            </select>

                            <button
                              type="button"
                              className="pill"
                              style={{
                                padding: '7px 12px',
                                minHeight: '34px',
                                fontSize: '10.5px',
                              }}
                              onClick={() => deleteEnquiry(enq.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        <p
                          style={{
                            background: '#ffffff',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: '1px solid rgba(21,91,114,0.1)',
                            fontSize: '13.5px',
                            lineHeight: 1.6,
                            margin: '10px 0',
                          }}
                        >
                          {enq.message || 'No custom message provided.'}
                        </p>

                        <div className="admin-field" style={{ marginBottom: 0 }}>
                          <label>INTERNAL CONCIERGE NOTES</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="text"
                              placeholder="Add chauffeur assignment, quote reference, or follow-up notes..."
                              value={enq.adminNotes}
                              onChange={(e) =>
                                updateEnquiry(enq.id, {
                                  adminNotes: e.target.value,
                                })
                              }
                              style={{ flex: 1 }}
                            />
                            <button
                              type="button"
                              className="pill dark"
                              style={{
                                padding: '8px 14px',
                                minHeight: '38px',
                                fontSize: '10.5px',
                              }}
                              onClick={() =>
                                saveCmsChanges(undefined, 'Enquiry notes saved.')
                              }
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TOURS & PACKAGES MANAGER */}
            {activeTab === 'tours' && (
              <div className="admin-assignments-card">
                <div className="section-head" style={{ marginBottom: '20px' }}>
                  <div>
                    <span
                      className="eyebrow"
                      style={{ color: 'var(--terracotta)' }}
                    >
                      03 / SIGNATURE TOURS &amp; PACKAGES
                    </span>
                    <h3 className="serif" style={{ fontSize: '28px', margin: '4px 0 0' }}>
                      Manage Private Tour Packages ({workingCms.tours.length})
                    </h3>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="pill"
                      onClick={addTour}
                    >
                      + ADD NEW TOUR PACKAGE
                    </button>
                    <button
                      type="button"
                      className="pill dark"
                      disabled={saving}
                      onClick={() =>
                        saveCmsChanges(undefined, 'Tour packages published live.')
                      }
                    >
                      {saving ? 'SAVING…' : 'SAVE ALL TOURS'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '20px' }}>
                  {workingCms.tours.map((tour) => (
                    <div key={tour.id} className="admin-item-editor-card">
                      <div className="admin-item-editor-top">
                        <div>
                          <span className="admin-type-pill">{tour.categoryLabel}</span>
                          <h4
                            className="serif"
                            style={{ fontSize: '22px', margin: '6px 0 0' }}
                          >
                            {tour.name} ({tour.days} Days)
                          </h4>
                        </div>
                        <button
                          type="button"
                          className="pill"
                          style={{
                            padding: '6px 12px',
                            minHeight: '32px',
                            fontSize: '10.5px',
                          }}
                          onClick={() => deleteTour(tour.id)}
                        >
                          Remove Tour
                        </button>
                      </div>

                      <div className="admin-form-grid-2">
                        <div className="admin-field">
                          <label>TOUR TITLE</label>
                          <input
                            type="text"
                            value={tour.name}
                            onChange={(e) =>
                              updateTour(tour.id, { name: e.target.value })
                            }
                          />
                        </div>

                        <div className="admin-field">
                          <label>DURATION (DAYS) &amp; CATEGORY</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="number"
                              min={1}
                              max={30}
                              value={tour.days}
                              onChange={(e) =>
                                updateTour(tour.id, {
                                  days: Number(e.target.value) || 1,
                                })
                              }
                              style={{ width: '90px' }}
                            />
                            <select
                              value={tour.category}
                              onChange={(e) => {
                                const cat = e.target.value as Tour['category'];
                                const labels: Record<Tour['category'], string> = {
                                  heritage: 'Culture & Heritage',
                                  wildlife: 'Wildlife & Safari',
                                  coast: 'Coast & Slow Living',
                                  adventure: 'Adventure',
                                  family: 'Family Journey',
                                };
                                updateTour(tour.id, {
                                  category: cat,
                                  categoryLabel: labels[cat] || 'Private Journey',
                                });
                              }}
                              style={{ flex: 1 }}
                            >
                              <option value="heritage">Culture &amp; Heritage</option>
                              <option value="wildlife">Wildlife &amp; Safari</option>
                              <option value="coast">Coast &amp; Slow Living</option>
                              <option value="adventure">Adventure</option>
                              <option value="family">Family Journey</option>
                            </select>
                          </div>
                        </div>

                        <div className="admin-field">
                          <label>ROUTE SUMMARY</label>
                          <input
                            type="text"
                            value={tour.route}
                            onChange={(e) =>
                              updateTour(tour.id, { route: e.target.value })
                            }
                          />
                        </div>

                        <AdminImageUploadField
                          label="TOUR HERO IMAGE (CLOUDFLARE R2 BUCKET → FIREBASE CDN LINK)"
                          value={tour.image}
                          folder="tours"
                          onChange={(nextUrl) =>
                            updateTour(tour.id, { image: nextUrl })
                          }
                          onR2Uploaded={registerR2MediaInFirebase}
                          onR2Deleted={(_, docId) =>
                            removeR2MediaFromFirebase(docId)
                          }
                          onOpenR2Settings={() => setActiveTab('r2_storage')}
                        />
                      </div>

                      <div className="admin-field">
                        <label>KEY HIGHLIGHTS</label>
                        <input
                          type="text"
                          value={tour.highlights}
                          onChange={(e) =>
                            updateTour(tour.id, { highlights: e.target.value })
                          }
                        />
                      </div>

                      <div className="admin-field" style={{ marginBottom: 0 }}>
                        <label>DESCRIPTION</label>
                        <textarea
                          rows={2}
                          value={tour.description}
                          onChange={(e) =>
                            updateTour(tour.id, { description: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: BOUTIQUE STAYS MANAGER */}
            {activeTab === 'stays' && (
              <div className="admin-assignments-card">
                <div className="section-head" style={{ marginBottom: '20px' }}>
                  <div>
                    <span
                      className="eyebrow"
                      style={{ color: 'var(--terracotta)' }}
                    >
                      04 / BOUTIQUE STAYS &amp; NIGHTSBRIDGE PROPERTIES
                    </span>
                    <h3 className="serif" style={{ fontSize: '28px', margin: '4px 0 0' }}>
                      Manage Boutique Accommodations ({workingCms.stays.length})
                    </h3>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button type="button" className="pill" onClick={addStay}>
                      + ADD BOUTIQUE STAY
                    </button>
                    <button
                      type="button"
                      className="pill dark"
                      disabled={saving}
                      onClick={() =>
                        saveCmsChanges(undefined, 'Boutique stays published live.')
                      }
                    >
                      {saving ? 'SAVING…' : 'SAVE ALL STAYS'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '20px' }}>
                  {workingCms.stays.map((stay) => (
                    <div key={stay.id} className="admin-item-editor-card">
                      <div className="admin-item-editor-top">
                        <div>
                          <span className="admin-type-pill">
                            {stay.region.toUpperCase()} · MAX {stay.maxGuestsPerRoom} GUESTS/ROOM
                          </span>
                          <h4
                            className="serif"
                            style={{ fontSize: '22px', margin: '6px 0 0' }}
                          >
                            {stay.name}
                          </h4>
                        </div>
                        <button
                          type="button"
                          className="pill"
                          style={{
                            padding: '6px 12px',
                            minHeight: '32px',
                            fontSize: '10.5px',
                          }}
                          onClick={() => deleteStay(stay.id)}
                        >
                          Remove Property
                        </button>
                      </div>

                      <div className="admin-form-grid-2">
                        <div className="admin-field">
                          <label>PROPERTY NAME</label>
                          <input
                            type="text"
                            value={stay.name}
                            onChange={(e) =>
                              updateStay(stay.id, { name: e.target.value })
                            }
                          />
                        </div>

                        <div className="admin-field">
                          <label>LOCATION LABEL &amp; REGION</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="text"
                              value={stay.location}
                              onChange={(e) =>
                                updateStay(stay.id, { location: e.target.value })
                              }
                              style={{ flex: 1 }}
                            />
                            <select
                              value={stay.region}
                              onChange={(e) =>
                                updateStay(stay.id, {
                                  region: e.target
                                    .value as AccommodationItem['region'],
                                })
                              }
                            >
                              <option value="culture">Cultural Triangle</option>
                              <option value="hills">Tea Country &amp; Hills</option>
                              <option value="coast">Southern Coast</option>
                              <option value="wildlife">Safari Lodges</option>
                            </select>
                          </div>
                        </div>

                        <div className="admin-field">
                          <label>TAGLINE</label>
                          <input
                            type="text"
                            value={stay.tagline}
                            onChange={(e) =>
                              updateStay(stay.id, { tagline: e.target.value })
                            }
                          />
                        </div>

                        <div className="admin-field">
                          <label>MAX GUESTS PER ROOM</label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={stay.maxGuestsPerRoom}
                            onChange={(e) =>
                              updateStay(stay.id, {
                                maxGuestsPerRoom: Number(e.target.value) || 2,
                              })
                            }
                          />
                        </div>
                      </div>

                      <AdminImageUploadField
                        label="PROPERTY PHOTO (CLOUDFLARE R2 BUCKET → FIREBASE CDN LINK)"
                        value={stay.image}
                        folder="stays"
                        onChange={(nextUrl) =>
                          updateStay(stay.id, { image: nextUrl })
                        }
                        onR2Uploaded={registerR2MediaInFirebase}
                        onR2Deleted={(_, docId) =>
                          removeR2MediaFromFirebase(docId)
                        }
                        onOpenR2Settings={() => setActiveTab('r2_storage')}
                      />

                      <div className="admin-field">
                        <label>DESCRIPTION</label>
                        <textarea
                          rows={2}
                          value={stay.description}
                          onChange={(e) =>
                            updateStay(stay.id, { description: e.target.value })
                          }
                        />
                      </div>

                      <div className="admin-field">
                        <label>PROPERTY HIGHLIGHTS (COMMA SEPARATED)</label>
                        <input
                          type="text"
                          value={stay.highlights.join(', ')}
                          onChange={(e) =>
                            updateStay(stay.id, {
                              highlights: e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: DESTINATIONS MANAGER */}
            {activeTab === 'destinations' && (
              <div className="admin-assignments-card">
                <div className="section-head" style={{ marginBottom: '20px' }}>
                  <div>
                    <span
                      className="eyebrow"
                      style={{ color: 'var(--terracotta)' }}
                    >
                      05 / REGIONAL DESTINATIONS
                    </span>
                    <h3 className="serif" style={{ fontSize: '28px', margin: '4px 0 0' }}>
                      Manage Sri Lanka Destinations ({workingCms.destinations.length})
                    </h3>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="pill"
                      onClick={addDestination}
                    >
                      + ADD DESTINATION
                    </button>
                    <button
                      type="button"
                      className="pill dark"
                      disabled={saving}
                      onClick={() =>
                        saveCmsChanges(undefined, 'Destinations published live.')
                      }
                    >
                      {saving ? 'SAVING…' : 'SAVE ALL DESTINATIONS'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '20px' }}>
                  {workingCms.destinations.map((dest) => (
                    <div key={dest.id} className="admin-item-editor-card">
                      <div className="admin-item-editor-top">
                        <div>
                          <span className="admin-type-pill">
                            {dest.regionLabel} · {dest.season}
                          </span>
                          <h4
                            className="serif"
                            style={{ fontSize: '22px', margin: '6px 0 0' }}
                          >
                            {dest.name}
                          </h4>
                        </div>
                        <button
                          type="button"
                          className="pill"
                          style={{
                            padding: '6px 12px',
                            minHeight: '32px',
                            fontSize: '10.5px',
                          }}
                          onClick={() => deleteDestination(dest.id)}
                        >
                          Remove
                        </button>
                      </div>

                      <div className="admin-form-grid-2">
                        <div className="admin-field">
                          <label>DESTINATION NAME</label>
                          <input
                            type="text"
                            value={dest.name}
                            onChange={(e) =>
                              updateDestination(dest.id, { name: e.target.value })
                            }
                          />
                        </div>

                        <div className="admin-field">
                          <label>BEST SEASON &amp; REGION</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="text"
                              value={dest.season}
                              onChange={(e) =>
                                updateDestination(dest.id, {
                                  season: e.target.value,
                                })
                              }
                              style={{ flex: 1 }}
                            />
                            <select
                              value={dest.region}
                              onChange={(e) => {
                                const r = e.target
                                  .value as CmsDestination['region'];
                                const labels: Record<
                                  CmsDestination['region'],
                                  string
                                > = {
                                  culture: 'Culture and Heritage',
                                  hills: 'Hill Country and Hiking',
                                  coast: 'Sea and Sand',
                                  wildlife: 'Wildlife and Nature',
                                  colombo: 'Colombo Area & Home Base',
                                };
                                updateDestination(dest.id, {
                                  region: r,
                                  regionLabel: labels[r],
                                });
                              }}
                            >
                              <option value="culture">Culture &amp; Heritage</option>
                              <option value="hills">Hill Country &amp; Hiking</option>
                              <option value="coast">Sea &amp; Sand</option>
                              <option value="wildlife">Wildlife &amp; Nature</option>
                              <option value="colombo">Colombo &amp; Battaramulla</option>
                            </select>
                          </div>
                        </div>

                        <div className="admin-field">
                          <label>TAGLINE</label>
                          <input
                            type="text"
                            value={dest.tagline}
                            onChange={(e) =>
                              updateDestination(dest.id, {
                                tagline: e.target.value,
                              })
                            }
                          />
                        </div>

                        <AdminImageUploadField
                          label="DESTINATION PHOTO (CLOUDFLARE R2 BUCKET → FIREBASE CDN LINK)"
                          value={dest.image}
                          folder="destinations"
                          onChange={(nextUrl) =>
                            updateDestination(dest.id, { image: nextUrl })
                          }
                          onR2Uploaded={registerR2MediaInFirebase}
                          onR2Deleted={(_, docId) =>
                            removeR2MediaFromFirebase(docId)
                          }
                          onOpenR2Settings={() => setActiveTab('r2_storage')}
                        />
                      </div>

                      <div className="admin-field">
                        <label>DESCRIPTION</label>
                        <textarea
                          rows={2}
                          value={dest.description}
                          onChange={(e) =>
                            updateDestination(dest.id, {
                              description: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="admin-field">
                        <label>HIGHLIGHTS (COMMA SEPARATED)</label>
                        <input
                          type="text"
                          value={dest.highlights.join(', ')}
                          onChange={(e) =>
                            updateDestination(dest.id, {
                              highlights: e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: PHOTO GALLERY MANAGER */}
            {activeTab === 'gallery' && (
              <div className="admin-assignments-card">
                <div className="section-head" style={{ marginBottom: '20px' }}>
                  <div>
                    <span
                      className="eyebrow"
                      style={{ color: 'var(--terracotta)' }}
                    >
                      06 / VISUAL STORIES &amp; GALLERY
                    </span>
                    <h3 className="serif" style={{ fontSize: '28px', margin: '4px 0 0' }}>
                      Manage Photo Gallery ({workingCms.gallery.length})
                    </h3>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="pill"
                      onClick={addGalleryPhoto}
                    >
                      + ADD PHOTO
                    </button>
                    <button
                      type="button"
                      className="pill dark"
                      disabled={saving}
                      onClick={() =>
                        saveCmsChanges(undefined, 'Gallery photos published live.')
                      }
                    >
                      {saving ? 'SAVING…' : 'SAVE GALLERY'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '16px' }}>
                  {workingCms.gallery.map((photo) => (
                    <div key={photo.id} className="admin-item-editor-card">
                      <div className="admin-item-editor-top">
                        <div>
                          <span className="admin-type-pill">
                            {photo.categoryLabel} · {photo.location}
                          </span>
                          <h4
                            className="serif"
                            style={{ fontSize: '20px', margin: '4px 0 0' }}
                          >
                            {photo.title}
                          </h4>
                        </div>
                        <button
                          type="button"
                          className="pill"
                          style={{
                            padding: '6px 12px',
                            minHeight: '30px',
                            fontSize: '10.5px',
                          }}
                          onClick={() => deleteGalleryPhoto(photo.id)}
                        >
                          Remove
                        </button>
                      </div>

                      <div className="admin-form-grid-2">
                        <div className="admin-field">
                          <label>PHOTO TITLE</label>
                          <input
                            type="text"
                            value={photo.title}
                            onChange={(e) =>
                              updateGalleryPhoto(photo.id, {
                                title: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="admin-field">
                          <label>LOCATION &amp; CATEGORY</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="text"
                              value={photo.location}
                              onChange={(e) =>
                                updateGalleryPhoto(photo.id, {
                                  location: e.target.value,
                                })
                              }
                              style={{ flex: 1 }}
                            />
                            <select
                              value={photo.category}
                              onChange={(e) => {
                                const c = e.target
                                  .value as CmsGalleryPhoto['category'];
                                const labels: Record<
                                  CmsGalleryPhoto['category'],
                                  string
                                > = {
                                  culture: 'Culture & Heritage',
                                  highlands: 'Highlands & Tea',
                                  wildlife: 'Wildlife & Nature',
                                  coast: 'Coast & Oceans',
                                };
                                updateGalleryPhoto(photo.id, {
                                  category: c,
                                  categoryLabel: labels[c],
                                });
                              }}
                            >
                              <option value="culture">Culture &amp; Heritage</option>
                              <option value="highlands">Highlands &amp; Tea</option>
                              <option value="wildlife">Wildlife &amp; Nature</option>
                              <option value="coast">Coast &amp; Oceans</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <AdminImageUploadField
                        label="GALLERY PHOTO (CLOUDFLARE R2 BUCKET → FIREBASE CDN LINK)"
                        value={photo.image}
                        folder="gallery"
                        onChange={(nextUrl) =>
                          updateGalleryPhoto(photo.id, { image: nextUrl })
                        }
                        onR2Uploaded={registerR2MediaInFirebase}
                        onR2Deleted={(_, docId) =>
                          removeR2MediaFromFirebase(docId)
                        }
                        onOpenR2Settings={() => setActiveTab('r2_storage')}
                      />

                      <div className="admin-field" style={{ marginBottom: 0 }}>
                        <label>CAPTION / STORY</label>
                        <input
                          type="text"
                          value={photo.description}
                          onChange={(e) =>
                            updateGalleryPhoto(photo.id, {
                              description: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6B: CLOUDFLARE R2 BUCKET & FIREBASE CDN MANAGER */}
            {activeTab === 'r2_storage' && (
              <R2BucketManagerTab
                onR2Uploaded={registerR2MediaInFirebase}
                onR2Deleted={(_, docId) => removeR2MediaFromFirebase(docId)}
                onR2Renamed={handleR2ObjectRenamed}
              />
            )}

            {/* TAB 7: GUEST REVIEWS & FAQS MANAGER */}
            {activeTab === 'reviews_faqs' && (
              <div style={{ display: 'grid', gap: '28px' }}>
                {/* Reviews Card */}
                <div className="admin-assignments-card">
                  <div className="section-head" style={{ marginBottom: '20px' }}>
                    <div>
                      <span
                        className="eyebrow"
                        style={{ color: 'var(--terracotta)' }}
                      >
                        07A / TRAVELLER REVIEWS (HOMEPAGE #WHY SECTION)
                      </span>
                      <h3
                        className="serif"
                        style={{ fontSize: '28px', margin: '4px 0 0' }}
                      >
                        Guest Reviews ({workingCms.reviews.length})
                      </h3>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button type="button" className="pill" onClick={addReview}>
                        + ADD REVIEW
                      </button>
                      <button
                        type="button"
                        className="pill dark"
                        disabled={saving}
                        onClick={() =>
                          saveCmsChanges(
                            undefined,
                            'Reviews and FAQs published live.'
                          )
                        }
                      >
                        {saving ? 'SAVING…' : 'SAVE REVIEWS & FAQS'}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '16px' }}>
                    {workingCms.reviews.map((rev) => (
                      <div key={rev.id} className="admin-item-editor-card">
                        <div className="admin-item-editor-top">
                          <strong>
                            {rev.name} ({rev.location}) — ★ {rev.rating}
                          </strong>
                          <button
                            type="button"
                            className="pill"
                            style={{
                              padding: '5px 10px',
                              minHeight: '28px',
                              fontSize: '10px',
                            }}
                            onClick={() => deleteReview(rev.id)}
                          >
                            Remove
                          </button>
                        </div>

                        <div className="admin-form-grid-2">
                          <div className="admin-field">
                            <label>GUEST NAME &amp; COUNTRY</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input
                                type="text"
                                value={rev.name}
                                onChange={(e) =>
                                  updateReview(rev.id, { name: e.target.value })
                                }
                                style={{ flex: 1 }}
                              />
                              <input
                                type="text"
                                value={rev.location}
                                onChange={(e) =>
                                  updateReview(rev.id, {
                                    location: e.target.value,
                                  })
                                }
                                style={{ flex: 1 }}
                              />
                            </div>
                          </div>

                          <div className="admin-field">
                            <label>TOUR TAKEN &amp; VISIT DATE</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input
                                type="text"
                                value={rev.tour}
                                onChange={(e) =>
                                  updateReview(rev.id, { tour: e.target.value })
                                }
                                style={{ flex: 1 }}
                              />
                              <input
                                type="text"
                                value={rev.date}
                                onChange={(e) =>
                                  updateReview(rev.id, { date: e.target.value })
                                }
                                style={{ width: '160px' }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="admin-field" style={{ marginBottom: 0 }}>
                          <label>REVIEW QUOTE</label>
                          <textarea
                            rows={2}
                            value={rev.quote}
                            onChange={(e) =>
                              updateReview(rev.id, { quote: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAQs Card */}
                <div className="admin-assignments-card">
                  <div className="section-head" style={{ marginBottom: '20px' }}>
                    <div>
                      <span
                        className="eyebrow"
                        style={{ color: 'var(--terracotta)' }}
                      >
                        07B / FREQUENTLY ASKED QUESTIONS (#PLANNING-FAQ)
                      </span>
                      <h3
                        className="serif"
                        style={{ fontSize: '28px', margin: '4px 0 0' }}
                      >
                        Planning FAQs ({workingCms.faqs.length})
                      </h3>
                    </div>
                    <button type="button" className="pill" onClick={addFaq}>
                      + ADD FAQ QUESTION
                    </button>
                  </div>

                  <div style={{ display: 'grid', gap: '14px' }}>
                    {workingCms.faqs.map((faq) => (
                      <div key={faq.id} className="admin-item-editor-card">
                        <div className="admin-form-grid-2">
                          <div className="admin-field">
                            <label>QUESTION</label>
                            <input
                              type="text"
                              value={faq.q}
                              onChange={(e) =>
                                updateFaq(faq.id, { q: e.target.value })
                              }
                            />
                          </div>

                          <div className="admin-field">
                            <label>CATEGORY &amp; ACTION</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <select
                                value={faq.category}
                                onChange={(e) =>
                                  updateFaq(faq.id, {
                                    category: e.target
                                      .value as CmsFaqItem['category'],
                                  })
                                }
                                style={{ flex: 1 }}
                              >
                                <option value="private">Private Journeys</option>
                                <option value="stays">Chauffeur &amp; Stays</option>
                                <option value="booking">Seasons &amp; Booking</option>
                              </select>
                              <button
                                type="button"
                                className="pill"
                                style={{
                                  padding: '6px 12px',
                                  minHeight: '36px',
                                  fontSize: '10.5px',
                                }}
                                onClick={() => deleteFaq(faq.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="admin-field" style={{ marginBottom: 0 }}>
                          <label>ANSWER</label>
                          <textarea
                            rows={2}
                            value={faq.a}
                            onChange={(e) =>
                              updateFaq(faq.id, { a: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: BOOKING INTEGRATIONS (NIGHTSBRIDGE, BÓKUN, VIATOR) */}
            {activeTab === 'booking' && workingBooking && (
              <form
                onSubmit={handleSaveBookingSettings}
                className="admin-booking-form"
              >
                <div className="admin-providers-grid">
                  {/* NightsBridge */}
                  <div className="admin-provider-card">
                    <div className="admin-provider-head">
                      <div>
                        <span
                          className="eyebrow"
                          style={{ color: 'var(--terracotta)' }}
                        >
                          ACCOMMODATION ENGINE
                        </span>
                        <h3
                          className="serif"
                          style={{ fontSize: '26px', margin: '4px 0' }}
                        >
                          NightsBridge
                        </h3>
                      </div>
                      <label className="booking-private-toggle">
                        <input
                          type="checkbox"
                          checked={workingBooking.nightsbridge.enabled}
                          onChange={(e) =>
                            setBookingDraft({
                              ...workingBooking,
                              nightsbridge: {
                                ...workingBooking.nightsbridge,
                                enabled: e.target.checked,
                              },
                            })
                          }
                        />
                        <span>
                          {workingBooking.nightsbridge.enabled
                            ? 'Enabled'
                            : 'Disabled'}
                        </span>
                      </label>
                    </div>

                    <div className="admin-field">
                      <label>DEFAULT ESTABLISHMENT BBID</label>
                      <input
                        type="text"
                        placeholder="e.g. 12345"
                        value={workingBooking.nightsbridge.bbid}
                        onChange={(e) =>
                          setBookingDraft({
                            ...workingBooking,
                            nightsbridge: {
                              ...workingBooking.nightsbridge,
                              bbid: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="admin-field">
                      <label>BOOKING ENGINE BASE URL</label>
                      <input
                        type="url"
                        value={workingBooking.nightsbridge.widgetBaseUrl}
                        onChange={(e) =>
                          setBookingDraft({
                            ...workingBooking,
                            nightsbridge: {
                              ...workingBooking.nightsbridge,
                              widgetBaseUrl: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="admin-field">
                      <label>DISPLAY MODE</label>
                      <select
                        value={workingBooking.nightsbridge.openMode}
                        onChange={(e) =>
                          setBookingDraft({
                            ...workingBooking,
                            nightsbridge: {
                              ...workingBooking.nightsbridge,
                              openMode: e.target.value as BookingOpenMode,
                            },
                          })
                        }
                      >
                        <option value="modal">Modal Overlay</option>
                        <option value="inline">Inline Embed</option>
                        <option value="redirect">Provider Checkout Page</option>
                      </select>
                    </div>

                    <div className="admin-field">
                      <label>DEFAULT BUTTON LABEL</label>
                      <input
                        type="text"
                        value={workingBooking.nightsbridge.buttonLabel}
                        onChange={(e) =>
                          setBookingDraft({
                            ...workingBooking,
                            nightsbridge: {
                              ...workingBooking.nightsbridge,
                              buttonLabel: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="admin-field">
                      <label>
                        SERVER CLIENT KEY (
                        {workingBooking.nightsbridge.hasServerCredentials
                          ? 'SET ✓'
                          : 'NOT SET'}
                        )
                      </label>
                      <input
                        type="password"
                        placeholder="Enter key to store on server"
                        value={nightsbridgeClientKey}
                        onChange={(e) =>
                          setNightsbridgeClientKey(e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* Bókun */}
                  <div className="admin-provider-card">
                    <div className="admin-provider-head">
                      <div>
                        <span
                          className="eyebrow"
                          style={{ color: 'var(--terracotta)' }}
                        >
                          TOURS &amp; ACTIVITIES
                        </span>
                        <h3
                          className="serif"
                          style={{ fontSize: '26px', margin: '4px 0' }}
                        >
                          Bókun
                        </h3>
                      </div>
                      <label className="booking-private-toggle">
                        <input
                          type="checkbox"
                          checked={workingBooking.bokun.enabled}
                          onChange={(e) =>
                            setBookingDraft({
                              ...workingBooking,
                              bokun: {
                                ...workingBooking.bokun,
                                enabled: e.target.checked,
                              },
                            })
                          }
                        />
                        <span>
                          {workingBooking.bokun.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    </div>

                    <div className="admin-field">
                      <label>BÓKUN BOOKING CHANNEL UUID</label>
                      <input
                        type="text"
                        placeholder="e.g. a1b2c3d4-e5f6-7890-abcd"
                        value={workingBooking.bokun.bookingChannelUuid}
                        onChange={(e) =>
                          setBookingDraft({
                            ...workingBooking,
                            bokun: {
                              ...workingBooking.bokun,
                              bookingChannelUuid: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="admin-field">
                      <label>DEFAULT EXPERIENCE / ACTIVITY ID</label>
                      <input
                        type="text"
                        placeholder="e.g. 849201"
                        value={workingBooking.bokun.defaultExperienceId}
                        onChange={(e) =>
                          setBookingDraft({
                            ...workingBooking,
                            bokun: {
                              ...workingBooking.bokun,
                              defaultExperienceId: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="admin-field">
                      <label>DISPLAY MODE</label>
                      <select
                        value={workingBooking.bokun.openMode}
                        onChange={(e) =>
                          setBookingDraft({
                            ...workingBooking,
                            bokun: {
                              ...workingBooking.bokun,
                              openMode: e.target.value as BookingOpenMode,
                            },
                          })
                        }
                      >
                        <option value="modal">Modal Overlay</option>
                        <option value="inline">Inline Widget</option>
                        <option value="redirect">Bókun Checkout Page</option>
                      </select>
                    </div>

                    <div className="admin-field">
                      <label>DEFAULT BUTTON LABEL</label>
                      <input
                        type="text"
                        value={workingBooking.bokun.buttonLabel}
                        onChange={(e) =>
                          setBookingDraft({
                            ...workingBooking,
                            bokun: {
                              ...workingBooking.bokun,
                              buttonLabel: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="admin-field">
                      <label>
                        SERVER API KEYS (
                        {workingBooking.bokun.hasServerCredentials
                          ? 'SET ✓'
                          : 'NOT SET'}
                        )
                      </label>
                      <input
                        type="text"
                        placeholder="Bókun Access Key (server-side)"
                        value={bokunAccessKey}
                        onChange={(e) => setBokunAccessKey(e.target.value)}
                        style={{ marginBottom: '6px' }}
                      />
                      <input
                        type="password"
                        placeholder="Bókun Secret Key (server-side)"
                        value={bokunSecretKey}
                        onChange={(e) => setBokunSecretKey(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Viator */}
                  <div className="admin-provider-card">
                    <div className="admin-provider-head">
                      <div>
                        <span
                          className="eyebrow"
                          style={{ color: 'var(--terracotta)' }}
                        >
                          EXPERIENCES &amp; AFFILIATE
                        </span>
                        <h3
                          className="serif"
                          style={{ fontSize: '26px', margin: '4px 0' }}
                        >
                          Viator
                        </h3>
                      </div>
                      <label className="booking-private-toggle">
                        <input
                          type="checkbox"
                          checked={workingBooking.viator.enabled}
                          onChange={(e) =>
                            setBookingDraft({
                              ...workingBooking,
                              viator: {
                                ...workingBooking.viator,
                                enabled: e.target.checked,
                              },
                            })
                          }
                        />
                        <span>
                          {workingBooking.viator.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    </div>

                    <div className="admin-field">
                      <label>VIATOR PARTNER / AFFILIATE ID (PID)</label>
                      <input
                        type="text"
                        placeholder="e.g. P00012345"
                        value={workingBooking.viator.partnerId}
                        onChange={(e) =>
                          setBookingDraft({
                            ...workingBooking,
                            viator: {
                              ...workingBooking.viator,
                              partnerId: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="admin-field">
                      <label>DEFAULT OFFICIAL VIATOR LISTING URL</label>
                      <input
                        type="url"
                        placeholder="https://www.viator.com/Sri-Lanka/..."
                        value={workingBooking.viator.defaultBookingUrl}
                        onChange={(e) =>
                          setBookingDraft({
                            ...workingBooking,
                            viator: {
                              ...workingBooking.viator,
                              defaultBookingUrl: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="admin-field">
                      <label>DISPLAY MODE</label>
                      <select
                        value={workingBooking.viator.openMode}
                        onChange={(e) =>
                          setBookingDraft({
                            ...workingBooking,
                            viator: {
                              ...workingBooking.viator,
                              openMode: e.target.value as BookingOpenMode,
                            },
                          })
                        }
                      >
                        <option value="redirect">
                          Official Viator Checkout Page
                        </option>
                        <option value="modal">Modal Summary &amp; Redirect</option>
                        <option value="inline">Inline Widget Embed</option>
                      </select>
                    </div>

                    <div className="admin-field">
                      <label>DEFAULT BUTTON LABEL</label>
                      <input
                        type="text"
                        value={workingBooking.viator.buttonLabel}
                        onChange={(e) =>
                          setBookingDraft({
                            ...workingBooking,
                            viator: {
                              ...workingBooking.viator,
                              buttonLabel: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="admin-field">
                      <label>
                        SERVER VIATOR API KEY (
                        {workingBooking.viator.hasServerCredentials
                          ? 'SET ✓'
                          : 'NOT SET'}
                        )
                      </label>
                      <input
                        type="password"
                        placeholder="Enter Viator API key (stored server-side)"
                        value={viatorApiKey}
                        onChange={(e) => setViatorApiKey(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Item-Level Provider Mapping */}
                <div className="admin-assignments-card">
                  <div className="section-head" style={{ marginBottom: '20px' }}>
                    <div>
                      <span
                        className="eyebrow"
                        style={{ color: 'var(--terracotta)' }}
                      >
                        ITEM-LEVEL PROVIDER ASSIGNMENTS
                      </span>
                      <h3
                        className="serif"
                        style={{ fontSize: '28px', margin: '4px 0 0' }}
                      >
                        Assign Providers &amp; Widget IDs per Tour or Stay
                      </h3>
                    </div>
                    <button type="submit" className="pill dark" disabled={saving}>
                      {saving ? 'SAVING…' : 'SAVE ALL BOOKING SETTINGS'}
                    </button>
                  </div>

                  <div className="admin-assignments-table-wrap">
                    <table className="admin-assignments-table">
                      <thead>
                        <tr>
                          <th>Item Name</th>
                          <th>Type</th>
                          <th>Provider</th>
                          <th>External ID (BBID / Activity ID / Code)</th>
                          <th>Official Checkout URL / Override</th>
                          <th>Button Label</th>
                          <th>Preview</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.values(workingBooking.assignments).map((item) => (
                          <tr key={item.itemId}>
                            <td>
                              <strong>{item.itemName}</strong>
                              <small
                                style={{ display: 'block', color: 'var(--muted)' }}
                              >
                                {item.itemId}
                              </small>
                            </td>
                            <td>
                              <span className="admin-type-pill">
                                {item.itemType}
                              </span>
                            </td>
                            <td>
                              <select
                                value={item.provider}
                                onChange={(e) =>
                                  updateBookingAssignment(item.itemId, {
                                    provider: e.target.value as BookingProviderId,
                                  })
                                }
                              >
                                <option value="nightsbridge">NightsBridge</option>
                                <option value="bokun">Bókun</option>
                                <option value="viator">Viator</option>
                              </select>
                            </td>
                            <td>
                              <input
                                type="text"
                                placeholder={
                                  item.provider === 'nightsbridge'
                                    ? 'BBID'
                                    : item.provider === 'bokun'
                                    ? 'Activity ID'
                                    : 'Product Code'
                                }
                                value={item.externalId}
                                onChange={(e) =>
                                  updateBookingAssignment(item.itemId, {
                                    externalId: e.target.value,
                                  })
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                placeholder="https://..."
                                value={item.externalUrl}
                                onChange={(e) =>
                                  updateBookingAssignment(item.itemId, {
                                    externalUrl: e.target.value,
                                  })
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={item.buttonLabel}
                                onChange={(e) =>
                                  updateBookingAssignment(item.itemId, {
                                    buttonLabel: e.target.value,
                                  })
                                }
                              />
                            </td>
                            <td>
                              <button
                                type="button"
                                className="pill"
                                style={{
                                  padding: '6px 12px',
                                  minHeight: '32px',
                                  fontSize: '10.5px',
                                }}
                                onClick={() => setPreviewItemId(item.itemId)}
                              >
                                Preview
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Live Widget Preview */}
                {workingBooking.assignments[previewItemId] && (
                  <div className="admin-preview-card">
                    <div className="section-head" style={{ marginBottom: '16px' }}>
                      <div>
                        <span
                          className="eyebrow"
                          style={{ color: 'var(--terracotta)' }}
                        >
                          LIVE WIDGET PREVIEW
                        </span>
                        <h3
                          className="serif"
                          style={{ fontSize: '24px', margin: '4px 0 0' }}
                        >
                          Previewing:{' '}
                          {workingBooking.assignments[previewItemId].itemName}
                        </h3>
                      </div>
                    </div>

                    <ProviderWidgetEmbed
                      provider={workingBooking.assignments[previewItemId].provider}
                      itemName={workingBooking.assignments[previewItemId].itemName}
                      externalId={
                        workingBooking.assignments[previewItemId].externalId ||
                        (workingBooking.assignments[previewItemId].provider ===
                        'nightsbridge'
                          ? workingBooking.nightsbridge.bbid
                          : workingBooking.assignments[previewItemId].provider ===
                            'bokun'
                          ? workingBooking.bokun.defaultExperienceId
                          : '')
                      }
                      bokunChannelUuid={workingBooking.bokun.bookingChannelUuid}
                      bokunScriptUrl={workingBooking.bokun.widgetScriptUrl}
                      checkoutUrl={
                        workingBooking.assignments[previewItemId].externalUrl ||
                        workingBooking.viator.defaultBookingUrl ||
                        null
                      }
                      customEmbedCode={
                        workingBooking.assignments[previewItemId].embedCode
                      }
                    />
                  </div>
                )}
              </form>
            )}

            {/* TAB 9: SITE & CONTACT SETTINGS */}
            {activeTab === 'settings' && (
              <div className="admin-assignments-card">
                <div className="section-head" style={{ marginBottom: '20px' }}>
                  <div>
                    <span
                      className="eyebrow"
                      style={{ color: 'var(--terracotta)' }}
                    >
                      09 / GLOBAL SITE &amp; CONTACT CONFIGURATION
                    </span>
                    <h3 className="serif" style={{ fontSize: '28px', margin: '4px 0 0' }}>
                      Brand Identity &amp; Concierge Details
                    </h3>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="pill"
                      onClick={handleResetDefaults}
                    >
                      RESET TO DEFAULTS
                    </button>
                    <button
                      type="button"
                      className="pill dark"
                      disabled={saving}
                      onClick={() =>
                        saveCmsChanges(
                          undefined,
                          'Global site settings saved and published.'
                        )
                      }
                    >
                      {saving ? 'SAVING…' : 'SAVE SITE SETTINGS'}
                    </button>
                  </div>
                </div>

                <div className="admin-form-grid-2">
                  <div className="admin-field">
                    <label>COMPANY / BRAND NAME</label>
                    <input
                      type="text"
                      value={workingCms.general.siteName}
                      onChange={(e) =>
                        setCmsDraft({
                          ...workingCms,
                          general: {
                            ...workingCms.general,
                            siteName: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="admin-field">
                    <label>BRAND TAGLINE</label>
                    <input
                      type="text"
                      value={workingCms.general.tagline}
                      onChange={(e) =>
                        setCmsDraft({
                          ...workingCms,
                          general: {
                            ...workingCms.general,
                            tagline: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="admin-field">
                    <label>WHATSAPP CONCIERGE NUMBER (DIGITS ONLY)</label>
                    <input
                      type="text"
                      value={workingCms.general.whatsappNumber}
                      onChange={(e) =>
                        setCmsDraft({
                          ...workingCms,
                          general: {
                            ...workingCms.general,
                            whatsappNumber: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="admin-field">
                    <label>CONCIERGE EMAIL ADDRESS</label>
                    <input
                      type="email"
                      value={workingCms.general.contactEmail}
                      onChange={(e) =>
                        setCmsDraft({
                          ...workingCms,
                          general: {
                            ...workingCms.general,
                            contactEmail: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="admin-field">
                    <label>INSTAGRAM PROFILE URL</label>
                    <input
                      type="url"
                      value={workingCms.general.instagramUrl}
                      onChange={(e) =>
                        setCmsDraft({
                          ...workingCms,
                          general: {
                            ...workingCms.general,
                            instagramUrl: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="admin-field">
                    <label>HEADQUARTERS LOCATION &amp; FOUNDED YEAR</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={workingCms.general.locationLabel}
                        onChange={(e) =>
                          setCmsDraft({
                            ...workingCms,
                            general: {
                              ...workingCms.general,
                              locationLabel: e.target.value,
                            },
                          })
                        }
                        style={{ flex: 1 }}
                      />
                      <input
                        type="text"
                        value={workingCms.general.foundedYear}
                        onChange={(e) =>
                          setCmsDraft({
                            ...workingCms,
                            general: {
                              ...workingCms.general,
                              foundedYear: e.target.value,
                            },
                          })
                        }
                        style={{ width: '100px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
