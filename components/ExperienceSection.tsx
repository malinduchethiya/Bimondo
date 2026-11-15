'use client';

import React from 'react';
import Link from 'next/link';
import { useSiteCms } from '@/hooks/useSiteCms';
import CmsImage from '@/components/CmsImage';

export default function ExperienceSection() {
  const { cms } = useSiteCms();
  const experienceImg = cms.general.experienceImage || '';

  const experiences = [
    {
      num: '01',
      title: 'Adventure Tours',
      desc: 'Surfing at Weligama (Nov–Apr) & Arugam Bay (May–Oct), white-water rafting & waterfall abseiling in Kitulgala, paramotoring in Bentota, and diving & kite surfing in Kalpitiya.',
    },
    {
      num: '02',
      title: 'Culture & Heritage',
      desc: 'Sigiriya Rock Fortress, Pidurangala, the Temple of the Tooth in Kandy, Dambulla cave temple, and the ancient capitals of Anuradhapura and Polonnaruwa.',
    },
    {
      num: '03',
      title: 'Sea & Sand Escapes',
      desc: 'Relaxed coastal stays in Galle, Unawatuna, Mirissa, Weligama, Bentota, Kalpitiya, and Arugam Bay matched carefully to the island’s seasons.',
    },
    {
      num: '04',
      title: 'Hiking & Wildlife',
      desc: 'Safaris in Yala, Udawalawe, Wilpattu & Minneriya, walks along The Pekoe Trail, Sinharaja rainforest, Horton Plains & World’s End, Little Adam’s Peak, and Ella Rock.',
    },
  ];

  return (
    <section className="section experience" id="discover">
      <div className="wrap">
        <div className="experience-grid">
          <div>
            <div className="eyebrow">03 / WHAT WE DO · FOUR CORE EXPERIENCES</div>
            <h2 className="serif">
              Tailor-made
              <br />
              around <em>how</em>
              <br />
              you travel.
            </h2>
            <p>
              We design and operate private, tailor-made journeys across Sri
              Lanka—combining safety-checked adventure operators, unhurried
              cultural discovery, seasonal coastal stays, and responsible
              wildlife and highland hiking.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link className="pill dark" href="/packages" prefetch={false}>
                VIEW ALL 20 JOURNEYS ↗
              </Link>
              <Link className="pill" href="/contact" prefetch={false}>
                DESIGN A CUSTOM TRIP ↗
              </Link>
            </div>
          </div>

          <div className="experience-photo" style={{ position: 'relative' }}>
            <CmsImage
              alt="Sri Lanka coastal and highland landscapes"
              src={experienceImg}
              fill
              sizes="(max-width: 720px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="experiences">
          {experiences.map((exp) => (
            <div key={exp.num} className="exp">
              <span>✺ {exp.num}</span>
              <b>{exp.title}</b>
              <span>{exp.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
