import express from "express";
import { requireAuth } from "./auth";
import { ObjectStorageService } from "./objectStorage";

export const uploadRouter = express.Router();

uploadRouter.post("/url", requireAuth, async (req: any, res) => {
  try {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    
    return res.json({ 
      uploadUrl: uploadURL,
      objectPath: objectStorageService.normalizeObjectEntityPath(uploadURL)
    });
  } catch (err) {
    console.error("Upload URL error", err);
    res.status(500).json({ error: "Failed to create upload URL" });
  }
});
