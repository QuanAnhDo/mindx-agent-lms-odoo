import { Command } from 'commander';
import { executeKw, extractCrmIds, extractPhoneNumbers, stripHtml } from '../helpers.js';

export function register(program: Command) {
  program
    .command('crawl-ticket')
    .description('Crawl Odoo Helpdesk ticket content and extract CRM ID if available')
    .requiredOption('-t, --ticket-id <ticketId>', 'Ticket ID to crawl', (v) => parseInt(v))
    .action(async (options) => {
      const ticketId: number = options.ticketId;
      try {
        const tickets = await executeKw('helpdesk.ticket', 'search_read', [
          [[['id', '=', ticketId]]],
          { fields: ['id', 'name', 'description', 'partner_id'], limit: 1 },
        ]);

        if (!tickets || tickets.length === 0) {
          console.log(`No ticket found with ID: ${ticketId}`);
          process.exit(0);
        }

        const ticket = tickets[0];
        const description = ticket.description ? stripHtml(ticket.description) : '(empty)';

        console.log('\n' + '═'.repeat(60));
        console.log(`Ticket ID: ${ticket.id}`);
        console.log(`Name: ${ticket.name}`);
        console.log(`Partner: ${ticket.partner_id ? ticket.partner_id[1] : '(none)'}`);
        console.log('═'.repeat(60));
        console.log('\nDescription:');
        console.log(description);
        console.log('═'.repeat(60));

        // Extract CRM IDs and Phone Numbers
        const crmIds: string[] = extractCrmIds(ticket.description || '');
        const crmPhones: string[] = extractPhoneNumbers(ticket.description || '');

        if (crmIds.length > 0) {
          console.log(`\nCRM IDs from links: ${crmIds.join(', ')}`);
        }

        if (crmPhones.length > 0) {
          console.log(`\nCRM Phones found: ${crmPhones.join(', ')}`);
        }

        if (crmIds.length === 0 && crmPhones.length === 0) {
          console.log('\nNo CRM IDs or Phones could be resolved from this ticket.');
        } else if (crmIds.length > 0) {
          console.log(`\nAll Unique CRM IDs: ${crmIds.join(', ')}`);
        }

      } catch (error: unknown) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
