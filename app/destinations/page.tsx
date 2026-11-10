'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PageBanner from '@/components/PageBanner';
import BookingPanel from '@/components/booking/BookingPanel';

interface Destination {
  id: string;
  name: string;
  region: 'culture' | 'hills' | 'coast' | 'wildlife';
  regionLabel: string;
  season: string;
  tagline: string;
  description: string;
  highlights: string[];
  image: string;
}

export default function DestinationsPage() {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  const destinations: Destination[] = [
    {
      id: 'sigiriya',
      name: 'Sigiriya & The Cultural Triangle',
      region: 'culture',
      regionLabel: 'Culture & Heritage',
      season: 'Best Nov – Sep',
      tagline: 'Ancient sky fortress & sacred ruins',
      description:
        'Climb the 5th-century rock fortress of King Kashyapa, explore the ancient capitals of Anuradhapura and Polonnaruwa, and marvel at the cave temples of Dambulla.',
      highlights: ['Sigiriya Lion Rock climb', 'Pidurangala sunrise panorama', 'Dambulla Golden Cave Temples'],
      image: 'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1000&q=85',
    },
    {
      id: 'kandy-hills',
      name: 'Kandy & Knuckles Mountain Range',
      region: 'hills',
      regionLabel: 'Central Highlands',
      season: 'Year-round · Cooler Dec – Mar',
      tagline: 'Sacred relic, lake breeze & cloud forests',
      description:
        'Sri Lanka’s cultural crown surrounded by mist-draped peaks. Home to the Temple of the Sacred Tooth Relic, vibrant Kandyan dance rituals, and pristine hiking.',
      highlights: ['Temple of the Tooth Relic', 'Kandy Lake evening walks', 'Knuckles UNESCO wilderness hike'],
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1000&q=85',
    },
    {
      id: 'ella-nuwara-eliya',
      name: 'Ella, Nuwara Eliya & Tea Country',
      region: 'hills',
      regionLabel: 'Central Highlands',
      season: 'Best Jan – May',
      tagline: 'Misty tea estates, waterfalls & slow trains',
      description:
        'Cool mountain air, endless emerald hills, and colonial heritage. Take the iconic blue train through pine forests, hike Little Adam’s Peak, and sip single-origin Ceylon tea.',
      highlights: ['Nine Arch Bridge train crossing', 'Tea factory tasting & picking', 'Little Adam’s Peak trek'],
      image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1000&q=85',
    },
    {
      id: 'galle-south-coast',
      name: 'Galle Fort & The Southern Riviera',
      region: 'coast',
      regionLabel: 'Coast & Beaches',
      season: 'Best Nov – Apr',
      tagline: 'Dutch ramparts, surf bays & slow living',
      description:
        'Wander cobblestone lanes lined with 17th-century colonial villas, watch local stilt fishermen at golden hour, and relax along golden palm-fringed beaches.',
      highlights: ['UNESCO Galle Fort walking tour', 'Mirissa blue whale watching', 'Weligama gentle surf lessons'],
      image: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1000&q=85',
    },
    {
      id: 'yala-wildlife',
      name: 'Yala & Udawalawe National Parks',
      region: 'wildlife',
      regionLabel: 'Wildlife & Nature',
      season: 'Best Feb – Oct',
      tagline: 'Leopard prowls, elephant herds & wild lagoons',
      description:
        'Sri Lanka boasts one of the highest densities of wild leopards on earth. Ride open-top 4x4 jeeps across scrub jungle, waterholes, and coastal lagoons.',
      highlights: ['Guided leopard tracking safaris', 'Udawalawe elephant transit home', 'Crocodiles & exotic birdlife'],
      image: 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=1000&q=85',
    },
    {
      id: 'minneriya',
      name: 'Minneriya & Kaudulla Gathering',
      region: 'wildlife',
      regionLabel: 'Wildlife & Nature',
      season: 'Peak Jul – Oct',
      tagline: 'The largest Asian elephant gathering',
      description:
        'During the dry season, up to 300 wild elephants congregate around ancient 3rd-century irrigation reservoirs. A breathtaking natural spectacle unique to Sri Lanka.',
      highlights: ['The Great Elephant Gathering', 'Ancient lake ecosystems', 'Sunset open-air jeep drives'],
      image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1000&q=85',
    },
  ];

  const filtered =
    selectedRegion === 'all'
      ? destinations
      : destinations.filter((d) => d.region === selectedRegion);

  const regionTabs = [
    { id: 'all', label: 'All destinations' },
    { id: 'culture', label: 'Culture & Heritage' },
    { id: 'hills', label: 'Central Highlands' },
    { id: 'coast', label: 'Coast & Oceans' },
    { id: 'wildlife', label: 'Wildlife Sanctuaries' },
  ];

  const [activeDestBooking, setActiveDestBooking] =
    useState<Destination | null>(null);

  return (
    <main>
      <PageBanner
        eyebrow="BIMONDO DESTINATIONS  /  SRI LANKA"
        title="One island. A thousand worlds to uncover."
      />

      <section className="section wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              EXPLORE BY REGION
            </div>
            <h2 className="serif">
              Handpicked places
              <br />
              with a <em style={{ color: 'var(--terracotta)' }}>local heartbeat.</em>
            </h2>
          </div>
          <p>
            Whether you dream of misty tea trails, ancient UNESCO kingdoms, or
            slow beach hideaways, every destination is connected by your private
            chauffeur.
          </p>
        </div>

        {/* Region Filter Tabs */}
        <div className="filter" style={{ marginBottom: '40px' }}>
          {regionTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={selectedRegion === tab.id ? 'active' : ''}
              onClick={() => setSelectedRegion(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Destinations Grid */}
        <div className="destinations-detail-grid">
          {filtered.map((dest, i) => (
            <article key={dest.id} className="destination-detail-card">
              <div className="dest-img-wrap">
                <Image
                  src={dest.image}
                  alt={dest.name}
                  fill
                  priority={i < 2}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="dest-season-badge">{dest.season}</span>
              </div>
              <div className="dest-content">
                <span className="eyebrow" style={{ color: 'var(--terracotta)' }}>
                  {dest.regionLabel}
                </span>
                <h3 className="serif dest-name">{dest.name}</h3>
                <p className="dest-tagline">{dest.tagline}</p>
                <p className="dest-desc">{dest.description}</p>
                <div className="dest-highlights">
                  <strong>Key highlights:</strong>
                  <ul>
                    {dest.highlights.map((h, i) => (
                      <li key={i}>✳ {h}</li>
                    ))}
                  </ul>
                </div>
                <div
                  className="dest-card-foot"
                  style={{ gap: '8px', flexWrap: 'wrap' }}
                >
                  <Link
                    href="/stays"
                    prefetch={false}
                    className="pill"
                    style={{ padding: '9px 14px', fontSize: '10.5px' }}
                  >
                    STAYS IN REGION
                  </Link>
                  <button
                    type="button"
                    className="pill dark"
                    style={{ padding: '9px 16px', fontSize: '10.5px' }}
                    onClick={() => setActiveDestBooking(dest)}
                  >
                    BOOK EXPERIENCE ↗
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Tailor-Made Route Box */}
        <div className="dest-custom-cta-box">
          <div>
            <span className="eyebrow" style={{ color: '#a5eff4' }}>
              CUSTOM ROUTING &amp; STAYS
            </span>
            <h3 className="serif" style={{ fontSize: '36px', margin: '10px 0', color: '#fff' }}>
              Want to combine hills, safari &amp; the sea?
            </h3>
            <p style={{ color: '#e0f5fb', maxWidth: '520px', lineHeight: 1.8 }}>
              Our Sri Lankan trip curators craft multi-region routes that flow naturally
              without backtracking, matched to your preferred hotels and pace.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/stays" prefetch={false} className="pill light">
              BROWSE BOUTIQUE STAYS ↗
            </Link>
            <Link href="/contact" prefetch={false} className="pill dark">
              DESIGN MY ROUTE ↗
            </Link>
          </div>
        </div>
      </section>

      {activeDestBooking && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveDestBooking(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-card booking-modal-wide">
            <BookingPanel
              itemId={activeDestBooking.id}
              itemName={activeDestBooking.name}
              itemType="experience"
              onClose={() => setActiveDestBooking(null)}
            />
          </div>
        </div>
      )}
    </main>
  );
}
