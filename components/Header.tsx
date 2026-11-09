'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && (pathname === path || pathname.startsWith(path))) return true;
    return false;
  };

  return (
    <header className="site-header">
      <div className="wrap nav">
        <Link
          href="/"
          className="brand"
          aria-label="Bimondo home"
          onClick={closeMenu}
        >
          <span className="brand-mark">b</span>
          bimondo
          <span
            style={{
              fontSize: '10px',
              letterSpacing: '.1em',
              alignSelf: 'flex-end',
              marginBottom: '5px',
              color: '#c8eefa',
            }}
          >
            TRAVELS
          </span>
        </Link>

        <nav className={`navlinks ${isOpen ? 'open' : ''}`} id="navlinks">
          <Link
            href="/destinations"
            aria-current={isActive('/destinations') ? 'page' : undefined}
            onClick={closeMenu}
          >
            Destinations
          </Link>
          <Link
            href="/packages"
            aria-current={isActive('/packages') ? 'page' : undefined}
            onClick={closeMenu}
          >
            Packages
          </Link>
          <Link
            href="/gallery"
            aria-current={isActive('/gallery') ? 'page' : undefined}
            onClick={closeMenu}
          >
            Gallery
          </Link>
          <Link
            href="/our-story"
            aria-current={isActive('/our-story') ? 'page' : undefined}
            onClick={closeMenu}
          >
            Our story
          </Link>
        </nav>

        <Link className="pill dark" href="/contact">
          PLAN YOUR JOURNEY ↗
        </Link>

        <button
          type="button"
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          className="mobile-toggle"
          id="menuBtn"
          onClick={toggleMenu}
        >
          {isOpen ? '×' : '☰'}
        </button>
      </div>
    </header>
  );
}
