// Central place for business identity and contact details.
// Change the values here and they update everywhere on the site.
//
// When you pick a final business name, just edit `name` (and `shortName` if you want
// a different version for tight spaces like the navbar logo).

export const site = {
  name: "HomeCare Lebanon",
  shortName: "HomeCare Lebanon",
  tagline: "Professional home nursing in Beirut & Mount Lebanon",
  description:
    "Licensed nurses for post-operative recovery, elderly daily care, wound care, injections, and IV therapy — delivered to your home in Beirut and Mount Lebanon.",
  serviceArea: "Beirut & Mount Lebanon",

  // Public website URL — used for SEO metadata, sitemap, Open Graph, and structured data.
  // Update this once your real domain is registered (e.g. "https://bayticare.com").
  url: "https://example.com",

  // Supported languages on the public site.
  // Default is what we redirect bare URLs to (e.g. "/" → "/en").
  defaultLocale: "en" as const,
  locales: ["en", "ar"] as const,

  // Covered districts — shown on the homepage Service Area section.
  // Edit the lists below as you expand or trim coverage.
  districts: {
    beirut: [
      "Achrafieh",
      "Hamra",
      "Verdun",
      "Ras Beirut",
      "Mar Mikhael",
      "Gemmayzeh",
      "Badaro",
      "Sodeco",
    ],
    mountLebanon: [
      "Jdeideh",
      "Antelias",
      "Dbayeh",
      "Jounieh",
      "Baabda",
      "Hazmieh",
      "Mansourieh",
      "Furn el Chebbak",
    ],
  },

  // WhatsApp is our primary contact channel.
  // `number` is digits-only (used in wa.me links). `display` is what we show to users.
  whatsapp: {
    number: "96100000000",
    display: "+961 XX XXX XXX",
  },

  // Convenience helpers — used so we don't repeat wa.me URLs across files.
  get whatsappUrl() {
    return `https://wa.me/${this.whatsapp.number}`;
  },
  whatsappUrlWith(message: string) {
    return `https://wa.me/${this.whatsapp.number}?text=${encodeURIComponent(message)}`;
  },
} as const;
