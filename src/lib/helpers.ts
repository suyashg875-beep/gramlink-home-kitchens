import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const CATEGORIES = ["Pickles", "Papad", "Masalas", "Sweets", "Snacks", "Other"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_EMOJI: Record<string, string> = {
  Pickles: "🥭",
  Papad: "🫓",
  Masalas: "🌶️",
  Sweets: "🍬",
  Snacks: "🥨",
  Other: "🧺",
};

export const rupees = (n: number) =>
  "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export const errMsg = (e: unknown) =>
  e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Something went wrong";

/** Customer's chosen pincode, saved on this device. */
export function useArea() {
  const [pincode, setPincodeState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setPincodeState(localStorage.getItem("gramlink-pincode"));
    setReady(true);
  }, []);
  const setPincode = (p: string | null) => {
    if (p) localStorage.setItem("gramlink-pincode", p);
    else localStorage.removeItem("gramlink-pincode");
    setPincodeState(p);
  };
  return { pincode, setPincode, ready };
}

/** Product photos live in private storage; get short signed links to show them. */
export function useSignedImages(paths: string[]) {
  const key = paths.join("|");
  return useQuery({
    queryKey: ["signed-images", key],
    enabled: paths.length > 0,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.storage.from("product-images").createSignedUrls(paths, 3600);
      const map: Record<string, string> = {};
      (data ?? []).forEach((d) => {
        if (d.path && d.signedUrl) map[d.path] = d.signedUrl;
      });
      return map;
    },
  });
}

export const ORDER_STEPS = ["pending", "accepted", "preparing", "ready", "completed"] as const;

export const STATUS_LABEL: Record<string, string> = {
  pending: "Waiting for seller",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};
