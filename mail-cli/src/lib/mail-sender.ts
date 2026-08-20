import { transporter, getFromEmail } from "../authentication.js";

type SendMailOptions = {
  to: string[];
  subject: string;
  htmlContent: string;
  cc?: string[];
};

export async function sendMail(options: SendMailOptions): Promise<void> {
  const { to, subject, htmlContent, cc } = options;
  const from = getFromEmail();

  await transporter.sendMail({
    from,
    to: to.join(", "),
    cc: cc?.join(", "),
    subject,
    html: htmlContent,
  });
}
