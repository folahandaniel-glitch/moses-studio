/**
 * Shrinks large photos in the browser before upload so they fit the hosting request limit (about 4 MB).
 * Small files and non-raster formats are returned unchanged.
 */
export async function prepareImage(file: File, limitBytes = 3.5 * 1024 * 1024): Promise<File> {
  if (file.size <= limitBytes || !/^image\/(jpeg|png|webp|avif)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.7, 0.55]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      if (blob && blob.size <= limitBytes) return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
    }
  } catch {
    /* fall through and let the server validate the original */
  }
  return file;
}
