export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  createdTime?: string;
  // Computed properties for UI
  directLink?: string;
}

export interface Album {
  id: string; // Firestore ID
  name: string;
  driveFolderId: string;
  createdByUid: string;
  createdByEmail: string;
  createdAt: string; // ISO string
  coverImageUrl?: string; // Optional cover from first image
}

export interface Selection {
  id?: string;
  albumId: string;
  clientUid: string;
  clientEmail: string;
  fileId: string;
  fileName: string;
  selectedAt: string; // ISO string
}

export enum ViewState {
  SETUP = 'SETUP', // Missing API keys
  LOGIN = 'LOGIN',
  HOME = 'HOME', // Logged in but no album/admin access
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_ALBUM_DETAIL = 'ADMIN_ALBUM_DETAIL',
  CLIENT_ALBUM = 'CLIENT_ALBUM',
}

// Configuration interface (users need to fill this if env vars aren't strictly available)
export interface AppConfig {
  firebaseConfig: any;
  googleDriveApiKey: string;
  adminEmails: string[];
}