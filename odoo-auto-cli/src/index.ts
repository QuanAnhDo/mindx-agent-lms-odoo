#!/usr/bin/env node
import { Command } from 'commander';
import { connectOdoo } from './helpers.js';
import { register as registerCrawlTicket } from './commands/crawl-ticket.js';
import { register as registerReplyTicket } from './commands/reply-ticket.js';
import { register as registerResolveTicket } from './commands/resolve-ticket.js';
import { register as registerCheckAssignee } from './commands/check-assignee.js';
import { register as registerNoteTicket } from './commands/note-ticket.js';

const program = new Command();
program
  .name('odoo-auto-cli')
  .version('1.0.0')
  .description('Odoo Helpdesk automation CLI — crawl tickets and reply with templates');

// Register subcommands
registerCrawlTicket(program);
registerReplyTicket(program);
registerResolveTicket(program);
registerCheckAssignee(program);
registerNoteTicket(program);

// Hook: connect to Odoo before any command runs
program.hook('preAction', async () => {
  await connectOdoo();
});

program.parseAsync(process.argv);