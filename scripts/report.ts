import { connectOdoo, executeKw } from '../odoo-auto-cli/src/helpers.js';
import fs from 'fs';

// CONFIG - Stages from Odoo (team_id=10)
const OPEN_STAGES = ['New', 'In Progress', 'On Hold'];  // Đang xử lý / Chờ thông tin
const CLOSED_STAGES = ['Solved', 'Closed', 'Cancelled']; // Đã xử lý / Đã đóng / Đã hủy

interface ReportOptions {
  month: number;      // 0-11 (JS month)
  year: number;
  weekStart?: number; // 1-5 (null = all month)
  weekEnd?: number;
}

async function main() {
  const args = process.argv.slice(2);
  const month = parseInt(args[0]) || new Date().getMonth();
  const year = parseInt(args[1]) || new Date().getFullYear();
  const weekStart = args[2] ? parseInt(args[2]) : undefined;
  const weekEnd = args[3] ? parseInt(args[3]) : undefined;

  console.log(`\nLMS TICKET REPORT - Month ${month + 1}/${year}\n`);
  
  await connectOdoo();
  
  // Get all LMS tickets
  const tickets = await executeKw('helpdesk.ticket', 'search_read', [
    [[['team_id', '=', 10]]],
    { fields: ['id', 'name', 'stage_id', 'tag_ids', 'create_date', 'close_date', 'write_date'], 
      order: 'create_date desc' }
  ]);

  // Filter by month
  const monthTickets = tickets.filter((t: any) => {
    const date = new Date(t.create_date);
    return date.getFullYear() === year && date.getMonth() === month;
  });

  // Get tag names
  const tagMap = await getTagMap(monthTickets);

  // Group by week (Saturday-Friday)
  const weeks = groupByWeek(monthTickets, year, month);

  // Filter weeks if specified
  const weekNames = getWeekNames(year, month);
  const weeksToShow = weekStart && weekEnd 
    ? weekNames.filter((_, i) => i >= weekStart - 1 && i <= weekEnd - 1)
    : weekNames;

  // Generate separate file for each week
  for (const weekName of weeksToShow) {
    const weekTickets = weeks[weekName] || [];
    if (weekTickets.length === 0) continue;
    
    // Extract week number from name
    const weekNum = weekName.match(/Tuần (\d+)/)?.[1] || '0';
    
    let report = generateHeader(month, year, weekName);
    report += generateWeekSummary(weekTickets);
    report += generateTagStats(weekTickets, tagMap);
    report += generateDurationBuckets(weekTickets);
    report += generateWeekDetail(weekTickets, tagMap);
    report += generateConclusion(weekTickets, weekName);
    
    // Create month folder if not exists
    const monthFolder = `reports/${year}-${String(month + 1).padStart(2, '0')}`;
    if (!fs.existsSync(monthFolder)) {
      fs.mkdirSync(monthFolder, { recursive: true });
    }
    
    // Save to separate file
    const filename = `${monthFolder}/lms-report-week${weekNum}.md`;
    fs.writeFileSync(filename, report, 'utf-8');
    console.log(`Week ${weekNum} saved: ${filename}`);
  }
}

async function getTagMap(tickets: any[]): Promise<Record<number, string>> {
  const tagIds = new Set<number>();
  for (const ticket of tickets) {
    if (ticket.tag_ids) {
      for (const tagId of ticket.tag_ids) {
        tagIds.add(tagId);
      }
    }
  }
  
  const tagMap: Record<number, string> = {};
  if (tagIds.size > 0) {
    const tags = await executeKw('helpdesk.tag', 'search_read', [
      [[['id', 'in', Array.from(tagIds)]]],
      { fields: ['id', 'name'] }
    ]);
    for (const tag of tags) {
      tagMap[tag.id] = tag.name;
    }
  }
  return tagMap;
}

