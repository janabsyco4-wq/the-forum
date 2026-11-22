/**
 * Server-side HTML sanitiser for rich text (article bodies, debate context and
 * conclusions, initiative bodies). Allowed tags are exactly the list documented
 * on `Article.body` in src/types/domain.ts. Never trust the client's editor.
 */
import sanitizeHtml from "sanitize-html";
import { uploadConfig } from "../env";

export const ALLOWED_TAGS = [
  "h2",
  "h3",
  "p",
  "blockquote",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "a",
  "img",
  "figure",
  "figcaption",
] as const;

function isSafeImageSrc(src: string): boolean {
  if (src.startsWith(uploadConfig().publicBase + "/")) return true; // our own uploads
  try {
    const u = new URL(src);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [...ALLOWED_TAGS],
  allowedAttributes: {
    a: ["href", "title", "rel", "target"], // rel/target are forced by transformTags below
    img: ["src", "alt", "title", "width", "height"],
  },
  allowedSchemes: ["https", "http", "mailto"],
  allowedSchemesByTag: { img: ["https"] },
  allowedSchemesAppliedToAttributes: ["href", "src"],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  // Keep text of unknown tags, but drop the contents of script/style entirely.
  nonTextTags: ["script", "style", "textarea", "option", "noscript", "iframe", "object"],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, rel: "noopener noreferrer nofollow ugc", target: "_blank" },
    }),
  },
  exclusiveFilter: (frame) => frame.tag === "img" && !isSafeImageSrc(frame.attribs.src ?? ""),
};

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, OPTIONS).trim();
}

/**
 * Plain-text fields (titles, comments, arguments, bios…). These are stored as
 * the user typed them and must always be rendered as text (React escapes it);
 * never inject them with dangerouslySetInnerHTML. We only remove control /
 * bidi-override characters and normalise whitespace.
 */
export function sanitizePlainText(text: string): string {
  return text
    .normalize("NFC")
    // C0/C1 controls except \t \n \r, plus bidi overrides/isolates used for spoofing (LRM/RLM/ALM are kept for Urdu).
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F‪-‮⁦-⁩]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\t ]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeBasicEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Text content of sanitised HTML, for excerpts, reading time and previews. */
export function htmlToText(html: string): string {
  return decodeBasicEntities(
    sanitizeHtml(html.replace(/<\/(p|h2|h3|li|blockquote|figcaption)>/gi, "$& "), {
      allowedTags: [],
      allowedAttributes: {},
    }),
  )
    .replace(/\s+/g, " ")
    .trim();
}
