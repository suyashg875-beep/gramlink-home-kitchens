import { createFileRoute } from "@tanstack/react-router";
import { Empty, Page } from "@/components/gram";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin dashboard — GramLink" }, { name: "description", content: "Admin dashboard on GramLink." }, { property: "og:title", content: "Admin dashboard — GramLink" }, { property: "og:description", content: "Admin dashboard on GramLink." }] }),
  component: () => (
    <Page title="Admin dashboard">
      <Empty emoji="🚧" title="Coming next" />
    </Page>
  ),
});
