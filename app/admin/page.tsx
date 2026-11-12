'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signInWithPopup, signOut } from 'firebase/auth';
import PageBanner from '@/components/PageBanner';
import ProviderWidgetEmbed from '@/components/booking/ProviderWidgetEmbed';
import AdminImageUploadField, {
  R2UploadedItemMeta,
} from '@/components/admin/AdminImageUploadField';
import R2BucketManagerTab, {
  R2QuickAssignTarget,
} from '@/components/admin/R2BucketManagerTab';
import { useSiteCms } from '@/hooks/useSiteCms';
import { useBookingSettings } from '@/hooks/useBookingSettings';
import { auth, googleProvider } from '@/lib/firebase';
import {
  BookingSubmissionMethod,
  CmsCustomerEnquiry,
  CmsDestination,
  CmsFaqItem,
  CmsGalleryPhoto,
  CmsReviewItem,
  DEFAULT_HERO_IMAGES,
  SiteCmsData,
  StaggerSlideVariant,
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
  | 'sec_hero'
  | 'sec_thoughts'
  | 'sec_places'
  | 'sec_tours'
  | 'sec_faqs'
  | 'sec_stays'
  | 'sec_gallery'
  | 'sec_brand'
  | 'enquiries'
  | 'r2_storage'
  | 'booking';

function formatDeterministicTime(iso: string): string {
  if (!iso) return 'Just now';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm} UTC`;
}

function AdminThumb({ src, alt }: { src?: string; alt: string }) {
  if (!src || src.startsWith('data:')) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          color: 'var(--muted)',
          background: '#eae6dd',
        }}
      >
        No Image
      </div>
    );
  }
  if (src.includes('/api/admin/r2/file/')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="160px"
      className="object-cover"
      referrerPolicy="no-referrer"
    />
  );
}

export default function AdminDashboardPage() {
  const {
    cms,
    firebaseUser,
    refresh: refreshCms,
    saveCmsToFirebase,
    submitCustomerEnquiryToFirebase,
    registerR2MediaInFirebase,
    removeR2MediaFromFirebase,
  } = useSiteCms();
  const {
    settings: bookingSettings,
    refresh: refreshBooking,
  } = useBookingSettings();

  const [activeTab, setActiveTab] = useState<AdminTabId>('sec_hero');
  const [cmsDraft, setCmsDraft] = useState<SiteCmsData | null>(null);
  const [bookingDraft, setBookingDraft] =
    useState<PublicBookingSettings | null>(null);

  const workingCms = cmsDraft ?? cms;
  const workingBooking = bookingDraft ?? bookingSettings;

  // Focused item selection states per section (keeps UI clean & minimal)
  const [selectedHeroSlideIdx, setSelectedHeroSlideIdx] = useState<number>(0);
  const [selectedReviewId, setSelectedReviewId] = useState<string>('');
  const [selectedDestId, setSelectedDestId] = useState<string>('');
  const [selectedTourId, setSelectedTourId] = useState<string>('');
  const [tourCategoryFilter, setTourCategoryFilter] = useState<string>('all');
  const [tourSearch, setTourSearch] = useState<string>('');
  const [selectedFaqId, setSelectedFaqId] = useState<string>('');
  const [selectedStayId, setSelectedStayId] = useState<string>('');
  const [selectedPhotoId, setSelectedPhotoId] = useState<string>('');

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
  const [enquiryMethodFilter, setEnquiryMethodFilter] =
    useState<string>('all');
  const [showManualBookingForm, setShowManualBookingForm] =
    useState<boolean>(false);
  const [manualBooking, setManualBooking] = useState<{
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
    bookingMethod: 'manual',
    selectedPackage: 'Custom Tailor-Made Journey',
    arrival: '',
    guests: '2 travellers (Couple / Friends)',
    duration: '7–8 days',
    style: 'Balanced island discovery',
    message: '',
  });

  const handleFirebaseSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setStatusBanner(
        'Signed in to Firebase Admin. All section edits & R2 images sync directly with Firestore.'
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
          'Section changes applied and synced to Firebase Firestore.'
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
    if (
      !imageUrl ||
      imageUrl.includes('images.unsplash.com') ||
      imageUrl.startsWith('/images/')
    ) {
      return;
    }
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
      // Ignore if external URL
    }
  };

  const handleR2ObjectRenamed = async (
    oldCdnUrl: string,
    newCdnUrl: string,
    item: R2UploadedItemMeta
  ) => {
    await registerR2MediaInFirebase(item);
    const currentHeroImgs =
      Array.isArray(workingCms.general.heroImages) &&
      workingCms.general.heroImages.length > 0
        ? workingCms.general.heroImages
        : DEFAULT_HERO_IMAGES;
    const next: SiteCmsData = {
      ...workingCms,
      general: {
        ...workingCms.general,
        heroImages: currentHeroImgs.map((u) =>
          u === oldCdnUrl ? newCdnUrl : u
        ),
      },
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
      reviews: workingCms.reviews.map((r) =>
        r.image === oldCdnUrl ? { ...r, image: newCdnUrl } : r
      ),
    };
    setCmsDraft(next);
    await saveCmsChanges(
      next,
      'R2 object renamed and all matching Firebase CDN links updated.'
    );
  };

  const handleQuickAssignFromR2Bucket = async (
    target: R2QuickAssignTarget,
    cdnUrl: string,
    item: R2UploadedItemMeta
  ) => {
    await registerR2MediaInFirebase(item);
    const currentHeroImgs =
      Array.isArray(workingCms.general.heroImages) &&
      workingCms.general.heroImages.length > 0
        ? workingCms.general.heroImages
        : DEFAULT_HERO_IMAGES;

    let next: SiteCmsData = { ...workingCms };
    let msg = 'Assigned R2 image and saved to Firebase Firestore.';

    if (target.type === 'hero_add') {
      next = {
        ...workingCms,
        general: {
          ...workingCms.general,
          heroImages: [...currentHeroImgs, cdnUrl],
        },
      };
      msg = 'Added R2 image to Hero 4-Second Slideshow and saved to Firestore.';
    } else if (target.type === 'gallery_add') {
      const newPhoto: CmsGalleryPhoto = {
        id: `photo-${Date.now()}`,
        title: item.fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        location: 'Sri Lanka',
        category: 'culture',
        categoryLabel: 'Culture & Heritage',
        image: cdnUrl,
        description: 'Captured on a private Bimondo Travels journey.',
      };
      next = {
        ...workingCms,
        gallery: [newPhoto, ...workingCms.gallery],
      };
      msg = 'Added R2 image to Visual Gallery and saved to Firestore.';
    } else if (target.type === 'tour') {
      next = {
        ...workingCms,
        tours: workingCms.tours.map((t) =>
          t.id === target.id ? { ...t, image: cdnUrl } : t
        ),
      };
      msg = 'Assigned R2 image to Tour and saved to Firestore.';
    } else if (target.type === 'stay') {
      next = {
        ...workingCms,
        stays: workingCms.stays.map((s) =>
          s.id === target.id ? { ...s, image: cdnUrl } : s
        ),
      };
      msg = 'Assigned R2 image to Boutique Stay and saved to Firestore.';
    } else if (target.type === 'destination') {
      next = {
        ...workingCms,
        destinations: workingCms.destinations.map((d) =>
          d.id === target.id ? { ...d, image: cdnUrl } : d
        ),
      };
      msg = 'Assigned R2 image to Destination and saved to Firestore.';
    } else if (target.type === 'review') {
      next = {
        ...workingCms,
        reviews: workingCms.reviews.map((r) =>
          r.id === target.id ? { ...r, image: cdnUrl } : r
        ),
      };
      msg = 'Assigned R2 portrait to Tourist Thought card and saved to Firestore.';
    }

    setCmsDraft(next);
    await saveCmsChanges(next, msg);
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

  // --- CRUD Helpers for Hero Section 4-Second Slideshow Images ---
  const heroSlidesList: string[] =
    Array.isArray(workingCms.general.heroImages) &&
    workingCms.general.heroImages.length > 0
      ? workingCms.general.heroImages
      : DEFAULT_HERO_IMAGES;

  const safeHeroIdx = Math.min(
    selectedHeroSlideIdx,
    Math.max(0, heroSlidesList.length - 1)
  );

  const addHeroSlide = () => {
    const nextSlides = [
      ...heroSlidesList,
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=85',
    ];
    setCmsDraft({
      ...workingCms,
      general: {
        ...workingCms.general,
        heroImages: nextSlides,
      },
    });
    setSelectedHeroSlideIdx(nextSlides.length - 1);
  };

  const updateHeroSlide = (index: number, nextUrl: string) => {
    const nextSlides = heroSlidesList.map((url, idx) =>
      idx === index ? nextUrl : url
    );
    setCmsDraft({
      ...workingCms,
      general: {
        ...workingCms.general,
        heroImages: nextSlides,
      },
    });
  };

  const moveHeroSlide = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= heroSlidesList.length) return;
    const nextSlides = [...heroSlidesList];
    const temp = nextSlides[index];
    nextSlides[index] = nextSlides[targetIdx];
    nextSlides[targetIdx] = temp;
    setCmsDraft({
      ...workingCms,
      general: {
        ...workingCms.general,
        heroImages: nextSlides,
      },
    });
    setSelectedHeroSlideIdx(targetIdx);
  };

  const removeHeroSlide = async (index: number) => {
    if (heroSlidesList.length <= 1) {
      setStatusBanner('At least 1 Hero slideshow image is required.');
      return;
    }
    const targetUrl = heroSlidesList[index];
    if (targetUrl) {
      await deleteR2ObjectByUrlIfPossible(targetUrl);
    }
    const nextSlides = heroSlidesList.filter((_, idx) => idx !== index);
    const next: SiteCmsData = {
      ...workingCms,
      general: {
        ...workingCms.general,
        heroImages: nextSlides,
      },
    };
    setCmsDraft(next);
    setSelectedHeroSlideIdx(Math.max(0, index - 1));
    await saveCmsChanges(
      next,
      'Hero slideshow image removed and synced to Firestore.'
    );
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
    setSelectedTourId(newTour.id);
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
    const remaining = workingCms.tours.filter((t) => t.id !== id);
    const next = {
      ...workingCms,
      tours: remaining,
    };
    setCmsDraft(next);
    if (selectedTourId === id) {
      setSelectedTourId(remaining[0]?.id || '');
    }
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
    setSelectedStayId(newStay.id);
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
    const remaining = workingCms.stays.filter((s) => s.id !== id);
    const next = {
      ...workingCms,
      stays: remaining,
    };
    setCmsDraft(next);
    if (selectedStayId === id) {
      setSelectedStayId(remaining[0]?.id || '');
    }
    await saveCmsChanges(next, 'Boutique stay & associated R2 image removed.');
  };

  // --- CRUD Helpers for Destinations ---
  const addDestination = () => {
    const newDest: CmsDestination = {
      id: `dest-${Date.now()}`,
      name: 'New Sri Lanka Region',
      region: 'culture',
      regionLabel: 'Culture and Heritage',
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
      staggerVariant: 'mid-up',
    };
    setCmsDraft({
      ...workingCms,
      destinations: [newDest, ...workingCms.destinations],
    });
    setSelectedDestId(newDest.id);
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
    const remaining = workingCms.destinations.filter((d) => d.id !== id);
    const next = {
      ...workingCms,
      destinations: remaining,
    };
    setCmsDraft(next);
    if (selectedDestId === id) {
      setSelectedDestId(remaining[0]?.id || '');
    }
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
    setSelectedPhotoId(newPhoto.id);
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
    const remaining = workingCms.gallery.filter((g) => g.id !== id);
    const next = {
      ...workingCms,
      gallery: remaining,
    };
    setCmsDraft(next);
    if (selectedPhotoId === id) {
      setSelectedPhotoId(remaining[0]?.id || '');
    }
    await saveCmsChanges(next, 'Gallery photo & associated R2 image removed.');
  };

  // --- CRUD Helpers for Guest Reviews (Tourist Thoughts) & FAQs ---
  const addReview = () => {
    const newRev: CmsReviewItem = {
      id: `thought-${Date.now()}`,
      name: 'New Traveller Name',
      location: 'United Kingdom',
      rating: 5,
      tour: 'Grand Island Journey',
      date: 'Visited 2026',
      quote:
        '“An unforgettable private journey through Sri Lanka with warm local care from start to finish.”',
      image:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    };
    setCmsDraft({
      ...workingCms,
      reviews: [newRev, ...workingCms.reviews],
    });
    setSelectedReviewId(newRev.id);
  };

  const updateReview = (id: string, patch: Partial<CmsReviewItem>) => {
    setCmsDraft({
      ...workingCms,
      reviews: workingCms.reviews.map((r) =>
        r.id === id ? { ...r, ...patch } : r
      ),
    });
  };

  const deleteReview = async (id: string) => {
    const target = workingCms.reviews.find((r) => r.id === id);
    if (target?.image) {
      await deleteR2ObjectByUrlIfPossible(target.image);
    }
    const remaining = workingCms.reviews.filter((r) => r.id !== id);
    const next = {
      ...workingCms,
      reviews: remaining,
    };
    setCmsDraft(next);
    if (selectedReviewId === id) {
      setSelectedReviewId(remaining[0]?.id || '');
    }
    await saveCmsChanges(
      next,
      'Tourist thought card & associated R2 avatar image removed.'
    );
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
    setSelectedFaqId(newFaq.id);
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
    const remaining = workingCms.faqs.filter((f) => f.id !== id);
    const next = {
      ...workingCms,
      faqs: remaining,
    };
    setCmsDraft(next);
    if (selectedFaqId === id) {
      setSelectedFaqId(remaining[0]?.id || '');
    }
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

  // Section-organized navigation
  const websiteSectionTabs: {
    id: AdminTabId;
    num: string;
    label: string;
    anchor: string;
    badge?: string | number;
  }[] = [
    {
      id: 'sec_hero',
      num: '01',
      label: 'Hero Section',
      anchor: '#home',
      badge: `${heroSlidesList.length} Slides`,
    },
    {
      id: 'sec_thoughts',
      num: '02',
      label: 'Tourist Thoughts',
      anchor: '#why',
      badge: workingCms.reviews.length,
    },
    {
      id: 'sec_places',
      num: '03',
      label: 'Places Slider',
      anchor: '#places',
      badge: workingCms.destinations.length,
    },
    {
      id: 'sec_tours',
      num: '04',
      label: 'Signature Tours',
      anchor: '#packages',
      badge: workingCms.tours.length,
    },
    {
      id: 'sec_faqs',
      num: '05',
      label: 'Planning FAQs',
      anchor: '#planning-faq',
      badge: workingCms.faqs.length,
    },
    {
      id: 'sec_stays',
      num: '06',
      label: 'Boutique Stays',
      anchor: '/accommodations',
      badge: workingCms.stays.length,
    },
    {
      id: 'sec_gallery',
      num: '07',
      label: 'Photo Gallery',
      anchor: '/gallery',
      badge: workingCms.gallery.length,
    },
    {
      id: 'sec_brand',
      num: '08',
      label: 'Brand & Contact',
      anchor: 'Footer',
    },
  ];

  const systemTabs: {
    id: AdminTabId;
    label: string;
    badge?: string | number;
  }[] = [
    {
      id: 'r2_storage',
      label: 'Cloudflare R2 Media',
      badge: 'R2 CDN',
    },
    {
      id: 'enquiries',
      label: 'Customer Enquiries',
      badge:
        newEnquiriesCount > 0
          ? `${newEnquiriesCount} NEW`
          : workingCms.enquiries.length,
    },
    {
      id: 'booking',
      label: 'Booking Engines',
      badge: '3 Providers',
    },
  ];

  // Active selected items with safe fallbacks
  const activeReview =
    workingCms.reviews.find((r) => r.id === selectedReviewId) ||
    workingCms.reviews[0];
  const activeDest =
    workingCms.destinations.find((d) => d.id === selectedDestId) ||
    workingCms.destinations[0];

  const filteredTours = workingCms.tours.filter((t) => {
    const matchCat =
      tourCategoryFilter === 'all' || t.category === tourCategoryFilter;
    const matchSearch =
      !tourSearch.trim() ||
      t.name.toLowerCase().includes(tourSearch.toLowerCase()) ||
      t.route.toLowerCase().includes(tourSearch.toLowerCase());
    return matchCat && matchSearch;
  });
  const activeTour =
    filteredTours.find((t) => t.id === selectedTourId) ||
    filteredTours[0] ||
    workingCms.tours[0];

  const activeFaq =
    workingCms.faqs.find((f) => f.id === selectedFaqId) ||
    workingCms.faqs[0];
  const activeStay =
    workingCms.stays.find((s) => s.id === selectedStayId) ||
    workingCms.stays[0];
  const activePhoto =
    workingCms.gallery.find((g) => g.id === selectedPhotoId) ||
    workingCms.gallery[0];

  const resolveEnquiryMethod = (
    enq: CmsCustomerEnquiry
  ): BookingSubmissionMethod => {
    if (enq.bookingMethod) return enq.bookingMethod;
    const s = (enq.style || '').toUpperCase();
    if (s.startsWith('[WHATSAPP]')) return 'whatsapp';
    if (s.startsWith('[EMAIL]')) return 'email';
    if (s.startsWith('[CALLBACK]')) return 'callback';
    if (s.startsWith('[MANUAL]')) return 'manual';
    return 'direct_admin';
  };

  const formatMethodLabel = (method: BookingSubmissionMethod): string => {
    switch (method) {
      case 'whatsapp':
        return 'WHATSAPP CONCIERGE';
      case 'email':
        return 'EMAIL QUOTE';
      case 'callback':
        return 'PHONE CALLBACK';
      case 'manual':
        return 'MANUAL DESK';
      default:
        return 'DIRECT ADMIN';
    }
  };

  const filteredEnquiries = workingCms.enquiries.filter((e) => {
    const matchStatus = enquiryFilter === 'all' || e.status === enquiryFilter;
    const method = resolveEnquiryMethod(e);
    const matchMethod =
      enquiryMethodFilter === 'all' || method === enquiryMethodFilter;
    return matchStatus && matchMethod;
  });

  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await submitCustomerEnquiryToFirebase(manualBooking);
      setManualBooking({
        name: '',
        email: '',
        phone: '',
        bookingMethod: 'manual',
        selectedPackage: 'Custom Tailor-Made Journey',
        arrival: '',
        guests: '2 travellers (Couple / Friends)',
        duration: '7–8 days',
        style: 'Balanced island discovery',
        message: '',
      });
      setShowManualBookingForm(false);
      setCmsDraft(null);
      await refreshCms();
      setStatusBanner(
        'Booking logged into Admin Panel & synced to Firebase Firestore.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="admin-control-center">
      <PageBanner
        eyebrow="BIMONDO TRAVELS  /  SECTION-BY-SECTION CMS (/ADMIN)"
        title="Edit Website Sections, Images & Text"
      />

      <section className="section wrap" style={{ paddingTop: '32px' }}>
        {/* Clean Top Quick-Jump Section Bar */}
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '14px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'var(--muted)',
                marginRight: '6px',
              }}
            >
              JUMP TO SECTION:
            </span>
            {websiteSectionTabs.map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveTab(sec.id)}
                className={`pill ${activeTab === sec.id ? 'dark' : ''}`}
                style={{
                  padding: '6px 12px',
                  minHeight: '30px',
                  fontSize: '11px',
                }}
              >
                {sec.num}. {sec.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="pill dark"
              disabled={saving}
              onClick={() =>
                saveCmsChanges(
                  undefined,
                  'All website section text & R2 images saved to Firebase Firestore.'
                )
              }
              style={{
                padding: '7px 16px',
                minHeight: '34px',
                fontSize: '11px',
              }}
            >
              {saving ? 'SAVING…' : 'APPLY & SAVE CHANGES'}
            </button>
          </div>
        </div>

        {statusBanner && (
          <div
            className="admin-save-banner"
            role="status"
            style={{
              marginBottom: '20px',
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
          {/* LEFT SIDEBAR NAVIGATION ORGANIZED BY WEBSITE SECTIONS */}
          <aside className="admin-sidebar" aria-label="Admin Navigation">
            <div className="admin-sidebar-header" style={{ paddingBottom: '10px' }}>
              <span className="eyebrow" style={{ color: 'var(--terracotta)' }}>
                WEBSITE SECTIONS
              </span>
              <h2 className="serif" style={{ fontSize: '22px' }}>
                Edit by Section
              </h2>
            </div>

            <nav className="admin-nav-list">
              {websiteSectionTabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`admin-nav-btn ${
                    activeTab === item.id ? 'active' : ''
                  }`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <span>
                    <strong style={{ opacity: 0.55, marginRight: '6px' }}>
                      {item.num}
                    </strong>
                    {item.label}
                  </span>
                  {item.badge !== undefined && (
                    <small className="admin-nav-badge">{item.badge}</small>
                  )}
                </button>
              ))}
            </nav>

            <div
              style={{
                margin: '16px 0 8px',
                paddingTop: '14px',
                borderTop: '1px solid var(--line)',
              }}
            >
              <span
                className="eyebrow"
                style={{
                  color: 'var(--muted)',
                  fontSize: '10px',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                STORAGE &amp; OPERATIONS
              </span>
              <div className="admin-nav-list">
                {systemTabs.map((item) => (
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
              </div>
            </div>

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
                  FIREBASE + R2 SYNC
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
                      Sign out
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
                    SIGN IN WITH GOOGLE
                  </button>
                )}
              </div>

              <p
                style={{
                  fontSize: '11px',
                  color: 'var(--muted)',
                  margin: '0 0 10px',
                }}
              >
                Synced: {formatDeterministicTime(workingCms.updatedAt)}
              </p>
              <div style={{ display: 'grid', gap: '6px' }}>
                <Link
                  href="/"
                  prefetch={false}
                  className="pill"
                  style={{ justifyContent: 'center', fontSize: '10.5px' }}
                >
                  VIEW LIVE SITE ↗
                </Link>
              </div>
            </div>
          </aside>

          {/* MAIN SECTION EDITOR WORKSPACE */}
          <div className="admin-main-panel">
            {/* ============================================================== */}
            {/* SECTION 01: HERO SECTION (#HOME) — TEXT, SLIDESHOW & RATING    */}
            {/* ============================================================== */}
            {activeTab === 'sec_hero' && (
              <div style={{ display: 'grid', gap: '20px' }}>
                {/* 1A. Hero Section Text & Copy */}
                <div className="admin-assignments-card">
                  <div className="section-head" style={{ marginBottom: '16px' }}>
                    <div>
                      <span
                        className="eyebrow"
                        style={{ color: 'var(--terracotta)' }}
                      >
                        SECTION 01 · HOMEPAGE HERO (#HOME)
                      </span>
                      <h3
                        className="serif"
                        style={{ fontSize: '26px', margin: '4px 0 0' }}
                      >
                        Hero Text, 4s Slideshow Images &amp; Frosted Rating Card
                      </h3>
                    </div>
                    <button
                      type="button"
                      className="pill dark"
                      disabled={saving}
                      onClick={() =>
                        saveCmsChanges(
                          undefined,
                          'Hero section text, slideshow images & rating badge saved.'
                        )
                      }
                    >
                      {saving ? 'SAVING…' : 'APPLY HERO CHANGES'}
                    </button>
                  </div>

                  <div className="admin-form-grid-2">
                    <div className="admin-field">
                      <label>HERO EYEBROW / BRAND TITLE</label>
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
                      <label>ESTABLISHED YEAR SHOWN IN HERO</label>
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
                      />
                    </div>
                  </div>

                  <div className="admin-field" style={{ marginBottom: 0 }}>
                    <label>HERO SUBTITLE PARAGRAPH (#HOME)</label>
                    <textarea
                      rows={2}
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
                </div>

                {/* 1B. Hero 4-Second Background Slideshow Images (Compact Selector + Active Slide Editor) */}
                <div className="admin-assignments-card">
                  <div className="section-head" style={{ marginBottom: '14px' }}>
                    <div>
                      <span
                        className="eyebrow"
                        style={{ color: 'var(--terracotta)' }}
                      >
                        HERO BACKGROUND SLIDESHOW (4-SECOND INTERVAL)
                      </span>
                      <h4
                        className="serif"
                        style={{ fontSize: '22px', margin: '2px 0 0' }}
                      >
                        Select a Slide to Edit or Upload ({heroSlidesList.length}{' '}
                        Slides)
                      </h4>
                    </div>
                    <button
                      type="button"
                      className="pill"
                      onClick={addHeroSlide}
                    >
                      + ADD SLIDE IMAGE
                    </button>
                  </div>

                  {/* Visual Thumbnail Strip of Slides */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fill, minmax(150px, 1fr))',
                      gap: '10px',
                      marginBottom: '18px',
                    }}
                  >
                    {heroSlidesList.map((url, idx) => {
                      const isSelected = idx === safeHeroIdx;
                      return (
                        <button
                          key={`hero-thumb-${idx}`}
                          type="button"
                          onClick={() => setSelectedHeroSlideIdx(idx)}
                          style={{
                            padding: '6px',
                            borderRadius: '10px',
                            border: isSelected
                              ? '2px solid var(--green)'
                              : '1px solid var(--line)',
                            background: isSelected
                              ? 'rgba(29,60,46,0.06)'
                              : '#fff',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <div
                            style={{
                              position: 'relative',
                              width: '100%',
                              height: '82px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              marginBottom: '6px',
                            }}
                          >
                            <AdminThumb
                              src={url}
                              alt={`Hero Slide ${idx + 1}`}
                            />
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '11px',
                              fontWeight: 700,
                            }}
                          >
                            <span>Slide #{idx + 1}</span>
                            {idx === 0 && (
                              <span
                                style={{
                                  fontSize: '9.5px',
                                  color: 'var(--green)',
                                }}
                              >
                                Initial
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Focused Editor for the Selected Hero Slide */}
                  {heroSlidesList[safeHeroIdx] !== undefined && (
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: 'var(--bg-elev)',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        <strong>
                          Editing Hero Slide #{safeHeroIdx + 1} of{' '}
                          {heroSlidesList.length}
                        </strong>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="pill"
                            style={{
                              padding: '5px 10px',
                              minHeight: '28px',
                              fontSize: '10px',
                            }}
                            disabled={safeHeroIdx === 0}
                            onClick={() => moveHeroSlide(safeHeroIdx, 'up')}
                          >
                            ← Move Earlier
                          </button>
                          <button
                            type="button"
                            className="pill"
                            style={{
                              padding: '5px 10px',
                              minHeight: '28px',
                              fontSize: '10px',
                            }}
                            disabled={
                              safeHeroIdx === heroSlidesList.length - 1
                            }
                            onClick={() => moveHeroSlide(safeHeroIdx, 'down')}
                          >
                            Move Later →
                          </button>
                          <button
                            type="button"
                            className="pill"
                            style={{
                              padding: '5px 10px',
                              minHeight: '28px',
                              fontSize: '10px',
                              color: '#b42318',
                            }}
                            disabled={heroSlidesList.length <= 1}
                            onClick={() => removeHeroSlide(safeHeroIdx)}
                          >
                            Delete Slide
                          </button>
                        </div>
                      </div>

                      <AdminImageUploadField
                        label={`HERO SLIDE #${safeHeroIdx + 1} IMAGE (UPLOAD OR SELECT FROM R2 BUCKET)`}
                        folder="general"
                        value={heroSlidesList[safeHeroIdx]}
                        onChange={(nextUrl) =>
                          updateHeroSlide(safeHeroIdx, nextUrl)
                        }
                        onR2Uploaded={async (item) => {
                          await registerR2MediaInFirebase(item);
                          const updatedSlides = heroSlidesList.map((u, i) =>
                            i === safeHeroIdx ? item.cdnUrl : u
                          );
                          const nextCms: SiteCmsData = {
                            ...workingCms,
                            general: {
                              ...workingCms.general,
                              heroImages: updatedSlides,
                            },
                          };
                          setCmsDraft(nextCms);
                          await saveCmsChanges(
                            nextCms,
                            `Hero Slide #${safeHeroIdx + 1} updated and saved to Firestore.`
                          );
                        }}
                        onR2Deleted={async (_, mediaDocId) => {
                          await removeR2MediaFromFirebase(mediaDocId);
                        }}
                        onOpenR2Settings={() => setActiveTab('r2_storage')}
                      />
                    </div>
                  )}
                </div>

                {/* 1C. Bottom-Right Frosted Glass Rating Badge */}
                <div className="admin-assignments-card">
                  <div className="section-head" style={{ marginBottom: '14px' }}>
                    <div>
                      <span
                        className="eyebrow"
                        style={{ color: 'var(--terracotta)' }}
                      >
                        HERO BOTTOM-RIGHT FROSTED RATING CARD
                      </span>
                      <h4
                        className="serif"
                        style={{ fontSize: '22px', margin: '2px 0 0' }}
                      >
                        Tripadvisor / Govaisor Frosted Card
                      </h4>
                    </div>
                    <label className="booking-private-toggle">
                      <input
                        type="checkbox"
                        checked={
                          workingCms.general.tripadvisorEnabled !== false
                        }
                        onChange={(e) =>
                          setCmsDraft({
                            ...workingCms,
                            general: {
                              ...workingCms.general,
                              tripadvisorEnabled: e.target.checked,
                            },
                          })
                        }
                      />
                      <span>
                        {workingCms.general.tripadvisorEnabled !== false
                          ? 'Visible on Hero'
                          : 'Hidden'}
                      </span>
                    </label>
                  </div>

                  <div className="admin-form-grid-3">
                    <div className="admin-field" style={{ marginBottom: 0 }}>
                      <label>PLATFORM NAME</label>
                      <input
                        type="text"
                        value={
                          workingCms.general.tripadvisorBrand ?? 'Tripadvisor'
                        }
                        onChange={(e) =>
                          setCmsDraft({
                            ...workingCms,
                            general: {
                              ...workingCms.general,
                              tripadvisorBrand: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="admin-field" style={{ marginBottom: 0 }}>
                      <label>SCORE</label>
                      <input
                        type="text"
                        value={workingCms.general.tripadvisorRating ?? '5.0'}
                        onChange={(e) =>
                          setCmsDraft({
                            ...workingCms,
                            general: {
                              ...workingCms.general,
                              tripadvisorRating: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="admin-field" style={{ marginBottom: 0 }}>
                      <label>REVIEWS SUBTITLE</label>
                      <input
                        type="text"
                        value={
                          workingCms.general.tripadvisorReviewsText ??
                          'Based on 165 reviews'
                        }
                        onChange={(e) =>
                          setCmsDraft({
                            ...workingCms,
                            general: {
                              ...workingCms.general,
                              tripadvisorReviewsText: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* SECTION 02: TOURIST THOUGHTS SECTION (#WHY)                    */}
            {/* ============================================================== */}
            {activeTab === 'sec_thoughts' && (
              <div className="admin-assignments-card">
                <div className="section-head" style={{ marginBottom: '18px' }}>
                  <div>
                    <span
                      className="eyebrow"
                      style={{ color: 'var(--terracotta)' }}
                    >
                      SECTION 02 · TOURIST THOUGHTS (#WHY)
                    </span>
                    <h3
                      className="serif"
                      style={{ fontSize: '26px', margin: '4px 0 0' }}
                    >
                      Tourist Thought Cards ({workingCms.reviews.length})
                    </h3>
                    <p
                      style={{
                        fontSize: '12.5px',
                        color: 'var(--muted)',
                        margin: '4px 0 0',
                      }}
                    >
                      Click any guest card below to edit its portrait image,
                      name, country, journey, and quote.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button type="button" className="pill" onClick={addReview}>
                      + ADD GUEST CARD
                    </button>
                    <button
                      type="button"
                      className="pill dark"
                      disabled={saving}
                      onClick={() =>
                        saveCmsChanges(
                          undefined,
                          'Tourist Thoughts section saved to Firestore.'
                        )
                      }
                    >
                      {saving ? 'SAVING…' : 'APPLY CHANGES'}
                    </button>
                  </div>
                </div>

                {/* Compact Card Selector Strip */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '10px',
                    marginBottom: '20px',
                  }}
                >
                  {workingCms.reviews.map((rev) => {
                    const isSelected = activeReview?.id === rev.id;
                    return (
                      <button
                        key={rev.id}
                        type="button"
                        onClick={() => setSelectedReviewId(rev.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px',
                          borderRadius: '12px',
                          border: isSelected
                            ? '2px solid var(--green)'
                            : '1px solid var(--line)',
                          background: isSelected
                            ? 'rgba(29,60,46,0.06)'
                            : '#fff',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div
                          style={{
                            position: 'relative',
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          <AdminThumb src={rev.image} alt={rev.name} />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <strong
                            style={{
                              display: 'block',
                              fontSize: '12.5px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {rev.name}
                          </strong>
                          <span
                            style={{
                              fontSize: '11px',
                              color: 'var(--muted)',
                              display: 'block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {rev.location} · {rev.tour}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Focused Editor for Selected Guest Card */}
                {activeReview && (
                  <div
                    className="admin-item-editor-card"
                    style={{ background: 'var(--bg-elev)' }}
                  >
                    <div className="admin-item-editor-top">
                      <div>
                        <span className="admin-type-pill">
                          EDITING GUEST CARD
                        </span>
                        <h4
                          className="serif"
                          style={{ fontSize: '22px', margin: '4px 0 0' }}
                        >
                          {activeReview.name}
                        </h4>
                      </div>
                      <button
                        type="button"
                        className="pill"
                        style={{
                          padding: '5px 12px',
                          minHeight: '30px',
                          fontSize: '10.5px',
                          color: '#b42318',
                        }}
                        onClick={() => deleteReview(activeReview.id)}
                      >
                        Delete Card
                      </button>
                    </div>

                    <div className="admin-form-grid-2">
                      <div className="admin-field">
                        <label>GUEST NAME &amp; COUNTRY</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="Guest Name"
                            value={activeReview.name}
                            onChange={(e) =>
                              updateReview(activeReview.id, {
                                name: e.target.value,
                              })
                            }
                            style={{ flex: 1 }}
                          />
                          <input
                            type="text"
                            placeholder="Country"
                            value={activeReview.location}
                            onChange={(e) =>
                              updateReview(activeReview.id, {
                                location: e.target.value,
                              })
                            }
                            style={{ width: '150px' }}
                          />
                        </div>
                      </div>

                      <div className="admin-field">
                        <label>JOURNEY TITLE &amp; VISIT YEAR</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="Journey Name"
                            value={activeReview.tour}
                            onChange={(e) =>
                              updateReview(activeReview.id, {
                                tour: e.target.value,
                              })
                            }
                            style={{ flex: 1 }}
                          />
                          <input
                            type="text"
                            placeholder="Visited 2026"
                            value={activeReview.date}
                            onChange={(e) =>
                              updateReview(activeReview.id, {
                                date: e.target.value,
                              })
                            }
                            style={{ width: '130px' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="admin-field">
                      <label>GUEST QUOTE / THOUGHT TEXT</label>
                      <textarea
                        rows={3}
                        value={activeReview.quote}
                        onChange={(e) =>
                          updateReview(activeReview.id, {
                            quote: e.target.value,
                          })
                        }
                      />
                    </div>

                    <AdminImageUploadField
                      label="GUEST PORTRAIT PHOTO (UPLOAD OR SELECT FROM R2 BUCKET)"
                      value={activeReview.image || ''}
                      folder="general"
                      onChange={(nextUrl) =>
                        updateReview(activeReview.id, { image: nextUrl })
                      }
                      onR2Uploaded={async (item) => {
                        await registerR2MediaInFirebase(item);
                        const nextCms: SiteCmsData = {
                          ...workingCms,
                          reviews: workingCms.reviews.map((r) =>
                            r.id === activeReview.id
                              ? { ...r, image: item.cdnUrl }
                              : r
                          ),
                        };
                        setCmsDraft(nextCms);
                        await saveCmsChanges(
                          nextCms,
                          `Guest portrait for "${activeReview.name}" saved to Firestore.`
                        );
                      }}
                      onR2Deleted={(_, docId) =>
                        removeR2MediaFromFirebase(docId)
                      }
                      onOpenR2Settings={() => setActiveTab('r2_storage')}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* SECTION 03: PLACES STAGGERED SLIDER (#PLACES & /DESTINATIONS)  */}
            {/* ============================================================== */}
            {activeTab === 'sec_places' && (
              <div className="admin-assignments-card">
                <div className="section-head" style={{ marginBottom: '18px' }}>
                  <div>
                    <span
                      className="eyebrow"
                      style={{ color: 'var(--terracotta)' }}
                    >
                      SECTION 03 · STAGGERED PLACES SLIDER (#PLACES &amp; /DESTINATIONS)
                    </span>
                    <h3
                      className="serif"
                      style={{ fontSize: '26px', margin: '4px 0 0' }}
                    >
                      Places Slider &amp; Regional Destinations (
                      {workingCms.destinations.length})
                    </h3>
                    <p
                      style={{
                        fontSize: '12.5px',
                        color: 'var(--muted)',
                        margin: '4px 0 0',
                      }}
                    >
                      Click any slide card below to edit its photo, title,
                      staggered card height, and regional details.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="pill"
                      onClick={addDestination}
                    >
                      + ADD PLACE SLIDE
                    </button>
                    <button
                      type="button"
                      className="pill dark"
                      disabled={saving}
                      onClick={() =>
                        saveCmsChanges(
                          undefined,
                          'Places slider & destinations saved to Firestore.'
                        )
                      }
                    >
                      {saving ? 'SAVING…' : 'APPLY CHANGES'}
                    </button>
                  </div>
                </div>

                {/* Visual Thumbnail Selector Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: '10px',
                    marginBottom: '20px',
                  }}
                >
                  {workingCms.destinations.map((dest) => {
                    const isSelected = activeDest?.id === dest.id;
                    return (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => setSelectedDestId(dest.id)}
                        style={{
                          padding: '6px',
                          borderRadius: '10px',
                          border: isSelected
                            ? '2px solid var(--green)'
                            : '1px solid var(--line)',
                          background: isSelected
                            ? 'rgba(29,60,46,0.06)'
                            : '#fff',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div
                          style={{
                            position: 'relative',
                            width: '100%',
                            height: '86px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            marginBottom: '6px',
                          }}
                        >
                          <AdminThumb src={dest.image} alt={dest.name} />
                        </div>
                        <strong
                          style={{
                            fontSize: '12px',
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {dest.name.split(',')[0]}
                        </strong>
                        <span
                          style={{
                            fontSize: '10.5px',
                            color: 'var(--muted)',
                            display: 'block',
                          }}
                        >
                          {dest.regionLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Focused Editor for Selected Place Slide */}
                {activeDest && (
                  <div
                    className="admin-item-editor-card"
                    style={{ background: 'var(--bg-elev)' }}
                  >
                    <div className="admin-item-editor-top">
                      <div>
                        <span className="admin-type-pill">
                          {activeDest.regionLabel} · SLIDER HEIGHT:{' '}
                          {(activeDest.staggerVariant || 'mid-up').toUpperCase()}
                        </span>
                        <h4
                          className="serif"
                          style={{ fontSize: '22px', margin: '4px 0 0' }}
                        >
                          {activeDest.name}
                        </h4>
                      </div>
                      <button
                        type="button"
                        className="pill"
                        style={{
                          padding: '5px 12px',
                          minHeight: '30px',
                          fontSize: '10.5px',
                          color: '#b42318',
                        }}
                        onClick={() => deleteDestination(activeDest.id)}
                      >
                        Delete Slide
                      </button>
                    </div>

                    <div className="admin-form-grid-2">
                      <div className="admin-field">
                        <label>DESTINATION / SLIDE TITLE</label>
                        <input
                          type="text"
                          value={activeDest.name}
                          onChange={(e) =>
                            updateDestination(activeDest.id, {
                              name: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="admin-field">
                        <label>REGION &amp; SLIDER CARD HEIGHT</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select
                            value={activeDest.region}
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
                              updateDestination(activeDest.id, {
                                region: r,
                                regionLabel: labels[r],
                              });
                            }}
                            style={{ flex: 1 }}
                          >
                            <option value="culture">Culture &amp; Heritage</option>
                            <option value="hills">Hill Country &amp; Hiking</option>
                            <option value="coast">Sea &amp; Sand</option>
                            <option value="wildlife">Wildlife &amp; Nature</option>
                            <option value="colombo">Colombo &amp; Battaramulla</option>
                          </select>
                          <select
                            value={activeDest.staggerVariant || 'mid-up'}
                            onChange={(e) =>
                              updateDestination(activeDest.id, {
                                staggerVariant: e.target
                                  .value as StaggerSlideVariant,
                              })
                            }
                            style={{ width: '165px' }}
                          >
                            <option value="tall-up">Tall — Shifted Up</option>
                            <option value="low-down">Medium — Shifted Down</option>
                            <option value="mid-up">Balanced — Shifted Up</option>
                            <option value="compact-mid">Compact — Centered</option>
                            <option value="tall-deep">Extra Tall — Deep</option>
                          </select>
                        </div>
                      </div>

                      <div className="admin-field">
                        <label>TAGLINE</label>
                        <input
                          type="text"
                          value={activeDest.tagline}
                          onChange={(e) =>
                            updateDestination(activeDest.id, {
                              tagline: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="admin-field">
                        <label>BEST SEASON</label>
                        <input
                          type="text"
                          value={activeDest.season}
                          onChange={(e) =>
                            updateDestination(activeDest.id, {
                              season: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <AdminImageUploadField
                      label="SLIDE & DESTINATION IMAGE (UPLOAD OR SELECT FROM R2 BUCKET)"
                      value={activeDest.image}
                      folder="destinations"
                      onChange={(nextUrl) =>
                        updateDestination(activeDest.id, { image: nextUrl })
                      }
                      onR2Uploaded={async (item) => {
                        await registerR2MediaInFirebase(item);
                        const nextCms: SiteCmsData = {
                          ...workingCms,
                          destinations: workingCms.destinations.map((d) =>
                            d.id === activeDest.id
                              ? { ...d, image: item.cdnUrl }
                              : d
                          ),
                        };
                        setCmsDraft(nextCms);
                        await saveCmsChanges(
                          nextCms,
                          `Destination "${activeDest.name}" R2 image saved to Firestore.`
                        );
                      }}
                      onR2Deleted={(_, docId) =>
                        removeR2MediaFromFirebase(docId)
                      }
                      onOpenR2Settings={() => setActiveTab('r2_storage')}
                    />

                    <div className="admin-field">
                      <label>DESCRIPTION</label>
                      <textarea
                        rows={2}
                        value={activeDest.description}
                        onChange={(e) =>
                          updateDestination(activeDest.id, {
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="admin-field" style={{ marginBottom: 0 }}>
                      <label>HIGHLIGHTS (COMMA SEPARATED)</label>
                      <input
                        type="text"
                        value={activeDest.highlights.join(', ')}
                        onChange={(e) =>
                          updateDestination(activeDest.id, {
                            highlights: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* SECTION 04: SIGNATURE TOURS (#PACKAGES & /PACKAGES)            */}
            {/* ============================================================== */}
            {activeTab === 'sec_tours' && (
              <div className="admin-assignments-card">
                <div className="section-head" style={{ marginBottom: '16px' }}>
                  <div>
                    <span
                      className="eyebrow"
                      style={{ color: 'var(--terracotta)' }}
                    >
                      SECTION 04 · SIGNATURE TOURS (#PACKAGES &amp; /PACKAGES)
                    </span>
                    <h3
                      className="serif"
                      style={{ fontSize: '26px', margin: '4px 0 0' }}
                    >
                      Tour Packages ({workingCms.tours.length})
                    </h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button type="button" className="pill" onClick={addTour}>
                      + ADD NEW TOUR
                    </button>
                    <button
                      type="button"
                      className="pill dark"
                      disabled={saving}
                      onClick={() =>
                        saveCmsChanges(
                          undefined,
                          'Signature tours saved to Firestore.'
                        )
                      }
                    >
                      {saving ? 'SAVING…' : 'APPLY CHANGES'}
                    </button>
                  </div>
                </div>

                {/* Category Filter + Search */}
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    marginBottom: '14px',
                  }}
                >
                  {(
                    [
                      ['all', 'All Tours'],
                      ['heritage', 'Culture & Heritage'],
                      ['wildlife', 'Wildlife & Nature'],
                      ['coast', 'Coast & Beach'],
                      ['adventure', 'Adventure'],
                      ['family', 'Family'],
                    ] as const
                  ).map(([catId, catLabel]) => (
                    <button
                      key={catId}
                      type="button"
                      onClick={() => setTourCategoryFilter(catId)}
                      className={`pill ${
                        tourCategoryFilter === catId ? 'dark' : ''
                      }`}
                      style={{
                        padding: '5px 11px',
                        minHeight: '28px',
                        fontSize: '10.5px',
                      }}
                    >
                      {catLabel}
                    </button>
                  ))}
                  <input
                    type="text"
                    placeholder="Search tour name or route…"
                    value={tourSearch}
                    onChange={(e) => setTourSearch(e.target.value)}
                    style={{
                      marginLeft: 'auto',
                      padding: '6px 12px',
                      borderRadius: '999px',
                      border: '1px solid var(--line)',
                      fontSize: '12px',
                      minWidth: '200px',
                    }}
                  />
                </div>

                {/* Compact Tour Selector Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(185px, 1fr))',
                    gap: '8px',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    padding: '4px',
                    marginBottom: '18px',
                    border: '1px solid var(--line)',
                    borderRadius: '12px',
                    background: '#faf8f4',
                  }}
                >
                  {filteredTours.map((tour) => {
                    const isSelected = activeTour?.id === tour.id;
                    return (
                      <button
                        key={tour.id}
                        type="button"
                        onClick={() => setSelectedTourId(tour.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '7px 9px',
                          borderRadius: '8px',
                          border: isSelected
                            ? '2px solid var(--green)'
                            : '1px solid var(--line)',
                          background: isSelected
                            ? 'rgba(29,60,46,0.08)'
                            : '#fff',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div
                          style={{
                            position: 'relative',
                            width: '40px',
                            height: '40px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          <AdminThumb src={tour.image} alt={tour.name} />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <strong
                            style={{
                              fontSize: '11.5px',
                              display: 'block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {tour.name}
                          </strong>
                          <span
                            style={{
                              fontSize: '10px',
                              color: 'var(--muted)',
                              display: 'block',
                            }}
                          >
                            {tour.days} Days · {tour.categoryLabel}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Focused Editor for Selected Tour */}
                {activeTour && (
                  <div
                    className="admin-item-editor-card"
                    style={{ background: 'var(--bg-elev)' }}
                  >
                    <div className="admin-item-editor-top">
                      <div>
                        <span className="admin-type-pill">
                          {activeTour.categoryLabel} · {activeTour.days} DAYS
                        </span>
                        <h4
                          className="serif"
                          style={{ fontSize: '22px', margin: '4px 0 0' }}
                        >
                          {activeTour.name}
                        </h4>
                      </div>
                      <button
                        type="button"
                        className="pill"
                        style={{
                          padding: '5px 12px',
                          minHeight: '30px',
                          fontSize: '10.5px',
                          color: '#b42318',
                        }}
                        onClick={() => deleteTour(activeTour.id)}
                      >
                        Delete Tour
                      </button>
                    </div>

                    <div className="admin-form-grid-2">
                      <div className="admin-field">
                        <label>TOUR NAME</label>
                        <input
                          type="text"
                          value={activeTour.name}
                          onChange={(e) =>
                            updateTour(activeTour.id, { name: e.target.value })
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
                            value={activeTour.days}
                            onChange={(e) =>
                              updateTour(activeTour.id, {
                                days: Number(e.target.value) || 7,
                              })
                            }
                            style={{ width: '90px' }}
                          />
                          <select
                            value={activeTour.category}
                            onChange={(e) => {
                              const cat = e.target
                                .value as Tour['category'];
                              const labels: Record<Tour['category'], string> = {
                                heritage: 'Culture & Heritage',
                                wildlife: 'Wildlife & Nature',
                                coast: 'Coast & Beach',
                                adventure: 'Adventure',
                                family: 'Family Journey',
                              };
                              updateTour(activeTour.id, {
                                category: cat,
                                categoryLabel: labels[cat] || cat,
                              });
                            }}
                            style={{ flex: 1 }}
                          >
                            <option value="heritage">Culture &amp; Heritage</option>
                            <option value="wildlife">Wildlife &amp; Nature</option>
                            <option value="coast">Coast &amp; Beach</option>
                            <option value="adventure">Adventure</option>
                            <option value="family">Family Journey</option>
                          </select>
                        </div>
                      </div>

                      <div className="admin-field">
                        <label>ROUTE SUMMARY</label>
                        <input
                          type="text"
                          value={activeTour.route}
                          onChange={(e) =>
                            updateTour(activeTour.id, { route: e.target.value })
                          }
                        />
                      </div>

                      <div className="admin-field">
                        <label>KEY HIGHLIGHTS</label>
                        <input
                          type="text"
                          value={activeTour.highlights}
                          onChange={(e) =>
                            updateTour(activeTour.id, {
                              highlights: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <AdminImageUploadField
                      label="TOUR IMAGE (UPLOAD OR SELECT FROM R2 BUCKET)"
                      value={activeTour.image}
                      folder="tours"
                      onChange={(nextUrl) =>
                        updateTour(activeTour.id, { image: nextUrl })
                      }
                      onR2Uploaded={async (item) => {
                        await registerR2MediaInFirebase(item);
                        const nextCms: SiteCmsData = {
                          ...workingCms,
                          tours: workingCms.tours.map((t) =>
                            t.id === activeTour.id
                              ? { ...t, image: item.cdnUrl }
                              : t
                          ),
                        };
                        setCmsDraft(nextCms);
                        await saveCmsChanges(
                          nextCms,
                          `Tour "${activeTour.name}" R2 image saved to Firestore.`
                        );
                      }}
                      onR2Deleted={(_, docId) =>
                        removeR2MediaFromFirebase(docId)
                      }
                      onOpenR2Settings={() => setActiveTab('r2_storage')}
                    />

                    <div className="admin-field" style={{ marginBottom: 0 }}>
                      <label>TOUR DESCRIPTION</label>
                      <textarea
                        rows={3}
                        value={activeTour.description}
                        onChange={(e) =>
                          updateTour(activeTour.id, {
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* SECTION 05: PLANNING & FAQS (#PLANNING-FAQ)                    */}
            {/* ============================================================== */}
            {activeTab === 'sec_faqs' && (
              <div className="admin-assignments-card">
                <div className="section-head" style={{ marginBottom: '18px' }}>
                  <div>
                    <span
                      className="eyebrow"
                      style={{ color: 'var(--terracotta)' }}
                    >
                      SECTION 05 · PLANNING &amp; FAQS (#PLANNING-FAQ)
                    </span>
                    <h3
                      className="serif"
                      style={{ fontSize: '26px', margin: '4px 0 0' }}
                    >
                      Frequently Asked Questions ({workingCms.faqs.length})
                    </h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button type="button" className="pill" onClick={addFaq}>
                      + ADD FAQ
                    </button>
                    <button
                      type="button"
                      className="pill dark"
                      disabled={saving}
                      onClick={() =>
                        saveCmsChanges(
                          undefined,
                          'Planning FAQs saved to Firestore.'
                        )
                      }
                    >
                      {saving ? 'SAVING…' : 'APPLY CHANGES'}
                    </button>
                  </div>
                </div>

                {/* Compact FAQ Selector List */}
                <div
                  style={{
                    display: 'grid',
                    gap: '8px',
                    marginBottom: '18px',
                  }}
                >
                  {workingCms.faqs.map((faq, idx) => {
                    const isSelected = activeFaq?.id === faq.id;
                    return (
                      <button
                        key={faq.id}
                        type="button"
                        onClick={() => setSelectedFaqId(faq.id)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: isSelected
                            ? '2px solid var(--green)'
                            : '1px solid var(--line)',
                          background: isSelected
                            ? 'rgba(29,60,46,0.06)'
                            : '#fff',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>
                          {idx + 1}. {faq.q}
                        </span>
                        <span className="admin-type-pill">{faq.category}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Focused Editor for Selected FAQ */}
                {activeFaq && (
                  <div
                    className="admin-item-editor-card"
                    style={{ background: 'var(--bg-elev)' }}
                  >
                    <div className="admin-form-grid-2">
                      <div className="admin-field">
                        <label>QUESTION</label>
                        <input
                          type="text"
                          value={activeFaq.q}
                          onChange={(e) =>
                            updateFaq(activeFaq.id, { q: e.target.value })
                          }
                        />
                      </div>

                      <div className="admin-field">
                        <label>CATEGORY &amp; ACTION</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select
                            value={activeFaq.category}
                            onChange={(e) =>
                              updateFaq(activeFaq.id, {
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
                              color: '#b42318',
                            }}
                            onClick={() => deleteFaq(activeFaq.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="admin-field" style={{ marginBottom: 0 }}>
                      <label>ANSWER</label>
                      <textarea
                        rows={3}
                        value={activeFaq.a}
                        onChange={(e) =>
                          updateFaq(activeFaq.id, { a: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* SECTION 06: BOUTIQUE STAYS (/ACCOMMODATIONS)                   */}
            {/* ============================================================== */}
            {activeTab === 'sec_stays' && (
              <div className="admin-assignments-card">
                <div className="section-head" style={{ marginBottom: '18px' }}>
                  <div>
                    <span
                      className="eyebrow"
                      style={{ color: 'var(--terracotta)' }}
                    >
                      SECTION 06 · BOUTIQUE STAYS (/ACCOMMODATIONS)
                    </span>
                    <h3
                      className="serif"
                      style={{ fontSize: '26px', margin: '4px 0 0' }}
                    >
                      Boutique Accommodations ({workingCms.stays.length})
                    </h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button type="button" className="pill" onClick={addStay}>
                      + ADD BOUTIQUE STAY
                    </button>
                    <button
                      type="button"
                      className="pill dark"
                      disabled={saving}
                      onClick={() =>
                        saveCmsChanges(
                          undefined,
                          'Boutique stays saved to Firestore.'
                        )
                      }
                    >
                      {saving ? 'SAVING…' : 'APPLY CHANGES'}
                    </button>
                  </div>
                </div>

                {/* Compact Stay Selector Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(185px, 1fr))',
                    gap: '10px',
                    marginBottom: '20px',
                  }}
                >
                  {workingCms.stays.map((stay) => {
                    const isSelected = activeStay?.id === stay.id;
                    return (
                      <button
                        key={stay.id}
                        type="button"
                        onClick={() => setSelectedStayId(stay.id)}
                        style={{
                          padding: '6px',
                          borderRadius: '10px',
                          border: isSelected
                            ? '2px solid var(--green)'
                            : '1px solid var(--line)',
                          background: isSelected
                            ? 'rgba(29,60,46,0.06)'
                            : '#fff',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div
                          style={{
                            position: 'relative',
                            width: '100%',
                            height: '86px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            marginBottom: '6px',
                          }}
                        >
                          <AdminThumb src={stay.image} alt={stay.name} />
                        </div>
                        <strong
                          style={{
                            fontSize: '12px',
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {stay.name}
                        </strong>
                        <span
                          style={{
                            fontSize: '10.5px',
                            color: 'var(--muted)',
                            display: 'block',
                          }}
                        >
                          {stay.location}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Focused Editor for Selected Stay */}
                {activeStay && (
                  <div
                    className="admin-item-editor-card"
                    style={{ background: 'var(--bg-elev)' }}
                  >
                    <div className="admin-item-editor-top">
                      <div>
                        <span className="admin-type-pill">
                          {activeStay.region.toUpperCase()} · MAX{' '}
                          {activeStay.maxGuestsPerRoom} GUESTS
                        </span>
                        <h4
                          className="serif"
                          style={{ fontSize: '22px', margin: '4px 0 0' }}
                        >
                          {activeStay.name}
                        </h4>
                      </div>
                      <button
                        type="button"
                        className="pill"
                        style={{
                          padding: '5px 12px',
                          minHeight: '30px',
                          fontSize: '10.5px',
                          color: '#b42318',
                        }}
                        onClick={() => deleteStay(activeStay.id)}
                      >
                        Delete Stay
                      </button>
                    </div>

                    <div className="admin-form-grid-2">
                      <div className="admin-field">
                        <label>PROPERTY NAME</label>
                        <input
                          type="text"
                          value={activeStay.name}
                          onChange={(e) =>
                            updateStay(activeStay.id, { name: e.target.value })
                          }
                        />
                      </div>

                      <div className="admin-field">
                        <label>LOCATION &amp; REGION</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            value={activeStay.location}
                            onChange={(e) =>
                              updateStay(activeStay.id, {
                                location: e.target.value,
                              })
                            }
                            style={{ flex: 1 }}
                          />
                          <select
                            value={activeStay.region}
                            onChange={(e) =>
                              updateStay(activeStay.id, {
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
                          value={activeStay.tagline}
                          onChange={(e) =>
                            updateStay(activeStay.id, {
                              tagline: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="admin-field">
                        <label>MAX GUESTS PER ROOM</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={activeStay.maxGuestsPerRoom}
                          onChange={(e) =>
                            updateStay(activeStay.id, {
                              maxGuestsPerRoom: Number(e.target.value) || 2,
                            })
                          }
                        />
                      </div>
                    </div>

                    <AdminImageUploadField
                      label="PROPERTY PHOTO (UPLOAD OR SELECT FROM R2 BUCKET)"
                      value={activeStay.image}
                      folder="stays"
                      onChange={(nextUrl) =>
                        updateStay(activeStay.id, { image: nextUrl })
                      }
                      onR2Uploaded={async (item) => {
                        await registerR2MediaInFirebase(item);
                        const nextCms: SiteCmsData = {
                          ...workingCms,
                          stays: workingCms.stays.map((s) =>
                            s.id === activeStay.id
                              ? { ...s, image: item.cdnUrl }
                              : s
                          ),
                        };
                        setCmsDraft(nextCms);
                        await saveCmsChanges(
                          nextCms,
                          `Stay "${activeStay.name}" R2 photo saved to Firestore.`
                        );
                      }}
                      onR2Deleted={(_, docId) =>
                        removeR2MediaFromFirebase(docId)
                      }
                      onOpenR2Settings={() => setActiveTab('r2_storage')}
                    />

                    <div className="admin-field">
                      <label>DESCRIPTION</label>
                      <textarea
                        rows={2}
                        value={activeStay.description}
                        onChange={(e) =>
                          updateStay(activeStay.id, {
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="admin-field" style={{ marginBottom: 0 }}>
                      <label>HIGHLIGHTS (COMMA SEPARATED)</label>
                      <input
                        type="text"
                        value={activeStay.highlights.join(', ')}
                        onChange={(e) =>
                          updateStay(activeStay.id, {
                            highlights: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* SECTION 07: PHOTO GALLERY (/GALLERY)                           */}
            {/* ============================================================== */}
            {activeTab === 'sec_gallery' && (
              <div className="admin-assignments-card">
                <div className="section-head" style={{ marginBottom: '18px' }}>
                  <div>
                    <span
                      className="eyebrow"
                      style={{ color: 'var(--terracotta)' }}
                    >
                      SECTION 07 · VISUAL STORIES (/GALLERY)
                    </span>
                    <h3
                      className="serif"
                      style={{ fontSize: '26px', margin: '4px 0 0' }}
                    >
                      Photo Gallery ({workingCms.gallery.length})
                    </h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                        saveCmsChanges(
                          undefined,
                          'Gallery photos saved to Firestore.'
                        )
                      }
                    >
                      {saving ? 'SAVING…' : 'APPLY CHANGES'}
                    </button>
                  </div>
                </div>

                {/* Visual Photo Grid Selector */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '10px',
                    marginBottom: '20px',
                  }}
                >
                  {workingCms.gallery.map((photo) => {
                    const isSelected = activePhoto?.id === photo.id;
                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => setSelectedPhotoId(photo.id)}
                        style={{
                          padding: '6px',
                          borderRadius: '10px',
                          border: isSelected
                            ? '2px solid var(--green)'
                            : '1px solid var(--line)',
                          background: isSelected
                            ? 'rgba(29,60,46,0.06)'
                            : '#fff',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div
                          style={{
                            position: 'relative',
                            width: '100%',
                            height: '86px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            marginBottom: '6px',
                          }}
                        >
                          <AdminThumb src={photo.image} alt={photo.title} />
                        </div>
                        <strong
                          style={{
                            fontSize: '11.5px',
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {photo.title}
                        </strong>
                        <span
                          style={{
                            fontSize: '10px',
                            color: 'var(--muted)',
                            display: 'block',
                          }}
                        >
                          {photo.categoryLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Focused Editor for Selected Gallery Photo */}
                {activePhoto && (
                  <div
                    className="admin-item-editor-card"
                    style={{ background: 'var(--bg-elev)' }}
                  >
                    <div className="admin-item-editor-top">
                      <div>
                        <span className="admin-type-pill">
                          {activePhoto.categoryLabel} · {activePhoto.location}
                        </span>
                        <h4
                          className="serif"
                          style={{ fontSize: '22px', margin: '4px 0 0' }}
                        >
                          {activePhoto.title}
                        </h4>
                      </div>
                      <button
                        type="button"
                        className="pill"
                        style={{
                          padding: '5px 12px',
                          minHeight: '30px',
                          fontSize: '10.5px',
                          color: '#b42318',
                        }}
                        onClick={() => deleteGalleryPhoto(activePhoto.id)}
                      >
                        Delete Photo
                      </button>
                    </div>

                    <div className="admin-form-grid-2">
                      <div className="admin-field">
                        <label>PHOTO TITLE</label>
                        <input
                          type="text"
                          value={activePhoto.title}
                          onChange={(e) =>
                            updateGalleryPhoto(activePhoto.id, {
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
                            value={activePhoto.location}
                            onChange={(e) =>
                              updateGalleryPhoto(activePhoto.id, {
                                location: e.target.value,
                              })
                            }
                            style={{ flex: 1 }}
                          />
                          <select
                            value={activePhoto.category}
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
                              updateGalleryPhoto(activePhoto.id, {
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
                      label="GALLERY IMAGE (UPLOAD OR SELECT FROM R2 BUCKET)"
                      value={activePhoto.image}
                      folder="gallery"
                      onChange={(nextUrl) =>
                        updateGalleryPhoto(activePhoto.id, { image: nextUrl })
                      }
                      onR2Uploaded={async (item) => {
                        await registerR2MediaInFirebase(item);
                        const nextCms: SiteCmsData = {
                          ...workingCms,
                          gallery: workingCms.gallery.map((g) =>
                            g.id === activePhoto.id
                              ? { ...g, image: item.cdnUrl }
                              : g
                          ),
                        };
                        setCmsDraft(nextCms);
                        await saveCmsChanges(
                          nextCms,
                          `Gallery photo "${activePhoto.title}" saved to Firestore.`
                        );
                      }}
                      onR2Deleted={(_, docId) =>
                        removeR2MediaFromFirebase(docId)
                      }
                      onOpenR2Settings={() => setActiveTab('r2_storage')}
                    />

                    <div className="admin-field" style={{ marginBottom: 0 }}>
                      <label>CAPTION / STORY</label>
                      <input
                        type="text"
                        value={activePhoto.description}
                        onChange={(e) =>
                          updateGalleryPhoto(activePhoto.id, {
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* SECTION 08: BRAND, CONTACT & FOOTER                            */}
            {/* ============================================================== */}
            {activeTab === 'sec_brand' && (
              <div className="admin-assignments-card">
                <div className="section-head" style={{ marginBottom: '20px' }}>
                  <div>
                    <span
                      className="eyebrow"
                      style={{ color: 'var(--terracotta)' }}
                    >
                      SECTION 08 · BRAND IDENTITY, CONTACT &amp; FOOTER
                    </span>
                    <h3
                      className="serif"
                      style={{ fontSize: '26px', margin: '4px 0 0' }}
                    >
                      Company Profile, WhatsApp Concierge &amp; Social Links
                    </h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="pill"
                      onClick={handleResetDefaults}
                    >
                      RESET DEFAULTS
                    </button>
                    <button
                      type="button"
                      className="pill dark"
                      disabled={saving}
                      onClick={() =>
                        saveCmsChanges(
                          undefined,
                          'Brand & contact settings saved to Firestore.'
                        )
                      }
                    >
                      {saving ? 'SAVING…' : 'APPLY CHANGES'}
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
                    <label>FOUNDER NAME &amp; YEAR</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={
                          workingCms.general.founderName ??
                          'I.M. Bimsara Illangasinghe'
                        }
                        onChange={(e) =>
                          setCmsDraft({
                            ...workingCms,
                            general: {
                              ...workingCms.general,
                              founderName: e.target.value,
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
                        style={{ width: '95px' }}
                      />
                    </div>
                  </div>

                  <div className="admin-field">
                    <label>HEADQUARTERS ADDRESS (BATTARAMULLA)</label>
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
                    <label>INSTAGRAM URL &amp; FACEBOOK PAGE</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
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
                        style={{ flex: 1 }}
                      />
                      <input
                        type="text"
                        value={workingCms.general.facebookLabel ?? 'Bimondo'}
                        onChange={(e) =>
                          setCmsDraft({
                            ...workingCms,
                            general: {
                              ...workingCms.general,
                              facebookLabel: e.target.value,
                            },
                          })
                        }
                        style={{ width: '140px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* CLOUDFLARE R2 MEDIA LIBRARY                                    */}
            {/* ============================================================== */}
            {activeTab === 'r2_storage' && (
              <R2BucketManagerTab
                cms={workingCms}
                onR2Uploaded={registerR2MediaInFirebase}
                onR2Deleted={(_, docId) => removeR2MediaFromFirebase(docId)}
                onR2Renamed={handleR2ObjectRenamed}
                onQuickAssignToSite={handleQuickAssignFromR2Bucket}
              />
            )}

            {/* ============================================================== */}
            {/* CUSTOMER ENQUIRIES & MULTI-METHOD BOOKINGS INBOX               */}
            {/* ============================================================== */}
            {activeTab === 'enquiries' && (
              <div className="admin-assignments-card">
                <div className="section-head" style={{ marginBottom: '16px' }}>
                  <div>
                    <span
                      className="eyebrow"
                      style={{ color: 'var(--terracotta)' }}
                    >
                      MULTI-CHANNEL BOOKINGS &amp; ENQUIRIES INBOX
                    </span>
                    <h3
                      className="serif"
                      style={{ fontSize: '26px', margin: '4px 0 0' }}
                    >
                      Customer Bookings ({filteredEnquiries.length} of{' '}
                      {workingCms.enquiries.length})
                    </h3>
                    <p
                      style={{
                        fontSize: '12.5px',
                        color: 'var(--muted)',
                        margin: '4px 0 0',
                      }}
                    >
                      Receive bookings via Direct Admin Desk, WhatsApp
                      Concierge, Email Quote, Callback Request, or Manual Desk
                      entry.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={`pill ${showManualBookingForm ? 'dark' : ''}`}
                      onClick={() =>
                        setShowManualBookingForm((prev) => !prev)
                      }
                    >
                      {showManualBookingForm
                        ? 'CLOSE MANUAL ENTRY ×'
                        : '+ LOG MANUAL BOOKING'}
                    </button>
                  </div>
                </div>

                {/* Manual Booking Entry Form (for phone, walk-in, or partner agent bookings) */}
                {showManualBookingForm && (
                  <form
                    onSubmit={handleCreateManualBooking}
                    style={{
                      padding: '18px',
                      borderRadius: '12px',
                      background: 'var(--bg-elev)',
                      border: '1px solid var(--line)',
                      marginBottom: '20px',
                      display: 'grid',
                      gap: '14px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <strong style={{ fontSize: '13px' }}>
                        LOG NEW BOOKING INTO ADMIN DESK
                      </strong>
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--muted)',
                        }}
                      >
                        Saves to Admin Panel &amp; Firestore `/enquiries`
                      </span>
                    </div>

                    <div className="admin-form-grid-3">
                      <div className="admin-field" style={{ marginBottom: 0 }}>
                        <label>BOOKING CHANNEL / METHOD</label>
                        <select
                          value={manualBooking.bookingMethod}
                          onChange={(e) =>
                            setManualBooking({
                              ...manualBooking,
                              bookingMethod: e.target
                                .value as BookingSubmissionMethod,
                            })
                          }
                        >
                          <option value="manual">
                            Manual Desk / Walk-in / Agent
                          </option>
                          <option value="direct_admin">
                            Direct Admin Booking
                          </option>
                          <option value="whatsapp">WhatsApp Concierge</option>
                          <option value="email">Email Quote Request</option>
                          <option value="callback">
                            Phone Callback Request
                          </option>
                        </select>
                      </div>

                      <div className="admin-field" style={{ marginBottom: 0 }}>
                        <label>GUEST FULL NAME *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Clara & Thomas Weber"
                          value={manualBooking.name}
                          onChange={(e) =>
                            setManualBooking({
                              ...manualBooking,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="admin-field" style={{ marginBottom: 0 }}>
                        <label>GUEST EMAIL *</label>
                        <input
                          type="email"
                          required
                          placeholder="guest@example.com"
                          value={manualBooking.email}
                          onChange={(e) =>
                            setManualBooking({
                              ...manualBooking,
                              email: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="admin-form-grid-3">
                      <div className="admin-field" style={{ marginBottom: 0 }}>
                        <label>PHONE / WHATSAPP NUMBER</label>
                        <input
                          type="text"
                          placeholder="+44 7700 900000"
                          value={manualBooking.phone}
                          onChange={(e) =>
                            setManualBooking({
                              ...manualBooking,
                              phone: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="admin-field" style={{ marginBottom: 0 }}>
                        <label>TOUR OR BOUTIQUE STAY PACKAGE</label>
                        <select
                          value={manualBooking.selectedPackage}
                          onChange={(e) =>
                            setManualBooking({
                              ...manualBooking,
                              selectedPackage: e.target.value,
                            })
                          }
                        >
                          <option value="Custom Tailor-Made Journey">
                            Custom Tailor-Made Journey
                          </option>
                          {workingCms.tours.map((t) => (
                            <option
                              key={t.id}
                              value={`Tour: ${t.name} (${t.days})`}
                            >
                              Tour: {t.name} ({t.days})
                            </option>
                          ))}
                          {workingCms.stays.map((s) => (
                            <option
                              key={s.id}
                              value={`Stay: ${s.name} (${s.location})`}
                            >
                              Stay: {s.name} ({s.location})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="admin-field" style={{ marginBottom: 0 }}>
                        <label>ARRIVAL DATE &amp; GUESTS</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="date"
                            value={manualBooking.arrival}
                            onChange={(e) =>
                              setManualBooking({
                                ...manualBooking,
                                arrival: e.target.value,
                              })
                            }
                            style={{ flex: 1 }}
                          />
                          <input
                            type="text"
                            placeholder="2 travellers"
                            value={manualBooking.guests}
                            onChange={(e) =>
                              setManualBooking({
                                ...manualBooking,
                                guests: e.target.value,
                              })
                            }
                            style={{ width: '120px' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="admin-field" style={{ marginBottom: 0 }}>
                      <label>BOOKING DETAILS / REQUEST NOTES</label>
                      <textarea
                        rows={2}
                        placeholder="Itinerary notes, room preferences, flight numbers..."
                        value={manualBooking.message}
                        onChange={(e) =>
                          setManualBooking({
                            ...manualBooking,
                            message: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '8px',
                      }}
                    >
                      <button
                        type="submit"
                        className="pill dark"
                        disabled={saving}
                      >
                        {saving ? 'SAVING…' : 'SAVE BOOKING TO ADMIN DESK'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Dual Filter Bar: Filter by Booking Method & Status */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                    paddingBottom: '16px',
                    marginBottom: '16px',
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: 'var(--muted)',
                        marginRight: '4px',
                      }}
                    >
                      METHOD:
                    </span>
                    {(
                      [
                        { id: 'all', label: 'ALL METHODS' },
                        { id: 'direct_admin', label: 'DIRECT ADMIN' },
                        { id: 'whatsapp', label: 'WHATSAPP' },
                        { id: 'email', label: 'EMAIL QUOTE' },
                        { id: 'callback', label: 'CALLBACK' },
                        { id: 'manual', label: 'MANUAL DESK' },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className={`pill ${
                          enquiryMethodFilter === m.id ? 'dark' : ''
                        }`}
                        style={{
                          padding: '5px 11px',
                          minHeight: '28px',
                          fontSize: '10px',
                        }}
                        onClick={() => setEnquiryMethodFilter(m.id)}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: 'var(--muted)',
                        marginRight: '4px',
                      }}
                    >
                      STATUS:
                    </span>
                    {(
                      ['all', 'new', 'in_progress', 'replied', 'archived'] as const
                    ).map((statusKey) => (
                      <button
                        key={statusKey}
                        type="button"
                        className={`pill ${
                          enquiryFilter === statusKey ? 'dark' : ''
                        }`}
                        style={{
                          padding: '5px 11px',
                          minHeight: '28px',
                          fontSize: '10px',
                        }}
                        onClick={() => setEnquiryFilter(statusKey)}
                      >
                        {statusKey.toUpperCase().replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredEnquiries.length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
                    No bookings match the selected method or status filter.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gap: '14px' }}>
                    {filteredEnquiries.map((enq) => {
                      const method = resolveEnquiryMethod(enq);
                      const cleanPhone = (enq.phone || '').replace(/\D/g, '');
                      const replyWaNumber =
                        cleanPhone ||
                        (
                          workingCms.general.whatsappNumber || '94762232054'
                        ).replace(/\D/g, '');
                      const replyWaText = `Hello ${enq.name}, thank you for your booking enquiry (${enq.id.toUpperCase()}) with Bimondo Travels!`;
                      return (
                        <div key={enq.id} className="admin-item-editor-card">
                          <div className="admin-item-editor-top">
                            <div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  flexWrap: 'wrap',
                                  marginBottom: '4px',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    letterSpacing: '0.08em',
                                    padding: '3px 8px',
                                    borderRadius: '999px',
                                    background:
                                      method === 'whatsapp'
                                        ? '#dcfce7'
                                        : method === 'callback'
                                        ? '#fef3c7'
                                        : method === 'email'
                                        ? '#e0f2fe'
                                        : 'rgba(21,91,114,0.12)',
                                    color:
                                      method === 'whatsapp'
                                        ? '#14532d'
                                        : method === 'callback'
                                        ? '#92400e'
                                        : method === 'email'
                                        ? '#075985'
                                        : 'var(--ink)',
                                  }}
                                >
                                  {formatMethodLabel(method)}
                                </span>
                                <span className="admin-type-pill">
                                  REF #{enq.id.toUpperCase()} · {enq.arrival} ·{' '}
                                  {enq.guests} · {enq.duration}
                                </span>
                              </div>
                              <h4
                                className="serif"
                                style={{ fontSize: '20px', margin: '4px 0 0' }}
                              >
                                {enq.name}{' '}
                                <span
                                  style={{
                                    fontSize: '14px',
                                    fontWeight: 400,
                                    color: 'var(--muted)',
                                  }}
                                >
                                  ({enq.email}
                                  {enq.phone ? ` · ${enq.phone}` : ''})
                                </span>
                              </h4>
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
                              >
                                <option value="new">New</option>
                                <option value="in_progress">In Progress</option>
                                <option value="replied">Replied</option>
                                <option value="archived">Archived</option>
                              </select>
                              <button
                                type="button"
                                className="pill"
                                style={{
                                  padding: '5px 10px',
                                  minHeight: '30px',
                                  fontSize: '10px',
                                }}
                                onClick={() => deleteEnquiry(enq.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          {enq.selectedPackage && (
                            <div
                              style={{
                                fontSize: '12.5px',
                                fontWeight: 700,
                                color: 'var(--green)',
                                marginTop: '6px',
                              }}
                            >
                              Package / Stay: {enq.selectedPackage}
                            </div>
                          )}

                          <p
                            style={{
                              fontSize: '13.5px',
                              margin: '6px 0 12px',
                              color: 'var(--ink)',
                            }}
                          >
                            <strong>Interest:</strong> {enq.style} — &ldquo;
                            {enq.message}&rdquo;
                          </p>

                          {/* Quick Reply Bar */}
                          <div
                            style={{
                              display: 'flex',
                              gap: '8px',
                              flexWrap: 'wrap',
                              marginBottom: '12px',
                            }}
                          >
                            <a
                              href={`https://wa.me/${replyWaNumber}?text=${encodeURIComponent(
                                replyWaText
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="pill"
                              style={{
                                padding: '5px 11px',
                                minHeight: '28px',
                                fontSize: '10px',
                              }}
                            >
                              REPLY VIA WHATSAPP ↗
                            </a>
                            <a
                              href={`mailto:${enq.email}?subject=${encodeURIComponent(
                                `Your Sri Lanka Journey with Bimondo Travels (${enq.id.toUpperCase()})`
                              )}`}
                              className="pill"
                              style={{
                                padding: '5px 11px',
                                minHeight: '28px',
                                fontSize: '10px',
                              }}
                            >
                              SEND EMAIL QUOTE ↗
                            </a>
                            {enq.phone && (
                              <a
                                href={`tel:${enq.phone}`}
                                className="pill"
                                style={{
                                  padding: '5px 11px',
                                  minHeight: '28px',
                                  fontSize: '10px',
                                }}
                              >
                                CALL {enq.phone}
                              </a>
                            )}
                          </div>

                          <div
                            className="admin-field"
                            style={{ marginBottom: 0 }}
                          >
                            <label>INTERNAL CONCIERGE NOTES</label>
                            <input
                              type="text"
                              placeholder="Add private notes…"
                              value={enq.adminNotes}
                              onChange={(e) =>
                                updateEnquiry(enq.id, {
                                  adminNotes: e.target.value,
                                })
                              }
                              onBlur={() =>
                                saveCmsChanges(
                                  undefined,
                                  'Enquiry notes saved.'
                                )
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* BOOKING ENGINES (NIGHTSBRIDGE, BÓKUN, VIATOR)                  */}
            {/* ============================================================== */}
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
                          style={{ fontSize: '24px', margin: '4px 0' }}
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
                      <label>DEFAULT BBID</label>
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
                    <div className="admin-field" style={{ marginBottom: 0 }}>
                      <label>SERVER API KEY (OPTIONAL)</label>
                      <input
                        type="password"
                        placeholder="Enter to update server key"
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
                          TOUR DEPARTURES ENGINE
                        </span>
                        <h3
                          className="serif"
                          style={{ fontSize: '24px', margin: '4px 0' }}
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
                          {workingBooking.bokun.enabled
                            ? 'Enabled'
                            : 'Disabled'}
                        </span>
                      </label>
                    </div>
                    <div className="admin-field">
                      <label>BOOKING CHANNEL UUID</label>
                      <input
                        type="text"
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
                      <label>BÓKUN ACCESS KEY</label>
                      <input
                        type="password"
                        placeholder="Server-only Access Key"
                        value={bokunAccessKey}
                        onChange={(e) => setBokunAccessKey(e.target.value)}
                      />
                    </div>
                    <div className="admin-field" style={{ marginBottom: 0 }}>
                      <label>BÓKUN SECRET KEY</label>
                      <input
                        type="password"
                        placeholder="Server-only Secret Key"
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
                          MARKETPLACE ENGINE
                        </span>
                        <h3
                          className="serif"
                          style={{ fontSize: '24px', margin: '4px 0' }}
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
                          {workingBooking.viator.enabled
                            ? 'Enabled'
                            : 'Disabled'}
                        </span>
                      </label>
                    </div>
                    <div className="admin-field">
                      <label>PARTNER ID</label>
                      <input
                        type="text"
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
                    <div className="admin-field" style={{ marginBottom: 0 }}>
                      <label>VIATOR API KEY</label>
                      <input
                        type="password"
                        placeholder="Server-only API Key"
                        value={viatorApiKey}
                        onChange={(e) => setViatorApiKey(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="admin-assignments-card" style={{ marginTop: '20px' }}>
                  <div className="section-head" style={{ marginBottom: '16px' }}>
                    <div>
                      <span
                        className="eyebrow"
                        style={{ color: 'var(--terracotta)' }}
                      >
                        TOUR &amp; STAY BOOKING MAPPINGS
                      </span>
                      <h3
                        className="serif"
                        style={{ fontSize: '22px', margin: '4px 0 0' }}
                      >
                        Assign Booking Providers per Item
                      </h3>
                    </div>
                    <button
                      type="submit"
                      className="pill dark"
                      disabled={saving}
                    >
                      {saving ? 'SAVING…' : 'SAVE BOOKING SETTINGS'}
                    </button>
                  </div>

                  <div className="admin-assignments-table-wrap">
                    <table className="admin-assignments-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Provider</th>
                          <th>Open Mode</th>
                          <th>External ID</th>
                          <th>Direct URL</th>
                          <th>Preview</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.values(workingBooking.assignments).map(
                          (item) => (
                            <tr key={item.itemId}>
                              <td>
                                <strong>{item.itemName}</strong>
                              </td>
                              <td>
                                <select
                                  value={item.provider}
                                  onChange={(e) =>
                                    updateBookingAssignment(item.itemId, {
                                      provider: e.target
                                        .value as BookingProviderId,
                                    })
                                  }
                                >
                                  <option value="nightsbridge">
                                    NightsBridge
                                  </option>
                                  <option value="bokun">Bókun</option>
                                  <option value="viator">Viator</option>
                                  <option value="direct_enquiry">
                                    Direct Concierge
                                  </option>
                                </select>
                              </td>
                              <td>
                                <select
                                  value={item.openMode}
                                  onChange={(e) =>
                                    updateBookingAssignment(item.itemId, {
                                      openMode: e.target
                                        .value as BookingOpenMode,
                                    })
                                  }
                                >
                                  <option value="modal_embed">
                                    Modal Embed
                                  </option>
                                  <option value="inline_drawer">
                                    Inline Drawer
                                  </option>
                                  <option value="external_new_tab">
                                    External Tab
                                  </option>
                                </select>
                              </td>
                              <td>
                                <input
                                  type="text"
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
                                  value={item.externalUrl}
                                  onChange={(e) =>
                                    updateBookingAssignment(item.itemId, {
                                      externalUrl: e.target.value,
                                    })
                                  }
                                />
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="pill"
                                  style={{
                                    padding: '5px 10px',
                                    minHeight: '28px',
                                    fontSize: '10px',
                                  }}
                                  onClick={() => setPreviewItemId(item.itemId)}
                                >
                                  Preview
                                </button>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {workingBooking.assignments[previewItemId] && (
                  <div className="admin-preview-card" style={{ marginTop: '20px' }}>
                    <ProviderWidgetEmbed
                      provider={
                        workingBooking.assignments[previewItemId].provider
                      }
                      itemName={
                        workingBooking.assignments[previewItemId].itemName
                      }
                      externalId={
                        workingBooking.assignments[previewItemId].externalId
                      }
                      bokunChannelUuid={
                        workingBooking.bokun.bookingChannelUuid
                      }
                      bokunScriptUrl={workingBooking.bokun.widgetScriptUrl}
                      checkoutUrl={
                        workingBooking.assignments[previewItemId].externalUrl ||
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
          </div>
        </div>
      </section>
    </main>
  );
}
