'use client';

import { useCallback, useEffect, useState } from 'react';
import { PublicBookingSettings } from '@/lib/booking-types';

let cachedSettings: PublicBookingSettings | null = null;

export function useBookingSettings() {
  const [settings, setSettings] = useState<PublicBookingSettings | null>(
    cachedSettings
  );
  const [loading, setLoading] = useState<boolean>(!cachedSettings);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/booking/settings', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to load booking configuration.');
      }
      const data: PublicBookingSettings = await res.json();
      cachedSettings = data;
      setSettings(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load booking settings.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/booking/settings', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load booking configuration.');
        return res.json();
      })
      .then((data: PublicBookingSettings) => {
        if (!active) return;
        cachedSettings = data;
        setSettings(data);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load booking settings.'
        );
        setLoading(false);
      });

    const onUpdated = () => {
      refresh();
    };
    window.addEventListener('bimondo:booking-settings-updated', onUpdated);
    return () => {
      active = false;
      window.removeEventListener('bimondo:booking-settings-updated', onUpdated);
    };
  }, [refresh]);

  return { settings, loading, error, refresh };
}
