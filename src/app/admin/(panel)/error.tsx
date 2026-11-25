"use client";

import { ErrorState } from "@/components/shared/ErrorState";

export default function PanelError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState {...props} homeHref="/admin" />;
}
