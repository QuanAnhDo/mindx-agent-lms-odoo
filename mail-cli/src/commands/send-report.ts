import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { sendMail } from "../lib/mail-sender.js";

export const register = (program: Command) => {
  program
    .command("send-report")
    .description("Send LMS ticket report via email")
    .requiredOption("-f, --file <file>", "Path to report file (markdown)")
    .requiredOption("-t, --to <emails>", "Recipient emails (comma-separated)")
    .option("--cc <emails>", "CC emails (comma-separated)")
    .option("--subject <subject>", "Email subject")
    .action(async (options) => {
      try {
        const reportPath = path.resolve(options.file);
        if (!fs.existsSync(reportPath)) {
          throw new Error(`Report file not found: ${reportPath}`);
        }

        const reportContent = fs.readFileSync(reportPath, "utf-8");
        const recipients = options.to.split(",").map((e: string) => e.trim());
        const ccRecipients = options.cc?.split(",").map((e: string) => e.trim());

        // Generate subject from filename if not provided
        const filename = path.basename(reportPath, ".md");
        const subject = options.subject || `LMS Report: ${filename}`;

        // Convert markdown to HTML
        const htmlContent = convertMarkdownToHtml(reportContent, filename);

        await sendMail({
          to: recipients,
          subject,
          htmlContent,
          cc: ccRecipients,
        });

        console.log(`Report sent successfully to: ${recipients.join(", ")}`);
      } catch (error: unknown) {
        console.error("Error:", error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
};

function convertMarkdownToHtml(markdown: string, title: string): string {
  const lines = markdown.split('\n');
  let html = '';
  let inTable = false;
  let tableRows: string[][] = [];
  let isHeaderRow = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      if (inTable) {
        html += buildTable(tableRows);
        tableRows = [];
        inTable = false;
      }
      continue;
    }

    // Check if line is a table row
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      
      // Check if this is a separator row (|---|---|)
      if (cells.every(c => c.match(/^-+$/))) {
        isHeaderRow = false;
        continue;
      }

      if (!inTable) {
        inTable = true;
        isHeaderRow = true;
      }

      tableRows.push(cells);
      continue;
    }

    // If we were in a table, close it
    if (inTable) {
      html += buildTable(tableRows);
      tableRows = [];
      inTable = false;
    }

    // Process headers
    if (line.startsWith('### ')) {
      html += `<h3>${line.substring(4)}</h3>`;
    } else if (line.startsWith('## ')) {
      html += `<h2>${line.substring(3)}</h2>`;
    } else if (line.startsWith('# ')) {
      html += `<h1>${line.substring(2)}</h1>`;
    } else if (line.startsWith('> ')) {
      // Blockquote (metadata)
      const content = line.substring(2);
      html += `<div class="meta">${content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>`;
    } else if (line.startsWith('---')) {
      html += `<hr>`;
    } else if (line.startsWith('- ')) {
      html += `<li>${processInlineFormatting(line.substring(2))}</li>`;
    } else {
      html += `<p>${processInlineFormatting(line)}</p>`;
    }
  }

  // Close any remaining table
  if (inTable) {
    html += buildTable(tableRows);
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="700" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">LMS TICKET REPORT</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              ${html}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #6c757d; font-size: 12px;">This report was generated automatically by MindX LMS Odoo Ticket Agent</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function buildTable(rows: string[][]): string {
  if (rows.length === 0) return '';

  const numCols = rows[0].length;
  const header = rows[0];
  
  // Detect table type by header content
  const isSummaryTable = header.some(h => h.includes('Metric') || h.includes('This Week'));
  const isTagTable = header.some(h => h.includes('Tag') && header.includes('Trend'));
  const isDetailTable = header.some(h => h.includes('ID') && h.includes('Ticket Name'));

  let table = `<table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; table-layout: fixed; word-wrap: break-word; overflow-wrap: break-word;">`;
  
  // First row is header
  table += '<thead><tr style="background-color: #667eea; color: white;">';
  for (let c = 0; c < rows[0].length; c++) {
    const cell = rows[0][c];
    let width = '';
    if (isDetailTable) {
      if (c === 0) width = 'width: 40px;';        // ID
      else if (c === 1) width = 'width: 70px;';    // Created
      else if (c === 2) width = 'width: 70px;';    // Stage
      else if (c === 3) width = 'width: 50px;';    // Duration
      else width = 'width: auto;';                  // Ticket Name (rest)
    } else if (isSummaryTable) {
      if (c === 0) width = 'width: 100px;';       // Metric
      else if (c === numCols - 1) width = 'width: 80px;'; // Trend
      else width = 'width: auto;';
    } else if (isTagTable) {
      if (c === 0) width = 'width: auto;';         // Tag name
      else if (c === numCols - 1) width = 'width: 80px;'; // Trend
      else width = 'width: auto;';
    }
    table += `<th style="padding: 10px 6px; text-align: left; font-weight: 600; ${width}">${processInlineFormatting(cell)}</th>`;
  }
  table += '</tr></thead>';

  // Rest are data rows
  table += '<tbody>';
  for (let i = 1; i < rows.length; i++) {
    const bgColor = i % 2 === 0 ? '#f8f9fa' : '#ffffff';
    table += `<tr style="background-color: ${bgColor};">`;
    for (let c = 0; c < rows[i].length; c++) {
      const cell = rows[i][c];
      // Highlight open/closed status
      let cellStyle = 'padding: 6px; border-bottom: 1px solid #eee; word-wrap: break-word; overflow-wrap: break-word;';
      if (isDetailTable) {
        if (c === 0) cellStyle += ' width: 40px;';        // ID
        else if (c === 1) cellStyle += ' width: 70px;';    // Created
        else if (c === 2) cellStyle += ' width: 70px;';    // Stage
        else if (c === 3) cellStyle += ' width: 50px;';    // Duration
        else cellStyle += ' width: auto;';                  // Ticket Name
      } else if (isSummaryTable || isTagTable) {
        if (c === numCols - 1) cellStyle += ' width: 80px;'; // Trend column
      }
      if (cell === 'Open' || cell.includes('In Progress') || cell.includes('On Hold')) {
        cellStyle += ' color: #e74c3c; font-weight: 600;';
      } else if (cell === 'Closed' || cell.includes('Solved') || cell.includes('Cancelled')) {
        cellStyle += ' color: #27ae60; font-weight: 600;';
      }
      // Style trend arrows
      if (cell.startsWith('↑')) {
        cellStyle += ' color: #e74c3c; font-weight: 600;';
      } else if (cell.startsWith('↓')) {
        cellStyle += ' color: #27ae60; font-weight: 600;';
      } else if (cell.startsWith('→')) {
        cellStyle += ' color: #7f8c8d; font-weight: 600;';
      }
      table += `<td style="${cellStyle}">${processInlineFormatting(cell)}</td>`;
    }
    table += '</tr>';
  }
  table += '</tbody></table>';

  return table;
}

function processInlineFormatting(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #2c3e50;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}
