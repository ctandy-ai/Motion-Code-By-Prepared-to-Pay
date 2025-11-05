import Papa from 'papaparse';
import type { InsertAthlete } from "@shared/schema";

export interface ParsedAthlete {
  athlete: InsertAthlete;
  groups: string[];
}

export function parseTeamBuildrCSV(csvContent: string): ParsedAthlete[] {
  const results: ParsedAthlete[] = [];
  
  // Use PapaParse to handle multiline CSV properly
  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });
  
  console.log(`CSV parsing complete: ${parsed.data.length} rows found`);
  
  if (parsed.errors.length > 0) {
    console.warn(`CSV parsing warnings (${parsed.errors.length} errors):`, parsed.errors.slice(0, 5));
  }
  
  let skippedCount = 0;
  for (const row of parsed.data as any[]) {
    try {
      const athlete = parseAthleteRow(row);
      if (athlete) {
        results.push(athlete);
      } else {
        skippedCount++;
      }
    } catch (error) {
      console.error('Failed to parse athlete row:', error, row);
      skippedCount++;
    }
  }
  
  console.log(`Parsed ${results.length} athletes, skipped ${skippedCount} rows`);
  
  return results;
}

function parseAthleteRow(row: any): ParsedAthlete | null {
  const first = row.FIRST?.trim();
  const last = row.LAST?.trim();
  const email = row.EMAIL?.trim();
  const phone = row.PHONE?.trim();
  const groups = row.GROUPS?.trim();
  const status = row.STATUS?.trim();
  // Skip if no name
  if (!first || !last) {
    return null;
  }
  
  // Handle missing/invalid emails - generate placeholder for any athlete without valid email
  let cleanEmail: string | undefined = undefined;
  let hasRealEmail = email && email !== 'N/A' && email.includes('@');
  
  if (hasRealEmail) {
    cleanEmail = email.trim();
  } else {
    // Generate unique placeholder email for athletes without valid emails
    const namePart = `${first}.${last}`.toLowerCase().replace(/[^a-z0-9.]/g, '');
    const randomId = Math.random().toString(36).substring(2, 10);
    cleanEmail = `pending.${namePart}.${randomId}@placeholder.stridepro.com`;
  }
  
  // Clean up status field - extract Registered/Pending from the HTML-like content
  // If no real email, mark as Pending regardless of status field
  let cleanStatus = hasRealEmail ? 'Registered' : 'Pending';
  if (status) {
    if (status.includes('Pending')) {
      cleanStatus = 'Pending';
    } else if (status.includes('Registered') && hasRealEmail) {
      cleanStatus = 'Registered';
    }
  }
  
  // Parse groups (comma-separated list)
  const groupList = groups && groups !== 'N/A'
    ? groups.split(',').map((g: string) => g.trim()).filter((g: string) => g.length > 0)
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
