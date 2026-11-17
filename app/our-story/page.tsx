'use client';

import React from 'react';
import Link from 'next/link';
import PageBanner from '@/components/PageBanner';
import StorySection from '@/components/StorySection';
import { useSiteCms } from '@/hooks/useSiteCms';

const OFFICIAL_VISION =
  'To be the most beloved name in the Sri Lankan tourism industry, creating authentic and unique travel experiences while uplifting our people and preserving our heritage.';

const OFFICIAL_MISSION =
  'To craft private, authentic journeys across the island, driven by innovation while maintaining respect for our heritage.';

const DEFAULT_INVOLVEMENT_AREAS = [
  'Itinerary development',
  'Hotel selection',
  'Guest relations',
  'Drivers and guides',
  'Supplier partnerships',
  'Quality assurance',
  'Guest feedback',
];

const DEFAULT_LEADERSHIP_PRINCIPLES = [
  {
    id: 'lead-1',
    title: 'Listen to the guest first.',
    desc: 'Every itinerary begins with understanding the guest’s interests, preferred travel pace, accommodation expectations, and budget.',
  },
  {
    id: 'lead-2',
    title: 'Be honest about what is possible.',
    desc: 'We give realistic advice on driving times, regional seasons, sea conditions, wildlife sightings, and daily pacing.',
  },
  {
    id: 'lead-3',
    title: 'Respond quickly.',
    desc: 'Fast, clear communication before booking and 24-hour on-call assistance throughout your journey in Sri Lanka.',
  },
  {
    id: 'lead-4',
    title: 'Choose reliable partners.',
    desc: 'Working with vetted local drivers, licensed guides, four-star to five-star hotels, and qualified adventure operators.',
  },
  {
    id: 'lead-5',
    title: 'Respect Sri Lankan people, culture, and nature.',
    desc: 'Uplifting local communities, honouring sacred heritage sites, and protecting the island’s wildlife, forests, and coasts.',
  },
];

const DEFAULT_COMPETITIVE_ADVANTAGES = [
  {
    id: 'adv-01',
    num: '01',
    title: 'Operating Since 2022',
    desc: 'Established in 2022 in Thalangama South, Battaramulla, serving international travellers from the United Kingdom, Europe, India, and Australia.',
  },
  {
    id: 'adv-02',
    num: '02',
    title: 'Strong Adventure Range',
    desc: 'Surfing in Weligama and Arugam Bay, white-water rafting and abseiling in Kitulgala, paramotoring in Bentota, kite surfing in Kalpitiya, diving in Galle, and highland trekking.',
  },
  {
    id: 'adv-03',
    num: '03',
    title: 'Private and Personal Travel',
    desc: 'Tailor-made itineraries built around your own dates, pace, and interests—for solo travellers, couples, families, and small private groups.',
  },
  {
    id: 'adv-04',
    num: '04',
    title: '24-Hour Support',
    desc: 'Round-the-clock on-call assistance from our local operations team throughout your journey in Sri Lanka.',
  },
  {
    id: 'adv-05',
    num: '05',
    title: 'Digital Convenience',
    desc: 'Online booking confirmations, clear written itinerary summaries, WhatsApp concierge support, and social media enquiry handling.',
  },
  {
    id: 'adv-06',
    num: '06',
    title: 'Luxury Accommodation Options',
    desc: 'Handpicked four-star hotels, characterful boutique properties, and five-star luxury resorts matched to your route and budget.',
  },
  {
    id: 'adv-07',
    num: '07',
    title: 'Colombo-Area Operational Base',
    desc: 'Strategically based in Thalangama South, Battaramulla near Colombo, Parliament, Diyawanna Lake, Kotte, and the airport expressway network.',
  },
  {
    id: 'adv-08',
    num: '08',
    title: 'Authenticity with Sustainability',
    desc: 'Genuine local experiences that uplift Sri Lankan communities, respect sacred heritage, and protect wildlife and natural habitats.',
  },
];

