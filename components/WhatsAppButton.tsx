import type React from "react";
import { site } from "@/lib/site";

type Variant = "navy" | "signal" | "paper-on-dark";

type Props = {
  label: string;
  message?: string;
  variant?: Variant;
  className?: string;
};

const variantClasses: Record<Variant, string> = {
  navy: "bg-ink text-paper hover:bg-ink-soft",
  signal: "bg-signal text-ink hover:bg-signal-deep hover:text-paper",
  "paper-on-dark": "bg-paper text-ink hover:bg-white",
};

// Inline styles guarantee contrast regardless of Tailwind utility generation.
// background/color use CSS vars defined in globals.css @theme.
const variantInlineStyles: Record<Variant, React.CSSProperties> = {
  navy: {
    background: "var(--color-ink)",
    color: "var(--color-paper)",
  },
  signal: {
    background: "var(--color-signal)",
    color: "var(--color-ink)",
  },
  "paper-on-dark": {
    background: "var(--color-paper)",
    color: "var(--color-ink)",
  },
};

export default function WhatsAppButton({
  label,
  message,
  variant = "navy",
  className = "",
}: Props) {
  const href = message ? site.whatsappUrlWith(message) : site.whatsappUrl;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${variantClasses[variant]} ${className}`}
      style={variantInlineStyles[variant]}
    >
      <span
        aria-hidden="true"
        className="inline-block size-[7px] rounded-full bg-peach"
        style={{ animation: "dot-pulse 2.4s ease-in-out infinite" }}
      />
      {label}
    </a>
  );
}
