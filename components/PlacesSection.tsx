import React from 'react';
import Image from 'next/image';

export default function PlacesSection() {
  const places = [
    {
      name: 'Sigiriya',
      subtitle: 'Ancient wonders',
      image:
        'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1100&q=85',
      alt: 'Sri Lanka landscape - Sigiriya',
    },
    {
      name: 'Hill Country',
      subtitle: 'Tea & mist',
      image:
        'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=900&q=85',
      alt: 'Green hill country tea plantations',
    },
    {
      name: 'South Coast',
      subtitle: 'Sun & sea',
      image:
        'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=900&q=85',
      alt: 'Coastal landscape in Sri Lanka',
    },
  ];

  return (
    <section className="section wrap">
      <div className="section-head">
        <div>
          <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>
            04 / PLACES THAT STAY WITH YOU
          </div>
          <h2 className="serif">
            One island.
            <br />
            <em style={{ color: 'var(--terracotta)' }}>A thousand worlds.</em>
          </h2>
        </div>
        <p>
          Discover Sri Lanka&apos;s many moods, from rock fortresses and tea
          country to the golden Indian Ocean coast.
        </p>
      </div>

      <div className="places">
        {places.map((place) => (
          <div key={place.name} className="place">
            <Image
              alt={place.alt}
              src={place.image}
              fill
              sizes="(max-width: 720px) 100vw, 33vw"
              className="object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="place-name">
              {place.name}
              <small>{place.subtitle}</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
