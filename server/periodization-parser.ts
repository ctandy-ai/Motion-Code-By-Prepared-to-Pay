import Papa from "papaparse";
import type { InsertTemplateWeekMetadata } from "../shared/schema";

interface PeriodizationRow {
  Week: string;
  Phase: string;
  Belt_Target: string;
  Focus: string;
  Running_Qualities: string;
  MBS_Primary: string;
  Strength_Theme: string;
  Plyo_Contacts_Cap: string;
  Testing_Gateway: string;
  Notes: string;
}

export function parsePeriodizationCSV(csvContent: string): Omit<InsertTemplateWeekMetadata, 'templateId'>[] {
  const parseResult = Papa.parse<PeriodizationRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parseResult.errors.length > 0) {
    console.error("CSV parsing errors:", parseResult.errors);
    throw new Error("Failed to parse periodization CSV");
  }

  const weekMetadata: Omit<InsertTemplateWeekMetadata, 'templateId'>[] = [];
  const invalidWeeks: string[] = [];
  
  for (const row of parseResult.data) {
    const weekNumber = parseInt(row.Week, 10);
    
    if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 52) {
      invalidWeeks.push(row.Week || 'unknown');
      continue;
    }

    let plyoContactsCap: number | null = null;
    if (row.Plyo_Contacts_Cap) {
      const parsed = parseInt(row.Plyo_Contacts_Cap, 10);
      plyoContactsCap = isNaN(parsed) ? null : parsed;
    }

    weekMetadata.push({
      weekNumber,
      phase: row.Phase || null,
      beltTarget: row.Belt_Target || null,
      focus: row.Focus || null,
      runningQualities: row.Running_Qualities || null,
      mbsPrimary: row.MBS_Primary || null,
      strengthTheme: row.Strength_Theme || null,
      plyoContactsCap,
      testingGateway: row.Testing_Gateway || null,
      notes: row.Notes || null,
    });
  }

  if (invalidWeeks.length > 0) {
    throw new Error(`Invalid week numbers found: ${invalidWeeks.join(', ')}. Week numbers must be 1-52.`);
  }

  return weekMetadata;
}
