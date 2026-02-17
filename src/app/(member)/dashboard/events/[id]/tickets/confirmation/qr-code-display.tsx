"use client";

import { useEffect, useState } from "react";
import { generateQrDataUrl } from "@/features/tickets/lib/qr";

export function QrCodeDisplay({
  confirmationCode,
}: {
  confirmationCode: string;
}) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    generateQrDataUrl(confirmationCode).then(setQrUrl);
  }, [confirmationCode]);

  if (!qrUrl) {
    return (
      <div className="flex h-64 w-64 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800">
        <p className="text-sm text-zinc-500">Loading QR...</p>
      </div>
    );
  }

  return (
    <img
      src={qrUrl}
      alt={`QR code for ${confirmationCode}`}
      width={256}
      height={256}
      className="rounded-lg"
    />
  );
}
