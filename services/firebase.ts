import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import { FIREBASE_CONFIG, isConfigValid } from "../constants";
import { Album, Selection } from "../types";

// Re-export User type
export type User = firebase.User;

// --- Initialization ---
const initFirebase = () => {
  if (isConfigValid()) {
    try {
      // Check if apps are already initialized to avoid duplicates
      if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
    } catch (error) {
      console.error("Error initializing Firebase:", error);
    }
  }
};

// Initialize immediately
initFirebase();

// Helper to ensure initialized
const ensureInitialized = () => {
  if (!firebase.apps.length) {
    initFirebase();
    if (!firebase.apps.length) {
       throw new Error("Firebase chưa được khởi tạo. Vui lòng kiểm tra constants.ts và tải lại trang.");
    }
  }
  return { auth: firebase.auth(), db: firebase.firestore() };
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
  const { auth } = ensureInitialized();
  await auth.signOut();
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  try {
    const { auth } = ensureInitialized();
    return auth.onAuthStateChanged(callback);
  } catch (e) {
    // If auth isn't ready, return null
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
    // Create new doc ref
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