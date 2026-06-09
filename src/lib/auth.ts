import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";
import { AppUser, UserRole } from "@/types";

function setSessionCookie(uid: string) {
  document.cookie = `session=${uid}; path=/; max-age=604800; SameSite=Lax`;
}

export function clearSessionCookie() {
  document.cookie = "session=; path=/; max-age=0";
}

export async function registerUser(
  email: string,
  password: string,
  displayName: string,
  role: UserRole = "member",
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await setDoc(doc(db, "users", cred.user.uid), {
    uid: cred.user.uid,
    email,
    displayName,
    photoURL: null,
    role,
    teamId: null,
    createdAt: serverTimestamp(),
  });
  setSessionCookie(cred.user.uid);
  return cred.user;
}

export async function loginUser(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  setSessionCookie(cred.user.uid);
  return cred.user;
}

export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  const snap = await getDoc(doc(db, "users", cred.user.uid));
  if (!snap.exists()) {
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: cred.user.displayName,
      photoURL: cred.user.photoURL,
      role: "member",
      teamId: null,
      createdAt: serverTimestamp(),
    });
  }
  setSessionCookie(cred.user.uid);
  return cred.user;
}

export async function logoutUser() {
  await signOut(auth);
  clearSessionCookie();
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as AppUser;
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
