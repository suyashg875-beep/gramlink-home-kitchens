import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { errMsg } from "@/lib/helpers";
import { BigButton, Page, inputCls, labelCls } from "@/components/gram";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Log in or sign up — GramLink" },
      { name: "description", content: "Join GramLink to buy homemade food from nearby makers, or start selling your own." },
      { property: "og:title", content: "Log in or sign up — GramLink" },
      { property: "og:description", content: "Buy or sell homemade pickles, papad, masalas and sweets near you." },
    ],
  }),
  component: AuthPage,
});

export function homeFor(role: string | null) {
  if (role === "seller") return "/sell";
  if (role === "admin") return "/admin";
  if (role === "customer") return "/";
  return "/choose-role";
}

function AuthPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [chosenRole, setChosenRole] = useState<"customer" | "seller">("customer");
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: homeFor(role) });
  }, [user, role, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: window.location.origin + "/auth",
            data: { full_name: form.name, phone: form.phone, role: chosenRole },
          },
        });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (res.error) toast.error(errMsg(res.error));
  };

  if (sent) {
    return (
      <Page>
        <div className="rounded-3xl bg-card p-8 text-center shadow-sm">
          <div className="text-5xl">📩</div>
          <h1 className="mt-3 text-2xl font-bold">Check your email</h1>
          <p className="mt-2 text-muted-foreground">
            We sent a link to <b>{form.email}</b>. Tap it to confirm your account, then log in.
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold">{mode === "login" ? "Welcome back 🙏" : "Join GramLink"}</h1>
        <p className="mt-1 text-muted-foreground">
          {mode === "login" ? "Log in to continue." : "Fresh homemade food, straight from nearby kitchens."}
        </p>

        <div className="mt-5 grid grid-cols-2 rounded-2xl bg-muted p-1">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn("h-11 rounded-xl font-bold", mode === m ? "bg-card shadow-sm" : "text-muted-foreground")}
            >
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          {mode === "signup" && (
            <>
              <div>
                <span className={labelCls}>I want to</span>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ["customer", "🛒", "Buy food"],
                    ["seller", "👩‍🍳", "Sell my food"],
                  ] as const).map(([r, e, l]) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setChosenRole(r)}
                      className={cn(
                        "rounded-2xl border-2 p-4 text-center font-bold",
                        chosenRole === r ? "border-primary bg-secondary" : "bg-card",
                      )}
                    >
                      <div className="text-3xl">{e}</div>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Full name</label>
                <input required className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Phone number</label>
                <input required type="tel" inputMode="tel" className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </>
          )}
          <div>
            <label className={labelCls}>Email</label>
            <input required type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Password</label>
            <input required type="password" minLength={6} className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <BigButton disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</BigButton>
        </form>

        <div className="my-5 flex items-center gap-3 text-sm text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
        </div>
        <button onClick={google} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 bg-card font-bold">
          <span className="text-xl">G</span> Continue with Google
        </button>
      </div>
    </Page>
  );
}
