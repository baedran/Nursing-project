"use client";

import { useActionState, useState } from "react";
import { inviteNurse } from "@/app/[locale]/portal/nurses/actions";
import type { Dictionary } from "@/lib/i18n";

export default function AddNurseForm({
  locale,
  dict,
}: {
  locale: string;
  dict: Dictionary;
}) {
  const n = dict.portal.nurses;
  const [addAnother, setAddAnother] = useState(false);

  const [result, formAction, pending] = useActionState(
    async (_prev: Awaited<ReturnType<typeof inviteNurse>> | null, formData: FormData) =>
      inviteNurse(formData),
    null,
  );

  const showForm = !result || result.ok === false || addAnother;

  const labelClass =
    "font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-soft";
  const inputClass =
    "rounded-lg border border-rule bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-teal w-full";

  if (!showForm && result && result.ok) {
    return (
      <div className="rounded-xl border border-teal/40 bg-teal-soft p-5">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
          {n.successLabel}
        </div>
        <p className="mt-3 text-[15px] text-ink">
          {n.successBody.replace("{name}", result.nurseName)}
        </p>
        {result.magicLink ? (
          <div className="mt-4 flex flex-col gap-2">
            <input
              type="text"
              readOnly
              value={result.magicLink}
              className="w-full rounded-lg border border-rule bg-white px-3 py-2 font-mono text-[12px] text-ink outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (result.ok && result.magicLink) {
                  navigator.clipboard.writeText(result.magicLink);
                }
              }}
              className="inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium transition hover:opacity-90"
              style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
            >
              {n.copyLabel}
            </button>
          </div>
        ) : null}
        <p className="mt-3 text-[13px] text-muted">{n.successHint}</p>
        <button
          type="button"
          onClick={() => setAddAnother(true)}
          className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep transition hover:opacity-70"
        >
          {n.addAnother}
        </button>
      </div>
    );
  }

  return (
    <form
      action={(formData) => {
        setAddAnother(false);
        return formAction(formData);
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="locale" value={locale} />

      <label className="flex flex-col gap-2">
        <span className={labelClass}>{n.nameField}</span>
        <input
          type="text"
          name="name"
          required
          placeholder={n.namePlaceholder}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>{n.emailField}</span>
        <input
          type="email"
          name="email"
          required
          placeholder={n.emailPlaceholder}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>{n.hospitalField}</span>
        <input
          type="text"
          name="hospital"
          placeholder={n.hospitalPlaceholder}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>{n.licenseField}</span>
        <input
          type="text"
          name="license"
          placeholder={n.licensePlaceholder}
          className={inputClass}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex w-fit items-center justify-center gap-2 rounded-full px-7 py-4 text-[15px] font-medium transition hover:-translate-y-0.5 disabled:opacity-60"
        style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
      >
        {pending ? "…" : n.submitLabel}
      </button>

      {result && !result.ok ? (
        <div className="rounded-md border border-peach bg-peach/10 px-3 py-2 text-[13px] text-ink">
          {result.error === "exists" ? n.errorExists : n.errorGeneric}
        </div>
      ) : null}
    </form>
  );
}
