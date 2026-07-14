import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged as fbOnAuthStateChanged,
  createUserWithEmailAndPassword as fbCreateUserWithEmailAndPassword,
  signInWithEmailAndPassword as fbSignInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile as fbUpdateProfile,
  updatePassword as fbUpdatePassword,
  signInWithPopup as fbSignInWithPopup,
  GoogleAuthProvider as fbGoogleAuthProvider
} from "firebase/auth";
import { 
  getFirestore,
  doc as fbDoc,
  getDoc as fbGetDoc,
  setDoc as fbSetDoc,
  deleteDoc as fbDeleteDoc,
  collection as fbCollection,
  getDocs as fbGetDocs,
  updateDoc as fbUpdateDoc
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Detect if Firebase has a valid config or is using the default template placeholder
export const isFirebaseConfigValid = 
  firebaseConfig &&
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.includes("remixed-") &&
  !firebaseConfig.apiKey.includes("YOUR_") &&
  !firebaseConfig.apiKey.includes("placeholder") &&
  firebaseConfig.apiKey.length > 15;

let app: any = null;
let dbInstance: any = null;
let authInstance: any = null;

if (isFirebaseConfigValid) {
  try {
    app = initializeApp(firebaseConfig);
    // Custom databaseId check for named Firestore database in AI Studio/GCP environments
    const dbId = (firebaseConfig as any).firestoreDatabaseId;
    dbInstance = dbId ? getFirestore(app, dbId) : getFirestore(app);
    authInstance = getAuth(app);
    console.log("Real Firebase initialized successfully with database:", dbId || "(default)");
  } catch (err) {
    console.warn("Real Firebase initialization failed, falling back to mock adapter:", err);
    app = null;
    dbInstance = null;
    authInstance = null;
  }
} else {
  console.log("Using Mock Firebase Adapter (No valid firebase-applet-config.json detected).");
}

// --- MOCK IMPLEMENTATIONS ---
class MockDocRef {
  constructor(public collectionPath: string, public docId: string) {}
}

class MockCollectionRef {
  constructor(public collectionPath: string) {}
}

class MockDocumentSnapshot {
  constructor(public id: string, private _data: any) {}
  exists() {
    return !!this._data;
  }
  data() {
    return this._data;
  }
}

class MockQuerySnapshot {
  constructor(public docs: MockDocumentSnapshot[]) {}
  get empty() {
    return this.docs.length === 0;
  }
  forEach(callback: (doc: MockDocumentSnapshot) => void) {
    this.docs.forEach(callback);
  }
}

// Local storage mock helpers
const getLocalCollection = (path: string): Record<string, any> => {
  const stored = localStorage.getItem(`mock_db_${path}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }
  return {};
};

const saveLocalCollection = (path: string, data: Record<string, any>) => {
  localStorage.setItem(`mock_db_${path}`, JSON.stringify(data));
};

// Define local auth session helpers
interface MockUser {
  uid: string;
  email: string;
  displayName?: string;
}

const getMockAuthUser = (): MockUser | null => {
  const stored = localStorage.getItem("mock_auth_user");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
};

const saveMockAuthUser = (user: MockUser | null) => {
  if (user) {
    localStorage.setItem("mock_auth_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("mock_auth_user");
  }
};

const authListeners: Set<(user: any) => void> = new Set();
const triggerAuthListeners = () => {
  const user = getMockAuthUser();
  authListeners.forEach((listener) => listener(user));
};

// Mock Auth service structure
const mockAuth = {
  get currentUser() {
    const user = getMockAuthUser();
    if (!user) return null;
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "",
      emailVerified: true,
      isAnonymous: false,
      providerData: [{ providerId: "password", email: user.email }],
    };
  }
};

const getIsForceMock = () => {
  try {
    if (typeof window === "undefined") return false;
    const isForced = localStorage.getItem("force_mock_auth") === "true";
    if (isForced) {
      // Check if we are inside an iframe
      const isInIframe = window.self !== window.top;
      if (!isInIframe) {
        // Not in an iframe (e.g. running in a new browser tab) -> ignore force_mock_auth so they get the real Firebase popup!
        return false;
      }
    }
    return isForced;
  } catch {
    return false;
  }
};

export const useRealAuth = isFirebaseConfigValid && authInstance && !getIsForceMock();
export const useRealDb = isFirebaseConfigValid && dbInstance && !getIsForceMock();

export const auth = useRealAuth ? authInstance : mockAuth;
export const db = useRealDb ? dbInstance : { isMock: true };
export const isFirebaseMock = !(isFirebaseConfigValid && authInstance && dbInstance) || getIsForceMock();

// --- WRAPPED FIREBASE METHODS ---

export function onAuthStateChanged(authObj: any, callback: (user: any) => void) {
  if (useRealAuth) {
    return fbOnAuthStateChanged(authObj, callback);
  } else {
    authListeners.add(callback);
    // Fire initially
    const initialUser = mockAuth.currentUser;
    setTimeout(() => callback(initialUser), 0);
    return () => {
      authListeners.delete(callback);
    };
  }
}

export async function createUserWithEmailAndPassword(authObj: any, email: string, password: string) {
  if (useRealAuth) {
    return fbCreateUserWithEmailAndPassword(authObj, email, password);
  } else {
    const users = getLocalCollection("users");
    const emailLower = email.toLowerCase().trim();
    
    // Check if user already exists
    const exists = Object.values(users).some((u: any) => u.email === emailLower);
    if (exists) {
      throw new Error("Firebase: Error (auth/email-already-in-use).");
    }

    const uid = "mock_uid_" + Math.random().toString(36).substring(2, 11);
    const mockUser: MockUser = {
      uid,
      email: emailLower,
      displayName: ""
    };

    saveMockAuthUser(mockUser);
    triggerAuthListeners();

    return {
      user: {
        uid,
        email: emailLower,
        displayName: "",
        get providerData() { return [{ providerId: "password", email: emailLower }]; }
      }
    };
  }
}

export async function signInWithEmailAndPassword(authObj: any, email: string, password: string) {
  if (useRealAuth) {
    return fbSignInWithEmailAndPassword(authObj, email, password);
  } else {
    const emailLower = email.toLowerCase().trim();
    // For admin credentials, always allow signing in/up
    const isAdmin = (emailLower === "swapnilacharjee2003@gmail.com" || emailLower === "2023100000622@seu.edu.bd") && password === "Rituraj@26541";
    
    const users = getLocalCollection("users");
    let foundUser = Object.values(users).find((u: any) => u.email === emailLower);

    if (!foundUser && isAdmin) {
      // Auto register admin if not exists in local mock DB
      const uid = emailLower === "swapnilacharjee2003@gmail.com" ? "mock_admin_uid_2003" : "mock_admin_uid_622";
      foundUser = {
        uid,
        name: emailLower === "swapnilacharjee2003@gmail.com" ? "Swapnil Acharjee" : "Seu Admin",
        email: emailLower,
        role: "System Administrator"
      };
      users[uid] = foundUser;
      saveLocalCollection("users", users);
    }

    if (!foundUser) {
      throw new Error("Firebase: Error (auth/user-not-found).");
    }

    const mockUser: MockUser = {
      uid: foundUser.uid,
      email: emailLower,
      displayName: foundUser.name || "Swapnil Acharjee"
    };

    saveMockAuthUser(mockUser);
    triggerAuthListeners();

    return {
      user: {
        uid: foundUser.uid,
        email: emailLower,
        displayName: foundUser.name || "Swapnil Acharjee",
        get providerData() { return [{ providerId: "password", email: emailLower }]; }
      }
    };
  }
}

export async function signOut(authObj: any) {
  if (useRealAuth) {
    return fbSignOut(authObj);
  } else {
    saveMockAuthUser(null);
    triggerAuthListeners();
  }
}

export async function updateProfile(userObj: any, profile: { displayName?: string }) {
  if (useRealAuth) {
    return fbUpdateProfile(userObj, profile);
  } else {
    const user = getMockAuthUser();
    if (user) {
      user.displayName = profile.displayName;
      saveMockAuthUser(user);
      
      // Update in local users collection as well
      const users = getLocalCollection("users");
      if (users[user.uid]) {
        users[user.uid].name = profile.displayName;
        saveLocalCollection("users", users);
      }
    }
  }
}

export async function updatePassword(userObj: any, password: string) {
  if (useRealAuth) {
    return fbUpdatePassword(userObj, password);
  } else {
    console.log("Mock password update completed.");
  }
}

export async function signInWithGoogle(authObj: any, customEmail?: string, customName?: string) {
  if (useRealAuth && !customEmail) {
    const provider = new fbGoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account"
    });
    return fbSignInWithPopup(authObj, provider);
  } else {
    // Mock login/signup with Google using user-provided valid Gmail if available
    const email = (customEmail || ("google_user_" + Math.random().toString(36).substring(2, 7) + "@gmail.com")).toLowerCase().trim();
    const displayName = customName || ("Google User " + Math.random().toString(36).substring(2, 5).toUpperCase());
    // Create a stable UID based on the email so we don't generate duplicate random profiles for the same Gmail
    const uid = "mock_google_" + email.replace(/[^a-zA-Z0-9]/g, "_");
    
    const mockUser: MockUser = {
      uid,
      email,
      displayName
    };

    saveMockAuthUser(mockUser);
    triggerAuthListeners();

    // Save user profile in mock DB
    const users = getLocalCollection("users");
    const isEmailAdmin = email === "swapnilacharjee2003@gmail.com" || email === "2023100000622@seu.edu.bd";
    const existingRole = users[uid]?.role || (isEmailAdmin ? "System Administrator" : "Customer");
    users[uid] = {
      uid,
      name: displayName,
      email,
      role: existingRole
    };
    saveLocalCollection("users", users);

    return {
      user: {
        uid,
        email,
        displayName,
        get providerData() { return [{ providerId: "google.com", email }]; }
      }
    };
  }
}

// --- FIRESTORE WRAPPED METHODS ---

export function doc(dbObj: any, collectionPath: string, docId: string) {
  if (useRealDb) {
    return fbDoc(dbObj, collectionPath, docId);
  } else {
    return new MockDocRef(collectionPath, docId);
  }
}

export function collection(dbObj: any, collectionPath: string) {
  if (useRealDb) {
    return fbCollection(dbObj, collectionPath);
  } else {
    return new MockCollectionRef(collectionPath);
  }
}

export async function getDoc(docRef: any) {
  if (useRealDb) {
    return fbGetDoc(docRef);
  } else {
    const ref = docRef as MockDocRef;
    const items = getLocalCollection(ref.collectionPath);
    const data = items[ref.docId] || null;
    return new MockDocumentSnapshot(ref.docId, data);
  }
}

export async function setDoc(docRef: any, data: any) {
  if (useRealDb) {
    return fbSetDoc(docRef, data);
  } else {
    const ref = docRef as MockDocRef;
    const items = getLocalCollection(ref.collectionPath);
    items[ref.docId] = { ...data, id: ref.docId };
    saveLocalCollection(ref.collectionPath, items);
  }
}

export async function updateDoc(docRef: any, data: any) {
  if (useRealDb) {
    return fbUpdateDoc(docRef, data);
  } else {
    const ref = docRef as MockDocRef;
    const items = getLocalCollection(ref.collectionPath);
    if (items[ref.docId]) {
      items[ref.docId] = { ...items[ref.docId], ...data };
      saveLocalCollection(ref.collectionPath, items);
    }
  }
}

export async function deleteDoc(docRef: any) {
  if (useRealDb) {
    return fbDeleteDoc(docRef);
  } else {
    const ref = docRef as MockDocRef;
    const items = getLocalCollection(ref.collectionPath);
    delete items[ref.docId];
    saveLocalCollection(ref.collectionPath, items);
  }
}

export async function getDocs(collectionRef: any) {
  if (useRealDb) {
    return fbGetDocs(collectionRef);
  } else {
    const ref = collectionRef as MockCollectionRef;
    const items = getLocalCollection(ref.collectionPath);
    const docs = Object.entries(items).map(([id, val]) => new MockDocumentSnapshot(id, val));
    return new MockQuerySnapshot(docs);
  }
}
