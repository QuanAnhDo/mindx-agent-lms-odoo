# AGENTS.md — MindX LMS Odoo Agent

## Quick Commands

```bash
# Ticket Operations
pnpm odoo crawl-ticket -t <id>           # Fetch ticket info
pnpm odoo reply-ticket -t <id> --template <file>  # Reply to ticket
pnpm odoo resolve-ticket -t <id>         # Mark ticket as solved
pnpm odoo check-assignee -t <id>         # Check ticket assignee
pnpm odoo note-ticket -t <id> -m "msg"   # Add internal note

# Reporting
pnpm report <month> <year> [weekStart] [weekEnd]    # Generate report
```

**Examples:**
```bash
pnpm report 8 2026          # August 2026, full month
pnpm report 8 2026 1 2      # August 2026, week 1-2
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