// Calculate week number based on Saturday-Friday calendar
// Week starts on Saturday, ends on Friday
function getWeekNumber(date: Date, year: number, month: number): number {
  // Get first day of month
  const firstDay = new Date(year, month, 1);
  // Get first Saturday of month (or before)
  const firstDayOfWeek = firstDay.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  
  // Days to go back to find the Saturday that starts the first week
  // If first day is Sat (6), we're at the start of a week
  // If first day is Sun (0), go back 1 day to Saturday
  // If first day is Mon (1), go back 2 days to Saturday
  // etc.
  let daysToSaturday = firstDayOfWeek === 6 ? 0 : (firstDayOfWeek + 1) % 7;
  
  // First Saturday of the week structure
  const firstSaturday = new Date(year, month, 1 - daysToSaturday);
  
  // Calculate which week this date falls into
  const diffDays = Math.floor((date.getTime() - firstSaturday.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
}

// Get week date ranges for a month (only within that month)
// Week = Saturday to Friday
function getWeekRanges(year: number, month: number): Array<{start: Date, end: Date, label: string}> {
  const ranges: Array<{start: Date, end: Date, label: string}> = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Find first Saturday on or after the 1st of month
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay(); // 0=Sun, 6=Sat
  
  // Days to add to get to first Saturday
  let daysToFirstSaturday;
  if (firstDayOfWeek === 6) {
    daysToFirstSaturday = 0; // Already Saturday
  } else {
    daysToFirstSaturday = (6 - firstDayOfWeek + 7) % 7;
  }
  
  const firstSaturday = new Date(year, month, 1 + daysToFirstSaturday);
  
  // If first Saturday is after the 1st, create a partial week from 1st to Friday before Saturday
  if (daysToFirstSaturday > 0) {
    const fridayBefore = new Date(firstSaturday);
    fridayBefore.setDate(fridayBefore.getDate() - 1);
    
    ranges.push({
      start: firstDay,
      end: fridayBefore,
      label: `Tuần 1 (1/${month + 1} - ${fridayBefore.getDate()}/${month + 1})`
    });
  }
  
  // Now create full Saturday-Friday weeks within the month
  let currentSaturday = new Date(firstSaturday);
  let weekNum = daysToFirstSaturday > 0 ? 2 : 1;
  
  while (true) {
    const weekEnd = new Date(currentSaturday);
    weekEnd.setDate(weekEnd.getDate() + 6); // Friday
    
    // Stop if we've gone past the month
    if (currentSaturday.getMonth() !== month) break;
    
    // Clamp end to last day of month
    const endDay = Math.min(weekEnd.getDate(), daysInMonth);
    const endDate = new Date(year, month, endDay);
    
    const startStr = `${currentSaturday.getDate()}/${month + 1}`;
    const endStr = `${endDate.getDate()}/${month + 1}`;
    
    ranges.push({
      start: new Date(currentSaturday),
      end: endDate,
      label: `Tuần ${weekNum} (${startStr} - ${endStr})`
    });
    
    weekNum++;
    currentSaturday.setDate(currentSaturday.getDate() + 7);
    
    if (weekNum > 6) break; // Safety
  }
  
  return ranges;
}

function groupByWeek(tickets: any[], year: number, month: number): Record<string, any[]> {
  const weeks: Record<string, any[]> = {};
  const weekRanges = getWeekRanges(year, month);
  
  for (const ticket of tickets) {
    const ticketDate = new Date(ticket.create_date);
    const ticketDay = ticketDate.getDate();
    const ticketMonth = ticketDate.getMonth();
    const ticketYear = ticketDate.getFullYear();
    
    for (const range of weekRanges) {
      const startDay = range.start.getDate();
      const startMonth = range.start.getMonth();
      const startYear = range.start.getFullYear();
      const endDay = range.end.getDate();
      const endMonth = range.end.getMonth();
      const endYear = range.end.getFullYear();
      
      // Compare only date (ignore time)
      const ticketNum = ticketYear * 10000 + ticketMonth * 100 + ticketDay;
      const startNum = startYear * 10000 + startMonth * 100 + startDay;
      const endNum = endYear * 10000 + endMonth * 100 + endDay;
      
      if (ticketNum >= startNum && ticketNum <= endNum) {
        if (!weeks[range.label]) weeks[range.label] = [];
        weeks[range.label].push(ticket);
        break;
      }
    }
  }
  return weeks;
}

function getWeekNames(year: number, month: number): string[] {
  return getWeekRanges(year, month).map(r => r.label);
}

function getStageName(ticket: any): string {
  if (!ticket.stage_id) return 'N/A';
  return Array.isArray(ticket.stage_id) ? ticket.stage_id[1] : ticket.stage_id;
}

function isClosed(ticket: any): boolean {
  return CLOSED_STAGES.includes(getStageName(ticket));
}

function isOpen(ticket: any): boolean {
  return OPEN_STAGES.includes(getStageName(ticket));
}

function calcDuration(ticket: any): number | null {
  const createDate = new Date(ticket.create_date);
  const now = new Date();
  const stage = getStageName(ticket);
  
  // Closed tickets: from creation to close date
  if (isClosed(ticket)) {
    if (ticket.close_date) {
      const closeDate = new Date(ticket.close_date);
      return (closeDate.getTime() - createDate.getTime()) / (1000 * 60 * 60);
    }
    // Fallback to write_date if close_date missing
    if (ticket.write_date) {
      const writeDate = new Date(ticket.write_date);
      return (writeDate.getTime() - createDate.getTime()) / (1000 * 60 * 60);
    }
  }
  
  // Open tickets (In Progress, New, First Response): from creation to now
  if (isOpen(ticket)) {
    return (now.getTime() - createDate.getTime()) / (1000 * 60 * 60);
  }
  
  return null;
}

function getDurationBucket(hours: number | null): string {
  if (hours === null) return 'Not closed';
  if (hours <= 8) return '0h-8h';
  if (hours <= 24) return '8h-24h';
  if (hours <= 48) return '24h-48h';
  return '>48h';
}

function generateHeader(month: number, year: number, weekName: string): string {
  let report = '# LMS TICKET REPORT\n\n';
  report += `> **Month**: ${month + 1}/${year}\n`;
  report += `> **Week**: ${weekName}\n`;
  report += `> **Team**: LMS (team_id = 10)\n`;
  report += `> **Generated**: ${new Date().toLocaleDateString('en-US')}\n\n`;
  return report;
}

function generateWeekSummary(tickets: any[]): string {
  const openCount = tickets.filter(isOpen).length;
  const closedCount = tickets.filter(isClosed).length;
  const total = tickets.length;
  const percent = total > 0 ? Math.round(closedCount / total * 100) : 0;
  
  let report = '## SUMMARY\n\n';
  report += `| Open | Closed | Total | Close Rate |\n`;
  report += `|------|--------|-------|------------|\n`;
  report += `| ${openCount} | ${closedCount} | ${total} | ${percent}% |\n\n`;
  return report;
}

function generateTagStats(tickets: any[], tagMap: Record<number, string>): string {
  // Count tickets per tag
  const tagCounts: Record<string, { count: number, open: number, closed: number }> = {};
  
  for (const ticket of tickets) {
    const tagNames = ticket.tag_ids 
      ? ticket.tag_ids.map((id: number) => tagMap[id] || `Tag ${id}`)
      : ['No tag'];
    
    for (const tagName of tagNames) {
      if (!tagCounts[tagName]) {
        tagCounts[tagName] = { count: 0, open: 0, closed: 0 };
      }
      tagCounts[tagName].count++;
      if (isOpen(ticket)) tagCounts[tagName].open++;
      if (isClosed(ticket)) tagCounts[tagName].closed++;
    }
  }
  
  // Sort by count (high to low)
  const sortedTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b.count - a.count);
  
  let report = '## TAG STATISTICS\n\n';
  report += `| Tag | Count | Open | Closed | Close Rate |\n`;
  report += `|-----|-------|------|--------|------------|\n`;
  
  for (const [tagName, stats] of sortedTags) {
    const percent = stats.count > 0 ? Math.round(stats.closed / stats.count * 100) : 0;
    report += `| ${tagName} | ${stats.count} | ${stats.open} | ${stats.closed} | ${percent}% |\n`;
  }
  
  report += '\n';
  return report;
}

function generateDurationBuckets(tickets: any[]): string {
  let report = '## PROCESSING TIME ANALYSIS\n\n';
  report += `| Time Bucket | Tickets | Rate |\n`;
  report += `|-------------|---------|------|\n`;
  
  const buckets = ['0h-8h', '8h-24h', '24h-48h', '>48h'];
  const total = tickets.length;
  
  for (const bucket of buckets) {
    const count = tickets.filter(t => getDurationBucket(calcDuration(t)) === bucket).length;
    const percent = total > 0 ? Math.round(count / total * 100) : 0;
    report += `| ${bucket} | ${count} | ${percent}% |\n`;
  }
  
  report += '\n';
  return report;
}

function generateWeekDetail(tickets: any[], tagMap: Record<number, string>): string {
  const openTickets = tickets.filter(isOpen);
  const closedTickets = tickets.filter(isClosed);
  
  let report = '';
  
  // Open tickets
  report += `## IN PROGRESS (${openTickets.length})\n\n`;
  if (openTickets.length > 0) {
    report += `| ID | Created | Stage | Duration | Ticket Name |\n`;
    report += `|-----|---------|-------|----------|-------------|\n`;
    for (const t of openTickets) {
      const date = new Date(t.create_date).toLocaleDateString('en-US');
      const duration = calcDuration(t);
      const durationStr = duration !== null ? `${Math.round(duration)}h` : 'N/A';
      report += `| ${t.id} | ${date} | ${getStageName(t)} | ${durationStr} | ${t.name} |\n`;
    }
  } else {
    report += 'No tickets.\n';
  }
  report += '\n';
  
  // Closed tickets
  report += `## CLOSED (${closedTickets.length})\n\n`;
  if (closedTickets.length > 0) {
    report += `| ID | Created | Stage | Duration | Ticket Name |\n`;
    report += `|-----|---------|-------|----------|-------------|\n`;
    for (const t of closedTickets) {
      const date = new Date(t.create_date).toLocaleDateString('en-US');
      const duration = calcDuration(t);
      const durationStr = duration !== null ? `${Math.round(duration)}h` : 'N/A';
      report += `| ${t.id} | ${date} | ${getStageName(t)} | ${durationStr} | ${t.name} |\n`;
    }
  } else {
    report += 'No tickets.\n';
  }
  report += '\n';
  
  return report;
}

function generateConclusion(tickets: any[], weekName: string): string {
  let report = '---\n\n## CONCLUSION\n\n';
  
  const openCount = tickets.filter(isOpen).length;
  const closedCount = tickets.filter(isClosed).length;
  const percent = Math.round(closedCount / tickets.length * 100);
  
  report += `- **${weekName}**: ${closedCount}/${tickets.length} closed (${percent}%)`;
  if (openCount > 0) report += ` | ${openCount} tickets in progress`;
  report += '\n\n';
  
  report += `> **Note**: Processing time = from ticket creation to first response\n`;
  report += `> - Closed tickets: from creation to closure\n`;
  report += `> - Open tickets: from creation to now\n`;
  
  return report;
}

main().catch(console.error);
