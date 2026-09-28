import { createFileRoute } from "@tanstack/react-router";
import { Empty, Page } from "@/components/gram";

export const Route = createFileRoute("/_authenticated/sell/products")({
  head: () => ({ meta: [{ title: "My products — GramLink" }, { name: "description", content: "My products on GramLink." }, { property: "og:title", content: "My products — GramLink" }, { property: "og:description", content: "My products on GramLink." }] }),
  component: () => (
    <Page title="My products">
      <Empty emoji="🚧" title="Coming next" />
    </Page>
  ),
});
