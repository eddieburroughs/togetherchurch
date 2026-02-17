"use client";

import { useState } from "react";
import { refundOrder } from "@/features/tickets/server/actions";
import { useRouter } from "next/navigation";

export function RefundButton({ orderId, amount }: { orderId: string; amount: string }) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  async function handleRefund() {
    const msg = amount === "Free"
      ? "Cancel this free ticket order?"
      : `Refund ${amount} for this order?`;
    if (!confirm(msg)) return;

    setProcessing(true);
    try {
      await refundOrder(orderId);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Refund failed.");
      setProcessing(false);
    }
  }

  return (
    <button
      onClick={handleRefund}
      disabled={processing}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
    >
      {processing ? "..." : "Refund"}
    </button>
  );
}
