import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, CATEGORY_EMOJI, useArea, useSignedImages } from "@/lib/helpers";
import { useAuth } from "@/lib/auth";
import { BigButton, Empty, Page, ProductCard, inputCls } from "@/components/gram";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GramLink — Homemade food from kitchens near you" },
      { name: "description", content: "Buy homemade pickles, papad, masalas, laddoo and snacks directly from verified home cooks near your pincode. Cash on delivery." },
      { property: "og:title", content: "GramLink — Homemade food from kitchens near you" },
      { property: "og:description", content: "Pickles, papad, masalas and sweets from verified home cooks near you." },
    ],
  }),
  component: Home,
});

function AreaPicker({ onPick }: { onPick: (p: string) => void }) {
  const [value, setValue] = useState("");
  const valid = /^\d{6}$/.test(value);
  return (
    <Page>
      <div className="rounded-3xl bg-primary p-6 text-primary-foreground">
        <div className="text-4xl">🏡</div>
        <h1 className="mt-2 text-3xl font-bold">Homemade food, from next door</h1>
        <p className="mt-2 opacity-90">Pickles, papad, masalas and sweets made by home cooks in your area.</p>
      </div>
      <form
        className="mt-6 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onPick(value);
        }}
      >
        <label className="block text-lg font-bold">Enter your area pincode</label>
        <input
          className={cn(inputCls, "h-14 text-center text-2xl tracking-[0.3em]")}
          inputMode="numeric"
          maxLength={6}
          placeholder="411001"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
        />
        <BigButton disabled={!valid}>
          <MapPin className="h-5 w-5" /> Show food near me
        </BigButton>
      </form>
    </Page>
  );
}

function Home() {
  const { pincode, setPincode, ready } = useArea();
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const prefix = pincode?.slice(0, 3);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["home-products", showAll ? "all" : prefix],
    enabled: !!pincode,
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id,name,price,category,image_urls,description,stock,is_available,seller_profiles!inner(business_name,pincode,village_or_area)")
        .eq("is_published", true)
        .eq("is_available", true)
        .order("created_at", { ascending: false })
        .limit(200);
      if (!showAll && prefix) q = q.like("seller_profiles.pincode", `${prefix}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const filtered = products.filter(
    (p) =>
      (!cat || p.category === cat) &&
      (!search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.seller_profiles.business_name.toLowerCase().includes(search.toLowerCase())),
  );
  const { data: urls = {} } = useSignedImages(filtered.map((p) => p.image_urls[0]).filter(Boolean));

  if (!ready) return <Page><div className="h-60 animate-pulse rounded-3xl bg-muted" /></Page>;
  if (!pincode) return <AreaPicker onPick={setPincode} />;

  return (
    <Page>
      {(role === "seller" || role === "admin") && (
        <Link
          to={role === "seller" ? "/sell" : "/admin"}
          className="mb-4 block rounded-2xl bg-accent p-4 font-bold text-accent-foreground"
        >
          Go to your {role === "seller" ? "seller dashboard" : "admin dashboard"} →
        </Link>
      )}
      <button onClick={() => setPincode(null)} className="mb-3 flex items-center gap-1 text-sm font-bold text-primary">
        <MapPin className="h-4 w-4" /> {showAll ? "All areas" : `Near ${pincode}`} · Change
      </button>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          className={cn(inputCls, "h-14 pl-12")}
          placeholder="Search mango pickle, laddoo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip active={!cat} onClick={() => setCat(null)}>All</Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c} active={cat === c} onClick={() => setCat(cat === c ? null : c)}>
            {CATEGORY_EMOJI[c]} {c}
          </Chip>
        ))}
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Empty emoji="🧺" title="No food found here yet">
            {!showAll && (
              <button onClick={() => setShowAll(true)} className="font-bold text-primary underline">
                See sellers from all areas
              </button>
            )}
          </Empty>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                price={Number(p.price)}
                category={p.category}
                image={urls[p.image_urls[0] ?? ""]}
                sellerName={p.seller_profiles.business_name}
              />
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border-2 px-4 py-2 font-bold",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card",
      )}
    >
      {children}
    </button>
  );
}
