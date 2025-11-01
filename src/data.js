// /src/data.js
import { db } from "./firebase.js";
import { setApplications, setUnsub } from "./state.js";
import { alertUser } from "./alerts.js";
import { renderAllApplicationSections, renderWishlist } from "./render.js";
import {
  collection, onSnapshot, query, orderBy, doc,
  addDoc, setDoc, deleteDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

let applicationsRef, wishlistRef;

export function initUserCollections(uid, appId) {
  const appsPath = `artifacts/${appId}/users/${uid}/applications`;
  const wlPath = `artifacts/${appId}/users/${uid}/wishlist`;
  applicationsRef = collection(db, appsPath);
  wishlistRef = collection(db, wlPath);
}

export function listenApplications() {
  if (!applicationsRef) return;
  if (typeof setUnsub === "function" && setUnsub.apps) setUnsub("apps", null);
  const qApps = query(applicationsRef, orderBy("uniName", "asc"), orderBy("courseAppliedFor", "asc"));
  const unsub = onSnapshot(
    qApps,
    (snap) => {
      const apps = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setApplications(apps);
      renderAllApplicationSections(apps);
    },
    (err) => alertUser(`Error fetching applications: ${err.message}`, "error")
  );
  setUnsub("apps", unsub);
}

export function listenWishlist() {
  if (!wishlistRef) return;
  if (typeof setUnsub === "function" && setUnsub.wishlist) setUnsub("wishlist", null);
  const qW = query(wishlistRef, orderBy("createdAt", "desc"));
  const unsub = onSnapshot(
    qW,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      renderWishlist(items);
    },
    (err) => alertUser(`Error fetching wishlist: ${err.message}`, "error")
  );
  setUnsub("wishlist", unsub);
}

// CRUD
export async function saveApplication(id, data) {
  const payload = { ...data, updatedAt: serverTimestamp() };
  if (!id) payload.createdAt = serverTimestamp();
  return id
    ? setDoc(doc(applicationsRef, id), payload, { merge: true })
    : addDoc(applicationsRef, payload);
}

export async function removeApplication(id) {
  return deleteDoc(doc(applicationsRef, id));
}

export async function addWishlistItem(name) {
  return addDoc(wishlistRef, { name, researched: false, createdAt: serverTimestamp() });
}

export async function updateWishlistItem(id, researched) {
  return updateDoc(doc(wishlistRef, id), { researched });
}

export async function deleteWishlistItem(id) {
  return deleteDoc(doc(wishlistRef, id));
}
