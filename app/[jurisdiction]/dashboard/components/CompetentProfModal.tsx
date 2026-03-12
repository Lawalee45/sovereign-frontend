"use client";

import { useState } from "react";
import { getJurisdictionConfig } from "@/lib/jurisdictions";
import {
  getExportPdfUrl,
  postCompetentProfSignoff
} from "@/lib/api";

interface Props {
  open: boolean;
  jurisdiction: string;
  clientHash: string;
  onClose: () => void;
}

export function CompetentProfModal({
  open,
  jurisdiction,
  clientHash,
  onClose
}: Props) {
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const config = getJurisdictionConfig(jurisdiction);

  const handleConfirm = async () => {
    if (!checked || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await postCompetentProfSignoff(
        clientHash,
        jurisdiction,
        config.competentProfText
      );
      const url = getExportPdfUrl(clientHash);
      window.location.href = url;
      onClose();
    } catch (err) {
      setError("Sign-off failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80">
      <div className="max-w-lg w-full mx-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4">
        <div>
          <p className="text-[11px] tracking-[0.3em] uppercase text-slate-300">
            Competent Professional Declaration
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Required before exporting regulator-facing forensic report.
          </p>
        </div>
        <div className="max-h-64 overflow-y-auto border border-white/10 rounded-md bg-black/40 px-3 py-3 text-xs text-slate-100 leading-relaxed">
          {config.competentProfText}
        </div>
        <label className="flex items-start gap-2 text-xs text-slate-200">
          <input
            type="checkbox"
            className="mt-[3px] h-3 w-3 border border-slate-500 bg-black/40"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <span>I confirm the above declaration.</span>
        </label>
        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded-md border border-white/20 text-slate-200 bg-black/40"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded-md bg-emerald-500 text-black font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!checked || submitting}
            onClick={handleConfirm}
          >
            {submitting ? "Submitting…" : "Confirm & Export"}
          </button>
        </div>
      </div>
    </div>
  );
}

