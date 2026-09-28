import { createFileRoute } from "@tanstack/react-router";
import { Empty, Page } from "@/components/gram";

export const Route = createFileRoute("/_authenticated/sell/")({
  head: () => ({ meta: [{ title: "Seller dashboard — GramLink" }, { name: "description", content: "Seller dashboard on GramLink." }, { property: "og:title", content: "Seller dashboard — GramLink" }, { property: "og:description", content: "Seller dashboard on GramLink." }] }),
  component: () => (
    <Page title="Seller dashboard">
      <Empty emoji="🚧" title="Coming next" />
    </Page>
  ),
});
