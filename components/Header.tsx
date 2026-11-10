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
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [optimisticTarget, setOptimisticTarget] = useState<string | null>(null);
  const lastScrollYRef = useRef(0);
  const pathname = usePathname();
  const router = useRouter();

  // Eagerly prefetch all top header navigation routes on mount so navigation is instantaneous
  useEffect(() => {
    NAV_ROUTES.forEach((route) => {
      try {
        router.prefetch(route);
      } catch {
        // ignore prefetch error
      }
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
  }, [pathname]);

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const handlePreload = (targetPath: string) => {
    try {
      router.prefetch(targetPath);
    } catch {
      // ignore
    }
  };

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetPath: string
  ) => {
    e.preventDefault();
    setIsOpen(false);
    setIsHidden(false);

    if (targetPath === pathname) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setOptimisticTarget(targetPath);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    router.push(targetPath);
  };

  const activePathname =
    optimisticTarget && optimisticTarget !== pathname
      ? optimisticTarget
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
          onPointerEnter={() => handlePreload('/')}
          onFocus={() => handlePreload('/')}
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
            prefetch={true}
            className={`nav-item ${isActive('/destinations') ? 'active' : ''}`}
            aria-current={isActive('/destinations') ? 'page' : undefined}
            onPointerEnter={() => handlePreload('/destinations')}
            onFocus={() => handlePreload('/destinations')}
            onClick={(e) => handleNavClick(e, '/destinations')}
          >
            Destinations
          </Link>
          <Link
            href="/packages"
            prefetch={true}
            className={`nav-item ${isActive('/packages') ? 'active' : ''}`}
            aria-current={isActive('/packages') ? 'page' : undefined}
            onPointerEnter={() => handlePreload('/packages')}
            onFocus={() => handlePreload('/packages')}
            onClick={(e) => handleNavClick(e, '/packages')}
          >
            Packages
          </Link>
          <Link
            href="/gallery"
            prefetch={true}
            className={`nav-item ${isActive('/gallery') ? 'active' : ''}`}
            aria-current={isActive('/gallery') ? 'page' : undefined}
            onPointerEnter={() => handlePreload('/gallery')}
            onFocus={() => handlePreload('/gallery')}
            onClick={(e) => handleNavClick(e, '/gallery')}
          >
            Gallery
          </Link>
          <Link
            href="/our-story"
            prefetch={true}
            className={`nav-item ${isActive('/our-story') ? 'active' : ''}`}
            aria-current={isActive('/our-story') ? 'page' : undefined}
            onPointerEnter={() => handlePreload('/our-story')}
            onFocus={() => handlePreload('/our-story')}
            onClick={(e) => handleNavClick(e, '/our-story')}
          >
            Our story
          </Link>
          <Link
            className="pill dark mobile-nav-cta"
            href="/contact"
            prefetch={true}
            onPointerEnter={() => handlePreload('/contact')}
            onFocus={() => handlePreload('/contact')}
            onClick={(e) => handleNavClick(e, '/contact')}
          >
            PLAN YOUR JOURNEY ↗
          </Link>
        </nav>

        <Link
          className="pill dark desktop-nav-cta"
          href="/contact"
          prefetch={true}
          onPointerEnter={() => handlePreload('/contact')}
          onFocus={() => handlePreload('/contact')}
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
