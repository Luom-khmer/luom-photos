import { GOOGLE_DRIVE_API_KEY, DRIVE_API_BASE } from "../constants";
import { DriveFile } from "../types";

/**
 * Extracts the folder ID from a Google Drive URL or returns the ID if it's already an ID.
 */
export const extractFolderId = (input: string): string | null => {
  // Regex for standard folder links
  const urlRegex = /drive\.google\.com\/.*folders\/([a-zA-Z0-9_-]+)/;
  const match = input.match(urlRegex);
  if (match && match[1]) {
    return match[1];
  }
  // Assume it's an ID if it looks like one (simple length check or alpha-numeric)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(input)) {
    return input;
  }
  return null;
};

/**
 * Lists image files from a public Google Drive folder.
 * Note: The folder MUST be set to "Anyone with the link can view".
 */
export const listDriveFiles = async (folderId: string): Promise<DriveFile[]> => {
  if (!GOOGLE_DRIVE_API_KEY) {
    throw new Error("Google Drive API Key is missing.");
  }

  const query = `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`;
  const fields = "nextPageToken, files(id, name, mimeType, thumbnailLink, createdTime)";
  
  const url = new URL(`${DRIVE_API_BASE}/files`);
  url.searchParams.append("q", query);
  url.searchParams.append("key", GOOGLE_DRIVE_API_KEY);
  url.searchParams.append("fields", fields);
  url.searchParams.append("pageSize", "1000"); // Fetch up to 1000 images

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to fetch files from Drive.");
    }

    const data = await response.json();
    const files = data.files || [];

    // Transform to internal type and fix thumbnails
    return files.map((f: any) => ({
      ...f,
      // Hack: Use lh3.googleusercontent.com to get higher res thumbnails for public files
      // w=800 means width 800px.
      thumbnailLink: `https://lh3.googleusercontent.com/d/${f.id}=w600-h600-p-k-nu-iv1`,
      directLink: `https://drive.google.com/uc?export=download&id=${f.id}`
    }));

  } catch (error) {
    console.error("Drive API Error:", error);
    throw error;
  }
};
