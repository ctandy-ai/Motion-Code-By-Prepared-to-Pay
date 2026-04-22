import { Client } from "@replit/object-storage";
import fs from "fs";
import path from "path";
import { db } from "./db";
import { exercises } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const client = new Client();

// Video mapping: filename -> exercise name pattern
const videoMapping: Record<string, string[]> = {
  "Hurdle Jumps_1760011407667.MOV": ["Hurdle Jumps"],
  "Lateral Hops - High Amp_1760011335392.MOV": ["Lateral Hops", "Amplitude"],
  "Lizard leaps_1760011257332.mp4": ["Lizard Leaps"],
  "Standing Double Hop_1760011201395.MOV": ["Standing Double Hop", "Standing Double Leg Hop"],
  "Standing Triple Jump_1760003018579.MOV": ["Standing Triple Jump"],
  "Switching with hands on hips_1758201438654.mp4": ["Switching"],
  "Speed Hops_1760002290806.mp4": ["Speed Hops"],
  "SHH_1760003103010.MOV": ["SHH"],
};

async function uploadVideos() {
  const attachedAssetsDir = path.join(process.cwd(), "attached_assets");
  
  console.log("Starting video upload to object storage...");
  
  for (const [filename, patterns] of Object.entries(videoMapping)) {
    const filePath = path.join(attachedAssetsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filename}`);
      continue;
    }
    
    try {
      // Read file
      const fileBuffer = fs.readFileSync(filePath);
      const objectKey = `videos/${filename}`;
      
      // Upload to object storage
      console.log(`📤 Uploading ${filename}...`);
      await client.uploadFromBytes(objectKey, fileBuffer);
      
      // Get the public URL
      const publicUrl = `/objects/${objectKey}`;
      console.log(`✅ Uploaded to: ${publicUrl}`);
      
      // Update database records
      for (const pattern of patterns) {
        const result = await db
          .update(exercises)
          .set({ videoUrl: publicUrl })
          .where(sql`${exercises.name} ILIKE ${`%${pattern}%`}`)
          .returning({ id: exercises.id, name: exercises.name });
        
        if (result.length > 0) {
          console.log(`   📝 Updated ${result.length} exercise(s) matching "${pattern}":`, result.map(r => r.name).join(", "));
        }
      }
      
    } catch (error) {
      console.error(`❌ Error uploading ${filename}:`, error);
    }
  }
  
  console.log("\n✨ Video upload complete!");
  process.exit(0);
}

uploadVideos().catch(console.error);
