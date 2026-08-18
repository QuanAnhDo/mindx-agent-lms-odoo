import { Command } from 'commander';
import { executeKw } from '../helpers.js';

export function register(program: Command) {
  program
    .command('note-ticket')
    .description('Post an internal note on an Odoo Helpdesk ticket (not visible to the customer)')
    .requiredOption('-t, --ticket-id <ticketId>', 'Ticket ID to add note to', (v) => parseInt(v))
    .requiredOption('-m, --message <message>', 'Note content (plain text or HTML)')
    .option('--dry-run', 'Print payload without calling API', false)
    .action(async (options) => {
      const ticketId: number = options.ticketId;
      const message: string = options.message;
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

        // 2. Resolve subtype ID for internal note via mail.message.subtype
        //    Odoo 19 removed 'default_on'; filter by internal=True + no res_model (global subtypes)
        const subtypes = await executeKw('mail.message.subtype', 'search_read', [
          [[['internal', '=', true], ['res_model', '=', false]]],
          { fields: ['id', 'name'], limit: 5 },
        ]);

        if (!subtypes || subtypes.length === 0) {
          throw new Error('Could not find internal note subtype in Odoo');
        }

        // Prefer subtype named "Note" (mt_note), fallback to first result
        const noteSubtype = subtypes.find((s: { id: number; name: string }) =>
          s.name.toLowerCase() === 'note'
        ) ?? subtypes[0];

        const noteSubtypeId: number = noteSubtype.id;
        console.log(`Using note subtype: [${noteSubtypeId}] ${noteSubtype.name}`);

        // 3. Build payload using mail.compose.message wizard (same as reply-ticket)
        //    subtype_id = mail.mt_note → internal note, invisible to customer
        const payload = {
          model: 'helpdesk.ticket',
          res_ids: [ticketId],
          body: message,
          composition_mode: 'comment',
          message_type: 'comment',
          subtype_id: noteSubtypeId,
        };

        if (dryRun) {
          console.log('\n[DRY RUN] Payload:');
          console.log(JSON.stringify(payload, null, 2));
          return;
        }

        // 4. Create wizard → send
        const wizardId = await executeKw('mail.compose.message', 'create', [[payload]]);
        await executeKw('mail.compose.message', 'action_send_mail', [[wizardId]]);

        console.log(`\nĐã ghi chú nội bộ vào ticket ${ticketId} thành công!`);

      } catch (error: unknown) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
