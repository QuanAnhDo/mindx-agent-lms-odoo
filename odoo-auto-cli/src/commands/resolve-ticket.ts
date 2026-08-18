import { Command } from 'commander';
import { executeKw } from '../helpers.js';

export function register(program: Command) {
  program
    .command('resolve-ticket')
    .description('Change the ticket status to "Đã xử lý"')
    .requiredOption('-t, --ticket-id <ticketId>', 'Ticket ID to resolve', (v) => parseInt(v))
    .action(async (options) => {
      const ticketId: number = options.ticketId;
      try {
        // Check ticket and get current stage 
        const tickets = await executeKw('helpdesk.ticket', 'search_read', [
          [[['id', '=', ticketId]]],
          { fields: ['id', 'name', 'stage_id'], limit: 1 },
        ]);

        if (!tickets || tickets.length === 0) {
          console.log(`Not found ticket with ID: ${ticketId}`);
          process.exit(1);
        }

        const ticket = tickets[0];
        const oldStageName = ticket.stage_id ? ticket.stage_id[1] : '(Trống)';
        console.log(`Ticket [${ticket.id}] is currently at stage: "${oldStageName}"`);

        // Get ID of stage "Solved" (Đã xử lý) to update
        const stages = await executeKw('helpdesk.stage', 'search_read', [
          [[['name', '=', 'Solved']]],
          { fields: ['id'], limit: 1 },
        ]);

        if (!stages || stages.length === 0) {
          console.log(`Not found stage "Solved" in Odoo system.`);
          process.exit(1);
        }

        const targetStageId = stages[0].id;

        // Skip if ticket is already in "Solved" stage
        if (ticket.stage_id && ticket.stage_id[0] === targetStageId) {
          console.log(`\nTicket ${ticketId} is already in "Solved" stage, no need to change.`);
          return;
        }

        // 3. Thực hiện chuyển stage
        const isSuccess = await executeKw('helpdesk.ticket', 'write', [
          [[ticketId], { stage_id: targetStageId }]
        ]);

        if (isSuccess) {
          console.log(`\n-> Change stage of ticket ${ticketId} from "${oldStageName}" to "Đã xử lý" successfully!`);
        } else {
          console.log(`\n-> Cannot change stage of ticket ${ticketId}.`);
        }

      } catch (error: unknown) {
        console.error('Error when changing ticket stage:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
