import { Client } from "@microsoft/microsoft-graph-client";

type SendMailOptions = {
  to: string[];
  subject: string;
  htmlContent: string;
  cc?: string[];
  bcc?: string[];
};

/**
 * Send an email via Microsoft Graph API
 * @param client - Microsoft Graph client
 * @param options - Email options (to, subject, htmlContent, cc, bcc)
 */
export async function sendMail(
  client: Client,
  options: SendMailOptions
): Promise<void> {
  const { to, subject, htmlContent, cc, bcc } = options;

  if (!to || to.length === 0) {
    throw new Error("At least one recipient is required.");
  }

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

  await client.api("/me/sendMail").post({ message });
}

/**
 * Send an email with file attachment
 * @param client - Microsoft Graph client
 * @param options - Email options with attachment
 */
export async function sendMailWithAttachment(
  client: Client,
  options: SendMailOptions & {
    attachment: {
      filename: string;
      content: string; // Base64 encoded
      contentType: string;
    };
  }
): Promise<void> {
  const { to, subject, htmlContent, cc, bcc, attachment } = options;

  if (!to || to.length === 0) {
    throw new Error("At least one recipient is required.");
  }

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
    attachments: [
      {
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: attachment.filename,
        contentType: attachment.contentType,
        contentBytes: attachment.content,
      },
    ],
  };

  await client.api("/me/sendMail").post({ message });
}
