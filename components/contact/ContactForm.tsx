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
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
        <svg className="w-10 h-10 text-blue-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <h3 className="font-semibold text-slate-800 text-base mb-1">{dict.successHeading}</h3>
        <p className="text-slate-500 text-sm">{dict.successBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
          {dict.name}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={form.name}
          onChange={handleChange}
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
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
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
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
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-3 rounded-lg transition-colors"
      >
        {dict.submit}
      </button>
    </form>
  );
}
