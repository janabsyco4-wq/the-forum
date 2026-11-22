/**
 * Outgoing email (verification and password-reset codes).
 *
 * Uses SMTP via nodemailer; with Gmail that is smtp.gmail.com:465 plus a
 * 16-character App Password (see `mailConfig()` in src/server/env.ts).
 *
 * When SMTP is not configured:
 *  - development: the message is printed to the server console, clearly
 *    marked, and callers get `delivery: "dev-console"` so the UI can say so;
 *  - production: sending throws a ConfigError (the API answers NOT_IMPLEMENTED).
 */
import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import type { Locale } from "@/types/domain";
import { ConfigError, isProduction, mailConfig } from "../env";

export type Delivery = "email" | "dev-console";

let transporter: Transporter | undefined;
function transport(): Transporter {
  if (transporter) return transporter;
  const cfg = mailConfig();
  transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
  });
  return transporter;
}

export function emailDeliveryConfigured(): boolean {
  return mailConfig().configured;
}

async function send(to: string, subject: string, text: string, html: string): Promise<Delivery> {
  const cfg = mailConfig();
  if (!cfg.configured) {
    if (isProduction) throw new ConfigError("SMTP_USER / SMTP_PASS are not set, so emails cannot be sent.");
    console.warn(`\n[mail:DEV-ONLY — SMTP not configured, nothing was emailed]\n  to: ${to}\n  subject: ${subject}\n${text.replace(/^/gm, "  | ")}\n`);
    return "dev-console";
  }
  await transport().sendMail({ from: cfg.from, to, subject, text, html });
  return "email";
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function codeEmail(opts: { name: string; code: string; locale: Locale; minutes: number; purpose: "verify" | "reset" }) {
  const { name, code, minutes, purpose } = opts;
  const ur = opts.locale === "ur";
  const en = {
    subject: purpose === "verify" ? `${code} is your THE FORUM verification code` : `${code} is your THE FORUM password reset code`,
    hello: `Hi ${name},`,
    line: purpose === "verify" ? "Use this code to confirm your email address:" : "Use this code to reset your password:",
    expires: `It expires in ${minutes} minutes. If you did not ask for this, you can ignore this email.`,
  };
  const urT = {
    subject: purpose === "verify" ? `${code} — دی فورم تصدیقی کوڈ` : `${code} — دی فورم پاس ورڈ ری سیٹ کوڈ`,
    hello: `${name}، السلام علیکم`,
    line: purpose === "verify" ? "اپنا ای میل تصدیق کرنے کے لیے یہ کوڈ درج کریں:" : "پاس ورڈ ری سیٹ کرنے کے لیے یہ کوڈ درج کریں:",
    expires: `یہ کوڈ ${minutes} منٹ میں ختم ہو جائے گا۔ اگر آپ نے یہ درخواست نہیں کی تو اس ای میل کو نظر انداز کر دیں۔`,
  };
  const t = ur ? urT : en;
  const other = ur ? en : null; // Urdu readers also get the English text below
  const text = [t.hello, "", t.line, "", `    ${code}`, "", t.expires, ...(other ? ["", "—", other.line, `    ${code}`, other.expires] : []), "", "THE FORUM — Think. Write. Debate. Act."].join("\n");
  const dir = ur ? "rtl" : "ltr";
  const html = `<!doctype html><html><body style="margin:0;background:#f6f1e7;font-family:Georgia,'Times New Roman',serif;color:#2b2420">
<div style="max-width:520px;margin:0 auto;padding:32px 24px" dir="${dir}">
<p style="font-size:13px;letter-spacing:.2em;color:#b4532a;margin:0 0 24px">THE FORUM</p>
<p style="font-size:16px;margin:0 0 12px">${esc(t.hello)}</p>
<p style="font-size:16px;margin:0 0 20px">${esc(t.line)}</p>
<p dir="ltr" style="font-size:34px;letter-spacing:.35em;font-weight:bold;background:#fff;border:1px solid #e6dccb;border-radius:12px;padding:16px 0;text-align:center;margin:0 0 20px;font-family:'Courier New',monospace">${esc(code)}</p>
<p style="font-size:14px;color:#6b5f55;margin:0 0 24px">${esc(t.expires)}</p>
${other ? `<hr style="border:none;border-top:1px solid #e6dccb;margin:24px 0"><div dir="ltr"><p style="font-size:14px;color:#6b5f55;margin:0">${esc(other.line)} <b>${esc(code)}</b>. ${esc(other.expires)}</p></div>` : ""}
<p style="font-size:12px;color:#9a8e83;margin:32px 0 0">THE FORUM — Think. Write. Debate. Act.</p>
</div></body></html>`;
  return { subject: t.subject, text, html };
}

export function sendCodeEmail(
  to: string,
  opts: { name: string; code: string; locale: Locale; minutes: number; purpose: "verify" | "reset" },
): Promise<Delivery> {
  const m = codeEmail(opts);
  return send(to, m.subject, m.text, m.html);
}
