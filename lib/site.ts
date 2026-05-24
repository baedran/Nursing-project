// Central place for business identity and contact details.
// Change the values here and they update everywhere on the site.

export const site = {
  name: "Caregivers Collective",
  shortName: "Caregivers Collective",
  tagline: "Hospital-trained home nursing for Beirut & Mount Lebanon",
  description:
    "Lebanese RNs and PNs from AUBMC, Hôtel-Dieu, and St Georges working their off-days. Coordinated by WhatsApp. A written summary in the family portal after every visit.",
  serviceArea: "Beirut & Mount Lebanon",
  established: "2026",

  // Public website URL — used for SEO metadata, sitemap, Open Graph, structured data.
  // Update this once the real domain is registered.
  url: "https://example.com",

  // Languages
  defaultLocale: "en" as const,
  locales: ["en", "ar"] as const,

  // Covered districts — 17 total, matches spec section 5.7
  districts: {
    beirut: [
      "Achrafieh",
      "Hamra",
      "Verdun",
      "Badaro",
      "Mar Mikhael",
      "Gemmayzeh",
      "Furn el Chebbak",
    ],
    mountLebanon: [
      "Sin El Fil",
      "Mansourieh",
      "Baabda",
      "Jal El Dib",
      "Antelias",
      "Jounieh",
      "Broumana",
      "Beit Mery",
      "Dbayeh",
      "Bauchrieh",
    ],
  },

  // Diaspora timezones — used in DiasporaSection. Paris first (primary persona).
  diasporaCities: [
    { name: "Beirut", tz: "Asia/Beirut" },
    { name: "Paris", tz: "Europe/Paris" },
    { name: "Dubai", tz: "Asia/Dubai" },
    { name: "Detroit", tz: "America/Detroit" },
  ] as const,

  // Payment rails for diaspora — order matters (most-used first)
  paymentRails: [
    { name: "Whish Money", type: "WALLET" },
    { name: "OMT International", type: "WIRE" },
    { name: "Western Union", type: "WIRE" },
    { name: "Direct USD wire", type: "USD" },
  ] as const,

  // Hospitals nurses are employed at (used in trust bar + hero subhead)
  hospitals: ["AUBMC", "Hôtel-Dieu", "St Georges"] as const,

  // WhatsApp — primary contact channel
  whatsapp: {
    number: "96100000000",
    display: "+961 XX XXX XXX",
  },

  get whatsappUrl() {
    return `https://wa.me/${this.whatsapp.number}`;
  },
  whatsappUrlWith(message: string) {
    return `https://wa.me/${this.whatsapp.number}?text=${encodeURIComponent(message)}`;
  },
} as const;
