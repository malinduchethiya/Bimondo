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
            <p>Battaramulla, Sri Lanka · Est. 2022</p>
          </div>
          <div className="footer-links">
            <div>
              <b>Explore</b>
              <Link href="/destinations" prefetch={false}>Destinations</Link>
              <Link href="/packages" prefetch={false}>Packages</Link>
              <Link href="/stays" prefetch={false}>Boutique Stays</Link>
              <Link href="/gallery" prefetch={false}>Gallery</Link>
              <Link href="/our-story" prefetch={false}>Our story</Link>
            </div>
            <div>
              <b>Bookings</b>
              <Link href="/stays" prefetch={false}>NightsBridge Stays</Link>
              <Link href="/packages" prefetch={false}>Bókun &amp; Viator Tours</Link>
              <Link href="/booking/confirmation" prefetch={false}>Verify Booking</Link>
              <Link href="/admin/booking" prefetch={false}>Admin Settings</Link>
            </div>
            <div>
              <b>Get in touch</b>
              <a href="mailto:tours@bimondo.com">Email us</a>
              <a
                href="https://wa.me/94762232054"
                rel="noopener noreferrer"
                target="_blank"
              >
                WhatsApp
              </a>
              <a
                href="https://www.instagram.com/bimondo.tours/"
                rel="noopener noreferrer"
                target="_blank"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {year} Bimondo Travels. Made with island soul.</span>
          <span>Private journeys · Authentic experiences · Sri Lanka</span>
        </div>
      </div>
    </footer>
  );
}
