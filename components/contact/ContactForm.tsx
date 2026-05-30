"use client";

import { useState } from "react";

type FormState = { name: string; phone: string; message: string };

type FormDict = {
  name: string;
  phone: string;
  message: string;
  messagePlaceholder: string;
  submit: string;
  successHeading: string;
  successBody: string;
};

export default function ContactForm({ dict }: { dict: FormDict }) {
  const [form, setForm] = useState<FormState>({ name: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("Contact form submission:", form);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-rule bg-paper p-8 text-center">
        <svg
          className="mx-auto mb-3 size-10 text-teal"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <h3 className="mb-1 font-display text-base font-medium tracking-[-0.01em] text-ink">
          {dict.successHeading}
        </h3>
        <p className="text-sm text-ink-soft">{dict.successBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.15em] text-teal-deep"
        >
          {dict.name}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={form.name}
          onChange={handleChange}
          className="w-full rounded-[12px] border border-rule bg-paper p-3 font-sans text-sm text-ink placeholder-ink-soft transition focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
        />
      </div>

      {/* Phone */}
      <div>
        <label
          htmlFor="phone"
          className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.15em] text-teal-deep"
        >
          {dict.phone}
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          value={form.phone}
          onChange={handleChange}
          placeholder="+961 XX XXX XXX"
          className="w-full rounded-[12px] border border-rule bg-paper p-3 font-sans text-sm text-ink placeholder-ink-soft transition focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
        />
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.15em] text-teal-deep"
        >
          {dict.message}
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          value={form.message}
          onChange={handleChange}
          placeholder={dict.messagePlaceholder}
          className="w-full resize-none rounded-[12px] border border-rule bg-paper p-3 font-sans text-sm text-ink placeholder-ink-soft transition focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-full bg-ink py-3.5 text-sm font-medium text-paper transition hover:opacity-90"
        style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
      >
        {dict.submit}
      </button>
    </form>
  );
}
