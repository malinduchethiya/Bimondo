'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  navigateToRoute,
  normalizeRoutePath,
} from '@/components/InstantRouteManager';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [clientTarget, setClientTarget] = useState<string | null>(null);
  const lastScrollYRef = useRef(0);
  const pathname = usePathname();

  const activePathname = normalizeRoutePath(clientTarget ?? pathname);

  useEffect(() => {
    const onCustomNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setClientTarget(normalizeRoutePath(customEvent.detail));
      }
    };

    const onPopState = () => {
      setClientTarget(normalizeRoutePath(window.location.pathname));
    };

    window.addEventListener('bimondo:navigate', onCustomNavigate);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('bimondo:navigate', onCustomNavigate);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  useEffect(() => {
    const getHeroThreshold = () => {
      const heroEl = document.querySelector(
        '.hero, .page-banner'
      ) as HTMLElement | null;
      if (heroEl) {
        return Math.max(120, heroEl.offsetTop + heroEl.offsetHeight - 84);
      }
      return Math.max(120, window.innerHeight * 0.85);
    };

    const handleScroll = () => {
      const currentY = Math.max(0, window.scrollY);
      const prevY = lastScrollYRef.current;
      const delta = currentY - prevY;
      const heroThreshold = getHeroThreshold();

      setIsScrolled(currentY > 30);

      if (currentY <= heroThreshold) {
        setIsHidden(false);
      } else if (delta > 5) {
        setIsHidden(true);
        setIsOpen(false);
      } else if (delta < -5) {
        setIsHidden(false);
      }

      lastScrollYRef.current = currentY;
    };

    lastScrollYRef.current = Math.max(0, window.scrollY);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activePathname]);

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetPath: string
  ) => {
    e.preventDefault();
    setIsOpen(false);
    setIsHidden(false);
    setClientTarget(normalizeRoutePath(targetPath));
    navigateToRoute(targetPath);
  };

  const isActive = (path: string) => {
    if (path === '/' && activePathname === '/') return true;
    if (path !== '/' && activePathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header
      className={`site-header ${isScrolled ? 'is-scrolled' : ''} ${
        isHidden && !isOpen ? 'is-hidden' : ''
      }`}
    >
      <div className="wrap nav">
        <Link
          href="/"
          prefetch={false}
          className="brand"
          aria-label="Bimondo home"
          onClick={(e) => handleNavClick(e, '/')}
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
            prefetch={false}
            className={`nav-item ${isActive('/destinations') ? 'active' : ''}`}
            aria-current={isActive('/destinations') ? 'page' : undefined}
            onClick={(e) => handleNavClick(e, '/destinations')}
          >
            Destinations
          </Link>
          <Link
            href="/packages"
            prefetch={false}
            className={`nav-item ${isActive('/packages') ? 'active' : ''}`}
            aria-current={isActive('/packages') ? 'page' : undefined}
            onClick={(e) => handleNavClick(e, '/packages')}
          >
            Packages
          </Link>
          <Link
            href="/stays"
            prefetch={false}
            className={`nav-item ${isActive('/stays') ? 'active' : ''}`}
            aria-current={isActive('/stays') ? 'page' : undefined}
            onClick={(e) => handleNavClick(e, '/stays')}
          >
            Stays
          </Link>
          <Link
            href="/gallery"
            prefetch={false}
            className={`nav-item ${isActive('/gallery') ? 'active' : ''}`}
            aria-current={isActive('/gallery') ? 'page' : undefined}
            onClick={(e) => handleNavClick(e, '/gallery')}
          >
            Gallery
          </Link>
          <Link
            href="/our-story"
            prefetch={false}
            className={`nav-item ${isActive('/our-story') ? 'active' : ''}`}
            aria-current={isActive('/our-story') ? 'page' : undefined}
            onClick={(e) => handleNavClick(e, '/our-story')}
          >
            Our story
          </Link>
          <Link
            className="pill dark mobile-nav-cta"
            href="/contact"
            prefetch={false}
            onClick={(e) => handleNavClick(e, '/contact')}
          >
            PLAN YOUR JOURNEY ↗
          </Link>
        </nav>

        <Link
          className="pill dark desktop-nav-cta"
          href="/contact"
          prefetch={false}
          onClick={(e) => handleNavClick(e, '/contact')}
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
