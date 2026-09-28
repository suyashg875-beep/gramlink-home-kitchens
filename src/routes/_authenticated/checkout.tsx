import { createFileRoute } from "@tanstack/react-router";
import { Empty, Page } from "@/components/gram";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({ meta: [{ title: "Checkout — GramLink" }, { name: "description", content: "Checkout on GramLink." }, { property: "og:title", content: "Checkout — GramLink" }, { property: "og:description", content: "Checkout on GramLink." }] }),
  component: () => (
    <Page title="Checkout">
      <Empty emoji="🚧" title="Coming next" />
    </Page>
  ),
});
