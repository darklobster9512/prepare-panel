import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/mitarbeiter/")({
  head: () => ({
    meta: [
      { title: "Mitarbeiter-Panel | IdentPanel" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/mitarbeiter/auftraege" });
  },
  component: () => null,
});
