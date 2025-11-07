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

  return parseResult.data.map((row) => ({
    weekNumber: parseInt(row.Week, 10),
    phase: row.Phase || null,
    beltTarget: row.Belt_Target || null,
    focus: row.Focus || null,
    runningQualities: row.Running_Qualities || null,
    mbsPrimary: row.MBS_Primary || null,
    strengthTheme: row.Strength_Theme || null,
    plyoContactsCap: row.Plyo_Contacts_Cap ? parseInt(row.Plyo_Contacts_Cap, 10) : null,
    testingGateway: row.Testing_Gateway || null,
    notes: row.Notes || null,
  }));
}
