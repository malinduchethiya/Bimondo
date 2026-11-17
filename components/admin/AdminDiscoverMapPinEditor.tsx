'use client';

import React, { useRef, useState } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Move,
  Check,
} from 'lucide-react';
import { CmsExperienceMapPin, SiteCmsData } from '@/lib/cms-defaults';

interface AdminDiscoverMapPinEditorProps {
  draft: SiteCmsData;
  currentAdminUid: string;
  onMutateDraft: (mutator: (prev: SiteCmsData) => SiteCmsData) => void;
}

export default function AdminDiscoverMapPinEditor({
  draft,
  currentAdminUid,
  onMutateDraft,
}: AdminDiscoverMapPinEditorProps) {
  const expSection = draft.pages.home.experience;
  const activePins = [...(expSection.mapPins || [])]
    .filter((p) => !p.deletedAt)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const [selectedPinId, setSelectedPinId] = useState<string | null>(
    activePins[0]?.id ?? null
  );
  const [draggingPinId, setDraggingPinId] = useState<string | null>(null);
  const [clickMode, setClickMode] = useState<'move' | 'add'>('move');
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const selectedPin =
    activePins.find((p) => p.id === selectedPinId) || activePins[0] || null;

  const computeCoordinatesFromClientXY = (
    clientX: number,
    clientY: number
  ): { x: number; y: number } | null => {
    const el = mapContainerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const rawX = ((clientX - rect.left) / rect.width) * 100;
    const rawY = ((clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.round(Math.max(2, Math.min(98, rawX)) * 10) / 10,
      y: Math.round(Math.max(2, Math.min(98, rawY)) * 10) / 10,
    };
  };

  const updatePinById = (
    pinId: string,
    patch: Partial<CmsExperienceMapPin>
  ) => {
    onMutateDraft((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as SiteCmsData;
      next.pages.home.experience.mapPins = (
        next.pages.home.experience.mapPins || []
      ).map((p) => (p.id === pinId ? { ...p, ...patch } : p));
      return next;
    });
  };

  const handleAddPinAt = (x = 50, y = 50) => {
    const existingIds = new Set(
      (expSection.mapPins || []).map((p) => p.id)
    );
    let seq = (expSection.mapPins || []).length + 1;
    while (existingIds.has(`pin-loc-${seq}`)) {
      seq += 1;
    }
    const newId = `pin-loc-${seq}`;
    const nextNum = activePins.length + 1;
    const newPin: CmsExperienceMapPin = {
      id: newId,
      label: `Location ${nextNum}`,
      regionEyebrow: 'SRI LANKA · FEATURED DESTINATION',
      heading: `Location ${nextNum}`,
      headingItalic: 'Highlights.',
      description:
        'Add details for this pinned location. When a visitor hovers or clicks this pin on the map, these details appear in the left text area.',
      highlights: 'Private Guided Tour · Tailored Pacing · Boutique Stays',
      ctaLabel: 'EXPLORE JOURNEYS ↗',
      ctaHref: '/packages',
      x,
      y,
      visible: true,
      order: (expSection.mapPins || []).length,
      deletedAt: null,
      deletedBy: null,
    };

    onMutateDraft((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as SiteCmsData;
      next.pages.home.experience.mapPins = [
        ...(next.pages.home.experience.mapPins || []),
        newPin,
      ];
      return next;
    });
    setSelectedPinId(newId);
    setClickMode('move');
  };

  const handleDeletePin = (pinId: string) => {
    onMutateDraft((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as SiteCmsData;
      const now = new Date().toISOString();
      next.pages.home.experience.mapPins = (
        next.pages.home.experience.mapPins || []
      ).map((p) =>
        p.id === pinId
          ? { ...p, deletedAt: now, deletedBy: currentAdminUid }
          : p
      );
      return next;
    });
    if (selectedPinId === pinId) {
      const remaining = activePins.filter((p) => p.id !== pinId);
      setSelectedPinId(remaining[0]?.id ?? null);
    }
  };

  const handleMapCanvasPointerDown = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    // Ignore if user clicked directly on a pin button (handled by pin pointer events)
    if ((e.target as HTMLElement).closest('[data-map-pin-button="true"]')) {
      return;
    }
    const coords = computeCoordinatesFromClientXY(e.clientX, e.clientY);
    if (!coords) return;

    if (clickMode === 'add' || !selectedPin) {
      handleAddPinAt(coords.x, coords.y);
    } else {
      updatePinById(selectedPin.id, { x: coords.x, y: coords.y });
    }
  };

  const handlePinPointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    pinId: string
  ) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setSelectedPinId(pinId);
    setDraggingPinId(pinId);
  };

  const handlePinPointerMove = (
    e: React.PointerEvent<HTMLButtonElement>,
    pinId: string
  ) => {
    if (draggingPinId !== pinId) return;
    e.stopPropagation();
    const coords = computeCoordinatesFromClientXY(e.clientX, e.clientY);
    if (!coords) return;
    updatePinById(pinId, { x: coords.x, y: coords.y });
  };

  const handlePinPointerUp = (
    e: React.PointerEvent<HTMLButtonElement>,
    pinId: string
  ) => {
    if (draggingPinId === pinId) {
      e.stopPropagation();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore pointer capture release errors
      }
      setDraggingPinId(null);
    }
  };

  const mapImageUrl = expSection.featureImage?.url?.trim() || '';

  return (
    <div className="bg-white border border-slate-200 rounded-md p-5 space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-700" />
            Interactive Map &amp; Location Pins Studio (#discover)
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Drag any pin directly on your map to position it, or click anywhere
            on the map to move the selected pin. Edit each pin&apos;s location
            details on the right—when visitors hover or click a pin on the map,
            those details appear in the left text area.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              setClickMode((prev) => (prev === 'add' ? 'move' : 'add'))
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
              clickMode === 'add'
                ? 'bg-sky-700 text-white border-sky-700'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            {clickMode === 'add'
              ? 'Click Map to Drop New Pin (Active)'
              : 'Click Map to Move Selected Pin'}
          </button>

          <button
            type="button"
            onClick={() => handleAddPinAt(50, 50)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Location Pin
          </button>
        </div>
      </div>

      {/* Pin Selector Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-medium text-slate-500 mr-1">
          Pins ({activePins.length}):
        </span>
        {activePins.map((pin, idx) => {
          const isSelected = selectedPin?.id === pin.id;
          return (
            <button
              key={pin.id}
              type="button"
              onClick={() => setSelectedPinId(pin.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              } ${pin.visible === false ? 'opacity-60' : ''}`}
            >
              <span className="font-bold text-[10px] opacity-75">
                {idx + 1}.
              </span>
              <span>{pin.label}</span>
              {pin.visible === false && (
                <span className="text-[10px] text-amber-500">(Hidden)</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Split Grid: Interactive Map Canvas (Left) + Selected Pin Detail Editor (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Interactive Map Box Container */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-medium flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-slate-400" />
              Drag pins to reposition · Click map to{' '}
              {clickMode === 'add' ? 'add a new pin' : 'move selected pin'}
            </span>
            {selectedPin && (
              <span className="font-mono text-[11px] text-slate-500">
                {selectedPin.label}: X={selectedPin.x}% · Y={selectedPin.y}%
              </span>
            )}
          </div>

          <div
            ref={mapContainerRef}
            onPointerDown={handleMapCanvasPointerDown}
            className="relative w-full h-[380px] sm:h-[440px] rounded-2xl overflow-hidden border border-slate-300 bg-[#d7ebf1] select-none cursor-crosshair shadow-inner"
          >
            {mapImageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={mapImageUrl}
                alt={
                  expSection.featureImage?.alt ||
                  'Sri Lanka interactive destination map'
                }
                className="w-full h-full object-cover pointer-events-none select-none"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#d7ebf1] to-[#b8dce8] pointer-events-none">
                <MapPin className="w-8 h-8 text-sky-900/50 mb-2" />
                <div className="text-sm font-semibold text-slate-800">
                  No Custom Map Image Uploaded Yet
                </div>
                <p className="text-xs text-slate-600 max-w-sm mt-1">
                  Upload your map image in Subsection 5.1 below (&ldquo;Uploaded
                  Map Image&rdquo;). You can already place, drag, and edit your
                  location pins right here.
                </p>
              </div>
            )}

            {/* Render Interactive Pins */}
            {activePins.map((pin) => {
              const isSelected = selectedPin?.id === pin.id;
              const isDragging = draggingPinId === pin.id;

              return (
                <button
                  key={pin.id}
                  type="button"
                  data-map-pin-button="true"
                  onPointerDown={(e) => handlePinPointerDown(e, pin.id)}
                  onPointerMove={(e) => handlePinPointerMove(e, pin.id)}
                  onPointerUp={(e) => handlePinPointerUp(e, pin.id)}
                  style={{
                    left: `${pin.x}%`,
                    top: `${pin.y}%`,
                  }}
                  title={`Drag to move "${pin.label}" (${pin.x}%, ${pin.y}%)`}
                  aria-label={pin.label}
                  className={`discover-map-pin touch-none ${
                    isDragging ? 'cursor-grabbing z-20' : 'cursor-grab'
                  } ${isSelected ? 'is-active z-20' : ''} ${
                    pin.visible === false ? 'opacity-50' : ''
                  }`}
                >
                  <MapPin
                    className="discover-map-pin-icon"
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Pin Details Editor */}
        <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
          {!selectedPin ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No location pin selected. Click &ldquo;Add Location Pin&rdquo; to
              create one.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Editing Pin: {selectedPin.label}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Shown in the left text area when hovered or clicked
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      updatePinById(selectedPin.id, {
                        visible: selectedPin.visible === false,
                      })
                    }
                    className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded border cursor-pointer ${
                      selectedPin.visible !== false
                        ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {selectedPin.visible !== false ? (
                      <>
                        <Eye className="w-3 h-3 text-emerald-600" />
                        Visible
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3 text-amber-600" />
                        Hidden
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeletePin(selectedPin.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-red-600 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Pin Label (On Map)
                    </label>
                    <input
                      type="text"
                      value={selectedPin.label}
                      onChange={(e) =>
                        updatePinById(selectedPin.id, { label: e.target.value })
                      }
                      placeholder="e.g. Sigiriya & Dambulla"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Eyebrow / Region Subtitle
                    </label>
                    <input
                      type="text"
                      value={selectedPin.regionEyebrow}
                      onChange={(e) =>
                        updatePinById(selectedPin.id, {
                          regionEyebrow: e.target.value,
                        })
                      }
                      placeholder="e.g. CULTURAL TRIANGLE"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Location Heading
                    </label>
                    <input
                      type="text"
                      value={selectedPin.heading}
                      onChange={(e) =>
                        updatePinById(selectedPin.id, {
                          heading: e.target.value,
                        })
                      }
                      placeholder="e.g. Sigiriya, Dambulla"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Heading Italic Accent
                    </label>
                    <input
                      type="text"
                      value={selectedPin.headingItalic}
                      onChange={(e) =>
                        updatePinById(selectedPin.id, {
                          headingItalic: e.target.value,
                        })
                      }
                      placeholder="e.g. & Ancient Kingdoms."
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Location Description / Details (Shown in Left Text Area)
                  </label>
                  <textarea
                    rows={3}
                    value={selectedPin.description}
                    onChange={(e) =>
                      updatePinById(selectedPin.id, {
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe this location, experiences, and highlights..."
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Key Highlights (Optional · Separated by · or commas)
                  </label>
                  <input
                    type="text"
                    value={selectedPin.highlights}
                    onChange={(e) =>
                      updatePinById(selectedPin.id, {
                        highlights: e.target.value,
                      })
                    }
                    placeholder="e.g. Sigiriya Lion Rock · Pidurangala Sunrise · Dambulla Cave Temple"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      CTA Button Label (Optional)
                    </label>
                    <input
                      type="text"
                      value={selectedPin.ctaLabel}
                      onChange={(e) =>
                        updatePinById(selectedPin.id, {
                          ctaLabel: e.target.value,
                        })
                      }
                      placeholder="e.g. EXPLORE TOURS ↗"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      CTA Button Link (Optional)
                    </label>
                    <input
                      type="text"
                      value={selectedPin.ctaHref}
                      onChange={(e) =>
                        updatePinById(selectedPin.id, {
                          ctaHref: e.target.value,
                        })
                      }
                      placeholder="e.g. /packages"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Horizontal Position X (%)
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={98}
                      step={0.5}
                      value={selectedPin.x}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (Number.isFinite(val)) {
                          updatePinById(selectedPin.id, {
                            x: Math.round(Math.max(2, Math.min(98, val)) * 10) / 10,
                          });
                        }
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Vertical Position Y (%)
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={98}
                      step={0.5}
                      value={selectedPin.y}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (Number.isFinite(val)) {
                          updatePinById(selectedPin.id, {
                            y: Math.round(Math.max(2, Math.min(98, val)) * 10) / 10,
                          });
                        }
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-500"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
