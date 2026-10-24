export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const SITE_NAME = "Anson Top Car";
export const SITE_NAME_ZH = "安森頂車";
export const SITE_DESCRIPTION = "安森頂車｜嚴選中古車，實車實價，LINE 預約賞車";
export const SITE_STREET = "大慶街一段 208 號";
export const SITE_LOCALITY = "台中市南區";
export const SITE_REGION = "台中市";
export const SITE_COUNTRY = "TW";
export const SITE_LAT = 24.11667;
export const SITE_LNG = 120.655845;

export const jsonLdAutoDealer = {
  "@context": "https://schema.org",
  "@type": "AutoDealer",
  name: SITE_NAME,
  alternateName: SITE_NAME_ZH,
  url: SITE_URL,
  image: `${SITE_URL}/og.jpg`,
  description: SITE_DESCRIPTION,
  address: {
    "@type": "PostalAddress",
    streetAddress: SITE_STREET,
    addressLocality: SITE_LOCALITY,
    addressRegion: SITE_REGION,
    addressCountry: SITE_COUNTRY,
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: SITE_LAT,
    longitude: SITE_LNG,
  },
  areaServed: {
    "@type": "City",
    name: "Taichung",
  },
} as const;
