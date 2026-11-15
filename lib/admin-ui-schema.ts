import {
  CmsBentoSlideItem,
  CmsColomboExperienceItem,
  CmsDestination,
  CmsFaqItem,
  CmsGalleryPhoto,
  CmsHeroSlideItem,
  CmsImageRef,
  CmsReviewItem,
  CmsStayItem,
  CmsTourItem,
  createImageRef,
  SiteCmsData,
} from '@/lib/cms-defaults';

export type AdminFieldType = 'text' | 'textarea' | 'image';

export interface AdminImageFieldUpdates {
  url?: string;
  alt?: string;
  key?: string | null;
}

export interface AdminFieldItem {
  id: string;
  label: string;
  type: AdminFieldType;
  value: string;
  altText?: string;
  objectKey?: string | null;
  placeholder?: string;
  helperText?: string;
  applyText?: (cms: SiteCmsData, nextValue: string) => SiteCmsData;
  applyImage?: (
    cms: SiteCmsData,
    updates: AdminImageFieldUpdates
  ) => SiteCmsData;
}

export interface AdminSubsection {
  id: string;
  code: string;
  title: string;
  description?: string;
  repeatableItemId?: string;
  visible?: boolean;
  canToggleVisible?: boolean;
  onToggleVisible?: (cms: SiteCmsData) => SiteCmsData;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  canRemove?: boolean;
  onMoveUp?: (cms: SiteCmsData) => SiteCmsData;
  onMoveDown?: (cms: SiteCmsData) => SiteCmsData;
  onRemove?: (cms: SiteCmsData) => SiteCmsData;
  fields: AdminFieldItem[];
}

export interface AdminSection {
  id: string;
  code: string;
  title: string;
  description: string;
  visible?: boolean;
  canToggleSectionVisible?: boolean;
  onToggleSectionVisible?: (cms: SiteCmsData) => SiteCmsData;
  sectionDeleted?: boolean;
  canSoftDeleteSection?: boolean;
  onSoftDeleteSection?: (cms: SiteCmsData) => SiteCmsData;
  addRepeatableLabel?: string;
  onAddRepeatable?: (cms: SiteCmsData) => SiteCmsData;
  subsections: AdminSubsection[];
}

export interface AdminPageSchema {
  id: string;
  title: string;
  routePath: string;
  description: string;
  sections: AdminSection[];
}

function cloneCms(cms: SiteCmsData): SiteCmsData {
  return JSON.parse(JSON.stringify(cms)) as SiteCmsData;
}

function updateImageRef(
  current: CmsImageRef | undefined,
  updates: AdminImageFieldUpdates,
  fallbackAlt = ''
): CmsImageRef {
  const nextUrl =
    updates.url !== undefined ? updates.url : current?.url || '';
  const nextAlt =
    updates.alt !== undefined
      ? updates.alt
      : current?.alt || fallbackAlt || '';
  const nextKey =
    updates.key !== undefined
      ? updates.key
      : updates.url !== undefined && updates.url !== (current?.url || '')
        ? null
        : current?.key ?? null;
  return createImageRef(nextUrl, nextAlt, nextKey);
}

function moveArrayItem<
  T extends { id?: string; order?: number; deletedAt?: string | null },
>(
  list: T[],
  index: number,
  direction: 'up' | 'down',
  allItemsWithDeleted?: T[]
): T[] {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= list.length) {
    return allItemsWithDeleted || list;
  }
  const copy = [...list];
  const [moved] = copy.splice(index, 1);
  copy.splice(targetIndex, 0, moved);
  const reorderedActive = copy.map((item, idx) => ({
    ...item,
    order: idx + 1,
  }));
  if (!allItemsWithDeleted) return reorderedActive;
  const deletedItems = allItemsWithDeleted.filter((it) => Boolean(it.deletedAt));
  return [...reorderedActive, ...deletedItems];
}

function softDeleteItemById<
  T extends { id: string; deletedAt?: string | null; deletedBy?: string | null },
>(allItems: T[], targetId: string, adminUid: string): T[] {
  const nowIso = new Date().toISOString();
  return (allItems || []).map((item) =>
    item.id === targetId
      ? { ...item, deletedAt: nowIso, deletedBy: adminUid }
      : item
  );
}

