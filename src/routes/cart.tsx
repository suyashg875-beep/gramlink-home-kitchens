import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { rupees, useSignedImages } from "@/lib/helpers";
import { BigButton, Empty, Page, ProductThumb } from "@/components/gram";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — GramLink" },
      { name: "description", content: "Review the homemade food in your GramLink cart before ordering." },
      { property: "og:title", content: "Your cart — GramLink" },
      { property: "og:description", content: "Review your GramLink cart." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, total } = useCart();
  const navigate = useNavigate();
  const { data: urls = {} } = useSignedImages(items.map((i) => i.image).filter((x): x is string => !!x));

  if (items.length === 0) {
    return (
      <Page title="Your cart">
        <Empty emoji="🛒" title="Your cart is empty">
          <Link to="/" className="font-bold text-primary underline">Find something tasty</Link>
        </Empty>
      </Page>
    );
  }

  const sellers = new Set(items.map((i) => i.sellerId)).size;

  return (
    <Page title="Your cart">
      <div className="space-y-3">
        {items.map((i) => (
          <div key={i.productId} className="flex gap-3 rounded-2xl border bg-card p-3">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
              <ProductThumb url={i.image ? urls[i.image] : undefined} category="Other" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold leading-tight">{i.name}</div>
              <div className="text-xs text-muted-foreground">by {i.sellerName}</div>
              <div className="mt-1 font-bold text-primary">{rupees(i.price * i.quantity)}</div>
              <div className="mt-2 flex items-center gap-3">
                <button onClick={() => setQty(i.productId, i.quantity - 1)} className="grid h-9 w-9 place-items-center rounded-full border-2"><Minus className="h-4 w-4" /></button>
                <span className="w-6 text-center font-bold">{i.quantity}</span>
                <button onClick={() => setQty(i.productId, i.quantity + 1)} className="grid h-9 w-9 place-items-center rounded-full border-2"><Plus className="h-4 w-4" /></button>
                <button onClick={() => remove(i.productId)} className="ml-auto p-2 text-destructive" aria-label="Remove"><Trash2 className="h-5 w-5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-2xl bg-secondary p-4">
        <div className="flex justify-between text-xl font-bold"><span>Total</span><span>{rupees(total)}</span></div>
        <div className="mt-1 text-sm text-muted-foreground">
          Pay with cash when your food arrives.{sellers > 1 && ` Items from ${sellers} sellers will be ${sellers} separate orders.`}
        </div>
      </div>
      <BigButton className="mt-4" onClick={() => navigate({ to: "/checkout" })}>Continue to checkout</BigButton>
    </Page>
  );
}
