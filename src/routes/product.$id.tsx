import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { rupees, useSignedImages } from "@/lib/helpers";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { BigButton, Empty, Page, ProductThumb, Stars, VerifiedBadge } from "@/components/gram";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Homemade product — GramLink" },
      { name: "description", content: "See photos, price and reviews for this homemade product from a verified GramLink seller." },
      { property: "og:title", content: "Homemade product — GramLink" },
      { property: "og:description", content: "Homemade food from a verified GramLink seller near you." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { add } = useCart();
  const { role } = useAuth();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);

  const { data: p, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, seller_profiles(user_id,business_name,village_or_area,status)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ["seller-reviews", p?.seller_id],
    enabled: !!p,
    queryFn: async () => {
      const { data } = await supabase.from("reviews").select("*").eq("seller_id", p!.seller_id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const { data: urls = {} } = useSignedImages(p?.image_urls ?? []);

  if (isLoading) return <Page><div className="aspect-square animate-pulse rounded-3xl bg-muted" /></Page>;
  if (!p) return <Page><Empty emoji="🤔" title="Product not found" /></Page>;

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const canBuy = p.is_available && p.stock > 0 && p.is_published;

  const addToCart = (go: boolean) => {
    add(
      {
        productId: p.id,
        name: p.name,
        price: Number(p.price),
        image: p.image_urls[0] ?? null,
        sellerId: p.seller_id,
        sellerName: p.seller_profiles?.business_name ?? "",
        stock: p.stock,
      },
      qty,
    );
    toast.success("Added to cart");
    if (go) navigate({ to: "/cart" });
  };

  return (
    <Page>
      <div className="aspect-square overflow-hidden rounded-3xl border bg-card">
        <ProductThumb url={urls[p.image_urls[active]]} category={p.category} />
      </div>
      {p.image_urls.length > 1 && (
        <div className="mt-2 flex gap-2">
          {p.image_urls.map((path, i) => (
            <button key={path} onClick={() => setActive(i)} className={`h-16 w-16 overflow-hidden rounded-xl border-2 ${i === active ? "border-primary" : ""}`}>
              <ProductThumb url={urls[path]} category={p.category} />
            </button>
          ))}
        </div>
      )}

      <div className="mt-4">
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">{p.category}</span>
        <h1 className="mt-2 text-3xl font-bold">{p.name}</h1>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <Stars value={avg} /> {reviews.length ? `${avg.toFixed(1)} (${reviews.length} reviews)` : "No reviews yet"}
        </div>
        <div className="mt-3 font-display text-4xl font-bold text-primary">{rupees(Number(p.price))}</div>
        <div className="mt-1 text-sm font-semibold">
          {canBuy ? <span className="text-success">{p.stock} in stock</span> : <span className="text-destructive">Out of stock</span>}
        </div>
        {p.description && <p className="mt-4 whitespace-pre-line text-lg leading-relaxed">{p.description}</p>}
      </div>

      {p.seller_profiles && (
        <Link to="/seller/$id" params={{ id: p.seller_id }} className="mt-5 block rounded-2xl border bg-card p-4">
          <div className="text-sm text-muted-foreground">Made by</div>
          <div className="text-xl font-bold">{p.seller_profiles.business_name}</div>
          <div className="text-sm text-muted-foreground">{p.seller_profiles.village_or_area}</div>
          {p.seller_profiles.status === "verified" && <div className="mt-2"><VerifiedBadge /></div>}
        </Link>
      )}

      {canBuy && (role === null || role === "customer") && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-center gap-5">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-12 w-12 place-items-center rounded-full border-2 bg-card"><Minus /></button>
            <span className="w-10 text-center text-2xl font-bold">{qty}</span>
            <button onClick={() => setQty(Math.min(p.stock, qty + 1))} className="grid h-12 w-12 place-items-center rounded-full border-2 bg-card"><Plus /></button>
          </div>
          <BigButton onClick={() => addToCart(true)}>Buy now · {rupees(Number(p.price) * qty)}</BigButton>
          <BigButton onClick={() => addToCart(false)} className="bg-saffron text-saffron-foreground">Add to cart</BigButton>
        </div>
      )}

      {reviews.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-2xl font-bold">What customers say</h2>
          <div className="space-y-3">
            {reviews.slice(0, 5).map((r) => (
              <div key={r.id} className="rounded-2xl border bg-card p-4">
                <div className="flex items-center justify-between"><b>{r.customer_name || "Customer"}</b><Stars value={r.rating} /></div>
                {r.comment && <p className="mt-1 text-muted-foreground">{r.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </Page>
  );
}
