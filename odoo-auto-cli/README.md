# odoo-auto-cli

CLI and helper library for interacting with Odoo Helpdesk via XML-RPC. It provides functions to crawl tickets, resolve tickets, send template emails, and parse CRM properties from text.

## Setup

The tool requires Odoo configuration. Ensure the following environment variables are set in your root `.env`:

```env
URL="https://<your-domain>.odoo.com"
DB="<your-database>"
USER_NAME="<your-email>"
API_KEY="<your-odoo-api-key>"
```

Install dependencies:

```bash
pnpm install
```

## Usage

### As a CLI Tool

From this directory:

```bash
pnpm start crawl-ticket -t <ticketId>
pnpm start reply-ticket -t <ticketId> --template <templateFile>
pnpm start resolve-ticket -t <ticketId>
```

Or from the workspace root:

```bash
pnpm odoo crawl-ticket -t <ticketId>
pnpm odoo reply-ticket -t <ticketId> --template <templateFile>
pnpm odoo resolve-ticket -t <ticketId>
```

### As a Library

The `odoo-auto-cli` provides helper functions exported for use in `api-server` or other packages.

```typescript
import { 
  connectOdoo, 
  executeKw, 
  extractCrmIds, 
  loadTemplate 
} from 'odoo-auto-cli/dist/helpers.js';

// Connect to Odoo and run arbitrary XML-RPC methods
await connectOdoo();
const result = await executeKw("helpdesk.ticket", "search_read", [[["id", "=", 123]], ["name"]]);
```

## Structure

- `src/index.ts` - Main CLI entry point.
- `src/helpers.ts` - Shared utility functions for Odoo connection, API execution, and regex data extraction.
- `src/commands/` - Commander action files for crawling, replying, and resolving tickets.
