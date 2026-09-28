import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSignedImages } from "@/lib/helpers";
import { Empty, Page, ProductCard, Stars, VerifiedBadge } from "@/components/gram";

export const Route = createFileRoute("/seller/$id")({
  head: () => ({
    meta: [
      { title: "Home kitchen — GramLink" },
      { name: "description", content: "Products and reviews from a verified GramLink home food maker." },
      { property: "og:title", content: "Home kitchen — GramLink" },
      { property: "og:description", content: "See what this home cook makes and what customers say." },
    ],
  }),
  component: SellerPage,
});

function SellerPage() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["seller-public", id],
    queryFn: async () => {
      const [s, p, r] = await Promise.all([
        supabase.from("seller_profiles").select("user_id,business_name,about,village_or_area,status").eq("user_id", id).maybeSingle(),
        supabase.from("products").select("id,name,price,category,image_urls").eq("seller_id", id).eq("is_published", true).eq("is_available", true),
        supabase.from("reviews").select("*").eq("seller_id", id).order("created_at", { ascending: false }),
      ]);
      return { seller: s.data, products: p.data ?? [], reviews: r.data ?? [] };
    },
  });
  const { data: urls = {} } = useSignedImages((data?.products ?? []).map((p) => p.image_urls[0]).filter(Boolean));

  if (isLoading) return <Page><div className="h-40 animate-pulse rounded-3xl bg-muted" /></Page>;
  if (!data?.seller) return <Page><Empty emoji="🤔" title="Seller not found" /></Page>;
  const { seller, products, reviews } = data;
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <Page>
      <div className="rounded-3xl bg-secondary p-6">
        <div className="text-4xl">👩‍🍳</div>
        <h1 className="mt-2 text-3xl font-bold">{seller.business_name}</h1>
        <div className="mt-1 flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" /> {seller.village_or_area}</div>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <Stars value={avg} /> {reviews.length ? `${avg.toFixed(1)} · ${reviews.length} reviews` : "No reviews yet"}
        </div>
        {seller.status === "verified" && <div className="mt-3"><VerifiedBadge /></div>}
        {seller.about && <p className="mt-4 text-lg">{seller.about}</p>}
      </div>

      <h2 className="mb-3 mt-6 text-2xl font-bold">Products</h2>
      {products.length === 0 ? (
        <Empty emoji="🧺" title="No products right now" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} id={p.id} name={p.name} price={Number(p.price)} category={p.category} image={urls[p.image_urls[0] ?? ""]} />
          ))}
        </div>
      )}

      {reviews.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-2xl font-bold">Reviews</h2>
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border bg-card p-4">
                <div className="flex items-center justify-between"><b>{r.customer_name || "Customer"}</b><Stars value={r.rating} /></div>
                {r.comment && <p className="mt-1 text-muted-foreground">{r.comment}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </Page>
  );
}
