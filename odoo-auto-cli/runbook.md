# Odoo Auto CLI — Agent Runbook

This document describes how to use the `odoo-auto-cli` commands for processing Odoo Helpdesk tickets.

## Commands

| Operation                            | Command                                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| Read ticket content + extract CRM ID | `pnpm odoo crawl-ticket -t <ticketId>`                                     |
| Reply to a ticket with HTML template | `pnpm odoo reply-ticket -t <ticketId> --template <templateFile>`           |
| Reply (preview only, no API call)    | `pnpm odoo reply-ticket -t <ticketId> --template <templateFile> --dry-run` |

## Flow 1: Crawl Ticket (Read + Extract CRM ID)

**When to use:** When you need to read an Odoo Helpdesk ticket's content and determine if it contains information about "not enrollment" (không enroll được), incorrect course tuition (học phí khóa học bị sai), incorrect product price (sai giá sản phẩm), or other allocation issues, and a CRM Lead ID for further processing (e.g., `pnpm allocation`).

**Steps:**

1. Run `pnpm odoo crawl-ticket -t <ticketId>`.
2. Read the output. The ticket's `Name`, `Partner`, and `Description` will be printed.
3. **Analyze the ticket description** to understand the actual issue. Determine the category:
   - **Allocation-related:** The description mentions problems like "không enroll được", "không hiển thị enroll", "không phân bổ được", "lỗi phân bổ", "allocation failed", "not enrolled", "học phí khóa học bị sai", "sai giá sản phẩm", "sai giá", or similar enrollment, pricing, or payment allocation failures.
   - **Other issues:** Any problem that does NOT involve enrollment, pricing errors, or allocation (e.g., UI bugs, login issues, data sync, etc.).
4. **Confidence check:** Rate your confidence (0–100%) in the classification above. If your confidence is **below 70%**, STOP and report: "I'm not confident enough to classify this ticket (confidence: X%). Please review and instruct me." Do NOT proceed with allocation or reply.
5. **Only if the issue is Allocation-related AND a CRM ID was found:**
   - Don't ask the user: execute `pnpm allocation lead --lead-id <id>` immediately.
6. **If a CRM ID was found but the issue is NOT Allocation-related:**
   - Report: "CRM ID found: `<id>`, but this ticket is about `<issue summary>`, not an allocation/pricing problem. Skipping allocation."
   - Proceed to propose a reply template instead (Flow 2).
7. **If no CRM ID was found:**
   - Report: "No CRM ID found in this ticket." Do NOT run allocation.

## Flow 2: Reply to Ticket (Post HTML Template)

**When to use:** After analyzing the ticket (via Flow 1) whenever a customer reply is appropriate (allocation done, or no allocation but a reply is still needed).

**Order is mandatory — do not reorder:**

1. **Read `template/.template-description.json` first** (full file). You must base template choice **only** on the descriptions and filenames in this registry. Do **not** guess template names from memory or filenames alone.
2. Pick **one** template file (path as in the registry, e.g. `template/foo.html`) that best matches the ticket.
3. **Confidence check:** Rate your confidence (0–100%) that the chosen template matches the ticket. If **below 70%**, report: "I'm not confident which template fits this ticket (confidence: X%). Please choose a template manually." and list templates from the registry for the user to pick. **Do not** ask "do you agree?" until either you have ≥70% confidence or the user has picked a template.
4. **If confidence >= 70%** (or user picked a template in step 3): ask for confirmation with the **exact** template path you chose from the registry, e.g. "Based on `template/.template-description.json`, I suggest `<templateFile>` (confidence: X%). Reply on this ticket? (yes / no / other template name)". **Wait for the user.**
5. Only after the user confirms **yes** → run `pnpm odoo reply-ticket -t <ticketId> --template <templateFile>`.
6. If output says `Đã reply ticket <id> thành công!` → the reply was posted successfully.
7. If an error occurs → report the error to the user immediately. Do NOT retry.

> ⚠️ CRITICAL: Never run `pnpm odoo reply-ticket` without (1) having read `template/.template-description.json` and (2) receiving explicit user confirmation for the chosen template. Remember to select a template before aksing for confirming; there's no skipping this step.

## Available Templates

Read `template/.template-description.json` for the complete list with descriptions.
