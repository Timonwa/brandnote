import { SendMailClient } from "zeptomail";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

export async function sendEmail(input: {
  to: string;
  toName: string;
  subject: string;
  text: string;
}) {
  const token = process.env.ZEPTOMAIL_TOKEN;
  const fromAddress = process.env.ZEPTOMAIL_FROM_ADDRESS;
  if (!token || !fromAddress) {
    throw new Error("Set ZEPTOMAIL_TOKEN and ZEPTOMAIL_FROM_ADDRESS to send email");
  }

  // The SDK sends the token as the whole Authorization header, prefix included.
  const authorization = token.startsWith("Zoho-enczapikey ")
    ? token
    : `Zoho-enczapikey ${token}`;

  const client = new SendMailClient({
    url: process.env.ZEPTOMAIL_URL ?? "api.zeptomail.com/",
    token: authorization,
  });

  await client.sendMail({
    from: { address: fromAddress, name: process.env.ZEPTOMAIL_FROM_NAME ?? "Brandnote" },
    to: [{ email_address: { address: input.to, name: input.toName } }],
    subject: input.subject,
    textbody: input.text,
    htmlbody: toHtml(input.text),
  });
}
