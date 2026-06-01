import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { InstallGuide } from "@/components/pwa/InstallGuide";

export default async function InstallPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const t = dict.install;

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-2xl font-bold text-ink">{t.title}</h1>
      <p className="mt-3 text-ink-soft">{t.intro}</p>
      <div className="mt-8">
        <InstallGuide
          strings={{
            iphoneHeading: t.iphoneHeading,
            iphoneSteps: t.iphoneSteps,
            androidHeading: t.androidHeading,
            androidSteps: t.androidSteps,
            iphoneTab: t.iphoneTab,
            androidTab: t.androidTab,
            openInBrowserNote: t.openInBrowserNote,
          }}
        />
      </div>
    </div>
  );
}
