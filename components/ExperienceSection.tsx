import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ExperienceSection() {
  const experiences = [
    {
      num: '01',
      title: 'Culture',
      desc: 'Temples, kingdoms, traditions and living heritage.',
    },
    {
      num: '02',
      title: 'Wildlife',
      desc: 'Ethical safaris, rainforests and wild encounters.',
    },
    {
      num: '03',
      title: 'Adventure',
      desc: 'Surf, hike, raft and discover a wilder side.',
    },
    {
      num: '04',
      title: 'Slow days',
      desc: 'Coastal hideaways, local food and time to breathe.',
    },
  ];

  return (
    <section className="section experience" id="discover">
      <div className="wrap">
        <div className="experience-grid">
          <div>
            <div className="eyebrow">03 / MORE THAN A HOLIDAY</div>
            <h2 className="serif">
              The Sri Lanka
              <br />
              you <em>feel.</em>
              <br />
              Not just see.
            </h2>
            <p>
              Hear the morning chants in an ancient temple. Share tea in the hills.
              Watch the sun dip behind a palm-fringed coast. We make room for the
              unexpected moments that become your favourite memories.
            </p>
            <Link className="pill dark" href="/contact" prefetch={false}>
              CREATE MY OWN JOURNEY ↗
            </Link>
          </div>

          <div className="experience-photo" style={{ position: 'relative' }}>
            <Image
              alt="Tropical coastal scenery"
              src="https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1100&q=85"
              fill
              sizes="(max-width: 720px) 100vw, 50vw"
              className="object-cover"
              referrerPolicy="no-referrer"
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
