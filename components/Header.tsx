'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname?.startsWith(path)) return true;
    return false;
  };

  return (
    <header className={`site-header ${isScrolled ? 'is-scrolled' : ''}`}>
      <div className="wrap nav">
        <Link
          href="/"
          className="brand"
          aria-label="Bimondo home"
          onClick={closeMenu}
        >
          <span className="brand-mark">b</span>
          <span>bimondo</span>
          <span className="brand-sub">TRAVELS</span>
        </Link>

        <nav
          className={`navlinks ${isOpen ? 'open' : ''}`}
          id="navlinks"
          aria-label="Primary Navigation"
        >
          <Link
            href="/destinations"
            className={`nav-item ${isActive('/destinations') ? 'active' : ''}`}
            aria-current={isActive('/destinations') ? 'page' : undefined}
            onClick={closeMenu}
          >
            Destinations
          </Link>
          <Link
            href="/packages"
            className={`nav-item ${isActive('/packages') ? 'active' : ''}`}
            aria-current={isActive('/packages') ? 'page' : undefined}
            onClick={closeMenu}
          >
            Packages
          </Link>
          <Link
            href="/gallery"
            className={`nav-item ${isActive('/gallery') ? 'active' : ''}`}
            aria-current={isActive('/gallery') ? 'page' : undefined}
            onClick={closeMenu}
          >
            Gallery
          </Link>
          <Link
            href="/our-story"
            className={`nav-item ${isActive('/our-story') ? 'active' : ''}`}
            aria-current={isActive('/our-story') ? 'page' : undefined}
            onClick={closeMenu}
          >
            Our story
          </Link>
          <Link
            className="pill dark mobile-nav-cta"
            href="/contact"
            onClick={closeMenu}
          >
            PLAN YOUR JOURNEY ↗
          </Link>
        </nav>

        <Link
          className="pill dark desktop-nav-cta"
          href="/contact"
          onClick={closeMenu}
        >
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
