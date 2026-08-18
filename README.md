# MindX LMS Odoo Ticket Agent

System for managing and reporting LMS tickets from Odoo Helpdesk.

## Features

- **Crawl ticket**: Fetch ticket information from Odoo
- **Reply ticket**: Reply to tickets on Odoo
- **Resolve ticket**: Mark ticket as solved
- **Check assignee**: Check assigned person
- **Note ticket**: Add internal note
- **Report**: Generate weekly/monthly reports with detailed statistics
- **Send Report**: Send reports via Outlook email

## Installation

### 1. Clone repository

```bash
git clone https://github.com/QuanAnhDo/mindx-agent-lms-odoo.git
cd mindx-agent-lms-odoo
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment

```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env with your Odoo credentials and Microsoft Graph API credentials
```

`.env` content:

```env
# Odoo
URL="https://hrm.mindx.edu.vn"
DB="mindx-crm"
USER_NAME="your-email"
API_KEY="your-odoo-api-key"

# Microsoft Graph API (for mail-cli)
USER_EMAIL_GROUP="your-email@mindx.edu.vn"
AZURE_CLIENT_ID_GROUP="your-azure-client-id"
AZURE_TENANT_ID_GROUP="your-azure-tenant-id"
```

### 4. Verify installation

```bash
# Test Odoo connection
pnpm odoo crawl-ticket -t 7700
```

## Usage

### Ticket Operations

```bash
# Crawl ticket
pnpm odoo crawl-ticket -t <ticket_id>

# Reply to ticket
pnpm odoo reply-ticket -t <ticket_id> --template <file>

# Mark ticket as solved
pnpm odoo resolve-ticket -t <ticket_id>

# Check assignee
pnpm odoo check-assignee -t <ticket_id>

# Add internal note
pnpm odoo note-ticket -t <ticket_id> -m "message"
```

### Reports

```bash
# Full month report
pnpm report <month> <year>

# Weekly report
pnpm report <month> <year> <weekStart> <weekEnd>

# Examples
pnpm report 8 2026          # August 2026, full month
pnpm report 8 2026 1 2      # August 2026, week 1-2
```

### Send Report via Email

```bash
# Send report to recipients
pnpm send-report -f <report-file> -t <email1,email2>

# Examples
pnpm send-report -f reports/2026-08/lms-report-week1.md -t anhtq@mindx.com.vn
pnpm send-report -f reports/2026-08/lms-report-week2.md -t team@mindx.com.vn,manager@mindx.com.vn

# With CC
pnpm send-report -f reports/2026-08/lms-report-week1.md -t anhtq@mindx.com.vn --cc manager@mindx.com.vn

# Custom subject
pnpm send-report -f reports/2026-08/lms-report-week1.md -t anhtq@mindx.com.vn --subject "Weekly LMS Report"
```

## Project Structure

```
mindx-agent-lms-odoo/
├── .env                 # Environment variables (not committed)
├── .env.example         # Environment template
├── .gitignore           # Files to ignore
├── AGENTS.md            # Agent instructions
├── README.md            # This file
├── package.json         # Package configuration
├── tsconfig.base.json   # TypeScript configuration
├── odoo-auto-cli/       # Odoo XML-RPC helpers
│   ├── src/
│   │   ├── index.ts     # CLI entry point
│   │   └── helpers.ts   # Odoo connection functions
│   └── package.json
├── mail-cli/            # Outlook email sender
│   ├── src/
│   │   ├── index.ts     # CLI entry point
│   │   ├── authentication.ts  # Azure Device Code Flow
│   │   ├── lib/
│   │   │   └── mail-sender.ts # Microsoft Graph API
│   │   └── commands/
│   │       └── send-report.ts # Send report command
│   └── package.json
└── scripts/             # Report scripts
    └── report.ts        # Report generator
```

## Report Format

Reports are saved in `reports/YYYY-MM/lms-report-weekN.md` with the following structure:

- **Summary**: Open/closed ticket counts
- **Tag Statistics**: Analysis by tag (sorted by count)
- **Processing Time**: Time buckets 0h-8h, 8h-24h, 24h-48h, >48h
- **In Progress**: List of open tickets
- **Closed**: List of closed tickets
- **Conclusion**: Weekly summary

## Week Schedule

- **Week starts**: Saturday
- **Week ends**: Friday
- **Monthly reset**: Each month starts fresh from day 1

Example for August 2026:
- Week 1: Aug 1 - Aug 7
- Week 2: Aug 8 - Aug 14
- Week 3: Aug 15 - Aug 21
- Week 4: Aug 22 - Aug 28
- Week 5: Aug 29 - Aug 31

## Odoo Stages

**LMS Team (ID: 10)**

| Stage | Status |
|-------|--------|
| New | Open |
| In Progress | Open |
| On Hold | Open |
| Solved | Closed |
| Closed | Closed |
| Cancelled | Closed |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `URL` | Odoo URL (https://hrm.mindx.edu.vn) |
| `DB` | Database name |
| `USER_NAME` | Username |
| `API_KEY` | API key |
| `USER_EMAIL_GROUP` | Outlook email for sending reports |
| `AZURE_CLIENT_ID_GROUP` | Azure AD App Client ID |
| `AZURE_TENANT_ID_GROUP` | Azure AD Tenant ID |

## License

Private - MindX Education