export function buildAdminPagesFromCms(
  cms: SiteCmsData,
  currentAdminUid = 'admin'
): AdminPageSchema[] {
  const sortedHeroSlides = [...(cms.pages.home.hero.slides || [])]
    .filter((item) => !item.deletedAt)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const sortedBento = [...(cms.bentoDestinations || [])]
    .filter((item) => !item.deletedAt)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const sortedDestinations = [...(cms.destinations || [])]
    .filter((item) => !item.deletedAt)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const sortedColomboExp = [...(cms.colomboExperiences || [])]
    .filter((item) => !item.deletedAt)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const sortedTours = [...(cms.tours || [])]
    .filter((item) => !item.deletedAt)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const sortedStays = [...(cms.stays || [])]
    .filter((item) => !item.deletedAt)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const sortedGallery = [...(cms.gallery || [])]
    .filter((item) => !item.deletedAt)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const sortedReviews = [...(cms.reviews || [])]
    .filter((item) => !item.deletedAt)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const sortedFaqs = [...(cms.faqs || [])]
    .filter((item) => !item.deletedAt)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return [
    // =========================================================================
    // 1. GLOBAL HEADER & FOOTER
    // =========================================================================
    {
      id: 'global-layout',
      title: 'Global Header & Footer',
      routePath: '/',
      description:
        'Shared navigation header, brand lockup, footer links, direct contact channels, and floating CTA button across all public pages.',
      sections: [
        {
          id: 'global-header',
          code: 'SEC 01',
          title: 'Top Navigation Header',
          description:
            'Brand monogram, primary navigation menu links, and header CTA button.',
          subsections: [
            {
              id: 'global-header-brand',
              code: '1.1',
              title: 'Brand Lockup & Header CTA',
              fields: [
                {
                  id: 'header-brand-monogram',
                  label: 'Brand Monogram Letter',
                  type: 'text',
                  value: cms.pages.shared.header.brandMonogram,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.shared.header.brandMonogram = val;
                    return next;
                  },
                },
                {
                  id: 'header-brand-name',
                  label: 'Brand Primary Name',
                  type: 'text',
                  value: cms.pages.shared.header.brandName,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.shared.header.brandName = val;
                    return next;
                  },
                },
                {
                  id: 'header-brand-subtitle',
                  label: 'Brand Subtitle',
                  type: 'text',
                  value: cms.pages.shared.header.brandSubtitle,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.shared.header.brandSubtitle = val;
                    return next;
                  },
                },
                {
                  id: 'header-cta-label',
                  label: 'Primary Header CTA Label',
                  type: 'text',
                  value: cms.pages.shared.header.ctaLabel,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.shared.header.ctaLabel = val;
                    return next;
                  },
                },
                {
                  id: 'header-cta-href',
                  label: 'Primary Header CTA Destination Path',
                  type: 'text',
                  value: cms.pages.shared.header.ctaHref,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.shared.header.ctaHref = val;
                    return next;
                  },
                },
              ],
            },
            {
              id: 'global-header-navlinks',
              code: '1.2',
              title: 'Primary Navigation Links',
              fields: (cms.pages.shared.header.navLinks || []).flatMap(
                (link, idx) => [
                  {
                    id: `header-nav-label-${link.id}`,
                    label: `Nav Item ${idx + 1} Label`,
                    type: 'text' as const,
                    value: link.label,
                    applyText: (prev: SiteCmsData, val: string) => {
                      const next = cloneCms(prev);
                      next.pages.shared.header.navLinks =
                        next.pages.shared.header.navLinks.map((item) =>
                          item.id === link.id ? { ...item, label: val } : item
                        );
                      return next;
                    },
                  },
                  {
                    id: `header-nav-href-${link.id}`,
                    label: `Nav Item ${idx + 1} Destination Path`,
                    type: 'text' as const,
                    value: link.href,
                    applyText: (prev: SiteCmsData, val: string) => {
                      const next = cloneCms(prev);
                      next.pages.shared.header.navLinks =
                        next.pages.shared.header.navLinks.map((item) =>
                          item.id === link.id ? { ...item, href: val } : item
                        );
                      return next;
                    },
                  },
                ]
              ),
            },
          ],
        },
        {
          id: 'global-footer',
          code: 'SEC 02',
          title: 'Site Footer & Floating Quick Action',
          description:
            'Footer company summary, Explore & Bookings link columns, contact details, copyright, and floating Book Now button.',
          subsections: [
            {
              id: 'footer-company-summary',
              code: '2.1',
              title: 'Company Summary, Address & Copyright',
              fields: [
                {
                  id: 'footer-brand-name',
                  label: 'Footer Brand Name',
                  type: 'text',
                  value: cms.pages.shared.footer.brandName,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.shared.footer.brandName = val;
                    return next;
                  },
                },
                {
                  id: 'footer-tagline',
                  label: 'Footer Tagline',
                  type: 'text',
                  value: cms.pages.shared.footer.tagline,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.shared.footer.tagline = val;
                    next.general.tagline = val;
                    return next;
                  },
                },
                {
                  id: 'footer-address',
                  label: 'Office Address Line',
                  type: 'text',
                  value: cms.pages.shared.footer.addressLine,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.shared.footer.addressLine = val;
                    return next;
                  },
                },
                {
                  id: 'footer-founder-markets',
                  label: 'Founder & Primary Markets Line',
                  type: 'textarea',
                  value: cms.pages.shared.footer.founderMarketsLine,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.shared.footer.founderMarketsLine = val;
                    return next;
                  },
                },
                {
                  id: 'footer-copyright-address',
                  label: 'Bottom Left Copyright Text',
                  type: 'text',
                  value: cms.pages.shared.footer.copyrightAddress,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.shared.footer.copyrightAddress = val;
                    return next;
                  },
                },
                {
                  id: 'footer-bottom-right',
                  label: 'Bottom Right Support Note',
                  type: 'text',
                  value: cms.pages.shared.footer.bottomRightNote,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.shared.footer.bottomRightNote = val;
                    return next;
                  },
                },
              ],
            },
            {
              id: 'footer-contact-channels',
              code: '2.2',
              title: 'Direct Contact Channels & Floating CTA',
              fields: [
                {
                  id: 'footer-email',
                  label: 'Contact Email',
                  type: 'text',
                  value: cms.pages.shared.footer.email,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.shared.footer.email = val;
                    next.general.contactEmail = val;
                    return next;
                  },
                },
                {
                  id: 'footer-whatsapp-display',
                  label: 'WhatsApp Display Text',
                  type: 'text',
                  value: cms.pages.shared.footer.whatsappDisplay,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.shared.footer.whatsappDisplay = val;
                    return next;
                  },
                },
                {
                  id: 'footer-whatsapp-url',
                  label: 'WhatsApp Direct URL',
                  type: 'text',
                  value: cms.pages.shared.footer.whatsappUrl,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.shared.footer.whatsappUrl = val;
                    return next;
                  },
                },
                {
                  id: 'footer-instagram-display',
                  label: 'Instagram Display Label',
                  type: 'text',
                  value: cms.pages.shared.footer.instagramDisplay,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.shared.footer.instagramDisplay = val;
                    return next;
                  },
                },
                {
                  id: 'footer-facebook-display',
                  label: 'Facebook Display Label',
                  type: 'text',
                  value: cms.pages.shared.footer.facebookDisplay,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.shared.footer.facebookDisplay = val;
                    return next;
                  },
                },
                {
                  id: 'footer-website-display',
                  label: 'Website Display Label',
                  type: 'text',
                  value: cms.pages.shared.footer.websiteDisplay,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.shared.footer.websiteDisplay = val;
                    return next;
                  },
                },
                {
                  id: 'footer-floating-cta-label',
                  label: 'Floating Action Button Label',
                  type: 'text',
                  value: cms.pages.shared.footer.floatingCtaLabel,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.shared.footer.floatingCtaLabel = val;
                    return next;
                  },
                },
                {
                  id: 'footer-floating-cta-href',
                  label: 'Floating Action Button Destination Path',
                  type: 'text',
                  value: cms.pages.shared.footer.floatingCtaHref,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.shared.footer.floatingCtaHref = val;
                    return next;
                  },
                },
              ],
            },
          ],
        },
      ],
    },

    // =========================================================================
    // 2. HOME PAGE (/)
    // =========================================================================
    {
      id: 'home-page',
      title: 'Home Page',
      routePath: '/',
      description:
        'All 9 sections of the main landing page: Hero, Signature Pillars, Story, Bento Destinations Slider, Experiences, Places Slider, Guest Reviews, Planning & FAQs, and Contact.',
      sections: [
        // SEC 01: Hero
        {
          id: 'home-hero',
          code: 'SEC 01',
          title: 'Hero Section',
          description:
            'Landing hero eyebrow, split serif headline, description, CTA buttons, Tripadvisor rating card, and background slideshow images.',
          visible: cms.pages.home.hero.visible !== false,
          canToggleSectionVisible: true,
          onToggleSectionVisible: (prev) => {
            const next = cloneCms(prev);
            next.pages.home.hero.visible =
              next.pages.home.hero.visible === false;
            return next;
          },
          addRepeatableLabel: 'Add Hero Slide Image',
          onAddRepeatable: (prev) => {
            const next = cloneCms(prev);
            const nextNum = (next.pages.home.hero.slides?.length || 0) + 1;
            const newSlide: CmsHeroSlideItem = {
              id: `hero-slide-${Date.now()}`,
              image: createImageRef('', `Sri Lanka Hero Slide ${nextNum}`),
              visible: true,
              order: nextNum,
            };
            next.pages.home.hero.slides = [
              ...(next.pages.home.hero.slides || []),
              newSlide,
            ];
            return next;
          },
          subsections: [
            {
              id: 'home-hero-copy',
              code: '1.1',
              title: 'Hero Headlines, Lead Copy & Buttons',
              fields: [
                {
                  id: 'hero-eyebrow',
                  label: 'Eyebrow Kicker',
                  type: 'text',
                  value: cms.pages.home.hero.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.hero.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'hero-headline-part1',
                  label: 'Headline Line 1 Prefix',
                  type: 'text',
                  value: cms.pages.home.hero.headlinePart1,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.hero.headlinePart1 = val;
                    return next;
                  },
                },
                {
                  id: 'hero-headline-highlight1',
                  label: 'Headline Line 1 Highlighted Phrase',
                  type: 'text',
                  value: cms.pages.home.hero.headlineHighlight1,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.hero.headlineHighlight1 = val;
                    return next;
                  },
                },
                {
                  id: 'hero-headline-italic',
                  label: 'Headline Line 2 (Italic)',
                  type: 'text',
                  value: cms.pages.home.hero.headlineItalic,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.hero.headlineItalic = val;
                    return next;
                  },
                },
                {
                  id: 'hero-headline-highlight2',
                  label: 'Headline Line 3 Highlighted Phrase',
                  type: 'text',
                  value: cms.pages.home.hero.headlineHighlight2,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.hero.headlineHighlight2 = val;
                    return next;
                  },
                },
                {
                  id: 'hero-description',
                  label: 'Hero Lead Paragraph',
                  type: 'textarea',
                  value: cms.pages.home.hero.description,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.hero.description = val;
                    return next;
                  },
                },
                {
                  id: 'hero-primary-cta-label',
                  label: 'Primary Button Label',
                  type: 'text',
                  value: cms.pages.home.hero.primaryCtaLabel,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.hero.primaryCtaLabel = val;
                    return next;
                  },
                },
                {
                  id: 'hero-primary-cta-href',
                  label: 'Primary Button Destination Path',
                  type: 'text',
                  value: cms.pages.home.hero.primaryCtaHref,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.hero.primaryCtaHref = val;
                    return next;
                  },
                },
                {
                  id: 'hero-secondary-cta-label',
                  label: 'Secondary Button Label',
                  type: 'text',
                  value: cms.pages.home.hero.secondaryCtaLabel,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.hero.secondaryCtaLabel = val;
                    return next;
                  },
                },
                {
                  id: 'hero-secondary-cta-href',
                  label: 'Secondary Button Destination Path',
                  type: 'text',
                  value: cms.pages.home.hero.secondaryCtaHref,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.hero.secondaryCtaHref = val;
                    return next;
                  },
                },
              ],
            },
            {
              id: 'home-hero-tripadvisor',
              code: '1.2',
              title: 'Tripadvisor Rating Badge',
              visible: cms.pages.home.hero.tripadvisorEnabled !== false,
              canToggleVisible: true,
              onToggleVisible: (prev) => {
                const next = cloneCms(prev);
                next.pages.home.hero.tripadvisorEnabled =
                  next.pages.home.hero.tripadvisorEnabled === false;
                return next;
              },
              fields: [
                {
                  id: 'hero-ta-brand',
                  label: 'Badge Brand Name',
                  type: 'text',
                  value: cms.pages.home.hero.tripadvisorBrand,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.hero.tripadvisorBrand = val;
                    return next;
                  },
                },
                {
                  id: 'hero-ta-rating',
                  label: 'Rating Score',
                  type: 'text',
                  value: cms.pages.home.hero.tripadvisorRating,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.hero.tripadvisorRating = val;
                    return next;
                  },
                },
                {
                  id: 'hero-ta-reviews',
                  label: 'Reviews Count Text',
                  type: 'text',
                  value: cms.pages.home.hero.tripadvisorReviewsText,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.hero.tripadvisorReviewsText = val;
                    return next;
                  },
                },
              ],
            },
            ...sortedHeroSlides.map((slide, idx) => ({
              id: `home-hero-slide-${slide.id}`,
              code: `1.${idx + 3}`,
              title: `Hero Background Slide ${idx + 1}`,
              repeatableItemId: slide.id,
              visible: slide.visible !== false,
              canToggleVisible: true,
              onToggleVisible: (prev: SiteCmsData) => {
                const next = cloneCms(prev);
                next.pages.home.hero.slides = next.pages.home.hero.slides.map(
                  (s) =>
                    s.id === slide.id
                      ? { ...s, visible: s.visible === false }
                      : s
                );
                return next;
              },
              canMoveUp: idx > 0,
              canMoveDown: idx < sortedHeroSlides.length - 1,
              canRemove: sortedHeroSlides.length > 1,
              onMoveUp: (prev: SiteCmsData) => {
                const next = cloneCms(prev);
                next.pages.home.hero.slides = moveArrayItem(
                  sortedHeroSlides,
                  idx,
                  'up',
                  next.pages.home.hero.slides
                );
                return next;
              },
              onMoveDown: (prev: SiteCmsData) => {
                const next = cloneCms(prev);
                next.pages.home.hero.slides = moveArrayItem(
                  sortedHeroSlides,
                  idx,
                  'down',
                  next.pages.home.hero.slides
                );
                return next;
              },
              onRemove: (prev: SiteCmsData) => {
                const next = cloneCms(prev);
                next.pages.home.hero.slides = softDeleteItemById(
                  next.pages.home.hero.slides,
                  slide.id,
                  currentAdminUid
                );
                return next;
              },
              fields: [
                {
                  id: `hero-slide-img-${slide.id}`,
                  label: `Slide ${idx + 1} Background Image`,
                  type: 'image' as const,
                  value: slide.image?.url || '',
                  altText:
                    slide.image?.alt || `Sri Lanka Hero Slide ${idx + 1}`,
                  objectKey: slide.image?.key ?? null,
                  applyImage: (
                    prev: SiteCmsData,
                    updates: AdminImageFieldUpdates
                  ) => {
                    const next = cloneCms(prev);
                    next.pages.home.hero.slides =
                      next.pages.home.hero.slides.map((s) =>
                        s.id === slide.id
                          ? {
                              ...s,
                              image: updateImageRef(
                                s.image,
                                updates,
                                `Sri Lanka Hero Slide ${idx + 1}`
                              ),
                            }
                          : s
                      );
                    return next;
                  },
                },
              ],
            })),
          ],
        },

        // SEC 02: Hero Transition Pillars
        {
          id: 'home-transition',
          code: 'SEC 02',
          title: 'Signature Pillars Transition',
          description:
            'Three signature pillar cards displayed immediately below the hero.',
          visible: cms.pages.home.heroTransition.visible !== false,
          canToggleSectionVisible: true,
          onToggleSectionVisible: (prev) => {
            const next = cloneCms(prev);
            next.pages.home.heroTransition.visible =
              next.pages.home.heroTransition.visible === false;
            return next;
          },
          sectionDeleted: Boolean(cms.pages.home.heroTransition.deletedAt),
          canSoftDeleteSection: true,
          onSoftDeleteSection: (prev) => {
            const next = cloneCms(prev);
            const isCurrentlyDeleted = Boolean(
              next.pages.home.heroTransition.deletedAt
            );
            next.pages.home.heroTransition.deletedAt = isCurrentlyDeleted
              ? null
              : new Date().toISOString();
            next.pages.home.heroTransition.deletedBy = isCurrentlyDeleted
              ? null
              : currentAdminUid;
            return next;
          },
          subsections: (cms.pages.home.heroTransition.pillars || []).map(
            (pillar, idx) => ({
              id: `home-pillar-${pillar.id}`,
              code: `2.${idx + 1}`,
              title: `Pillar ${pillar.num}: ${pillar.title}`,
              fields: [
                {
                  id: `pillar-num-${pillar.id}`,
                  label: 'Pillar Number',
                  type: 'text' as const,
                  value: pillar.num,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.pages.home.heroTransition.pillars =
                      next.pages.home.heroTransition.pillars.map((p) =>
                        p.id === pillar.id ? { ...p, num: val } : p
                      );
                    return next;
                  },
                },
                {
                  id: `pillar-badge-${pillar.id}`,
                  label: 'Badge Label',
                  type: 'text' as const,
                  value: pillar.badge,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.pages.home.heroTransition.pillars =
                      next.pages.home.heroTransition.pillars.map((p) =>
                        p.id === pillar.id ? { ...p, badge: val } : p
                      );
                    return next;
                  },
                },
                {
                  id: `pillar-title-${pillar.id}`,
                  label: 'Pillar Title',
                  type: 'text' as const,
                  value: pillar.title,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.pages.home.heroTransition.pillars =
                      next.pages.home.heroTransition.pillars.map((p) =>
                        p.id === pillar.id ? { ...p, title: val } : p
                      );
                    return next;
                  },
                },
                {
                  id: `pillar-desc-${pillar.id}`,
                  label: 'Pillar Description',
                  type: 'textarea' as const,
                  value: pillar.desc,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.pages.home.heroTransition.pillars =
                      next.pages.home.heroTransition.pillars.map((p) =>
                        p.id === pillar.id ? { ...p, desc: val } : p
                      );
                    return next;
                  },
                },
              ],
            })
          ),
        },

        // SEC 03: Our Story Section
        {
          id: 'home-story',
          code: 'SEC 03',
          title: 'Our Story Section (#story)',
          description:
            'Two-image collage and origin story narrative (shared with /our-story).',
          visible: cms.pages.home.story.visible !== false,
          canToggleSectionVisible: true,
          onToggleSectionVisible: (prev) => {
            const next = cloneCms(prev);
            next.pages.home.story.visible =
              next.pages.home.story.visible === false;
            return next;
          },
          sectionDeleted: Boolean(cms.pages.home.story.deletedAt),
          canSoftDeleteSection: true,
          onSoftDeleteSection: (prev) => {
            const next = cloneCms(prev);
            const isCurrentlyDeleted = Boolean(next.pages.home.story.deletedAt);
            next.pages.home.story.deletedAt = isCurrentlyDeleted
              ? null
              : new Date().toISOString();
            next.pages.home.story.deletedBy = isCurrentlyDeleted
              ? null
              : currentAdminUid;
            return next;
          },
          subsections: [
            {
              id: 'home-story-copy',
              code: '3.1',
              title: 'Story Headlines, Paragraphs, Quote & CTA',
              fields: [
                {
                  id: 'story-eyebrow',
                  label: 'Eyebrow',
                  type: 'text',
                  value: cms.pages.home.story.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.story.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'story-h1',
                  label: 'Heading Line 1',
                  type: 'text',
                  value: cms.pages.home.story.headingLine1,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.story.headingLine1 = val;
                    return next;
                  },
                },
                {
                  id: 'story-h2',
                  label: 'Heading Line 2',
                  type: 'text',
                  value: cms.pages.home.story.headingLine2,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.story.headingLine2 = val;
                    return next;
                  },
                },
                {
                  id: 'story-h-italic',
                  label: 'Heading Line 3 (Italic Accent)',
                  type: 'text',
                  value: cms.pages.home.story.headingItalic,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.story.headingItalic = val;
                    return next;
                  },
                },
                {
                  id: 'story-p1',
                  label: 'Paragraph 1',
                  type: 'textarea',
                  value: cms.pages.home.story.paragraph1,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.story.paragraph1 = val;
                    return next;
                  },
                },
                {
                  id: 'story-p2',
                  label: 'Paragraph 2',
                  type: 'textarea',
                  value: cms.pages.home.story.paragraph2,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.story.paragraph2 = val;
                    return next;
                  },
                },
                {
                  id: 'story-quote',
                  label: 'Pull Quote',
                  type: 'text',
                  value: cms.pages.home.story.quote,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.story.quote = val;
                    return next;
                  },
                },
                {
                  id: 'story-cta-label',
                  label: 'CTA Button Label',
                  type: 'text',
                  value: cms.pages.home.story.ctaLabel,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.story.ctaLabel = val;
                    return next;
                  },
                },
                {
                  id: 'story-cta-href',
                  label: 'CTA Button Destination Path',
                  type: 'text',
                  value: cms.pages.home.story.ctaHref,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.story.ctaHref = val;
                    return next;
                  },
                },
              ],
            },
            {
              id: 'home-story-images',
              code: '3.2',
              title: 'Story Collage Images',
              fields: [
                {
                  id: 'story-main-img',
                  label: 'Primary Portrait Image',
                  type: 'image',
                  value: cms.pages.home.story.mainImage?.url || '',
                  altText:
                    cms.pages.home.story.mainImage?.alt ||
                    'Our Story in Sri Lanka',
                  objectKey: cms.pages.home.story.mainImage?.key ?? null,
                  applyImage: (prev, updates) => {
                    const next = cloneCms(prev);
                    next.pages.home.story.mainImage = updateImageRef(
                      next.pages.home.story.mainImage,
                      updates,
                      'Our Story in Sri Lanka'
                    );
                    next.general.storyMainImage =
                      next.pages.home.story.mainImage.url;
                    return next;
                  },
                },
                {
                  id: 'story-secondary-img',
                  label: 'Secondary Inset Image',
                  type: 'image',
                  value: cms.pages.home.story.secondaryImage?.url || '',
                  altText:
                    cms.pages.home.story.secondaryImage?.alt ||
                    'Living cultural traditions of Sri Lanka',
                  objectKey: cms.pages.home.story.secondaryImage?.key ?? null,
                  applyImage: (prev, updates) => {
                    const next = cloneCms(prev);
                    next.pages.home.story.secondaryImage = updateImageRef(
                      next.pages.home.story.secondaryImage,
                      updates,
                      'Living cultural traditions of Sri Lanka'
                    );
                    next.general.storySecondaryImage =
                      next.pages.home.story.secondaryImage.url;
                    return next;
                  },
                },
              ],
            },
          ],
        },

        // SEC 04: Bento Destination Slider
        {
          id: 'home-bento',
          code: 'SEC 04',
          title: 'Bento Destination Slider (#destinations-slider)',
          description:
            'Interactive multi-tile Bento destination showcase with 5 images and regional stories per slide.',
          visible: cms.pages.home.bentoSlider.visible !== false,
          canToggleSectionVisible: true,
          onToggleSectionVisible: (prev) => {
            const next = cloneCms(prev);
            next.pages.home.bentoSlider.visible =
              next.pages.home.bentoSlider.visible === false;
            return next;
          },
          sectionDeleted: Boolean(cms.pages.home.bentoSlider.deletedAt),
          canSoftDeleteSection: true,
          onSoftDeleteSection: (prev) => {
            const next = cloneCms(prev);
            const isCurrentlyDeleted = Boolean(
              next.pages.home.bentoSlider.deletedAt
            );
            next.pages.home.bentoSlider.deletedAt = isCurrentlyDeleted
              ? null
              : new Date().toISOString();
            next.pages.home.bentoSlider.deletedBy = isCurrentlyDeleted
              ? null
              : currentAdminUid;
            return next;
          },
          addRepeatableLabel: 'Add Bento Destination Slide',
          onAddRepeatable: (prev) => {
            const next = cloneCms(prev);
            const nextOrder = (next.bentoDestinations?.length || 0) + 1;
            const template = sortedBento[0];
            const newId = `bento-${Date.now()}`;
            const newSlide: CmsBentoSlideItem = {
              id: newId,
              name: `New Region ${nextOrder}`,
              subtitle: 'Sri Lanka · Featured Region',
              headline: 'Discover Sri Lanka at your own pace',
              description:
                'Private journeys designed around your travel dates, pace, and interests.',
              exploreTitle: 'EXPLORE',
              exploreText: 'Heritage · Landscapes · Local Culture',
              stayTitle: 'STAY',
              stayText: 'Four-star hotels, boutique stays & five-star resorts.',
              cuisineTitle: 'HIGHLIGHTED CUISINE',
              cuisineText: 'Authentic regional Sri Lankan dining.',
              ctaText: 'PLAN THIS REGION ↗',
              ctaTourId: 'grand-island-journey',
              heroImage: '',
              pathwayImage: '',
              tallSceneImage: '',
              natureImage: '',
              cuisineImage: '',
              heroImageRef: createImageRef('', `New Region ${nextOrder}`),
              pathwayImageRef: createImageRef('', 'Pathway view'),
              tallSceneImageRef: createImageRef('', 'Atmospheric view'),
              natureImageRef: createImageRef('', 'Nature view'),
              cuisineImageRef: createImageRef('', 'Cuisine view'),
              theme: template?.theme || {
                frameBg: '#1c262b',
                cardBg: '#253339',
                cardAltBg: '#2c3d44',
                descGradient: 'linear-gradient(145deg, #253339, #1c262b)',
                highlightBg: '#b85d3b',
                ctaGradient: 'linear-gradient(135deg, #b85d3b, #964528)',
                navBg: '#253339',
                navHoverBg: '#344850',
                glowColor: 'rgba(184, 93, 59, 0.25)',
              },
              visible: true,
              order: nextOrder,
            };
            next.bentoDestinations = [
              ...(next.bentoDestinations || []),
              newSlide,
            ];
            return next;
          },
          subsections: [
            {
              id: 'home-bento-controls',
              code: '4.1',
              title: 'Bento Navigation Button Labels',
              fields: [
                {
                  id: 'bento-prev-label',
                  label: 'Previous Slide Button Label',
                  type: 'text',
                  value: cms.pages.home.bentoSlider.prevButtonLabel,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.bentoSlider.prevButtonLabel = val;
                    return next;
                  },
                },
                {
                  id: 'bento-next-label',
                  label: 'Next Slide Button Label',
                  type: 'text',
                  value: cms.pages.home.bentoSlider.nextButtonLabel,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.bentoSlider.nextButtonLabel = val;
                    return next;
                  },
                },
              ],
            },
            ...sortedBento.map((slide, idx) => ({
              id: `home-bento-slide-${slide.id}`,
              code: `4.${idx + 2}`,
              title: `Bento Slide ${idx + 1}: ${slide.name}`,
              repeatableItemId: slide.id,
              visible: slide.visible !== false,
              canToggleVisible: true,
              onToggleVisible: (prev: SiteCmsData) => {
                const next = cloneCms(prev);
                next.bentoDestinations = next.bentoDestinations.map((b) =>
                  b.id === slide.id ? { ...b, visible: b.visible === false } : b
                );
                return next;
              },
              canMoveUp: idx > 0,
              canMoveDown: idx < sortedBento.length - 1,
              canRemove: sortedBento.length > 1,
              onMoveUp: (prev: SiteCmsData) => {
                const next = cloneCms(prev);
                next.bentoDestinations = moveArrayItem(
                  sortedBento,
                  idx,
                  'up',
                  next.bentoDestinations
                );
                return next;
              },
              onMoveDown: (prev: SiteCmsData) => {
                const next = cloneCms(prev);
                next.bentoDestinations = moveArrayItem(
                  sortedBento,
                  idx,
                  'down',
                  next.bentoDestinations
                );
                return next;
              },
              onRemove: (prev: SiteCmsData) => {
                const next = cloneCms(prev);
                next.bentoDestinations = softDeleteItemById(
                  next.bentoDestinations,
                  slide.id,
                  currentAdminUid
                );
                return next;
              },
              fields: [
                {
                  id: `bento-name-${slide.id}`,
                  label: 'Destination Name',
                  type: 'text' as const,
                  value: slide.name,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.bentoDestinations = next.bentoDestinations.map((b) =>
                      b.id === slide.id ? { ...b, name: val } : b
                    );
                    return next;
                  },
                },
                {
                  id: `bento-sub-${slide.id}`,
                  label: 'Subtitle',
                  type: 'text' as const,
                  value: slide.subtitle,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.bentoDestinations = next.bentoDestinations.map((b) =>
                      b.id === slide.id ? { ...b, subtitle: val } : b
                    );
                    return next;
                  },
                },
                {
                  id: `bento-headline-${slide.id}`,
                  label: 'Narrative Headline',
                  type: 'text' as const,
                  value: slide.headline,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.bentoDestinations = next.bentoDestinations.map((b) =>
                      b.id === slide.id ? { ...b, headline: val } : b
                    );
                    return next;
                  },
                },
                {
                  id: `bento-cta-${slide.id}`,
                  label: 'CTA Tile Label',
                  type: 'text' as const,
                  value: slide.ctaText,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.bentoDestinations = next.bentoDestinations.map((b) =>
                      b.id === slide.id ? { ...b, ctaText: val } : b
                    );
                    return next;
                  },
                },
                {
                  id: `bento-desc-${slide.id}`,
                  label: 'Narrative Description',
                  type: 'textarea' as const,
                  value: slide.description,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.bentoDestinations = next.bentoDestinations.map((b) =>
                      b.id === slide.id ? { ...b, description: val } : b
                    );
                    return next;
                  },
                },
                {
                  id: `bento-explore-title-${slide.id}`,
                  label: 'Explore Tile Heading',
                  type: 'text' as const,
                  value: slide.exploreTitle,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.bentoDestinations = next.bentoDestinations.map((b) =>
                      b.id === slide.id ? { ...b, exploreTitle: val } : b
                    );
                    return next;
                  },
                },
                {
                  id: `bento-explore-text-${slide.id}`,
                  label: 'Explore Tile Copy',
                  type: 'text' as const,
                  value: slide.exploreText,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.bentoDestinations = next.bentoDestinations.map((b) =>
                      b.id === slide.id ? { ...b, exploreText: val } : b
                    );
                    return next;
                  },
                },
                {
                  id: `bento-stay-title-${slide.id}`,
                  label: 'Stay Tile Heading',
                  type: 'text' as const,
                  value: slide.stayTitle,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.bentoDestinations = next.bentoDestinations.map((b) =>
                      b.id === slide.id ? { ...b, stayTitle: val } : b
                    );
                    return next;
                  },
                },
                {
                  id: `bento-stay-text-${slide.id}`,
                  label: 'Stay Tile Copy',
                  type: 'text' as const,
                  value: slide.stayText,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.bentoDestinations = next.bentoDestinations.map((b) =>
                      b.id === slide.id ? { ...b, stayText: val } : b
                    );
                    return next;
                  },
                },
                {
                  id: `bento-cuisine-title-${slide.id}`,
                  label: 'Cuisine Tile Heading',
                  type: 'text' as const,
                  value: slide.cuisineTitle,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.bentoDestinations = next.bentoDestinations.map((b) =>
                      b.id === slide.id ? { ...b, cuisineTitle: val } : b
                    );
                    return next;
                  },
                },
                {
                  id: `bento-cuisine-text-${slide.id}`,
                  label: 'Cuisine Tile Copy',
                  type: 'text' as const,
                  value: slide.cuisineText,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.bentoDestinations = next.bentoDestinations.map((b) =>
                      b.id === slide.id ? { ...b, cuisineText: val } : b
                    );
                    return next;
                  },
                },
                {
                  id: `bento-hero-img-${slide.id}`,
                  label: '1. Hero Banner Image',
                  type: 'image' as const,
                  value: slide.heroImageRef?.url || slide.heroImage || '',
                  altText: slide.heroImageRef?.alt || slide.name,
                  objectKey: slide.heroImageRef?.key ?? null,
                  applyImage: (prev: SiteCmsData, updates: AdminImageFieldUpdates) => {
                    const next = cloneCms(prev);
                    next.bentoDestinations = next.bentoDestinations.map((b) => {
                      if (b.id !== slide.id) return b;
                      const ref = updateImageRef(
                        b.heroImageRef,
                        updates,
                        b.name
                      );
                      return { ...b, heroImage: ref.url, heroImageRef: ref };
                    });
                    return next;
                  },
                },
                {
                  id: `bento-pathway-img-${slide.id}`,
                  label: '2. Pathway Image',
                  type: 'image' as const,
                  value: slide.pathwayImageRef?.url || slide.pathwayImage || '',
                  altText:
                    slide.pathwayImageRef?.alt || `${slide.name} pathway`,
                  objectKey: slide.pathwayImageRef?.key ?? null,
                  applyImage: (prev: SiteCmsData, updates: AdminImageFieldUpdates) => {
                    const next = cloneCms(prev);
                    next.bentoDestinations = next.bentoDestinations.map((b) => {
                      if (b.id !== slide.id) return b;
                      const ref = updateImageRef(
                        b.pathwayImageRef,
                        updates,
                        `${b.name} pathway`
                      );
                      return {
                        ...b,
                        pathwayImage: ref.url,
                        pathwayImageRef: ref,
                      };
                    });
                    return next;
                  },
                },
                {
                  id: `bento-tall-img-${slide.id}`,
                  label: '3. Tall Atmospheric Scene Image',
                  type: 'image' as const,
                  value:
                    slide.tallSceneImageRef?.url || slide.tallSceneImage || '',
                  altText:
                    slide.tallSceneImageRef?.alt || `${slide.name} atmosphere`,
                  objectKey: slide.tallSceneImageRef?.key ?? null,
                  applyImage: (prev: SiteCmsData, updates: AdminImageFieldUpdates) => {
                    const next = cloneCms(prev);
                    next.bentoDestinations = next.bentoDestinations.map((b) => {
                      if (b.id !== slide.id) return b;
                      const ref = updateImageRef(
                        b.tallSceneImageRef,
                        updates,
                        `${b.name} atmosphere`
                      );
                      return {
                        ...b,
                        tallSceneImage: ref.url,
                        tallSceneImageRef: ref,
                      };
                    });
                    return next;
                  },
                },
                {
                  id: `bento-nature-img-${slide.id}`,
                  label: '4. Nature / Botanical Image',
                  type: 'image' as const,
                  value: slide.natureImageRef?.url || slide.natureImage || '',
                  altText: slide.natureImageRef?.alt || `${slide.name} nature`,
                  objectKey: slide.natureImageRef?.key ?? null,
                  applyImage: (prev: SiteCmsData, updates: AdminImageFieldUpdates) => {
                    const next = cloneCms(prev);
                    next.bentoDestinations = next.bentoDestinations.map((b) => {
                      if (b.id !== slide.id) return b;
                      const ref = updateImageRef(
                        b.natureImageRef,
                        updates,
                        `${b.name} nature`
                      );
                      return {
                        ...b,
                        natureImage: ref.url,
                        natureImageRef: ref,
                      };
                    });
                    return next;
                  },
                },
                {
                  id: `bento-cuisine-img-${slide.id}`,
                  label: '5. Cuisine Card Image',
                  type: 'image' as const,
                  value: slide.cuisineImageRef?.url || slide.cuisineImage || '',
                  altText:
                    slide.cuisineImageRef?.alt || `${slide.name} cuisine`,
                  objectKey: slide.cuisineImageRef?.key ?? null,
                  applyImage: (prev: SiteCmsData, updates: AdminImageFieldUpdates) => {
                    const next = cloneCms(prev);
                    next.bentoDestinations = next.bentoDestinations.map((b) => {
                      if (b.id !== slide.id) return b;
                      const ref = updateImageRef(
                        b.cuisineImageRef,
                        updates,
                        `${b.name} cuisine`
                      );
                      return {
                        ...b,
                        cuisineImage: ref.url,
                        cuisineImageRef: ref,
                      };
                    });
                    return next;
                  },
                },
              ],
            })),
          ],
        },

        // SEC 05: Experience Section
        {
          id: 'home-experience',
          code: 'SEC 05',
          title: 'Experience Section (#discover)',
          description:
            'Four core experience pillars, buttons, and featured landscape image.',
          visible: cms.pages.home.experience.visible !== false,
          canToggleSectionVisible: true,
          onToggleSectionVisible: (prev) => {
            const next = cloneCms(prev);
            next.pages.home.experience.visible =
              next.pages.home.experience.visible === false;
            return next;
          },
          sectionDeleted: Boolean(cms.pages.home.experience.deletedAt),
          canSoftDeleteSection: true,
          onSoftDeleteSection: (prev) => {
            const next = cloneCms(prev);
            const isCurrentlyDeleted = Boolean(
              next.pages.home.experience.deletedAt
            );
            next.pages.home.experience.deletedAt = isCurrentlyDeleted
              ? null
              : new Date().toISOString();
            next.pages.home.experience.deletedBy = isCurrentlyDeleted
              ? null
              : currentAdminUid;
            return next;
          },
          subsections: [
            {
              id: 'home-exp-intro',
              code: '5.1',
              title: 'Section Heading, Buttons & Feature Image',
              fields: [
                {
                  id: 'exp-eyebrow',
                  label: 'Eyebrow',
                  type: 'text',
                  value: cms.pages.home.experience.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.experience.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'exp-h1',
                  label: 'Heading Line 1',
                  type: 'text',
                  value: cms.pages.home.experience.headingLine1,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.experience.headingLine1 = val;
                    return next;
                  },
                },
                {
                  id: 'exp-h2-prefix',
                  label: 'Heading Line 2 Prefix',
                  type: 'text',
                  value: cms.pages.home.experience.headingLine2Prefix,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.experience.headingLine2Prefix = val;
                    return next;
                  },
                },
                {
                  id: 'exp-h2-italic',
                  label: 'Heading Line 2 Italic Word',
                  type: 'text',
                  value: cms.pages.home.experience.headingItalic,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.experience.headingItalic = val;
                    return next;
                  },
                },
                {
                  id: 'exp-h3',
                  label: 'Heading Line 3',
                  type: 'text',
                  value: cms.pages.home.experience.headingLine3,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.experience.headingLine3 = val;
                    return next;
                  },
                },
                {
                  id: 'exp-desc',
                  label: 'Description Paragraph',
                  type: 'textarea',
                  value: cms.pages.home.experience.description,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.experience.description = val;
                    return next;
                  },
                },
                {
                  id: 'exp-btn1-label',
                  label: 'Primary Button Label',
                  type: 'text',
                  value: cms.pages.home.experience.primaryCtaLabel,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.experience.primaryCtaLabel = val;
                    return next;
                  },
                },
                {
                  id: 'exp-btn1-href',
                  label: 'Primary Button Destination Path',
                  type: 'text',
                  value: cms.pages.home.experience.primaryCtaHref,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.experience.primaryCtaHref = val;
                    return next;
                  },
                },
                {
                  id: 'exp-btn2-label',
                  label: 'Secondary Button Label',
                  type: 'text',
                  value: cms.pages.home.experience.secondaryCtaLabel,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.experience.secondaryCtaLabel = val;
                    return next;
                  },
                },
                {
                  id: 'exp-btn2-href',
                  label: 'Secondary Button Destination Path',
                  type: 'text',
                  value: cms.pages.home.experience.secondaryCtaHref,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.experience.secondaryCtaHref = val;
                    return next;
                  },
                },
                {
                  id: 'exp-feature-img',
                  label: 'Experience Feature Image',
                  type: 'image',
                  value: cms.pages.home.experience.featureImage?.url || '',
                  altText:
                    cms.pages.home.experience.featureImage?.alt ||
                    'Sri Lanka coastal and highland landscapes',
                  objectKey:
                    cms.pages.home.experience.featureImage?.key ?? null,
                  applyImage: (prev, updates) => {
                    const next = cloneCms(prev);
                    next.pages.home.experience.featureImage = updateImageRef(
                      next.pages.home.experience.featureImage,
                      updates,
                      'Sri Lanka coastal and highland landscapes'
                    );
                    next.general.experienceImage =
                      next.pages.home.experience.featureImage.url;
                    return next;
                  },
                },
              ],
            },
            {
              id: 'home-exp-items',
              code: '5.2',
              title: 'Four Experience Pillars (01 – 04)',
              fields: (cms.pages.home.experience.items || []).flatMap(
                (item) => [
                  {
                    id: `exp-item-title-${item.id}`,
                    label: `Pillar ${item.num} Title`,
                    type: 'text' as const,
                    value: item.title,
                    applyText: (prev: SiteCmsData, val: string) => {
                      const next = cloneCms(prev);
                      next.pages.home.experience.items =
                        next.pages.home.experience.items.map((it) =>
                          it.id === item.id ? { ...it, title: val } : it
                        );
                      return next;
                    },
                  },
                  {
                    id: `exp-item-desc-${item.id}`,
                    label: `Pillar ${item.num} Description`,
                    type: 'textarea' as const,
                    value: item.desc,
                    applyText: (prev: SiteCmsData, val: string) => {
                      const next = cloneCms(prev);
                      next.pages.home.experience.items =
                        next.pages.home.experience.items.map((it) =>
                          it.id === item.id ? { ...it, desc: val } : it
                        );
                      return next;
                    },
                  },
                ]
              ),
            },
          ],
        },

        // SEC 06: Places Staggered Slider
        {
          id: 'home-places',
          code: 'SEC 06',
          title: 'Places Staggered Slider (#places)',
          description:
            'Section header and regional destination cards displayed in the staggered carousel.',
          visible: cms.pages.home.places.visible !== false,
          canToggleSectionVisible: true,
          onToggleSectionVisible: (prev) => {
            const next = cloneCms(prev);
            next.pages.home.places.visible =
              next.pages.home.places.visible === false;
            return next;
          },
          sectionDeleted: Boolean(cms.pages.home.places.deletedAt),
          canSoftDeleteSection: true,
          onSoftDeleteSection: (prev) => {
            const next = cloneCms(prev);
            const isCurrentlyDeleted = Boolean(
              next.pages.home.places.deletedAt
            );
            next.pages.home.places.deletedAt = isCurrentlyDeleted
              ? null
              : new Date().toISOString();
            next.pages.home.places.deletedBy = isCurrentlyDeleted
              ? null
              : currentAdminUid;
            return next;
          },
          subsections: [
            {
              id: 'home-places-header',
              code: '6.1',
              title: 'Places Section Header & CTA',
              fields: [
                {
                  id: 'places-eyebrow',
                  label: 'Eyebrow',
                  type: 'text',
                  value: cms.pages.home.places.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.places.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'places-h1',
                  label: 'Heading Line 1',
                  type: 'text',
                  value: cms.pages.home.places.headingLine1,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.places.headingLine1 = val;
                    return next;
                  },
                },
                {
                  id: 'places-h-italic',
                  label: 'Heading Line 2 (Italic)',
                  type: 'text',
                  value: cms.pages.home.places.headingItalic,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.places.headingItalic = val;
                    return next;
                  },
                },
                {
                  id: 'places-desc',
                  label: 'Description Paragraph',
                  type: 'textarea',
                  value: cms.pages.home.places.description,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.places.description = val;
                    return next;
                  },
                },
                {
                  id: 'places-cta-label',
                  label: 'CTA Button Label',
                  type: 'text',
                  value: cms.pages.home.places.ctaLabel,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.places.ctaLabel = val;
                    return next;
                  },
                },
                {
                  id: 'places-cta-href',
                  label: 'CTA Button Destination Path',
                  type: 'text',
                  value: cms.pages.home.places.ctaHref,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.places.ctaHref = val;
                    return next;
                  },
                },
              ],
            },
          ],
        },

        // SEC 07: Guest Thoughts & Reviews
        {
          id: 'home-reviews',
          code: 'SEC 07',
          title: 'Guest Thoughts & Reviews (#why)',
          description:
            'Sliding guest review cards and portraits. Supports adding, removing, and reordering reviews.',
          visible: cms.pages.home.valuesReviews.visible !== false,
          canToggleSectionVisible: true,
          onToggleSectionVisible: (prev) => {
            const next = cloneCms(prev);
            next.pages.home.valuesReviews.visible =
              next.pages.home.valuesReviews.visible === false;
            return next;
          },
          sectionDeleted: Boolean(cms.pages.home.valuesReviews.deletedAt),
          canSoftDeleteSection: true,
          onSoftDeleteSection: (prev) => {
            const next = cloneCms(prev);
            const isCurrentlyDeleted = Boolean(
              next.pages.home.valuesReviews.deletedAt
            );
            next.pages.home.valuesReviews.deletedAt = isCurrentlyDeleted
              ? null
              : new Date().toISOString();
            next.pages.home.valuesReviews.deletedBy = isCurrentlyDeleted
              ? null
              : currentAdminUid;
            return next;
          },
          addRepeatableLabel: 'Add Guest Review Card',
          onAddRepeatable: (prev) => {
            const next = cloneCms(prev);
            const nextOrder = (next.reviews?.length || 0) + 1;
            const newReview: CmsReviewItem = {
              id: `thought-${Date.now()}`,
              name: `New Guest ${nextOrder}`,
              location: 'United Kingdom',
              rating: 5,
              tour: 'Custom Sri Lanka Journey',
              date: 'Visited 2026',
              quote:
                '“A thoughtfully planned private journey across Sri Lanka with warm local hospitality.”',
              image: '',
              imageRef: createImageRef('', `New Guest ${nextOrder}`),
              visible: true,
              order: nextOrder,
            };
            next.reviews = [...(next.reviews || []), newReview];
            return next;
          },
          subsections: [
            {
              id: 'home-reviews-header',
              code: '7.1',
              title: 'Reviews Section Heading',
              fields: [
                {
                  id: 'reviews-eyebrow',
                  label: 'Eyebrow',
                  type: 'text',
                  value: cms.pages.home.valuesReviews.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.valuesReviews.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'reviews-heading-prefix',
                  label: 'Heading Prefix',
                  type: 'text',
                  value: cms.pages.home.valuesReviews.headingPrefix,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.valuesReviews.headingPrefix = val;
                    return next;
                  },
                },
                {
                  id: 'reviews-heading-italic',
                  label: 'Heading Italic Word',
                  type: 'text',
                  value: cms.pages.home.valuesReviews.headingItalic,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.valuesReviews.headingItalic = val;
                    return next;
                  },
                },
              ],
            },
            ...sortedReviews.map((rev, idx) => ({
              id: `home-review-${rev.id}`,
              code: `7.${idx + 2}`,
              title: `Review ${idx + 1}: ${rev.name}`,
              repeatableItemId: rev.id,
              visible: rev.visible !== false,
              canToggleVisible: true,
              onToggleVisible: (prev: SiteCmsData) => {
                const next = cloneCms(prev);
                next.reviews = next.reviews.map((r) =>
                  r.id === rev.id ? { ...r, visible: r.visible === false } : r
                );
                return next;
              },
              canMoveUp: idx > 0,
              canMoveDown: idx < sortedReviews.length - 1,
              canRemove: sortedReviews.length > 1,
              onMoveUp: (prev: SiteCmsData) => {
                const next = cloneCms(prev);
                next.reviews = moveArrayItem(
                  sortedReviews,
                  idx,
                  'up',
                  next.reviews
                );
                return next;
              },
              onMoveDown: (prev: SiteCmsData) => {
                const next = cloneCms(prev);
                next.reviews = moveArrayItem(
                  sortedReviews,
                  idx,
                  'down',
                  next.reviews
                );
                return next;
              },
              onRemove: (prev: SiteCmsData) => {
                const next = cloneCms(prev);
                next.reviews = softDeleteItemById(
                  next.reviews,
                  rev.id,
                  currentAdminUid
                );
                return next;
              },
              fields: [
                {
                  id: `rev-name-${rev.id}`,
                  label: 'Guest Name',
                  type: 'text' as const,
                  value: rev.name,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.reviews = next.reviews.map((r) =>
                      r.id === rev.id ? { ...r, name: val } : r
                    );
                    return next;
                  },
                },
                {
                  id: `rev-loc-${rev.id}`,
                  label: 'Country / Location',
                  type: 'text' as const,
                  value: rev.location,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.reviews = next.reviews.map((r) =>
                      r.id === rev.id ? { ...r, location: val } : r
                    );
                    return next;
                  },
                },
                {
                  id: `rev-tour-${rev.id}`,
                  label: 'Journey Name',
                  type: 'text' as const,
                  value: rev.tour,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.reviews = next.reviews.map((r) =>
                      r.id === rev.id ? { ...r, tour: val } : r
                    );
                    return next;
                  },
                },
                {
                  id: `rev-quote-${rev.id}`,
                  label: 'Testimonial Quote',
                  type: 'textarea' as const,
                  value: rev.quote,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.reviews = next.reviews.map((r) =>
                      r.id === rev.id ? { ...r, quote: val } : r
                    );
                    return next;
                  },
                },
                {
                  id: `rev-img-${rev.id}`,
                  label: 'Guest Avatar Image',
                  type: 'image' as const,
                  value: rev.imageRef?.url || rev.image || '',
                  altText: rev.imageRef?.alt || rev.name,
                  objectKey: rev.imageRef?.key ?? null,
                  applyImage: (prev: SiteCmsData, updates: AdminImageFieldUpdates) => {
                    const next = cloneCms(prev);
                    next.reviews = next.reviews.map((r) => {
                      if (r.id !== rev.id) return r;
                      const ref = updateImageRef(r.imageRef, updates, r.name);
                      return { ...r, image: ref.url, imageRef: ref };
                    });
                    return next;
                  },
                },
              ],
            })),
          ],
        },

        // SEC 08: Planning & FAQ Section
        {
          id: 'home-planning-faq',
          code: 'SEC 08',
          title: 'Planning & FAQ Section (#planning-faq)',
          description:
            '7-step guest journey process and filterable FAQ list on the home page.',
          visible: cms.pages.home.planningFaq.visible !== false,
          canToggleSectionVisible: true,
          onToggleSectionVisible: (prev) => {
            const next = cloneCms(prev);
            next.pages.home.planningFaq.visible =
              next.pages.home.planningFaq.visible === false;
            return next;
          },
          sectionDeleted: Boolean(cms.pages.home.planningFaq.deletedAt),
          canSoftDeleteSection: true,
          onSoftDeleteSection: (prev) => {
            const next = cloneCms(prev);
            const isCurrentlyDeleted = Boolean(
              next.pages.home.planningFaq.deletedAt
            );
            next.pages.home.planningFaq.deletedAt = isCurrentlyDeleted
              ? null
              : new Date().toISOString();
            next.pages.home.planningFaq.deletedBy = isCurrentlyDeleted
              ? null
              : currentAdminUid;
            return next;
          },
          addRepeatableLabel: 'Add Home FAQ Item',
          onAddRepeatable: (prev) => {
            const next = cloneCms(prev);
            const nextOrder = (next.faqs?.length || 0) + 1;
            const newFaq: CmsFaqItem = {
              id: `faq-${Date.now()}`,
              category: 'private',
              q: 'New frequently asked question?',
              a: 'Enter the clear answer for travellers here.',
              visible: true,
              order: nextOrder,
            };
            next.faqs = [...(next.faqs || []), newFaq];
            return next;
          },
          subsections: [
            {
              id: 'home-planning-header',
              code: '8.1',
              title: 'Planning Headings, 7 Steps & FAQ Header',
              fields: [
                {
                  id: 'plan-eyebrow',
                  label: 'Eyebrow',
                  type: 'text',
                  value: cms.pages.home.planningFaq.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.planningFaq.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'plan-h1',
                  label: 'Heading Line 1',
                  type: 'text',
                  value: cms.pages.home.planningFaq.headingLine1,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.planningFaq.headingLine1 = val;
                    return next;
                  },
                },
                {
                  id: 'plan-h-italic',
                  label: 'Heading Line 2 (Italic)',
                  type: 'text',
                  value: cms.pages.home.planningFaq.headingItalic,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.planningFaq.headingItalic = val;
                    return next;
                  },
                },
                {
                  id: 'plan-lead',
                  label: 'Lead Paragraph',
                  type: 'textarea',
                  value: cms.pages.home.planningFaq.lead,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.planningFaq.lead = val;
                    return next;
                  },
                },
                {
                  id: 'plan-cta-kicker',
                  label: 'Step CTA Card Kicker',
                  type: 'text',
                  value: cms.pages.home.planningFaq.stepCtaKicker,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.planningFaq.stepCtaKicker = val;
                    return next;
                  },
                },
                {
                  id: 'plan-cta-label',
                  label: 'Step CTA Card Label',
                  type: 'text',
                  value: cms.pages.home.planningFaq.stepCtaLabel,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.planningFaq.stepCtaLabel = val;
                    return next;
                  },
                },
                {
                  id: 'plan-faq-eyebrow',
                  label: 'Right Column FAQ Eyebrow',
                  type: 'text',
                  value: cms.pages.home.planningFaq.faqEyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.planningFaq.faqEyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'plan-faq-heading',
                  label: 'Right Column FAQ Heading',
                  type: 'text',
                  value: cms.pages.home.planningFaq.faqHeading,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.planningFaq.faqHeading = val;
                    return next;
                  },
                },
              ],
            },
            {
              id: 'home-planning-steps',
              code: '8.2',
              title: 'Seven Guest Journey Steps (01 – 07)',
              fields: (cms.pages.home.planningFaq.steps || []).flatMap(
                (step) => [
                  {
                    id: `plan-step-title-${step.id}`,
                    label: `Step ${step.num} Title`,
                    type: 'text' as const,
                    value: step.title,
                    applyText: (prev: SiteCmsData, val: string) => {
                      const next = cloneCms(prev);
                      next.pages.home.planningFaq.steps =
                        next.pages.home.planningFaq.steps.map((s) =>
                          s.id === step.id ? { ...s, title: val } : s
                        );
                      return next;
                    },
                  },
                  {
                    id: `plan-step-desc-${step.id}`,
                    label: `Step ${step.num} Description`,
                    type: 'text' as const,
                    value: step.desc,
                    applyText: (prev: SiteCmsData, val: string) => {
                      const next = cloneCms(prev);
                      next.pages.home.planningFaq.steps =
                        next.pages.home.planningFaq.steps.map((s) =>
                          s.id === step.id ? { ...s, desc: val } : s
                        );
                      return next;
                    },
                  },
                ]
              ),
            },
            ...sortedFaqs.map((faq, idx) => ({
              id: `home-faq-${faq.id}`,
              code: `8.${idx + 3}`,
              title: `FAQ ${idx + 1}: ${faq.q}`,
              repeatableItemId: faq.id,
              visible: faq.visible !== false,
              canToggleVisible: true,
              onToggleVisible: (prev: SiteCmsData) => {
                const next = cloneCms(prev);
                next.faqs = next.faqs.map((f) =>
                  f.id === faq.id ? { ...f, visible: f.visible === false } : f
                );
                return next;
              },
              canMoveUp: idx > 0,
              canMoveDown: idx < sortedFaqs.length - 1,
              canRemove: sortedFaqs.length > 1,
              onMoveUp: (prev: SiteCmsData) => {
                const next = cloneCms(prev);
                next.faqs = moveArrayItem(sortedFaqs, idx, 'up', next.faqs);
                return next;
              },
              onMoveDown: (prev: SiteCmsData) => {
                const next = cloneCms(prev);
                next.faqs = moveArrayItem(sortedFaqs, idx, 'down', next.faqs);
                return next;
              },
              onRemove: (prev: SiteCmsData) => {
                const next = cloneCms(prev);
                next.faqs = softDeleteItemById(
                  next.faqs,
                  faq.id,
                  currentAdminUid
                );
                return next;
              },
              fields: [
                {
                  id: `faq-cat-${faq.id}`,
                  label: 'Category (private / stays / booking)',
                  type: 'text' as const,
                  value: faq.category,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    const normalizedCat =
                      val === 'stays' || val === 'booking' ? val : 'private';
                    next.faqs = next.faqs.map((f) =>
                      f.id === faq.id ? { ...f, category: normalizedCat } : f
                    );
                    return next;
                  },
                },
                {
                  id: `faq-q-${faq.id}`,
                  label: 'Question',
                  type: 'text' as const,
                  value: faq.q,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.faqs = next.faqs.map((f) =>
                      f.id === faq.id ? { ...f, q: val } : f
                    );
                    return next;
                  },
                },
                {
                  id: `faq-a-${faq.id}`,
                  label: 'Answer',
                  type: 'textarea' as const,
                  value: faq.a,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.faqs = next.faqs.map((f) =>
                      f.id === faq.id ? { ...f, a: val } : f
                    );
                    return next;
                  },
                },
              ],
            })),
          ],
        },

        // SEC 09: Contact & Multi-Channel Booking Section
        {
          id: 'home-contact',
          code: 'SEC 09',
          title: 'Contact & Multi-Channel Booking (#contact)',
          description:
            'Contact & booking form section displayed on Home and /contact.',
          visible: cms.pages.home.contactSection.visible !== false,
          canToggleSectionVisible: true,
          onToggleSectionVisible: (prev) => {
            const next = cloneCms(prev);
            next.pages.home.contactSection.visible =
              next.pages.home.contactSection.visible === false;
            return next;
          },
          sectionDeleted: Boolean(cms.pages.home.contactSection.deletedAt),
          canSoftDeleteSection: true,
          onSoftDeleteSection: (prev) => {
            const next = cloneCms(prev);
            const isCurrentlyDeleted = Boolean(
              next.pages.home.contactSection.deletedAt
            );
            next.pages.home.contactSection.deletedAt = isCurrentlyDeleted
              ? null
              : new Date().toISOString();
            next.pages.home.contactSection.deletedBy = isCurrentlyDeleted
              ? null
              : currentAdminUid;
            return next;
          },
          subsections: [
            {
              id: 'home-contact-copy',
              code: '9.1',
              title: 'Headings, Lead Copy & Footnote',
              fields: [
                {
                  id: 'contact-eyebrow',
                  label: 'Eyebrow',
                  type: 'text',
                  value: cms.pages.home.contactSection.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.contactSection.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'contact-h1',
                  label: 'Heading Line 1',
                  type: 'text',
                  value: cms.pages.home.contactSection.headingLine1,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.contactSection.headingLine1 = val;
                    return next;
                  },
                },
                {
                  id: 'contact-h2',
                  label: 'Heading Line 2',
                  type: 'text',
                  value: cms.pages.home.contactSection.headingLine2,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.contactSection.headingLine2 = val;
                    return next;
                  },
                },
                {
                  id: 'contact-h-italic',
                  label: 'Heading Line 3 (Italic)',
                  type: 'text',
                  value: cms.pages.home.contactSection.headingItalic,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.contactSection.headingItalic = val;
                    return next;
                  },
                },
                {
                  id: 'contact-lead',
                  label: 'Lead Paragraph',
                  type: 'textarea',
                  value: cms.pages.home.contactSection.lead,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.contactSection.lead = val;
                    return next;
                  },
                },
                {
                  id: 'contact-footnote',
                  label: 'Form Footnote',
                  type: 'text',
                  value: cms.pages.home.contactSection.footnote,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.home.contactSection.footnote = val;
                    return next;
                  },
                },
              ],
            },
          ],
        },
      ],
    },

    // =========================================================================
    // 3. DESTINATIONS PAGE (/destinations)
    // =========================================================================
    {
      id: 'destinations-page',
      title: 'Destinations Page',
      routePath: '/destinations',
      description:
        'Page banner, regional destination guides, Colombo & Battaramulla day experiences, and custom routing CTA box.',
      sections: [
        {
          id: 'dest-banner-intro',
          code: 'SEC 01',
          title: 'Banner, Regional Intro & Custom CTA Box',
          description:
            'Page banner, regional section heading, and bottom custom routing CTA box on /destinations.',
          subsections: [
            {
              id: 'dest-banner-sub',
              code: '1.1',
              title: 'Top Page Banner',
              fields: [
                {
                  id: 'dest-banner-eyebrow',
                  label: 'Banner Eyebrow',
                  type: 'text',
                  value: cms.pages.destinationsPage.banner.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.destinationsPage.banner.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'dest-banner-title',
                  label: 'Banner Title',
                  type: 'text',
                  value: cms.pages.destinationsPage.banner.title,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.destinationsPage.banner.title = val;
                    return next;
                  },
                },
              ],
            },
            {
              id: 'dest-regional-intro-sub',
              code: '1.2',
              title: 'Regional Section Heading & Card Button Labels',
              fields: [
                {
                  id: 'dest-reg-eyebrow',
                  label: 'Eyebrow',
                  type: 'text',
                  value: cms.pages.destinationsPage.regionalSection.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.destinationsPage.regionalSection.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'dest-reg-h1',
                  label: 'Heading Line 1',
                  type: 'text',
                  value:
                    cms.pages.destinationsPage.regionalSection.headingLine1,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.destinationsPage.regionalSection.headingLine1 =
                      val;
                    return next;
                  },
                },
                {
                  id: 'dest-reg-h2-prefix',
                  label: 'Heading Line 2 Prefix',
                  type: 'text',
                  value:
                    cms.pages.destinationsPage.regionalSection
                      .headingLine2Prefix,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.destinationsPage.regionalSection.headingLine2Prefix =
                      val;
                    return next;
                  },
                },
                {
                  id: 'dest-reg-h-italic',
                  label: 'Heading Line 2 Italic',
                  type: 'text',
                  value:
                    cms.pages.destinationsPage.regionalSection.headingItalic,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.destinationsPage.regionalSection.headingItalic =
                      val;
                    return next;
                  },
                },
                {
                  id: 'dest-reg-desc',
                  label: 'Section Description',
                  type: 'textarea',
                  value: cms.pages.destinationsPage.regionalSection.description,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.destinationsPage.regionalSection.description =
                      val;
                    return next;
                  },
                },
                {
                  id: 'dest-reg-tours-btn',
                  label: 'Card Secondary Button Label',
                  type: 'text',
                  value:
                    cms.pages.destinationsPage.regionalSection.toursButtonLabel,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.destinationsPage.regionalSection.toursButtonLabel =
                      val;
                    return next;
                  },
                },
                {
                  id: 'dest-reg-book-btn',
                  label: 'Card Primary Button Label',
                  type: 'text',
                  value:
                    cms.pages.destinationsPage.regionalSection.bookButtonLabel,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.destinationsPage.regionalSection.bookButtonLabel =
                      val;
                    return next;
                  },
                },
              ],
            },
            {
              id: 'dest-custom-cta-sub',
              code: '1.3',
              title: 'Bottom Custom Routing CTA Box',
              fields: [
                {
                  id: 'dest-cta-eyebrow',
                  label: 'Eyebrow',
                  type: 'text',
                  value: cms.pages.destinationsPage.customCtaBox.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.destinationsPage.customCtaBox.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'dest-cta-heading',
                  label: 'Heading',
                  type: 'text',
                  value: cms.pages.destinationsPage.customCtaBox.heading,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.destinationsPage.customCtaBox.heading = val;
                    return next;
                  },
                },
                {
                  id: 'dest-cta-desc',
                  label: 'Description',
                  type: 'textarea',
                  value: cms.pages.destinationsPage.customCtaBox.description,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.destinationsPage.customCtaBox.description = val;
                    return next;
                  },
                },
                {
                  id: 'dest-cta-btn1',
                  label: 'Primary Button Label',
                  type: 'text',
                  value:
                    cms.pages.destinationsPage.customCtaBox.primaryCtaLabel,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.destinationsPage.customCtaBox.primaryCtaLabel =
                      val;
                    return next;
                  },
                },
                {
                  id: 'dest-cta-btn2',
                  label: 'Secondary Button Label',
                  type: 'text',
                  value:
                    cms.pages.destinationsPage.customCtaBox.secondaryCtaLabel,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.destinationsPage.customCtaBox.secondaryCtaLabel =
                      val;
                    return next;
                  },
                },
              ],
            },
          ],
        },
        {
          id: 'dest-regions',
          code: 'SEC 02',
          title: `Regional Destinations (${sortedDestinations.length})`,
          description:
            'Destination cards shown on /destinations and in the Home Places slider. Supports add, remove, and reorder.',
          addRepeatableLabel: 'Add Destination Card',
          onAddRepeatable: (prev) => {
            const next = cloneCms(prev);
            const nextOrder = (next.destinations?.length || 0) + 1;
            const newDest: CmsDestination = {
              id: `dest-${Date.now()}`,
              name: `New Sri Lanka Region ${nextOrder}`,
              region: 'culture',
              regionLabel: 'Culture and Heritage',
              season: 'Year-round',
              tagline: 'Private guided discovery across Sri Lanka',
              description:
                'Explore authentic regional highlights with private transport and a licensed local guide.',
              highlights: ['Private guided visits', 'Tailor-made pacing'],
              image: '',
              imageRef: createImageRef(
                '',
                `New Sri Lanka Region ${nextOrder}`
              ),
              staggerVariant: 'mid-up',
              visible: true,
              order: nextOrder,
            };
            next.destinations = [...(next.destinations || []), newDest];
            return next;
          },
          subsections: sortedDestinations.map((dest, idx) => ({
            id: `dest-item-${dest.id}`,
            code: `2.${idx + 1}`,
            title: `${dest.name}`,
            repeatableItemId: dest.id,
            visible: dest.visible !== false,
            canToggleVisible: true,
            onToggleVisible: (prev: SiteCmsData) => {
              const next = cloneCms(prev);
              next.destinations = next.destinations.map((d) =>
                d.id === dest.id ? { ...d, visible: d.visible === false } : d
              );
              return next;
            },
            canMoveUp: idx > 0,
            canMoveDown: idx < sortedDestinations.length - 1,
            canRemove: sortedDestinations.length > 1,
            onMoveUp: (prev: SiteCmsData) => {
              const next = cloneCms(prev);
              next.destinations = moveArrayItem(
                sortedDestinations,
                idx,
                'up',
                next.destinations
              );
              return next;
            },
            onMoveDown: (prev: SiteCmsData) => {
              const next = cloneCms(prev);
              next.destinations = moveArrayItem(
                sortedDestinations,
                idx,
                'down',
                next.destinations
              );
              return next;
            },
            onRemove: (prev: SiteCmsData) => {
              const next = cloneCms(prev);
              next.destinations = softDeleteItemById(
                next.destinations,
                dest.id,
                currentAdminUid
              );
              return next;
            },
            fields: [
              {
                id: `dest-name-${dest.id}`,
                label: 'Destination Title',
                type: 'text' as const,
                value: dest.name,
                applyText: (prev: SiteCmsData, val: string) => {
                  const next = cloneCms(prev);
                  next.destinations = next.destinations.map((d) =>
                    d.id === dest.id ? { ...d, name: val } : d
                  );
                  return next;
                },
              },
              {
                id: `dest-region-label-${dest.id}`,
                label: 'Region Category Label',
                type: 'text' as const,
                value: dest.regionLabel,
                applyText: (prev: SiteCmsData, val: string) => {
                  const next = cloneCms(prev);
                  next.destinations = next.destinations.map((d) =>
                    d.id === dest.id ? { ...d, regionLabel: val } : d
                  );
                  return next;
                },
              },
              {
                id: `dest-season-${dest.id}`,
                label: 'Best Season Badge',
                type: 'text' as const,
                value: dest.season,
                applyText: (prev: SiteCmsData, val: string) => {
                  const next = cloneCms(prev);
                  next.destinations = next.destinations.map((d) =>
                    d.id === dest.id ? { ...d, season: val } : d
                  );
                  return next;
                },
              },
              {
                id: `dest-tagline-${dest.id}`,
                label: 'Tagline',
                type: 'text' as const,
                value: dest.tagline,
                applyText: (prev: SiteCmsData, val: string) => {
                  const next = cloneCms(prev);
                  next.destinations = next.destinations.map((d) =>
                    d.id === dest.id ? { ...d, tagline: val } : d
                  );
                  return next;
                },
              },
              {
                id: `dest-desc-${dest.id}`,
                label: 'Description',
                type: 'textarea' as const,
                value: dest.description,
                applyText: (prev: SiteCmsData, val: string) => {
                  const next = cloneCms(prev);
                  next.destinations = next.destinations.map((d) =>
                    d.id === dest.id ? { ...d, description: val } : d
                  );
                  return next;
                },
              },
              {
                id: `dest-highlights-${dest.id}`,
                label: 'Documented Highlights (one per line)',
                type: 'textarea' as const,
                value: (dest.highlights || []).join('\n'),
                applyText: (prev: SiteCmsData, val: string) => {
                  const next = cloneCms(prev);
                  const lines = val
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  next.destinations = next.destinations.map((d) =>
                    d.id === dest.id ? { ...d, highlights: lines } : d
                  );
                  return next;
                },
              },
              {
                id: `dest-img-${dest.id}`,
                label: 'Destination Image',
                type: 'image' as const,
                value: dest.imageRef?.url || dest.image || '',
                altText: dest.imageRef?.alt || dest.name,
                objectKey: dest.imageRef?.key ?? null,
                applyImage: (prev: SiteCmsData, updates: AdminImageFieldUpdates) => {
                  const next = cloneCms(prev);
                  next.destinations = next.destinations.map((d) => {
                    if (d.id !== dest.id) return d;
                    const ref = updateImageRef(d.imageRef, updates, d.name);
                    return { ...d, image: ref.url, imageRef: ref };
                  });
                  return next;
                },
              },
            ],
          })),
        },
        {
          id: 'dest-colombo-day',
          code: 'SEC 03',
          title: `Colombo & Battaramulla Day Experiences (${sortedColomboExp.length})`,
          description:
            'Half-day and full-day experiences operated from our Battaramulla base (shared with /packages and /booking).',
          addRepeatableLabel: 'Add Colombo Day Experience',
          onAddRepeatable: (prev) => {
            const next = cloneCms(prev);
            const nextOrder = (next.colomboExperiences?.length || 0) + 1;
            const newExp: CmsColomboExperienceItem = {
              id: `colombo-exp-${Date.now()}`,
              name: `New Day Experience ${nextOrder}`,
              duration: 'Half-Day',
              location: 'Colombo & Battaramulla',
              description:
                'Guided local experience operated from our base in Thalangama South, Battaramulla.',
              highlights: 'Private transport, local specialist guide',
              image: '',
              imageRef: createImageRef('', `New Day Experience ${nextOrder}`),
              visible: true,
              order: nextOrder,
            };
            next.colomboExperiences = [
              ...(next.colomboExperiences || []),
              newExp,
            ];
            return next;
          },
          subsections: [
            {
              id: 'dest-colombo-intro',
              code: '3.1',
              title: 'Colombo Day Experiences Section Header',
              fields: [
                {
                  id: 'dest-col-eyebrow',
                  label: 'Eyebrow',
                  type: 'text',
                  value: cms.pages.destinationsPage.colomboSection.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.destinationsPage.colomboSection.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'dest-col-h-prefix',
                  label: 'Heading Prefix',
                  type: 'text',
                  value:
                    cms.pages.destinationsPage.colomboSection.headingPrefix,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.destinationsPage.colomboSection.headingPrefix =
                      val;
                    return next;
                  },
                },
                {
                  id: 'dest-col-h-italic',
                  label: 'Heading Italic',
                  type: 'text',
                  value:
                    cms.pages.destinationsPage.colomboSection.headingItalic,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.destinationsPage.colomboSection.headingItalic =
                      val;
                    return next;
                  },
                },
                {
                  id: 'dest-col-desc',
                  label: 'Section Description',
                  type: 'textarea',
                  value: cms.pages.destinationsPage.colomboSection.description,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.destinationsPage.colomboSection.description =
                      val;
                    return next;
                  },
                },
              ],
            },
            ...sortedColomboExp.map((exp, idx) => ({
              id: `colombo-exp-${exp.id}`,
              code: `3.${idx + 2}`,
              title: `${exp.name} (${exp.duration})`,
              repeatableItemId: exp.id,
              visible: exp.visible !== false,
              canToggleVisible: true,
              onToggleVisible: (prev: SiteCmsData) => {
                const next = cloneCms(prev);
                next.colomboExperiences = next.colomboExperiences.map((e) =>
                  e.id === exp.id ? { ...e, visible: e.visible === false } : e
                );
                return next;
              },
              canMoveUp: idx > 0,
              canMoveDown: idx < sortedColomboExp.length - 1,
              canRemove: sortedColomboExp.length > 1,
              onMoveUp: (prev: SiteCmsData) => {
                const next = cloneCms(prev);
                next.colomboExperiences = moveArrayItem(
                  sortedColomboExp,
                  idx,
                  'up',
                  next.colomboExperiences
                );
                return next;
              },
              onMoveDown: (prev: SiteCmsData) => {
                const next = cloneCms(prev);
                next.colomboExperiences = moveArrayItem(
                  sortedColomboExp,
                  idx,
                  'down',
                  next.colomboExperiences
                );
                return next;
              },
              onRemove: (prev: SiteCmsData) => {
                const next = cloneCms(prev);
                next.colomboExperiences = softDeleteItemById(
                  next.colomboExperiences,
                  exp.id,
                  currentAdminUid
                );
                return next;
              },
              fields: [
                {
                  id: `col-exp-name-${exp.id}`,
                  label: 'Experience Title',
                  type: 'text' as const,
                  value: exp.name,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.colomboExperiences = next.colomboExperiences.map((e) =>
                      e.id === exp.id ? { ...e, name: val } : e
                    );
                    return next;
                  },
                },
                {
                  id: `col-exp-duration-${exp.id}`,
                  label: 'Duration Label',
                  type: 'text' as const,
                  value: exp.duration,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.colomboExperiences = next.colomboExperiences.map((e) =>
                      e.id === exp.id ? { ...e, duration: val } : e
                    );
                    return next;
                  },
                },
                {
                  id: `col-exp-location-${exp.id}`,
                  label: 'Location',
                  type: 'text' as const,
                  value: exp.location,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.colomboExperiences = next.colomboExperiences.map((e) =>
                      e.id === exp.id ? { ...e, location: val } : e
                    );
                    return next;
                  },
                },
                {
                  id: `col-exp-desc-${exp.id}`,
                  label: 'Description',
                  type: 'textarea' as const,
                  value: exp.description,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.colomboExperiences = next.colomboExperiences.map((e) =>
                      e.id === exp.id ? { ...e, description: val } : e
                    );
                    return next;
                  },
                },
                {
                  id: `col-exp-highlights-${exp.id}`,
                  label: 'Highlights',
                  type: 'textarea' as const,
                  value: Array.isArray(exp.highlights)
                    ? exp.highlights.join(', ')
                    : exp.highlights,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.colomboExperiences = next.colomboExperiences.map((e) =>
                      e.id === exp.id ? { ...e, highlights: val } : e
                    );
                    return next;
                  },
                },
                {
                  id: `col-exp-img-${exp.id}`,
                  label: 'Day Experience Image',
                  type: 'image' as const,
                  value: exp.imageRef?.url || exp.image || '',
                  altText: exp.imageRef?.alt || exp.name,
                  objectKey: exp.imageRef?.key ?? null,
                  applyImage: (prev: SiteCmsData, updates: AdminImageFieldUpdates) => {
                    const next = cloneCms(prev);
                    next.colomboExperiences = next.colomboExperiences.map(
                      (e) => {
                        if (e.id !== exp.id) return e;
                        const ref = updateImageRef(e.imageRef, updates, e.name);
                        return { ...e, image: ref.url, imageRef: ref };
                      }
                    );
                    return next;
                  },
                },
              ],
            })),
          ],
        },
      ],
    },

    // =========================================================================
    // 4. PACKAGES & JOURNEYS PAGE (/packages)
    // =========================================================================
    {
      id: 'packages-page',
      title: 'Packages & Journeys Page',
      routePath: '/packages',
      description:
        'Page banner, qualification disclaimer, all signature private journeys, and custom itinerary CTA box.',
      sections: [
        {
          id: 'pkg-banner',
          code: 'SEC 01',
          title: 'Packages Banner, Intro & Custom CTA Box',
          description:
            'Top banner, intro headings, qualification notice, and bottom custom CTA box on /packages.',
          subsections: [
            {
              id: 'pkg-banner-copy',
              code: '1.1',
              title: 'Banner & Intro Section',
              fields: [
                {
                  id: 'pkg-banner-eyebrow',
                  label: 'Banner Eyebrow',
                  type: 'text',
                  value: cms.pages.packagesPage.banner.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.packagesPage.banner.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'pkg-banner-title',
                  label: 'Banner Title',
                  type: 'text',
                  value: cms.pages.packagesPage.banner.title,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.packagesPage.banner.title = val;
                    return next;
                  },
                },
                {
                  id: 'pkg-intro-eyebrow',
                  label: 'Intro Eyebrow',
                  type: 'text',
                  value: cms.pages.packagesPage.introSection.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.packagesPage.introSection.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'pkg-intro-h-prefix',
                  label: 'Intro Heading Prefix',
                  type: 'text',
                  value: cms.pages.packagesPage.introSection.headingPrefix,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.packagesPage.introSection.headingPrefix = val;
                    return next;
                  },
                },
                {
                  id: 'pkg-intro-h-italic',
                  label: 'Intro Heading Italic',
                  type: 'text',
                  value: cms.pages.packagesPage.introSection.headingItalic,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.packagesPage.introSection.headingItalic = val;
                    return next;
                  },
                },
                {
                  id: 'pkg-intro-desc',
                  label: 'Intro Description',
                  type: 'textarea',
                  value: cms.pages.packagesPage.introSection.description,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.packagesPage.introSection.description = val;
                    return next;
                  },
                },
                {
                  id: 'pkg-qualification-notice',
                  label: 'Qualification Disclaimer Notice',
                  type: 'textarea',
                  value:
                    cms.pages.packagesPage.introSection.qualificationNotice,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.packagesPage.introSection.qualificationNotice =
                      val;
                    return next;
                  },
                },
              ],
            },
            {
              id: 'pkg-custom-cta-sub',
              code: '1.2',
              title: 'Bottom Custom Itinerary CTA Box',
              fields: [
                {
                  id: 'pkg-cta-eyebrow',
                  label: 'Eyebrow',
                  type: 'text',
                  value: cms.pages.packagesPage.customCtaBox.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.packagesPage.customCtaBox.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'pkg-cta-heading',
                  label: 'Heading',
                  type: 'text',
                  value: cms.pages.packagesPage.customCtaBox.heading,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.packagesPage.customCtaBox.heading = val;
                    return next;
                  },
                },
                {
                  id: 'pkg-cta-desc',
                  label: 'Description',
                  type: 'textarea',
                  value: cms.pages.packagesPage.customCtaBox.description,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.packagesPage.customCtaBox.description = val;
                    return next;
                  },
                },
              ],
            },
          ],
        },
        {
          id: 'pkg-tours-list',
          code: 'SEC 02',
          title: `Signature Multi-Day Journeys (${sortedTours.length} Tours)`,
          description:
            'Edit title, duration, route, description, highlights, and cover image for each tour. Supports add, remove, and reorder.',
          addRepeatableLabel: 'Add Tour Package',
          onAddRepeatable: (prev) => {
            const next = cloneCms(prev);
            const nextOrder = (next.tours?.length || 0) + 1;
            const defaultTheme = next.tours?.[0]?.theme || {
              primary: '#853e28',
              accent: '#d87046',
              bgGradient:
                'linear-gradient(145deg, rgba(254, 240, 233, 0.94) 0%, rgba(246, 228, 218, 0.75) 50%, rgba(252, 244, 238, 0.9) 100%)',
              glowColor: 'rgba(216, 112, 70, 0.26)',
              cardBorder: 'rgba(216, 112, 70, 0.35)',
              tagBg: '#fae3d7',
              tagColor: '#78331e',
            };
            const newTour: CmsTourItem = {
              id: `tour-${Date.now()}`,
              name: `New Private Journey ${nextOrder}`,
              days: 8,
              durationLabel: '8 Days / 7 Nights',
              category: 'heritage',
              categoryLabel: 'Culture, Heritage & Island Circuits',
              route: 'Colombo → Cultural Triangle → Kandy → South Coast',
              highlights: 'Private transport, licensed guide, handpicked stays',
              description:
                'A custom-designed private itinerary matched to your travel dates and preferred accommodation tier.',
              image: '',
              imageRef: createImageRef('', `New Private Journey ${nextOrder}`),
              theme: defaultTheme,
              visible: true,
              order: nextOrder,
            };
            next.tours = [...(next.tours || []), newTour];
            return next;
          },
          subsections: sortedTours.map((tour, idx) => ({
            id: `pkg-tour-${tour.id}`,
            code: `2.${idx + 1}`,
            title: `${tour.name} (${tour.durationLabel || `${tour.days} Days`})`,
            repeatableItemId: tour.id,
            visible: tour.visible !== false,
            canToggleVisible: true,
            onToggleVisible: (prev: SiteCmsData) => {
              const next = cloneCms(prev);
              next.tours = next.tours.map((t) =>
                t.id === tour.id ? { ...t, visible: t.visible === false } : t
              );
              return next;
            },
            canMoveUp: idx > 0,
            canMoveDown: idx < sortedTours.length - 1,
            canRemove: sortedTours.length > 1,
            onMoveUp: (prev: SiteCmsData) => {
              const next = cloneCms(prev);
              next.tours = moveArrayItem(sortedTours, idx, 'up', next.tours);
              return next;
            },
            onMoveDown: (prev: SiteCmsData) => {
              const next = cloneCms(prev);
              next.tours = moveArrayItem(sortedTours, idx, 'down', next.tours);
              return next;
            },
            onRemove: (prev: SiteCmsData) => {
              const next = cloneCms(prev);
              next.tours = softDeleteItemById(
                next.tours,
                tour.id,
                currentAdminUid
              );
              return next;
            },
            fields: [
              {
                id: `tour-name-${tour.id}`,
                label: 'Tour Name',
                type: 'text' as const,
                value: tour.name,
                applyText: (prev: SiteCmsData, val: string) => {
                  const next = cloneCms(prev);
                  next.tours = next.tours.map((t) =>
                    t.id === tour.id ? { ...t, name: val } : t
                  );
                  return next;
                },
              },
              {
                id: `tour-duration-${tour.id}`,
                label: 'Duration Badge Label',
                type: 'text' as const,
                value: tour.durationLabel || `${tour.days} Days`,
                applyText: (prev: SiteCmsData, val: string) => {
                  const next = cloneCms(prev);
                  next.tours = next.tours.map((t) =>
                    t.id === tour.id ? { ...t, durationLabel: val } : t
                  );
                  return next;
                },
              },
              {
                id: `tour-category-${tour.id}`,
                label: 'Category Label',
                type: 'text' as const,
                value: tour.categoryLabel,
                applyText: (prev: SiteCmsData, val: string) => {
                  const next = cloneCms(prev);
                  next.tours = next.tours.map((t) =>
                    t.id === tour.id ? { ...t, categoryLabel: val } : t
                  );
                  return next;
                },
              },
              {
                id: `tour-route-${tour.id}`,
                label: 'Route Summary',
                type: 'text' as const,
                value: Array.isArray(tour.route)
                  ? tour.route.join(' → ')
                  : tour.route,
                applyText: (prev: SiteCmsData, val: string) => {
                  const next = cloneCms(prev);
                  next.tours = next.tours.map((t) =>
                    t.id === tour.id ? { ...t, route: val } : t
                  );
                  return next;
                },
              },
              {
                id: `tour-desc-${tour.id}`,
                label: 'Description',
                type: 'textarea' as const,
                value: tour.description,
                applyText: (prev: SiteCmsData, val: string) => {
                  const next = cloneCms(prev);
                  next.tours = next.tours.map((t) =>
                    t.id === tour.id ? { ...t, description: val } : t
                  );
                  return next;
                },
              },
              {
                id: `tour-highlights-${tour.id}`,
                label: 'Highlights',
                type: 'textarea' as const,
                value: Array.isArray(tour.highlights)
                  ? tour.highlights.join(', ')
                  : tour.highlights,
                applyText: (prev: SiteCmsData, val: string) => {
                  const next = cloneCms(prev);
                  next.tours = next.tours.map((t) =>
                    t.id === tour.id ? { ...t, highlights: val } : t
                  );
                  return next;
                },
              },
              {
                id: `tour-img-${tour.id}`,
                label: 'Tour Card Image',
                type: 'image' as const,
                value: tour.imageRef?.url || tour.image || '',
                altText: tour.imageRef?.alt || tour.name,
                objectKey: tour.imageRef?.key ?? null,
                applyImage: (prev: SiteCmsData, updates: AdminImageFieldUpdates) => {
                  const next = cloneCms(prev);
                  next.tours = next.tours.map((t) => {
                    if (t.id !== tour.id) return t;
                    const ref = updateImageRef(t.imageRef, updates, t.name);
                    return { ...t, image: ref.url, imageRef: ref };
                  });
                  return next;
                },
              },
            ],
          })),
        },
      ],
    },

    // =========================================================================
    // 5. STAYS PAGE (/stays)
    // =========================================================================
    {
      id: 'stays-page',
      title: 'Boutique Stays Page',
      routePath: '/stays',
      description:
        'Page banner, accommodation standards policy, and curated regional accommodation collections.',
      sections: [
        {
          id: 'stays-banner',
          code: 'SEC 01',
          title: 'Stays Banner, Intro & Custom CTA Box',
          description: 'Top banner, intro copy, and bottom CTA box on /stays.',
          subsections: [
            {
              id: 'stays-banner-copy',
              code: '1.1',
              title: 'Banner & Intro Headings',
              fields: [
                {
                  id: 'stays-banner-eyebrow',
                  label: 'Banner Eyebrow',
                  type: 'text',
                  value: cms.pages.staysPage.banner.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.staysPage.banner.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'stays-banner-title',
                  label: 'Banner Headline',
                  type: 'text',
                  value: cms.pages.staysPage.banner.title,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.staysPage.banner.title = val;
                    return next;
                  },
                },
                {
                  id: 'stays-intro-eyebrow',
                  label: 'Intro Eyebrow',
                  type: 'text',
                  value: cms.pages.staysPage.introSection.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.staysPage.introSection.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'stays-intro-h-prefix',
                  label: 'Intro Heading Prefix',
                  type: 'text',
                  value: cms.pages.staysPage.introSection.headingPrefix,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.staysPage.introSection.headingPrefix = val;
                    return next;
                  },
                },
                {
                  id: 'stays-intro-h-italic',
                  label: 'Intro Heading Italic',
                  type: 'text',
                  value: cms.pages.staysPage.introSection.headingItalic,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.staysPage.introSection.headingItalic = val;
                    return next;
                  },
                },
                {
                  id: 'stays-intro-desc',
                  label: 'Intro Description',
                  type: 'textarea',
                  value: cms.pages.staysPage.introSection.description,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.staysPage.introSection.description = val;
                    return next;
                  },
                },
              ],
            },
            {
              id: 'stays-custom-cta-sub',
              code: '1.2',
              title: 'Bottom Tailor-Made Stays CTA Box',
              fields: [
                {
                  id: 'stays-cta-eyebrow',
                  label: 'Eyebrow',
                  type: 'text',
                  value: cms.pages.staysPage.customCtaBox.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.staysPage.customCtaBox.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'stays-cta-heading',
                  label: 'Heading',
                  type: 'text',
                  value: cms.pages.staysPage.customCtaBox.heading,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.staysPage.customCtaBox.heading = val;
                    return next;
                  },
                },
                {
                  id: 'stays-cta-desc',
                  label: 'Description',
                  type: 'textarea',
                  value: cms.pages.staysPage.customCtaBox.description,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.staysPage.customCtaBox.description = val;
                    return next;
                  },
                },
                {
                  id: 'stays-cta-label',
                  label: 'Button Label',
                  type: 'text',
                  value: cms.pages.staysPage.customCtaBox.ctaLabel,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.staysPage.customCtaBox.ctaLabel = val;
                    return next;
                  },
                },
              ],
            },
          ],
        },
        {
          id: 'stays-collection',
          code: 'SEC 02',
          title: `Accommodation Collections (${sortedStays.length} Stays)`,
          description:
            'Regional stay cards, descriptions, standards, and cover images. Supports add, remove, and reorder.',
          addRepeatableLabel: 'Add Accommodation Card',
          onAddRepeatable: (prev) => {
            const next = cloneCms(prev);
            const nextOrder = (next.stays?.length || 0) + 1;
            const newStay: CmsStayItem = {
              id: `stay-${Date.now()}`,
              name: `New Regional Stay Collection ${nextOrder}`,
              location: 'Sri Lanka',
              region: 'culture',
              regionLabel: 'Cultural Triangle',
              tagline: 'Four-Star Hotels · Boutique · Five-Star Luxury',
              description:
                'Handpicked hotels and boutique properties selected around your route and preferences.',
              highlights: [
                'Curated four-star, boutique & five-star options',
                'Confirmed individually at time of enquiry',
              ],
              maxGuestsPerRoom: 3,
              image: '',
              imageRef: createImageRef(
                '',
                `New Regional Stay Collection ${nextOrder}`
              ),
              visible: true,
              order: nextOrder,
            };
            next.stays = [...(next.stays || []), newStay];
            return next;
          },
          subsections: sortedStays.map((stay, idx) => ({
            id: `stay-item-${stay.id}`,
            code: `2.${idx + 1}`,
            title: `${stay.name}`,
            repeatableItemId: stay.id,
            visible: stay.visible !== false,
            canToggleVisible: true,
            onToggleVisible: (prev: SiteCmsData) => {
              const next = cloneCms(prev);
              next.stays = next.stays.map((s) =>
                s.id === stay.id ? { ...s, visible: s.visible === false } : s
              );
              return next;
            },
            canMoveUp: idx > 0,
            canMoveDown: idx < sortedStays.length - 1,
            canRemove: sortedStays.length > 1,
            onMoveUp: (prev: SiteCmsData) => {
              const next = cloneCms(prev);
              next.stays = moveArrayItem(sortedStays, idx, 'up', next.stays);
              return next;
            },
            onMoveDown: (prev: SiteCmsData) => {
              const next = cloneCms(prev);
              next.stays = moveArrayItem(sortedStays, idx, 'down', next.stays);
              return next;
            },
            onRemove: (prev: SiteCmsData) => {
              const next = cloneCms(prev);
              next.stays = softDeleteItemById(
                next.stays,
                stay.id,
                currentAdminUid
              );
              return next;
            },
            fields: [
              {
                id: `stay-name-${stay.id}`,
                label: 'Stay Collection Title',
                type: 'text' as const,
                value: stay.name,
                applyText: (prev: SiteCmsData, val: string) => {
                  const next = cloneCms(prev);
                  next.stays = next.stays.map((s) =>
                    s.id === stay.id ? { ...s, name: val } : s
                  );
                  return next;
                },
              },
              {
                id: `stay-location-${stay.id}`,
                label: 'Location Label',
                type: 'text' as const,
                value: stay.location,
                applyText: (prev: SiteCmsData, val: string) => {
                  const next = cloneCms(prev);
                  next.stays = next.stays.map((s) =>
                    s.id === stay.id ? { ...s, location: val } : s
                  );
                  return next;
                },
              },
              {
                id: `stay-tagline-${stay.id}`,
                label: 'Tagline',
                type: 'text' as const,
                value: stay.tagline,
                applyText: (prev: SiteCmsData, val: string) => {
                  const next = cloneCms(prev);
                  next.stays = next.stays.map((s) =>
                    s.id === stay.id ? { ...s, tagline: val } : s
                  );
                  return next;
                },
              },
              {
                id: `stay-desc-${stay.id}`,
                label: 'Description',
                type: 'textarea' as const,
                value: stay.description,
                applyText: (prev: SiteCmsData, val: string) => {
                  const next = cloneCms(prev);
                  next.stays = next.stays.map((s) =>
                    s.id === stay.id ? { ...s, description: val } : s
                  );
                  return next;
                },
              },
              {
                id: `stay-highlights-${stay.id}`,
                label: 'Accommodation Standards (one per line)',
                type: 'textarea' as const,
                value: (stay.highlights || []).join('\n'),
                applyText: (prev: SiteCmsData, val: string) => {
                  const next = cloneCms(prev);
                  const lines = val
                    .split('\n')
                    .map((l) => l.trim())
                    .filter(Boolean);
                  next.stays = next.stays.map((s) =>
                    s.id === stay.id ? { ...s, highlights: lines } : s
                  );
                  return next;
                },
              },
              {
                id: `stay-img-${stay.id}`,
                label: 'Stay Cover Image',
                type: 'image' as const,
                value: stay.imageRef?.url || stay.image || '',
                altText: stay.imageRef?.alt || stay.name,
                objectKey: stay.imageRef?.key ?? null,
                applyImage: (prev: SiteCmsData, updates: AdminImageFieldUpdates) => {
                  const next = cloneCms(prev);
                  next.stays = next.stays.map((s) => {
                    if (s.id !== stay.id) return s;
                    const ref = updateImageRef(s.imageRef, updates, s.name);
                    return { ...s, image: ref.url, imageRef: ref };
                  });
                  return next;
                },
              },
            ],
          })),
        },
      ],
    },

    // =========================================================================
    // 6. GALLERY PAGE (/gallery)
    // =========================================================================
    {
      id: 'gallery-page',
      title: 'Gallery Page',
      routePath: '/gallery',
      description:
        'Visual gallery banner, intro headings, and filterable photography grid.',
      sections: [
        {
          id: 'gallery-banner',
          code: 'SEC 01',
          title: 'Gallery Page Banner, Intro & CTA Box',
          description: 'Top banner, intro headings, and bottom CTA box on /gallery.',
          subsections: [
            {
              id: 'gallery-banner-copy',
              code: '1.1',
              title: 'Banner & Intro Section',
              fields: [
                {
                  id: 'gallery-banner-eyebrow',
                  label: 'Banner Eyebrow',
                  type: 'text',
                  value: cms.pages.galleryPage.banner.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.galleryPage.banner.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'gallery-banner-title',
                  label: 'Banner Title',
                  type: 'text',
                  value: cms.pages.galleryPage.banner.title,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.galleryPage.banner.title = val;
                    return next;
                  },
                },
                {
                  id: 'gallery-intro-eyebrow',
                  label: 'Intro Eyebrow',
                  type: 'text',
                  value: cms.pages.galleryPage.introSection.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.galleryPage.introSection.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'gallery-intro-h-prefix',
                  label: 'Intro Heading Prefix',
                  type: 'text',
                  value: cms.pages.galleryPage.introSection.headingPrefix,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.galleryPage.introSection.headingPrefix = val;
                    return next;
                  },
                },
                {
                  id: 'gallery-intro-h-italic',
                  label: 'Intro Heading Italic',
                  type: 'text',
                  value: cms.pages.galleryPage.introSection.headingItalic,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.galleryPage.introSection.headingItalic = val;
                    return next;
                  },
                },
                {
                  id: 'gallery-intro-desc',
                  label: 'Intro Description',
                  type: 'textarea',
                  value: cms.pages.galleryPage.introSection.description,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.galleryPage.introSection.description = val;
                    return next;
                  },
                },
              ],
            },
            {
              id: 'gallery-cta-sub',
              code: '1.2',
              title: 'Bottom CTA Box',
              fields: [
                {
                  id: 'gallery-cta-eyebrow',
                  label: 'Eyebrow',
                  type: 'text',
                  value: cms.pages.galleryPage.customCtaBox.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.galleryPage.customCtaBox.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'gallery-cta-heading',
                  label: 'Heading',
                  type: 'text',
                  value: cms.pages.galleryPage.customCtaBox.heading,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.galleryPage.customCtaBox.heading = val;
                    return next;
                  },
                },
                {
                  id: 'gallery-cta-desc',
                  label: 'Description',
                  type: 'textarea',
                  value: cms.pages.galleryPage.customCtaBox.description,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.galleryPage.customCtaBox.description = val;
                    return next;
                  },
                },
                {
                  id: 'gallery-cta-label',
                  label: 'Button Label',
                  type: 'text',
                  value: cms.pages.galleryPage.customCtaBox.ctaLabel,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.galleryPage.customCtaBox.ctaLabel = val;
                    return next;
                  },
                },
              ],
            },
          ],
        },
        {
          id: 'gallery-grid',
          code: 'SEC 02',
          title: `Gallery Photo Cards (${sortedGallery.length})`,
          description:
            'Add, remove, or reorder gallery photo cards with category, title, location, caption, and image URL.',
          addRepeatableLabel: 'Add Gallery Photo Card',
          onAddRepeatable: (prev) => {
            const next = cloneCms(prev);
            const nextOrder = (next.gallery?.length || 0) + 1;
            const newPhoto: CmsGalleryPhoto = {
              id: `gallery-${Date.now()}`,
              title: `Sri Lanka Highlight ${nextOrder}`,
              location: 'Sri Lanka',
              category: 'culture',
              categoryLabel: 'Culture & Heritage',
              image: '',
              imageRef: createImageRef('', `Sri Lanka Highlight ${nextOrder}`),
              description:
                'Private, tailor-made discovery across Sri Lanka with Bimondo Travels.',
              visible: true,
              order: nextOrder,
            };
            next.gallery = [...(next.gallery || []), newPhoto];
            return next;
          },
          subsections: sortedGallery.map((photo, idx) => ({
            id: `gallery-photo-${photo.id}`,
            code: `2.${idx + 1}`,
            title: `Photo ${idx + 1}: ${photo.title}`,
            repeatableItemId: photo.id,
            visible: photo.visible !== false,
            canToggleVisible: true,
            onToggleVisible: (prev: SiteCmsData) => {
              const next = cloneCms(prev);
              next.gallery = next.gallery.map((p) =>
                p.id === photo.id ? { ...p, visible: p.visible === false } : p
              );
              return next;
            },
            canMoveUp: idx > 0,
            canMoveDown: idx < sortedGallery.length - 1,
            canRemove: true,
            onMoveUp: (prev: SiteCmsData) => {
              const next = cloneCms(prev);
              next.gallery = moveArrayItem(
                sortedGallery,
                idx,
                'up',
                next.gallery
              );
              return next;
            },
            onMoveDown: (prev: SiteCmsData) => {
              const next = cloneCms(prev);
              next.gallery = moveArrayItem(
                sortedGallery,
                idx,
                'down',
                next.gallery
              );
              return next;
            },
            onRemove: (prev: SiteCmsData) => {
              const next = cloneCms(prev);
              next.gallery = softDeleteItemById(
                next.gallery,
                photo.id,
                currentAdminUid
              );
              return next;
            },
            fields: [
              {
                id: `gal-title-${photo.id}`,
                label: 'Photo Title',
                type: 'text' as const,
                value: photo.title,
                applyText: (prev: SiteCmsData, val: string) => {
                  const next = cloneCms(prev);
                  next.gallery = next.gallery.map((p) =>
                    p.id === photo.id ? { ...p, title: val } : p
                  );
                  return next;
                },
              },
              {
                id: `gal-loc-${photo.id}`,
                label: 'Location Label',
                type: 'text' as const,
                value: photo.location,
                applyText: (prev: SiteCmsData, val: string) => {
                  const next = cloneCms(prev);
                  next.gallery = next.gallery.map((p) =>
                    p.id === photo.id ? { ...p, location: val } : p
                  );
                  return next;
                },
              },
              {
                id: `gal-cat-${photo.id}`,
                label: 'Category (culture / highlands / wildlife / coast)',
                type: 'text' as const,
                value: photo.category,
                applyText: (prev: SiteCmsData, val: string) => {
                  const next = cloneCms(prev);
                  const cat =
                    val === 'highlands' ||
                    val === 'wildlife' ||
                    val === 'coast'
                      ? val
                      : 'culture';
                  next.gallery = next.gallery.map((p) =>
                    p.id === photo.id ? { ...p, category: cat } : p
                  );
                  return next;
                },
              },
              {
                id: `gal-desc-${photo.id}`,
                label: 'Lightbox Description',
                type: 'textarea' as const,
                value: photo.description,
                applyText: (prev: SiteCmsData, val: string) => {
                  const next = cloneCms(prev);
                  next.gallery = next.gallery.map((p) =>
                    p.id === photo.id ? { ...p, description: val } : p
                  );
                  return next;
                },
              },
              {
                id: `gal-img-${photo.id}`,
                label: 'Gallery Image',
                type: 'image' as const,
                value: photo.imageRef?.url || photo.image || '',
                altText: photo.imageRef?.alt || photo.title,
                objectKey: photo.imageRef?.key ?? null,
                applyImage: (prev: SiteCmsData, updates: AdminImageFieldUpdates) => {
                  const next = cloneCms(prev);
                  next.gallery = next.gallery.map((p) => {
                    if (p.id !== photo.id) return p;
                    const ref = updateImageRef(p.imageRef, updates, p.title);
                    return { ...p, image: ref.url, imageRef: ref };
                  });
                  return next;
                },
              },
            ],
          })),
        },
      ],
    },

    // =========================================================================
    // 7. OUR STORY PAGE (/our-story)
    // =========================================================================
    {
      id: 'our-story-page',
      title: 'Our Story Page',
      routePath: '/our-story',
      description:
        'Company profile banner, identity & home base cards, vision & mission, six core values, founder profile, and growth roadmap.',
      sections: [
        {
          id: 'story-page-banner-identity',
          code: 'SEC 01',
          title: 'Banner & Company Identity Cards',
          description:
            'Page banner and the 3 company identity cards (Name, Base of Operations, Thalangama Wetland).',
          subsections: [
            {
              id: 'story-page-banner-sub',
              code: '1.1',
              title: 'Banner & Identity Section Heading',
              fields: [
                {
                  id: 'osp-banner-eyebrow',
                  label: 'Banner Eyebrow',
                  type: 'text',
                  value: cms.pages.ourStoryPage.banner.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.ourStoryPage.banner.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'osp-banner-title',
                  label: 'Banner Title',
                  type: 'text',
                  value: cms.pages.ourStoryPage.banner.title,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.ourStoryPage.banner.title = val;
                    return next;
                  },
                },
                {
                  id: 'osp-id-eyebrow',
                  label: 'Identity Section Eyebrow',
                  type: 'text',
                  value: cms.pages.ourStoryPage.identitySection.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.ourStoryPage.identitySection.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'osp-id-h-prefix',
                  label: 'Identity Heading Prefix',
                  type: 'text',
                  value: cms.pages.ourStoryPage.identitySection.headingPrefix,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.ourStoryPage.identitySection.headingPrefix = val;
                    return next;
                  },
                },
                {
                  id: 'osp-id-h-italic',
                  label: 'Identity Heading Italic',
                  type: 'text',
                  value: cms.pages.ourStoryPage.identitySection.headingItalic,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.ourStoryPage.identitySection.headingItalic = val;
                    return next;
                  },
                },
                {
                  id: 'osp-id-desc',
                  label: 'Identity Section Description',
                  type: 'textarea',
                  value: cms.pages.ourStoryPage.identitySection.description,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.ourStoryPage.identitySection.description = val;
                    return next;
                  },
                },
              ],
            },
            ...(cms.pages.ourStoryPage.identitySection.cards || []).map(
              (card, idx) => ({
                id: `osp-id-card-${card.id}`,
                code: `1.${idx + 2}`,
                title: `Identity Card ${idx + 1}: ${card.title}`,
                fields: [
                  {
                    id: `osp-card-kicker-${card.id}`,
                    label: 'Kicker Label',
                    type: 'text' as const,
                    value: card.kicker,
                    applyText: (prev: SiteCmsData, val: string) => {
                      const next = cloneCms(prev);
                      next.pages.ourStoryPage.identitySection.cards =
                        next.pages.ourStoryPage.identitySection.cards.map((c) =>
                          c.id === card.id ? { ...c, kicker: val } : c
                        );
                      return next;
                    },
                  },
                  {
                    id: `osp-card-title-${card.id}`,
                    label: 'Card Title',
                    type: 'text' as const,
                    value: card.title,
                    applyText: (prev: SiteCmsData, val: string) => {
                      const next = cloneCms(prev);
                      next.pages.ourStoryPage.identitySection.cards =
                        next.pages.ourStoryPage.identitySection.cards.map((c) =>
                          c.id === card.id ? { ...c, title: val } : c
                        );
                      return next;
                    },
                  },
                  {
                    id: `osp-card-desc-${card.id}`,
                    label: 'Card Description',
                    type: 'textarea' as const,
                    value: card.description,
                    applyText: (prev: SiteCmsData, val: string) => {
                      const next = cloneCms(prev);
                      next.pages.ourStoryPage.identitySection.cards =
                        next.pages.ourStoryPage.identitySection.cards.map((c) =>
                          c.id === card.id ? { ...c, description: val } : c
                        );
                      return next;
                    },
                  },
                ],
              })
            ),
          ],
        },
        {
          id: 'story-page-values',
          code: 'SEC 02',
          title: 'Vision, Mission & Six Core Values',
          description:
            'Vision statement, mission statement, and the 6 core company values.',
          subsections: [
            {
              id: 'story-vision-mission',
              code: '2.1',
              title: 'Vision & Mission Statements',
              fields: [
                {
                  id: 'osp-val-eyebrow',
                  label: 'Eyebrow',
                  type: 'text',
                  value: cms.pages.ourStoryPage.valuesSection.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.ourStoryPage.valuesSection.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'osp-val-h-prefix',
                  label: 'Heading Prefix',
                  type: 'text',
                  value: cms.pages.ourStoryPage.valuesSection.headingPrefix,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.ourStoryPage.valuesSection.headingPrefix = val;
                    return next;
                  },
                },
                {
                  id: 'osp-val-h-italic',
                  label: 'Heading Italic',
                  type: 'text',
                  value: cms.pages.ourStoryPage.valuesSection.headingItalic,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.ourStoryPage.valuesSection.headingItalic = val;
                    return next;
                  },
                },
                {
                  id: 'osp-vision-text',
                  label: 'Vision Statement',
                  type: 'textarea',
                  value: cms.pages.ourStoryPage.valuesSection.visionText,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.ourStoryPage.valuesSection.visionText = val;
                    return next;
                  },
                },
                {
                  id: 'osp-mission-text',
                  label: 'Mission Statement',
                  type: 'textarea',
                  value: cms.pages.ourStoryPage.valuesSection.missionText,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.ourStoryPage.valuesSection.missionText = val;
                    return next;
                  },
                },
              ],
            },
            {
              id: 'story-core-values-list',
              code: '2.2',
              title: 'Six Core Values (01 – 06)',
              fields: (
                cms.pages.ourStoryPage.valuesSection.coreValues || []
              ).flatMap((v) => [
                {
                  id: `osp-cv-title-${v.id}`,
                  label: `Value ${v.number} Title`,
                  type: 'text' as const,
                  value: v.title,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.pages.ourStoryPage.valuesSection.coreValues =
                      next.pages.ourStoryPage.valuesSection.coreValues.map(
                        (item) =>
                          item.id === v.id ? { ...item, title: val } : item
                      );
                    return next;
                  },
                },
                {
                  id: `osp-cv-desc-${v.id}`,
                  label: `Value ${v.number} Description`,
                  type: 'textarea' as const,
                  value: v.desc,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.pages.ourStoryPage.valuesSection.coreValues =
                      next.pages.ourStoryPage.valuesSection.coreValues.map(
                        (item) =>
                          item.id === v.id ? { ...item, desc: val } : item
                      );
                    return next;
                  },
                },
              ]),
            },
          ],
        },
        {
          id: 'story-page-founder-roadmap',
          code: 'SEC 03',
          title: 'Founder Profile & Growth Roadmap',
          description:
            'Founder message, leadership values, and 3-stage growth roadmap.',
          subsections: [
            {
              id: 'story-founder-sub',
              code: '3.1',
              title: 'Founder Profile & Promise',
              fields: [
                {
                  id: 'osp-founder-eyebrow',
                  label: 'Eyebrow',
                  type: 'text',
                  value: cms.pages.ourStoryPage.founderSection.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.ourStoryPage.founderSection.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'osp-founder-name',
                  label: 'Founder Name',
                  type: 'text',
                  value: cms.pages.ourStoryPage.founderSection.founderName,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.ourStoryPage.founderSection.founderName = val;
                    next.general.founderName = val;
                    return next;
                  },
                },
                {
                  id: 'osp-founder-creds',
                  label: 'Credentials Line',
                  type: 'text',
                  value: cms.pages.ourStoryPage.founderSection.credentialsLine,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.ourStoryPage.founderSection.credentialsLine =
                      val;
                    return next;
                  },
                },
                {
                  id: 'osp-founder-bio',
                  label: 'Biography Paragraph',
                  type: 'textarea',
                  value: cms.pages.ourStoryPage.founderSection.bioParagraph,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.ourStoryPage.founderSection.bioParagraph = val;
                    return next;
                  },
                },
                {
                  id: 'osp-founder-quote',
                  label: 'Founder Promise Quote',
                  type: 'textarea',
                  value: cms.pages.ourStoryPage.founderSection.quote,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.ourStoryPage.founderSection.quote = val;
                    return next;
                  },
                },
                {
                  id: 'osp-founder-cta',
                  label: 'CTA Button Label',
                  type: 'text',
                  value: cms.pages.ourStoryPage.founderSection.ctaLabel,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.ourStoryPage.founderSection.ctaLabel = val;
                    return next;
                  },
                },
              ],
            },
            {
              id: 'story-roadmap-sub',
              code: '3.2',
              title: 'Realistic Growth Roadmap (Stages 1 – 3)',
              fields: (
                cms.pages.ourStoryPage.roadmapSection.stages || []
              ).flatMap((st) => [
                {
                  id: `osp-rm-stage-${st.id}`,
                  label: `${st.title} Stage Kicker`,
                  type: 'text' as const,
                  value: st.stage,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.pages.ourStoryPage.roadmapSection.stages =
                      next.pages.ourStoryPage.roadmapSection.stages.map((s) =>
                        s.id === st.id ? { ...s, stage: val } : s
                      );
                    return next;
                  },
                },
                {
                  id: `osp-rm-title-${st.id}`,
                  label: 'Stage Title',
                  type: 'text' as const,
                  value: st.title,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.pages.ourStoryPage.roadmapSection.stages =
                      next.pages.ourStoryPage.roadmapSection.stages.map((s) =>
                        s.id === st.id ? { ...s, title: val } : s
                      );
                    return next;
                  },
                },
                {
                  id: `osp-rm-desc-${st.id}`,
                  label: 'Stage Description',
                  type: 'textarea' as const,
                  value: st.desc,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.pages.ourStoryPage.roadmapSection.stages =
                      next.pages.ourStoryPage.roadmapSection.stages.map((s) =>
                        s.id === st.id ? { ...s, desc: val } : s
                      );
                    return next;
                  },
                },
              ]),
            },
          ],
        },
      ],
    },

    // =========================================================================
    // 8. CONTACT PAGE (/contact)
    // =========================================================================
    {
      id: 'contact-page',
      title: 'Contact Page',
      routePath: '/contact',
      description:
        'Contact banner, official company profile reference cards, and Good to Know FAQ accordion.',
      sections: [
        {
          id: 'contact-banner-details',
          code: 'SEC 01',
          title: 'Banner & Official Company Profile Details',
          description:
            'Page banner and official company details reference grid on /contact.',
          subsections: [
            {
              id: 'contact-page-banner-sub',
              code: '1.1',
              title: 'Banner & Details Section Heading',
              fields: [
                {
                  id: 'cp-banner-eyebrow',
                  label: 'Banner Eyebrow',
                  type: 'text',
                  value: cms.pages.contactPage.banner.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.contactPage.banner.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'cp-banner-title',
                  label: 'Banner Title',
                  type: 'text',
                  value: cms.pages.contactPage.banner.title,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.contactPage.banner.title = val;
                    return next;
                  },
                },
                {
                  id: 'cp-det-eyebrow',
                  label: 'Details Section Eyebrow',
                  type: 'text',
                  value: cms.pages.contactPage.detailsSection.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.contactPage.detailsSection.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'cp-det-h-prefix',
                  label: 'Details Heading Prefix',
                  type: 'text',
                  value: cms.pages.contactPage.detailsSection.headingPrefix,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.contactPage.detailsSection.headingPrefix = val;
                    return next;
                  },
                },
                {
                  id: 'cp-det-h-italic',
                  label: 'Details Heading Italic',
                  type: 'text',
                  value: cms.pages.contactPage.detailsSection.headingItalic,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.contactPage.detailsSection.headingItalic = val;
                    return next;
                  },
                },
                {
                  id: 'cp-det-desc',
                  label: 'Details Section Description',
                  type: 'textarea',
                  value: cms.pages.contactPage.detailsSection.description,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.contactPage.detailsSection.description = val;
                    return next;
                  },
                },
              ],
            },
            {
              id: 'contact-company-kv-sub',
              code: '1.2',
              title: 'Company Profile Key-Value Cards',
              fields: (cms.pages.contactPage.detailsSection.items || []).map(
                (item) => ({
                  id: `cp-kv-${item.id}`,
                  label: item.label,
                  type: 'text' as const,
                  value: item.value,
                  applyText: (prev: SiteCmsData, val: string) => {
                    const next = cloneCms(prev);
                    next.pages.contactPage.detailsSection.items =
                      next.pages.contactPage.detailsSection.items.map((it) =>
                        it.id === item.id ? { ...it, value: val } : it
                      );
                    return next;
                  },
                })
              ),
            },
          ],
        },
        {
          id: 'contact-faq-section',
          code: 'SEC 02',
          title: 'Good to Know FAQ Accordion',
          description: 'FAQ section displayed at the bottom of /contact.',
          subsections: [
            {
              id: 'contact-faq-intro-sub',
              code: '2.1',
              title: 'FAQ Intro & CTA Box',
              fields: [
                {
                  id: 'cfaq-eyebrow',
                  label: 'Eyebrow',
                  type: 'text',
                  value: cms.pages.contactPage.faqSection.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.contactPage.faqSection.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'cfaq-h1',
                  label: 'Heading Line 1',
                  type: 'text',
                  value: cms.pages.contactPage.faqSection.headingLine1,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.contactPage.faqSection.headingLine1 = val;
                    return next;
                  },
                },
                {
                  id: 'cfaq-h-italic',
                  label: 'Heading Italic',
                  type: 'text',
                  value: cms.pages.contactPage.faqSection.headingItalic,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.contactPage.faqSection.headingItalic = val;
                    return next;
                  },
                },
                {
                  id: 'cfaq-lead',
                  label: 'Lead Paragraph',
                  type: 'textarea',
                  value: cms.pages.contactPage.faqSection.lead,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.contactPage.faqSection.lead = val;
                    return next;
                  },
                },
                {
                  id: 'cfaq-cta-prompt',
                  label: 'CTA Prompt Text',
                  type: 'text',
                  value: cms.pages.contactPage.faqSection.ctaPrompt,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.contactPage.faqSection.ctaPrompt = val;
                    return next;
                  },
                },
                {
                  id: 'cfaq-cta-label',
                  label: 'CTA Button Label',
                  type: 'text',
                  value: cms.pages.contactPage.faqSection.ctaLabel,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.contactPage.faqSection.ctaLabel = val;
                    return next;
                  },
                },
              ],
            },
            ...(cms.pages.contactPage.faqSection.items || []).map(
              (faq, idx) => ({
                id: `cfaq-item-${faq.id}`,
                code: `2.${idx + 2}`,
                title: `Contact FAQ 0${idx + 1}: ${faq.question}`,
                fields: [
                  {
                    id: `cfaq-cat-${faq.id}`,
                    label: 'Category Label',
                    type: 'text' as const,
                    value: faq.category,
                    applyText: (prev: SiteCmsData, val: string) => {
                      const next = cloneCms(prev);
                      next.pages.contactPage.faqSection.items =
                        next.pages.contactPage.faqSection.items.map((it) =>
                          it.id === faq.id ? { ...it, category: val } : it
                        );
                      return next;
                    },
                  },
                  {
                    id: `cfaq-q-${faq.id}`,
                    label: 'Question',
                    type: 'text' as const,
                    value: faq.question,
                    applyText: (prev: SiteCmsData, val: string) => {
                      const next = cloneCms(prev);
                      next.pages.contactPage.faqSection.items =
                        next.pages.contactPage.faqSection.items.map((it) =>
                          it.id === faq.id ? { ...it, question: val } : it
                        );
                      return next;
                    },
                  },
                  {
                    id: `cfaq-a-${faq.id}`,
                    label: 'Answer',
                    type: 'textarea' as const,
                    value: faq.answer,
                    applyText: (prev: SiteCmsData, val: string) => {
                      const next = cloneCms(prev);
                      next.pages.contactPage.faqSection.items =
                        next.pages.contactPage.faqSection.items.map((it) =>
                          it.id === faq.id ? { ...it, answer: val } : it
                        );
                      return next;
                    },
                  },
                ],
              })
            ),
          ],
        },
      ],
    },

    // =========================================================================
    // 9. BOOKING & CONFIRMATION PAGES (/booking, /booking/confirmation)
    // =========================================================================
    {
      id: 'booking-page',
      title: 'Online Booking & Verification',
      routePath: '/booking',
      description:
        'Online booking desk (/booking) and booking status verification page (/booking/confirmation).',
      sections: [
        {
          id: 'booking-main-sec',
          code: 'SEC 01',
          title: 'Online Booking Desk (/booking)',
          description:
            'Banner, qualification notice, category tabs, and quick links on /booking.',
          subsections: [
            {
              id: 'booking-banner-selector',
              code: '1.1',
              title: 'Banner, Selector Heading & Tab Labels',
              fields: [
                {
                  id: 'bk-banner-eyebrow',
                  label: 'Banner Eyebrow',
                  type: 'text',
                  value: cms.pages.bookingPage.banner.eyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.bookingPage.banner.eyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'bk-banner-title',
                  label: 'Banner Title',
                  type: 'text',
                  value: cms.pages.bookingPage.banner.title,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.bookingPage.banner.title = val;
                    return next;
                  },
                },
                {
                  id: 'bk-step-eyebrow',
                  label: 'Step 1 Eyebrow',
                  type: 'text',
                  value: cms.pages.bookingPage.selectorSection.stepEyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.bookingPage.selectorSection.stepEyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'bk-step-h-prefix',
                  label: 'Step 1 Heading Prefix',
                  type: 'text',
                  value:
                    cms.pages.bookingPage.selectorSection.stepHeadingPrefix,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.bookingPage.selectorSection.stepHeadingPrefix =
                      val;
                    return next;
                  },
                },
                {
                  id: 'bk-step-h-italic',
                  label: 'Step 1 Heading Italic',
                  type: 'text',
                  value:
                    cms.pages.bookingPage.selectorSection.stepHeadingItalic,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.bookingPage.selectorSection.stepHeadingItalic =
                      val;
                    return next;
                  },
                },
                {
                  id: 'bk-tab-tours',
                  label: 'Tours Tab Label',
                  type: 'text',
                  value: cms.pages.bookingPage.selectorSection.tabToursLabel,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.bookingPage.selectorSection.tabToursLabel = val;
                    return next;
                  },
                },
                {
                  id: 'bk-tab-dayexp',
                  label: 'Day Experiences Tab Label',
                  type: 'text',
                  value: cms.pages.bookingPage.selectorSection.tabDayExpLabel,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.bookingPage.selectorSection.tabDayExpLabel = val;
                    return next;
                  },
                },
                {
                  id: 'bk-tab-stays',
                  label: 'Accommodation Tab Label',
                  type: 'text',
                  value: cms.pages.bookingPage.selectorSection.tabStaysLabel,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.bookingPage.selectorSection.tabStaysLabel = val;
                    return next;
                  },
                },
              ],
            },
          ],
        },
        {
          id: 'booking-confirm-sec',
          code: 'SEC 02',
          title: 'Booking Verification Page (/booking/confirmation)',
          description:
            'Banner and verification lookup form copy on /booking/confirmation.',
          subsections: [
            {
              id: 'booking-confirm-sub',
              code: '2.1',
              title: 'Banner & Verification Form Copy',
              fields: [
                {
                  id: 'bkc-banner-eyebrow',
                  label: 'Banner Eyebrow',
                  type: 'text',
                  value: cms.pages.bookingPage.confirmationPage.bannerEyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.bookingPage.confirmationPage.bannerEyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'bkc-banner-title',
                  label: 'Banner Title',
                  type: 'text',
                  value: cms.pages.bookingPage.confirmationPage.bannerTitle,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.bookingPage.confirmationPage.bannerTitle = val;
                    return next;
                  },
                },
                {
                  id: 'bkc-form-eyebrow',
                  label: 'Form Eyebrow',
                  type: 'text',
                  value: cms.pages.bookingPage.confirmationPage.formEyebrow,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.bookingPage.confirmationPage.formEyebrow = val;
                    return next;
                  },
                },
                {
                  id: 'bkc-form-heading',
                  label: 'Form Heading',
                  type: 'text',
                  value: cms.pages.bookingPage.confirmationPage.formHeading,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.bookingPage.confirmationPage.formHeading = val;
                    return next;
                  },
                },
                {
                  id: 'bkc-form-desc',
                  label: 'Form Description',
                  type: 'textarea',
                  value: cms.pages.bookingPage.confirmationPage.formDescription,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.bookingPage.confirmationPage.formDescription =
                      val;
                    return next;
                  },
                },
                {
                  id: 'bkc-submit-btn',
                  label: 'Submit Button Label',
                  type: 'text',
                  value:
                    cms.pages.bookingPage.confirmationPage.submitButtonLabel,
                  applyText: (prev, val) => {
                    const next = cloneCms(prev);
                    next.pages.bookingPage.confirmationPage.submitButtonLabel =
                      val;
                    return next;
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ];
}
