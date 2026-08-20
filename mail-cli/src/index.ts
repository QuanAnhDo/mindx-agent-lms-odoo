import { Command } from "commander";
import { register as registerSendReport } from "./commands/send-report.js";

// CLI setup
const program = new Command();

program
  .name("mail-cli")
  .description("CLI for sending LMS reports via Gmail")
  .version("1.0.0");

// Register commands
registerSendReport(program);

program.parse();
