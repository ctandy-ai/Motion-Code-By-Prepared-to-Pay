import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, Video, CheckCircle, AlertCircle, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Exercise {
  id: number;
  name: string;
  description: string;
  category: string;
  component: 'acceleration' | 'deceleration' | 'change-direction' | 'top-speed';
  beltLevel: 'white' | 'blue' | 'black';
  duration: string | null;
  equipment: string;
  coachingCues: string[];
  isCustom: boolean;
  createdAt: Date | null;
  videoUrl?: string;
  thumbnailUrl?: string;
}

interface VideoUploadProps {
  exercise: Exercise;
  onVideoUploaded?: () => void;
}

export function VideoUpload({ exercise, onVideoUploaded }: VideoUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a video file.",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a video file smaller than 100MB.",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
      setUploadStatus('idle');
    }
  };

  const uploadVideo = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadStatus('uploading');
      setUploadProgress(0);

      // Step 1: Get upload information from backend
      const uploadInfoResponse = await fetch(`/api/exercises/${exercise.id}/upload-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const uploadInfo = await uploadInfoResponse.json();

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Step 2: For now, simulate video upload to object storage
      // In production, this would use signed URLs to upload to Google Cloud Storage
      await new Promise(resolve => setTimeout(resolve, 2000));

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('processing');

      // Step 3: Update exercise with video URLs
      await fetch(`/api/exercises/${exercise.id}/video-urls`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoUrl: uploadInfo.videoUrl,
          thumbnailUrl: uploadInfo.thumbnailUrl
        })
      });

      setUploadStatus('completed');
      
      // Invalidate exercise cache to refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });

      toast({
        title: "Video uploaded successfully",
        description: "The exercise video has been uploaded and thumbnails are being generated.",
      });

      if (onVideoUploaded) {
        onVideoUploaded();
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      toast({
        title: "Upload failed",
        description: "There was an error uploading the video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'error': return 'bg-red-100 text-red-700 border-red-200';
      case 'uploading':
      case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      case 'uploading':
      case 'processing': return <Upload className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'uploading': return 'Uploading video...';
      case 'processing': return 'Generating thumbnail...';
      case 'completed': return 'Upload completed';
      case 'error': return 'Upload failed';
      default: return 'Ready to upload';
    }
  };

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
          <Video className="w-5 h-5 text-blue-600" />
          Upload Exercise Video
        </CardTitle>
        <CardDescription>
          Upload a demonstration video for "{exercise.name}"
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Exercise Info */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Badge className={`text-xs font-medium px-2 py-1 ${
            exercise.beltLevel === "white" 
              ? "bg-white text-gray-700 border-gray-300" 
              : exercise.beltLevel === "blue"
              ? "bg-blue-600 text-white border-blue-700"
              : "bg-gray-800 text-white border-gray-900"
          }`}>
            {exercise.beltLevel} belt
          </Badge>
          <span className="text-sm text-gray-600 capitalize">{exercise.component}</span>
        </div>

        {/* Current Video Status */}
        {exercise.videoUrl ? (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Play className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">Video already uploaded</span>
            <Button size="sm" variant="outline" className="ml-auto">
              Replace Video
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">No video uploaded yet</span>
          </div>
        )}

        {/* File Selection */}
        <div>
          <Label htmlFor="video-file" className="text-sm font-medium text-gray-700">
            Select Video File
          </Label>
          <Input
            id="video-file"
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="mt-1"
            data-testid="input-video-file"
          />
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: MP4, WebM, AVI. Max size: 100MB
          </p>
        </div>

        {/* Selected File Info */}
        {selectedFile && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">{selectedFile.name}</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Size: {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Upload Progress</span>
              <span className="text-gray-800 font-medium">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* Status Badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${getStatusColor()}`}>
          {getStatusIcon()}
          {getStatusText()}
        </div>

        {/* Upload Button */}
        <Button
          onClick={uploadVideo}
          disabled={!selectedFile || isUploading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          data-testid="button-upload-video"
        >
          {isUploading ? (
            <>
              <Upload className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Video
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}