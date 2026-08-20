import nodemailer from "nodemailer";
import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenvConfig({ path: join(__dirname, "../../.env") });

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

if (!GMAIL_USER) throw new Error("Missing: GMAIL_USER");
if (!GMAIL_APP_PASSWORD) throw new Error("Missing: GMAIL_APP_PASSWORD");

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

export function getFromEmail(): string {
  return GMAIL_USER || "";
}
