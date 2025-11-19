import { readFileSync } from 'fs';
import Papa from 'papaparse';
import { db } from './db';
import { programTemplates, templatePhases, templateWeeks } from '../shared/schema';

interface CSVRow {
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

export async function importTemplateFromCSV(csvPath: string, templateName: string, templateDescription?: string) {
  const csvContent = readFileSync(csvPath, 'utf-8');
  
  const { data: rows } = Papa.parse<CSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (rows.length === 0) {
    throw new Error('No data found in CSV');
  }

  const phaseGroups: Map<string, { startWeek: number; endWeek: number; rows: CSVRow[] }> = new Map();
  
  for (const row of rows) {
    const weekNum = parseInt(row.Week);
    const phaseName = row.Phase.trim();
    
    if (!phaseGroups.has(phaseName)) {
      phaseGroups.set(phaseName, {
        startWeek: weekNum,
        endWeek: weekNum,
        rows: [],
      });
    }
    
    const phase = phaseGroups.get(phaseName)!;
    phase.endWeek = Math.max(phase.endWeek, weekNum);
    phase.rows.push(row);
  }

  const maxWeek = Math.max(...rows.map(r => parseInt(r.Week)));

  return await db.transaction(async (tx) => {
    const [template] = await tx.insert(programTemplates).values({
      name: templateName,
      description: templateDescription || `${maxWeek}-week periodized training template`,
      category: 'Annual Plan',
      duration: maxWeek,
      tags: ['periodization', 'annual-plan', '52-week', 'APP'],
      isPublic: 1,
    }).returning();

    const sortedPhases = Array.from(phaseGroups.entries()).sort((a, b) => a[1].startWeek - b[1].startWeek);
    
    let orderIndex = 0;
    for (const [phaseName, phaseData] of sortedPhases) {
      const phaseType = phaseName.includes('GPP') ? 'base' 
                      : phaseName.includes('SPP') ? 'build'
                      : phaseName.includes('Peak') ? 'peak'
                      : phaseName.includes('Taper') ? 'taper'
                      : phaseName.includes('Competition') ? 'competition'
                      : 'recovery';

      const [newPhase] = await tx.insert(templatePhases).values({
        templateId: template.id,
        name: phaseName,
        startWeek: phaseData.startWeek,
        endWeek: phaseData.endWeek,
        phaseType,
        goals: `Weeks ${phaseData.startWeek}-${phaseData.endWeek}`,
        orderIndex,
      }).returning();

      for (const row of phaseData.rows) {
        await tx.insert(templateWeeks).values({
          templateId: template.id,
          phaseId: newPhase.id,
          weekNumber: parseInt(row.Week),
          beltTarget: row.Belt_Target || null,
          focus: row.Focus ? [row.Focus] : [],
          runningQualities: row.Running_Qualities || null,
          mbsPrimary: row.MBS_Primary || null,
          strengthTheme: row.Strength_Theme || null,
          plyoContactsCap: row.Plyo_Contacts_Cap ? parseInt(row.Plyo_Contacts_Cap) : null,
          testingGateway: row.Testing_Gateway || null,
          notes: row.Notes || null,
        });
      }

      orderIndex++;
    }

    return {
      template,
      phaseCount: phaseGroups.size,
      weekCount: rows.length,
    };
  });
}

export function getDefaultTemplateCSVPath(): string {
  return 'attached_assets/stridecode_12m_athlete_program_1762511479489.csv';
}
