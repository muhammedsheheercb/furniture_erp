"use client";

import ErrorView from "@/components/ui/Error";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorView error={error} reset={reset} />;
}