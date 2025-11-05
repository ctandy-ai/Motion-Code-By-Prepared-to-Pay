import { storage } from "./storage";

export async function seedTemplates() {
  console.log("🌱 Seeding program templates...");

  const templates = [
    {
      name: "Off-Season Power Development",
      description: "12-week strength and power building program focused on compound movements and explosive exercises. Ideal for athletes preparing for next season.",
      category: "Strength",
      duration: 12,
      tags: ["Strength", "Power", "Hypertrophy", "Off-Season"],
      isPublic: 1,
    },
    {
      name: "Speed & Agility Program",
      description: "8-week program emphasizing linear speed, change of direction, and reactive agility. Perfect for improving on-field performance.",
      category: "Speed",
      duration: 8,
      tags: ["Speed", "Agility", "COD", "Sprint", "Acceleration"],
      isPublic: 1,
    },
    {
      name: "ACL Return-to-Play Phase 1",
      description: "6-week initial phase focusing on movement quality, symmetric loading, and foundational strength. Post-surgical rehabilitation program.",
      category: "Rehab",
      duration: 6,
      tags: ["Rehab", "ACL", "RTP", "Symmetry", "Movement Quality"],
      isPublic: 1,
    },
    {
      name: "In-Season Maintenance",
      description: "Ongoing program designed to maintain strength and power during competitive season while managing fatigue and recovery.",
      category: "In-Season",
      duration: 16,
      tags: ["In-Season", "Maintenance", "Recovery", "Competition"],
      isPublic: 1,
    },
    {
      name: "Pre-Season Conditioning",
      description: "6-week high-intensity program to peak athletic performance before season starts. Focus on sport-specific movements and work capacity.",
      category: "Conditioning",
      duration: 6,
      tags: ["Pre-Season", "Conditioning", "Work Capacity", "Sport-Specific"],
      isPublic: 1,
    },
  ];

  const createdTemplates = [];
  for (const template of templates) {
    try {
      const existing = await storage.getProgramTemplates();
      const alreadyExists = existing.some(t => t.name === template.name);
      
      if (!alreadyExists) {
        const created = await storage.createProgramTemplate(template);
        createdTemplates.push(created);
        console.log(`✅ Created template: ${template.name}`);
      } else {
        console.log(`⏭️  Template already exists: ${template.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create template ${template.name}:`, error);
    }
  }

  console.log(`\n🎉 Seeding complete! Created ${createdTemplates.length} new templates.`);
  return createdTemplates;
}
