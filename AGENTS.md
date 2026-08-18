# AGENTS.md — MindX LMS Odoo Agent

## Quick Commands

```bash
# Ticket Operations
npx tsx odoo-auto-cli/src/index.ts crawl-ticket -t <id>           # Crawl ticket info
npx tsx odoo-auto-cli/src/index.ts reply-ticket -t <id> --template <file>  # Reply to ticket
npx tsx odoo-auto-cli/src/index.ts resolve-ticket -t <id>         # Mark ticket as solved
npx tsx odoo-auto-cli/src/index.ts check-assignee -t <id>         # Check ticket assignee
npx tsx odoo-auto-cli/src/index.ts note-ticket -t <id> -m "msg"   # Add internal note

# Reporting
npx tsx scripts/report.ts <month> <year> [weekStart] [weekEnd]    # Generate report
```

**Examples:**
```bash
npx tsx scripts/report.ts 7 2026          # Tháng 8/2026, cả tháng
npx tsx scripts/report.ts 7 2026 1 2      # Tháng 8/2026, tuần 1-2
```

## CRITICAL RULES

1. **LUÔN lấy dữ liệu từ Odoo** - KHÔNG bao giờ tự tạo dữ liệu
2. **Xác thực team_id** - Chỉ lấy ticket team LMS (ID=10)
3. **Không hardcode** - Ticket ID, tên, tags đều phải lấy từ Odoo
4. **Lịch tuần** - Tuần = T7 đến T6 (tính động theo lịch thực tế)

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
