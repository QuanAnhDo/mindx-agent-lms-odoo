# AGENTS.md — MindX LMS Odoo Agent

## Quick Commands

```bash
# Ticket Operations
npx tsx odoo-auto-cli/src/index.ts crawl-ticket -t <id>           # Fetch ticket info
npx tsx odoo-auto-cli/src/index.ts reply-ticket -t <id> --template <file>  # Reply to ticket
npx tsx odoo-auto-cli/src/index.ts resolve-ticket -t <id>         # Mark ticket as solved
npx tsx odoo-auto-cli/src/index.ts check-assignee -t <id>         # Check ticket assignee
npx tsx odoo-auto-cli/src/index.ts note-ticket -t <id> -m "msg"   # Add internal note

# Reporting
npx tsx scripts/report.ts <month> <year> [weekStart] [weekEnd]    # Generate report
```

**Examples:**
```bash
npx tsx scripts/report.ts 7 2026          # August 2026, full month
npx tsx scripts/report.ts 7 2026 1 2      # August 2026, week 1-2
```

## CRITICAL RULES

1. **ALWAYS fetch data from Odoo** - NEVER generate fake data
2. **Validate team_id** - Only fetch LMS team tickets (ID=10)
3. **No hardcoding** - Ticket IDs, names, tags must come from Odoo
4. **Week schedule** - Week = Saturday to Friday (dynamic per calendar)

## Architecture

Simple structure with 1 package:

| Package | Purpose |
|---|---|
| `odoo-auto-cli` | Odoo XML-RPC helpers (crawl, reply, resolve, check-assignee, note tickets) |

## Environment

Copy `.env.example` → `.env` at workspace root.

Key vars: `URL`/`DB`/`USER_NAME`/`API_KEY` (Odoo)

## TypeScript

Extends `tsconfig.base.json`: `nodenext`, `strict`, `isolatedModules`, `types: ["node"]`, `esModuleInterop`.

## Build

CLIs run via `tsx` and do not need a build step.
