import slugifyLib from "slugify";

export function slugify(text: string, maxLength = 180): string {
  return slugifyLib(text, { lower: true, strict: true, locale: "pt", trim: true })
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

/** Sufixo curto para desempatar slugs repetidos. */
export function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7);
}
