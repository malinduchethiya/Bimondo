'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PageBanner from '@/components/PageBanner';

interface GalleryPhoto {
  id: string;
  title: string;
  location: string;
  category: 'culture' | 'highlands' | 'wildlife' | 'coast';
  categoryLabel: string;
  image: string;
  description: string;
}

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);

  const photos: GalleryPhoto[] = [
    {
      id: 'dancer-welcome',
      title: 'Ayubowan — May You Live Long',
      location: 'Kandy & Central Province',
      category: 'culture',
      categoryLabel: 'Culture & Heritage',
      image: '/images/kandyan-ves-dancer.jpg',
      description:
        'A traditional Sri Lankan Kandyan dancer in sacred regalia offering the reverent hands-together Ayubowan greeting.',
    },
    {
      id: 'sigiriya-citadel',
      title: 'Sunrise Over the Sky Citadel',
      location: 'Sigiriya, Cultural Triangle',
      category: 'culture',
      categoryLabel: 'Culture & Heritage',
      image:
        'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1200&q=85',
      description:
        'The 5th-century rock fortress of King Kashyapa rising 200 metres above misty tropical jungle canopy.',
    },
    {
      id: 'nine-arch-bridge',
      title: 'The Blue Train at Demodara',
      location: 'Ella, Highlands',
      category: 'highlands',
      categoryLabel: 'Highlands & Tea',
      image:
        'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1200&q=85',
      description:
        'The colonial stone Nine Arch Bridge gracefully spanning dense tea terraces and eucalyptus forests in the morning mist.',
    },
    {
      id: 'kandy-temple-dance',
      title: 'Sacred Kandyan Drumming & Dance',
      location: 'Temple of the Tooth, Kandy',
      category: 'culture',
      categoryLabel: 'Culture & Heritage',
      image: '/images/sri-lankan-dancer-matching.jpg',
      description:
        'Ancient rhythms and ritual movements passed down through generations during cultural temple celebrations.',
    },
    {
      id: 'galle-lighthouse',
      title: 'Sunset at Galle Fort Ramparts',
      location: 'Galle, Southern Coast',
      category: 'coast',
      categoryLabel: 'Coast & Oceans',
      image:
        'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=85',
      description:
        'The iconic 1939 white lighthouse standing sentinel above 17th-century Dutch fortifications and coral reefs.',
    },
    {
      id: 'wild-elephant-lake',
      title: 'The Gathering at Kaudulla',
      location: 'Minneriya & Kaudulla',
      category: 'wildlife',
      categoryLabel: 'Wildlife & Nature',
      image:
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=85',
      description:
        'Wild Asian elephant herds gathering peacefully by the shores of ancient 3rd-century reservoirs at golden hour.',
    },
    {
      id: 'leopard-safari',
      title: 'Granite Boulders of Yala',
      location: 'Yala National Park',
      category: 'wildlife',
      categoryLabel: 'Wildlife & Nature',
      image:
        'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=1200&q=85',
      description:
        'Sri Lanka’s untamed wilderness, home to the world’s densest wild leopard population and coastal lagoons.',
    },
    {
      id: 'ceylon-tea-valleys',
      title: 'Emerald Terraces of Nuwara Eliya',
      location: 'Central Highlands',
      category: 'highlands',
      categoryLabel: 'Highlands & Tea',
      image:
        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=85',
      description:
        'Rolling carpets of single-origin Ceylon tea bushes glistening with cool morning dew in the hill country.',
    },
    {
      id: 'coastal-slow-living',
      title: 'Golden Sands of the South',
      location: 'Mirissa & Tangalle',
      category: 'coast',
      categoryLabel: 'Coast & Oceans',
      image:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
      description:
        'Pristine curving palm bays where tropical turquoise waters meet secluded boutique beach retreats.',
    },
  ];

  const categories = [
    { id: 'all', label: 'All moments' },
    { id: 'culture', label: 'Culture & Heritage' },
    { id: 'highlands', label: 'Highlands & Tea' },
    { id: 'wildlife', label: 'Wildlife & Nature' },
    { id: 'coast', label: 'Coast & Oceans' },
  ];

  const filtered =
    activeCategory === 'all'
      ? photos
      : photos.filter((p) => p.category === activeCategory);

  return (
    <main>
      <PageBanner
        eyebrow="BIMONDO GALLERY  /  SRI LANKA"
        title="Moments of wonder across our island home."
      />

      <section className="section wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              VISUAL STORIES
            </div>
            <h2 className="serif">
              Raw, vibrant &amp;{' '}
              <em style={{ color: 'var(--terracotta)' }}>unforgettable.</em>
            </h2>
          </div>
          <p>
            Photography captured across our private journeys: from sacred ritual dances
            in Kandy to the quiet mist of tea country and sun-drenched southern bays.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="filter" style={{ marginBottom: '36px' }}>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={activeCategory === c.id ? 'active' : ''}
              onClick={() => setActiveCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="gallery-grid">
          {filtered.map((photo, i) => (
            <div
              key={photo.id}
              className="gallery-item"
              onClick={() => setSelectedPhoto(photo)}
            >
              <Image
                src={photo.image}
                alt={photo.title}
                fill
                priority={i < 2}
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="gallery-overlay">
                <span className="gallery-loc">{photo.location}</span>
                <h3 className="serif gallery-title">{photo.title}</h3>
                <span style={{ fontSize: '11px', color: '#e5f8fc', marginTop: '4px' }}>
                  Click to view full photo ↗
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Tailor-Made CTA Box */}
        <div className="dest-custom-cta-box" style={{ marginTop: '55px' }}>
          <div>
            <span className="eyebrow" style={{ color: '#a5eff4' }}>
              SEE IT WITH YOUR OWN EYES
            </span>
            <h3 className="serif" style={{ fontSize: '36px', margin: '10px 0', color: '#fff' }}>
              Experience Sri Lanka in person
            </h3>
            <p style={{ color: '#e0f5fb', maxWidth: '520px', lineHeight: 1.8 }}>
              Let our Colombo team build your personalized route through these exact
              landscapes with your own private driver-guide.
            </p>
          </div>
          <Link href="/contact" prefetch={false} className="pill light">
            START YOUR JOURNEY ↗
          </Link>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedPhoto(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-card"
            style={{ maxWidth: '850px', padding: '0', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ position: 'relative', height: 'clamp(220px, 42vh, 420px)', width: '100%' }}>
              <Image
                src={selectedPhoto.image}
                alt={selectedPhoto.title}
                fill
                sizes="(max-width: 768px) 100vw, 850px"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                className="modal-close-btn"
                style={{
                  color: '#ffffff',
                  background: 'rgba(0,0,0,0.5)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'grid',
                  placeItems: 'center',
                  top: '16px',
                  right: '16px',
                }}
                onClick={() => setSelectedPhoto(null)}
              >
                ×
              </button>
            </div>
            <div style={{ padding: 'clamp(18px, 4vw, 28px) clamp(16px, 4vw, 32px)' }}>
              <span className="eyebrow" style={{ color: 'var(--terracotta)' }}>
                {selectedPhoto.categoryLabel} · {selectedPhoto.location}
              </span>
              <h2 className="serif" style={{ fontSize: 'clamp(24px, 6vw, 32px)', margin: '8px 0 12px' }}>
                {selectedPhoto.title}
              </h2>
              <p style={{ lineHeight: 1.75, color: '#536f7e', margin: 0, fontSize: '14px' }}>
                {selectedPhoto.description}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>
                <Link
                  href="/contact"
                  prefetch={false}
                  className="pill dark"
                  onClick={() => setSelectedPhoto(null)}
                >
                  PLAN A TRIP TO THIS REGION ↗
                </Link>
                <button
                  type="button"
                  className="pill"
                  onClick={() => setSelectedPhoto(null)}
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
