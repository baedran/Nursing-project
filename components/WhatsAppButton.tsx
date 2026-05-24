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
