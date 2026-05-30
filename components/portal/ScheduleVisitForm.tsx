"use client";

import { useActionState, useState } from "react";
import { scheduleVisit } from "@/app/[locale]/portal/schedule/actions";
import type { Dictionary } from "@/lib/i18n";

type CaseOption = { caseId: string; label: string };
type NurseOption = { nurseId: string; label: string };

export default function ScheduleVisitForm({
  locale,
  dict,
  cases,
  nurses,
}: {
  locale: string;
  dict: Dictionary;
  cases: CaseOption[];
  nurses: NurseOption[];
}) {
  const s = dict.portal.schedule;

  const [result, formAction, pending] = useActionState(
    async (_prev: Awaited<ReturnType<typeof scheduleVisit>> | null, fd: FormData) =>
      scheduleVisit(fd),
    null,
  );

  const [selectedCase, setSelectedCase] = useState(cases[0]?.caseId ?? "");
  const [selectedNurse, setSelectedNurse] = useState(nurses[0]?.nurseId ?? "");
  const [scheduleAnother, setScheduleAnother] = useState(false);

  const labelClass =
    "font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-soft";
  const inputClass =
    "rounded-lg border border-rule bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-teal w-full";

  const showForm = !result || result.ok === false || scheduleAnother;

  if (!showForm && result && result.ok) {
    return (
      <div className="rounded-xl border border-teal/40 bg-teal-soft p-5">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
          {s.successLabel}
        </div>
        <p className="mt-3 text-[15px] text-ink">
          {s.successBody
            .replace("{patient}", result.patientLabel)
            .replace("{nurse}", result.nurseName)
            .replace("{when}", result.when)}
        </p>
        <button
          type="button"
          onClick={() => setScheduleAnother(true)}
          className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep transition hover:opacity-70"
        >
          {s.scheduleAnother}
        </button>
      </div>
    );
  }

  const selectedCaseLabel = cases.find((c) => c.caseId === selectedCase)?.label ?? "";
  const selectedNurseLabel = nurses.find((n) => n.nurseId === selectedNurse)?.label ?? "";

  return (
    <form
      action={(fd) => {
        setScheduleAnother(false);
        return formAction(fd);
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="patientLabel" value={selectedCaseLabel} />
      <input type="hidden" name="nurseName" value={selectedNurseLabel} />

      <label className="flex flex-col gap-2">
        <span className={labelClass}>{s.patientField}</span>
        <select
          name="caseId"
          value={selectedCase}
          onChange={(e) => setSelectedCase(e.target.value)}
          required
          className={inputClass}
        >
          {cases.map((c) => (
            <option key={c.caseId} value={c.caseId}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>{s.nurseField}</span>
        <select
          name="nurseId"
          value={selectedNurse}
          onChange={(e) => setSelectedNurse(e.target.value)}
          required
          className={inputClass}
        >
          {nurses.map((n) => (
            <option key={n.nurseId} value={n.nurseId}>
              {n.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>{s.dateField}</span>
        <input
          type="datetime-local"
          name="scheduledAt"
          required
          className={inputClass}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex w-fit items-center justify-center gap-2 rounded-full px-7 py-4 text-[15px] font-medium transition hover:-translate-y-0.5 disabled:opacity-60"
        style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
      >
        {pending ? "…" : s.submitLabel}
      </button>

      {result && !result.ok ? (
        <div className="rounded-md border border-peach bg-peach/10 px-3 py-2 text-[13px] text-ink">
          {s.errorGeneric}
        </div>
      ) : null}
    </form>
  );
}
