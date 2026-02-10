# Vercel Blob Setup & Configuration Guide

## Overview
This guide explains how to set up Vercel Blob for file storage in Continue AI, including environment variables, deployment, and usage.

## Prerequisites
- Vercel account with Blob storage enabled
- Next.js project deployed on Vercel
- Convex database set up

## 1. Environment Variables

### Required Environment Variables

#### `BLOB_READ_WRITE_TOKEN`
Your Vercel Blob read-write token for server-side operations.

**How to get it:**
1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **Blob**
3. Click **Create Store** (if you haven't already)
4. Click on your store name
5. Go to **Settings** → **Tokens**
6. Copy the **Read-Write Token**

### Setting Environment Variables

#### Local Development (.env.local)
Create or update `.env.local` in your project root:

```bash
# Vercel Blob
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_ABC123XYZ...

# Clerk (if not already set)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Convex (if not already set)
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
CONVEX_DEPLOYMENT=...
```

**Important:** Add `.env.local` to your `.gitignore` (should already be there)

#### Vercel Production/Preview
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add `BLOB_READ_WRITE_TOKEN`:
   - **Key:** `BLOB_READ_WRITE_TOKEN`
   - **Value:** Your token from the Blob dashboard
   - **Environments:** Check all (Production, Preview, Development)
4. Click **Save**

**Note:** Vercel automatically provides `BLOB_READ_WRITE_TOKEN` in deployed environments if you have Blob enabled, but it's recommended to set it explicitly.

## 2. Install Dependencies

The `@vercel/blob` package is already in `package.json`. If not, install it:

```bash
bun add @vercel/blob
```

## 3. File Structure

```
continue-ai/
├── convex/
│   ├── schema.ts              # Added 'files' table
│   └── files.ts               # File CRUD operations
├── src/
│   ├── app/
│   │   └── api/
│   │       └── files/
│   │           ├── upload/
│   │           │   └── route.ts    # Upload endpoint
│   │           └── delete/
│   │               └── route.ts    # Delete endpoint
│   ├── components/
│   │   └── attachment-uploader.tsx # UI component
│   └── lib/
│       └── file-upload.ts          # Client helpers
└── .env.local                      # Local env vars
```

## 4. How It Works

### Upload Flow
1. **Client** selects file → validates size/type
2. **Client** calls `/api/files/upload?filename=example.jpg` with file blob
3. **API Route** authenticates user → uploads to Vercel Blob
4. **API Route** returns blob URL and metadata
5. **Client** calls Convex mutation `files:createFileRecord`
6. **Convex** stores metadata in database

### Delete Flow
1. **Client** calls Convex mutation `files:deleteFileRecord`
2. **Convex** verifies ownership → returns pathname
3. **Client** calls `/api/files/delete?pathname=...`
4. **API Route** authenticates → deletes from Blob
5. **Convex** record already deleted

## 5. Usage Examples

### Basic Usage in a Component

```tsx
import { AttachmentUploader } from "@/components/attachment-uploader";
import { Id } from "../../convex/_generated/dataModel";

export function ChatView({ chatId }: { chatId: Id<"chats"> }) {
  return (
    <div>
      <h2>Chat Attachments</h2>
      <AttachmentUploader 
        chatId={chatId}
        onFileUploaded={(fileId) => {
          console.log("File uploaded:", fileId);
        }}
      />
    </div>
  );
}
```

### Manual Upload (without AttachmentUploader)

```tsx
"use client";

import { uploadFile } from "@/lib/file-upload";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function ManualUploader({ chatId }) {
  const createFileRecord = useMutation(api.files.createFileRecord);

  const handleUpload = async (file: File) => {
    try {
      // Upload to Blob
      const uploaded = await uploadFile(file);
      
      // Save to Convex
      const fileId = await createFileRecord({
        chatId,
        blobUrl: uploaded.url,
        pathname: uploaded.pathname,
        filename: uploaded.filename,
        contentType: uploaded.contentType,
        size: uploaded.size,
        fileType: "attachment",
      });
      
      console.log("Success:", fileId);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  return (
    <input
      type="file"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
      }}
    />
  );
}
```

### Querying Files

```tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function FileList({ chatId }: { chatId: Id<"chats"> }) {
  const files = useQuery(api.files.listByChat, { chatId });

  if (files === undefined) return <div>Loading...</div>;

  return (
    <ul>
      {files.map((file) => (
        <li key={file._id}>
          <a href={file.blobUrl} target="_blank">
            {file.filename} ({(file.size / 1024).toFixed(1)} KB)
          </a>
        </li>
      ))}
    </ul>
  );
}
```

## 6. File Constraints

### Maximum File Size
- **10 MB** per file
- Enforced on both client and server

### Allowed File Types
- `image/png` - PNG images
- `image/jpeg` - JPEG/JPG images  
- `image/webp` - WebP images
- `application/pdf` - PDF documents

### Storage Path Structure
Files are stored in Vercel Blob with this path pattern:
```
continue-ai/{userId}/{timestamp}-{filename}
```

Example:
```
continue-ai/user_2abc123def/1704067200000-document.pdf
```

## 7. Security Features

### Authentication
- All API routes require Clerk authentication
- Unauthenticated requests return 401

### Authorization
- Users can only delete their own files
- File ownership verified via pathname check
- Convex enforces owner-based access

### Validation
- File type checked on client and server
- File size limited to 10MB
- Content-Type header validated

## 8. Testing Locally

### 1. Set up environment variables
```bash
# In .env.local
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

### 2. Run development server
```bash
bun run dev
```

### 3. Test upload
```bash
# In your browser console or via component
const file = new File(["test"], "test.txt", { type: "text/plain" });
// This will fail validation (wrong type) - expected!

const image = new File([/* blob */], "test.png", { type: "image/png" });
// This should work
```

## 9. Deployment Checklist

- [ ] `BLOB_READ_WRITE_TOKEN` set in Vercel environment variables
- [ ] Convex schema deployed (`bun run convex:deploy`)
- [ ] Files table created in Convex
- [ ] API routes deployed
- [ ] Test upload in production
- [ ] Test file deletion
- [ ] Check file permissions

## 10. Cost Considerations

### Vercel Blob Pricing (as of 2024)
- **Free Tier:** 500 MB storage, 1 GB bandwidth/month
- **Pro Plan:** $0.15/GB storage, $0.30/GB bandwidth

### Optimization Tips
1. **Compress images** before upload
2. **Delete unused files** regularly
3. **Use appropriate image formats** (WebP > JPEG > PNG for photos)
4. **Consider CDN caching** for frequently accessed files

## 11. Troubleshooting

### Error: "Unauthorized - please sign in"
- **Cause:** Not authenticated with Clerk
- **Solution:** Ensure user is signed in, check Clerk configuration

### Error: "File size exceeds 10MB limit"
- **Cause:** File too large
- **Solution:** Compress or resize file before upload

### Error: "Invalid file type"
- **Cause:** Unsupported file format
- **Solution:** Convert to PNG, JPEG, WebP, or PDF

### Error: "Failed to upload file"
- **Cause:** Missing `BLOB_READ_WRITE_TOKEN` or network error
- **Solution:** 
  1. Check `.env.local` has correct token
  2. Verify Vercel Blob store is created
  3. Check network logs for details

### Files not appearing in list
- **Cause:** Convex record not created or permission issue
- **Solution:**
  1. Check Convex logs
  2. Verify user owns the chat
  3. Refresh Convex dashboard

## 12. Future Enhancements

### Planned Features
- [ ] Image thumbnails
- [ ] Drag-and-drop upload
- [ ] Bulk delete
- [ ] File preview modal
- [ ] Progress indicators
- [ ] Video file support
- [ ] Audio file support

### Advanced Options
- [ ] Signed URLs for temporary access
- [ ] Direct client-to-Blob uploads (presigned URLs)
- [ ] Image optimization/resizing
- [ ] Automatic backups
- [ ] File versioning

## 13. API Reference

### POST /api/files/upload
Upload a file to Vercel Blob

**Query Parameters:**
- `filename` (required) - Name of the file

**Request Body:**
- Binary file data (blob)

**Response (200):**
```json
{
  "url": "https://xyz.public.blob.vercel-storage.com/...",
  "pathname": "continue-ai/user_123/1234567890-file.png",
  "filename": "file.png",
  "contentType": "image/png",
  "size": 12345
}
```

**Errors:**
- `401` - Unauthorized
- `400` - Missing filename, invalid type, or size exceeded
- `500` - Server error

### DELETE /api/files/delete
Delete a file from Vercel Blob

**Query Parameters:**
- `pathname` (required) - Blob pathname to delete

**Response (200):**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Not file owner
- `400` - Missing pathname
- `500` - Server error

## 14. Support & Resources

- **Vercel Blob Docs:** https://vercel.com/docs/storage/vercel-blob
- **Convex Docs:** https://docs.convex.dev
- **Clerk Auth Docs:** https://clerk.com/docs

---

**Last Updated:** Current Date
**Version:** 1.0.0