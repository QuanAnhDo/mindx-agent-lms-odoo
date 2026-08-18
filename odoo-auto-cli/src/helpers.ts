import odoo from 'odoo-xmlrpc';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  url: process.env.URL || 'https://tunght104.odoo.com',
  db: process.env.DB || 'tunght104',
  username: process.env.USER_NAME || 'tunght@mindx.com.vn',
  password: process.env.API_KEY || '',
};

const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || "30000", 10);

let connection: any = null;

/**
 * Connect to Odoo and return the connection instance.
 * Reuses existing connection if already established.
 */
export async function connectOdoo(): Promise<any> {
  if (connection) return connection;

  const conn = new odoo(config);

  await new Promise<void>((resolve, reject) => {
    conn.connect((err: any) => {
      if (err) return reject(new Error(`Odoo connection failed: ${err.message || err}`));
      resolve();
    });
  });

  connection = conn;
  console.log('Connected to Odoo successfully!');
  return conn;
}

/**
 * Promisified wrapper around conn.execute_kw.
 */
export async function executeKw(model: string, method: string, args: any[]): Promise<any> {
  const conn = await connectOdoo();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Odoo execute_kw timeout after ${REQUEST_TIMEOUT_MS}ms (${model}.${method})`));
    }, REQUEST_TIMEOUT_MS);

    conn.execute_kw(model, method, args, (err: any, result: any) => {
      clearTimeout(timeout);
      if (err) return reject(new Error(`Odoo execute_kw error (${model}.${method}): ${err.message || err}`));
      resolve(result);
    });
  });
}

export type OdooMany2One = [number, string] | false;

export type TicketAssignee = {
  id: number;
  name: string;
  user_id?: OdooMany2One;
};

const DEFAULT_BOT_ASSIGNEE_KEYWORDS = ['odoobot', 'odoo bot', 'bot', 'hà thanh tùng'];

export function getBotUserId(): number | null {
  const raw = process.env.ODOO_BOT_USER_ID;
  if (!raw) return null;

  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function getBotAssigneeKeywords(): string[] {
  const raw = process.env.ODOO_BOT_ASSIGNEE_KEYWORDS;
  if (!raw) return DEFAULT_BOT_ASSIGNEE_KEYWORDS;

  const keywords = raw
    .split(',')
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean);

  return keywords.length > 0 ? keywords : DEFAULT_BOT_ASSIGNEE_KEYWORDS;
}

export function isBotAssignee(assignee: OdooMany2One | undefined): boolean {
  if (!assignee || !Array.isArray(assignee)) return false;

  const botUserId = getBotUserId();
  if (botUserId !== null) {
    return assignee[0] === botUserId;
  }

  const assigneeName = String(assignee[1] ?? '').toLowerCase();
  return getBotAssigneeKeywords().some((keyword) => assigneeName.includes(keyword));
}

export function formatOdooMany2One(value: OdooMany2One | undefined): string {
  return value && Array.isArray(value) ? `[${value[0]}] ${value[1]}` : '(none)';
}

export async function getTicketAssignee(ticketId: number): Promise<TicketAssignee | null> {
  const tickets = await executeKw('helpdesk.ticket', 'search_read', [
    [[['id', '=', ticketId]]],
    { fields: ['id', 'name', 'user_id'], limit: 1 },
  ]) as TicketAssignee[];

  return tickets?.[0] ?? null;
}

/**
 * Fetch template content from Azure Wiki and extract the HTML block.
 */
export async function loadTemplate(_templateName: string): Promise<string> {
  throw new Error('loadTemplate requires wiki-cli (Azure Wiki integration) which is not installed.');
}

/**
 * Extract all CRM Lead IDs from a ticket description string.
 * Looks for patterns like id=%22<hex_id>%22 or id=<hex_id> in CRM URLs.
 */
export function extractCrmIds(description: string): string[] {
  if (!description) return [];

  // This regex supports id=ID, id="ID", or id=%22ID%22
  const matches = [...description.matchAll(/id=(?:%22|")?([a-f0-9]{24})(?:%22|")?/gi)];

  return Array.from(new Set(matches.map(m => m[1]).filter((id): id is string => Boolean(id))));
}

/**
 * Extract all phone numbers from a description string.
 * Formats them to +84...
 */
export function extractPhoneNumbers(description: string): string[] {
  if (!description) return [];

  const matches = description.match(/(?:\+?84|0)\d{8,13}\b/g);
  if (!matches) return [];

  const phones = matches.map(match => {
    let num = match.replace(/[\s.-]/g, '');
    if (num.startsWith('0')) {
      num = '84' + num.slice(1);
    } else if (num.startsWith('+84')) {
      num = num.slice(1);
    } else if (!num.startsWith('84')) {
      num = '84' + num;
    }
    return `+${num}`;
  });

  return Array.from(new Set(phones));
}

/**
 * Strip HTML tags from a string, returning clean plain text.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n/g, '\n')
    .trim();
}
