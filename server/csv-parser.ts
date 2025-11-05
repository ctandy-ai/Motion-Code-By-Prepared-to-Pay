import type { InsertAthlete } from "@shared/schema";

export interface ParsedAthlete {
  athlete: InsertAthlete;
  groups: string[];
}

export function parseTeamBuildrCSV(csvContent: string): ParsedAthlete[] {
  const lines = csvContent.split('\n');
  const results: ParsedAthlete[] = [];
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const athlete = parseCsvLine(line);
      if (athlete) {
        results.push(athlete);
      }
    } catch (error) {
      console.error(`Failed to parse line ${i + 1}:`, error);
    }
  }
  
  return results;
}

function parseCsvLine(line: string): ParsedAthlete | null {
  // Parse CSV respecting quoted fields
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  
  // TeamBuildr format: FIRST, LAST, EMAIL, PHONE, GROUPS, CALENDAR, STATUS
  const [first, last, email, phone, groups, calendar, status] = fields;
  
  // Skip if no name
  if (!first || !last) {
    return null;
  }
  
  // Clean up status field - extract Registered/Pending from the HTML-like content
  let cleanStatus = 'Registered';
  if (status) {
    if (status.includes('Pending')) {
      cleanStatus = 'Pending';
    } else if (status.includes('Registered')) {
      cleanStatus = 'Registered';
    }
  }
  
  // Handle missing/invalid emails - generate placeholder for Pending athletes
  let cleanEmail: string | undefined = undefined;
  if (email && email !== 'N/A' && email.includes('@')) {
    cleanEmail = email.trim();
  } else if (cleanStatus === 'Pending') {
    // Generate unique placeholder email for pending invites
    const namePart = `${first}.${last}`.toLowerCase().replace(/[^a-z0-9.]/g, '');
    const randomId = Math.random().toString(36).substring(2, 10);
    cleanEmail = `pending.${namePart}.${randomId}@placeholder.stridepro.com`;
  }
  
  // Parse groups (comma-separated list)
  const groupList = groups && groups !== 'N/A'
    ? groups.split(',').map(g => g.trim()).filter(g => g.length > 0)
    : [];
  
  return {
    athlete: {
      name: `${first} ${last}`.trim(),
      email: cleanEmail,
      phone: phone && phone !== '' ? phone.trim() : undefined,
      status: cleanStatus,
    },
    groups: groupList,
  };
}

export function extractUniqueTeams(parsedAthletes: ParsedAthlete[]): string[] {
  const teamsSet = new Set<string>();
  
  for (const { groups } of parsedAthletes) {
    for (const group of groups) {
      teamsSet.add(group);
    }
  }
  
  return Array.from(teamsSet).sort();
}
