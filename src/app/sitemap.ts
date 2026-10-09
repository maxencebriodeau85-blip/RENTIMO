import type { MetadataRoute } from "next";
import { MARCHE } from "@/lib/marche";
import { URL_SITE } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const maintenant = new Date();
  const pages = ["", "/simulateur", "/marche", "/renover", "/radar", "/pro", "/tarifs", "/methodologie", "/mentions-legales", "/cgv", "/confidentialite"];
  return [
    ...pages.map((p) => ({ url: `${URL_SITE}${p}`, lastModified: maintenant, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...MARCHE.codes_postaux.map((c) => ({ url: `${URL_SITE}/marche/${c.cp}`, lastModified: maintenant, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
