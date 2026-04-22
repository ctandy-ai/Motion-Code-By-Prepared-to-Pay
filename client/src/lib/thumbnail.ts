export async function makeThumbnail(file: File, atSeconds = 0.3): Promise<Blob> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = url;
  video.crossOrigin = "anonymous";
  await new Promise((resolve) => (video.onloadeddata = resolve));

  video.currentTime = atSeconds;
  await new Promise((resolve) => (video.onseeked = resolve));

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  URL.revokeObjectURL(url);
  
  return await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/png")
  );
}
