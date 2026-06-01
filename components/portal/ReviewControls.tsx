"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import { saveCoordinatorNote, publish, sendBack } from "@/app/[locale]/portal/review/[summaryId]/actions";
import ShareLinkPanel from "@/components/portal/ShareLinkPanel";

type Props = {
  locale: string;
  dict: Dictionary;
  summaryId: string;
  initialNote: string;
  patientLabel: string;
};

export default function ReviewControls({ locale, dict, summaryId, initialNote, patientLabel }: Props) {
  const r = dict.portal.review;

  // --- Coordinator note state ---
  const [note, setNote] = useState(initialNote);
  const [noteSaved, setNoteSaved] = useState(false);
  const [noteError, setNoteError] = useState(false);
  const [notePending, startNoteTransition] = useTransition();

  function handleSaveNote() {
    setNoteSaved(false);
    setNoteError(false);
    startNoteTransition(async () => {
      const result = await saveCoordinatorNote(summaryId, note);
      if (result.ok) {
        setNoteSaved(true);
      } else {
        setNoteError(true);
      }
    });
  }

  // --- Publish state ---
  const [published, setPublished] = useState(false);
  const [publishError, setPublishError] = useState(false);
  const [publishPending, startPublishTransition] = useTransition();

  function handlePublish() {
    setPublishError(false);
    startPublishTransition(async () => {
      const result = await publish(summaryId);
      if (result.ok) {
        setPublished(true);
      } else {
        setPublishError(true);
      }
    });
  }

  // --- Send-back state ---
  const [sendBackReason, setSendBackReason] = useState("");
  const [sentBack, setSentBack] = useState(false);
  const [sendBackError, setSendBackError] = useState(false);
  const [sendBackPending, startSendBackTransition] = useTransition();

  function handleSendBack() {
    if (!sendBackReason.trim()) return;
    setSendBackError(false);
    startSendBackTransition(async () => {
      const result = await sendBack(summaryId, sendBackReason.trim());
      if (result.ok) {
        setSentBack(true);
      } else {
        setSendBackError(true);
      }
    });
  }

  const labelClass = "font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-soft";
  const textareaClass =
    "w-full rounded-lg border border-rule bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-teal resize-y";

  // --- Published success panel ---
  if (published) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-teal/40 bg-teal-soft p-5">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
          {r.published}
        </div>
        <p className="text-[15px] text-ink">{r.publishedBody}</p>
        <Link
          href={`/${locale}/portal`}
          className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep transition hover:opacity-70"
        >
          ← {r.back}
        </Link>
        <div className="mt-2">
          <ShareLinkPanel
            locale={locale}
            dict={dict}
            summaryId={summaryId}
            patientLabel={patientLabel}
          />
        </div>
      </div>
    );
  }

  // --- Sent-back success panel ---
  if (sentBack) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-peach/40 bg-peach/10 p-5">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink">
          {r.sentBack}
        </div>
        <p className="text-[15px] text-ink">{r.sentBackBody}</p>
        <Link
          href={`/${locale}/portal`}
          className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep transition hover:opacity-70"
        >
          ← {r.back}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Coordinator note section */}
      <div className="rounded-xl border border-rule bg-white px-5 py-5">
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-2">
            <span className={labelClass}>{r.coordNote}</span>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setNoteSaved(false);
              }}
              className={textareaClass}
            />
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleSaveNote}
              disabled={notePending}
              className="inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium transition hover:opacity-90 disabled:opacity-60"
              style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
            >
              {notePending ? "…" : r.saveNote}
            </button>
            {noteSaved && (
              <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-teal-deep">
                {r.noteSaved}
              </span>
            )}
            {noteError && (
              <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-peach">
                {r.errorGeneric}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Publish section */}
      <div className="rounded-xl border border-rule bg-white px-5 py-5">
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishPending}
            className="inline-flex w-fit items-center gap-2 rounded-full px-7 py-4 text-[15px] font-medium transition hover:-translate-y-0.5 disabled:opacity-60"
            style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
          >
            {publishPending ? "…" : r.publish}
          </button>
          {publishError && (
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-peach">
              {r.errorGeneric}
            </p>
          )}
        </div>
      </div>

      {/* Send-back section */}
      <div className="rounded-xl border border-rule bg-white px-5 py-5">
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-2">
            <span className={labelClass}>{r.sendBackReason}</span>
            <textarea
              rows={3}
              value={sendBackReason}
              onChange={(e) => {
                setSendBackReason(e.target.value);
                setSendBackError(false);
              }}
              className={textareaClass}
              placeholder={r.sendBackReason}
            />
          </label>
          <button
            type="button"
            onClick={handleSendBack}
            disabled={sendBackPending || !sendBackReason.trim()}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-rule px-5 py-2.5 text-[13px] font-medium text-ink transition hover:bg-paper-cool disabled:opacity-40"
          >
            {sendBackPending ? "…" : r.sendBackConfirm}
          </button>
          {sendBackError && (
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-peach">
              {r.errorGeneric}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
