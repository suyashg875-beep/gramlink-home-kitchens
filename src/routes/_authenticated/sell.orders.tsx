import { createFileRoute } from "@tanstack/react-router";
import { Empty, Page } from "@/components/gram";

export const Route = createFileRoute("/_authenticated/sell/orders")({
  head: () => ({ meta: [{ title: "Orders inbox — GramLink" }, { name: "description", content: "Orders inbox on GramLink." }, { property: "og:title", content: "Orders inbox — GramLink" }, { property: "og:description", content: "Orders inbox on GramLink." }] }),
  component: () => (
    <Page title="Orders inbox">
      <Empty emoji="🚧" title="Coming next" />
    </Page>
  ),
});
