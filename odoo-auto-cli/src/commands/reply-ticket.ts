import { Command } from 'commander';
import { executeKw, loadTemplate } from '../helpers.js';

export function register(program: Command) {
  program
    .command('reply-ticket')
    .description('Reply to an Odoo Helpdesk ticket using an HTML template')
    .requiredOption('-t, --ticket-id <ticketId>', 'Ticket ID to reply to', (v) => parseInt(v))
    .requiredOption('--template <template>', 'Template HTML file from template/ directory')
    .option('--dry-run', 'Print payload without calling API', false)
    .action(async (options) => {
      const ticketId: number = options.ticketId;
      const templateName: string = options.template;
      const dryRun: boolean = options.dryRun;

      try {
        // 1. Verify ticket exists
        const tickets = await executeKw('helpdesk.ticket', 'search_read', [
          [[['id', '=', ticketId]]],
          { fields: ['id', 'name'], limit: 1 },
        ]);

        if (!tickets || tickets.length === 0) {
          console.log(`No ticket found with ID: ${ticketId}`);
          process.exit(0);
        }

        const ticket = tickets[0];
        console.log(`Ticket found: [${ticket.id}] ${ticket.name}`);

        // 2. Load HTML template
        const body = await loadTemplate(templateName);

        const payload = {
          model: 'helpdesk.ticket',
          res_ids: [ticket.id],
          body,
          composition_mode: 'comment',
          message_type: 'comment',
        };

        if (dryRun) {
          console.log('\n[DRY RUN] Payload:');
          console.log(JSON.stringify(payload, null, 2));
          return;
        }

        // 3. Create and send the message
        const wizardId = await executeKw('mail.compose.message', 'create', [[payload]]);
        await executeKw('mail.compose.message', 'action_send_mail', [[wizardId]]);

        console.log(`\nĐã reply ticket ${ticket.id} thành công!`);

      } catch (error: unknown) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
