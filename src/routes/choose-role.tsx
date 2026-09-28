import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { errMsg } from "@/lib/helpers";
import { Page } from "@/components/gram";
import { homeFor } from "./auth";

export const Route = createFileRoute("/choose-role")({
  head: () => ({
    meta: [
      { title: "Choose how you'll use GramLink" },
      { name: "description", content: "Tell us if you want to buy or sell homemade food on GramLink." },
      { property: "og:title", content: "Choose how you'll use GramLink" },
      { property: "og:description", content: "Buy or sell homemade food on GramLink." },
    ],
  }),
  component: ChooseRole,
});

function ChooseRole() {
  const { user, role, loading, refreshRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (role) navigate({ to: homeFor(role) });
  }, [user, role, loading, navigate]);

  const pick = async (r: "customer" | "seller") => {
    const { error } = await supabase.rpc("choose_role", { _role: r });
    if (error) return toast.error(errMsg(error));
    await refreshRole();
  };

  return (
    <Page title="One quick question">
      <p className="mb-5 text-lg text-muted-foreground">How will you use GramLink?</p>
      <div className="grid gap-4">
        <button onClick={() => pick("customer")} className="rounded-3xl border-2 bg-card p-6 text-left">
          <div className="text-4xl">🛒</div>
          <div className="mt-2 text-xl font-bold">I want to buy food</div>
          <div className="text-muted-foreground">Order homemade food from nearby makers.</div>
        </button>
        <button onClick={() => pick("seller")} className="rounded-3xl border-2 bg-card p-6 text-left">
          <div className="text-4xl">👩‍🍳</div>
          <div className="mt-2 text-xl font-bold">I want to sell my food</div>
          <div className="text-muted-foreground">Reach customers near your village or town.</div>
        </button>
      </div>
    </Page>
  );
}
