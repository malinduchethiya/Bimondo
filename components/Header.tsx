'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ROUTES = [
  '/',
  '/destinations',
  '/packages',
  '/gallery',
  '/our-story',
  '/contact',
  '/journeys',
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [optimisticNav, setOptimisticNav] = useState<{
    fromPath: string | null;
    targetPath: string;
  } | null>(null);
  const lastScrollYRef = useRef(0);
  const pathname = usePathname();
  const router = useRouter();

  // Eagerly prefetch & warm up all navigation routes so clicking any header button redirects immediately
  useEffect(() => {
    NAV_ROUTES.forEach((route) => {
      router.prefetch(route);
    });
  }, [router]);

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
        // Always show header while within the hero section
        setIsHidden(false);
      } else if (delta > 5) {
        // Scrolling down past the hero section -> hide header and close mobile drawer
        setIsHidden(true);
        setIsOpen(false);
      } else if (delta < -5) {
        // Scrolling up past the hero section -> reveal header
        setIsHidden(false);
      }

      lastScrollYRef.current = currentY;
    };

    lastScrollYRef.current = Math.max(0, window.scrollY);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const handleNavClick = (targetPath: string) => {
    setOptimisticNav({ fromPath: pathname, targetPath });
    setIsOpen(false);
    setIsHidden(false);
  };

  const activePathname =
    optimisticNav && optimisticNav.fromPath === pathname
      ? optimisticNav.targetPath
      : pathname;

  const isActive = (path: string) => {
    if (path === '/' && activePathname === '/') return true;
    if (path !== '/' && activePathname?.startsWith(path)) return true;
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
          prefetch={true}
          className="brand"
          aria-label="Bimondo home"
          onMouseEnter={() => router.prefetch('/')}
          onClick={() => handleNavClick('/')}
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
            prefetch={true}
            className={`nav-item ${isActive('/destinations') ? 'active' : ''}`}
            aria-current={isActive('/destinations') ? 'page' : undefined}
            onMouseEnter={() => router.prefetch('/destinations')}
            onClick={() => handleNavClick('/destinations')}
          >
            Destinations
          </Link>
          <Link
            href="/packages"
            prefetch={true}
            className={`nav-item ${isActive('/packages') ? 'active' : ''}`}
            aria-current={isActive('/packages') ? 'page' : undefined}
            onMouseEnter={() => router.prefetch('/packages')}
            onClick={() => handleNavClick('/packages')}
          >
            Packages
          </Link>
          <Link
            href="/gallery"
            prefetch={true}
            className={`nav-item ${isActive('/gallery') ? 'active' : ''}`}
            aria-current={isActive('/gallery') ? 'page' : undefined}
            onMouseEnter={() => router.prefetch('/gallery')}
            onClick={() => handleNavClick('/gallery')}
          >
            Gallery
          </Link>
          <Link
            href="/our-story"
            prefetch={true}
            className={`nav-item ${isActive('/our-story') ? 'active' : ''}`}
            aria-current={isActive('/our-story') ? 'page' : undefined}
            onMouseEnter={() => router.prefetch('/our-story')}
            onClick={() => handleNavClick('/our-story')}
          >
            Our story
          </Link>
          <Link
            className="pill dark mobile-nav-cta"
            href="/contact"
            prefetch={true}
            onMouseEnter={() => router.prefetch('/contact')}
            onClick={() => handleNavClick('/contact')}
          >
            PLAN YOUR JOURNEY ↗
          </Link>
        </nav>

        <Link
          className="pill dark desktop-nav-cta"
          href="/contact"
          prefetch={true}
          onMouseEnter={() => router.prefetch('/contact')}
          onClick={() => handleNavClick('/contact')}
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
