"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { site } from "@/lib/site";
import { createShareLink } from "@/app/[locale]/portal/review/[summaryId]/actions";

type Props = {
  locale: string;
  dict: Dictionary;
  summaryId: string;
  patientLabel: string;
};

export default function ShareLinkPanel({ locale, dict, summaryId, patientLabel }: Props) {
  const s = dict.portal.share;
  const [url, setUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await createShareLink(summaryId);
      if (!active) return;
      if (result.ok) {
        const origin =
          typeof window !== "undefined" ? window.location.origin : site.url;
        setUrl(`${origin}/${locale}/s/${result.token}`);
        setExpiresAt(result.expiresAt);
      } else {
        setError(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [summaryId, locale]);

  function handleCopy() {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const whatsappHref = url
    ? `https://wa.me/?text=${encodeURIComponent(
        s.whatsappText.replace("{patient}", patientLabel).replace("{url}", url),
      )}`
    : "#";

  const validUntilText =
    expiresAt != null
      ? s.validUntil.replace(
          "{date}",
          new Date(expiresAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        )
      : "";

  return (
    <div className="rounded-xl border border-rule bg-white px-5 py-5">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
        {s.label}
      </div>
      <p className="mt-2 text-[14px] leading-[1.55] text-ink-soft">{s.help}</p>

      {error ? (
        <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-peach">
          {s.error}
        </p>
      ) : !url ? (
        <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
          {s.generating}
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full rounded-lg border border-rule bg-paper-cool px-4 py-3 font-mono text-[12px] text-ink outline-none"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-full border border-rule px-5 py-2.5 text-[13px] font-medium text-ink transition hover:bg-paper-cool"
            >
              {copied ? s.copied : s.copy}
            </button>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium transition hover:opacity-90"
              style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
            >
              {s.whatsapp} →
            </a>
          </div>
          {validUntilText && (
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              {validUntilText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
