import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer>
      <div className="wrap">
        <div className="footer-top">
          <div>
            <Link className="brand" href="/" prefetch={false}>
              <span className="brand-mark">b</span>bimondo
            </Link>
            <p>Not a place you visit, but a feeling you carry home.</p>
            <p>
              No. 596/1, Thalangama South, Battaramulla, Sri Lanka · Est. 2022
            </p>
            <p style={{ fontSize: '0.82rem', opacity: 0.78, marginTop: '4px' }}>
              Founded by I.M. Bimsara Illangasinghe · Primary Markets: UK &amp;
              Europe · India · Australia
            </p>
          </div>
          <div className="footer-links">
            <div>
              <b>Explore</b>
              <Link href="/destinations" prefetch={false}>
                Destinations &amp; Day Trips
              </Link>
              <Link href="/packages" prefetch={false}>
                Signature Journeys (20)
              </Link>
              <Link href="/stays" prefetch={false}>
                Accommodation Options
              </Link>
              <Link href="/gallery" prefetch={false}>
                Gallery
              </Link>
              <Link href="/our-story" prefetch={false}>
                Our Story &amp; Values
              </Link>
            </div>
            <div>
              <b>Bookings</b>
              <Link href="/stays" prefetch={false}>
                NightsBridge Stays
              </Link>
              <Link href="/packages" prefetch={false}>
                Bókun &amp; Viator Tours
              </Link>
              <Link href="/booking" prefetch={false}>
                Online Booking Desk
              </Link>
              <Link href="/booking/confirmation" prefetch={false}>
                Verify Booking
              </Link>
              <Link href="/admin" prefetch={false}>
                Admin Panel
              </Link>
            </div>
            <div>
              <b>Contact</b>
              <a href="mailto:tours@bimondo.com">tours@bimondo.com</a>
              <a
                href="https://wa.me/94762232054"
                rel="noopener noreferrer"
                target="_blank"
              >
                +94 76 223 2054 (WhatsApp)
              </a>
              <a
                href="https://www.instagram.com/bimondo.tours/"
                rel="noopener noreferrer"
                target="_blank"
              >
                Instagram: @Bimondo.tours
              </a>
              <span style={{ fontSize: '0.88rem', opacity: 0.8 }}>
                Facebook: Bimondo tours
              </span>
              <span style={{ fontSize: '0.88rem', opacity: 0.8 }}>
                www.bimondotours.com
              </span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {year} Bimondo Travels · No. 596/1, Thalangama South,
            Battaramulla, Sri Lanka.
          </span>
          <span>
            Private, authentic journeys across Sri Lanka · 24-hour local support
          </span>
        </div>
      </div>
    </footer>
  );
}
