import React from 'react';
import Link from 'next/link';
import PageBanner from '@/components/PageBanner';
import StorySection from '@/components/StorySection';

export default function OurStoryPage() {
  const coreValues = [
    {
      number: '01',
      title: 'Authenticity',
      desc: 'We show the real Sri Lanka—local food, working villages, living traditions, and honest conversations.',
    },
    {
      number: '02',
      title: 'Personal Service',
      desc: 'Every traveller is different. We listen carefully, plan thoughtfully, and adapt each itinerary to the people we are hosting.',
    },
    {
      number: '03',
      title: 'Sustainability',
      desc: 'Tourism should protect nature and benefit local communities. We choose responsible wildlife operators, local guides, and locally owned stays wherever possible.',
    },
    {
      number: '04',
      title: 'Innovation',
      desc: 'We combine traditional Sri Lankan hospitality with modern convenience—clear digital itineraries, fast communication via WhatsApp and email, and online booking confirmations.',
    },
    {
      number: '05',
      title: 'Reliability',
      desc: 'Good travel planning means clear communication, punctual transport, dependable guides, and steady support from arrival to departure.',
    },
    {
      number: '06',
      title: 'Respect for Heritage',
      desc: 'We approach Sri Lanka’s sacred places, traditions, and history with care, ensuring every visit is respectful and meaningful.',
    },
  ];

  const leadershipValues = [
    {
      title: 'Personal Accountability',
      desc: 'Direct involvement in trip planning, supplier selection, and guest satisfaction.',
    },
    {
      title: 'Local Knowledge',
      desc: 'First-hand understanding of routes, seasons, hotels, guides, and local communities across Sri Lanka.',
    },
    {
      title: 'Fair Partnerships',
      desc: 'Long-term relationships with drivers, specialist guides, small hotels, and activity providers.',
    },
    {
      title: 'Attention to Detail',
      desc: 'Careful pacing, realistic driving times, and thoughtful touches that make a journey run smoothly.',
    },
    {
      title: 'Continuous Improvement',
      desc: 'Refining itineraries and services based on direct feedback from every guest.',
    },
  ];

  const growthRoadmap = [
    {
      stage: 'STAGE ONE · 2022 – 2026',
      title: 'Foundation',
      desc: 'Establishing Bimondo Travels in Battaramulla, building a trusted network of drivers, guides, and hotel partners, and refining our core tour collection across adventure, culture, coast, and wildlife.',
    },
    {
      stage: 'STAGE TWO · 2026 – 2028',
      title: 'Strengthening Partnerships',
      desc: 'Expanding relationships with overseas travel advisors and tour operators in the UK, Europe, India, and Australia, while enhancing our digital itinerary and online booking tools.',
    },
    {
      stage: 'STAGE THREE · 2028 – 2031',
      title: 'Sustainable Growth',
      desc: 'Developing deeper regional experiences—including walking stages of The Pekoe Trail, community-led rural visits, and conservation-focused wildlife journeys—while keeping our service personal and hands-on.',
    },
  ];

  return (
    <main>
      <PageBanner
        eyebrow="BIMONDO TRAVELS  /  COMPANY PROFILE (2026 EDITION)"
        title="Not a place you visit, but a feeling you carry home."
      />

      {/* Section 01: Origin Story in Thalangama South, Battaramulla */}
      <StorySection />

      {/* Section 02 & 04: Company Identity & Our Home Base in Battaramulla */}
      <section className="section wrap" style={{ paddingTop: '20px' }}>
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              02 / COMPANY IDENTITY &amp; HOME BASE
            </div>
            <h2 className="serif">
              Rooted in Sri Lanka.{' '}
              <em style={{ color: 'var(--terracotta)' }}>Open to the world.</em>
            </h2>
          </div>
          <p>
            Founded in 2022 by I.M. Bimsara Illangasinghe at No. 596/1,
            Thalangama South, Battaramulla, Sri Lanka.
          </p>
        </div>

        <div
          className="values-grid"
          style={{ marginBottom: '56px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
        >
          <div className="value" style={{ borderTopColor: '#c8dbe2' }}>
            <span
              className="number"
              style={{ color: 'var(--terracotta)', fontWeight: 700 }}
            >
              THE NAME &ldquo;BIMONDO&rdquo;
            </span>
            <h3
              className="serif"
              style={{ color: 'var(--ink)', fontSize: '26px', margin: '12px 0 10px' }}
            >
              Bimsara + Mondo
            </h3>
            <p style={{ color: '#557180', lineHeight: 1.8 }}>
              The name <strong>Bimondo</strong> combines a personal echo of the
              founder&apos;s name, Bimsara, with the Italian word{' '}
              <em>mondo</em>—meaning &ldquo;world.&rdquo; It reflects a company
              deeply rooted in Sri Lanka and open to travellers from around the
              world.
            </p>
          </div>

          <div className="value" style={{ borderTopColor: '#c8dbe2' }}>
            <span
              className="number"
              style={{ color: 'var(--terracotta)', fontWeight: 700 }}
            >
              BASE OF OPERATIONS
            </span>
            <h3
              className="serif"
              style={{ color: 'var(--ink)', fontSize: '26px', margin: '12px 0 10px' }}
            >
              Thalangama South, Battaramulla
            </h3>
            <p style={{ color: '#557180', lineHeight: 1.8 }}>
              Located in Sri Lanka&apos;s administrative capital near the
              Parliament complex, Diyawanna Lake, and the historic Kingdom of
              Kotte, our office sits minutes from Colombo and the expressway
              network linking Bandaranaike International Airport (CMB) with the
              south, central hills, and ancient capitals.
            </p>
          </div>

          <div className="value" style={{ borderTopColor: '#c8dbe2' }}>
            <span
              className="number"
              style={{ color: 'var(--terracotta)', fontWeight: 700 }}
            >
              THALANGAMA WETLAND
            </span>
            <h3
              className="serif"
              style={{ color: 'var(--ink)', fontSize: '26px', margin: '12px 0 10px' }}
            >
              Nature on Our Doorstep
            </h3>
            <p style={{ color: '#557180', lineHeight: 1.8 }}>
              Right in our neighbourhood lies the Thalangama Tank and
              Environmental Protection Area—home to over a hundred species of
              resident and migratory birds, purple-faced leaf monkeys, water
              monitors, and quiet village footpaths.
            </p>
          </div>
        </div>

        {/* Section 05: Vision, Mission & Six Core Values */}
        <div className="section-head" style={{ marginTop: '20px' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              05 / VISION, MISSION &amp; SIX CORE VALUES
            </div>
            <h2 className="serif">
              Principles that guide{' '}
              <em style={{ color: 'var(--terracotta)' }}>every itinerary.</em>
            </h2>
          </div>
          <div>
            <p style={{ marginBottom: '10px' }}>
              <strong>Our Vision:</strong> To be a trusted and admired Sri
              Lankan travel company known for authentic experiences, responsible
              tourism, and warm, personal service.
            </p>
            <p>
              <strong>Our Mission:</strong> To design and deliver well-planned
              journeys across Sri Lanka that connect travellers with the
              island&apos;s landscapes, heritage, wildlife, and people—while
              supporting local communities and protecting the places we visit.
            </p>
          </div>
        </div>

        <div className="values-grid" style={{ marginBottom: '60px' }}>
          {coreValues.map((v) => (
            <div
              key={v.number}
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

        {/* Section 03: Founder & Leadership + Section 18: Our Promise */}
        <div className="founder-quote-card" style={{ marginBottom: '60px' }}>
          <div>
            <span className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              03 / FOUNDER &amp; LEADERSHIP · OUR PROMISE
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
              I.M. Bimsara Illangasinghe
            </h3>
            <p style={{ color: '#536f7e', lineHeight: 1.8, marginBottom: '14px' }}>
              <strong>Founder, Bimondo Travels</strong> · Established 2022 ·
              No. 596/1, Thalangama South, Battaramulla, Sri Lanka.
            </p>
            <p style={{ color: '#536f7e', lineHeight: 1.8, marginBottom: '16px' }}>
              Bimondo Travels was founded by I.M. Bimsara Illangasinghe with a
              hands-on approach to travel planning and guest care. Every
              itinerary is shaped with direct attention to route pacing,
              accommodation quality, guide selection, and on-the-ground
              reliability.
            </p>
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
              “When you travel with Bimondo Travels, you are not a booking
              number on a manifest. You are our guest in our home country. We
              promise honest advice before you book, thoughtful planning tailored
              to your interests, reliable people on the ground, respect for Sri
              Lanka’s nature and culture, and a team that stays with you from
              arrival to departure.”
            </blockquote>
            <Link href="/contact" prefetch={false} className="pill dark">
              PLAN YOUR JOURNEY WITH US ↗
            </Link>
          </div>

          <div className="founder-glance-box">
            <h4
              className="serif"
              style={{ fontSize: '22px', margin: '0 0 12px', color: 'var(--ink)' }}
            >
              Leadership Values &amp; At a Glance
            </h4>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                gap: '10px',
                fontSize: '13px',
                color: '#3d5c6b',
              }}
            >
              {leadershipValues.map((lv) => (
                <li key={lv.title}>
                  ✳ <strong>{lv.title}:</strong> {lv.desc}
                </li>
              ))}
              <li>
                ✳ <strong>Primary Markets:</strong> United Kingdom &amp; Europe
                · India · Australia
              </li>
              <li>
                ✳ <strong>Support:</strong> 24-hour on-call assistance (+94 76
                223 2054)
              </li>
            </ul>
          </div>
        </div>

        {/* Section 17: Looking Ahead — Realistic Growth Roadmap */}
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
              17 / LOOKING AHEAD
            </div>
            <h2 className="serif">
              Realistic growth{' '}
              <em style={{ color: 'var(--terracotta)' }}>roadmap.</em>
            </h2>
          </div>
          <p>
            Growing steadily while keeping our service personal, hands-on, and
            grounded in Battaramulla.
          </p>
        </div>

        <div className="values-grid">
          {growthRoadmap.map((step) => (
            <div
              key={step.stage}
              className="value"
              style={{ borderTopColor: '#c8dbe2' }}
            >
              <span
                className="number"
                style={{ color: 'var(--terracotta)', fontWeight: 700 }}
              >
                {step.stage}
              </span>
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
      </section>
    </main>
  );
}
