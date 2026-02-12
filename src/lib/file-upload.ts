/**
 * Client-side helper functions for file uploads to Vercel Blob
 */

export interface UploadedFile {
  url: string;
  pathname: string;
  filename: string;
  contentType: string;
  size: number;
}

export interface UploadError {
  error: string;
  details?: string;
  allowedTypes?: string[];
}

/**
 * Upload a file to Vercel Blob via our API
 * @param file - The file to upload
 * @returns Promise with uploaded file metadata
 */
export async function uploadFile(file: File): Promise<UploadedFile> {
  // Validate file size on client (5MB max)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error("File size exceeds 5MB limit");
  }

  // Validate file type on client
  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
    "application/json",
    "application/xml",
    "text/xml",
    "application/x-yaml",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "audio/mpeg",
    "audio/mp4",
    "audio/aac",
    "audio/wav",
    "audio/ogg",
    "audio/webm",
    "audio/flac",
  ];
  const isText = file.type.startsWith("text/");
  if (!isText && !allowedTypes.includes(file.type)) {
    throw new Error(
      "Invalid file type. Allowed: images, PDF, MP4, WebM, MOV, MP3, M4A, AAC, WAV, OGG, FLAC, and text files"
    );
  }

  try {
    const response = await fetch(
      `/api/files/upload?filename=${encodeURIComponent(file.name)}`,
      {
        method: "POST",
        body: file,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Upload failed");
    }

    return data as UploadedFile;
  } catch (error) {
    console.error("File upload error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to upload file");
  }
}

/**
 * Upload multiple files in parallel
 * @param files - Array of files to upload
 * @param onProgress - Optional callback for progress updates
 * @returns Promise with array of uploaded file metadata
 */
export async function uploadFiles(
  files: File[],
  onProgress?: (completed: number, total: number) => void
): Promise<UploadedFile[]> {
  const results: UploadedFile[] = [];
  let completed = 0;

  for (const file of files) {
    try {
      const result = await uploadFile(file);
      results.push(result);
      completed++;
      onProgress?.(completed, files.length);
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
      throw error;
    }
  }

  return results;
}

/**
 * Delete a file from Vercel Blob via our API
 * @param pathname - The blob pathname to delete
 * @returns Promise that resolves when file is deleted
 */
export async function deleteFile(pathname: string): Promise<void> {
  try {
    const response = await fetch(
      `/api/files/delete?pathname=${encodeURIComponent(pathname)}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Delete failed");
    }
  } catch (error) {
    console.error("File deletion error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to delete file");
  }
}

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Get file type emoji based on content type
 * @param contentType - MIME type of the file
 * @returns Emoji string
 */
export function getFileTypeEmoji(contentType: string): string {
  if (contentType.startsWith("image/")) return "🖼️";
  if (contentType.startsWith("video/")) return "🎥";
  if (contentType.startsWith("audio/")) return "🎵";
  if (contentType === "application/pdf") return "📄";
  return "📎";
}

/**
 * Validate file before upload
 * @param file - File to validate
 * @returns Error message if invalid, null if valid
 */
export function validateFile(file: File): string | null {
  const MAX_SIZE = 5 * 1024 * 1024;
  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
    "application/json",
    "application/xml",
    "text/xml",
    "application/x-yaml",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "audio/mpeg",
    "audio/mp4",
    "audio/aac",
    "audio/wav",
    "audio/ogg",
    "audio/webm",
    "audio/flac",
  ];

  if (file.size > MAX_SIZE) {
    return "File size exceeds 5MB limit";
  }

  const isText = file.type.startsWith("text/");
  if (!isText && !allowedTypes.includes(file.type)) {
    return "Invalid file type. Allowed: images, PDF, MP4, WebM, MOV, MP3, M4A, AAC, WAV, OGG, FLAC, and text files";
  }

  return null;
}