const DEFAULT_SUSTAINABILITY_ITEMS = [
  {
    id: 'sust-01',
    category: 'COMMUNITY UPLIFTMENT',
    title: 'Local Drivers, Guides & Family-Run Businesses',
    desc: 'Working directly with Sri Lankan drivers, licensed guides, family-run restaurants, and authentic community experiences so tourism income benefits local people.',
  },
  {
    id: 'sust-02',
    category: 'CULTURAL RESPECT',
    title: 'Temple Dress Codes & Responsible Photography',
    desc: 'Briefing guests on respectful dress codes at sacred Buddhist and Hindu sites, etiquette at the Temple of the Tooth and ancient capitals, and considerate photography.',
  },
  {
    id: 'sust-03',
    category: 'ETHICAL WILDLIFE',
    title: 'Responsible National Park & Marine Viewing',
    desc: 'Partnering with safari and marine operators in Yala, Udawalawe, Wilpattu, Minneriya, Mirissa, and Kalpitiya who follow park rules and never crowd or disturb wildlife.',
  },
  {
    id: 'sust-04',
    category: 'ENVIRONMENTAL CARE',
    title: 'Reduced Plastic & Habitat Protection',
    desc: 'Encouraging reduced single-use plastic and protecting Sri Lanka’s rainforests, highland trails, beaches, wetlands, and coral reefs.',
  },
];

const DEFAULT_PROMISE_COMMITMENTS = [
  'Careful planning tailored around your travel dates, pace, and interests',
  'Honest advice on driving times, regional seasons, sea conditions, and wildlife',
  'Safe travel with vetted vehicles, professional drivers, and qualified adventure operators',
  'Comfortable accommodation across curated four-star, boutique, and five-star stays',
  'Reliable 24-hour local support from arrival at the airport to departure',
  'Personalized journeys that respect Sri Lankan people, heritage, and nature',
];

