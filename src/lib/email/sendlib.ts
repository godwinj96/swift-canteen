import "server-only";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  const apiKey = process.env.SENDLIB_API_KEY;
  const fromEmail = process.env.SENDLIB_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    throw new Error("SendLib credentials are not configured");
  }

  const response = await fetch("https://sendlib.samueltuoyo.com/api/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from: fromEmail, to, subject, html }),
  });

  if (!response.ok) {
    throw new Error(`SendLib email send failed: ${response.status}`);
  }
}
