"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";
import { importPeople, type ImportRow } from "@/features/people/server/actions";

type Step = "upload" | "map" | "preview" | "importing" | "done";

const TARGET_FIELDS = [
  { key: "first_name", label: "First Name", required: true },
  { key: "last_name", label: "Last Name", required: true },
  { key: "email", label: "Email", required: false },
  { key: "phone", label: "Phone", required: false },
  { key: "household", label: "Household", required: false },
  { key: "tags", label: "Tags (comma-separated)", required: false },
] as const;

type TargetKey = (typeof TARGET_FIELDS)[number]["key"];

export function ImportWizard() {
  const [step, setStep] = useState<Step>("upload");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<TargetKey, string>>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    household: "",
    tags: "",
  });
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete(results) {
          const headers = results.meta.fields ?? [];
          const rows = results.data as Record<string, string>[];
          setCsvHeaders(headers);
          setCsvRows(rows);

          // Auto-map by fuzzy matching
          const autoMap = { ...mapping };
          for (const field of TARGET_FIELDS) {
            const match = headers.find(
              (h) =>
                h.toLowerCase().replace(/[_\s-]/g, "") ===
                field.key.replace(/_/g, ""),
            );
            if (match) autoMap[field.key] = match;
          }
          // Try common aliases
          if (!autoMap.first_name) {
            const m = headers.find((h) =>
              /first.?name|fname|given/i.test(h),
            );
            if (m) autoMap.first_name = m;
          }
          if (!autoMap.last_name) {
            const m = headers.find((h) =>
              /last.?name|lname|surname|family/i.test(h),
            );
            if (m) autoMap.last_name = m;
          }
          if (!autoMap.email) {
            const m = headers.find((h) => /e.?mail/i.test(h));
            if (m) autoMap.email = m;
          }
          if (!autoMap.phone) {
            const m = headers.find((h) => /phone|mobile|cell/i.test(h));
            if (m) autoMap.phone = m;
          }

          setMapping(autoMap);
          setStep("map");
        },
        error(err) {
          setError(`Failed to parse CSV: ${err.message}`);
        },
      });
    },
    [mapping],
  );

  function getMappedRows(): ImportRow[] {
    return csvRows
      .map((row) => ({
        first_name: row[mapping.first_name]?.trim() ?? "",
        last_name: row[mapping.last_name]?.trim() ?? "",
        email: mapping.email ? row[mapping.email]?.trim() : undefined,
        phone: mapping.phone ? row[mapping.phone]?.trim() : undefined,
        household: mapping.household
          ? row[mapping.household]?.trim()
          : undefined,
        tags: mapping.tags ? row[mapping.tags]?.trim() : undefined,
      }))
      .filter((r) => r.first_name && r.last_name);
  }

  async function handleImport() {
    setStep("importing");
    setError(null);
    try {
      const rows = getMappedRows();
      const res = await importPeople(rows);
      setResult(res);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
      setStep("preview");
    }
  }

  return (
    <div className="mt-6">
      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <label className="cursor-pointer">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Click to upload a CSV file
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
          <p className="mt-2 text-xs text-zinc-400">
            Expected columns: first_name, last_name, email, phone, household,
            tags
          </p>
        </div>
      )}

      {/* Step 2: Map columns */}
      {step === "map" && (
        <div>
          <h2 className="text-lg font-semibold">
            Map Columns ({csvRows.length} rows found)
          </h2>
          <div className="mt-4 space-y-3">
            {TARGET_FIELDS.map((field) => (
              <div
                key={field.key}
                className="flex items-center gap-4"
              >
                <label className="w-40 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {field.label}
                  {field.required && (
                    <span className="text-red-500"> *</span>
                  )}
                </label>
                <select
                  value={mapping[field.key]}
                  onChange={(e) =>
                    setMapping({ ...mapping, [field.key]: e.target.value })
                  }
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="">— skip —</option>
                  {csvHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setStep("upload")}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Back
            </button>
            <button
              onClick={() => {
                if (!mapping.first_name || !mapping.last_name) {
                  setError("First Name and Last Name are required.");
                  return;
                }
                setError(null);
                setStep("preview");
              }}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Preview
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === "preview" && (
        <div>
          <h2 className="text-lg font-semibold">
            Preview (first 20 of {getMappedRows().length})
          </h2>
          <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <tr>
                  <th className="px-3 py-2 font-medium">First</th>
                  <th className="px-3 py-2 font-medium">Last</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Phone</th>
                  <th className="px-3 py-2 font-medium">Household</th>
                  <th className="px-3 py-2 font-medium">Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {getMappedRows()
                  .slice(0, 20)
                  .map((row, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{row.first_name}</td>
                      <td className="px-3 py-2">{row.last_name}</td>
                      <td className="px-3 py-2 text-zinc-500">
                        {row.email ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-zinc-500">
                        {row.phone ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-zinc-500">
                        {row.household ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-zinc-500">
                        {row.tags ?? "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setStep("map")}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Back
            </button>
            <button
              onClick={handleImport}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Import {getMappedRows().length} People
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Importing */}
      {step === "importing" && (
        <div className="py-12 text-center">
          <p className="text-sm text-zinc-500">Importing... please wait.</p>
        </div>
      )}

      {/* Done */}
      {step === "done" && result && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-6 text-center dark:border-green-700 dark:bg-green-950">
          <h2 className="text-lg font-semibold text-green-900 dark:text-green-200">
            Import Complete
          </h2>
          <p className="mt-2 text-sm text-green-700 dark:text-green-400">
            {result.imported} imported, {result.skipped} skipped (duplicates),{" "}
            {result.total} total rows.
          </p>
          <a
            href="/admin/people"
            className="mt-4 inline-block rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-200 dark:text-green-900"
          >
            View People
          </a>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
