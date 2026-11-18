'use client';

import React, { useState } from 'react';
import { CheckCircle2, Download, FileCheck2, ShieldCheck } from 'lucide-react';
import { SiteCmsData } from '@/lib/cms-defaults';
import {
  DestinationMigrationDryRunReport,
  inspectDestinationsCatalogMigrationDryRun,
  mergeDestinationsPreservingExisting,
} from '@/lib/content-repository';
import { SRI_LANKA_47_DESTINATIONS } from '@/lib/sri-lanka-47-destinations';

interface AdminDestinationsCatalogSyncBarProps {
  draft: SiteCmsData;
  onMutateDraft: (mutator: (prev: SiteCmsData) => SiteCmsData) => void;
  onFeedback: (msg: string) => void;
}

export default function AdminDestinationsCatalogSyncBar({
  draft,
  onMutateDraft,
  onFeedback,
}: AdminDestinationsCatalogSyncBarProps) {
  const [dryRunReport, setDryRunReport] =
    useState<DestinationMigrationDryRunReport | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);

  const activeDestinations = (draft.destinations || []).filter(
    (d) => !d.deletedAt
  );
  const withImagesCount = activeDestinations.filter((d) =>
    Boolean((d.imageRef?.url || d.image || '').trim())
  ).length;

  const handleRunDryRun = async () => {
    setIsInspecting(true);
    try {
      const report = await inspectDestinationsCatalogMigrationDryRun();
      setDryRunReport(report);
    } finally {
      setIsInspecting(false);
    }
  };

  const handleDownloadBackupJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      destinationsCount: draft.destinations?.length || 0,
      destinations: draft.destinations || [],
      rawFirestoreBackup: dryRunReport?.rawBackupPayload || null,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bimondo-destinations-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSafeSync47 = () => {
    onMutateDraft((prev) => ({
      ...prev,
      destinations: mergeDestinationsPreservingExisting(
        prev.destinations,
        SRI_LANKA_47_DESTINATIONS
      ),
    }));
    onFeedback(
      'Merged all 47 Sri Lanka destination guides while preserving 100% of existing images, R2 keys, visibility, and order. Click "Save Changes" to publish to Firestore.'
    );
  };

  const preservedWithImages =
    dryRunReport?.preservedExistingRecords.filter((r) => r.hasAssignedImage) ||
    [];

  return (
    <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              47-Destination Guide Catalog · Non-Destructive Image Protection Active
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {activeDestinations.length} active destination guides loaded (
            {withImagesCount} with assigned R2/CMS images,{' '}
            {activeDestinations.length - withImagesCount} text-only cards awaiting
            optional admin image upload). Existing images are never overwritten.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadBackupJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON Backup
          </button>

          <button
            type="button"
            onClick={handleRunDryRun}
            disabled={isInspecting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md cursor-pointer"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            {isInspecting ? 'Inspecting...' : 'Run Migration Dry-Run Check'}
          </button>

          <button
            type="button"
            onClick={handleSafeSync47}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Sync All 47 Guides (Preserve Images)
          </button>
        </div>
      </div>

      {dryRunReport && (
        <div className="border-t border-slate-100 pt-3 text-xs text-slate-600 space-y-2">
          <div className="flex flex-wrap items-center gap-4 font-medium text-slate-800">
            <span>
              Existing Firestore Records: {dryRunReport.rawFirestoreCount}
            </span>
            <span>
              Preserved Existing Records:{' '}
              {dryRunReport.preservedExistingRecords.length}
            </span>
            <span>
              Newly Added from 47-Guide Catalog:{' '}
              {dryRunReport.newlyAppendedRecords.length}
            </span>
            <span>Total After Merge: {dryRunReport.totalAfterMerge}</span>
          </div>
          {preservedWithImages.length > 0 && (
            <div className="text-[11px] text-emerald-700 bg-emerald-50/70 border border-emerald-200 rounded px-3 py-2">
              Verified preserved image placements ({preservedWithImages.length}
              ):{' '}
              {preservedWithImages
                .map((r) => `${r.name} (${r.id})`)
                .join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
