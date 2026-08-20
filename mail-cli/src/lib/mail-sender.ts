import { Client } from "@microsoft/microsoft-graph-client";
import { getUserEmail } from "../authentication.js";

type SendMailOptions = {
  to: string[];
  subject: string;
  htmlContent: string;
  cc?: string[];
  bcc?: string[];
};

/**
 * Send an email via Microsoft Graph API (Client Credentials - /users/{email}/sendMail)
 */
export async function sendMail(
  client: Client,
  options: SendMailOptions
): Promise<void> {
  const { to, subject, htmlContent, cc, bcc } = options;

  if (!to || to.length === 0) {
    throw new Error("At least one recipient is required.");
  }

  const userEmail = getUserEmail();

  const message = {
    subject,
    body: {
      contentType: "HTML",
      content: htmlContent,
    },
    toRecipients: to.map((email) => ({
      emailAddress: { address: email },
    })),
    ccRecipients: cc?.map((email) => ({
      emailAddress: { address: email },
    })),
    bccRecipients: bcc?.map((email) => ({
      emailAddress: { address: email },
    })),
  };

  await client.api(`/users/${userEmail}/sendMail`).post({ message });
}
