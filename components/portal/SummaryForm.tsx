"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import { saveDraft, submitForReview } from "@/app/[locale]/portal/visits/[visitId]/summary/actions";
import { toSummaryData, type SummaryRow } from "@/lib/portal/summary";
import VisitSummaryDocument from "@/components/portal/VisitSummaryDocument";
import WoundPhotoUploader from "@/components/portal/WoundPhotoUploader";

type InitialFields = {
  bp: string;
  hr: string;
  spo2: string;
  temp: string;
  doneBody: string;
  observationsBody: string;
  meds: string[];
  watchItems: string[];
  nextVisitBody: string;
};

type PhotoEntry = { id: string; caption: string; url: string };

type Props = {
  locale: string;
  dict: Dictionary;
  summaryId: string;
  visitId: string;
  familyId: string;
  initial: InitialFields;
  sentBackReason: string | null;
  patientLabel: string;
  district: string | null;
  caseRef: string;
  visitScheduledAt: string | null;
  initialPhotos: PhotoEntry[];
};

export default function SummaryForm({
  locale,
  dict,
  summaryId,
  visitId,
  familyId,
  initial,
  sentBackReason,
  patientLabel,
  district,
  caseRef,
  visitScheduledAt,
  initialPhotos,
}: Props) {
  const t = dict.portal.writer;

  const [bp, setBp] = useState(initial.bp);
  const [hr, setHr] = useState(initial.hr);
  const [spo2, setSpo2] = useState(initial.spo2);
  const [temp, setTemp] = useState(initial.temp);
  const [doneBody, setDoneBody] = useState(initial.doneBody);
  const [observationsBody, setObservationsBody] = useState(initial.observationsBody);
  const [meds, setMeds] = useState<string[]>(initial.meds.length > 0 ? initial.meds : [""]);
  const [watchItems, setWatchItems] = useState<string[]>(
    initial.watchItems.length > 0 ? initial.watchItems : [""],
  );
  const [nextVisitBody, setNextVisitBody] = useState(initial.nextVisitBody);

  const [previewPhotos] = useState<{ caption: string; url: string }[]>(
    initialPhotos.map((p) => ({ caption: p.caption, url: p.url })),
  );
  const [showPreview, setShowPreview] = useState(false);

  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const [isPending, startTransition] = useTransition();

  const labelClass = "font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-soft";
  const inputClass =
    "rounded-lg border border-rule bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-teal w-full";
  const textareaClass =
    "rounded-lg border border-rule bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-teal w-full resize-none";

  function buildFields() {
    return {
      summaryId,
      vitals: { bp, hr, spo2, temp },
      doneBody,
      observationsBody,
      meds: meds.filter((m) => m.trim()),
      watchItems: watchItems.filter((w) => w.trim()),
      nextVisitBody,
    };
  }

  function buildPreviewRow(): SummaryRow {
    return {
      status: "draft",
      vitals: { bp, hr, spo2, temp },
      done_body: doneBody,
      observations_body: observationsBody,
      meds_administered: meds,
      watch_items: watchItems,
      next_visit_body: nextVisitBody,
      coordinator_note: null,
      written_at: null,
      published_at: null,
      patientLabel,
      district,
      caseRef,
      visitScheduledAt,
    };
  }

  function handleSave() {
    setSaveMsg(null);
    setSaveError(false);
    startTransition(async () => {
      const result = await saveDraft(buildFields());
      if (result.ok) {
        setSaveMsg(t.saved);
        setTimeout(() => setSaveMsg(null), 3000);
      } else {
        setSaveError(true);
      }
    });
  }

  function handleSubmit() {
    setSubmitError(false);
    startTransition(async () => {
      const result = await submitForReview(buildFields());
      if (result.ok) {
        setSubmitted(true);
      } else {
        setSubmitError(true);
      }
    });
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-teal/40 bg-teal-soft p-6">
        <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
          {t.submitted}
        </div>
        <p className="text-[15px] text-ink">{t.submittedBody}</p>
        <Link
          href={`/${locale}/portal`}
          className="mt-4 inline-block font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep transition hover:opacity-70"
        >
          {t.back}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-44 sm:pb-32">
      {/* Eyebrow + back link */}
      <div>
        <div className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
          {t.eyebrow}
        </div>
        <div className="font-mono text-[12px] text-muted">{patientLabel} · {caseRef}</div>
        <Link
          href={`/${locale}/portal`}
          className="mt-2 inline-block font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition hover:opacity-70"
        >
          ← {t.back}
        </Link>
      </div>

      {/* Sent-back banner */}
      {sentBackReason && (
        <div className="rounded-xl border border-peach bg-peach/10 px-5 py-4">
          <div className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-peach">
            {t.sentBackTitle}
          </div>
          <p className="text-[14px] text-ink-soft">{sentBackReason}</p>
        </div>
      )}

      {/* Vitals - 4-col grid */}
      <div className="rounded-xl border border-rule bg-white px-5 py-5">
        <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
          {t.vitals}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="flex flex-col gap-2">
            <span className={labelClass}>{t.bp}</span>
            <input
              type="text"
              value={bp}
              onChange={(e) => setBp(e.target.value)}
              placeholder="120/80"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelClass}>{t.hr}</span>
            <input
              type="text"
              value={hr}
              onChange={(e) => setHr(e.target.value)}
              placeholder="72"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelClass}>{t.spo2}</span>
            <input
              type="text"
              value={spo2}
              onChange={(e) => setSpo2(e.target.value)}
              placeholder="98"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelClass}>{t.temp}</span>
            <input
              type="text"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              placeholder="36.6"
              className={inputClass}
            />
          </label>
        </div>
      </div>

      {/* What was done */}
      <div className="rounded-xl border border-rule bg-white px-5 py-5">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
            {t.done}
          </span>
          <textarea
            rows={4}
            value={doneBody}
            onChange={(e) => setDoneBody(e.target.value)}
            className={textareaClass}
          />
        </label>
      </div>

      {/* Observations */}
      <div className="rounded-xl border border-rule bg-white px-5 py-5">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
            {t.observations}
          </span>
          <textarea
            rows={4}
            value={observationsBody}
            onChange={(e) => setObservationsBody(e.target.value)}
            className={textareaClass}
          />
        </label>
      </div>

      {/* Medications - repeatable */}
      <div className="rounded-xl border border-rule bg-white px-5 py-5">
        <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
          {t.meds}
        </div>
        <div className="flex flex-col gap-2">
          {meds.map((med, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={med}
                onChange={(e) => {
                  const updated = [...meds];
                  updated[i] = e.target.value;
                  setMeds(updated);
                }}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setMeds(meds.filter((_, idx) => idx !== i))}
                className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-peach transition hover:opacity-70"
              >
                x
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setMeds([...meds, ""])}
            className="self-start font-mono text-[10px] uppercase tracking-[0.14em] text-teal-deep transition hover:opacity-70"
          >
            {t.addMed}
          </button>
        </div>
      </div>

      {/* Watch items - repeatable */}
      <div className="rounded-xl border border-rule bg-white px-5 py-5">
        <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
          {t.watch}
        </div>
        <div className="flex flex-col gap-2">
          {watchItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const updated = [...watchItems];
                  updated[i] = e.target.value;
                  setWatchItems(updated);
                }}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setWatchItems(watchItems.filter((_, idx) => idx !== i))}
                className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-peach transition hover:opacity-70"
              >
                x
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setWatchItems([...watchItems, ""])}
            className="self-start font-mono text-[10px] uppercase tracking-[0.14em] text-teal-deep transition hover:opacity-70"
          >
            {t.addWatch}
          </button>
        </div>
      </div>

      {/* Next visit */}
      <div className="rounded-xl border border-rule bg-white px-5 py-5">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
            {t.nextVisit}
          </span>
          <textarea
            rows={2}
            value={nextVisitBody}
            onChange={(e) => setNextVisitBody(e.target.value)}
            className={textareaClass}
          />
        </label>
      </div>

      {/* Wound photos */}
      <div className="rounded-xl border border-rule bg-white px-5 py-5">
        <WoundPhotoUploader
          summaryId={summaryId}
          visitId={visitId}
          familyId={familyId}
          dict={dict}
          initialPhotos={initialPhotos}
        />
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="mt-2">
          <VisitSummaryDocument
            data={toSummaryData(buildPreviewRow(), previewPhotos)}
          />
        </div>
      )}

      {/* Sticky action bar */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t border-rule bg-paper px-4 py-3"
        style={{ zIndex: 40 }}
      >
        <div
          className="mx-auto flex flex-wrap items-center gap-2 sm:gap-3"
          style={{ maxWidth: "760px" }}
        >
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-rule px-5 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft transition hover:border-teal hover:text-teal-deep sm:flex-none"
          >
            {showPreview ? t.hidePreview : t.preview}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-rule px-5 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft transition hover:border-teal hover:text-teal-deep disabled:opacity-60 sm:flex-none"
          >
            {isPending ? "..." : saveMsg ?? t.saveDraft}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-3 text-[13px] font-medium transition hover:-translate-y-0.5 disabled:opacity-60 sm:ml-auto sm:w-auto"
            style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
          >
            {isPending ? "..." : t.submit}
          </button>

          {saveError && !isPending && (
            <span className="w-full font-mono text-[10px] uppercase tracking-[0.14em] text-peach sm:w-auto">
              {t.errorSave}
            </span>
          )}
          {submitError && !isPending && (
            <span className="w-full font-mono text-[10px] uppercase tracking-[0.14em] text-peach sm:w-auto">
              {t.errorSubmit}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}