import { Command } from "commander";

import { getGraphClient } from "./authentication.js";
import { register as registerSendReport } from "./commands/send-report.js";

const client = getGraphClient();

// CLI setup
const program = new Command();

program
  .name("mail-cli")
  .description("CLI for sending LMS reports via Outlook")
  .version("1.0.0");

// Register commands
registerSendReport(program, client);

program.parse();