export default function OurStoryPage() {
  const { cms } = useSiteCms();
  const pageContent = cms.pages.ourStoryPage;

  const identityCards = pageContent.identitySection.cards || [];
  const coreValues = pageContent.valuesSection.coreValues || [];

  const rawVision = pageContent.valuesSection.visionText || '';
  const visionText =
    !rawVision ||
    rawVision.startsWith('To be a trusted and admired Sri Lankan travel company')
      ? OFFICIAL_VISION
      : rawVision;

  const rawMission = pageContent.valuesSection.missionText || '';
  const missionText =
    !rawMission ||
    rawMission.startsWith('To design and deliver well-planned journeys')
      ? OFFICIAL_MISSION
      : rawMission;

  const involvementAreas =
    pageContent.founderSection.involvementAreas?.length
      ? pageContent.founderSection.involvementAreas
      : DEFAULT_INVOLVEMENT_AREAS;

  const rawLeadership = pageContent.founderSection.leadershipValues || [];
  const leadershipValues =
    rawLeadership.length === 0 ||
    rawLeadership[0]?.title === 'Personal Accountability'
      ? DEFAULT_LEADERSHIP_PRINCIPLES
      : rawLeadership;

  const competitiveAdvantages =
    pageContent.competitiveAdvantagesSection?.items?.length
      ? pageContent.competitiveAdvantagesSection.items
      : DEFAULT_COMPETITIVE_ADVANTAGES;

  const sustainabilityItems =
    pageContent.sustainabilitySection?.items?.length
      ? pageContent.sustainabilitySection.items
      : DEFAULT_SUSTAINABILITY_ITEMS;

  const growthRoadmap = pageContent.roadmapSection.stages || [];
  const promiseCommitments =
    pageContent.promiseSection?.commitments?.length
      ? pageContent.promiseSection.commitments
      : DEFAULT_PROMISE_COMMITMENTS;
  const closingTagline =
    pageContent.promiseSection?.closingTagline ||
    'Not a place you visit, but a feeling you carry home.';

  return (
    <main>
      <PageBanner
        eyebrow={pageContent.banner.eyebrow}
        title={pageContent.banner.title}
      />

      {/* A. Where the Story Begins (Origin Story in Thalangama South, Battaramulla) */}
      <StorySection />

      {/* B & D. Company Overview & Our Home Base in Battaramulla and Thalangama */}
      <section className="section wrap" style={{ paddingTop: '20px' }}>
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              {pageContent.identitySection.eyebrow}
            </div>
            <h2 className="serif">
              {pageContent.identitySection.headingPrefix}{' '}
              <em style={{ color: 'var(--terracotta)' }}>
                {pageContent.identitySection.headingItalic}
              </em>
            </h2>
          </div>
          <div>
            <p style={{ marginBottom: '10px' }}>
              {pageContent.identitySection.description}
            </p>
            <p style={{ fontSize: '0.9rem', color: '#557180' }}>
              As a Sri Lankan inbound tour operator serving international
              travellers since 2022, we combine local knowledge in Thalangama
              and Battaramulla with islandwide partnerships across adventure,
              culture and heritage, sea and sand escapes, hiking, wildlife, and
              four-star to five-star accommodation.
            </p>
          </div>
        </div>

        <div
          className="values-grid"
          style={{
            marginBottom: '56px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          }}
        >
          {identityCards.map((card) => (
            <div
              key={card.id}
              className="value"
              style={{ borderTopColor: '#c8dbe2' }}
            >
              <span
                className="number"
                style={{ color: 'var(--terracotta)', fontWeight: 700 }}
              >
                {card.kicker}
              </span>
              <h3
                className="serif"
                style={{
                  color: 'var(--ink)',
                  fontSize: '26px',
                  margin: '12px 0 10px',
                }}
              >
                {card.title}
              </h3>
              <p style={{ color: '#557180', lineHeight: 1.8 }}>
                {card.description}
              </p>
            </div>
          ))}
        </div>

        {/* E, F & G. Official Vision, Mission & Six Core Values */}
        <div className="section-head" style={{ marginTop: '20px' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              {pageContent.valuesSection.eyebrow}
            </div>
            <h2 className="serif">
              {pageContent.valuesSection.headingPrefix}{' '}
              <em style={{ color: 'var(--terracotta)' }}>
                {pageContent.valuesSection.headingItalic}
              </em>
            </h2>
          </div>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div
              style={{
                background: '#fff',
                border: '1px solid var(--line)',
                borderRadius: '14px',
                padding: '16px 20px',
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--terracotta)',
                  marginBottom: '4px',
                }}
              >
                {pageContent.valuesSection.visionLabel || 'Our Vision'}
              </div>
              <p style={{ color: 'var(--ink)', lineHeight: 1.65, margin: 0 }}>
                “{visionText}”
              </p>
            </div>
            <div
              style={{
                background: '#fff',
                border: '1px solid var(--line)',
                borderRadius: '14px',
                padding: '16px 20px',
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--terracotta)',
                  marginBottom: '4px',
                }}
              >
                {pageContent.valuesSection.missionLabel || 'Our Mission'}
              </div>
              <p style={{ color: 'var(--ink)', lineHeight: 1.65, margin: 0 }}>
                “{missionText}”
              </p>
            </div>
          </div>
        </div>

        <div className="values-grid" style={{ marginBottom: '60px' }}>
          {coreValues.map((v) => (
            <div
              key={v.id || v.number}
              className="value"
              style={{ borderTopColor: '#c8dbe2' }}
            >
              <span
                className="number"
                style={{ color: 'var(--terracotta)', fontWeight: 700 }}
              >
                {v.number} / CORE VALUE
              </span>
              <h3
                className="serif"
                style={{
                  color: 'var(--ink)',
                  fontSize: '26px',
                  margin: '12px 0 10px',
                }}
              >
                {v.title}
              </h3>
              <p style={{ color: '#557180', lineHeight: 1.8 }}>{v.desc}</p>
            </div>
          ))}
        </div>

        {/* C. Founder & Leadership (7 Involvement Areas + 5 Leadership Principles) */}
        <div className="founder-quote-card" style={{ marginBottom: '60px' }}>
          <div>
            <span className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              {pageContent.founderSection.eyebrow}
            </span>
            <h3
              className="serif"
              style={{
                fontSize: 'clamp(24px, 2.6vw, 34px)',
                lineHeight: 1.3,
                color: 'var(--ink)',
                margin: '12px 0 16px',
              }}
            >
              {pageContent.founderSection.founderName}
            </h3>
            <p
              style={{
                color: '#536f7e',
                lineHeight: 1.8,
                marginBottom: '14px',
              }}
            >
              {pageContent.founderSection.credentialsLine}
            </p>
            <p
              style={{
                color: '#536f7e',
                lineHeight: 1.8,
                marginBottom: '16px',
              }}
            >
              {pageContent.founderSection.bioParagraph}
            </p>

            {/* 7 Documented Areas of Founder Involvement */}
            <div style={{ marginBottom: '18px' }}>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  color: 'var(--terracotta)',
                  marginBottom: '8px',
                }}
              >
                Direct Founder Involvement:
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                {involvementAreas.map((area) => (
                  <span
                    key={area}
                    style={{
                      fontSize: '0.78rem',
                      padding: '5px 12px',
                      borderRadius: '999px',
                      background: 'var(--bg)',
                      border: '1px solid var(--line)',
                      color: 'var(--ink)',
                      fontWeight: 600,
                    }}
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>

            <blockquote
              className="serif"
              style={{
                fontSize: 'clamp(19px, 2vw, 24px)',
                lineHeight: 1.45,
                color: 'var(--ink)',
                margin: '18px 0 22px',
                paddingLeft: '16px',
                borderLeft: '3px solid var(--terracotta)',
              }}
            >
              {pageContent.founderSection.quote}
            </blockquote>
            <Link
              href={pageContent.founderSection.ctaHref || '/contact'}
              prefetch={false}
              className="pill dark"
            >
              {pageContent.founderSection.ctaLabel}
            </Link>
          </div>

          <div className="founder-glance-box">
            <h4
              className="serif"
              style={{
                fontSize: '22px',
                margin: '0 0 12px',
                color: 'var(--ink)',
              }}
            >
              Five Leadership Principles
            </h4>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                gap: '12px',
                fontSize: '13px',
                color: '#3d5c6b',
              }}
            >
              {leadershipValues.map((lv, idx) => (
                <li key={lv.id || lv.title}>
                  <strong>
                    0{idx + 1}. {lv.title}
                  </strong>{' '}
                  <span style={{ display: 'block', marginTop: '2px' }}>
                    {lv.desc}
                  </span>
                </li>
              ))}
              <li style={{ paddingTop: '8px', borderTop: '1px solid var(--line)' }}>
                <strong>Primary Markets:</strong>{' '}
                {pageContent.founderSection.primaryMarketsText}
              </li>
              <li>
                <strong>Support:</strong>{' '}
                {pageContent.founderSection.supportText}
              </li>
            </ul>
          </div>
        </div>

        {/* H. Eight Competitive Advantages (Why Bimondo Travels) */}
        <div className="section-head" style={{ marginTop: '20px' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              06 / WHY BIMONDO TRAVELS · EIGHT COMPETITIVE ADVANTAGES
            </div>
            <h2 className="serif">
              Eight reasons guests{' '}
              <em style={{ color: 'var(--terracotta)' }}>travel with us.</em>
            </h2>
          </div>
          <p>
            Combining personal, private itinerary design from our Battaramulla
            base with an islandwide adventure range, four-star to five-star
            stays, and 24-hour guest support.
          </p>
        </div>

        <div
          className="values-grid"
          style={{
            marginBottom: '60px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          }}
        >
          {competitiveAdvantages.map((adv) => (
            <div
              key={adv.id}
              className="value"
              style={{ borderTopColor: '#c8dbe2' }}
            >
              <span
                className="number"
                style={{ color: 'var(--terracotta)', fontWeight: 700 }}
              >
                {adv.num} / ADVANTAGE
              </span>
              <h3
                className="serif"
                style={{
                  color: 'var(--ink)',
                  fontSize: '23px',
                  margin: '10px 0 8px',
                }}
              >
                {adv.title}
              </h3>
              <p style={{ color: '#557180', lineHeight: 1.75 }}>{adv.desc}</p>
            </div>
          ))}
        </div>

        {/* I. Sustainability and Heritage Preservation */}
        <div className="section-head" style={{ marginTop: '20px' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              16 / SUSTAINABILITY & HERITAGE PRESERVATION
            </div>
            <h2 className="serif">
              Uplifting our people.{' '}
              <em style={{ color: 'var(--terracotta)' }}>
                Preserving our heritage.
              </em>
            </h2>
          </div>
          <p>
            Every journey is designed to benefit local Sri Lankan drivers,
            guides, and family-run businesses while respecting sacred cultural
            sites, ethical wildlife viewing, and natural habitats.
          </p>
        </div>

        <div
          className="values-grid"
          style={{
            marginBottom: '60px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          }}
        >
          {sustainabilityItems.map((sust) => (
            <div
              key={sust.id}
              className="value"
              style={{ borderTopColor: '#c8dbe2' }}
            >
              <span
                className="number"
                style={{ color: 'var(--terracotta)', fontWeight: 700 }}
              >
                {sust.category}
              </span>
              <h3
                className="serif"
                style={{
                  color: 'var(--ink)',
                  fontSize: '23px',
                  margin: '10px 0 8px',
                }}
              >
                {sust.title}
              </h3>
              <p style={{ color: '#557180', lineHeight: 1.75 }}>{sust.desc}</p>
            </div>
          ))}
        </div>

        {/* J. Growth Roadmap (Stages One 2022–2026, Two 2026–2028, Three 2028–2031) */}
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              {pageContent.roadmapSection.eyebrow}
            </div>
            <h2 className="serif">
              {pageContent.roadmapSection.headingPrefix}{' '}
              <em style={{ color: 'var(--terracotta)' }}>
                {pageContent.roadmapSection.headingItalic}
              </em>
            </h2>
          </div>
          <p>{pageContent.roadmapSection.description}</p>
        </div>

        <div className="values-grid" style={{ marginBottom: '60px' }}>
          {growthRoadmap.map((step, idx) => (
            <div
              key={step.id || step.stage}
              className="value"
              style={{ borderTopColor: '#c8dbe2' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <span
                  className="number"
                  style={{ color: 'var(--terracotta)', fontWeight: 700 }}
                >
                  {step.stage}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '999px',
                    background: idx === 0 ? '#e6f4ea' : '#f3eee6',
                    color: idx === 0 ? '#1b5e20' : '#6e5239',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {step.statusLabel ||
                    (idx === 0 ? 'Current Foundation' : 'Future Objective')}
                </span>
              </div>
              <h3
                className="serif"
                style={{
                  color: 'var(--ink)',
                  fontSize: '26px',
                  margin: '12px 0 10px',
                }}
              >
                {step.title}
              </h3>
              <p style={{ color: '#557180', lineHeight: 1.8 }}>{step.desc}</p>
            </div>
          ))}
        </div>

        {/* K. Section 18: Our Promise */}
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '20px',
            padding: 'clamp(28px, 4vw, 44px)',
          }}
        >
          <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
            18 / OUR PROMISE TO EVERY GUEST
          </div>
          <h2
            className="serif"
            style={{
              fontSize: 'clamp(1.85rem, 3.2vw, 2.75rem)',
              lineHeight: 1.15,
              margin: '8px 0 18px',
            }}
          >
            “{closingTagline}”
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '14px',
              marginBottom: '24px',
            }}
          >
            {promiseCommitments.map((item) => (
              <div
                key={item}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  fontSize: '0.9rem',
                  color: 'var(--ink)',
                  lineHeight: 1.55,
                }}
              >
                ✓ {item}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/packages" prefetch={false} className="pill dark">
              EXPLORE 20 SIGNATURE JOURNEYS ↗
            </Link>
            <Link href="/contact" prefetch={false} className="pill">
              PLAN WITH OUR BATTARAMULLA TEAM ↗
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

