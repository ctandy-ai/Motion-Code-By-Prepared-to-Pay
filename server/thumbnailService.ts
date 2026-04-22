import ffmpeg from 'fluent-ffmpeg';
import { ObjectStorageService, objectStorageClient } from './objectStorage';
// Removed parseObjectPath import as it's not available
import { Readable } from 'stream';

export class ThumbnailService {
  private objectStorageService: ObjectStorageService;

  constructor() {
    this.objectStorageService = new ObjectStorageService();
  }

  /**
   * Generate thumbnail from video's first frame
   * @param videoPath - Path to the video file (e.g., "starting/white-belt/video-name.mp4")
   * @returns Stream of thumbnail image data
   */
  async generateThumbnailFromVideo(videoPath: string): Promise<Buffer | null> {
    try {
      // Find the video file
      const videoFile = await this.objectStorageService.searchPublicObject(videoPath);
      if (!videoFile) {
        console.log(`Video not found: ${videoPath}`);
        return null;
      }

      // Get video stream
      const videoStream = videoFile.createReadStream();
      
      // Create thumbnail using ffmpeg
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        
        ffmpeg(videoStream)
          .inputFormat('mp4')
          .outputFormat('image2')
          .outputOptions([
            '-vframes', '1',  // Extract only 1 frame
            '-f', 'image2',   // Output as image
            '-vcodec', 'mjpeg', // Use MJPEG codec for JPEG output
            '-q:v', '2'       // High quality (low number = high quality)
          ])
          .on('error', (err) => {
            console.error('FFmpeg error:', err);
            resolve(null);
          })
          .on('end', () => {
            const thumbnail = Buffer.concat(chunks);
            resolve(thumbnail.length > 0 ? thumbnail : null);
          })
          .pipe()
          .on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });
      });
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return null;
    }
  }

  /**
   * Generate video URL based on exercise data
   */
  generateVideoUrl(component: string, beltLevel: string, exerciseName: string): string {
    const componentFolders = {
      'acceleration': 'starting',
      'deceleration': 'stopping', 
      'change-direction': 'stepping',
      'top-speed': 'sprinting'
    };
    
    const folder = componentFolders[component as keyof typeof componentFolders] || component;
    const fileName = exerciseName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${folder}/${beltLevel}-belt/${fileName}.mp4`;
  }

  /**
   * Get video URL for serving via API
   */
  getVideoApiUrl(component: string, beltLevel: string, exerciseName: string): string {
    const videoPath = this.generateVideoUrl(component, beltLevel, exerciseName);
    return `/public-objects/${videoPath}`;
  }

  /**
   * Get thumbnail URL for serving via API
   */
  getThumbnailApiUrl(component: string, beltLevel: string, exerciseName: string): string {
    const exerciseId = `${component}-${beltLevel}-${exerciseName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    return `/api/thumbnails/${exerciseId}`;
  }
}