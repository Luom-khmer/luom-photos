import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import { FIREBASE_CONFIG, isConfigValid } from "../constants";
import { Album, Selection } from "../types";

// Re-export User type to be compatible with App.tsx
export type User = firebase.User;

// Singleton instances
let app: firebase.app.App | undefined;
let auth: firebase.auth.Auth | undefined;
let db: firebase.firestore.Firestore | undefined;

// --- Initialization ---
if (isConfigValid()) {
  try {
    // Check if app is already initialized to avoid "App already exists" error
    // In v8/compat, firebase.apps is an array of initialized apps
    if (!firebase.apps.length) {
      app = firebase.initializeApp(FIREBASE_CONFIG);
    } else {
      app = firebase.app();
    }
    
    // Initialize services
    if (app) {
      auth = firebase.auth();
      db = firebase.firestore();
    }
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
}

// Helper to ensure Firebase is initialized
const ensureInitialized = () => {
  if (!auth || !db) {
    // Try to recover if globally initialized but local references are missing
    if (firebase.apps.length) {
       auth = firebase.auth();
       db = firebase.firestore();
       return { auth, db };
    }
    throw new Error("Firebase chưa được khởi tạo. Vui lòng kiểm tra constants.ts và tải lại trang.");
  }
  return { auth, db };
};

// --- Authentication ---

export const loginWithGoogle = async () => {
  const { auth } = ensureInitialized();
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await auth.signInWithPopup(provider);
    return result.user;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const logoutUser = async () => {
  // If not initialized, nothing to logout
  if (!firebase.apps.length) return;
  const { auth } = ensureInitialized();
  if (auth) {
      await auth.signOut();
  }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  if (!firebase.apps.length) {
    callback(null);
    return () => {};
  }
  
  try {
      const { auth } = ensureInitialized();
      return auth.onAuthStateChanged(callback);
  } catch (e) {
      callback(null);
      return () => {};
  }
};

// --- Firestore Operations ---

// Albums
export const createAlbumInDb = async (album: Omit<Album, 'id'>) => {
  const { db } = ensureInitialized();
  const docRef = await db.collection("albums").add({
    ...album,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const getAlbums = async () => {
  try {
    const { db } = ensureInitialized();
    const snapshot = await db.collection("albums").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album));
  } catch (e) {
    console.error("Error getting albums:", e);
    return [];
  }
};

export const getAlbumById = async (albumId: string): Promise<Album | null> => {
  try {
    const { db } = ensureInitialized();
    const docRef = db.collection("albums").doc(albumId);
    const snap = await docRef.get();
    if (snap.exists) {
      return { id: snap.id, ...snap.data() } as Album;
    }
    return null;
  } catch (e) {
     console.error("Error getting album:", e);
    return null;
  }
};

// Selections
export const saveClientSelections = async (selections: Omit<Selection, 'id' | 'selectedAt'>[]) => {
  const { db } = ensureInitialized();
  const batch = db.batch();
  
  selections.forEach(sel => {
    // Create a reference with auto-generated ID
    const docRef = db.collection("selections").doc();
    batch.set(docRef, {
      ...sel,
      selectedAt: new Date().toISOString()
    });
  });

  await batch.commit();
};

export const getSelectionsForAlbum = async (albumId: string): Promise<Selection[]> => {
  try {
    const { db } = ensureInitialized();
    const snapshot = await db.collection("selections").where("albumId", "==", albumId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Selection));
  } catch (e) {
    console.error("Error getting selections:", e);
    return [];
  }
};

export const getClientSelectionsForAlbum = async (albumId: string, email: string): Promise<Selection[]> => {
  try {
    const { db } = ensureInitialized();
    const snapshot = await db.collection("selections")
      .where("albumId", "==", albumId)
      .where("clientEmail", "==", email)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Selection));
  } catch (e) {
    console.error("Error getting client selections:", e);
    return [];
  }
};