'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  navigateToRoute,
  normalizeRoutePath,
} from '@/components/InstantRouteManager';
import { useSiteCms } from '@/hooks/useSiteCms';

export default function Header() {
  const { cms } = useSiteCms();
  const headerContent = cms.pages.shared.header;

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

  const isScrolledRef = useRef(false);
  const isHiddenRef = useRef(false);
  const heroThresholdRef = useRef(500);

  useEffect(() => {
    const measureThreshold = () => {
      const heroEl = document.querySelector(
        '.hero, .page-banner'
      ) as HTMLElement | null;
      if (heroEl) {
        heroThresholdRef.current = Math.max(
          120,
          heroEl.offsetTop + heroEl.offsetHeight - 84
        );
      } else {
        heroThresholdRef.current = Math.max(120, window.innerHeight * 0.85);
      }
    };

    measureThreshold();
    window.addEventListener('resize', measureThreshold, { passive: true });

    let ticking = false;

    const updateScrollState = () => {
      ticking = false;
      const currentY = Math.max(0, window.scrollY);
      const prevY = lastScrollYRef.current;
      const delta = currentY - prevY;
      const heroThreshold = heroThresholdRef.current;

      const nextScrolled = currentY > 30;
      if (nextScrolled !== isScrolledRef.current) {
        isScrolledRef.current = nextScrolled;
        setIsScrolled(nextScrolled);
      }

      if (currentY <= heroThreshold) {
        if (isHiddenRef.current) {
          isHiddenRef.current = false;
          setIsHidden(false);
        }
      } else if (delta > 6) {
        if (!isHiddenRef.current) {
          isHiddenRef.current = true;
          setIsHidden(true);
          setIsOpen(false);
        }
      } else if (delta < -6) {
        if (isHiddenRef.current) {
          isHiddenRef.current = false;
          setIsHidden(false);
        }
      }

      lastScrollYRef.current = currentY;
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateScrollState);
      }
    };

    lastScrollYRef.current = Math.max(0, window.scrollY);
    updateScrollState();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', measureThreshold);
      window.removeEventListener('scroll', handleScroll);
    };
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

  if (activePathname.startsWith('/admin')) {
    return null;
  }

  const visibleNavLinks = [...(headerContent.navLinks || [])]
    .filter((link) => link.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt={headerContent.brandName || 'Bimondo Tours'}
            className="brand-logo-img"
            width={160}
            height={64}
            decoding="sync"
            fetchPriority="high"
          />
        </Link>

        <nav
          className={`navlinks ${isOpen ? 'open' : ''}`}
          id="navlinks"
          aria-label="Primary Navigation"
        >
          {visibleNavLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href || '/'}
              prefetch={false}
              className={`nav-item ${isActive(link.href) ? 'active' : ''}`}
              aria-current={isActive(link.href) ? 'page' : undefined}
              onClick={(e) => handleNavClick(e, link.href || '/')}
            >
              {link.label}
            </Link>
          ))}
          <Link
            className="pill dark mobile-nav-cta"
            href={headerContent.ctaHref || '/contact'}
            prefetch={false}
            onClick={(e) =>
              handleNavClick(e, headerContent.ctaHref || '/contact')
            }
          >
            {headerContent.ctaLabel}
          </Link>
        </nav>

        <Link
          className="pill dark desktop-nav-cta"
          href={headerContent.ctaHref || '/contact'}
          prefetch={false}
          onClick={(e) =>
            handleNavClick(e, headerContent.ctaHref || '/contact')
          }
        >
          {headerContent.ctaLabel}
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
