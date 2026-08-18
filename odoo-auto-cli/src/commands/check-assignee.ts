import { Command } from 'commander';
import { formatOdooMany2One, getTicketAssignee, isBotAssignee } from '../helpers.js';

export function register(program: Command) {
  program
    .command('check-assignee')
    .description('Check whether an Odoo Helpdesk ticket is assigned to the bot account')
    .requiredOption('-t, --ticket-id <ticketId>', 'Ticket ID to check assignee', (v) => parseInt(v))
    .action(async (options) => {
      const ticketId: number = options.ticketId;

      try {
        const ticket = await getTicketAssignee(ticketId);

        if (!ticket) {
          console.log(`Not found ticket with ID: ${ticketId}`);
          process.exit(1);
        }

        const assignee = ticket.user_id;
        const matched = isBotAssignee(assignee);

        console.log('\n' + '═'.repeat(60));
        console.log(`Ticket ID: ${ticket.id}`);
        console.log(`Name: ${ticket.name}`);
        console.log(`Assignee: ${formatOdooMany2One(assignee)}`);
        console.log(`Is Bot Assignee: ${matched}`);
        console.log('═'.repeat(60));

        if (!matched) {
          process.exitCode = 2;
        }
      } catch (error: unknown) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
