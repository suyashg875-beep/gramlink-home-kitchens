import { Link, useNavigate } from "@tanstack/react-router";
import { Home, ShoppingBasket, Package, LayoutDashboard, ShieldCheck, LogIn, LogOut, Star, BadgeCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { CATEGORY_EMOJI, STATUS_LABEL, rupees } from "@/lib/helpers";
import { cn } from "@/lib/utils";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground">
        G
      </span>
      <span className="font-display text-2xl font-bold text-primary">
        Gram<span className="text-saffron">Link</span>
      </span>
    </Link>
  );
}

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
        <Logo />
        {user ? (
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
            className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        ) : (
          <Link to="/auth" className="flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
            <LogIn className="h-4 w-4" /> Log in
          </Link>
        )}
      </div>
    </header>
  );
}

function NavItem({ to, icon, label, badge }: { to: string; icon: ReactNode; label: string; badge?: number }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/" }}
      className="relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-semibold text-muted-foreground"
      activeProps={{ className: "text-primary" }}
    >
      {icon}
      {label}
      {badge ? (
        <span className="absolute right-[28%] top-1 grid h-5 min-w-5 place-items-center rounded-full bg-saffron px-1 text-[11px] font-bold text-saffron-foreground">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

export function BottomNav() {
  const { role } = useAuth();
  const { count } = useCart();
  const ic = "h-6 w-6";
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card">
      <div className="mx-auto flex max-w-3xl">
        {role === "seller" ? (
          <>
            <NavItem to="/sell" icon={<LayoutDashboard className={ic} />} label="Dashboard" />
            <NavItem to="/sell/products" icon={<Package className={ic} />} label="Products" />
            <NavItem to="/sell/orders" icon={<ShoppingBasket className={ic} />} label="Orders" />
          </>
        ) : role === "admin" ? (
          <>
            <NavItem to="/admin" icon={<ShieldCheck className={ic} />} label="Admin" />
            <NavItem to="/" icon={<Home className={ic} />} label="Shop" />
          </>
        ) : (
          <>
            <NavItem to="/" icon={<Home className={ic} />} label="Home" />
            <NavItem to="/cart" icon={<ShoppingBasket className={ic} />} label="Cart" badge={count} />
            <NavItem to="/orders" icon={<Package className={ic} />} label="My orders" />
          </>
        )}
      </div>
    </nav>
  );
}

export function Page({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-5">
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">{title}</h1>
          {action}
        </div>
      )}
      {children}
    </main>
  );
}

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i <= Math.round(value) ? "fill-saffron text-saffron" : "text-border"}
        />
      ))}
    </span>
  );
}

export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground">
      <BadgeCheck className="h-4 w-4 text-primary" /> GramLink Verified Seller
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "completed" || status === "verified"
      ? "bg-secondary text-secondary-foreground"
      : status === "rejected" || status === "cancelled"
        ? "bg-destructive/10 text-destructive"
        : "bg-accent text-accent-foreground";
  const label = STATUS_LABEL[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={cn("rounded-full px-3 py-1 text-xs font-bold", tone)}>{label}</span>;
}

export function Empty({ emoji, title, children }: { emoji: string; title: string; children?: ReactNode }) {
  return (
    <div className="rounded-3xl border-2 border-dashed bg-card p-8 text-center">
      <div className="text-5xl">{emoji}</div>
      <h2 className="mt-3 text-xl font-bold">{title}</h2>
      {children && <div className="mt-2 text-muted-foreground">{children}</div>}
    </div>
  );
}

export function ProductThumb({ url, category, className }: { url?: string; category: string; className?: string }) {
  return url ? (
    <img src={url} alt="" className={cn("h-full w-full object-cover", className)} loading="lazy" />
  ) : (
    <div className={cn("grid h-full w-full place-items-center bg-accent text-5xl", className)}>
      {CATEGORY_EMOJI[category] ?? "🧺"}
    </div>
  );
}

export function ProductCard({
  id, name, price, category, image, sellerName,
}: { id: string; name: string; price: number; category: string; image?: string; sellerName?: string }) {
  return (
    <Link to="/product/$id" params={{ id }} className="overflow-hidden rounded-2xl border bg-card shadow-sm transition active:scale-[0.98]">
      <div className="aspect-square">
        <ProductThumb url={image} category={category} />
      </div>
      <div className="p-3">
        <div className="line-clamp-2 font-bold leading-tight">{name}</div>
        {sellerName && <div className="mt-0.5 truncate text-xs text-muted-foreground">by {sellerName}</div>}
        <div className="mt-1 font-display text-lg font-bold text-primary">{rupees(price)}</div>
      </div>
    </Link>
  );
}

export function BigButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-lg font-bold text-primary-foreground shadow-sm transition active:scale-[0.98] disabled:opacity-50",
        className,
      )}
    />
  );
}

export const inputCls =
  "h-12 w-full rounded-xl border-2 border-input bg-card px-4 text-base outline-none focus:border-primary";
export const labelCls = "mb-1 block text-sm font-bold";
