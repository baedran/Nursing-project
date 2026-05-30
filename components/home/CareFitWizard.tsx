"use client";

import { useState } from "react";
import { site } from "@/lib/site";

type AnswerOption = { key: string; label: string };

type Props = {
  dict: {
    eyebrow: string;
    headline: string;
    headlineEm: string;
    lede: string;

    q1Label: string;
    q1Options: readonly AnswerOption[];
    q1Sentence: Readonly<Record<string, string>>;

    q2Label: string;
    q2Options: readonly AnswerOption[];
    q2Sentence: Readonly<Record<string, string>>;

    q3Label: string;
    q3Options: readonly AnswerOption[];
    q3Sentence: Readonly<Record<string, string>>;

    progressLabel: string;
    backLabel: string;
    summaryLabel: string;
    summaryHeading: string;
    summaryBodyTemplate: string; // contains {situation} {recipient} {timing}
    primaryCta: string;
    restartLabel: string;
    skipLabel: string;
  };
};

export default function CareFitWizard({ dict }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | "summary">(1);
  const [situation, setSituation] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<string | null>(null);
  const [timing, setTiming] = useState<string | null>(null);

  const handleSituation = (k: string) => {
    setSituation(k);
    setStep(2);
  };
  const handleRecipient = (k: string) => {
    setRecipient(k);
    setStep(3);
  };
  const handleTiming = (k: string) => {
    setTiming(k);
    setStep("summary");
  };

  const restart = () => {
    setSituation(null);
    setRecipient(null);
    setTiming(null);
    setStep(1);
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === "summary") setStep(3);
  };

  // Compose WhatsApp message
  const whatsappMessage =
    situation && recipient && timing
      ? dict.summaryBodyTemplate
          .replace("{situation}", dict.q1Sentence[situation])
          .replace("{recipient}", dict.q2Sentence[recipient])
          .replace("{timing}", dict.q3Sentence[timing])
      : "";

  const whatsappHref = whatsappMessage
    ? site.whatsappUrlWith(whatsappMessage)
    : site.whatsappUrl;

  const currentStepNumber = step === "summary" ? 3 : step;

  return (
    <section className="bg-paper-cool" style={{ paddingBlock: "clamp(72px, 12vw, 140px)" }}>
      <div
        className="mx-auto"
        style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}
      >
        <div className="mx-auto max-w-[720px]">
          {/* Section head */}
          <div className="mb-9 text-center">
            <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
              {dict.eyebrow}
            </div>
            <h2
              className="mx-auto font-display font-medium"
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                lineHeight: 1.08,
                letterSpacing: "-0.025em",
                maxWidth: "22ch",
              }}
            >
              {dict.headline}{" "}
              <em className="text-teal" style={{ fontStyle: "italic" }}>
                {dict.headlineEm}
              </em>
            </h2>
            <p
              className="mx-auto mt-4 text-ink-soft"
              style={{ fontSize: "15px", lineHeight: 1.55, maxWidth: "50ch" }}
            >
              {dict.lede}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-7 flex items-center gap-2">
            {[1, 2, 3].map((n) => {
              const state =
                n < currentStepNumber
                  ? "done"
                  : n === currentStepNumber
                    ? "current"
                    : "pending";
              return (
                <div
                  key={n}
                  className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                    state === "done"
                      ? "bg-teal-deep"
                      : state === "current"
                        ? "bg-teal"
                        : "bg-rule"
                  }`}
                  aria-hidden="true"
                />
              );
            })}
          </div>
          <div className="mb-6 text-center font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">
            {dict.progressLabel
              .replace("{n}", String(step === "summary" ? 3 : step))
              .replace("{total}", "3")}
          </div>

          {/* Card — key triggers remount for fade transition */}
          <div
            key={`step-${step}`}
            className="rounded-2xl border border-rule bg-white p-6 transition-opacity duration-200 sm:p-8 motion-reduce:transition-none"
          >
            {step === 1 && (
              <>
                <h3
                  className="mb-6 font-display font-medium"
                  style={{
                    fontSize: "clamp(22px, 2.6vw, 30px)",
                    lineHeight: 1.15,
                    letterSpacing: "-0.018em",
                  }}
                >
                  {dict.q1Label}
                </h3>
                <div className="flex flex-col gap-3">
                  {dict.q1Options.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleSituation(opt.key)}
                      className="flex w-full items-center justify-between gap-4 rounded-xl border border-rule bg-paper px-5 py-4 text-left font-medium text-ink transition hover:-translate-y-0.5 hover:border-ink hover:bg-white active:translate-y-0"
                    >
                      <span style={{ fontSize: "15px", lineHeight: 1.4 }}>{opt.label}</span>
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-teal-deep"
                        style={{ fontSize: "18px" }}
                      >
                        →
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h3
                  className="mb-6 font-display font-medium"
                  style={{
                    fontSize: "clamp(22px, 2.6vw, 30px)",
                    lineHeight: 1.15,
                    letterSpacing: "-0.018em",
                  }}
                >
                  {dict.q2Label}
                </h3>
                <div className="flex flex-col gap-3">
                  {dict.q2Options.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleRecipient(opt.key)}
                      className="flex w-full items-center justify-between gap-4 rounded-xl border border-rule bg-paper px-5 py-4 text-left font-medium text-ink transition hover:-translate-y-0.5 hover:border-ink hover:bg-white active:translate-y-0"
                    >
                      <span style={{ fontSize: "15px", lineHeight: 1.4 }}>{opt.label}</span>
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-teal-deep"
                        style={{ fontSize: "18px" }}
                      >
                        →
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-5 text-center">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft transition hover:text-ink"
                  >
                    ← {dict.backLabel}
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h3
                  className="mb-6 font-display font-medium"
                  style={{
                    fontSize: "clamp(22px, 2.6vw, 30px)",
                    lineHeight: 1.15,
                    letterSpacing: "-0.018em",
                  }}
                >
                  {dict.q3Label}
                </h3>
                <div className="flex flex-col gap-3">
                  {dict.q3Options.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleTiming(opt.key)}
                      className="flex w-full items-center justify-between gap-4 rounded-xl border border-rule bg-paper px-5 py-4 text-left font-medium text-ink transition hover:-translate-y-0.5 hover:border-ink hover:bg-white active:translate-y-0"
                    >
                      <span style={{ fontSize: "15px", lineHeight: 1.4 }}>{opt.label}</span>
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-teal-deep"
                        style={{ fontSize: "18px" }}
                      >
                        →
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-5 text-center">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft transition hover:text-ink"
                  >
                    ← {dict.backLabel}
                  </button>
                </div>
              </>
            )}

            {step === "summary" && (
              <>
                <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
                  {dict.summaryLabel}
                </div>
                <h3
                  className="mb-5 font-display font-medium"
                  style={{
                    fontSize: "clamp(22px, 2.6vw, 30px)",
                    lineHeight: 1.15,
                    letterSpacing: "-0.018em",
                  }}
                >
                  {dict.summaryHeading}
                </h3>
                <p
                  className="mb-7 rounded-xl border border-rule-warm bg-cream px-5 py-4 text-ink"
                  style={{ fontSize: "16px", lineHeight: 1.6 }}
                >
                  {whatsappMessage}
                </p>

                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-signal px-7 py-4 text-[15px] font-medium text-ink transition hover:opacity-90 active:opacity-80"
                >
                  <span
                    aria-hidden="true"
                    className="inline-block size-2 shrink-0 rounded-full bg-ink"
                  />
                  {dict.primaryCta}
                </a>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft transition hover:text-ink"
                  >
                    ← {dict.backLabel}
                  </button>
                  <button
                    type="button"
                    onClick={restart}
                    className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft transition hover:text-ink"
                  >
                    {dict.restartLabel} ↻
                  </button>
                </div>

                <div className="mt-5 border-t border-rule pt-4 text-center">
                  <a
                    href={site.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-soft transition hover:text-ink"
                  >
                    {dict.skipLabel} →
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
