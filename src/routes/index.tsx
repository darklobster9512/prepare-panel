import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IdentPanel – Interne Vorbereitung für Unternehmensprozesse" },
      {
        name: "description",
        content:
          "IdentPanel bündelt die interne Vorbereitung von Unternehmensprozessen: Datensätze, Aufträge und Zugänge an einem Ort.",
      },
      {
        property: "og:title",
        content: "IdentPanel – Interne Vorbereitung für Unternehmensprozesse",
      },
      {
        property: "og:description",
        content:
          "IdentPanel bündelt die interne Vorbereitung von Unternehmensprozessen: Datensätze, Aufträge und Zugänge an einem Ort.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-background">
      {/* Decorative brand gradient in the background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-[42rem] w-[42rem] rounded-full bg-gradient-to-br from-primary-glow/40 to-primary/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-64 -left-40 h-[36rem] w-[36rem] rounded-full bg-gradient-to-tr from-secondary/60 to-primary-glow/30 blur-3xl"
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-24 sm:px-10">
        <span className="inline-flex items-center rounded-full border border-primary/20 bg-card/70 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm">
          Internes Panel
        </span>

        <h1 className="mt-8 max-w-3xl text-balance text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Ihr Panel für die interne Vorbereitung von Unternehmensprozessen
        </h1>

        <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Wir bereiten die zentralen Abläufe Ihres Unternehmens strukturiert
          vor – übersichtlich, effizient und an einem Ort.
        </p>

        <div className="mt-10">
          <Link
            to="/auth"
            className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-primary/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Zum Panel
          </Link>
        </div>

      </div>
    </main>
  );
}
