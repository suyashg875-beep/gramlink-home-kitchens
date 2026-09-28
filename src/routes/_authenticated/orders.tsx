import { createFileRoute } from "@tanstack/react-router";
import { Empty, Page } from "@/components/gram";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "My orders — GramLink" }, { name: "description", content: "My orders on GramLink." }, { property: "og:title", content: "My orders — GramLink" }, { property: "og:description", content: "My orders on GramLink." }] }),
  component: () => (
    <Page title="My orders">
      <Empty emoji="🚧" title="Coming next" />
    </Page>
  ),
});
