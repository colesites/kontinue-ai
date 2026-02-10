import { auth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
];

export async function POST(request: Request) {
  try {
    // Check authentication
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in" },
        { status: 401 }
      );
    }

    // Get filename from query params
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }

    // Get the file from the request body
    const blob = await request.blob();

    // Validate file size
    if (blob.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Validate content type
    const contentType = blob.type;
    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Allowed: PNG, JPEG, WebP, PDF",
          allowedTypes: ALLOWED_TYPES,
        },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    // Store in user-specific folder for better organization
    const blobPath = `continue-ai/${userId}/${Date.now()}-${filename}`;

    const result = await put(blobPath, blob, {
      access: "public",
      contentType,
    });

    // Return the blob info
    return NextResponse.json({
      url: result.url,
      pathname: result.pathname,
      filename,
      contentType,
      size: blob.size,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
