import nodemailer from "npm:nodemailer@6.9.16";

export interface MailConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
}

export function getMailConfig(): MailConfig | null {
  const host = Deno.env.get("MAIL_HOST")?.trim();
  const portRaw = Deno.env.get("MAIL_PORT")?.trim();
  const username = Deno.env.get("MAIL_USERNAME")?.trim();
  const password = Deno.env.get("MAIL_PASSWORD")?.trim();
  const fromName = Deno.env.get("MAIL_FROM_NAME")?.trim() || "ATN ChanTier";
  const fromEmail = Deno.env.get("MAIL_FROM_EMAIL")?.trim();

  if (!host || !portRaw || !username || !password || !fromEmail) {
    return null;
  }

  const port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) {
    return null;
  }

  return { host, port, username, password, fromName, fromEmail };
}

export async function sendOtpEmail(to: string, otp: string, lang: "fr" | "en" = "fr"): Promise<void> {
  const cfg = getMailConfig();
  if (!cfg) {
    throw new Error("mail_not_configured");
  }

  const brand = cfg.fromName;

  const subject =
    lang === "en"
      ? `${brand} — Password reset code`
      : `${brand} — Code de réinitialisation`;

  const text =
    lang === "en"
      ? `${brand}\n\nYour password reset code is: ${otp}\n\nThis code expires in 10 minutes.\nIf you did not request a password reset for ATN ChanTier, you can ignore this email.`
      : `${brand}\n\nVotre code de réinitialisation ATN ChanTier est : ${otp}\n\nCe code expire dans 10 minutes.\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.`;

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: {
      user: cfg.username,
      pass: cfg.password,
    },
  });

  await transporter.sendMail({
    from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
    to,
    subject,
    text,
  });
}
