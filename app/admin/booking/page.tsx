'use client';

import React, { useState } from 'react';
import PageBanner from '@/components/PageBanner';
import ProviderWidgetEmbed from '@/components/booking/ProviderWidgetEmbed';
import { useBookingSettings } from '@/hooks/useBookingSettings';
import {
  BookingOpenMode,
  BookingProviderId,
  ItemBookingAssignment,
  PublicBookingSettings,
} from '@/lib/booking-types';

export default function AdminBookingSettingsPage() {
  const { settings, loading, refresh } = useBookingSettings();
  const [localDraft, setDraft] = useState<PublicBookingSettings | null>(null);
  const draft = localDraft ?? settings;

  // Server-only API credentials (write-only from admin UI; never sent back in plaintext)
  const [nightsbridgeClientKey, setNightsbridgeClientKey] =
    useState<string>('');
  const [bokunAccessKey, setBokunAccessKey] = useState<string>('');
  const [bokunSecretKey, setBokunSecretKey] = useState<string>('');
  const [viatorApiKey, setViatorApiKey] = useState<string>('');

  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [previewItemId, setPreviewItemId] = useState<string>(
    'ceylon-grand-circuit'
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    setSaveMessage(null);

    try {
      const credentialsPayload: Record<string, string> = {};
      if (nightsbridgeClientKey.trim()) {
        credentialsPayload.nightsbridgeClientKey = nightsbridgeClientKey.trim();
      }
      if (bokunAccessKey.trim()) {
        credentialsPayload.bokunAccessKey = bokunAccessKey.trim();
      }
      if (bokunSecretKey.trim()) {
        credentialsPayload.bokunSecretKey = bokunSecretKey.trim();
      }
      if (viatorApiKey.trim()) {
        credentialsPayload.viatorApiKey = viatorApiKey.trim();
      }

      const res = await fetch('/api/booking/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: draft,
          credentials:
            Object.keys(credentialsPayload).length > 0
              ? credentialsPayload
              : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save booking settings.');
      }

      setDraft(data.settings);
      setNightsbridgeClientKey('');
      setBokunAccessKey('');
      setBokunSecretKey('');
      setViatorApiKey('');
      setSaveMessage(
        'Booking provider settings and item assignments saved successfully.'
      );
      window.dispatchEvent(new CustomEvent('bimondo:booking-settings-updated'));
      await refresh();
    } catch (err) {
      setSaveMessage(
        err instanceof Error ? err.message : 'Error saving settings.'
      );
    } finally {
      setSaving(false);
    }
  };

  const updateAssignment = (
    itemId: string,
    patch: Partial<ItemBookingAssignment>
  ) => {
    if (!draft) return;
    const current = draft.assignments[itemId];
    if (!current) return;
    setDraft({
      ...draft,
      assignments: {
        ...draft.assignments,
        [itemId]: {
          ...current,
          ...patch,
        },
      },
    });
  };

  if (loading || !draft) {
    return (
      <main>
        <PageBanner
          eyebrow="BIMONDO ADMIN  /  BOOKING INTEGRATIONS"
          title="Loading Booking Configuration…"
        />
      </main>
    );
  }

  const assignmentList = Object.values(draft.assignments);
  const previewAssignment =
    draft.assignments[previewItemId] || assignmentList[0];

  const previewCheckoutUrl =
    previewAssignment?.provider === 'nightsbridge' &&
    (previewAssignment.externalId || draft.nightsbridge.bbid)
      ? `${draft.nightsbridge.widgetBaseUrl.replace(/\/+$/, '')}/${encodeURIComponent(
          previewAssignment.externalId || draft.nightsbridge.bbid
        )}`
      : previewAssignment?.provider === 'bokun' &&
        draft.bokun.bookingChannelUuid &&
        (previewAssignment.externalId || draft.bokun.defaultExperienceId)
      ? `https://widgets.bokun.io/online-sales/${encodeURIComponent(
          draft.bokun.bookingChannelUuid
        )}/experience-calendar/${encodeURIComponent(
          previewAssignment.externalId || draft.bokun.defaultExperienceId
        )}`
      : previewAssignment?.externalUrl || draft.viator.defaultBookingUrl || null;

  return (
    <main>
      <PageBanner
        eyebrow="BIMONDO ADMIN DASHBOARD  /  BOOKING INTEGRATIONS"
        title="Manage NightsBridge, Bókun & Viator Integrations"
      />

      <section className="section wrap">
        <form onSubmit={handleSave} className="admin-booking-form">
          {saveMessage && (
            <div className="admin-save-banner" role="status">
              <strong>{saveMessage}</strong>
            </div>
          )}

          {/* 1. THREE PROVIDER CONFIGURATION CARDS */}
          <div className="admin-providers-grid">
            {/* NightsBridge Card */}
            <div className="admin-provider-card">
              <div className="admin-provider-head">
                <div>
                  <span
                    className="eyebrow"
                    style={{ color: 'var(--terracotta)' }}
                  >
                    ACCOMMODATION ENGINE
                  </span>
                  <h3 className="serif" style={{ fontSize: '26px', margin: '4px 0' }}>
                    NightsBridge
                  </h3>
                </div>
                <label className="booking-private-toggle">
                  <input
                    type="checkbox"
                    checked={draft.nightsbridge.enabled}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        nightsbridge: {
                          ...draft.nightsbridge,
                          enabled: e.target.checked,
                        },
                      })
                    }
                  />
                  <span>
                    {draft.nightsbridge.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>

              <div className="admin-field">
                <label>DEFAULT ESTABLISHMENT BBID</label>
                <input
                  type="text"
                  placeholder="e.g. 12345 (from book.nightsbridge.com/12345)"
                  value={draft.nightsbridge.bbid}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      nightsbridge: {
                        ...draft.nightsbridge,
                        bbid: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="admin-field">
                <label>BOOKING ENGINE BASE URL</label>
                <input
                  type="url"
                  value={draft.nightsbridge.widgetBaseUrl}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      nightsbridge: {
                        ...draft.nightsbridge,
                        widgetBaseUrl: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="admin-field">
                <label>DISPLAY MODE</label>
                <select
                  value={draft.nightsbridge.openMode}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      nightsbridge: {
                        ...draft.nightsbridge,
                        openMode: e.target.value as BookingOpenMode,
                      },
                    })
                  }
                >
                  <option value="modal">Modal Overlay</option>
                  <option value="inline">Inline Embed</option>
                  <option value="redirect">Provider Checkout Page</option>
                </select>
              </div>

              <div className="admin-field">
                <label>DEFAULT BUTTON LABEL</label>
                <input
                  type="text"
                  value={draft.nightsbridge.buttonLabel}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      nightsbridge: {
                        ...draft.nightsbridge,
                        buttonLabel: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="admin-field">
                <label>
                  SERVER CLIENT KEY (STORED SERVER-SIDE ONLY ·{' '}
                  {draft.nightsbridge.hasServerCredentials
                    ? 'SET ✓'
                    : 'NOT SET'}
                  )
                </label>
                <input
                  type="password"
                  placeholder="Enter new key to update server secret"
                  value={nightsbridgeClientKey}
                  onChange={(e) => setNightsbridgeClientKey(e.target.value)}
                />
              </div>
            </div>

            {/* Bókun Card */}
            <div className="admin-provider-card">
              <div className="admin-provider-head">
                <div>
                  <span
                    className="eyebrow"
                    style={{ color: 'var(--terracotta)' }}
                  >
                    TOURS &amp; ACTIVITIES
                  </span>
                  <h3 className="serif" style={{ fontSize: '26px', margin: '4px 0' }}>
                    Bókun
                  </h3>
                </div>
                <label className="booking-private-toggle">
                  <input
                    type="checkbox"
                    checked={draft.bokun.enabled}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        bokun: {
                          ...draft.bokun,
                          enabled: e.target.checked,
                        },
                      })
                    }
                  />
                  <span>{draft.bokun.enabled ? 'Enabled' : 'Disabled'}</span>
                </label>
              </div>

              <div className="admin-field">
                <label>BÓKUN BOOKING CHANNEL UUID</label>
                <input
                  type="text"
                  placeholder="e.g. a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                  value={draft.bokun.bookingChannelUuid}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      bokun: {
                        ...draft.bokun,
                        bookingChannelUuid: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="admin-field">
                <label>DEFAULT EXPERIENCE / ACTIVITY ID</label>
                <input
                  type="text"
                  placeholder="e.g. 849201"
                  value={draft.bokun.defaultExperienceId}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      bokun: {
                        ...draft.bokun,
                        defaultExperienceId: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="admin-field">
                <label>DISPLAY MODE</label>
                <select
                  value={draft.bokun.openMode}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      bokun: {
                        ...draft.bokun,
                        openMode: e.target.value as BookingOpenMode,
                      },
                    })
                  }
                >
                  <option value="modal">Modal Overlay</option>
                  <option value="inline">Inline Widget</option>
                  <option value="redirect">Bókun Checkout Page</option>
                </select>
              </div>

              <div className="admin-field">
                <label>DEFAULT BUTTON LABEL</label>
                <input
                  type="text"
                  value={draft.bokun.buttonLabel}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      bokun: {
                        ...draft.bokun,
                        buttonLabel: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="admin-field">
                <label>
                  SERVER API ACCESS &amp; SECRET KEYS (
                  {draft.bokun.hasServerCredentials ? 'SET ✓' : 'NOT SET'})
                </label>
                <input
                  type="text"
                  placeholder="Bókun Access Key (server-side)"
                  value={bokunAccessKey}
                  onChange={(e) => setBokunAccessKey(e.target.value)}
                  style={{ marginBottom: '6px' }}
                />
                <input
                  type="password"
                  placeholder="Bókun Secret Key (server-side)"
                  value={bokunSecretKey}
                  onChange={(e) => setBokunSecretKey(e.target.value)}
                />
              </div>
            </div>

            {/* Viator Card */}
            <div className="admin-provider-card">
              <div className="admin-provider-head">
                <div>
                  <span
                    className="eyebrow"
                    style={{ color: 'var(--terracotta)' }}
                  >
                    EXPERIENCES &amp; AFFILIATE
                  </span>
                  <h3 className="serif" style={{ fontSize: '26px', margin: '4px 0' }}>
                    Viator
                  </h3>
                </div>
                <label className="booking-private-toggle">
                  <input
                    type="checkbox"
                    checked={draft.viator.enabled}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        viator: {
                          ...draft.viator,
                          enabled: e.target.checked,
                        },
                      })
                    }
                  />
                  <span>{draft.viator.enabled ? 'Enabled' : 'Disabled'}</span>
                </label>
              </div>

              <div className="admin-field">
                <label>VIATOR PARTNER / AFFILIATE ID (PID)</label>
                <input
                  type="text"
                  placeholder="e.g. P00012345"
                  value={draft.viator.partnerId}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      viator: {
                        ...draft.viator,
                        partnerId: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="admin-field">
                <label>DEFAULT OFFICIAL VIATOR LISTING URL</label>
                <input
                  type="url"
                  placeholder="https://www.viator.com/Sri-Lanka/..."
                  value={draft.viator.defaultBookingUrl}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      viator: {
                        ...draft.viator,
                        defaultBookingUrl: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="admin-field">
                <label>DISPLAY MODE</label>
                <select
                  value={draft.viator.openMode}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      viator: {
                        ...draft.viator,
                        openMode: e.target.value as BookingOpenMode,
                      },
                    })
                  }
                >
                  <option value="redirect">Official Viator Checkout Page</option>
                  <option value="modal">Modal Summary &amp; Redirect</option>
                  <option value="inline">Inline Widget Embed</option>
                </select>
              </div>

              <div className="admin-field">
                <label>DEFAULT BUTTON LABEL</label>
                <input
                  type="text"
                  value={draft.viator.buttonLabel}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      viator: {
                        ...draft.viator,
                        buttonLabel: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="admin-field">
                <label>
                  SERVER VIATOR PARTNER API KEY (
                  {draft.viator.hasServerCredentials ? 'SET ✓' : 'NOT SET'})
                </label>
                <input
                  type="password"
                  placeholder="Enter Viator API key (stored server-side)"
                  value={viatorApiKey}
                  onChange={(e) => setViatorApiKey(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 2. ITEM-LEVEL PROVIDER ASSIGNMENTS */}
          <div className="admin-assignments-card">
            <div className="section-head" style={{ marginBottom: '20px' }}>
              <div>
                <span
                  className="eyebrow"
                  style={{ color: 'var(--terracotta)' }}
                >
                  TOUR, ACCOMMODATION &amp; EXPERIENCE MAPPING
                </span>
                <h3 className="serif" style={{ fontSize: '28px', margin: '6px 0 0' }}>
                  Assign Providers &amp; Widget IDs per Item
                </h3>
              </div>
              <button
                type="submit"
                className="pill dark"
                disabled={saving}
              >
                {saving ? 'SAVING CHANGES…' : 'SAVE ALL BOOKING SETTINGS'}
              </button>
            </div>

            <div className="admin-assignments-table-wrap">
              <table className="admin-assignments-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Type</th>
                    <th>Provider</th>
                    <th>External ID (BBID / Activity ID / Code)</th>
                    <th>Official Checkout URL / Override</th>
                    <th>Button Label</th>
                    <th>Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {assignmentList.map((item) => (
                    <tr key={item.itemId}>
                      <td>
                        <strong>{item.itemName}</strong>
                        <small style={{ display: 'block', color: 'var(--muted)' }}>
                          {item.itemId}
                        </small>
                      </td>
                      <td>
                        <span className="admin-type-pill">{item.itemType}</span>
                      </td>
                      <td>
                        <select
                          value={item.provider}
                          onChange={(e) =>
                            updateAssignment(item.itemId, {
                              provider: e.target.value as BookingProviderId,
                            })
                          }
                        >
                          <option value="nightsbridge">NightsBridge</option>
                          <option value="bokun">Bókun</option>
                          <option value="viator">Viator</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder={
                            item.provider === 'nightsbridge'
                              ? 'BBID'
                              : item.provider === 'bokun'
                              ? 'Activity ID'
                              : 'Product Code'
                          }
                          value={item.externalId}
                          onChange={(e) =>
                            updateAssignment(item.itemId, {
                              externalId: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={item.externalUrl}
                          onChange={(e) =>
                            updateAssignment(item.itemId, {
                              externalUrl: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.buttonLabel}
                          onChange={(e) =>
                            updateAssignment(item.itemId, {
                              buttonLabel: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="pill"
                          style={{
                            padding: '6px 12px',
                            minHeight: '32px',
                            fontSize: '10.5px',
                          }}
                          onClick={() => setPreviewItemId(item.itemId)}
                        >
                          Preview
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. LIVE WIDGET PREVIEW PANEL */}
          {previewAssignment && (
            <div className="admin-preview-card">
              <div className="section-head" style={{ marginBottom: '16px' }}>
                <div>
                  <span
                    className="eyebrow"
                    style={{ color: 'var(--terracotta)' }}
                  >
                    LIVE WIDGET PREVIEW · {previewAssignment.provider.toUpperCase()}
                  </span>
                  <h3 className="serif" style={{ fontSize: '26px', margin: '4px 0 0' }}>
                    Previewing: {previewAssignment.itemName}
                  </h3>
                </div>
              </div>

              <ProviderWidgetEmbed
                provider={previewAssignment.provider}
                itemName={previewAssignment.itemName}
                externalId={
                  previewAssignment.externalId ||
                  (previewAssignment.provider === 'nightsbridge'
                    ? draft.nightsbridge.bbid
                    : previewAssignment.provider === 'bokun'
                    ? draft.bokun.defaultExperienceId
                    : '')
                }
                bokunChannelUuid={draft.bokun.bookingChannelUuid}
                bokunScriptUrl={draft.bokun.widgetScriptUrl}
                checkoutUrl={previewCheckoutUrl}
                customEmbedCode={previewAssignment.embedCode}
              />
            </div>
          )}
        </form>
      </section>
    </main>
  );
}
