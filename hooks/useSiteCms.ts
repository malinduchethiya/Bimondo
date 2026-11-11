'use client';

import { useCallback, useEffect, useState } from 'react';
import { getDefaultCmsData, SiteCmsData } from '@/lib/cms-defaults';

export function useSiteCms() {
  const [cms, setCms] = useState<SiteCmsData>(() => getDefaultCmsData());
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCms = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/cms', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.cms) {
        setCms(data.cms);
      }
    } catch {
      // keep default fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/cms', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data?.cms) {
          setCms(data.cms);
        }
      })
      .catch(() => {
        // ignore
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const onUpdated = () => {
      fetchCms();
    };
    window.addEventListener('bimondo:cms-updated', onUpdated);
    return () => {
      active = false;
      window.removeEventListener('bimondo:cms-updated', onUpdated);
    };
  }, [fetchCms]);

  return {
    cms,
    loading,
    refresh: fetchCms,
    setCms,
  };
}
