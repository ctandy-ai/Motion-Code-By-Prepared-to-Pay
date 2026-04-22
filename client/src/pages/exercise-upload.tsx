import { useState } from "react";
import { makeThumbnail } from "../lib/thumbnail";
import { getUploadUrl, uploadToSignedUrl } from "../lib/uploadExercise";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ExerciseUpload() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [exerciseName, setExerciseName] = useState("");
  const [description, setDescription] = useState("");
  const [component, setComponent] = useState("acceleration");
  const [beltLevel, setBeltLevel] = useState("white");
  const [equipment, setEquipment] = useState("");
  const [coachingCues, setCoachingCues] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      setExerciseName(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async () => {
    if (!file || !exerciseName.trim()) {
      setStatus("Please select a file and enter an exercise name");
      return;
    }

    setUploading(true);
    try {
      setStatus("Generating thumbnail...");
      const thumbBlob = await makeThumbnail(file);
      const thumbFile = new File([thumbBlob], `${file.name}.png`, { type: "image/png" });

      setStatus("Getting upload URLs...");
      const [videoRes, thumbRes] = await Promise.all([
        getUploadUrl(file),
        getUploadUrl(thumbFile),
      ]);

      setStatus("Uploading to storage...");
      await uploadToSignedUrl(videoRes.uploadUrl, file);
      await uploadToSignedUrl(thumbRes.uploadUrl, thumbFile);

      const cuesArray = coachingCues
        .split('\n')
        .map(cue => cue.trim())
        .filter(cue => cue.length > 0);

      const exerciseData = {
        name: exerciseName.trim(),
        description: description.trim() || "Custom exercise",
        category: "Plyometric",
        component: component,
        beltLevel: beltLevel,
        duration: "",
        equipment: equipment.trim() || "None",
        coachingCues: cuesArray.length > 0 ? cuesArray : ["Focus on form", "Control the movement"],
        videoUrl: videoRes.objectPath,
        thumbnailUrl: thumbRes.objectPath,
        skillFocus: ["power"],
        progressionLevel: 1,
        complexityRating: 1,
        isCustom: true,
      };

      setStatus("Creating exercise record...");
      const response = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exerciseData),
      });

      if (!response.ok) {
        throw new Error("Failed to create exercise");
      }

      setStatus("✅ Uploaded successfully!");
      
      setTimeout(() => {
        setFile(null);
        setExerciseName("");
        setDescription("");
        setEquipment("");
        setCoachingCues("");
        setStatus("");
        window.location.href = "/exercises";
      }, 2000);

    } catch (error) {
      console.error("Upload error:", error);
      setStatus(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-p2p-dark">
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-p2p-darker border-b border-p2p-border px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4">
              <Upload className="w-8 h-8 text-p2p-electric" />
              <h1 className="font-heading text-5xl font-bold text-white tracking-tight">Upload Exercise</h1>
            </div>
            <p className="text-gray-400 font-body mt-2 text-lg">
              Add a custom exercise video to your library with automatic thumbnail generation
            </p>
          </motion.div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8 md:p-12">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-p2p-darker border-p2p-border rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-p2p-blue/10 to-p2p-electric/10 border-b border-p2p-border">
                <CardTitle className="text-white font-heading text-2xl">Exercise Details</CardTitle>
                <CardDescription className="text-gray-400 font-body">
                  Fill in the exercise information and upload a video
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="video-file" className="text-gray-300 font-body">Video File</Label>
                  <Input
                    id="video-file"
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="cursor-pointer bg-p2p-dark border-p2p-border text-white"
                    data-testid="input-video-file"
                  />
                  {file && (
                    <p className="text-sm text-gray-400">
                      Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exercise-name" className="text-gray-300 font-body">Exercise Name</Label>
                  <Input
                    id="exercise-name"
                    value={exerciseName}
                    onChange={(e) => setExerciseName(e.target.value)}
                    placeholder="e.g., Box Jump Variation"
                    className="bg-p2p-dark border-p2p-border text-white placeholder:text-gray-500"
                    data-testid="input-exercise-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-300 font-body">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the exercise and its benefits..."
                    rows={3}
                    className="bg-p2p-dark border-p2p-border text-white placeholder:text-gray-500"
                    data-testid="input-description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="component" className="text-gray-300 font-body">Movement Component</Label>
                    <Select value={component} onValueChange={setComponent}>
                      <SelectTrigger id="component" className="bg-p2p-dark border-p2p-border text-white" data-testid="select-component">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-p2p-dark border-p2p-border">
                        <SelectItem value="acceleration">Starting (Acceleration)</SelectItem>
                        <SelectItem value="deceleration">Stopping (Deceleration)</SelectItem>
                        <SelectItem value="change-direction">Stepping (Change of Direction)</SelectItem>
                        <SelectItem value="top-speed">Sprinting (Top Speed)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="belt-level" className="text-gray-300 font-body">Belt Level</Label>
                    <Select value={beltLevel} onValueChange={setBeltLevel}>
                      <SelectTrigger id="belt-level" className="bg-p2p-dark border-p2p-border text-white" data-testid="select-belt-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-p2p-dark border-p2p-border">
                        <SelectItem value="white">White Belt (Rudimentary)</SelectItem>
                        <SelectItem value="blue">Blue Belt (Intermediate)</SelectItem>
                        <SelectItem value="black">Black Belt (Advanced)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="equipment" className="text-gray-300 font-body">Equipment</Label>
                  <Input
                    id="equipment"
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    placeholder="e.g., Box, Hurdles, None"
                    className="bg-p2p-dark border-p2p-border text-white placeholder:text-gray-500"
                    data-testid="input-equipment"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coaching-cues" className="text-gray-300 font-body">Coaching Cues (one per line)</Label>
                  <Textarea
                    id="coaching-cues"
                    value={coachingCues}
                    onChange={(e) => setCoachingCues(e.target.value)}
                    placeholder="Land softly on forefoot&#10;Drive knees up&#10;Maintain upright posture"
                    rows={4}
                    className="bg-p2p-dark border-p2p-border text-white placeholder:text-gray-500"
                    data-testid="input-coaching-cues"
                  />
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!file || uploading || !exerciseName.trim()}
                  className="w-full bg-gradient-to-r from-p2p-blue to-p2p-electric hover:shadow-glow text-white font-semibold rounded-full py-6 text-lg"
                  data-testid="button-upload"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-5 w-5" />
                      Upload Exercise Video
                    </>
                  )}
                </Button>

                {status && (
                  <div className={`flex items-center gap-2 p-4 rounded-xl ${
                    status.startsWith('✅') 
                      ? 'bg-green-500/20 border border-green-400/30 text-green-300' 
                      : status.startsWith('❌')
                      ? 'bg-red-500/20 border border-red-400/30 text-red-300'
                      : 'bg-blue-500/20 border border-blue-400/30 text-blue-300'
                  }`}>
                    {status.startsWith('✅') && <CheckCircle2 className="h-5 w-5" />}
                    {status.startsWith('❌') ? (
                      <span className="font-medium">{status}</span>
                    ) : (
                      <span data-testid="status-message">{status}</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
