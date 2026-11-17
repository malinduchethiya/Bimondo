'use client';

import React, { useState } from 'react';
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
import SriLanka3DTerrainMap from '@/components/SriLanka3DTerrainMap';

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
  const [clickMode, setClickMode] = useState<'move' | 'add'>('move');

  const selectedPin =
    activePins.find((p) => p.id === selectedPinId) || activePins[0] || null;

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
        'Add details for this pinned location. When a visitor hovers or clicks this pin on the 3D map, these details appear in the left text area.',
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

  const handleStageClick = (coords: { x: number; y: number }) => {
    if (clickMode === 'add' || !selectedPin) {
      handleAddPinAt(coords.x, coords.y);
    } else {
      updatePinById(selectedPin.id, { x: coords.x, y: coords.y });
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-md p-5 space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-600" />
            Interactive 3D Terrain Map &amp; Location Pins Studio (#discover)
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Drag any red pin directly across the 3D Sri Lanka terrain, click any
            spot on the 3D terrain to move the selected pin, or drag the
            background to rotate the 3D view.
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
              ? 'Click 3D Terrain to Drop New Pin (Active)'
              : 'Click 3D Terrain to Move Selected Pin'}
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

      {/* Main Split Grid: Interactive 3D Terrain Map Canvas (Left) + Selected Pin Detail Editor (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Interactive 3D Map Box Container */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-medium flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-slate-400" />
              Drag red pins on 3D terrain · Click terrain to{' '}
              {clickMode === 'add' ? 'drop a new pin' : 'move selected pin'} ·
              Drag background to rotate 3D
            </span>
            {selectedPin && (
              <span className="font-mono text-[11px] text-slate-500">
                {selectedPin.label}: X={selectedPin.x}% · Y={selectedPin.y}%
              </span>
            )}
          </div>

          <div className="relative w-full h-[400px] sm:h-[460px] rounded-2xl overflow-hidden border border-slate-300 bg-[#cde4ec] shadow-inner">
            <SriLanka3DTerrainMap
              pins={activePins}
              activePinId={selectedPin?.id ?? null}
              onSelectPin={(pinId) => setSelectedPinId(pinId)}
              enableHoverSelect={false}
              editable
              onMovePin={(pinId, coords) =>
                updatePinById(pinId, { x: coords.x, y: coords.y })
              }
              onStageClick={handleStageClick}
            />
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
