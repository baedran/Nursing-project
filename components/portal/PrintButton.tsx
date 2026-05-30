"use client";

type Props = {
  label: string;
};

export default function PrintButton({ label }: Props) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full border border-rule bg-white px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink transition hover:border-ink hover:bg-paper print:hidden"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </button>
  );
}
