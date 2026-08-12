"use client";

import { useEffect, useState } from "react";

export function PaymentReturnStatus({ token }: { token: string }) {
  const [message, setMessage] = useState("Checking verified payment status…");

  useEffect(() => {
    let active = true;
    fetch(`/api/orders/${encodeURIComponent(token)}`)
      .then(async (response) => {
        const payload = await response.json() as { error?: string; order?: { paymentStatus?: string } };
        if (!response.ok || !payload.order) throw new Error(payload.error || "Order status is unavailable.");
        if (!active) return;
        if (payload.order.paymentStatus === "paid") {
          window.localStorage.removeItem("baylayer-cart-v2");
          setMessage("Payment is verified. Your cart is clear and production review can begin.");
        } else {
          setMessage("Payment is still pending verification. Your cart is preserved; use the tracking page to refresh.");
        }
      })
      .catch(() => active && setMessage("Status is temporarily unavailable. Your cart is preserved; use the tracking page to refresh."));
    return () => { active = false; };
  }, [token]);

  return <p role="status">{message}</p>;
}
