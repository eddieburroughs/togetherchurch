"use client";

import { useState } from "react";
import { generateLabelsPdf } from "@/features/kids/lib/label-pdf";

interface Template {
  id: string;
  key: string;
  name: string;
  widthMm: number;
  heightMm: number;
  layout: { fields: { key: string; x: number; y: number; fontSize: number; bold?: boolean }[] };
}

interface CheckinData {
  childName: string;
  pickupCode: string;
  allergies: string | null;
}

export function PrintLabelsClient({
  sessionName,
  sessionDate,
  templates,
  checkins,
}: {
  sessionId: string;
  sessionName: string;
  sessionDate: string;
  templates: Template[];
  checkins: CheckinData[];
}) {
  const [selectedTemplate, setSelectedTemplate] = useState(
    templates[1]?.id ?? templates[0]?.id ?? "",
  );
  const [generating, setGenerating] = useState(false);

  async function handlePrint() {
    const template = templates.find((t) => t.id === selectedTemplate);
    if (!template) return;

    setGenerating(true);
    try {
      const labels = checkins.map((c) => ({
        childName: c.childName,
        sessionName,
        date: sessionDate,
        pickupCode: c.pickupCode,
        allergies: c.allergies,
      }));

      const pdfBytes = await generateLabelsPdf(
        template.widthMm,
        template.heightMm,
        template.layout,
        labels,
      );

      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } finally {
      setGenerating(false);
    }
  }

  if (templates.length === 0) {
    return (
      <p className="mt-4 text-sm text-zinc-500">
        No label templates available.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div>
        <label
          htmlFor="template"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Label Template
        </label>
        <select
          id="template"
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.widthMm}mm × {t.heightMm}mm)
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
        <p className="text-xs font-medium text-zinc-500">Preview — {checkins.length} labels</p>
        <div className="mt-2 space-y-1">
          {checkins.map((c, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span>{c.childName}</span>
              <div className="flex items-center gap-2">
                {c.allergies && (
                  <span className="text-xs text-red-500">Allergy</span>
                )}
                <span className="font-mono text-xs font-bold">{c.pickupCode}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handlePrint}
        disabled={generating || !selectedTemplate}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {generating ? "Generating PDF..." : "Generate & Print Labels"}
      </button>
    </div>
  );
}
