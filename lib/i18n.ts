import { site } from "@/lib/site";
import enDict from "@/messages/en.json";

export type Locale = (typeof site.locales)[number];

export type Dictionary = typeof enDict;

export const isLocale = (value: string): value is Locale =>
  (site.locales as readonly string[]).includes(value);

// Layout direction per locale. Arabic reads right-to-left; English left-to-right.
export const dirOf = (locale: Locale): "rtl" | "ltr" =>
  locale === "ar" ? "rtl" : "ltr";

// Display label shown in the language toggle for each locale.
export const localeLabel: Record<Locale, string> = {
  en: "EN",
  ar: "عربي",
};

// HTML lang attribute per locale (BCP 47 codes).
export const htmlLang: Record<Locale, string> = {
  en: "en",
  ar: "ar",
};

// Dictionary loader. Each locale's strings live in messages/<locale>.json.
const loaders: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("@/messages/en.json").then((m) => m.default as Dictionary),
  ar: () => import("@/messages/ar.json").then((m) => m.default as Dictionary),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return loaders[locale]();
}
