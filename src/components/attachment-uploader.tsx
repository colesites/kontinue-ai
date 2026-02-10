"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { FaPaperclip } from "react-icons/fa";
import { X, Loader2, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  uploadFile,
  deleteFile,
  formatFileSize,
  getFileTypeEmoji,
  validateFile,
  type UploadedFile,
} from "@/lib/file-upload";
import { cn } from "@/lib/utils";

interface AttachmentUploaderProps {
  chatId: Id<"chats">;
  messageId?: Id<"messages">;
  onFileUploaded?: (fileId: Id<"files">) => void;
  className?: string;
}

export function AttachmentUploader({
  chatId,
  messageId,
  onFileUploaded,
  className,
}: AttachmentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  // Fetch existing files for this chat
  const files = useQuery(api.files.listByChat, { chatId });
  const createFileRecord = useMutation(api.files.createFileRecord);
  const deleteFileRecord = useMutation(api.files.deleteFileRecord);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = event.target.files;
      if (!selectedFiles || selectedFiles.length === 0) return;

      const filesToUpload = Array.from(selectedFiles);

      // Validate all files first
      for (const file of filesToUpload) {
        const error = validateFile(file);
        if (error) {
          toast.error(`${file.name}: ${error}`);
          event.target.value = ""; // Reset input
          return;
        }
      }

      setIsUploading(true);
      setUploadProgress({ current: 0, total: filesToUpload.length });

      try {
        for (let i = 0; i < filesToUpload.length; i++) {
          const file = filesToUpload[i];

          // Upload to Vercel Blob
          const uploadedFile = await uploadFile(file);

          // Save metadata to Convex
          const fileId = await createFileRecord({
            chatId,
            messageId,
            blobUrl: uploadedFile.url,
            pathname: uploadedFile.pathname,
            filename: uploadedFile.filename,
            contentType: uploadedFile.contentType,
            size: uploadedFile.size,
            fileType: "attachment",
          });

          setUploadProgress({ current: i + 1, total: filesToUpload.length });

          onFileUploaded?.(fileId);
        }

        toast.success(
          `Successfully uploaded ${filesToUpload.length} file${filesToUpload.length > 1 ? "s" : ""}`
        );
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to upload file"
        );
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
        event.target.value = ""; // Reset input
      }
    },
    [chatId, messageId, createFileRecord, onFileUploaded]
  );

  const handleDeleteFile = useCallback(
    async (fileId: Id<"files">, pathname: string) => {
      try {
        // Delete from Vercel Blob
        await deleteFile(pathname);

        // Delete record from Convex
        await deleteFileRecord({ fileId });

        toast.success("File deleted successfully");
      } catch (error) {
        console.error("Delete error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to delete file"
        );
      }
    },
    [deleteFileRecord]
  );

  if (files === undefined) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Button */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="file-upload"
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border",
            "bg-background hover:bg-muted transition-colors cursor-pointer",
            "text-sm font-medium text-foreground",
            isUploading && "opacity-50 cursor-not-allowed"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload Files
            </>
          )}
        </label>
        <input
          id="file-upload"
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,application/pdf"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
        />
        {uploadProgress && (
          <span className="text-sm text-muted-foreground">
            {uploadProgress.current} / {uploadProgress.total}
          </span>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">
            Attachments ({files.length})
          </h3>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file._id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 group hover:bg-muted/50 transition-colors"
              >
                {/* File Icon */}
                <span className="text-2xl shrink-0">
                  {getFileTypeEmoji(file.contentType)}
                </span>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {file.filename}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)} •{" "}
                    {file.contentType.split("/")[1].toUpperCase()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* View/Download */}
                  <a
                    href={file.blobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
                    title="View file"
                  >
                    <FaPaperclip className="h-3.5 w-3.5" />
                  </a>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteFile(file._id, file.pathname)}
                    className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                    title="Delete file"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {files.length === 0 && !isUploading && (
        <div className="text-center py-8 px-4 border-2 border-dashed border-border rounded-lg">
          <FaPaperclip className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No attachments yet. Upload files to get started.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Allowed: PNG, JPEG, WebP, PDF (Max 10MB)
          </p>
        </div>
      )}
    </div>
  );
}
