import { Client } from "@microsoft/microsoft-graph-client";
import { Command } from "commander";

import { authProvider, AUTH_RECORD_FILE } from "./authentication.js";
import { register as registerSendReport } from "./commands/send-report.js";

const client = Client.initWithMiddleware({ authProvider });

// CLI setup
const program = new Command();

program
  .name("mail-cli")
  .description("CLI for sending LMS reports via Outlook")
  .version("1.0.0");

// Register commands
registerSendReport(program, client);

program.parse();
